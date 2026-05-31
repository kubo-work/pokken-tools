import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      '**/*.{tsx,jsx}': {
        loaders: [
          {
            loader: '@locator/webpack-loader',
            options: { env: 'development' }
          }
        ]
      }
    }
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
