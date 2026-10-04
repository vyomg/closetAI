import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow SVG rendering for trusted, internally generated assets.
    dangerouslyAllowSVG: true,

    contentDispositionType: "inline",

    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",

    // Allow images stored in Vercel Blob, plus the two public, web-sourced
    // datasets used for the onboarding style-learning deck and the
    // landing-page wheel (never the user's private wardrobe — see
    // src/lib/publicFashion.ts for why these are a separate module).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;