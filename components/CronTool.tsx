"use client";

// The full cron parser: plain-English description, the next five run times in
// any timezone, and a field-by-field breakdown. The page's only client bundle.

import { useEffect, useMemo, useState } from "react";
import {
  type FieldName,
  formatRun,
  nextRuns,
  parseCron,
} from "@/lib/cron";
import { localZone, relativeTime, zoneOptions } from "@/lib/timestamp";

const PRESETS = [
  { label: "every minute", expr: "* * * * *" },
  { label: "every 15 min", expr: "*/15 * * * *" },
  { label: "hourly", expr: "0 * * * *" },
  { label: "daily 2am", expr: "0 2 * * *" },
  { label: "weekdays 9am", expr: "0 9 * * 1-5" },
  { label: "business hours", expr: "*/30 9-17 * * 1-5" },
  { label: "weekly", expr: "0 0 * * 0" },
  { label: "monthly", expr: "0 0 1 * *" },
  { label: "the gotcha", expr: "0 0 15 * 3" },
];

const FIELD_LABELS: { name: FieldName; title: string; range: string }[] = [
  { name: "minute", title: "minute", range: "0-59" },
  { name: "hour", title: "hour", range: "0-23" },
  { name: "dom", title: "day of month", range: "1-31" },
  { name: "month", title: "month", range: "1-12" },
  { name: "dow", title: "day of week", range: "0-6" },
];

/** Collapses a long value list into ranges: 1,2,3,5 → "1-3, 5". */
function summarize(values: number[]): string {
  if (!values.length) return "—";
  const runs: string[] = [];
  let start = values[0];
  let prev = values[0];

  for (let i = 1; i <= values.length; i += 1) {
    const v = values[i];
    if (v === prev + 1) {
      prev = v;
      continue;
    }
    runs.push(start === prev ? String(start) : `${start}-${prev}`);
    start = v;
    prev = v;
  }
  return runs.join(", ");
}

export default function CronTool() {
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const [tz, setTz] = useState("UTC");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Match the visitor's own zone after mount, so server and client render the
  // same markup and hydration stays clean.
  useEffect(() => {
    setTz(localZone());
  }, []);

  // Re-tick once a minute so "in 12 minutes" stays honest.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const zones = useMemo(() => zoneOptions(), []);
  const result = useMemo(() => parseCron(expr), [expr]);
  const runs = useMemo(
    () => (result.ok ? nextRuns(result.value, tz, 5, now) : []),
    [result, tz, now],
  );

  const parsed = result.ok ? result.value : null;
  const error = result.ok ? null : result.error;

  return (
    <div className="bg-facet-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
      {/* Expression input. The field legend sits directly under it so the five
          positions are readable while you type. */}
      <div className="bg-facet-2 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="cron-in"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
          >
            cron expression
          </label>
          <label className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">zone</span>
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="bg-navy px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:ring-1 focus:ring-teal"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
        </div>

        <input
          id="cron-in"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="*/15 9-17 * * 1-5"
          className="mt-3 w-full bg-navy px-4 py-4 font-mono text-[22px] tracking-[0.08em] text-white outline-none placeholder:text-sub/40 focus:ring-1 focus:ring-teal sm:text-[26px]"
        />

        <div className="mt-2 grid grid-cols-5 gap-2">
          {FIELD_LABELS.map((f) => (
            <div
              key={f.name}
              className={`border-t-2 pt-2 transition-colors ${
                error?.field === f.name ? "border-coral" : "border-line"
              }`}
            >
              <p
                className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                  error?.field === f.name ? "text-coral" : "text-sub"
                }`}
              >
                {f.title}
              </p>
              <p className="font-mono text-[10px] text-sub/60">{f.range}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-sub">try:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setExpr(p.expr)}
              className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                expr === p.expr
                  ? "bg-facet-hover text-teal"
                  : "bg-navy text-muted hover:text-teal"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        {/* Description + field breakdown */}
        <div className="bg-facet-3 px-5 py-5 sm:px-7">
          {error ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">
                cannot parse
              </p>
              <p className="mt-3 font-display text-[19px] leading-snug tracking-[-0.02em] text-white">
                {error.message}
              </p>
              {error.hint && (
                <p className="mt-3 font-mono text-[12.5px] leading-relaxed text-sub">{error.hint}</p>
              )}
            </div>
          ) : parsed ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
                in plain english
              </p>
              <p className="mt-3 font-display text-[24px] font-medium leading-snug tracking-[-0.025em] text-white sm:text-[27px]">
                {parsed.description}
              </p>

              {parsed.normalized !== expr.trim().toLowerCase() && (
                <p className="mt-3 font-mono text-[11.5px] text-teal">
                  expands to {parsed.normalized}
                </p>
              )}

              <div className="mt-6">
                {FIELD_LABELS.map((f) => {
                  const field = parsed.fields[f.name];
                  return (
                    <div
                      key={f.name}
                      className="flex items-baseline justify-between gap-4 border-t border-line/60 py-2.5"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-sub">
                        {f.title}
                      </span>
                      <span className="flex items-baseline gap-3">
                        <code className="font-mono text-[12px] text-teal">{field.raw}</code>
                        <span className="font-mono text-[12px] text-muted">
                          {field.wildcard ? "every" : summarize(field.values)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(parsed.normalized);
                  setCopied(true);
                }}
                className={`mt-5 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors ${
                  copied ? "text-teal" : "text-sub hover:text-teal"
                }`}
              >
                {copied ? "copied" : "copy expression"}
              </button>
            </>
          ) : null}
        </div>

        {/* Next runs */}
        <div className="bg-facet-2 px-5 py-5 sm:px-7">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">next 5 runs</p>
            {parsed?.frequent && (
              <span className="font-mono text-[11px] text-[#ffbb44]">runs often</span>
            )}
          </div>

          {runs.length ? (
            <div className="mt-3">
              {runs.map((ms, i) => (
                <div
                  key={ms}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line/60 py-3"
                >
                  <span className="font-mono text-[13.5px] text-white">{formatRun(ms, tz)}</span>
                  <span
                    className={`font-mono text-[11.5px] ${i === 0 ? "text-teal" : "text-sub"}`}
                  >
                    {relativeTime(ms, now)}
                  </span>
                </div>
              ))}
              <p className="mt-4 font-mono text-[11px] text-sub">
                computed in {tz} · nothing sent anywhere
              </p>
            </div>
          ) : (
            <div className="mt-3 border-t border-line/60 py-6">
              <p className="font-mono text-[12.5px] leading-relaxed text-coral">
                {error
                  ? "fix the expression to see run times"
                  : "This schedule never fires. Check for an impossible date, like the 30th of February."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
