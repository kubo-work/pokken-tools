import { CATEGORY_META, GUARD_LEVEL_META } from "@/lib/meta";
import type { GuardLevel, MoveCategory } from "@/types/move";

export function CategoryBadge({ category }: { category: MoveCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="badge" style={{ background: meta.color }}>
      {meta.shortLabel}
    </span>
  );
}

export function GuardBadges({ levels }: { levels: GuardLevel[] }) {
  if (levels.length === 0) {
    return null;
  }
  return (
    <span>
      {levels.map((level) => GUARD_LEVEL_META[level].shortLabel).join("/")}
    </span>
  );
}
