import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // data: URLs come from the browser (FileReader) — no remote patterns needed
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
};

export default nextConfig;
