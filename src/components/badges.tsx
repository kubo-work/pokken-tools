import { CATEGORY_META, GUARD_LEVEL_META } from "@/lib/meta";
import type { GuardLevel, MoveCategory } from "@/types/move";

export const CategoryBadge = ({
  category,
}: {
  category: MoveCategory | undefined;
}) => {
  if (category === undefined) {
    return null;
  }
  const meta = CATEGORY_META[category];
  return (
    <span className="badge" style={{ background: meta.color }}>
      {meta.shortLabel}
    </span>
  );
};

export const GuardBadge = ({ level }: { level: GuardLevel | null }) => {
  if (level === null) {
    return null;
  }
  return <span>{GUARD_LEVEL_META[level].shortLabel}</span>;
};
