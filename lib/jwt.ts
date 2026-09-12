export type Segment = { raw: string; json: unknown; text: string };

export type ClaimNote = {
  key: string;
  label: string;
  detail: string;
  state: "ok" | "warn" | "bad" | "info";
};

export type DecodedJwt = {
  header: Segment;
  payload: Segment;
  signature: string;
  algorithm: string | null;
  type: string | null;
  keyId: string | null;
  claims: ClaimNote[];
  expired: boolean | null;
  notYetValid: boolean;
  error: string | null;
};

export function decodeSegment(part: string): string {
  let s = part.replace(/-/g, "+").replace(/_/g, "/");
  if (s.length % 4) s += "=".repeat(4 - (s.length % 4));

  const binary = atob(s);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function decodeJwt(token: string, now = Date.now()): DecodedJwt | { error: string } {
  const t = token.trim().replace(/^Bearer\s+/i, "");
  if (!t) return { error: "Paste a token to decode it" };

  const parts = t.split(".");
  if (parts.length === 1) {
    return { error: "That is not a JWT — a JWT has three parts separated by dots" };
  }
  if (parts.length !== 3) {
    return {
      error:
        parts.length === 2
          ? "This token has only two parts. An unsigned JWT still needs a trailing dot."
          : `A JWT has three dot-separated parts, this one has ${parts.length}`,
    };
  }

  let header: Segment;
  let payload: Segment;

  try {
    header = readSegment(parts[0]);
  } catch {
    return { error: "The header is not valid base64url-encoded JSON" };
  }
  try {
    payload = readSegment(parts[1]);
  } catch {
    return { error: "The payload is not valid base64url-encoded JSON" };
  }

  const h = (header.json ?? {}) as Record<string, unknown>;
  const p = (payload.json ?? {}) as Record<string, unknown>;

  const exp = numeric(p.exp);
  const nbf = numeric(p.nbf);
  const nowSec = Math.floor(now / 1000);

  return {
    header,
    payload,
    signature: parts[2],
    algorithm: typeof h.alg === "string" ? h.alg : null,
    type: typeof h.typ === "string" ? h.typ : null,
    keyId: typeof h.kid === "string" ? h.kid : null,
    claims: describeClaims(p, nowSec),
    expired: exp === null ? null : exp <= nowSec,
    notYetValid: nbf !== null && nbf > nowSec,
    error: null,
  };
}

export async function verifyHmac(
  token: string,
  secret: string,
): Promise<{ ok: boolean; reason: string }> {
  const t = token.trim().replace(/^Bearer\s+/i, "");
  const parts = t.split(".");
  if (parts.length !== 3) return { ok: false, reason: "token is not well-formed" };

  let alg: string | undefined;
  try {
    alg = JSON.parse(decodeSegment(parts[0])).alg;
  } catch {
    return { ok: false, reason: "unreadable header" };
  }

  const hash = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" }[alg ?? ""];
  if (!hash) return { ok: false, reason: `${alg} is not a symmetric algorithm` };
  if (!secret) return { ok: false, reason: "enter the shared secret" };

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash },
    false,
    ["sign"],
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );

  const expected = base64url(new Uint8Array(signed));
  return expected === parts[2]
    ? { ok: true, reason: "signature matches this secret" }
    : { ok: false, reason: "signature does not match this secret" };
}

export function algorithmWarning(alg: string | null): string | null {
  if (!alg) return "The header declares no algorithm, which is not valid.";
  if (alg.toLowerCase() === "none") {
    return 'alg is "none": this token is unsigned and anyone can forge one. Reject it server-side.';
  }
  if (alg.startsWith("HS")) {
    return "Symmetric algorithm: whoever can verify this token can also mint new ones.";
  }
  return null;
}


function readSegment(part: string): Segment {
  const text = decodeSegment(part);
  const json = JSON.parse(text);
  return { raw: part, json, text: JSON.stringify(json, null, 2) };
}

function numeric(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const REGISTERED: Record<string, string> = {
  iss: "issuer",
  sub: "subject",
  aud: "audience",
  exp: "expires",
  nbf: "not before",
  iat: "issued at",
  jti: "token id",
};

function describeClaims(p: Record<string, unknown>, nowSec: number): ClaimNote[] {
  const notes: ClaimNote[] = [];

  for (const key of ["iss", "sub", "aud", "jti"]) {
    const v = p[key];
    if (v === undefined) continue;
    notes.push({
      key,
      label: REGISTERED[key],
      detail: Array.isArray(v) ? v.join(", ") : String(v),
      state: "info",
    });
  }

  for (const key of ["iat", "nbf", "exp"]) {
    const n = numeric(p[key]);
    if (n === null) continue;

    const when = new Date(n * 1000).toISOString().replace("T", " ").slice(0, 19);
    let state: ClaimNote["state"] = "info";
    let detail = `${when} UTC`;

    if (key === "exp") {
      const remaining = n - nowSec;
      state = remaining <= 0 ? "bad" : remaining < 300 ? "warn" : "ok";
      detail = `${when} UTC · ${remaining <= 0 ? `expired ${humanize(-remaining)} ago` : `in ${humanize(remaining)}`}`;
    }
    if (key === "nbf" && n > nowSec) {
      state = "warn";
      detail = `${when} UTC · not valid for another ${humanize(n - nowSec)}`;
    }
    if (key === "iat") {
      detail = `${when} UTC · ${humanize(Math.max(0, nowSec - n))} ago`;
    }

    notes.push({ key, label: REGISTERED[key], detail, state });
  }

  const known = new Set(Object.keys(REGISTERED));
  const custom = Object.keys(p).filter((k) => !known.has(k));
  if (custom.length) {
    notes.push({
      key: "custom",
      label: `${custom.length} custom claim${custom.length === 1 ? "" : "s"}`,
      detail: custom.join(", "),
      state: "info",
    });
  }

  return notes;
}

function humanize(seconds: number): string {
  const s = Math.abs(Math.round(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 2592000) return `${Math.round(s / 86400)}d`;
  if (s < 31536000) return `${Math.round(s / 2592000)} months`;
  return `${(s / 31536000).toFixed(1)} years`;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
