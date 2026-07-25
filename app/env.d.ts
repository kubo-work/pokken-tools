/// <reference types="vite/client" />
/// <reference types="@react-router/dev/routes" />

// Worker エントリが読み込む React Router のサーバビルド仮想モジュール。
// ビルド時に react-router プラグインが実体を差し込むため、型のみここで宣言する。
declare module "virtual:react-router/server-build" {
  import type { ServerBuild } from "react-router";
  const build: ServerBuild;
  export = build;
}
