// Cron expression parsing, plain-English description, and next-run calculation.
// Dependency-free, and timezone-aware through Intl rather than a date library.
//
// The subtle part is not the syntax, it is the day-of-month / day-of-week rule:
// when BOTH fields are restricted, cron matches a day if EITHER field matches,
// not both. Almost every naive implementation gets this backwards.

export type FieldName = "minute" | "hour" | "dom" | "month" | "dow";

export type Field = {
  name: FieldName;
  /** Every value this field matches, sorted. */
  values: number[];
  /** True when the field was "*" (or an equivalent full range). */
  wildcard: boolean;
  raw: string;
};

export type CronError = {
  message: string;
  /** Which of the five fields failed, when known. */
  field: FieldName | null;
  hint: string | null;
};

export type Parsed = {
  fields: Record<FieldName, Field>;
  /** Normalised five-field expression. */
  normalized: string;
  description: string;
  /** True when the schedule fires more than once an hour. */
  frequent: boolean;
};

export type ParseResult = { ok: true; value: Parsed } | { ok: false; error: CronError };

const RANGES: Record<FieldName, [number, number]> = {
  minute: [0, 59],
  hour: [0, 23],
  dom: [1, 31],
  month: [1, 12],
  dow: [0, 6],
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Named shorthands accepted by most cron implementations. */
export const ALIASES: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export function parseCron(input: string): ParseResult {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return fail("Enter a cron expression", null, null);

  if (trimmed === "@reboot") {
    return fail("@reboot has no schedule — it runs once when the machine starts", null, null);
  }

  const expanded = ALIASES[trimmed] ?? trimmed;
  const parts = expanded.split(/\s+/);

  if (parts.length === 6 || parts.length === 7) {
    return fail(
      `This has ${parts.length} fields. Standard cron takes 5; a leading seconds field or trailing year is a Quartz or Spring extension.`,
      null,
      "Drop the extra field, or use the tool for that specific scheduler.",
    );
  }
  if (parts.length !== 5) {
    return fail(
      `A cron expression has 5 fields, this one has ${parts.length}`,
      null,
      "Order is: minute hour day-of-month month day-of-week.",
    );
  }

  const names: FieldName[] = ["minute", "hour", "dom", "month", "dow"];
  const fields = {} as Record<FieldName, Field>;

  for (let i = 0; i < 5; i += 1) {
    const parsed = parseField(names[i], parts[i]);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    fields[names[i]] = parsed.field;
  }

  const value: Parsed = {
    fields,
    normalized: parts.join(" "),
    description: describe(fields),
    frequent: fields.minute.values.length > 1,
  };

  return { ok: true, value };
}

/**
 * The next N times the schedule fires, as epoch milliseconds.
 *
 * Walks forward minute by minute from `from`, in the given timezone, skipping
 * whole days and hours when they cannot match. Capped so a schedule like
 * "0 0 30 2 *" (30 February, which never occurs) terminates instead of looping.
 */
export function nextRuns(parsed: Parsed, tz: string, count = 5, from = Date.now()): number[] {
  const out: number[] = [];
  const { fields } = parsed;

  // Start at the next whole minute.
  let cursor = Math.floor(from / 60000) * 60000 + 60000;
  const limit = from + 5 * 366 * 24 * 60 * 60 * 1000;

  while (out.length < count && cursor < limit) {
    const p = partsIn(cursor, tz);

    if (!fields.month.values.includes(p.month)) {
      // Jump to the first minute of the next month.
      cursor = startOfNextMonth(cursor, tz);
      continue;
    }
    if (!matchesDay(fields, p.dom, p.dow)) {
      cursor = startOfNextDay(cursor, tz);
      continue;
    }
    if (!fields.hour.values.includes(p.hour)) {
      cursor += 60000;
      continue;
    }
    if (!fields.minute.values.includes(p.minute)) {
      cursor += 60000;
      continue;
    }

    out.push(cursor);
    cursor += 60000;
  }

  return out;
}

/**
 * The day-of-month / day-of-week intersection rule from the crontab spec:
 * if both fields are restricted, a day matches when EITHER does.
 */
export function matchesDay(
  fields: Record<FieldName, Field>,
  dom: number,
  dow: number,
): boolean {
  const domMatch = fields.dom.values.includes(dom);
  const dowMatch = fields.dow.values.includes(dow);

  if (fields.dom.wildcard && fields.dow.wildcard) return true;
  if (fields.dom.wildcard) return dowMatch;
  if (fields.dow.wildcard) return domMatch;
  return domMatch || dowMatch;
}

// --- field parsing ----------------------------------------------------------

function parseField(
  name: FieldName,
  raw: string,
): { field: Field } | { error: CronError } {
  const [min, max] = RANGES[name];
  const values = new Set<number>();

  for (const piece of raw.split(",")) {
    if (!piece) {
      return {
        error: {
          message: `Empty entry in the ${label(name)} field`,
          field: name,
          hint: "Remove the stray comma.",
        },
      };
    }

    // step: <range>/<n>
    const [rangePart, stepPart, ...extra] = piece.split("/");
    if (extra.length) {
      return {
        error: {
          message: `Too many slashes in the ${label(name)} field`,
          field: name,
          hint: "A step looks like */5 or 10-30/5.",
        },
      };
    }

    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) === 0) {
        return {
          error: {
            message: `"${stepPart}" is not a valid step in the ${label(name)} field`,
            field: name,
            hint: "A step must be a positive whole number, as in */15.",
          },
        };
      }
      step = Number(stepPart);
    }

    let lo: number;
    let hi: number;

    if (rangePart === "*") {
      lo = min;
      hi = max;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-");
      const av = toNumber(a, name);
      const bv = toNumber(b, name);
      if (av === null || bv === null) {
        return { error: badValue(rangePart, name) };
      }
      lo = av;
      hi = bv;
      // Wrapping ranges like fri-mon are legal in the day and month fields.
      if (lo > hi) {
        for (let v = lo; v <= max; v += step) values.add(v);
        for (let v = min; v <= hi; v += step) values.add(v);
        continue;
      }
    } else {
      const v = toNumber(rangePart, name);
      if (v === null) return { error: badValue(rangePart, name) };
      lo = v;
      hi = stepPart !== undefined ? max : v;
    }

    if (lo < min || hi > max) {
      return {
        error: {
          message: `${label(name)} must be between ${min} and ${max}, got ${lo > max ? lo : hi}`,
          field: name,
          hint:
            name === "dow"
              ? "Day of week is 0-6 with 0 = Sunday. Some systems also accept 7 for Sunday."
              : null,
        },
      };
    }

    for (let v = lo; v <= hi; v += step) values.add(v);
  }

  if (!values.size) return { error: badValue(raw, name) };

  const sorted = [...values].sort((a, b) => a - b);
  const full = sorted.length === max - min + 1;

  return {
    field: {
      name,
      values: sorted,
      // "*" and "0-59" describe the same set, and both read as "every".
      wildcard: raw === "*" || full,
      raw,
    },
  };
}

