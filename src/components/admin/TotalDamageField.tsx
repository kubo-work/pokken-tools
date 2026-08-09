import { useEffect } from "react";
import { Box, Collapse } from "@mantine/core";
import { ACCENT_BORDER } from "@/lib/admin/surfaceTokens";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { TOTAL_DAMAGE_DESCRIPTION } from "./moveFieldsHelpers";

/** アクセント帯と入力欄の間隔 (px)。CharacterEditor の見出しと同じ体裁に揃える。 */
const ACCENT_PADDING_LEFT = 10;

export interface TotalDamageFieldProps {
  /** 入力欄の key に使う接頭辞。技単位／各条件付き差分で衝突しない値を渡す。 */
  idPrefix: string;
  /** 基礎ダメージが多段ヒットで、合計ダメージを設定できる状態か。 */
  show: boolean;
  placeholder: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

/**
 * 合計ダメージの入力欄。基礎ダメージが多段ヒットになるまでは schema 側で設定を拒否するため
 * （totalDamageRefinements 参照）、条件が整うまでは折りたたんで隠す。表示に切り替わった瞬間に
 * 気づけるよう、スライドインのアニメーション（Collapse）と共鳴上書きと同じアンバー色の
 * 縁取り（表示中は常時）を付ける。
 *
 * 非表示になった瞬間、値が残っていれば自動で削除する。Collapse は非表示中も要素を
 * マウントしたままにする（keepMounted 既定）ため値自体は消えず、隠したまま放置すると
 * 保存時にスキーマ検証（多段ヒット技のみ設定可）で弾かれて理由が分かりにくい失敗になる。
 * 表示条件が整った時点で改めて入力すればよいだけなので、非表示化と同時に消して問題ない。
 */
export const TotalDamageField = ({
  idPrefix,
  show,
  placeholder,
  value,
  onChange,
}: TotalDamageFieldProps) => {
  useEffect(() => {
    if (!show && value !== undefined) {
      onChange(undefined);
    }
  }, [show, value, onChange]);

  return (
    <Collapse expanded={show}>
      <Box
        style={{
          borderLeft: ACCENT_BORDER,
          paddingLeft: ACCENT_PADDING_LEFT,
        }}
      >
        <IntegerNumberInput
          key={`${idPrefix}-totalDamage`}
          label={MOVE_FIELD_LABELS.totalDamage}
          description={TOTAL_DAMAGE_DESCRIPTION}
          placeholder={placeholder}
          min={1}
          value={value}
          onChange={onChange}
        />
      </Box>
    </Collapse>
  );
};
