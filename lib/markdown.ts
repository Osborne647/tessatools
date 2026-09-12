export type Options = {
  headingIds: boolean;
  breaks: boolean;
};

export const DEFAULTS: Options = { headingIds: true, breaks: false };

export function markdownToHtml(src: string, opts: Options = DEFAULTS): string {
  const lines = src.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  return blocks(lines, opts).join("\n");
}

export type Heading = { level: number; text: string; id: string };

export function outline(src: string): Heading[] {
  const out: Heading[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let fenced = false;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: stripInline(m[2]), id: slug(stripInline(m[2])) });
  }
  return out;
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type Stats = { words: number; headings: number; links: number; codeBlocks: number };

export function stats(src: string): Stats {
  const withoutCode = src.replace(/```[\s\S]*?```/g, "");
  return {
    words: (withoutCode.match(/[A-Za-z0-9'’-]+/g) ?? []).length,
    headings: outline(src).length,
    links: (src.match(/\[[^\]]*\]\([^)]*\)/g) ?? []).length,
    codeBlocks: (src.match(/^\s*(```|~~~)/gm) ?? []).length >> 1,
  };
}

function blocks(lines: string[], opts: Options): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // fenced code
    const fence = /^\s*(```+|~~~+)\s*([^\s`]*)/.exec(line);
    if (fence) {
      const closer = fence[1][0] === "~" ? /^\s*~~~+/ : /^\s*```+/;
      const lang = fence[2];
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !closer.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }

    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2], opts);
      const id = opts.headingIds ? ` id="${slug(stripInline(h[2]))}"` : "";
      out.push(`<h${level}${id}>${text}</h${level}>`);
      i += 1;
      continue;
    }

    if (i + 1 < lines.length && /^\s*(=+|-{2,})\s*$/.test(lines[i + 1]) && line.trim()) {
      const level = lines[i + 1].trim().startsWith("=") ? 1 : 2;
      const id = opts.headingIds ? ` id="${slug(stripInline(line))}"` : "";
      out.push(`<h${level}${id}>${inline(line.trim(), opts)}</h${level}>`);
      i += 2;
      continue;
    }

    // thematic break
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push("<hr>");
      i += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && (/^\s*>/.test(lines[i]) || (lines[i].trim() && body.length))) {
        if (!/^\s*>/.test(lines[i]) && !lines[i].trim()) break;
        body.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      out.push(`<blockquote>\n${blocks(body, opts).join("\n")}\n</blockquote>`);
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isDelimiterRow(lines[i + 1])) {
      const header = splitRow(line);
      const align = splitRow(lines[i + 1]).map(alignOf);
      i += 2;

      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }

      const th = header
        .map((c, n) => `<th${alignAttr(align[n])}>${inline(c, opts)}</th>`)
        .join("");
      const body = rows
        .map(
          (r) =>
            `<tr>${header
              .map((_, n) => `<td${alignAttr(align[n])}>${inline(r[n] ?? "", opts)}</td>`)
              .join("")}</tr>`,
        )
        .join("\n");

      out.push(
        `<table>\n<thead>\n<tr>${th}</tr>\n</thead>\n<tbody>\n${body}\n</tbody>\n</table>`,
      );
      continue;
    }

    // lists
    if (listMarker(line)) {
      const [html, next] = list(lines, i, opts);
      out.push(html);
      i = next;
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) {
      para.push(lines[i].trim());
      i += 1;
    }
    if (para.length) out.push(`<p>${inline(para.join("\n"), opts)}</p>`);
  }

  return out;
}

