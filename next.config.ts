import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.8.100', '192.168.8.102', 'tournament-countries-delhi-oxford.trycloudflare.com'],
  images: {
    // data: URLs come from the browser (FileReader) — no remote patterns needed
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
};

export default nextConfig;
