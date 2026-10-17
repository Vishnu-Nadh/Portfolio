import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    // lets any partial `@use "abstracts" as *;` without relative paths
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
