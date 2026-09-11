// UUID generation, framework-free so the tool component and any test file can
// share it. Everything uses crypto.getRandomValues — never Math.random, which
// is not cryptographically random and will eventually collide.

export type Version = "v4" | "v7";

export type Shape = "plain" | "upper" | "braced" | "no-dashes" | "quoted" | "json" | "sql";

const HEX: string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, "0"),
);

const NIL = "00000000-0000-0000-0000-000000000000";
const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

/** Random UUID. Uses the native implementation where available. */
export function uuidV4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();

  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  return format(b);
}

// Monotonic state. Generating a batch takes well under a millisecond, so
// without this every UUID in that batch would share a timestamp and sort in
// random order — defeating the only reason to pick v7.
let lastMs = -1;
let seq = 0;

/**
 * Time-ordered UUID (RFC 9562). The first 48 bits are a Unix millisecond
 * timestamp and the next 12 bits are a counter, so v7 values sort
 * chronologically as plain strings. That makes them far better database
 * primary keys than v4, which scatters inserts across the B-tree.
 */
export function uuidV7(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let ms = Date.now();

  if (ms === lastMs) {
    seq += 1;
    // 12 bits of counter exhausted in one millisecond: borrow from the next.
    if (seq > 0xfff) {
      seq = 0;
      ms = lastMs + 1;
      lastMs = ms;
    }
  } else {
    lastMs = ms;
    seq = 0;
  }

  b[0] = Math.floor(ms / 2 ** 40) & 0xff;
  b[1] = Math.floor(ms / 2 ** 32) & 0xff;
  b[2] = Math.floor(ms / 2 ** 24) & 0xff;
  b[3] = Math.floor(ms / 2 ** 16) & 0xff;
  b[4] = Math.floor(ms / 2 ** 8) & 0xff;
  b[5] = ms & 0xff;

  b[6] = 0x70 | ((seq >> 8) & 0x0f); // version 7 + counter high nibble
  b[7] = seq & 0xff; //                 counter low byte
  b[8] = (b[8] & 0x3f) | 0x80; //       RFC 4122 variant
  return format(b);
}

export function generate(version: Version, count: number): string[] {
  const make = version === "v7" ? uuidV7 : uuidV4;
  return Array.from({ length: count }, make);
}

/** Structural validation: correct shape, known version, RFC 4122 variant. */
export function inspect(value: string): {
  valid: boolean;
  version: number | null;
  label: string | null;
  timestamp: Date | null;
} {
  const v = value.trim().toLowerCase().replace(/^urn:uuid:/, "").replace(/[{}]/g, "");

  // The nil and max UUIDs are valid per RFC 9562 but carry no version bits.
  if (v === NIL) return { valid: true, version: null, label: "nil UUID", timestamp: null };
  if (v === MAX) return { valid: true, version: null, label: "max UUID", timestamp: null };

  const m = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-([89ab])[0-9a-f]{3}-[0-9a-f]{12}$/.exec(v);
  if (!m) return { valid: false, version: null, label: null, timestamp: null };

  const version = parseInt(m[1], 16);
  // v7 carries its creation time in the first 48 bits — pull it back out.
  const timestamp =
    version === 7 ? new Date(parseInt(v.slice(0, 8) + v.slice(9, 13), 16)) : null;

  return { valid: true, version, label: `version ${version}, RFC 4122 variant`, timestamp };
}

/** Output shapes people actually paste into code. */
export function formatAs(ids: string[], shape: Shape): string {
  switch (shape) {
    case "upper":
      return ids.map((id) => id.toUpperCase()).join("\n");
    case "braced":
      return ids.map((id) => `{${id}}`).join("\n");
    case "no-dashes":
      return ids.map((id) => id.replace(/-/g, "")).join("\n");
    case "quoted":
      return ids.map((id) => `"${id}",`).join("\n");
    case "json":
      return JSON.stringify(ids, null, 2);
    case "sql":
      return ids.map((id) => `INSERT INTO ids (id) VALUES ('${id}');`).join("\n");
    default:
      return ids.join("\n");
  }
}

export const SHAPES: { id: Shape; label: string }[] = [
  { id: "plain", label: "plain" },
  { id: "upper", label: "upper" },
  { id: "no-dashes", label: "no dashes" },
  { id: "braced", label: "braced" },
  { id: "quoted", label: "quoted" },
  { id: "json", label: "json" },
  { id: "sql", label: "sql" },
];

function format(b: Uint8Array): string {
  return (
    HEX[b[0]] + HEX[b[1]] + HEX[b[2]] + HEX[b[3]] + "-" +
    HEX[b[4]] + HEX[b[5]] + "-" +
    HEX[b[6]] + HEX[b[7]] + "-" +
    HEX[b[8]] + HEX[b[9]] + "-" +
    HEX[b[10]] + HEX[b[11]] + HEX[b[12]] + HEX[b[13]] + HEX[b[14]] + HEX[b[15]]
  );
}
