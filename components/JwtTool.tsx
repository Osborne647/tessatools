"use client";

// The full JWT decoder. Decoding is instant and local; HS* signature
// verification is optional and also local, via the Web Crypto API.

import { useEffect, useMemo, useState } from "react";
import {
  type ClaimNote,
  type DecodedJwt,
  algorithmWarning,
  decodeJwt,
  verifyHmac,
} from "@/lib/jwt";

// A self-contained sample token so the tool is never empty. Signed with the
// secret below, so "verify" works out of the box.
const SAMPLE_SECRET = "tessacode-demo-secret";
const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xIn0" +
  ".eyJpc3MiOiJodHRwczovL2F1dGgudGVzc2Fjb2RlLmRldiIsInN1YiI6InVzZXJfOWYyYiIsImF1ZCI6WyJhcGkiLCJ3ZWIiXSwiaWF0IjoxNzU3NjAxNzIwLCJleHAiOjQxMDI0NDQ4MDAsImp0aSI6ImU4YTEtNGM3NyIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoibmlja0B0ZXNzYWNvZGUuZGV2In0" +
  ".2FLApulTHtgU6ay9HxSC_AKDWS1Jhdsz29xn05_xGBw";

const STATE_COLOR: Record<ClaimNote["state"], string> = {
  ok: "text-teal",
  warn: "text-[#ffbb44]",
  bad: "text-coral",
  info: "text-muted",
};

