import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: { unoptimized: true },
};

initOpenNextCloudflareForDev();

export default nextConfig;
