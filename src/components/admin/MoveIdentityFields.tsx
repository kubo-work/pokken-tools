import { SimpleGrid, TextInput } from "@mantine/core";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { setMoveField } from "./moveUpdaters";

export interface MoveIdentityFieldsProps extends MoveFieldGroupProps {
  isChild: boolean;
}

/**
 * 技名とコマンドの入力欄。
 *
 * ため技 (charge) はコマンドを持たない。表示は親コマンドに「長押し」を付けて導出し、
 * 段階は chargeLevel で表すため move.command を使わないため（formatMoveCommand 参照）。
 * 派生技の command は「親からの追加入力のみ」を入れる規約なのでラベルを変える。
 */
export const MoveIdentityFields = ({
  move,
  isChild,
  onChange,
}: MoveIdentityFieldsProps) => {
  const hasCommandField = move.variant !== "charge";
  return (
    // コマンド欄が無いため技を2列のままにすると右半分が空くので、そのときだけ1列にする。
    <SimpleGrid cols={{ base: 1, sm: hasCommandField ? 2 : 1 }}>
      <TextInput
        label="技名"
        withAsterisk
        value={move.name}
        onChange={(event) =>
          onChange(setMoveField(move, "name", event.currentTarget.value))
        }
      />
      {hasCommandField && (
        <TextInput
          label={isChild ? "コマンド（親からの追加入力）" : "コマンド"}
          withAsterisk={!isChild}
          value={move.command}
          onChange={(event) =>
            onChange(setMoveField(move, "command", event.currentTarget.value))
          }
        />
      )}
    </SimpleGrid>
  );
};
