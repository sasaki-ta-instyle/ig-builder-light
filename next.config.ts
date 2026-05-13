import type { NextConfig } from "next";

// プレースホルダ: 新規プロジェクト初期化時に Claude Code が置換する
// ig-builder-light = ローカルフォルダ名（例: my-cool-app）
const APP_NAME = "ig-builder-light";

// Vercel プレビュー時は basePath を外したい場合は環境変数で切替
const isVercel = process.env.VERCEL === "1";

const BASE_PATH = isVercel ? "" : `/${APP_NAME}`;

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: BASE_PATH,
  // basePath 配下のアセット解決を確実にする
  assetPrefix: isVercel ? undefined : BASE_PATH,
  trailingSlash: false,
  reactStrictMode: true,
  env: {
    // クライアント側 fetch を絶対 basePath 解決させるため公開する
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

export default nextConfig;
