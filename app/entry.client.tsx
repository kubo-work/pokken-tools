import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

/**
 * クライアントのエントリ。hydration 部分は React Router の既定と同じ内容で、
 * これに開発用ツールの初期化を足すためだけに自前で持っている。
 *
 * locator.js は「ブラウザ上の要素を Option+クリックでエディタを開く」開発用ツール。
 * 要素の位置情報は vite.config.ts の @locator/babel-jsx が JSX に埋め込み、
 * ここで読み込む runtime がそれを使う。
 * import.meta.env.DEV の分岐は静的に解決されるため、本番バンドルには含まれない。
 */
if (import.meta.env.DEV) {
  import("@locator/runtime")
    .then((locatorRuntime) => locatorRuntime.default())
    .catch((error: unknown) => {
      console.error("locator.js の初期化に失敗しました", error);
    });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
