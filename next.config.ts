import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only ever serves same-origin files we generate ourselves (seeded demo
    // wardrobe icons) or user photo uploads (raster, validated server-side)
    // — safe to allow SVG rendering for the former.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
