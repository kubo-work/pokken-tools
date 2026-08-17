import { useState } from "react";
import type { Feedback } from "@/lib/feedback";
import {
  sendJson,
  type FailureMessages,
} from "@/lib/admin/adminApiClient";
import { ADMIN_API_ENDPOINTS } from "@/lib/admin/endpoints";
import { readJsonFile } from "@/lib/admin/readJsonFile";
import { characterBundleSchema, type CharacterBundle } from "@/lib/schema";
import { resolveBundleIssuePaths } from "@/lib/admin/bundleIssues";
import { formatIssues } from "@/lib/admin/formatIssues";
import { buildBundleFileName } from "@/lib/admin/bundleFileName";
import { useAutoDismissedFeedback } from "./useAutoDismissedFeedback";

export interface CharacterBundlePendingImport {
  characterCount: number;
  hasExceptions: boolean;
}

interface PendingImportState extends CharacterBundlePendingImport {
  bundle: CharacterBundle;
}

export interface UseCharacterBundleIOResult {
  exporting: boolean;
  importing: boolean;
  feedback: Feedback | undefined;
  pendingImport: CharacterBundlePendingImport | undefined;
  exportBundle: () => Promise<void>;
  selectImportFile: (file: File | null) => Promise<void>;
  /** 成功したら true を返す。呼び出し側（コンポーネント）で一覧の再検証に使う。 */
  confirmImport: () => Promise<boolean>;
  cancelImport: () => void;
}

/** PUT /api/admin/characters の成功レスポンス。 */
interface CharacterBundleImportResponse {
  ok: boolean;
  savedCharacterIds: string[];
  exceptionsApplied: boolean;
}

const EXPORT_FAILURE_MESSAGES: FailureMessages = {
  withoutDetail: "エクスポートに失敗しました",
  withDetail: "エクスポートに失敗しました",
};

const IMPORT_FAILURE_MESSAGES: FailureMessages = {
  withoutDetail: "インポートに失敗しました",
  withDetail: "インポートに失敗しました",
};

const downloadBundleFile = (bundle: CharacterBundle): void => {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildBundleFileName(bundle.exportedAt);
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * 管理画面トップの一括 JSON 入出力。
 * - export: GET /api/admin/characters の応答をそのままファイルダウンロード
 * - import: クライアント側で readJsonFile + characterBundleSchema による検証 → 確認 → PUT
 */
export const useCharacterBundleIO = (): UseCharacterBundleIOResult => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const { feedback, setFeedback } = useAutoDismissedFeedback();
  const [pendingImport, setPendingImport] = useState<
    PendingImportState | undefined
  >(undefined);

  const exportBundle = async (): Promise<void> => {
    setExporting(true);
    setFeedback(undefined);
    const result = await sendJson<CharacterBundle>(
      ADMIN_API_ENDPOINTS.characterBundle,
      { method: "GET", failureMessages: EXPORT_FAILURE_MESSAGES },
    );
    setExporting(false);
    if (!result.ok) {
      setFeedback({ ok: false, message: result.message });
      return;
    }
    if (result.data === undefined) {
      setFeedback({
        ok: false,
        message: "エクスポートに失敗しました（応答が空です）",
      });
      return;
    }
    downloadBundleFile(result.data);
    setFeedback({ ok: true, message: "エクスポートしました" });
  };

  const selectImportFile = async (file: File | null): Promise<void> => {
    if (file === null) {
      return;
    }
    setFeedback(undefined);
    const read = await readJsonFile(file);
    if (!read.ok) {
      setFeedback({ ok: false, message: read.message });
      return;
    }
    const parsed = characterBundleSchema.safeParse(read.value);
    if (!parsed.success) {
      console.error("character bundle validation failed", parsed.error.issues);
      const detail = formatIssues(
        resolveBundleIssuePaths(parsed.error.issues, read.value),
      );
      setFeedback({ ok: false, message: `JSONの内容が不正です: ${detail}` });
      return;
    }
    setPendingImport({
      bundle: parsed.data,
      characterCount: parsed.data.characters.length,
      hasExceptions: parsed.data.exceptions !== undefined,
    });
  };

  const confirmImport = async (): Promise<boolean> => {
    if (pendingImport === undefined) {
      return false;
    }
    const { bundle, characterCount } = pendingImport;
    setFeedback(undefined);
    setImporting(true);
    const result = await sendJson<CharacterBundleImportResponse>(
      ADMIN_API_ENDPOINTS.characterBundle,
      {
        method: "PUT",
        body: bundle,
        failureMessages: IMPORT_FAILURE_MESSAGES,
      },
    );
    setImporting(false);
    setPendingImport(undefined);
    if (!result.ok) {
      setFeedback({ ok: false, message: result.message });
      return false;
    }
    const exceptionsApplied = result.data?.exceptionsApplied === true;
    setFeedback({
      ok: true,
      message: exceptionsApplied
        ? `${characterCount}キャラと例外設定を上書きしました`
        : `${characterCount}キャラを上書きしました`,
    });
    return true;
  };

  const cancelImport = (): void => {
    setPendingImport(undefined);
  };

  return {
    exporting,
    importing,
    feedback,
    pendingImport,
    exportBundle,
    selectImportFile,
    confirmImport,
    cancelImport,
  };
};
