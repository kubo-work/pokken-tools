import type { ReactNode } from "react";
import { FrameNumber } from "@/components/FrameNumber";

/**
 * 技詳細ページの比較テーブルで、フレーム行・ダメージ行・属性行のすべてが共有する表示部品。
 * 特定の表だけで使うものはここではなく、その行定義ファイル側に置く。
 */

/** 値が未計測、またはその技には存在しないことを表すセルの表示。 */
export const NOT_MEASURED_TEXT = "-";

/** 共鳴中の上書き値を amber の「→値」でセル内に併記する。 */
const ResonanceArrow = ({ children }: { children: ReactNode }) => (
  <span className="move-detail__override"> →{children}</span>
);

/**
 * 共鳴中の上書き値の併記。undefined は「共鳴でも変化しない」を意味するため何も描かない。
 * 各行が個別に undefined 判定を書くと同じ条件分岐が全行・全ファイルに散るため、
 * 判定ごとここに閉じ込めて呼び出し側は値を渡すだけにする。
 */
export const ResonanceOverride = ({
  value,
}: {
  value: number | string | undefined;
}) => (value === undefined ? null : <ResonanceArrow>{value}</ResonanceArrow>);

/**
 * 硬直差のように符号付きで見せるフレーム値の共鳴上書き。
 * 有利/不利の色分けが要る点だけが ResonanceOverride と異なる。
 */
export const ResonanceFrameOverride = ({
  value,
}: {
  value: number | undefined;
}) =>
  value === undefined ? null : (
    <ResonanceArrow>
      <FrameNumber value={value} />
    </ResonanceArrow>
  );
