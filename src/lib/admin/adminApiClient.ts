import { z } from "zod";
import type { Feedback } from "@/lib/feedback";
import { formatIssues } from "./formatIssues";

/** 失敗時の文言。API ごとに異なるので呼び出し側から渡す。 */
export interface FailureMessages {
  /** サーバがエラー本文を返さなかったときの文言。 */
  withoutDetail: string;
  /** エラー本文があるとき `${withDetail}: ${本文}` として出す接頭辞。 */
  withDetail: string;
}

export interface SendJsonOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** JSON 化して送るボディ。DELETE のように本文が不要なら省略する。 */
  body?: unknown;
  failureMessages: FailureMessages;
}

/**
 * 送信結果。成功時の data は応答本文を JSON として解釈したもので、
 * 本文が空、または JSON でない場合は undefined になる。
 */
export type SendJsonResult<Data> =
  | { ok: true; data: Data | undefined }
  | { ok: false; message: string };

const NETWORK_ERROR_PREFIX = "通信エラー";

const buildFailureMessage = (
  messages: FailureMessages,
  detail: string,
): string =>
  detail === "" ? messages.withoutDetail : `${messages.withDetail}: ${detail}`;

/**
 * parseJsonBody（サーバ側）が返すエラー応答の形。ネットワーク越しの値なので、
 * 型アサーションではなくスキーマで検証してから使う（想定外の形をそのまま整形して
 * 実行時エラーになり、原因と無関係な「通信エラー」に化けるのを防ぐ）。
 * path の要素が string | number だけなのは、JSON では symbol を表現できないため。
 */
const apiErrorBodySchema = z.object({
  error: z.string().optional(),
  issues: z
    .array(
      z.object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string(),
      }),
    )
    .optional(),
});

/**
 * エラー応答本文から、画面に出す失敗理由を1行にして返す。
 *
 * サーバのエラー応答は `{ error, issues }` の JSON なので、そのまま画面に出すと
 * 生の JSON 文字列になって読みにくい。JSON として解釈できたときは詳細一式を
 * コンソールにだけ出し（原因調査用）、画面には issues を整形した一言
 * （無ければ error 文字列）だけを返す。
 * JSON でない応答（プレーンテキストのエラー文言）はそのまま画面の理由として使う。
 */
const describeErrorResponse = (text: string): string => {
  if (text === "") {
    return "";
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return text;
  }
  console.error("API error response", body);
  const parsed = apiErrorBodySchema.safeParse(body);
  if (!parsed.success) {
    // 想定外の形。生の中身は上のログに残っているので、画面は詳細なしの文言に落とす。
    return "";
  }
  const { error, issues } = parsed.data;
  if (issues !== undefined && issues.length > 0) {
    return formatIssues(issues);
  }
  return error ?? "";
};

/**
 * 管理画面の書き込み API を叩く。
 *
 * 通信例外もサーバエラーも throw せず結果として返すため、呼び出し側の hook は
 * try/catch/finally を書かずに済む。これは可読性のためだけでなく、React Compiler が
 * finally 節を含む関数のコンパイルを諦める（バイルアウトして自動メモ化が効かなくなる）
 * のを避ける意味もある。
 */
export const sendJson = async <Data>(
  url: string,
  options: SendJsonOptions,
): Promise<SendJsonResult<Data>> => {
  try {
    const response = await fetch(url, {
      method: options.method,
      ...(options.body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options.body),
          }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        message: buildFailureMessage(
          options.failureMessages,
          describeErrorResponse(text),
        ),
      };
    }
    const data = (await response.json().catch(() => undefined)) as
      | Data
      | undefined;
    return { ok: true, data };
  } catch (error) {
    console.error(`${options.method} ${url} failed`, error);
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `${NETWORK_ERROR_PREFIX}: ${message}` };
  }
};

/** 保存 API の結果通知に使う文言。失敗時の文言に成功時の文言を足したもの。 */
export interface SaveMessages extends FailureMessages {
  success: string;
}

/** 保存 API の既定文言。個別に変えたいフィールドだけスプレッドで上書きする。 */
export const DEFAULT_SAVE_MESSAGES: SaveMessages = {
  success: "保存しました",
  withoutDetail: "保存に失敗しました",
  withDetail: "保存に失敗しました",
};

/**
 * 保存 API（PUT + JSON body）を叩き、結果を Feedback へ変換する。
 * 応答本文は成否の判定にしか使わないため呼び出し側へは返さない。
 */
export const saveWithFeedback = async (
  url: string,
  body: unknown,
  messages: SaveMessages = DEFAULT_SAVE_MESSAGES,
): Promise<Feedback> => {
  const result = await sendJson(url, {
    method: "PUT",
    body,
    failureMessages: messages,
  });
  return result.ok
    ? { ok: true, message: messages.success }
    : { ok: false, message: result.message };
};
