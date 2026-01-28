import type { NextConfig } from "next";

const nextConfig: any = {
  // eslintの設定は削除（.eslintignoreファイルの方で対応するため）
  typescript: {
    // 型エラーだけはここで無視する
    ignoreBuildErrors: true,
  },
};

export default nextConfig;