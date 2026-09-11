"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { byteLength, decodeBase64, encodeBase64 } from "@/lib/base64";

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setDone(true);
      }}
      className={`font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors ${
        done ? "text-teal" : "text-sub"
      }`}
    >
      {done ? "copied" : "copy"}
    </button>
  );
}

export default function HeroTool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("Seamless by design.");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const output = useMemo(() => {
    if (!input) return { text: "", error: false };
    if (mode === "encode") return { text: encodeBase64(input), error: false };
    const decoded = decodeBase64(input);
    return decoded === null ? { text: "", error: true } : { text: decoded, error: false };
  }, [input, mode]);

  // Swapping feeds the output back in as the new input, so encode → decode
  // round-trips in one click instead of forcing a copy-paste.
  function flip() {
    if (output.text && !output.error) setInput(output.text);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    inputRef.current?.focus();
  }

  return (
    <div className="bg-facet-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] tracking-[0.14em] text-teal">01</span>
          <span className="font-display text-[15px] font-medium text-white">
            Base64 Encoder &amp; Decoder
          </span>
        </div>

        <div className="flex items-center gap-1 bg-navy p-1">
          {(["encode", "decode"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
                mode === m ? "bg-teal text-navy" : "text-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1fr]">
        {/* Input */}
        <div className="bg-facet-2">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {mode === "encode" ? "plain text" : "base64 in"}
            </span>
            <span className="font-mono text-[11px] text-sub">{byteLength(input)} B</span>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-label={mode === "encode" ? "Text to encode" : "Base64 to decode"}
            className="h-[132px] w-full resize-none bg-transparent px-5 py-3 font-mono text-[15px] leading-relaxed text-white outline-none sm:px-7"
          />
        </div>

        {/* Swap */}
        <div className="flex items-center justify-center bg-facet-2 py-2 md:py-0">
          <button
            type="button"
            onClick={flip}
            aria-label="Swap direction"
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

        {/* Output */}
        <div className="bg-facet-3">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
              {mode === "encode" ? "base64 out" : "plain text"}
            </span>
            <CopyButton value={output.text} />
          </div>
          <div className="h-[132px] overflow-auto px-5 py-3 sm:px-7">
            {output.error ? (
              <p className="font-mono text-[14px] leading-relaxed text-coral">not valid Base64</p>
            ) : (
              <p className="font-mono text-[15px] leading-relaxed break-all text-white">
                {output.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
