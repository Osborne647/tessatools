export type Algo = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export const ALGOS: { id: Algo; label: string; bits: number; safe: boolean }[] = [
  { id: "MD5", label: "MD5", bits: 128, safe: false },
  { id: "SHA-1", label: "SHA-1", bits: 160, safe: false },
  { id: "SHA-256", label: "SHA-256", bits: 256, safe: true },
  { id: "SHA-384", label: "SHA-384", bits: 384, safe: true },
  { id: "SHA-512", label: "SHA-512", bits: 512, safe: true },
];

export type Encoding = "hex" | "base64" | "hex-upper";

export async function hashText(text: string, algo: Algo): Promise<Uint8Array> {
  return hashBytes(new TextEncoder().encode(text), algo);
}

export async function hashBytes(bytes: Uint8Array, algo: Algo): Promise<Uint8Array> {
  if (algo === "MD5") return md5(bytes);
  const buf = await crypto.subtle.digest(algo, bytes as BufferSource);
  return new Uint8Array(buf);
}

export async function hmac(text: string, secret: string, algo: Algo): Promise<Uint8Array | null> {
  if (algo === "MD5") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as BufferSource,
    { name: "HMAC", hash: algo },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text) as BufferSource);
  return new Uint8Array(sig);
}

export function encode(bytes: Uint8Array, enc: Encoding): string {
  if (enc === "base64") {
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return enc === "hex-upper" ? hex.toUpperCase() : hex;
}

export function digestsMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "").replace(/^sha\d*[:=-]/, "");
  const x = norm(a);
  const y = norm(b);
  if (!x || !y || x.length !== y.length) return false;

  let diff = 0;
  for (let i = 0; i < x.length; i += 1) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export function detectAlgo(digest: string): Algo | null {
  const hex = digest.trim().replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;

  return (
    { 32: "MD5", 40: "SHA-1", 64: "SHA-256", 96: "SHA-384", 128: "SHA-512" } as Record<number, Algo>
  )[hex.length] ?? null;
}

export const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

// K[i] = floor(2^32 * abs(sin(i + 1)))
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));

function md5(input: Uint8Array): Uint8Array {
  const bitLen = input.length * 8;

  const padded = new Uint8Array((((input.length + 8) >> 6) + 1) << 6);
  padded.set(input);
  padded[input.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const m = new Uint32Array(16);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) m[i] = view.getUint32(offset + i * 4, true);

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const tmp = d;
      d = c;
      c = b;
      const sum = (a + f + K[i] + m[g]) >>> 0;
      b = (b + rotl(sum, S[i])) >>> 0;
      a = tmp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true);
  ov.setUint32(4, b0, true);
  ov.setUint32(8, c0, true);
  ov.setUint32(12, d0, true);
  return out;
}

const rotl = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;
