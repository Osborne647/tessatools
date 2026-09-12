export function encodeBase64(text: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const out = btoa(binary);
  return urlSafe ? toUrlSafe(out) : out;
}

export function decodeBase64(text: string): string | null {
  try {
    const binary = atob(normalize(text));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function encodeBytes(bytes: Uint8Array, urlSafe = false): string {
  let binary = "";
  // Chunked to avoid blowing the argument limit on String.fromCharCode with
  // large files.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const out = btoa(binary);
  return urlSafe ? toUrlSafe(out) : out;
}

export const byteLength = (text: string) => new TextEncoder().encode(text).length;

export function diagnose(text: string): string | null {
  const cleaned = text.replace(/\s+/g, "");
  if (!cleaned) return null;
  if (/[^A-Za-z0-9+/\-_=]/.test(cleaned)) return "contains characters that are not valid Base64";
  if (cleaned.replace(/=+$/, "").length % 4 === 1) return "is the wrong length — it looks truncated";
  return "is not valid UTF-8 once decoded";
}

const toUrlSafe = (s: string) => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function normalize(text: string) {
  let s = text.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  // Restore padding that URL-safe encoders strip.
  if (s.length % 4) s += "=".repeat(4 - (s.length % 4));
  return s;
}