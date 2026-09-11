"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { byteLength, decodeBase64, diagnose, encodeBase64, encodeBytes } from "@/lib/base64";

type Mode = "encode" | "decode";

const EXAMPLES: Record<Mode, { label: string; value: string }[]> = {
  encode: [
    { label: "plain text", value: "Seamless by design." },
    { label: "json", value: '{"user":"nick","role":"admin"}' },
    { label: "basic auth", value: "tessacode:s3cr3t-t0ken" },
    { label: "unicode", value: "café · 東京 · 🚀" },
  ],
  decode: [
    { label: "greeting", value: "SGVsbG8sIHRlc3NhY29kZXRvb2xzLmRldiE=" },
    { label: "json", value: "eyJ1c2VyIjoibmljayIsInJvbGUiOiJhZG1pbiJ9" },
    { label: "url-safe", value: "c3ViPTEyMzQ1Njc4OTAmbmFtZT1OaWNrIE9zYm9ybmU" },
  ],
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState(EXAMPLES.encode[0].value);
  const [urlSafe, setUrlSafe] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileB64, setFileB64] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const output = useMemo(() => {
    if (fileB64 !== null) return { text: fileB64, error: null as string | null };
    if (!input.trim()) return { text: "", error: null };

    if (mode === "encode") return { text: encodeBase64(input, urlSafe), error: null };

    const decoded = decodeBase64(input);
    return decoded === null
      ? { text: "", error: diagnose(input) ?? "is not valid Base64" }
      : { text: decoded, error: null };
  }, [input, mode, urlSafe, fileB64]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const clearFile = useCallback(() => {
    setFileB64(null);
    setFileName(null);
  }, []);

  const loadFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setFileName(file.name);
      setFileB64("");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    setMode("encode");
    setFileName(file.name);
    setFileB64(encodeBytes(bytes, urlSafe));
  }, [urlSafe]);

  function flip() {
    clearFile();
    if (output.text && !output.error) setInput(output.text);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    inputRef.current?.focus();
  }

  function reset() {
    clearFile();
    setInput("");
    inputRef.current?.focus();
  }

  function download() {
    const blob = new Blob([output.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "encode" ? "encoded.txt" : "decoded.txt";
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
      className={`bg-facet-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] transition-shadow ${
        dragging ? "ring-2 ring-teal" : ""
      }`}
    >

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-1 bg-navy p-1">
          {(["encode", "decode"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                clearFile();
                setMode(m);
              }}
              aria-pressed={mode === m}
              className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
                mode === m ? "bg-teal text-navy" : "text-muted hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[12px] text-muted">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => {
                setUrlSafe(e.target.checked);
                clearFile();
              }}
              className="h-3.5 w-3.5 accent-teal"
            />
            url-safe
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
            + File
          </label>

          <button
            type="button"
            onClick={reset}
            className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1fr]">
        <div className="bg-facet-2">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {fileName ? "file" : mode === "encode" ? "plain text" : "base64 in"}
            </span>
            <span className="font-mono text-[11px] text-sub">
              {fileName ? fileName : `${byteLength(input)} B`}
            </span>
          </div>

          {fileName ? (
            <div className="flex h-[220px] flex-col items-start justify-center gap-3 px-5 sm:px-7">
              <p className="font-mono text-[14px] text-white">{fileName}</p>
              <button
                type="button"
                onClick={clearFile}
                className="font-mono text-[12px] text-teal transition-colors hover:text-white"
              >
                ← Back to Text
              </button>
            </div>
          ) : (
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder={
                mode === "encode"
                  ? "Type or paste text, or drop a file anywhere on this panel…"
                  : "Paste Base64 to decode…"
              }
              aria-label={mode === "encode" ? "Text to encode" : "Base64 to decode"}
              className="h-[220px] w-full resize-none bg-transparent px-5 py-3 font-mono text-[15px] leading-relaxed text-white outline-none placeholder:text-sub/50 sm:px-7"
            />
          )}

          <div className="flex flex-wrap items-center gap-2 px-5 pb-4 sm:px-7">
            <span className="font-mono text-[11px] text-sub">try:</span>
            {EXAMPLES[mode].map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  clearFile();
                  setInput(ex.value);
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
            onClick={flip}
            aria-label="Swap input and output"
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
              {mode === "encode" ? "base64 out" : "plain text"}
            </span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] text-sub">{output.text.length} chars</span>
              <button
                type="button"
                onClick={download}
                disabled={!output.text}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-sub transition-colors hover:text-teal disabled:opacity-40"
              >
                .txt
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(output.text);
                  setCopied(true);
                }}
                disabled={!output.text}
                className={`font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors disabled:opacity-40 ${
                  copied ? "text-teal" : "text-sub hover:text-teal"
                }`}
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>

          <div className="h-[220px] overflow-auto px-5 py-3 sm:px-7">
            {output.error ? (
              <p className="font-mono text-[14px] leading-relaxed text-coral">
                That input {output.error}.
              </p>
            ) : (
              <p className="font-mono text-[15px] leading-relaxed break-all text-white">
                {output.text}
              </p>
            )}
          </div>

          <div className="px-5 pb-4 sm:px-7">
            <p className="font-mono text-[11px] text-sub">
              {fileName
                ? "encoded from raw bytes, in this tab"
                : "processed locally · nothing sent anywhere"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
