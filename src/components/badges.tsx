import { CATEGORY_META } from "@/lib/meta";
import type { MoveCategory } from "@/types/move";

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
