export interface NavigationBlockInput {
  hasUnsavedChanges: boolean;
  currentPathname: string;
  nextPathname: string;
}

/**
 * 未保存の変更がある編集画面からのアプリ内遷移を止めるかを判定する。
 * 同じ画面内の search / hash の変化では編集 state は失われないため、pathname が変わるときだけ止める。
 * 別キャラへの遷移（/admin/characters/:id の変化）も pathname が変わるので止める対象になる。
 */
export const shouldBlockNavigation = ({
  hasUnsavedChanges,
  currentPathname,
  nextPathname,
}: NavigationBlockInput): boolean =>
  hasUnsavedChanges && currentPathname !== nextPathname;
