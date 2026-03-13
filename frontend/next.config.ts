import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // The repo contains multiple lockfiles; explicitly set the app root.
    root: __dirname,
  },
};

export default nextConfig;
