import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: every page becomes plain HTML in /out. No server, no cost.
  output: "export",
  // Required with `output: export` — the Image Optimization API needs a server.
  images: { unoptimized: true },
  // Emits /tools/base64-encoder/index.html instead of /tools/base64-encoder.html
  // so the clean URL works on any static host.
  trailingSlash: true,
};

export default nextConfig;
