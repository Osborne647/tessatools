"use client";

import { useEffect, useMemo, useState } from "react";
import { site, tools } from "@/lib/site-config";

const REASONS = [
  { id: "bug", label: "something is broken", subject: "Bug report" },
  { id: "request", label: "tool request", subject: "Tool request" },
  { id: "feedback", label: "feedback", subject: "Feedback" },
  { id: "other", label: "something else", subject: "Hello" },
] as const;

type Reason = (typeof REASONS)[number]["id"];

export default function ContactComposer() {
  const [reason, setReason] = useState<Reason>("bug");
  const [tool, setTool] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const needsTool = reason === "bug" || reason === "feedback";

  const mailto = useMemo(() => {
    const chosen = REASONS.find((r) => r.id === reason)!;
    const subject =
      needsTool && tool ? `${chosen.subject}: ${tool}` : chosen.subject;

    const body =
      reason === "bug"
        ? `${message}\n\n---\nTool: ${tool || "(not specified)"}\nWhat I did:\nWhat I expected:\nWhat happened instead:`
        : message;

    return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [reason, tool, message, needsTool]);

  return (
    <div className="bg-facet-1">
      <div className="bg-navy-deep px-5 py-3 sm:px-7">
        <p className="font-mono text-[11.5px] text-sub">
          This composes an email in your own client · the page sends nothing
        </p>
      </div>

      <div className="px-5 py-5 sm:px-7">
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
            what is this about
          </legend>
          <div className="mt-3 flex flex-wrap gap-1">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                aria-pressed={reason === r.id}
                className={`px-3 py-1.5 font-mono text-[12px] transition-colors ${
                  reason === r.id ? "bg-teal text-navy" : "bg-navy text-muted hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        {needsTool && (
          <div className="mt-5">
            <label
              htmlFor="contact-tool"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
            >
              which tool
            </label>
            <select
              id="contact-tool"
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="mt-3 w-full bg-navy px-4 py-3 font-mono text-[13px] text-white outline-none focus:ring-1 focus:ring-teal"
            >
              <option value="">— pick one —</option>
              {tools.map((t) => (
                <option key={t.slug} value={t.name}>
                  {t.name}
                </option>
              ))}
              <option value="the site itself">The Site Itself</option>
            </select>
          </div>
        )}

        <div className="mt-5">
          <label
            htmlFor="contact-message"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
          >
            message
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            spellCheck
            placeholder={
              reason === "bug"
                ? "What did you paste in, and what came out? An example input helps enormously."
                : reason === "request"
                  ? "Which tool do you keep googling?"
                  : "Say anything."
            }
            className="mt-3 h-[140px] w-full resize-none bg-navy px-4 py-3 text-[14px] leading-relaxed text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <a
            href={mailto}
            className="bg-teal px-5 py-3 font-mono text-[13px] font-medium tracking-[0.06em] text-navy transition-opacity hover:opacity-90"
          >
            Open In Mail App →
          </a>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(site.email);
              setCopied(true);
            }}
            className={`font-mono text-[12.5px] transition-colors ${
              copied ? "text-teal" : "text-muted hover:text-teal"
            }`}
          >
            {copied ? "address copied" : `or copy ${site.email}`}
          </button>
        </div>
      </div>
    </div>
  );
}
