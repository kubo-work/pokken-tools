/**
 * フレーム硬直差を符号付きで表示し、有利/不利を色分けする。
 * 0 は中立色（クラスを付与しない）。
 */
export function FrameNumber({ value }: { value: number }) {
  const className =
    value > 0 ? "frame-num frame-num--good" : value < 0 ? "frame-num frame-num--bad" : "frame-num";
  const sign = value > 0 ? "+" : "";
  return <span className={className}>{`${sign}${value}`}</span>;
}
