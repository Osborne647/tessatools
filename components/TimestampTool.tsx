"use client";

import { useEffect, useMemo, useState } from "react";
import {
  UNIT_LABELS,
  detectUnit,
  localZone,
  parseDateInput,
  renderAll,
  zoneOptions,
} from "@/lib/timestamp";

type Direction = "from" | "to";

function Row({ label, value }: { label: string; value: string | number }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(String(value));
        setCopied(true);
      }}
      className="group flex w-full items-baseline justify-between gap-4 border-t border-line/60 py-3 text-left transition-colors hover:bg-facet-hover/40"
    >
      <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
        {label}
      </span>
      <span className="flex items-baseline gap-3">
        <span className="break-all font-mono text-[14px] text-white">{value}</span>
        <span
          className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
            copied ? "text-teal" : "text-transparent group-hover:text-sub"
          }`}
        >
          {copied ? "copied" : "copy"}
        </span>
      </span>
    </button>
  );
}

export default function TimestampTool() {
  const [direction, setDirection] = useState<Direction>("from");
  const [tz, setTz] = useState("UTC");
  const [epochInput, setEpochInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setTz(localZone());
    setEpochInput(String(Math.floor(Date.now() / 1000)));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const zones = useMemo(() => zoneOptions(), []);

  const detected = useMemo(() => detectUnit(epochInput), [epochInput]);
  const parsedDate = useMemo(
    () => (dateInput.trim() ? parseDateInput(dateInput, tz) : null),
    [dateInput, tz],
  );

  const activeMs = direction === "from" ? detected?.ms ?? null : parsedDate?.ms ?? null;
  const rendered = useMemo(
    () => (activeMs !== null && Number.isFinite(activeMs) ? renderAll(activeMs, tz) : null),
    [activeMs, tz],
  );

  const nowRendered = useMemo(() => renderAll(now, tz), [now, tz]);

  return (
    <div className="bg-facet-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-deep px-5 py-3 sm:px-7">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">now</span>
          <span className="font-mono text-[15px] text-teal">{nowRendered.seconds}</span>
          <span className="font-mono text-[12px] text-sub">{nowRendered.isoLocal}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setDirection("from");
            setEpochInput(String(Math.floor(Date.now() / 1000)));
          }}
          className="font-mono text-[12px] text-muted transition-colors hover:text-teal"
        >
          use now →
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-1 bg-navy p-1">
          <button
            type="button"
            onClick={() => setDirection("from")}
            aria-pressed={direction === "from"}
            className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
              direction === "from" ? "bg-teal text-navy" : "text-muted hover:text-white"
            }`}
          >
            epoch → date
          </button>
          <button
            type="button"
            onClick={() => setDirection("to")}
            aria-pressed={direction === "to"}
            className={`px-3.5 py-1.5 font-mono text-[12px] tracking-[0.1em] transition-colors ${
              direction === "to" ? "bg-teal text-navy" : "text-muted hover:text-white"
            }`}
          >
            date → epoch
          </button>
        </div>

        <label className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">zone</span>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="bg-navy px-3 py-2 font-mono text-[12.5px] text-white outline-none focus:ring-1 focus:ring-teal"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid md:grid-cols-2">
        {/* Input */}
        <div className="bg-facet-2 px-5 py-5 sm:px-7">
          {direction === "from" ? (
            <>
              <label
                htmlFor="epoch-in"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
              >
                unix timestamp
              </label>
              <input
                id="epoch-in"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
                spellCheck={false}
                inputMode="numeric"
                placeholder="1757601720"
                className="mt-3 w-full bg-navy px-4 py-3.5 font-mono text-[17px] text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
              />
              <p className="mt-3 font-mono text-[11.5px]">
                {epochInput.trim() === "" ? (
                  <span className="text-sub">paste seconds, millis, micros, or nanos</span>
                ) : detected ? (
                  <span className="text-teal">
                    read as {UNIT_LABELS[detected.unit]} · auto-detected from length
                  </span>
                ) : (
                  <span className="text-coral">that is not a number</span>
                )}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-sub">try:</span>
                {[
                  { label: "epoch zero", v: "0" },
                  { label: "seconds", v: "1757601720" },
                  { label: "millis", v: "1757601720000" },
                  { label: "y2k38", v: "2147483647" },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => setEpochInput(ex.v)}
                    className="bg-navy px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:text-teal"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <label
                htmlFor="date-in"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub"
              >
                date and time
              </label>
              <input
                id="date-in"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                spellCheck={false}
                placeholder="2026-09-11 08:42:00"
                className="mt-3 w-full bg-navy px-4 py-3.5 font-mono text-[17px] text-white outline-none placeholder:text-sub/50 focus:ring-1 focus:ring-teal"
              />
              <p className="mt-3 font-mono text-[11.5px]">
                {dateInput.trim() === "" ? (
                  <span className="text-sub">ISO, `YYYY-MM-DD HH:MM`, or a plain date</span>
                ) : !parsedDate ? (
                  <span className="text-coral">could not read that as a date</span>
                ) : parsedDate.nonexistent ? (
                  <span className="text-coral">
                    that clock time never existed in {tz} — daylight saving skipped it
                  </span>
                ) : parsedDate.assumedZone ? (
                  <span className="text-teal">interpreted in {tz}</span>
                ) : (
                  <span className="text-teal">offset was in the string, zone ignored</span>
                )}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-sub">try:</span>
                {[
                  { label: "iso", v: "2026-09-11T08:42:00" },
                  { label: "date only", v: "2026-12-25" },
                  { label: "with offset", v: "2026-09-11T08:42:00-05:00" },
                  { label: "dst gap", v: "2026-03-08 02:30:00" },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => setDateInput(ex.v)}
                    className="bg-navy px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:text-teal"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-facet-3 px-5 py-5 sm:px-7">
          {rendered ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-sub">
                  result
                </span>
                <span className="font-mono text-[11px] text-teal">{rendered.relative}</span>
              </div>

              <p className="mt-3 font-display text-[22px] font-medium leading-snug tracking-[-0.02em] text-white">
                {rendered.human}
              </p>
              <p className="mt-1.5 font-mono text-[11.5px] text-sub">{rendered.offset}</p>

              <div className="mt-5">
                <Row label="iso 8601" value={rendered.isoLocal} />
                <Row label="utc" value={rendered.iso} />
                <Row label="rfc 1123" value={rendered.rfc} />
                <Row label="seconds" value={rendered.seconds} />
                <Row label="millis" value={rendered.millis} />
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[240px] items-center">
              <p className="font-mono text-[12px] text-sub">
                {direction === "from"
                  ? "enter a timestamp to see every format"
                  : "enter a date to get its epoch value"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