/** Accepts numbers, three-letter month and day names, and 7 for Sunday. */
function toNumber(token: string, name: FieldName): number | null {
  const t = token.trim();
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    // Sunday is both 0 and 7 in most crons.
    if (name === "dow" && n === 7) return 0;
    return n;
  }
  if (name === "month") {
    const i = MONTHS.indexOf(t.slice(0, 3));
    return i === -1 ? null : i + 1;
  }
  if (name === "dow") {
    const i = DAYS.indexOf(t.slice(0, 3));
    return i === -1 ? null : i;
  }
  return null;
}

function badValue(token: string, name: FieldName): CronError {
  const extras: Record<string, string> = {
    L: "L (last) is a Quartz extension, not standard cron.",
    W: "W (nearest weekday) is a Quartz extension, not standard cron.",
    "?": "? is a Quartz extension; standard cron uses * instead.",
  };
  const flag = Object.keys(extras).find((k) => token.toUpperCase().includes(k));

  return {
    message: `"${token}" is not valid in the ${label(name)} field`,
    field: name,
    hint: flag ? extras[flag] : "Use numbers, ranges (1-5), lists (1,3,5), or steps (*/10).",
  };
}

const label = (n: FieldName) =>
  ({ minute: "minute", hour: "hour", dom: "day of month", month: "month", dow: "day of week" })[n];

// --- description ------------------------------------------------------------

function describe(f: Record<FieldName, Field>): string {
  const time = describeTime(f.minute, f.hour);
  const day = describeDay(f.dom, f.dow);
  const month = f.month.wildcard ? "" : `in ${list(f.month.values.map((m) => MONTH_NAMES[m - 1]))}`;

  // "every day" is implied by an unrestricted day field, so leave it out
  // rather than padding every description with it.
  const parts = [time, day, month].filter(Boolean);
  return capitalize(parts.join(", ").replace(/\s+/g, " ").trim());
}

