"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULTS, markdownToHtml, outline, stats as computeStats } from "@/lib/markdown";

type View = "preview" | "html";

const SAMPLE = `# Tessacode Tools

Ten free developer tools that run **entirely in your browser**. No uploads, no
sign-up, no waiting.

## Shipping order

| # | Tool | Status |
|:--|:-----|-------:|
| 1 | Base64 | live |
| 2 | UUID | live |
| 3 | JSON | live |

## This week

- [x] Base64 encoder
- [x] UUID generator
- [ ] Markdown converter
  - [ ] GFM tables
  - [ ] task lists

> Everything runs client-side, which is both a privacy feature and a
> cost feature.

Try it with \`Intl.DateTimeFormat\`, or read the [project plan](https://tessacodetools.dev).

\`\`\`js
const html = markdownToHtml(source);
\`\`\`
`;

export default function MarkdownTool() {
  const [src, setSrc] = useState(SAMPLE);
  const [view, setView] = useState<View>("preview");
  const [breaks, setBreaks] = useState(false);
  const [headingIds, setHeadingIds] = useState(true);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const opts = useMemo(() => ({ ...DEFAULTS, breaks, headingIds }), [breaks, headingIds]);
  const html = useMemo(() => markdownToHtml(src, opts), [src, opts]);
  const toc = useMemo(() => outline(src), [src]);
  const stats = useMemo(() => computeStats(src), [src]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const loadFile = useCallback(async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return;
    setSrc(await file.text());
  }, []);

  function download() {
    const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Converted document</title>
</head>
<body>
${html}
</body>
</html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.html";
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
          {(["preview", "html"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
                view === v ? "bg-teal text-navy" : "text-muted hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-muted">
            <input
              type="checkbox"
              checked={breaks}
              onChange={(e) => setBreaks(e.target.checked)}
              className="h-3.5 w-3.5 accent-teal"
            />
            line breaks
          </label>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-muted">
            <input
              type="checkbox"
              checked={headingIds}
              onChange={(e) => setHeadingIds(e.target.checked)}
              className="h-3.5 w-3.5 accent-teal"
            />
            heading ids
          </label>
          <label className="cursor-pointer font-mono text-[12px] text-muted transition-colors hover:text-teal">
            <input
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
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
              setSrc("");
              inputRef.current?.focus();
            }}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            clear
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="bg-facet-2">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              markdown
            </span>
            <span className="font-mono text-[11px] text-sub">
              {stats.words} words · {stats.headings} headings
            </span>
          </div>
          <textarea
            ref={inputRef}
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            spellCheck={false}
            placeholder="Type Markdown here, or drop a .md file anywhere on this panel…"
            aria-label="Markdown source"
            className="h-[420px] w-full resize-none bg-transparent px-5 py-3 font-mono text-[13.5px] leading-[1.75] text-white outline-none placeholder:text-sub/50 sm:px-7"
          />
          <div className="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-7">
            <button
              type="button"
              onClick={() => setSrc(SAMPLE)}
              className="bg-navy px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:text-teal"
            >
              load example
            </button>
            {toc.length > 0 && (
              <span className="font-mono text-[11px] text-sub">
                outline: {toc.map((h) => "#".repeat(h.level)).join(" ")}
              </span>
            )}
          </div>
        </div>

        <div className="bg-facet-3">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {view === "preview" ? "rendered" : "html output"}
            </span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] text-sub">{html.length} chars</span>
              <button
                type="button"
                onClick={download}
                disabled={!html}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-sub transition-colors hover:text-teal disabled:opacity-40"
              >
                .html
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(html);
                  setCopied(true);
                }}
                disabled={!html}
                className={`font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors disabled:opacity-40 ${
                  copied ? "text-teal" : "text-sub hover:text-teal"
                }`}
              >
                {copied ? "copied" : "copy html"}
              </button>
            </div>
          </div>

          <div className="h-[420px] overflow-auto px-5 py-4 sm:px-7">
            {view === "html" ? (
              <pre className="font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-white">
                <code>{html}</code>
              </pre>
            ) : html ? (
              <div
                className="md-preview text-[14.5px] leading-[1.75] text-muted"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="font-mono text-[12px] text-sub">nothing to render yet</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 sm:px-7">
            <p className="font-mono text-[11px] text-teal">
              {stats.links} links · {stats.codeBlocks} code blocks
            </p>
            <p className="font-mono text-[11px] text-sub">converted locally · html is escaped</p>
          </div>
        </div>
      </div>
    </div>
  );
}
