import type { NextConfig } from "next";

type ExtendedNextConfig = NextConfig & {
  turbopack?: {
    root?: string;
  };
};

const nextConfig: ExtendedNextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  turbopack: { root: __dirname },
};

export default nextConfig;
