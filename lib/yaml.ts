export type YamlValue =
  | null
  | boolean
  | number
  | string
  | YamlValue[]
  | { [k: string]: YamlValue };

export type YamlError = { message: string; line: number; excerpt: string; hint: string | null };

export type ParseResult =
  | { ok: true; value: YamlValue; documents: YamlValue[] }
  | { ok: false; error: YamlError };

export function parseYaml(src: string): ParseResult {
  try {
    const docs = new YamlParser(src).parseStream();
    return { ok: true, value: docs.length === 1 ? docs[0] : docs, documents: docs };
  } catch (e) {
    if (e instanceof YamlSyntaxError) return { ok: false, error: e.detail };
    throw e;
  }
}

export type EmitOptions = {
  indent: number;
  blockStrings: boolean;
  quoteAll: boolean;
};

export const EMIT_DEFAULTS: EmitOptions = { indent: 2, blockStrings: true, quoteAll: false };

export function toYaml(value: YamlValue, opts: EmitOptions = EMIT_DEFAULTS): string {
  const lines = emit(value, 0, opts);
  return lines.length ? `${lines.join("\n")}\n` : "";
}

export type Stats = { keys: number; depth: number; anchors: number; documents: number };

export function stats(src: string, value: YamlValue, documents: number): Stats {
  let keys = 0;
  let depth = 0;

  const walk = (v: YamlValue, d: number) => {
    depth = Math.max(depth, d);
    if (Array.isArray(v)) {
      v.forEach((x) => walk(x, d + 1));
    } else if (v && typeof v === "object") {
      for (const k of Object.keys(v)) {
        keys += 1;
        walk((v as Record<string, YamlValue>)[k], d + 1);
      }
    }
  };

  walk(value, 1);
  return {
    keys,
    depth,
    anchors: (src.match(/(^|\s)&[A-Za-z0-9_-]+/g) ?? []).length,
    documents,
  };
}

class YamlSyntaxError extends Error {
  constructor(public detail: YamlError) {
    super(detail.message);
  }
}

type Line = {
  text: string;
  raw: string;
  indent: number;
  n: number;
  blank: boolean;
};

class YamlParser {
  lines: Line[] = [];
  anchors = new Map<string, YamlValue>();
  raw: string[];

  constructor(src: string) {
    this.raw = src.replace(/\r\n?/g, "\n").split("\n");
  }