function SegmentPane({
  label,
  tint,
  json,
  raw,
}: {
  label: string;
  tint: string;
  json: string;
  raw: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[11px] uppercase tracking-[0.16em] ${tint}`}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(json);
            setCopied(true);
          }}
          className={`font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
            copied ? "text-teal" : "text-sub hover:text-teal"
          }`}
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="mt-3 max-h-[200px] overflow-auto bg-navy p-4 font-mono text-[13px] leading-[1.7] text-white">
        <code>{json}</code>
      </pre>
      <p className="mt-2 break-all font-mono text-[10.5px] leading-relaxed text-sub/70">{raw}</p>
    </div>
  );
}

export default function JwtTool() {
  const [token, setToken] = useState(SAMPLE);
  const [secret, setSecret] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean; reason: string } | null>(null);

  const result = useMemo(() => decodeJwt(token), [token]);
  const decoded = "error" in result && result.error && !("header" in result) ? null : (result as DecodedJwt);
  const fatal = "error" in result && !("header" in result) ? (result.error as string) : null;

  // Any edit invalidates a previous verdict.
  useEffect(() => {
    setVerdict(null);
  }, [token, secret]);

  async function runVerify() {
    setVerifying(true);
    try {
      setVerdict(await verifyHmac(token, secret));
    } catch {
      setVerdict({ ok: false, reason: "could not verify with that secret" });
    } finally {
      setVerifying(false);
    }
  }

  const warning = decoded ? algorithmWarning(decoded.algorithm) : null;
  const isHmac = decoded?.algorithm?.startsWith("HS") ?? false;

  // The headline verdict: expiry is what people are actually checking.
  const status = !decoded
    ? { text: "not a token", tone: "text-coral" }
    : decoded.expired
      ? { text: "expired", tone: "text-coral" }
      : decoded.notYetValid
        ? { text: "not yet valid", tone: "text-[#ffbb44]" }
        : decoded.expired === null
          ? { text: "no expiry claim", tone: "text-[#ffbb44]" }
          : { text: "unexpired", tone: "text-teal" };

  return (
    <div className="bg-facet-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
      {/* Privacy banner. This is the objection every visitor has, so answer it
          before they have to ask. */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-deep px-5 py-3 sm:px-7">
        <p className="font-mono text-[11.5px] text-sub">
          decoded in this tab · your token is never sent anywhere
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setToken(SAMPLE);
              setSecret(SAMPLE_SECRET);
            }}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            load example
          </button>
          <button
            type="button"
            onClick={() => {
              setToken("");
              setSecret("");
            }}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            clear
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        {/* Input + verification */}
        <div className="bg-facet-2 px-5 py-5 sm:px-7">
          <label
            htmlFor="jwt-in"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
          >
            encoded token
          </label>
          <textarea
            id="jwt-in"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            spellCheck={false}
            placeholder="Paste a JWT, with or without the Bearer prefix…"
            className="mt-3 h-[184px] w-full resize-none bg-navy px-4 py-3 font-mono text-[13px] leading-[1.7] break-all text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
          />

          {/* Colour-coded so the three segments are visually separable, the way
              every developer already pictures a JWT. */}
          {decoded && (
            <p className="mt-3 font-mono text-[11px] text-sub">
              <span className="text-teal">header</span>
              <span className="px-1">·</span>
              <span className="text-[#ffbb44]">payload</span>
              <span className="px-1">·</span>
              <span className="text-[#c969a1]">signature</span>
            </p>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <label
              htmlFor="jwt-secret"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
            >
              verify signature {isHmac ? "" : "(HS256/384/512 only)"}
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="jwt-secret"
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                spellCheck={false}
                placeholder="shared secret"
                className="min-w-0 flex-1 bg-navy px-4 py-3 font-mono text-[13px] text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
              />
              <button
                type="button"
                onClick={runVerify}
                disabled={!isHmac || verifying}
                className="shrink-0 bg-teal px-4 py-3 font-mono text-[12px] font-medium tracking-[0.08em] text-navy transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                {verifying ? "checking…" : "verify"}
              </button>
            </div>

            {verdict && (
              <p
                className={`mt-3 font-mono text-[12px] ${verdict.ok ? "text-teal" : "text-coral"}`}
              >
                {verdict.ok ? "✓ " : "✕ "}
                {verdict.reason}
              </p>
            )}
            {!verdict && (
              <p className="mt-3 font-mono text-[11px] text-sub">
                HMAC is checked locally with the Web Crypto API. RS and ES tokens need the
                issuer&apos;s public key, which would mean leaving your device.
              </p>
            )}
          </div>
        </div>

        {/* Decoded output */}
        <div className="bg-facet-3 px-5 py-5 sm:px-7">
          {fatal ? (
            <div className="flex h-full min-h-[300px] items-center">
              <p className="font-mono text-[13px] leading-relaxed text-coral">{fatal}</p>
            </div>
          ) : decoded ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
                  decoded
                </span>
                <span className={`font-mono text-[12px] font-medium ${status.tone}`}>
                  {status.text}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="font-display text-[19px] font-medium tracking-[-0.02em] text-white">
                  {decoded.algorithm ?? "no alg"}
                </span>
                {decoded.type && (
                  <span className="font-mono text-[11.5px] text-sub">typ {decoded.type}</span>
                )}
                {decoded.keyId && (
                  <span className="font-mono text-[11.5px] text-sub">kid {decoded.keyId}</span>
                )}
              </div>

              {warning && (
                <p className="mt-4 border-l-2 border-[#ffbb44] bg-navy px-4 py-3 font-mono text-[11.5px] leading-relaxed text-[#ffbb44]">
                  {warning}
                </p>
              )}

              {/* Claims, interpreted. Raw JSON is below; this is the part that
                  answers "is this token good right now". */}
              {decoded.claims.length > 0 && (
                <div className="mt-5">
                  {decoded.claims.map((c) => (
                    <div
                      key={c.key}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line/60 py-2.5"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-sub">
                        {c.label}
                      </span>
                      <span className={`break-all font-mono text-[12.5px] ${STATE_COLOR[c.state]}`}>
                        {c.detail}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-5">
                <SegmentPane
                  label="header"
                  tint="text-teal"
                  json={decoded.header.text}
                  raw={decoded.header.raw}
                />
                <SegmentPane
                  label="payload"
                  tint="text-[#ffbb44]"
                  json={decoded.payload.text}
                  raw={decoded.payload.raw}
                />
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#c969a1]">
                    signature
                  </span>
                  <p className="mt-3 break-all bg-navy p-4 font-mono text-[12px] leading-relaxed text-muted">
                    {decoded.signature || "(none)"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[300px] items-center">
              <p className="font-mono text-[12px] text-sub">paste a token to decode it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
