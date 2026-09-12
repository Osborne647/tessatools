"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULTS, type Options, beautify, byteLength, minify } from "@/lib/css";

type Mode = "minify" | "beautify";

const SAMPLE = `/*! tessacode-tools v1 — MIT */

:root {
  --navy: #0D1B2A;
  --teal: #00E5C4;
}

/* the hero panel */
.hero {
  background : var(--navy) url(data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=) no-repeat;
  padding    : 0px 24px;
  width      : calc(100% - 2rem);
  opacity    : 0.950;
  color      : rgb(255, 255, 255);
}

.hero::after {
  content: " } ; ";
  transition: opacity 0.3s ease, transform 0s linear;
}

@media (min-width: 768px) {
  .hero { padding: 0 48px; }
}
`;

const TOGGLES: { key: keyof Options; label: string; hint: string }[] = [
  { key: "shortenColors", label: "shorten colors", hint: "#aabbcc → #abc, rgb() → hex" },
  { key: "stripZeroUnits", label: "strip zero units", hint: "0px → 0, 0.5 → .5" },
  { key: "keepBangComments", label: "keep /*! headers", hint: "preserve license comments" },
  { key: "newlinePerRule", label: "one rule per line", hint: "easier to diff" },
];

function Savings({ percent, saved }: { percent: number; saved: number }) {
  const width = Math.max(0, Math.min(100, percent));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-[38px] font-bold leading-none tracking-[-0.04em] text-teal sm:text-[46px]">
          {percent}%
        </span>
        <span className="font-mono text-[12px] text-sub">{saved} bytes saved</span>
      </div>
      <div className="mt-3 h-1.5 w-full bg-navy">
        <div
          className="h-full bg-teal transition-[width] duration-500 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function CssTool() {
  const [mode, setMode] = useState<Mode>("minify");
  const [src, setSrc] = useState(SAMPLE);
  const [opts, setOpts] = useState<Options>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const result = useMemo(() => minify(src, opts), [src, opts]);
  const output = useMemo(
    () => (mode === "minify" ? result.css : beautify(src)),
    [mode, result.css, src],
  );

  const outBytes = useMemo(() => byteLength(output), [output]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const loadFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return;
    setFileName(file.name);
    setSrc(await file.text());
  }, []);

  function download() {
    const blob = new Blob([output], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "minify" ? "styles.min.css" : "styles.css";
    a.click();
    URL.revokeObjectURL(url);
  }

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
          {(["minify", "beautify"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
                mode === m ? "bg-teal text-navy" : "text-muted hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="cursor-pointer font-mono text-[12px] text-muted transition-colors hover:text-teal">
            <input
              type="file"
              accept=".css,text/css"
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
            onClick={() => setSrc(SAMPLE)}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            example
          </button>
          <button
            type="button"
            onClick={() => {
              setSrc("");
              setFileName(null);
              inputRef.current?.focus();
            }}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            clear
          </button>
        </div>
      </div>

      {mode === "minify" && (
        <div className="flex flex-wrap gap-x-6 gap-y-3 bg-navy-deep px-5 py-3 sm:px-7">
          {TOGGLES.map((t) => (
            <label
              key={t.key}
              title={t.hint}
              className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-muted"
            >
              <input
                type="checkbox"
                checked={opts[t.key]}
                onChange={(e) => setOpts((o) => ({ ...o, [t.key]: e.target.checked }))}
                className="h-3.5 w-3.5 accent-teal"
              />
              {t.label}
            </label>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2">
        <div className="bg-facet-2">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {fileName ?? "css in"}
            </span>
            <span className="font-mono text-[11px] text-sub">
              {src.split("\n").length} lines · {result.inBytes} B
            </span>
          </div>
          <textarea
            ref={inputRef}
            value={src}
            onChange={(e) => {
              setSrc(e.target.value);
              setFileName(null);
            }}
            spellCheck={false}
            placeholder="Paste CSS here, or drop a .css file anywhere on this panel…"
            aria-label="CSS source"
            className="h-[400px] w-full resize-none bg-transparent px-5 py-3 font-mono text-[13px] leading-[1.7] text-white outline-none placeholder:text-sub/50 sm:px-7"
          />
        </div>

        <div className="bg-facet-3">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {mode === "minify" ? "minified" : "formatted"}
            </span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] text-sub">{outBytes} B</span>
              <button
                type="button"
                onClick={download}
                disabled={!output}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-sub transition-colors hover:text-teal disabled:opacity-40"
              >
                .css
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(output);
                  setCopied(true);
                }}
                disabled={!output}
                className={`font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors disabled:opacity-40 ${
                  copied ? "text-teal" : "text-sub hover:text-teal"
                }`}
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>

          <div className="h-[400px] overflow-auto px-5 py-3 sm:px-7">
            {output ? (
              <pre className="font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-all text-white">
                <code>{output}</code>
              </pre>
            ) : (
              <p className="font-mono text-[12px] text-sub">nothing to process yet</p>
            )}
          </div>
        </div>
      </div>

      {mode === "minify" && src.trim() && (
        <div className="grid gap-6 bg-navy-deep px-5 py-5 sm:grid-cols-2 sm:px-7">
          <Savings percent={result.savedPercent} saved={result.saved} />

          <div className="flex flex-col justify-center gap-2">
            <p className="font-mono text-[12px] text-muted">
              {result.rules} rules · {result.declarations} declarations ·{" "}
              {result.comments} comments stripped
            </p>
            <p className="font-mono text-[11px] text-sub">
              {result.inBytes} B → {result.outBytes} B · gzip will shave more on top
            </p>
            {result.notes.map((n) => (
              <p key={n} className="font-mono text-[11.5px] leading-relaxed text-[#ffbb44]">
                {n}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
