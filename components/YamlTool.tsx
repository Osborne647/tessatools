"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMIT_DEFAULTS, parseYaml, stats as computeStats, toYaml } from "@/lib/yaml";
import { parseJson } from "@/lib/json";

type Direction = "yaml-to-json" | "json-to-yaml";

const YAML_SAMPLE = `# tessacodetools.dev deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tessacode-web
  labels: {app: web, tier: frontend}
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: web
          image: nginx:1.27
          env:
            - name: NODE_ENV
              value: production
            - name: ANALYTICS
              value: "no"        # quoted, or it becomes false
          readiness: |
            curl -fsS localhost/health
            echo ok
      tolerations: []
`;

const JSON_SAMPLE = `{
  "name": "tessacode-tools",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "tools": ["base64", "uuid", "json", "timestamp"],
  "ads": null
}`;

export default function YamlTool() {
  const [direction, setDirection] = useState<Direction>("yaml-to-json");
  const [yamlSrc, setYamlSrc] = useState(YAML_SAMPLE);
  const [jsonSrc, setJsonSrc] = useState(JSON_SAMPLE);
  const [indent, setIndent] = useState(2);
  const [blockStrings, setBlockStrings] = useState(true);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toJson = direction === "yaml-to-json";
  const source = toJson ? yamlSrc : jsonSrc;

  const result = useMemo(() => {
    if (!source.trim()) return { text: "", error: null as string | null, line: null as number | null };

    if (toJson) {
      const p = parseYaml(source);
      if (!p.ok) return { text: "", error: p.error.message, line: p.error.line, hint: p.error.hint };
      return { text: JSON.stringify(p.value, null, indent === 0 ? "\t" : indent), error: null, line: null };
    }

    const p = parseJson(source);
    if (!p.ok) return { text: "", error: p.error.message, line: p.error.line, hint: p.error.hint };
    return {
      text: toYaml(p.value, { ...EMIT_DEFAULTS, indent: indent === 0 ? 2 : indent, blockStrings }),
      error: null,
      line: null,
    };
  }, [source, toJson, indent, blockStrings]);

  const docStats = useMemo(() => {
    if (!toJson || !source.trim()) return null;
    const p = parseYaml(source);
    return p.ok ? computeStats(source, p.value, p.documents.length) : null;
  }, [source, toJson]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const loadFile = useCallback(
    async (file: File) => {
      if (file.size > 2 * 1024 * 1024) return;
      const text = await file.text();
      const isJson = /\.json$/i.test(file.name);
      setDirection(isJson ? "json-to-yaml" : "yaml-to-json");
      if (isJson) setJsonSrc(text);
      else setYamlSrc(text);
    },
    [],
  );

  function flip() {
    if (result.text && !result.error) {
      if (toJson) setJsonSrc(result.text);
      else setYamlSrc(result.text);
    }
    setDirection(toJson ? "json-to-yaml" : "yaml-to-json");
    inputRef.current?.focus();
  }

  function download() {
    const ext = toJson ? "json" : "yaml";
    const blob = new Blob([result.text], {
      type: toJson ? "application/json" : "text/yaml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${ext}`;
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
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-1 bg-navy p-1">
          <button
            type="button"
            onClick={() => setDirection("yaml-to-json")}
            aria-pressed={toJson}
            className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
              toJson ? "bg-teal text-navy" : "text-muted hover:text-white"
            }`}
          >
            yaml → json
          </button>
          <button
            type="button"
            onClick={() => setDirection("json-to-yaml")}
            aria-pressed={!toJson}
            className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
              !toJson ? "bg-teal text-navy" : "text-muted hover:text-white"
            }`}
          >
            json → yaml
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            {[
              { id: 2, label: "2" },
              { id: 4, label: "4" },
              ...(toJson ? [{ id: 0, label: "tab" }] : []),
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setIndent(o.id)}
                aria-pressed={indent === o.id}
                className={`min-w-8 px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  indent === o.id ? "bg-facet-hover text-teal" : "bg-navy text-muted hover:text-white"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {!toJson && (
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-muted">
              <input
                type="checkbox"
                checked={blockStrings}
                onChange={(e) => setBlockStrings(e.target.checked)}
                className="h-3.5 w-3.5 accent-teal"
              />
              block strings
            </label>
          )}

          <label className="cursor-pointer font-mono text-[12px] text-muted transition-colors hover:text-teal">
            <input
              type="file"
              accept=".yaml,.yml,.json,text/yaml,application/json"
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
              if (toJson) setYamlSrc("");
              else setJsonSrc("");
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
              {toJson ? "yaml" : "json"}
            </span>
            <span className="font-mono text-[11px] text-sub">
              {source.split("\n").length} lines
            </span>
          </div>
          <textarea
            ref={inputRef}
            value={source}
            onChange={(e) => (toJson ? setYamlSrc(e.target.value) : setJsonSrc(e.target.value))}
            spellCheck={false}
            placeholder={
              toJson
                ? "Paste YAML here, or drop a .yaml file anywhere on this panel…"
                : "Paste JSON here…"
            }
            aria-label={toJson ? "YAML source" : "JSON source"}
            className="h-[400px] w-full resize-none bg-transparent px-5 py-3 font-mono text-[13px] leading-[1.75] text-white outline-none placeholder:text-sub/50 sm:px-7"
          />
          <div className="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-7">
            <button
              type="button"
              onClick={() => (toJson ? setYamlSrc(YAML_SAMPLE) : setJsonSrc(JSON_SAMPLE))}
              className="bg-navy px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:text-teal"
            >
              load example
            </button>
            {docStats && (
              <span className="font-mono text-[11px] text-sub">
                {docStats.keys} keys · depth {docStats.depth}
                {docStats.anchors > 0 ? ` · ${docStats.anchors} anchors` : ""}
                {docStats.documents > 1 ? ` · ${docStats.documents} docs` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center bg-facet-2 py-2 md:py-0">
          <button
            type="button"
            onClick={flip}
            aria-label="Swap direction and reuse the output"
            className="group flex h-10 w-10 items-center justify-center bg-navy"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-300 group-hover:rotate-180"
            >
              <path
                d="M3 6h10M10 3l3 3M13 10H3M6 13l-3-3"
                stroke="#00e5c4"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
          </button>
        </div>

        <div className="bg-facet-3">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {toJson ? "json" : "yaml"}
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={download}
                disabled={!result.text}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-sub transition-colors hover:text-teal disabled:opacity-40"
              >
                .{toJson ? "json" : "yaml"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(result.text);
                  setCopied(true);
                }}
                disabled={!result.text}
                className={`font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors disabled:opacity-40 ${
                  copied ? "text-teal" : "text-sub hover:text-teal"
                }`}
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>

          <div className="h-[400px] overflow-auto px-5 py-3 sm:px-7">
            {result.error ? (
              <div className="font-mono text-[13px] leading-relaxed">
                <p className="text-coral">
                  {result.line !== null ? `Line ${result.line}` : "Could not convert"}
                </p>
                <p className="mt-2 text-white">{result.error}</p>
                {"hint" in result && result.hint && (
                  <p className="mt-3 text-[12.5px] text-sub">{result.hint}</p>
                )}
              </div>
            ) : (
              <pre className="font-mono text-[13px] leading-[1.75] text-white">
                <code>{result.text}</code>
              </pre>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 sm:px-7">
            <p className="font-mono text-[11px] text-teal">
              {result.error ? "fix the error to see output" : result.text ? "converted" : "waiting for input"}
            </p>
            <p className="font-mono text-[11px] text-sub">
              {toJson ? "yaml 1.2 core schema" : "ambiguous strings auto-quoted"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
