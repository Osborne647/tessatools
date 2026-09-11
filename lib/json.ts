// JSON parsing with precise diagnostics. Native JSON.parse throws messages
// that differ between V8, JavaScriptCore, and SpiderMonkey, and none of them
// reliably give a line and column. This hand-written parser does, so the tool
// can point at the exact character that broke.

export type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

export type ParseError = {
  message: string;
  line: number;
  column: number;
  /** Character offset, for highlighting. */
  index: number;
  /** The offending line, for showing context. */
  excerpt: string;
  /** Plain-language nudge toward the fix. */
  hint: string | null;
};

export type ParseResult =
  | { ok: true; value: JsonValue }
  | { ok: false; error: ParseError };

export function parseJson(text: string): ParseResult {
  const p = new Parser(text);
  try {
    p.skipWs();
    const value = p.parseValue();
    p.skipWs();
    if (p.i < p.s.length) p.fail(`Unexpected ${p.describe()} after the end of the JSON value`);
    return { ok: true, value };
  } catch (e) {
    if (e instanceof JsonSyntaxError) return { ok: false, error: e.detail };
    throw e;
  }
}

/** Pretty-print. `indent` of 0 means tabs. */
export function format(value: JsonValue, indent: number, sortKeys: boolean): string {
  const space = indent === 0 ? "\t" : indent;
  return JSON.stringify(sortKeys ? sortDeep(value) : value, null, space);
}

export function minify(value: JsonValue, sortKeys: boolean): string {
  return JSON.stringify(sortKeys ? sortDeep(value) : value);
}

/** Recursively orders object keys. Arrays keep their order: it is data. */
export function sortDeep(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    const out: { [k: string]: JsonValue } = {};
    for (const k of Object.keys(value).sort()) out[k] = sortDeep((value as Record<string, JsonValue>)[k]);
    return out;
  }
  return value;
}

export type Stats = { keys: number; values: number; depth: number; arrays: number; objects: number };

export function stats(value: JsonValue): Stats {
  const s: Stats = { keys: 0, values: 0, depth: 0, arrays: 0, objects: 0 };

  const walk = (v: JsonValue, d: number) => {
    s.depth = Math.max(s.depth, d);
    if (Array.isArray(v)) {
      s.arrays += 1;
      v.forEach((item) => walk(item, d + 1));
      return;
    }
    if (v && typeof v === "object") {
      s.objects += 1;
      for (const k of Object.keys(v)) {
        s.keys += 1;
        walk((v as Record<string, JsonValue>)[k], d + 1);
      }
      return;
    }
    s.values += 1;
  };

  walk(value, 1);
  return s;
}

export const byteLength = (text: string) => new TextEncoder().encode(text).length;

// ---------------------------------------------------------------------------

class JsonSyntaxError extends Error {
  constructor(public detail: ParseError) {
    super(detail.message);
  }
}

class Parser {
  i = 0;
  constructor(public s: string) {}

  parseValue(): JsonValue {
    this.skipWs();
    const c = this.s[this.i];

    if (c === undefined) this.fail("Unexpected end of input — the JSON is incomplete");
    if (c === "{") return this.parseObject();
    if (c === "[") return this.parseArray();
    if (c === '"') return this.parseString();
    if (c === "-" || (c >= "0" && c <= "9")) return this.parseNumber();
    if (this.s.startsWith("true", this.i)) return this.take(4, true);
    if (this.s.startsWith("false", this.i)) return this.take(5, false);
    if (this.s.startsWith("null", this.i)) return this.take(4, null);

    // The three most common paste-errors get named directly.
    if (c === "'") this.fail("Strings must use double quotes in JSON, not single quotes");
    if (this.s.startsWith("NaN", this.i) || this.s.startsWith("Infinity", this.i)) {
      this.fail("NaN and Infinity are not valid JSON numbers");
    }
    if (/[A-Za-z_$]/.test(c)) {
      this.fail("Unquoted keys and bare words are not valid JSON — wrap them in double quotes");
    }
    this.fail(`Unexpected ${this.describe()}`);
  }

  parseObject(): JsonValue {
    const out: { [k: string]: JsonValue } = {};
    this.i += 1; // {
    this.skipWs();

    if (this.s[this.i] === "}") {
      this.i += 1;
      return out;
    }

    for (;;) {
      this.skipWs();
      if (this.s[this.i] !== '"') {
        const c = this.s[this.i];
        if (c === "}") this.fail("Trailing comma — JSON does not allow one before }");
        if (c === undefined) this.fail("Unexpected end of input — this object is never closed");
        if (c === "'") this.fail("Strings must use double quotes in JSON, not single quotes");
        if (/[A-Za-z_$]/.test(c)) {
          this.fail("Unquoted keys and bare words are not valid JSON — wrap them in double quotes");
        }
        this.fail("Object keys must be double-quoted strings");
      }
      const key = this.parseString();
      this.skipWs();
      if (this.s[this.i] !== ":") this.fail(`Expected ":" after the key ${JSON.stringify(key)}`);
      this.i += 1;
      out[key] = this.parseValue();
      this.skipWs();

      const c = this.s[this.i];
      if (c === ",") {
        this.i += 1;
        continue;
      }
      if (c === "}") {
        this.i += 1;
        return out;
      }
      if (c === undefined) this.fail("Unexpected end of input — this object is never closed");
      this.fail(`Expected "," or "}" but found ${this.describe()}`);
    }
  }

