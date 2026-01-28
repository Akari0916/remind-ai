import type { NextConfig } from "next";

const nextConfig: any = {
  // eslintブロックは削除しました
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;