import type { Move } from "@/types/move";
import { CategoryBadge, GuardBadges } from "@/components/badges";
import { FrameNumber } from "@/components/FrameNumber";

/**
 * 技一覧テーブル。共鳴差分は同じ行の下に小さく注記する。
 * 共鳴専用技は別途バッジを付与。
 */
export function MovesTable({ moves }: { moves: Move[] }) {
  if (moves.length === 0) {
    return <div className="empty">登録されている技がありません。</div>;
  }
  return (
    <table className="moves-table">
      <thead>
        <tr>
          <th>分類</th>
          <th>技名</th>
          <th>コマンド</th>
          <th>ガード</th>
          <th className="num">発生</th>
          <th className="num">持続</th>
          <th className="num">ガード差</th>
          <th className="num">ヒット差</th>
          <th className="num">威力</th>
        </tr>
      </thead>
      <tbody>
        {moves.map((move) => (
          <tr key={move.id}>
            <td>
              <CategoryBadge category={move.category} />
              {move.resonanceOnly === true && (
                <span style={{ marginLeft: 4, fontSize: 11, color: "#f59e0b" }}>
                  共鳴
                </span>
              )}
            </td>
            <td>
              {move.name}
              {move.note !== undefined && (
                <div style={{ fontSize: 11, color: "#9095a0" }}>{move.note}</div>
              )}
            </td>
            <td>{move.command}</td>
            <td>
              <GuardBadges levels={move.guardLevels} />
            </td>
            <td className="num">
              {move.startup}
              {move.resonance?.startup !== undefined && (
                <span style={{ color: "#f59e0b" }}> →{move.resonance.startup}</span>
              )}
            </td>
            <td className="num">{move.active}</td>
            <td className="num">
              <FrameNumber value={move.blockAdvantage} />
              {move.resonance?.blockAdvantage !== undefined && (
                <span style={{ color: "#f59e0b" }}>
                  {" → "}
                  <FrameNumber value={move.resonance.blockAdvantage} />
                </span>
              )}
            </td>
            <td className="num">
              <FrameNumber value={move.hitAdvantage} />
            </td>
            <td className="num">
              {move.damage}
              {move.resonance?.damage !== undefined && (
                <span style={{ color: "#f59e0b" }}> →{move.resonance.damage}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
