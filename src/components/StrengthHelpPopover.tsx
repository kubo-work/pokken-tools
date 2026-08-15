import { PROJECTILE_STRENGTH_SYMBOLS } from "@/lib/moves/moveEnums";
import { STRENGTH_SYMBOL_META } from "@/lib/moves/moveLabels";

/**
 * 強度の説明ポップアップ。技一覧テーブルの直上に置き、クリックで開閉する。
 * 公開ページには MantineProvider が無いため、JS 不要の <details> ベースで実装する。
 * 説明文はクライアント提供の仕様（同じ攻撃属性同士がかち合った場合の挙動）。
 */
export const StrengthHelpPopover = () => {
  return (
    <details className="strength-help">
      <summary className="strength-help__trigger">強度について</summary>
      <div className="strength-help__panel">
        <p className="strength-help__lead">
          打撃や弾がかち合った時の挙動を決める値。打撃は 1〜8、弾は 1〜9 と ◎・●。
        </p>
        <p className="strength-help__heading">打撃同士</p>
        <ul className="strength-help__list">
          <li>差が0: 相殺し、その後の硬直差 0F</li>
          <li>差が1: 相殺し、数値が大きい方が 10F 先に動ける</li>
          <li>差が2以上: 数値が大きい方が一方勝ち</li>
        </ul>
        <p className="strength-help__heading">弾同士</p>
        <ul className="strength-help__list">
          <li>同値: 対消滅</li>
          <li>差がある: 強度が低い弾のみ消滅</li>
        </ul>
        <p className="strength-help__heading">◎・●（弾のみ）</p>
        <ul className="strength-help__list">
          {PROJECTILE_STRENGTH_SYMBOLS.map((symbol) => (
            <li key={symbol}>
              {STRENGTH_SYMBOL_META[symbol].label}:{" "}
              {STRENGTH_SYMBOL_META[symbol].description}
            </li>
          ))}
        </ul>
        <p className="strength-help__note">
          ※数値の挙動はいずれも同じ攻撃属性同士（打撃同士・弾同士）がかち合った場合のもの
        </p>
      </div>
    </details>
  );
};
