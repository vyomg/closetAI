import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow SVG rendering for trusted, internally generated assets.
    dangerouslyAllowSVG: true,

    contentDispositionType: "inline",

    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",

    // Allow images stored in Vercel Blob.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;