// CSS minifier, hand-written and dependency-free.
//
// Minifying CSS looks like a regex job and is not. Every naive implementation
// breaks on the same handful of cases: a semicolon inside a data: URI, a brace
// inside a quoted content string, the mandatory spaces around operators in
// calc(), and the `>` in a child selector versus the `>` inside an attribute
// value. So this walks the stylesheet character by character, tracking whether
// it is inside a string, a comment, a url(), or a block.

export type Options = {
  /** Collapse #aabbcc to #abc and long rgb() to hex where exact. */
  shortenColors: boolean;
  /** Drop the unit from zero values, so 0px becomes 0. */
  stripZeroUnits: boolean;
  /** Keep comments that start with /*! — the license-header convention. */
  keepBangComments: boolean;
  /** Emit one rule per line instead of a single long line. */
  newlinePerRule: boolean;
};

export const DEFAULTS: Options = {
  shortenColors: true,
  stripZeroUnits: true,
  keepBangComments: true,
  newlinePerRule: false,
};

export type Result = {
  css: string;
  inBytes: number;
  outBytes: number;
  saved: number;
  savedPercent: number;
  rules: number;
  declarations: number;
  comments: number;
  /** Non-fatal things worth telling the user about. */
  notes: string[];
};

export function minify(src: string, opts: Options = DEFAULTS): Result {
  const notes: string[] = [];
  const counts = { comments: 0 };

  let css = stripComments(src, opts.keepBangComments, counts);
  css = collapseWhitespace(css);
  if (opts.stripZeroUnits) css = stripZeros(css);
  if (opts.shortenColors) css = shortenColors(css);
  css = tidyPunctuation(css);
  if (opts.newlinePerRule) css = css.replace(/\}/g, "}\n").trim();

  const inBytes = byteLength(src);
  const outBytes = byteLength(css);

  if (countUnbalanced(src) !== 0) {
    notes.push("Braces are unbalanced in the input — the output may be truncated.");
  }
  if (/@import/.test(src)) {
    notes.push("@import blocks rendering. Inline the file or use a bundler instead.");
  }

  return {
    css,
    inBytes,
    outBytes,
    saved: inBytes - outBytes,
    savedPercent: inBytes ? Math.round((1 - outBytes / inBytes) * 1000) / 10 : 0,
    rules: countRules(css),
    declarations: countDeclarations(css),
    comments: counts.comments,
    notes,
  };
}

/** Pretty-prints minified (or messy) CSS, for the reverse direction. */
export function beautify(src: string, indent = 2): string {
  const clean = collapseWhitespace(stripComments(src, true, { comments: 0 }));
  const pad = " ".repeat(indent);
  let depth = 0;
  let out = "";
  let i = 0;

  while (i < clean.length) {
    const c = clean[i];

    if (c === '"' || c === "'") {
      const [str, next] = readString(clean, i);
      out += str;
      i = next;
      continue;
    }

    if (c === "{") {
      depth += 1;
      out += ` {\n${pad.repeat(depth)}`;
      i += 1;
      continue;
    }

    if (c === "}") {
      depth = Math.max(0, depth - 1);
      out = out.replace(/\s+$/, "");
      out += `\n${pad.repeat(depth)}}\n${pad.repeat(depth)}`;
      i += 1;
      continue;
    }

    if (c === ";") {
      out += `;\n${pad.repeat(depth)}`;
      i += 1;
      continue;
    }

    if (c === ",") {
      // A comma between selectors gets its own line; inside a value it does not.
      out += depth === 0 ? ",\n" : ", ";
      i += 1;
      continue;
    }

    if (c === ":" && depth > 0) {
      out += ": ";
      i += 1;
      continue;
    }

    out += c;
    i += 1;
  }

  return out
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l, n, all) => l.trim() !== "" || (n > 0 && all[n - 1].trim() !== ""))
    .join("\n")
    .trim();
}

export const byteLength = (s: string) => new TextEncoder().encode(s).length;

// ---------------------------------------------------------------------------

