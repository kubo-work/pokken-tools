import type { CSSProperties, ReactNode, Ref } from "react";
import { Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { MOVE_VARIANT_META } from "@/lib/moves/moveLabels";
import type { Move, Phase } from "@/types/move";
import { HitBreakdownFields } from "./HitBreakdownFields";
import { MoveChildVariantFields } from "./MoveChildVariantFields";
import { MoveDamageFields } from "./MoveDamageFields";
import { MoveFieldPhasePanel } from "./MoveFieldPhasePanel";
import { MoveFields } from "./MoveFields";
import { MoveJustInputPanel } from "./MoveJustInputPanel";
import { MoveResonancePanel } from "./MoveResonancePanel";
import { MoveTextFields } from "./MoveTextFields";
import { MoveTimingFields } from "./MoveTimingFields";
import { setMoveHitBreakdown } from "@/lib/moves/moveHitBreakdownUpdaters";

export interface MoveEditorProps {
  move: Move;
  index: number;
  isChild: boolean;
  /** 技が登録されているフェイズ。共通技のときだけ MoveFieldPhasePanel を表示する。 */
  phase: Phase;
  onChange: (move: Move) => void;
  onRemove: () => void;
  /** ドラッグ用ハンドル。並び替え対象のときだけ渡す（詳細表示の親には渡さない）。 */
  dragHandle?: ReactNode;
  /** sortable のとき dnd-kit から渡す ref。 */
  rootRef?: Ref<HTMLDivElement>;
  /** sortable の transform など、カードに載せる追加スタイル。 */
  rootStyle?: CSSProperties;
  /** カード背景（サーフェストークン）。 */
  rootBg?: string;
  /** ため・派生リストなどの入れ子スロット。 */
  children?: ReactNode;
}

/**
 * 1 技分の編集フォーム（プレゼンテーション専用）。
 * ドラッグ並び替えの状態は持たず、必要な場合は dragHandle / rootRef / rootStyle を
 * 親（SortableMoveEditor など）から受け取る。これにより「並び替え対象の子」と
 * 「詳細表示の親」で同じ見た目を再利用しつつ、sortable 依存を呼び出し側に分離できる。
 */
export const MoveEditor = ({
  move,
  index,
  isChild,
  phase,
  onChange,
  onRemove,
  dragHandle,
  rootRef,
  rootStyle,
  rootBg,
  children,
}: MoveEditorProps) => {
  const variantLabel =
    isChild && move.variant !== undefined
      ? MOVE_VARIANT_META[move.variant].label
      : undefined;

  return (
    <Card ref={rootRef} style={rootStyle} withBorder padding="md" bg={rootBg}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            {dragHandle}
            <Text fw={700}>#{index + 1}</Text>
            {variantLabel !== undefined && (
              <Badge color="grape" variant="light" size="sm">
                {variantLabel}
              </Badge>
            )}
          </Group>
          <Button
            variant="subtle"
            color="red"
            size="compact-sm"
            onClick={onRemove}
          >
            技を削除
          </Button>
        </Group>

        <MoveFields move={move} isChild={isChild} onChange={onChange} />
        {isChild && (
          <MoveChildVariantFields move={move} onChange={onChange} />
        )}
        <MoveTimingFields move={move} onChange={onChange} />
        <MoveDamageFields move={move} onChange={onChange} />
        <HitBreakdownFields
          idPrefix={`${move.id}-hitBreakdown`}
          switchLabel="ヒットごとに性能が変わる"
          switchDescription="ダメージ・PCH値・判定・空地判定・共鳴怯ませ・攻撃属性・強度がヒットごとに異なる技のみ ON"
          entries={move.hitBreakdown}
          onChange={(entries) => onChange(setMoveHitBreakdown(move, entries))}
          moveAttackType={move.attackType}
        />
        <MoveTextFields move={move} onChange={onChange} />
        <MoveResonancePanel move={move} onChange={onChange} />
        <MoveJustInputPanel move={move} onChange={onChange} />
        {phase === "common" && (
          <MoveFieldPhasePanel move={move} onChange={onChange} />
        )}

        {children}
      </Stack>
    </Card>
  );
};
