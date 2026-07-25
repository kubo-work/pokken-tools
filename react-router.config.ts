import type { Config } from "@react-router/dev/config";

export default {
  // 全ページ SSR（Cloudflare vite-plugin は SPA モード/プリレンダリング非対応。本サイトは
  // KV/D1 を loader で読む SSR 前提のため問題ない）。
  ssr: true,
} satisfies Config;
