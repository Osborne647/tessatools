"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  byteLength,
  format,
  minify,
  parseJson,
  stats as computeStats,
} from "@/lib/json";

const INDENTS = [
  { id: 2, label: "2 spaces" },
  { id: 4, label: "4 spaces" },
  { id: 0, label: "tabs" },
];

const EXAMPLES = [
  {
    label: "api response",
    value:
      '{"user":{"id":"9f2b","name":"Nick Osborne","roles":["owner","admin"],"active":true,"lastSeen":"2026-09-11T13:22:04Z"},"plan":{"tier":"pro","seats":3,"renewsAt":null}}',
  },
  {
    label: "nested array",
    value:
      '{"tools":[{"n":1,"slug":"base64-encoder","live":true},{"n":2,"slug":"uuid-generator","live":true},{"n":3,"slug":"json-formatter","live":false}]}',
  },
  {
    label: "broken json",
    value: '{\n  "name": "tessacode",\n  "tools": 10,\n  "live": \'yes\',\n}',
  },
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function JsonTool() {
  const [input, setInput] = useState(EXAMPLES[0].value);
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [compact, setCompact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const parsed = useMemo(() => (input.trim() ? parseJson(input) : null), [input]);

  const output = useMemo(() => {
    if (!parsed?.ok) return "";
    return compact ? minify(parsed.value, sortKeys) : format(parsed.value, indent, sortKeys);
  }, [parsed, indent, sortKeys, compact]);

  const stats = useMemo(() => (parsed?.ok ? computeStats(parsed.value) : null), [parsed]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const loadFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) return;
    setFileName(file.name);
    setInput(await file.text());
  }, []);

  function applyToInput() {
    if (output) setInput(output);
    inputRef.current?.focus();
  }

  function download() {
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? (compact ? "minified.json" : "formatted.json");
    a.click();
    URL.revokeObjectURL(url);
  }

  const inBytes = byteLength(input);
  const outBytes = byteLength(output);
  const saved = inBytes > 0 && outBytes > 0 ? Math.round((1 - outBytes / inBytes) * 100) : 0;

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
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-1 bg-navy p-1">
          <button
            type="button"
            onClick={() => setCompact(false)}
            aria-pressed={!compact}
            className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
              !compact ? "bg-teal text-navy" : "text-muted hover:text-white"
            }`}
          >
            format
          </button>
          <button
            type="button"
            onClick={() => setCompact(true)}
            aria-pressed={compact}
            className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
              compact ? "bg-teal text-navy" : "text-muted hover:text-white"
            }`}
          >
            minify
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {!compact && (
            <div className="flex items-center gap-1">
              {INDENTS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setIndent(o.id)}
                  aria-pressed={indent === o.id}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                    indent === o.id ? "bg-facet-hover text-teal" : "bg-navy text-muted hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-muted">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="h-3.5 w-3.5 accent-teal"
            />
            sort keys
          </label>

          <label className="cursor-pointer font-mono text-[12px] text-muted transition-colors hover:text-teal">
            <input
              type="file"
              accept=".json,application/json,text/plain"
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
              setInput("");
              setFileName(null);
              inputRef.current?.focus();
            }}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            clear
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1fr]">
        <div className="bg-facet-2">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {fileName ?? "json in"}
            </span>
            <span className="font-mono text-[11px] text-sub">
              {input.split("\n").length} lines · {inBytes} B
            </span>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setFileName(null);
            }}
            spellCheck={false}
            placeholder="Paste JSON here, or drop a .json file anywhere on this panel…"
            aria-label="JSON to format"
            className="h-[340px] w-full resize-none bg-transparent px-5 py-3 font-mono text-[13.5px] leading-[1.7] text-white outline-none placeholder:text-sub/50 sm:px-7"
          />

          <div className="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-7">
            <span className="font-mono text-[11px] text-sub">try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setInput(ex.value);
                  setFileName(null);
                }}
                className="bg-navy px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:text-teal"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center bg-facet-2 py-2 md:py-0">
          <button
            type="button"
            onClick={applyToInput}
            disabled={!output}
            aria-label="Replace input with formatted output"
            title="Format in place"
            className="group flex h-10 w-10 items-center justify-center bg-navy disabled:opacity-40"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-300 group-enabled:group-hover:-translate-x-0.5"
            >
              <path
                d="M10 3 6 8l4 5"
                stroke="#00e5c4"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
          </button>
        </div>

        <div className="bg-facet-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {compact ? "minified" : "formatted"}
            </span>
            <div className="flex items-center gap-4">
              {compact && saved > 0 && (
                <span className="font-mono text-[11px] text-teal">−{saved}%</span>
              )}
              <span className="font-mono text-[11px] text-sub">{outBytes} B</span>
              <button
                type="button"
                onClick={download}
                disabled={!output}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-sub transition-colors hover:text-teal disabled:opacity-40"
              >
                .json
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

          <div className="h-[340px] overflow-auto px-5 py-3 sm:px-7">
            {parsed && !parsed.ok ? (
              <div className="font-mono text-[13px] leading-relaxed">
                <p className="text-coral">
                  Line {parsed.error.line}, column {parsed.error.column}
                </p>
                <p className="mt-2 text-white">{parsed.error.message}</p>
                {parsed.error.excerpt && (
                  <pre className="mt-4 overflow-x-auto bg-navy p-3 text-[12.5px] text-muted">
                    <code>
                      {parsed.error.excerpt}
                      {"\n"}
                      {" ".repeat(Math.max(0, parsed.error.column - 1))}
                      <span className="text-coral">▲</span>
                    </code>
                  </pre>
                )}
                {parsed.error.hint && (
                  <p className="mt-3 text-[12.5px] text-sub">{parsed.error.hint}</p>
                )}
              </div>
            ) : (
              <pre className="font-mono text-[13.5px] leading-[1.7] text-white">
                <code>{output}</code>
              </pre>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 sm:px-7">
            {parsed?.ok && stats ? (
              <p className="font-mono text-[11px] text-teal">
                valid JSON · {stats.keys} keys · {stats.objects} objects · {stats.arrays} arrays ·
                depth {stats.depth}
              </p>
            ) : (
              <p className="font-mono text-[11px] text-sub">
                {parsed ? "fix the error to see output" : "waiting for input"}
              </p>
            )}
            <p className="font-mono text-[11px] text-sub">parsed locally</p>
          </div>
        </div>
      </div>
    </div>
  );
}