function describeTime(minute: Field, hour: Field): string {
  const everyMinute = minute.wildcard;
  const everyHour = hour.wildcard;

  if (everyMinute && everyHour) return "every minute";

  const minuteStep = stepOf(minute, 0, 59);
  const hourStep = stepOf(hour, 0, 23);

  if (everyMinute && !everyHour) {
    return `every minute ${hourWindow(hour, hourStep)}`;
  }

  if (minuteStep && everyHour) {
    return `every ${minuteStep} minutes`;
  }

  if (minuteStep && !everyHour) {
    return `every ${minuteStep} minutes ${hourWindow(hour, hourStep)}`;
  }

  // Specific minutes.
  if (everyHour) {
    return minute.values.length === 1 && minute.values[0] === 0
      ? "every hour, on the hour"
      : `at ${list(minute.values.map((m) => `:${pad(m)}`))} past every hour`;
  }

  if (hourStep) {
    const at = minute.values.length === 1 && minute.values[0] === 0
      ? "on the hour"
      : `at ${list(minute.values.map((m) => `:${pad(m)}`))} past the hour`;
    return `every ${hourStep} hours, ${at}`;
  }

  // Fully specific: enumerate the clock times, unless that would be absurd.
  const times = hour.values.flatMap((h) => minute.values.map((m) => clock(h, m)));
  if (times.length <= 6) return `at ${list(times)}`;

  return `at ${list(minute.values.map((m) => `:${pad(m)}`))} past ${list(
    hour.values.map((h) => clock(h, 0).replace(":00", "")),
  )}`;
}

function hourWindow(hour: Field, step: number | null): string {
  if (step) return `of every ${step} hours`;
  if (hour.values.length === 1) return `of the ${clock(hour.values[0], 0).replace(":00", "")} hour`;

  // A contiguous run reads much better as a range.
  const contiguous = hour.values.every((v, i) => i === 0 || v === hour.values[i - 1] + 1);
  if (contiguous && hour.values.length > 2) {
    const a = clock(hour.values[0], 0).replace(":00", "");
    const b = clock(hour.values[hour.values.length - 1], 0).replace(":00", "");
    return `between ${a} and ${b}`;
  }

  return `of the ${list(hour.values.map((h) => clock(h, 0).replace(":00", "")))} hours`;
}

function describeDay(dom: Field, dow: Field): string {
  const anyDom = dom.wildcard;
  const anyDow = dow.wildcard;

  if (anyDom && anyDow) return "";

  const domStep = stepOf(dom, 1, 31);
  const dowStep = stepOf(dow, 0, 6);

  const domText = domStep ? `every ${ordinal(domStep)} day` : `on the ${list(dom.values.map(ordinal))}`;
  const dowText = dowStep ? `every ${ordinal(dowStep)} weekday` : `on ${dayList(dow.values)}`;

  // Both restricted: cron ORs them, which is worth spelling out explicitly.
  if (!anyDom && !anyDow) return `${domText} and ${dowText}, whichever matches`;

  return anyDom ? dowText : domText;
}

/** "Monday through Friday" beats listing five day names. */
function dayList(values: number[]): string {
  const contiguous = values.every((v, i) => i === 0 || v === values[i - 1] + 1);
  if (contiguous && values.length > 2) {
    return `${DAY_NAMES[values[0]]} through ${DAY_NAMES[values[values.length - 1]]}`;
  }
  return list(values.map((d) => DAY_NAMES[d]));
}

// Returns the step size when a field was written as a step over the whole
// range, such as a star followed by slash five.
//
// This inspects the raw text rather than inferring from the value set, because
// the two are not equivalent: on the day-of-week field, "6,0" and a star-slash-6
// step both resolve to {0, 6}, but only the step means "every 6 days".
function stepOf(field: Field, min: number, max: number): number | null {
  const m = /^\*\/(\d+)$/.exec(field.raw);
  if (!m) return null;

  const gap = Number(m[1]);
  if (gap < 2 || gap > max - min) return null;
  return gap;
}

// --- formatting helpers -----------------------------------------------------

function clock(h: number, m: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function list(items: (string | number)[]): string {
  const a = items.map(String);
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function fail(message: string, field: FieldName | null, hint: string | null): ParseResult {
  return { ok: false, error: { message, field, hint } };
}

// --- timezone helpers -------------------------------------------------------

/** Wall-clock parts of an instant, in a given zone. */
export function partsIn(ms: number, tz: string) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(ms));

  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const weekday = get("weekday").toLowerCase().slice(0, 3);

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    dom: Number(get("day")),
    // Intl renders midnight as hour 24 in some engines; normalize it.
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    dow: Math.max(0, DAYS.indexOf(weekday)),
  };
}

export function formatRun(ms: number, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

function startOfNextDay(ms: number, tz: string): number {
  const p = partsIn(ms, tz);
  // Advance past the remainder of this local day, then align to the minute.
  const remaining = (23 - p.hour) * 3600000 + (60 - p.minute) * 60000;
  return Math.floor((ms + remaining) / 60000) * 60000;
}

function startOfNextMonth(ms: number, tz: string): number {
  let cursor = ms;
  const start = partsIn(ms, tz).month;
  // Step a day at a time: cheap, and correct across DST and month lengths.
  for (let i = 0; i < 32; i += 1) {
    cursor = startOfNextDay(cursor, tz);
    if (partsIn(cursor, tz).month !== start) break;
  }
  return cursor;
}
