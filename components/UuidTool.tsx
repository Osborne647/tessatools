"use client";

// The full UUID tool: batch generation, output shapes, and a validator.
// Isolated as the page's only client component.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SHAPES,
  type Shape,
  type Version,
  formatAs,
  generate,
  inspect,
} from "@/lib/uuid";

const COUNTS = [1, 5, 10, 50, 100, 500, 1000];

export default function UuidTool() {
  const [version, setVersion] = useState<Version>("v4");
  const [count, setCount] = useState(5);
  const [shape, setShape] = useState<Shape>("plain");
  const [ids, setIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [check, setCheck] = useState("");

  const roll = useCallback(() => setIds(generate(version, count)), [version, count]);

  // Generate on mount and whenever the version or count changes, so the tool
  // is never sitting empty waiting for a click.
  useEffect(() => {
    setIds(generate(version, count));
  }, [version, count]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const output = useMemo(() => formatAs(ids, shape), [ids, shape]);
  const result = useMemo(() => (check.trim() ? inspect(check) : null), [check]);

  function download() {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${version}-${ids.length}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-facet-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
      {/* Version + count */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-1 bg-navy p-1">
          {(["v4", "v7"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVersion(v)}
              aria-pressed={version === v}
              className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
                version === v ? "bg-teal text-navy" : "text-muted hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
          <span className="ml-2 pr-2 font-mono text-[11px] text-sub">
            {version === "v4" ? "random" : "time-ordered"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">how many</span>
          <div className="flex flex-wrap items-center gap-1">
            {COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                aria-pressed={count === c}
                className={`min-w-9 px-2.5 py-1 font-mono text-[12px] transition-colors ${
                  count === c ? "bg-facet-hover text-teal" : "bg-navy text-muted hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="bg-facet-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 sm:px-7">
          <div className="flex flex-wrap items-center gap-1">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShape(s.id)}
                aria-pressed={shape === s.id}
                className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  shape === s.id ? "bg-teal text-navy" : "bg-navy text-muted hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={download}
              className="font-mono text-[12px] uppercase tracking-[0.12em] text-sub transition-colors hover:text-teal"
            >
              .txt
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(output);
                setCopied(true);
              }}
              className={`font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors ${
                copied ? "text-teal" : "text-sub hover:text-teal"
              }`}
            >
              {copied ? `copied ${ids.length}` : "copy all"}
            </button>
          </div>
        </div>

        <pre className="h-[300px] overflow-auto px-5 py-4 font-mono text-[14px] leading-[1.9] text-white sm:px-7">
          {output}
        </pre>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 sm:px-7">
          <p className="font-mono text-[11px] text-sub">
            {version === "v7"
              ? "sorted oldest → newest · crypto.getRandomValues + monotonic counter"
              : "122 bits of randomness each · crypto.getRandomValues"}
          </p>
          <button
            type="button"
            onClick={roll}
            className="bg-teal px-4 py-2 font-mono text-[12px] font-medium tracking-[0.08em] text-navy transition-opacity hover:opacity-90"
          >
            regenerate ↻
          </button>
        </div>
      </div>

      {/* Validator */}
      <div className="bg-facet-2 px-5 py-5 sm:px-7">
        <label
          htmlFor="uuid-check"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
        >
          check a uuid
        </label>
        <input
          id="uuid-check"
          value={check}
          onChange={(e) => setCheck(e.target.value)}
          spellCheck={false}
          placeholder="Paste a UUID to validate and read its version…"
          className="mt-3 w-full bg-navy px-4 py-3 font-mono text-[14px] text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
        />
        {result && (
          <p className="mt-3 font-mono text-[13px]">
            {result.valid ? (
              <span className="text-teal">
                valid · {result.label}
                {result.timestamp
                  ? ` · created ${result.timestamp.toISOString().replace("T", " ").slice(0, 19)} UTC`
                  : ""}
              </span>
            ) : (
              <span className="text-coral">not a valid UUID</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
