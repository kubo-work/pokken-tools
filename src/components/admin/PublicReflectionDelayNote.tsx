import { Text } from "@mantine/core";
import { PUBLIC_KV_CACHE_TTL_MINUTES } from "@/lib/kv/cacheTtl";

/**
 * 保存内容が公開ページへ反映されるまでのラグを伝える注記。
 *
 * 公開ページの KV 読み取りにはエッジキャッシュ（cacheTtl）が効いており、一般ユーザーには
 * 保存が即座には見えない。管理者はキャッシュを迂回して読むため、編集者自身が公開ページを
 * 開いて「反映されていない」と誤解しないよう、両者の違いも書いておく。
 *
 * 文言を編集画面ごとに直書きすると片方だけ古くなるため、保存を伴う admin 画面で共有する。
 */
export const PublicReflectionDelayNote = () => (
  <Text size="xs" c="amber.5">
    保存後、一般ユーザーの公開ページに反映されるまで最大
    {PUBLIC_KV_CACHE_TTL_MINUTES}分かかります（ログイン中の管理者には即時反映）。
  </Text>
);