  parseStream(): YamlValue[] {
    const groups: string[][] = [[]];
    for (const line of this.raw) {
      if (/^---\s*(#.*)?$/.test(line)) {
        if (groups[groups.length - 1].length) groups.push([]);
        continue;
      }
      if (/^\.\.\.\s*$/.test(line)) {
        groups.push([]);
        continue;
      }
      groups[groups.length - 1].push(line);
    }

    const docs: YamlValue[] = [];
    for (const g of groups) {
      const body = g.filter((l) => l.trim() !== "" || true);
      if (!body.some((l) => l.trim() && !l.trim().startsWith("#"))) continue;

      this.anchors = new Map();
      this.lines = this.prepare(body, this.raw.indexOf(g[0] ?? "") + 1);

      const first = this.lines.findIndex((l) => !l.blank && l.text.trim());
      docs.push(first === -1 ? null : this.parseBlock(first, this.lines[first].indent)[0]);
    }

    return docs.length ? docs : [null];
  }

  prepare(body: string[], offset: number): Line[] {
    return body.map((raw, idx) => {
      if (/^ *\t/.test(raw)) {
        this.fail("YAML forbids tabs for indentation — use spaces", offset + idx, raw);
      }

      const text = stripComment(raw).trimEnd();
      return {
        text,
        raw: raw.trimEnd(),
        indent: raw.length - raw.trimStart().length,
        n: offset + idx,
        blank: raw.trim() === "",
      };
    });
  }

  parseBlock(i: number, indent: number): [YamlValue, number] {
    let j = i;
    while (j < this.lines.length && (this.lines[j].blank || !this.lines[j].text.trim())) j += 1;
    if (j >= this.lines.length) return [null, j];
    const line = this.lines[j];
    i = j;

    if (line.indent < indent) return [null, i];
    if (/^-(\s|$)/.test(line.text.trim())) return this.parseSequence(i, line.indent);
    if (!splitKey(line.text.trim()) && this.nextContent(i + 1) === -1) {
      const block = this.tryBlockScalar(line.text.trim(), i + 1, line.indent - 1);
      if (block) return block;
      return [this.resolveScalar(line.text.trim(), line), i + 1];
    }

    return this.parseMapping(i, line.indent);
  }

  parseSequence(start: number, indent: number): [YamlValue[], number] {
    const items: YamlValue[] = [];
    let i = start;

    while (i < this.lines.length) {
      const line = this.lines[i];
      if (line.blank || !line.text.trim()) {
        i += 1;
        continue;
      }
      if (line.indent < indent) break;
      if (line.indent > indent) {
        this.fail("Unexpected indentation inside a sequence", line.n, line.text);
      }

      const t = line.text.trim();
      if (!/^-(\s|$)/.test(t)) break;

      const rest = t.slice(1).trim();
      i += 1;

      if (!rest) {
        const k = this.nextContent(i);
        if (k !== -1 && this.lines[k].indent > indent) {
          const [v, next] = this.parseBlock(k, this.lines[k].indent);
          items.push(v);
          i = next;
        } else {
          items.push(null);
        }
        continue;
      }

      if (splitKey(rest) || /^-(\s|$)/.test(rest)) {
        const [value, next] = this.parseInlineNode(rest, indent + 2, i, line);
        items.push(value);
        i = next;
        continue;
      }

      const [anchor, body] = takeAnchor(rest);
      const block = this.tryBlockScalar(body, i, indent);
      if (block) {
        const [text, next] = block;
        if (anchor) this.anchors.set(anchor, text);
        items.push(text);
        i = next;
        continue;
      }

      const v = this.resolveScalar(body, line);
      if (anchor) this.anchors.set(anchor, v);
      items.push(v);
    }

    return [items, i];
  }

  parseInlineNode(
    rest: string,
    indent: number,
    i: number,
    line: Line,
  ): [YamlValue, number] {
    const virtual: Line[] = [
      { text: rest, raw: rest, indent, n: line.n, blank: false },
    ];
    let j = i;

    while (j < this.lines.length) {
      const l = this.lines[j];
      if (l.blank) {
        const k = this.nextContent(j);
        if (k === -1 || this.lines[k].indent < indent) break;
        virtual.push(l);
        j += 1;
        continue;
      }
      if (l.indent < indent) break;
      virtual.push(l);
      j += 1;
    }

    const sub = new YamlParser("");
    sub.lines = virtual;
    sub.anchors = this.anchors;
    const [value] = sub.parseBlock(0, indent);
    return [value, j];
  }

  parseMapping(start: number, indent: number): [YamlValue, number] {
    const map: Record<string, YamlValue> = {};
    let i = start;

    while (i < this.lines.length) {
      const line = this.lines[i];
      if (line.blank || !line.text.trim()) {
        i += 1;
        continue;
      }
      if (line.indent < indent) break;
      if (line.indent > indent) {
        this.fail("Unexpected indentation — this line is indented too far", line.n, line.text);
      }

      const t = line.text.trim();
      if (/^-(\s|$)/.test(t)) break;

      const split = splitKey(t);
      if (!split) {
        this.fail(
          'Expected "key: value" — a mapping entry needs a colon followed by a space',
          line.n,
          line.text,
        );
      }

      const [rawKey, rawValue] = split;
      const key = unquoteKey(rawKey);
      i += 1;

      if (key === "<<") {
        const merged = this.resolveScalar(rawValue, line);
        for (const m of Array.isArray(merged) ? merged : [merged]) {
          if (m && typeof m === "object" && !Array.isArray(m)) Object.assign(map, m);
        }
        continue;
      }

      const [anchor, body] = takeAnchor(rawValue);

      if (!body) {
        const k = this.nextContent(i);
        if (k !== -1 && this.lines[k].indent > indent) {
          const [v, next] = this.parseBlock(k, this.lines[k].indent);
          map[key] = v;
          if (anchor) this.anchors.set(anchor, v);
          i = next;
        } else {
          map[key] = null;
          if (anchor) this.anchors.set(anchor, null);
        }
        continue;
      }

      const block = this.tryBlockScalar(body, i, indent);
      if (block) {
        const [text, next] = block;
        map[key] = text;
        if (anchor) this.anchors.set(anchor, text);
        i = next;
        continue;
      }

      const v = this.resolveScalar(body, line);
      map[key] = v;
      if (anchor) this.anchors.set(anchor, v);
    }

    return [map, i];
  }

  tryBlockScalar(body: string, i: number, indent: number): [string, number] | null {
    const m = /^([|>])([-+]?)(\d*)\s*$/.exec(body.trim());
    if (!m) return null;

    const folded = m[1] === ">";
    const chomp = m[2];
    const collected: string[] = [];
    let j = i;
    let blockIndent = m[3] ? indent + Number(m[3]) : -1;

    while (j < this.lines.length) {
      const line = this.lines[j];

      if (line.blank) {
        const k = this.nextContent(j);
        if (k === -1 || this.lines[k].indent <= indent) break;
        collected.push("");
        j += 1;
        continue;
      }

      if (line.indent <= indent) break;
      if (blockIndent < 0) blockIndent = line.indent;
      collected.push(line.raw.slice(blockIndent));
      j += 1;
    }

    let text = folded ? foldLines(collected) : `${collected.join("\n")}\n`;

    if (chomp === "-") text = text.replace(/\n+$/, "");
    else if (chomp === "+") text = text.replace(/\n*$/, "\n");
    else text = `${text.replace(/\n+$/, "")}\n`;

    return [text, j];
  }

  nextContent(from: number): number {
    for (let k = from; k < this.lines.length; k += 1) {
      if (!this.lines[k].blank && this.lines[k].text.trim()) return k;
    }
    return -1;
  }

  resolveScalar(raw: string, line: Line): YamlValue {
    const s = raw.trim();
    if (!s) return null;

    if (s.startsWith("*")) {
      const name = s.slice(1).trim();
      if (!this.anchors.has(name)) {
        this.fail(`Unknown alias *${name} — no anchor &${name} was defined above`, line.n, line.text);
      }
      return this.anchors.get(name)!;
    }

    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        return parseFlow(s);
      } catch {
        this.fail("Malformed flow collection — check the brackets and commas", line.n, line.text);
      }
    }

