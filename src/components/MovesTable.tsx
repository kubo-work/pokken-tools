import type { Move } from "@/types/move";
import { CategoryBadge, GuardBadges } from "@/components/badges";
import { ATTACK_TYPE_META, SPECIAL_ATTRIBUTE_META } from "@/lib/meta";

/**
 * 技一覧テーブル。共鳴差分は同じ行の下に小さく注記する。
 * 共鳴専用技は別途バッジを付与。
 */
export const MovesTable = ({ moves }: { moves: Move[] }) => {
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
          <th>判定</th>
          <th>攻撃属性</th>
          <th>特殊</th>
          <th className="num">発生</th>
          <th className="num">硬直F</th>
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
            <td>
              {move.attackType === undefined
                ? "-"
                : ATTACK_TYPE_META[move.attackType].label}
            </td>
            <td>
              {move.specialAttributes === undefined ||
              move.specialAttributes.length === 0
                ? "-"
                : move.specialAttributes
                    .map((attr) => SPECIAL_ATTRIBUTE_META[attr].label)
                    .join(" / ")}
            </td>
            <td className="num">
              {move.startup}
              {move.resonance?.startup !== undefined && (
                <span style={{ color: "#f59e0b" }}>
                  {" "}
                  →{move.resonance.startup}
                </span>
              )}
            </td>
            <td className="num">
              {move.recovery}
              {move.resonance?.recovery !== undefined && (
                <span style={{ color: "#f59e0b" }}>
                  {" "}
                  →{move.resonance.recovery}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