/** Reads a quoted string whole, so its contents are never rewritten. */
function readString(src: string, start: number): [string, number] {
  const quote = src[start];
  let out = quote;
  let i = start + 1;

  while (i < src.length) {
    if (src[i] === "\\") {
      out += src.slice(i, i + 2);
      i += 2;
      continue;
    }
    out += src[i];
    if (src[i] === quote) {
      i += 1;
      break;
    }
    i += 1;
  }

  return [out, i];
}

/**
 * Reads a url(...) token whole. Unquoted URLs may contain semicolons, commas,
 * and braces — a base64 data: URI routinely contains all three — so none of
 * the later passes may touch the inside of one.
 */
function readUrl(src: string, start: number): [string, number] | null {
  if (!/^url\(/i.test(src.slice(start, start + 4))) return null;

  let i = start + 4;
  let out = src.slice(start, i);
  let quote: string | null = null;

  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === "\\") {
        out += src.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ")") {
      out += c;
      return [out, i + 1];
    }
    out += c;
    i += 1;
  }

  return [out, i];
}

function stripComments(src: string, keepBang: boolean, counts: { comments: number }): string {
  let out = "";
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === '"' || c === "'") {
      const [str, next] = readString(src, i);
      out += str;
      i = next;
      continue;
    }

    const url = readUrl(src, i);
    if (url) {
      out += url[0];
      i = url[1];
      continue;
    }

    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      counts.comments += 1;

      // /*! ... */ is the de facto marker for a license header that must survive.
      if (keepBang && src[i + 2] === "!") out += src.slice(i, stop);
      else out += " ";

      i = stop;
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}

function collapseWhitespace(src: string): string {
  let out = "";
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (c === '"' || c === "'") {
      const [str, next] = readString(src, i);
      out += str;
      i = next;
      continue;
    }

    const url = readUrl(src, i);
    if (url) {
      // Only an UNQUOTED url() may have its whitespace removed. Inside quotes
      // a space is part of the filename: url("my image.png") must survive.
      const quoted = /^url\(\s*["']/i.test(url[0]);
      out += quoted ? url[0] : url[0].replace(/\s+/g, "");
      i = url[1];
      continue;
    }

    if (/\s/.test(c)) {
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j += 1;
      out += " ";
      i = j;
      continue;
    }

    out += c;
    i += 1;
  }

  return out.trim();
}

/**
 * Removes whitespace around punctuation, but not inside calc() and friends,
 * where the spaces around + and - are required by the grammar.
 */
function tidyPunctuation(src: string): string {
  let out = "";
  let i = 0;
  // Depth of nested math functions, where spacing must be preserved.
  let mathDepth = 0;
  const parenStack: boolean[] = [];

  while (i < src.length) {
    const c = src[i];

    if (c === '"' || c === "'") {
      const [str, next] = readString(src, i);
      out += str;
      i = next;
      continue;
    }

    const url = readUrl(src, i);
    if (url) {
      out += url[0];
      i = url[1];
      continue;
    }

    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop);
      i = stop;
      // A kept header needs no space before the first rule.
      while (i < src.length && src[i] === " ") i += 1;
      continue;
    }

    // Entering a function: remember whether it is a math one.
    if (c === "(") {
      const isMath = /(calc|clamp|min|max)\s*$/i.test(out);
      parenStack.push(isMath);
      if (isMath) mathDepth += 1;
      out += c;
      i += 1;
      continue;
    }

    if (c === ")") {
      const wasMath = parenStack.pop();
      if (wasMath) mathDepth = Math.max(0, mathDepth - 1);
      out = out.replace(/\s+$/, "");
      out += c;
      i += 1;
      continue;
    }

    if (c === " " && mathDepth > 0) {
      // Keep exactly one space; the grammar needs it around + and -.
      out += " ";
      i += 1;
      continue;
    }

    if (c === " ") {
      // Drop the space if either neighbour makes it redundant.
      const prev = out[out.length - 1];
      const next = src[i + 1];
      if (prev === undefined || ":;,{}>~+(".includes(prev) || ";,{}>~+)".includes(next ?? "")) {
        i += 1;
        continue;
      }
      out += c;
      i += 1;
      continue;
    }

    if (":;,{}>~".includes(c)) {
      out = out.replace(/ $/, "");
      out += c;
      i += 1;
      // Skip any whitespace that follows.
      while (i < src.length && src[i] === " ") i += 1;
      continue;
    }

    out += c;
    i += 1;
  }

  // A semicolon immediately before a closing brace is redundant.
  return out.replace(/;\}/g, "}").replace(/\}\s*$/, "}").trim();
}

