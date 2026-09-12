export type Unit = "s" | "ms" | "us" | "ns";

export type Detected = { unit: Unit; ms: number } | null;

export function detectUnit(raw: string): Detected {
  const cleaned = raw.trim().replace(/[_,\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  const digits = cleaned.replace(/^-/, "").split(".")[0].length;

  if (digits >= 18) return { unit: "ns", ms: n / 1e6 };
  if (digits >= 15) return { unit: "us", ms: n / 1e3 };
  if (digits >= 12) return { unit: "ms", ms: n };
  return { unit: "s", ms: n * 1000 };
}

export const UNIT_LABELS: Record<Unit, string> = {
  s: "seconds",
  ms: "milliseconds",
  us: "microseconds",
  ns: "nanoseconds",
};

export function renderAll(ms: number, tz: string) {
  const d = new Date(ms);

  return {
    iso: d.toISOString(),
    isoLocal: isoInZone(d, tz),
    human: formatIn(d, tz, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    rfc: d.toUTCString(),
    seconds: Math.floor(ms / 1000),
    millis: Math.round(ms),
    relative: relativeTime(ms),
    offset: offsetLabel(d, tz),
  };
}

export function relativeTime(ms: number, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diff = ms - now;
  const abs = Math.abs(diff);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1000],
  ];

  for (const [unit, size] of units) {
    if (abs >= size) return rtf.format(Math.round(diff / size), unit);
  }
  return "just now";
}

export function zonedToEpoch(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  tz: string,
): number {
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  let guess = asUtc - offsetMs(new Date(asUtc), tz);
  guess = asUtc - offsetMs(new Date(guess), tz);
  return guess;
}

export function isNonexistent(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  tz: string,
): boolean {
  const ms = zonedToEpoch({ ...parts, second: 0 }, tz);
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return get("hour") % 24 !== parts.hour || get("minute") !== parts.minute;
}

export function parseDateInput(
  text: string,
  tz: string,
): { ms: number; assumedZone: boolean; nonexistent: boolean } | null {
  const s = text.trim();
  if (!s) return null;
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : { ms: t, assumedZone: false, nonexistent: false };
  }

  const m =
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);

  if (m) {
    const parts = {
      year: +m[1],
      month: +m[2],
      day: +m[3],
      hour: +(m[4] ?? 0),
      minute: +(m[5] ?? 0),
      second: +(m[6] ?? 0),
    };
    return {
      ms: zonedToEpoch(parts, tz),
      assumedZone: true,
      nonexistent: isNonexistent(parts, tz),
    };
  }

  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;

  const d = new Date(t);
  const parts = {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
  };
  return {
    ms: zonedToEpoch(parts, tz),
    assumedZone: true,
    nonexistent: isNonexistent(parts, tz),
  };
}

export function zoneOptions(): string[] {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const base = [
    "UTC",
    "America/Los_Angeles",
    "America/Chicago",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
  return base.includes(local) ? base : [local, ...base];
}

export const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

function offsetMs(at: Date, tz: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const hour = get("hour") % 24;

  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return wall - at.getTime();
}

function offsetLabel(at: Date, tz: string): string {
  const mins = Math.round(offsetMs(at, tz) / 60000);
  const sign = mins < 0 ? "-" : "+";
  const abs = Math.abs(mins);
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value ?? tz;

  return `${name} · UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function isoInZone(at: Date, tz: string): string {
  const mins = Math.round(offsetMs(at, tz) / 60000);
  const shifted = new Date(at.getTime() + mins * 60000);
  const sign = mins < 0 ? "-" : "+";
  const abs = Math.abs(mins);
  const off =
    mins === 0
      ? "Z"
      : `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;

  return shifted.toISOString().slice(0, 19) + off;
}

function formatIn(at: Date, tz: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: tz }).format(at);
}