function startsBlock(lines: string[], i: number): boolean {
  const l = lines[i];
  return (
    /^\s*(```|~~~)/.test(l) ||
    /^#{1,6}\s/.test(l) ||
    /^\s*>/.test(l) ||
    /^\s*([-*_])(\s*\1){2,}\s*$/.test(l) ||
    Boolean(listMarker(l)) ||
    (l.includes("|") && i + 1 < lines.length && isDelimiterRow(lines[i + 1]))
  );
}

type Marker = { indent: number; ordered: boolean; start: number; task: boolean; checked: boolean; text: string };

function listMarker(line: string): Marker | null {
  const m = /^(\s*)(?:([-*+])|(\d{1,9})[.)])\s+(.*)$/.exec(line);
  if (!m) return null;

  let text = m[4];
  let task = false;
  let checked = false;

  const t = /^\[([ xX])\]\s+(.*)$/.exec(text);
  if (t) {
    task = true;
    checked = t[1].toLowerCase() === "x";
    text = t[2];
  }

  return {
    indent: m[1].length,
    ordered: Boolean(m[3]),
    start: m[3] ? Number(m[3]) : 1,
    task,
    checked,
    text,
  };
}

/** Builds one list, recursing for deeper indentation. */
function list(lines: string[], start: number, opts: Options): [string, number] {
  const first = listMarker(lines[start])!;
  const items: string[] = [];
  let i = start;
  let anyTask = false;

  while (i < lines.length) {
    const m = listMarker(lines[i]);

    if (!m) {
      if (!lines[i].trim()) {
        const ahead = i + 1;
        if (ahead < lines.length && listMarker(lines[ahead])) {
          i += 1;
          continue;
        }
        break;
      }
      if (/^\s{2,}\S/.test(lines[i]) && items.length) {
        // lazy continuation of the previous item
        items[items.length - 1] = items[items.length - 1].replace(
          /<\/li>$/,
          ` ${inline(lines[i].trim(), opts)}</li>`,
        );
        i += 1;
        continue;
      }
      break;
    }

    if (m.indent < first.indent) break;

    if (m.indent > first.indent) {
      const [nested, next] = list(lines, i, opts);
      if (items.length) {
        items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, `\n${nested}\n</li>`);
      } else {
        items.push(`<li>\n${nested}\n</li>`);
      }
      i = next;
      continue;
    }

    if (m.ordered !== first.ordered) break;

    if (m.task) {
      anyTask = true;
      const box = `<input type="checkbox" disabled${m.checked ? " checked" : ""}> `;
      items.push(`<li>${box}${inline(m.text, opts)}</li>`);
    } else {
      items.push(`<li>${inline(m.text, opts)}</li>`);
    }
    i += 1;
  }

  const tag = first.ordered ? "ol" : "ul";
  const startAttr = first.ordered && first.start !== 1 ? ` start="${first.start}"` : "";
  const cls = anyTask ? ' class="contains-task-list"' : "";
  return [`<${tag}${startAttr}${cls}>\n${items.join("\n")}\n</${tag}>`, i];
}

function isDelimiterRow(line: string): boolean {
  return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line) && line.includes("-");
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function alignOf(cell: string): "left" | "right" | "center" | null {
  const l = cell.startsWith(":");
  const r = cell.endsWith(":");
  if (l && r) return "center";
  if (r) return "right";
  if (l) return "left";
  return null;
}

function alignAttr(a: "left" | "right" | "center" | null): string {
  return a ? ` style="text-align:${a}"` : "";
}

const MARK = String.fromCharCode(2);

function inline(src: string, opts: Options): string {
  const held: string[] = [];
  const hold = (html: string) => {
    held.push(html);
    return `${MARK}${held.length - 1}${MARK}`;
  };

  let text = src.replace(/(`+)([\s\S]*?)\1/g, (_m, _f, code: string) =>
    hold(`<code>${escapeHtml(code.trim())}</code>`),
  );

  text = text.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (m, alt: string, url: string, title: string | undefined) => {
      if (!isSafeUrl(url)) return m;
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return hold(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"${t}>`);
    },
  );

  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (m, label: string, url: string, title: string | undefined) => {
      if (!isSafeUrl(url)) return m;
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return hold(
        `<a href="${escapeHtml(url)}"${t}${external(url)}>${inline(label, opts)}</a>`,
      );
    },
  );

  text = text.replace(/<(https?:\/\/[^\s>]+)>/g, (_m, url: string) =>
    hold(`<a href="${escapeHtml(url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(url)}</a>`),
  );

  text = escapeHtml(text);

  text = text
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w])__([^_]+)__/g, "$1<strong>$2</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_([^_\n]+)_(?![\w])/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  text = text.replace(/ {2,}\n/g, "<br>\n");
  if (opts.breaks) text = text.replace(/\n/g, "<br>\n");

  return text.replace(new RegExp(`${MARK}(\\d+)${MARK}`, "g"), (_m, n: string) => held[Number(n)]);
}

function stripInline(src: string): string {
  return src
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

function isSafeUrl(url: string): boolean {
  const u = url.trim().toLowerCase().replace(/[\x00-\x20]/g, "");
  if (/^(javascript|data|vbscript|file):/.test(u)) return false;
  return true;
}

function external(url: string): string {
  return /^https?:\/\//i.test(url) ? ' rel="noopener noreferrer" target="_blank"' : "";
}
