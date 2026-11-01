import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled two experimental features that the default template enables:
  // cacheComponents and partialPrefetching target server-rendered pages.
  // This app renders on the client ('use client') and waits for auth first,
  // so they only produced a spurious "could not validate instant navigation" error.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
