import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Standalone output is useful for Docker production images later.
  // Keep default for FAZ 0 local DX; enable when packaging for K8s.
  // output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Pin workspace root so parent-directory lockfiles are ignored.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