    return resolveScalarText(s);
  }

  fail(message: string, n: number, excerpt: string): never {
    throw new YamlSyntaxError({
      message,
      line: n,
      excerpt: excerpt.length > 110 ? `${excerpt.slice(0, 107)}…` : excerpt,
      hint: hintFor(message),
    });
  }
}

function hintFor(message: string): string | null {
  if (message.includes("tabs")) return "Replace leading tabs with spaces (two per level is typical).";
  if (message.includes("indented too far")) return "Align this line with its siblings.";
  if (message.includes("key: value")) return 'Every mapping line needs "name: value", with the space.';
  if (message.includes("Unknown alias")) return "Anchors must appear before the alias that uses them.";
  if (message.includes("flow collection")) return "Flow style looks like [a, b] or {k: v}.";
  return null;
}

function splitKey(line: string): [string, string] | null {
  let quote: string | null = null;
  let depth = 0;

  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];

    if (quote) {
      if (c === "\\") i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "[" || c === "{") depth += 1;
    if (c === "]" || c === "}") depth -= 1;
    if (c === ":" && depth === 0 && (i + 1 === line.length || /\s/.test(line[i + 1]))) {
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }
  }

  return null;
}

function takeAnchor(value: string): [string | null, string] {
  const m = /^&([A-Za-z0-9_-]+)\s*(.*)$/.exec(value.trim());
  return m ? [m[1], m[2].trim()] : [null, value.trim()];
}

function unquoteKey(key: string): string {
  const s = key.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return unquote(s);
  }
  return s;
}

function stripComment(line: string): string {
  let quote: string | null = null;

  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quote) {
      if (c === "\\") i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }

  return line;
}

function resolveScalarText(s: string): YamlValue {
  if (s.startsWith('"') || s.startsWith("'")) return unquote(s);

  if (s === "" || s === "~" || s === "null" || s === "Null" || s === "NULL") return null;
  if (s === "true" || s === "True" || s === "TRUE") return true;
  if (s === "false" || s === "False" || s === "FALSE") return false;
  if (s === ".inf" || s === ".Inf" || s === "+.inf") return Infinity;
  if (s === "-.inf" || s === "-.Inf") return -Infinity;
  if (s === ".nan" || s === ".NaN" || s === ".NAN") return NaN;

  if (/^[-+]?\d+$/.test(s)) return Number(s);
  if (/^0o[0-7]+$/.test(s)) return parseInt(s.slice(2), 8);
  if (/^0x[0-9a-fA-F]+$/.test(s)) return parseInt(s.slice(2), 16);
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s);

  return s;
}

function unquote(s: string): string {
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    return s
      .slice(1, -1)
      .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\x([0-9a-fA-F]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\0/g, "\0")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  return s;
}

function foldLines(lines: string[]): string {
  const chunks: string[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer) chunks.push(buffer);
    buffer = "";
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      chunks.push("");
      continue;
    }
    if (/^\s/.test(line)) {
      flush();
      chunks.push(line);
      continue;
    }
    buffer = buffer ? `${buffer} ${line}` : line;
  }
  flush();

  const out: string[] = [];
  for (let i = 0; i < chunks.length; i += 1) {
    if (chunks[i] === "" && i > 0 && i < chunks.length - 1) continue;
    out.push(chunks[i]);
  }

  return `${out.join("\n")}\n`;
}

