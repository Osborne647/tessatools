// Single source of truth for SEO. Every tool page reads from here, so you never
// hand-author metadata twice. Add a tool to `tools` and its page, sitemap entry,
// and JSON-LD all come along for free.

export const site = {
  name: "Tessacode Tools",
  brand: "Tessacode Solutions",
  tagline: "Seamless by design.",
  url: "https://tessacodetools.dev",
  description:
    "Free developer tools that run entirely in your browser. Encode Base64, format JSON, decode JWTs and more. No sign-up, no uploads, no waiting.",
  email: "nosborne@tessacodesolutions.com",
  github: "https://github.com/Osborne647",


  policyUpdated: "11 September 2026",
} as const;

export type Faq = { q: string; a: string };

export type Tool = {
  slug: string;
  n: string;
  name: string;
  /** H1 on the tool page. Leads with the target keyword. */
  h1: string;
  /** 120-160 chars. Keyword appears naturally, not stuffed. */
  metaDescription: string;
  /** Card copy on the homepage grid. */
  desc: string;
  /** Action label on the homepage card. Verb-first, and unique per tool. */
  cta: string;
  /** Short breadcrumb label. Acronyms stay capitalised. */
  crumb: string;
  keyword: string;
  status: "live" | "soon";
  faqs: Faq[];
};