  parseArray(): JsonValue {
    const out: JsonValue[] = [];
    this.i += 1; // [
    this.skipWs();

    if (this.s[this.i] === "]") {
      this.i += 1;
      return out;
    }

    for (;;) {
      this.skipWs();
      if (this.s[this.i] === "]") this.fail("Trailing comma — JSON does not allow one before ]");
      out.push(this.parseValue());
      this.skipWs();

      const c = this.s[this.i];
      if (c === ",") {
        this.i += 1;
        continue;
      }
      if (c === "]") {
        this.i += 1;
        return out;
      }
      if (c === undefined) this.fail("Unexpected end of input — this array is never closed");
      this.fail(`Expected "," or "]" but found ${this.describe()}`);
    }
  }

  parseString(): string {
    this.i += 1; // opening quote
    let out = "";

    for (;;) {
      const c = this.s[this.i];
      if (c === undefined) this.fail("Unexpected end of input — this string is never closed");
      if (c === '"') {
        this.i += 1;
        return out;
      }

      if (c === "\\") {
        this.i += 1;
        const e = this.s[this.i];
        if (e === undefined) this.fail("Unexpected end of input inside an escape sequence");
        if (e === "u") {
          const hex = this.s.slice(this.i + 1, this.i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.fail("\\u must be followed by four hex digits");
          out += String.fromCharCode(parseInt(hex, 16));
          this.i += 5;
          continue;
        }
        const simple: Record<string, string> = {
          '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t",
        };
        if (!(e in simple)) this.fail(`\\${e} is not a valid JSON escape sequence`);
        out += simple[e];
        this.i += 1;
        continue;
      }

      if (c === "\n") this.fail("Unescaped line break in a string — use \\n instead");
      // Raw control characters are illegal in JSON strings.
      if (c < " ") this.fail("Unescaped control character in a string");

      out += c;
      this.i += 1;
    }
  }

  parseNumber(): number {
    const start = this.i;
    if (this.s[this.i] === "-") this.i += 1;

    if (this.s[this.i] === "0" && /[0-9]/.test(this.s[this.i + 1] ?? "")) {
      this.fail("Numbers may not have leading zeros");
    }

    while (/[0-9]/.test(this.s[this.i] ?? "")) this.i += 1;

    if (this.s[this.i] === ".") {
      this.i += 1;
      if (!/[0-9]/.test(this.s[this.i] ?? "")) this.fail("Expected a digit after the decimal point");
      while (/[0-9]/.test(this.s[this.i] ?? "")) this.i += 1;
    }

    if (this.s[this.i] === "e" || this.s[this.i] === "E") {
      this.i += 1;
      if (this.s[this.i] === "+" || this.s[this.i] === "-") this.i += 1;
      if (!/[0-9]/.test(this.s[this.i] ?? "")) this.fail("Expected a digit in the exponent");
      while (/[0-9]/.test(this.s[this.i] ?? "")) this.i += 1;
    }

    const raw = this.s.slice(start, this.i);
    if (raw === "-" || raw === "") this.fail("Expected a number");
    return Number(raw);
  }

  take<T extends JsonValue>(n: number, value: T): T {
    this.i += n;
    return value;
  }

  skipWs() {
    for (;;) {
      const c = this.s[this.i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") {
        this.i += 1;
        continue;
      }
      // Comments are not JSON, but they are the single most common reason a
      // paste fails, so name them explicitly instead of "unexpected token".
      if (c === "/" && (this.s[this.i + 1] === "/" || this.s[this.i + 1] === "*")) {
        this.fail("Comments are not valid in JSON — strip them, or use JSONC");
      }
      return;
    }
  }

  describe(): string {
    const c = this.s[this.i];
    if (c === undefined) return "end of input";
    return `"${c}"`;
  }

  fail(message: string): never {
    const before = this.s.slice(0, this.i);
    const line = before.split("\n").length;
    const column = this.i - (before.lastIndexOf("\n") + 1) + 1;
    const excerpt = this.s.split("\n")[line - 1] ?? "";

    throw new JsonSyntaxError({
      message,
      line,
      column,
      index: this.i,
      excerpt: excerpt.length > 120 ? `${excerpt.slice(0, 117)}…` : excerpt,
      hint: hintFor(message),
    });
  }
}

function hintFor(message: string): string | null {
  if (message.includes("single quotes")) return 'Replace \' with " around strings and keys.';
  if (message.includes("Unquoted keys")) return 'JSON keys always need quotes: { "name": 1 }.';
  if (message.includes("Trailing comma")) return "Delete the last comma in the list.";
  if (message.includes("Comments")) return "Remove // and /* */ before parsing.";
  if (message.includes("never closed")) return "Check for a missing closing bracket or quote.";
  if (message.includes("NaN")) return "Use null, or a string, for non-finite numbers.";
  return null;
}