function parseFlow(src: string): YamlValue {
  let i = 0;

  const ws = () => {
    while (i < src.length && /\s/.test(src[i])) i += 1;
  };

  const value = (): YamlValue => {
    ws();
    const c = src[i];

    if (c === "[") {
      i += 1;
      const arr: YamlValue[] = [];
      ws();
      if (src[i] === "]") {
        i += 1;
        return arr;
      }
      for (;;) {
        arr.push(value());
        ws();
        if (src[i] === ",") {
          i += 1;
          ws();
          if (src[i] === "]") {
            i += 1;
            return arr;
          }
          continue;
        }
        if (src[i] === "]") {
          i += 1;
          return arr;
        }
        throw new Error("expected , or ]");
      }
    }

    if (c === "{") {
      i += 1;
      const obj: Record<string, YamlValue> = {};
      ws();
      if (src[i] === "}") {
        i += 1;
        return obj;
      }
      for (;;) {
        ws();
        const k = String(scalar(true));
        ws();
        if (src[i] !== ":") throw new Error("expected :");
        i += 1;
        obj[k] = value();
        ws();
        if (src[i] === ",") {
          i += 1;
          ws();
          if (src[i] === "}") {
            i += 1;
            return obj;
          }
          continue;
        }
        if (src[i] === "}") {
          i += 1;
          return obj;
        }
        throw new Error("expected , or }");
      }
    }

    return scalar(false);
  };

  const scalar = (isKey: boolean): YamlValue => {
    ws();
    const c = src[i];

    if (c === '"' || c === "'") {
      const q = c;
      let out = q;
      i += 1;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") {
          out += src[i];
          i += 1;
        }
        out += src[i];
        i += 1;
      }
      i += 1;
      return unquote(`${out}${q}`);
    }

    const start = i;
    const stop = isKey ? /[:,\]}]/ : /[,\]}]/;
    while (i < src.length && !stop.test(src[i])) i += 1;
    const text = src.slice(start, i).trim();
    return isKey ? text : resolveScalarText(text);
  };

  const result = value();
  ws();
  if (i < src.length) throw new Error("trailing characters");
  return result;
}

function emit(value: YamlValue, depth: number, opts: EmitOptions): string[] {
  const pad = " ".repeat(depth * opts.indent);

  if (Array.isArray(value)) {
    if (!value.length) return [`${pad}[]`];

    const out: string[] = [];
    for (const item of value) {
      if (isContainer(item) && hasContent(item)) {
        const nested = emit(item, depth + 1, opts);
        out.push(`${pad}-${nested[0].slice(pad.length + opts.indent - 1)}`);
        out.push(...nested.slice(1));
      } else {
        out.push(`${pad}- ${scalarText(item, opts, depth + 1)}`);
      }
    }
    return out;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return [`${pad}{}`];

    const out: string[] = [];
    for (const [k, v] of entries) {
      const key = needsKeyQuote(k) ? JSON.stringify(k) : k;

      if (isContainer(v) && hasContent(v)) {
        out.push(`${pad}${key}:`);
        out.push(...emit(v, depth + 1, opts));
      } else {
        out.push(`${pad}${key}: ${scalarText(v, opts, depth + 1)}`);
      }
    }
    return out;
  }

  return [`${pad}${scalarText(value, opts, depth)}`];
}

function scalarText(v: YamlValue, opts: EmitOptions, depth: number): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return String(v);
  if (typeof v === "number") {
    if (Number.isNaN(v)) return ".nan";
    if (v === Infinity) return ".inf";
    if (v === -Infinity) return "-.inf";
    return String(v);
  }
  if (Array.isArray(v)) return "[]";
  if (typeof v === "object") return "{}";

  if (opts.blockStrings && v.includes("\n")) {
    const pad = " ".repeat(depth * opts.indent);
    const body = v
      .replace(/\n$/, "")
      .split("\n")
      .map((l) => `${pad}${l}`)
      .join("\n");
    return `|-\n${body}`;
  }

  return opts.quoteAll || needsQuote(v) ? JSON.stringify(v) : v;
}

function needsQuote(s: string): boolean {
  if (s === "") return true;
  if (s !== s.trim()) return true;
  if (/[\n\r\t]/.test(s)) return true;
  if (/^(null|Null|NULL|~|true|True|TRUE|false|False|FALSE|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF|y|Y|n|N)$/.test(s)) {
    return true;
  }
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return true;
  if (/^0[xo]/.test(s)) return true;
  if (/^\.(inf|Inf|INF|nan|NaN|NAN)$/.test(s)) return true;
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(s)) return true;
  if (/:\s/.test(s) || /\s#/.test(s)) return true;
  if (s.endsWith(":")) return true;
  if (/^\d+(:\d+)+$/.test(s)) return true;

  return false;
}

function needsKeyQuote(k: string): boolean {
  if (k === "" || needsQuote(k)) return true;
  if (/[:{}[\],&*#?|\-<>=!%@`'"]/.test(k[0])) return true;
  return /[:#]/.test(k);
}

const isContainer = (v: YamlValue) => Array.isArray(v) || (v !== null && typeof v === "object");
const hasContent = (v: YamlValue) =>
  Array.isArray(v) ? v.length > 0 : Object.keys(v as object).length > 0;