export const tools: Tool[] = [
  {
    slug: "base64-encoder",
    n: "01",
    name: "Base64 Encoder & Decoder",
    h1: "Free Online Base64 Encoder & Decoder",
    metaDescription:
      "Encode text to Base64 and decode it back instantly. Handles UTF-8, data URIs, and URL-safe Base64. Runs in your browser, nothing is ever uploaded.",
    desc: "Encode text or files to Base64 and decode straight back. Handles UTF-8, data URIs, and URL-safe variants.",
    cta: "Encode text",
    crumb: "Base64",
    keyword: "base64 encoder",
    status: "live",
    faqs: [
      {
        q: "Is this Base64 encoder safe for sensitive data?",
        a: "Yes. Encoding runs entirely in your browser using the built-in TextEncoder and btoa APIs. Your input is never sent to a server, so nothing is logged or stored.",
      },
      {
        q: "Does it support UTF-8 and emoji?",
        a: "It does. Text is converted to UTF-8 bytes before encoding, so accented characters, emoji, and non-Latin scripts round-trip correctly.",
      },
      {
        q: "What is URL-safe Base64?",
        a: "URL-safe Base64 replaces + with - and / with _ so the output can be used in URLs and filenames without escaping. Toggle it on and the encoder emits that variant.",
      },
      {
        q: "Why does my decode fail?",
        a: "Base64 input must have a valid length and character set. Stray spaces are stripped automatically, but truncated strings or missing padding will be rejected.",
      },
    ],
  },
  {
    slug: "uuid-generator",
    n: "02",
    name: "UUID Generator",
    h1: "Free Online UUID Generator (v4 & v7)",
    metaDescription:
      "Generate random v4 and time-ordered v7 UUIDs one at a time or in bulk. Copy the whole batch in one click. Free, instant, and fully client-side.",
    desc: "Generate v4 and v7 UUIDs one at a time or a thousand at once. Copy the whole batch in one click.",
    cta: "Generate IDs",
    crumb: "UUID",
    keyword: "uuid generator",
    status: "live",
    faqs: [
      {
        q: "Are these UUIDs actually random?",
        a: "Yes. Every value comes from crypto.getRandomValues, the browser's cryptographically secure random source, not Math.random. A v4 UUID carries 122 random bits, so collisions are not a practical concern.",
      },
      {
        q: "Should I use v4 or v7?",
        a: "Use v7 for database primary keys. Its first 48 bits are a timestamp, so values sort chronologically and insert sequentially into a B-tree index. Use v4 for anything where the creation time should not be inferable, like public-facing tokens or share links.",
      },
      {
        q: "Can a UUID ever repeat?",
        a: "In practice, no. You would need to generate around 2.7 quintillion v4 UUIDs before there is a one-in-a-billion chance of a single collision. The v7 generator also adds a monotonic counter so values made in the same millisecond stay unique and ordered.",
      },
      {
        q: "Are the generated UUIDs sent to a server?",
        a: "Never. Generation happens entirely in your browser and nothing is logged or transmitted, so these are safe to use as production identifiers.",
      },
      {
        q: "Why does a v7 UUID reveal when it was created?",
        a: "That is by design: the timestamp is what makes it sortable. If exposing creation time is a problem for your use case, generate v4 instead.",
      },
    ],
  },
  {
    slug: "json-formatter",
    n: "03",
    name: "JSON Formatter & Validator",
    h1: "Free Online JSON Formatter & Validator",
    metaDescription:
      "Pretty-print, minify, and validate JSON in your browser. Syntax errors are reported with the exact line and column. No uploads, no sign-up.",
    desc: "Pretty-print, minify, and validate. Syntax errors are reported with the exact line and column.",
    cta: "Format JSON",
    crumb: "JSON",
    keyword: "json formatter",
    status: "live",
    faqs: [
      {
        q: "Is my JSON uploaded anywhere?",
        a: "No. The parser runs in your browser, so the document never leaves the tab. That makes it safe to paste API responses or config files containing keys and customer data.",
      },
      {
        q: "Why does my JSON fail to parse when it looks fine?",
        a: "The four usual culprits are a trailing comma before a closing brace, single quotes instead of double quotes, unquoted object keys, and // comments. All four are legal JavaScript but invalid JSON, and the error panel names whichever one it finds along with the exact line and column.",
      },
      {
        q: "What is the difference between formatting and minifying?",
        a: "Formatting adds indentation and line breaks so a human can read the structure. Minifying strips every optional byte of whitespace to shrink the payload for transport. The data is identical either way.",
      },
      {
        q: "Does sorting keys change my data?",
        a: "No. Object keys have no defined order in JSON, so alphabetizing them produces an equivalent document. Array order is preserved untouched, because in an array the order is the data.",
      },
      {
        q: "How large a file can it handle?",
        a: "Files up to about 5 MB parse comfortably in well under a second. Past that the browser is doing real work and you are better off with jq on the command line.",
      },
    ],
  },
  {
    slug: "timestamp-converter",
    n: "04",
    name: "Timestamp Converter",
    h1: "Free Unix Timestamp Converter",
    metaDescription:
      "Convert Unix timestamps to readable dates in any timezone, and back again. Supports seconds and milliseconds. Instant and fully client-side.",
    desc: "Unix seconds or milliseconds to readable dates, in any timezone, with the reverse direction too.",
    cta: "Convert a timestamp",
    crumb: "Timestamp",
    keyword: "unix timestamp converter",
    status: "live",
    faqs: [
      {
        q: "What is a Unix timestamp?",
        a: "It is the number of seconds elapsed since midnight UTC on 1 January 1970, known as the Unix epoch. Because it is a single integer in UTC, it carries no timezone or formatting ambiguity, which is why almost every API and database uses it internally.",
      },
      {
        q: "Is my timestamp in seconds or milliseconds?",
        a: "Count the digits. Ten digits is seconds, thirteen is milliseconds, sixteen is microseconds, and nineteen is nanoseconds. This converter detects the unit from the length automatically, so you can paste any of them.",
      },
      {
        q: "Why does the same timestamp show a different time for my colleague?",
        a: "It does not. The timestamp is one instant in UTC; what changes is the local wall-clock rendering of it. Pick a timezone above and you will see the same instant expressed in that zone, offset and DST included.",
      },
      {
        q: "What is the 2038 problem?",
        a: "Systems that store timestamps in a signed 32-bit integer overflow at 2147483647 seconds, which is 19 January 2038. Anything still using a 32-bit time_t will wrap to 1901. Modern platforms use 64-bit values and are unaffected for roughly 292 billion years.",
      },
      {
        q: "Why did it say my time never existed?",
        a: "On the day a zone springs forward for daylight saving, an hour of local clock time is skipped entirely. In US Central, 2:30am on 8 March 2026 simply never happens. Rather than silently landing you an hour off, the converter tells you.",
      },
    ],
  },
  {
    slug: "jwt-decoder",
    n: "05",
    name: "JWT Decoder",
    h1: "Free Online JWT Decoder",
    metaDescription:
      "Decode any JSON Web Token to read its header, payload, and expiry. Your token never leaves the browser tab, so it is safe to paste production tokens.",
    desc: "Read the header, payload, and expiry of any token. The token never leaves this tab.",
    cta: "Decode a token",
    crumb: "JWT",
    keyword: "jwt decoder",
    status: "live",
    faqs: [
      {
        q: "Is it safe to paste a production token here?",
        a: "Yes. Decoding and signature verification both run in your browser with the Web Crypto API, and nothing is transmitted or logged. That said, a token in your clipboard is still a live credential, so treat it accordingly.",
      },
      {
        q: "Does decoding a JWT mean it is verified?",
        a: "No, and this trips people up constantly. The header and payload are only base64url-encoded, not encrypted, so anyone can read them without a key. Verification is a separate step that checks the signature, and only that step tells you the token is authentic.",
      },
      {
        q: "Why can you verify HS256 but not RS256?",
        a: "HMAC algorithms sign and verify with the same shared secret, so if you have it, the check can happen locally. RS and ES tokens are verified with the issuer's public key, which normally means fetching a JWKS endpoint. That would send data off your device, so this tool does not do it.",
      },
      {
        q: "Can I edit a payload and re-sign the token?",
        a: "Not here, deliberately. This is a read-only decoder. Minting tokens belongs in your auth service, where the signing key lives.",
      },
      {
        q: "What does alg: none mean?",
        a: "It declares an unsigned token. Historically, libraries that trusted the header would accept a forged token with the signature stripped and alg set to none. Always pin the expected algorithm server-side rather than reading it from the token.",
      },
    ],
  },
  {
    slug: "markdown-to-html",
    n: "06",
    name: "Markdown to HTML",
    h1: "Free Markdown to HTML Converter",
    metaDescription:
      "Convert Markdown to clean HTML with a live preview. Supports GitHub-flavored tables, fenced code blocks, and task lists. Free and browser-based.",
    desc: "Live preview with GitHub-flavored tables, fenced code, and task lists. Copy clean HTML out.",
    cta: "Convert Markdown",
    crumb: "Markdown",
    keyword: "markdown to html",
    status: "live",
    faqs: [
      {
        q: "Which Markdown flavor does this support?",
        a: "GitHub-Flavored Markdown: headings, emphasis, strikethrough, fenced code blocks with language hints, tables with column alignment, task lists, blockquotes, images, and both inline and reference-style links.",
      },
      {
        q: "Is the generated HTML safe to publish?",
        a: "Yes. Every piece of text is HTML-escaped during conversion and only a fixed allowlist of tags can be emitted, so raw script tags, event handler attributes, and javascript: URLs in the source come out as visible text rather than live markup.",
      },
      {
        q: "Can I paste raw HTML into the Markdown?",
        a: "You can, but it will be escaped and displayed as text instead of rendered. That is a deliberate trade: it means converting an untrusted document can never inject anything into the page.",
      },
      {
        q: "What does the line breaks option do?",
        a: "Standard Markdown treats a single newline inside a paragraph as a space, and only breaks the line when you end it with two spaces. GitHub comments break on every newline. Toggle the option to match whichever behaviour you need.",
      },
      {
        q: "Is my document uploaded anywhere?",
        a: "No. Parsing happens entirely in your browser, so drafts, notes, and internal documentation never leave the tab.",
      },
    ],
  },
  {
    slug: "yaml-json-converter",
    n: "07",
    name: "YAML and JSON Converter",
    h1: "Free YAML to JSON Converter (and Back)",
    metaDescription:
      "Convert YAML to JSON or JSON to YAML instantly. Anchors, multi-line strings, and deeply nested maps survive the trip. Runs entirely in your browser.",
    desc: "Convert either direction. Anchors, multi-line strings, and nested maps survive the trip.",
    cta: "Convert YAML",
    crumb: "YAML",
    keyword: "yaml to json",
    status: "live",
    faqs: [
      {
        q: "Does this handle anchors and aliases?",
        a: "Yes. Anchors, aliases, and merge keys are resolved during conversion, so an aliased block is expanded inline in the JSON output. JSON has no reference syntax, so the expansion is the only faithful representation.",
      },
      {
        q: "What is the Norway problem?",
        a: "In YAML 1.1, the unquoted values yes, no, on, and off resolve to booleans, so a country list containing NO became false. This converter follows the YAML 1.2 core schema, where only true and false are booleans and no stays the string \"no\".",
      },
      {
        q: "Why did my version number change?",
        a: "Unquoted 1.20 is a number, and the trailing zero is not significant, so it reads back as 1.2. Quote any version, ZIP code, phone number, or identifier that must keep its exact digits.",
      },
      {
        q: "Are comments preserved when converting?",
        a: "No, and they cannot be. JSON has no comment syntax, so comments are dropped on the way in and there is nothing to restore on the way back. Converting YAML to JSON and back is lossy for comments and formatting, though never for data.",
      },
      {
        q: "Is my configuration uploaded?",
        a: "No. Both parsers run in your browser, so production manifests, secrets, and CI configuration never leave the tab.",
      },
    ],
  },
  {
    slug: "cron-parser",
    n: "08",
    name: "Cron Expression Parser",
    h1: "Free Cron Expression Parser & Explainer",
    metaDescription:
      "Translate any cron expression into plain English and see the next five run times. Free, instant, and works entirely in your browser.",
    desc: "Turn five cryptic fields into plain English, plus the next five times the job will actually run.",
    cta: "Explain a schedule",
    crumb: "Cron",
    keyword: "cron expression parser",
    status: "live",
    faqs: [
      {
        q: "What do the five fields mean?",
        a: "In order: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, where 0 is Sunday). Each accepts a single value, a list like 1,3,5, a range like 9-17, a step like */15, or * for every value.",
      },
      {
        q: "Why does my job run more often than expected?",
        a: "Almost always the day-of-month and day-of-week rule. When both fields are restricted, cron fires if either one matches, not both. So 0 0 15 * 3 runs on the 15th and on every Wednesday, which is roughly five times a month rather than once a year.",
      },
      {
        q: "What happens to a job scheduled during a daylight saving change?",
        a: "It depends on the implementation, and that is the problem. When the clock springs forward, a job scheduled in the skipped hour may be missed entirely; when it falls back, a job may run twice. Scheduling outside 1am to 3am avoids the whole class of bug, or run the daemon in UTC.",
      },
      {
        q: "Are L, W, and ? supported?",
        a: "No, and deliberately. Those are Quartz and Spring extensions, not standard cron, so an expression using them will fail on a normal crontab. This parser flags them and says which scheduler they belong to.",
      },
      {
        q: "Why does my expression show no run times?",
        a: "The schedule is impossible. The usual cause is a date that never occurs, such as 0 0 30 2 * for the 30th of February, or a day-of-month and month pair that never line up.",
      },
    ],
  },
  {
    slug: "hash-generator",
    n: "09",
    name: "Hash Generator",
    h1: "Free SHA-256 Hash Generator",
    metaDescription:
      "Generate SHA-256, SHA-512, and MD5 hashes from text or a dropped file using the Web Crypto API. Nothing is uploaded, everything stays in your browser.",
    desc: "SHA-256, SHA-512, and MD5 digests from text or a dropped file, computed with the Web Crypto API.",
    cta: "Hash input",
    crumb: "Hash",
    keyword: "sha256 hash generator",
    status: "live",
    faqs: [
      {
        q: "Is my file or text uploaded to hash it?",
        a: "No. Hashing runs in your browser through the Web Crypto API, so a dropped file never leaves your machine. That also means there is no size limit imposed by a server.",
      },
      {
        q: "Can a hash be reversed?",
        a: "Not directly, but that is the wrong thing to rely on. Hashes are deterministic, so short or predictable inputs are trivially recovered by looking the digest up in a precomputed table. Hashing is not encryption.",
      },
      {
        q: "Should I use MD5 or SHA-1?",
        a: "Not for anything security-related. Both have practical collision attacks, meaning two different inputs can be made to produce the same digest. They remain useful for non-adversarial checks like verifying a legacy download checksum, which is why they are included here.",
      },
      {
        q: "Which hash should I use for passwords?",
        a: "None of these. Passwords need a deliberately slow algorithm with a per-user salt, such as bcrypt, scrypt, or Argon2id. SHA-256 is fast by design, and that speed is exactly what makes it a poor password hash.",
      },
      {
        q: "What is HMAC and when do I need it?",
        a: "HMAC combines a hash with a secret key, so only someone holding the key can produce or verify the digest. It is what webhook providers use to sign payloads, letting you confirm a request genuinely came from them.",
      },
    ],
  },
  {
    slug: "css-minifier",
    n: "10",
    name: "CSS Minifier",
    h1: "Free Online CSS Minifier",
    metaDescription:
      "Minify CSS to shrink your stylesheet. Strips comments and whitespace, collapses rules, and shows exactly how many bytes you saved. Free and client-side.",
    desc: "Strip comments and whitespace, collapse rules, and see exactly how many bytes you saved.",
    cta: "Minify CSS",
    crumb: "CSS",
    keyword: "css minifier",
    status: "live",
    faqs: [
      {
        q: "Will minifying break my stylesheet?",
        a: "It should not. This minifier only removes bytes the CSS grammar treats as optional, and it walks the file character by character so strings, data URIs, and calc() expressions are left untouched. Nothing is reordered and no properties are merged.",
      },
      {
        q: "Why are the spaces in calc() still there?",
        a: "Because they are required. The CSS grammar needs whitespace around the + and - operators inside calc(), clamp(), min(), and max(). Removing them is the single most common way a regex-based minifier silently breaks a layout.",
      },
      {
        q: "How much smaller will my CSS get?",
        a: "Typically 20 to 35% for hand-written CSS, depending on how heavily it is commented and indented. Already-processed output from a build tool will compress much less. Gzip or Brotli on your server then saves substantially more on top.",
      },
      {
        q: "Are my license comments preserved?",
        a: "Yes, if they use the /*! marker, which is the convention every major minifier respects. Ordinary /* comments */ are removed. Turn the option off to strip everything.",
      },
      {
        q: "Should I minify by hand or in my build?",
        a: "In your build, for anything you ship regularly. Next.js, Vite, and webpack all minify CSS in production by default. This tool is for the one-off: a snippet, a legacy file, or checking what a stylesheet actually costs.",
      },
    ],
  },
];

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);

/** JSON-LD for a tool page. Drop into a <script type="application/ld+json">. */
export function toolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: `${site.url}/tools/${tool.slug}/`,
    description: tool.metaDescription,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

/** FAQPage JSON-LD. This is what feeds AI Overviews and rich results. */
export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