function stripZeros(src: string): string {
  return mapOutsideStrings(src, (chunk) =>
    chunk
      // 0px → 0, but never touch 0s / 0ms in transitions, where some engines
      // and all of Safari require the unit.
      .replace(/(^|[\s:,(])(-?)0(?:px|em|rem|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q)\b/gi, "$10")
      // 0.5 → .5
      .replace(/(^|[\s:,(])(-?)0\.(\d)/g, "$1$2.$3")
      // 1.0px → 1px
      .replace(/(\d)\.0+(?=[a-z%\s;,)}]|$)/gi, "$1")
      // 1.50px → 1.5px. A \b here would fail, because there is no word
      // boundary between the final 0 and the unit's first letter.
      .replace(/(\.\d*[1-9])0+(?=[a-z%\s;,)}]|$)/gi, "$1"),
  );
}

function shortenColors(src: string): string {
  return mapOutsideStrings(src, (chunk) =>
    chunk
      // #aabbcc → #abc
      .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi, "#$1$2$3")
      // rgb(0, 0, 0) → #000
      .replace(/\brgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi, (m, r, g, b) => {
        const nums = [r, g, b].map(Number);
        if (nums.some((n) => n > 255)) return m;
        const hex = nums.map((n) => n.toString(16).padStart(2, "0")).join("");
        const short = /^(.)\1(.)\2(.)\3$/.test(hex) ? `#${hex[0]}${hex[2]}${hex[4]}` : `#${hex}`;
        return short;
      })
      // Long names that are longer than their hex equivalent.
      .replace(/(^|[\s:,(])white\b/gi, "$1#fff")
      .replace(/(^|[\s:,(])black\b/gi, "$1#000")
      .toLowerCase()
      // Undo the lowercasing of anything that is case-sensitive.
      .replace(/#([0-9a-f]{3,8})\b/gi, (m) => m.toLowerCase()),
  );
}

/**
 * Applies a transform to every part of the stylesheet that is NOT inside a
 * string, a url(), or a comment — so quoted content, data URIs, and a kept
 * /*! license header *\/ all pass through byte for byte.
 */
function mapOutsideStrings(src: string, fn: (chunk: string) => string): string {
  let out = "";
  let buffer = "";
  let i = 0;

  const flush = () => {
    out += fn(buffer);
    buffer = "";
  };

  while (i < src.length) {
    const c = src[i];

    if (c === '"' || c === "'") {
      flush();
      const [str, next] = readString(src, i);
      out += str;
      i = next;
      continue;
    }

    const url = readUrl(src, i);
    if (url) {
      flush();
      out += url[0];
      i = url[1];
      continue;
    }

    // A surviving comment is content, not code.
    if (c === "/" && src[i + 1] === "*") {
      flush();
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }

    buffer += c;
    i += 1;
  }

  flush();
  return out;
}

function countUnbalanced(src: string): number {
  let depth = 0;
  let i = 0;

  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i = readString(src, i)[1];
      continue;
    }
    const url = readUrl(src, i);
    if (url) {
      i = url[1];
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (c === "{") depth += 1;
    if (c === "}") depth -= 1;
    i += 1;
  }

  return depth;
}

const countRules = (css: string) => (css.match(/\{/g) ?? []).length;

function countDeclarations(css: string): number {
  let count = 0;
  let i = 0;
  let inBlock = false;

  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") {
      i = readString(css, i)[1];
      continue;
    }
    const url = readUrl(css, i);
    if (url) {
      i = url[1];
      continue;
    }
    if (c === "{") inBlock = true;
    if (c === "}") {
      if (inBlock) count += 1;
      inBlock = false;
    }
    if (c === ";" && inBlock) count += 1;
    i += 1;
  }

  return count;
}
