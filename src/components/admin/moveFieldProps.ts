import type { Move } from "@/types/move";

/**
 * 技の入力欄コンポーネントに共通の Props。
 *
 * 編集中の技と、更新後の技を親へ返すコールバックだけを持つ。技の状態は
 * PhaseMoveEditor が一元管理し、各入力欄は「受け取って返す」だけの
 * プレゼンテーション層に徹するため、この形が全ての入力欄で共通になる。
 * 追加の Props が要るコンポーネントはこれを extends する。
 */
export interface MoveFieldGroupProps {
  move: Move;
  onChange: (move: Move) => void;
}
