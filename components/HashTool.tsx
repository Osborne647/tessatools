"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ALGOS,
  type Algo,
  type Encoding,
  detectAlgo,
  digestsMatch,
  encode,
  formatBytes,
  hashBytes,
  hmac,
} from "@/lib/hash";

type Source = { kind: "text"; text: string } | { kind: "file"; name: string; bytes: Uint8Array };

const ENCODINGS: { id: Encoding; label: string }[] = [
  { id: "hex", label: "hex" },
  { id: "hex-upper", label: "HEX" },
  { id: "base64", label: "base64" },
];

const EXAMPLES = [
  { label: "text", value: "Seamless by design." },
  { label: "password", value: "correct horse battery staple" },
  { label: "empty", value: "" },
];

function Row({
  algo,
  digest,
  safe,
  bits,
  highlight,
}: {
  algo: string;
  digest: string;
  safe: boolean;
  bits: number;
  highlight: "match" | "mismatch" | null;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const border =
    highlight === "match"
      ? "border-teal"
      : highlight === "mismatch"
        ? "border-coral"
        : "border-line/60";

  return (
    <div className={`border-t py-3 ${border}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="flex items-baseline gap-2.5">
          <span className="font-mono text-[12px] tracking-[0.1em] text-white">{algo}</span>
          <span className="font-mono text-[10px] text-sub">{bits}-bit</span>
          {!safe && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ffbb44]">
              broken
            </span>
          )}
          {highlight === "match" && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal">
              matches
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(digest);
            setCopied(true);
          }}
          className={`font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
            copied ? "text-teal" : "text-sub hover:text-teal"
          }`}
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <p
        className={`mt-2 break-all font-mono text-[12.5px] leading-relaxed ${
          highlight === "match" ? "text-teal" : "text-muted"
        }`}
      >
        {digest || "—"}
      </p>
    </div>
  );
}

export default function HashTool() {
  const [source, setSource] = useState<Source>({ kind: "text", text: EXAMPLES[0].value });
  const [enc, setEnc] = useState<Encoding>("hex");
  const [secret, setSecret] = useState("");
  const [useHmac, setUseHmac] = useState(false);
  const [expected, setExpected] = useState("");
  const [digests, setDigests] = useState<Partial<Record<Algo, string>>>({});
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const bytes = useMemo(
    () => (source.kind === "text" ? new TextEncoder().encode(source.text) : source.bytes),
    [source],
  );

  // Recompute whenever the input, encoding, or HMAC settings change. Async
  // because crypto.subtle is promise-based.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setWorking(true);
      const out: Partial<Record<Algo, string>> = {};

      for (const { id } of ALGOS) {
        if (useHmac) {
          // HMAC keys a digest with a secret, and needs text rather than bytes.
          const text = source.kind === "text" ? source.text : new TextDecoder().decode(bytes);
          const sig = await hmac(text, secret, id);
          out[id] = sig ? encode(sig, enc) : "";
        } else {
          out[id] = encode(await hashBytes(bytes, id), enc);
        }
      }

      if (!cancelled) {
        setDigests(out);
        setWorking(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [bytes, enc, useHmac, secret, source]);

  const loadFile = useCallback(async (file: File) => {
    if (file.size > 50 * 1024 * 1024) return;
    setUseHmac(false);
    setSource({ kind: "file", name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  }, []);

  // Which algorithm the pasted checksum came from, so the matching row can be
  // highlighted without the visitor having to tell us.
  const expectedAlgo = useMemo(() => detectAlgo(expected), [expected]);
  const matchedAlgo = useMemo(() => {
    if (!expected.trim()) return null;
    for (const { id } of ALGOS) {
      if (digests[id] && digestsMatch(digests[id]!, expected)) return id;
    }
    return null;
  }, [expected, digests]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void loadFile(file);
      }}
      className={`bg-facet-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] ${
        dragging ? "ring-2 ring-teal" : ""
      }`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-1 bg-navy p-1">
          {ENCODINGS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setEnc(o.id)}
              aria-pressed={enc === o.id}
              className={`px-3 py-1.5 font-mono text-[12px] tracking-[0.06em] transition-colors ${
                enc === o.id ? "bg-teal text-navy" : "text-muted hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-muted">
            <input
              type="checkbox"
              checked={useHmac}
              onChange={(e) => setUseHmac(e.target.checked)}
              className="h-3.5 w-3.5 accent-teal"
            />
            hmac
          </label>

          <label className="cursor-pointer font-mono text-[12px] text-muted transition-colors hover:text-teal">
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void loadFile(file);
              }}
            />
            + file
          </label>

          <button
            type="button"
            onClick={() => {
              setSource({ kind: "text", text: "" });
              setExpected("");
              inputRef.current?.focus();
            }}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            clear
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        {/* Input */}
        <div className="bg-facet-2 px-5 py-5 sm:px-7">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {source.kind === "file" ? "file" : "input"}
            </span>
            <span className="font-mono text-[11px] text-sub">{formatBytes(bytes.length)}</span>
          </div>

          {source.kind === "file" ? (
            <div className="mt-3 flex h-[150px] flex-col items-start justify-center gap-3 bg-navy px-4">
              <p className="font-mono text-[14px] text-white">{source.name}</p>
              <p className="font-mono text-[11.5px] text-sub">
                hashed from raw bytes, in this tab
              </p>
              <button
                type="button"
                onClick={() => setSource({ kind: "text", text: "" })}
                className="font-mono text-[12px] text-teal transition-colors hover:text-white"
              >
                ← back to text
              </button>
            </div>
          ) : (
            <textarea
              ref={inputRef}
              value={source.text}
              onChange={(e) => setSource({ kind: "text", text: e.target.value })}
              spellCheck={false}
              placeholder="Type or paste text, or drop a file anywhere on this panel…"
              aria-label="Text to hash"
              className="mt-3 h-[150px] w-full resize-none bg-navy px-4 py-3 font-mono text-[14px] leading-relaxed text-white outline-none placeholder:text-sub/50"
            />
          )}

          {source.kind === "text" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-sub">try:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setSource({ kind: "text", text: ex.value })}
                  className="bg-navy px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:text-teal"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          )}

          {/* HMAC secret */}
          {useHmac && (
            <div className="mt-5 border-t border-line pt-5">
              <label
                htmlFor="hash-secret"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
              >
                hmac secret
              </label>
              <input
                id="hash-secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                spellCheck={false}
                placeholder="shared key"
                className="mt-3 w-full bg-navy px-4 py-3 font-mono text-[13px] text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
              />
              <p className="mt-2 font-mono text-[11px] text-sub">
                MD5 has no HMAC here — crypto.subtle does not expose it.
              </p>
            </div>
          )}

          {/* Verify */}
          <div className="mt-5 border-t border-line pt-5">
            <label
              htmlFor="hash-expected"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
            >
              compare a checksum
            </label>
            <input
              id="hash-expected"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              spellCheck={false}
              placeholder="Paste the digest you expected…"
              className="mt-3 w-full bg-navy px-4 py-3 font-mono text-[12.5px] text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
            />
            {expected.trim() && (
              <p className="mt-3 font-mono text-[12px]">
                {matchedAlgo ? (
                  <span className="text-teal">✓ matches the {matchedAlgo} digest above</span>
                ) : expectedAlgo ? (
                  <span className="text-coral">
                    ✕ no match — that looks like a {expectedAlgo} digest
                  </span>
                ) : (
                  <span className="text-coral">✕ no match, and that is not a valid hex digest</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Digests */}
        <div className="bg-facet-3 px-5 py-5 sm:px-7">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {useHmac ? "hmac digests" : "digests"}
            </span>
            <span className="font-mono text-[11px] text-sub">
              {working ? "computing…" : "web crypto api"}
            </span>
          </div>

          <div className="mt-3">
            {ALGOS.map((a) => (
              <Row
                key={a.id}
                algo={a.label}
                bits={a.bits}
                safe={a.safe}
                digest={digests[a.id] ?? ""}
                highlight={
                  matchedAlgo === a.id
                    ? "match"
                    : expected.trim() && expectedAlgo === a.id
                      ? "mismatch"
                      : null
                }
              />
            ))}
          </div>

          <p className="mt-5 font-mono text-[11px] text-sub">
            nothing uploaded · files never leave the browser
          </p>
        </div>
      </div>
    </div>
  );
}
