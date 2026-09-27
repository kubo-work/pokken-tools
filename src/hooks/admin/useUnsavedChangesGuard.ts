import { useEffect } from "react";
import { useBlocker, type Blocker } from "react-router";
import { shouldBlockNavigation } from "@/lib/admin/shouldBlockNavigation";

/**
 * 未保存の変更があるとき、画面からの離脱に確認を挟む hook。
 * - ブラウザの再読み込み・タブを閉じる: beforeunload でブラウザ標準の確認を出す
 * - アプリ内の画面遷移: useBlocker で遷移を止め、確認 UI は返した blocker を見て呼び出し側が出す
 */
export const useUnsavedChangesGuard = (hasUnsavedChanges: boolean): Blocker => {
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return useBlocker(({ currentLocation, nextLocation }) =>
    shouldBlockNavigation({
      hasUnsavedChanges,
      currentPathname: currentLocation.pathname,
      nextPathname: nextLocation.pathname,
    }),
  );
};
