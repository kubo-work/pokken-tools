import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { Feedback } from "@/lib/feedback";

/** 成功メッセージを自動で消すまでの時間（ミリ秒）。 */
const SUCCESS_DISMISS_DELAY_MS = 4000;

export interface UseAutoDismissedFeedbackResult {
  feedback: Feedback | undefined;
  setFeedback: Dispatch<SetStateAction<Feedback | undefined>>;
}

/**
 * 保存結果の通知を保持し、成功メッセージだけ一定時間後に自動で消す hook。
 *
 * 「保存しました」が出たままだと、次に修正して保存し直したときに新しい結果なのか
 * 前回の表示が残っているだけなのか区別できない。成功を消すことで、次の保存で
 * 再表示されたこと自体が成功のシグナルになる。
 * 失敗は原因を読む時間が要るので消さず、次の操作まで残す。
 */
export const useAutoDismissedFeedback = (): UseAutoDismissedFeedbackResult => {
  const [feedback, setFeedback] = useState<Feedback | undefined>(undefined);

  useEffect(() => {
    if (feedback === undefined || !feedback.ok) {
      return;
    }
    // 保存のたびに新しい Feedback オブジェクトが入るため、この effect も張り直されてタイマーが延びる。
    const timerId = setTimeout(() => {
      setFeedback(undefined);
    }, SUCCESS_DISMISS_DELAY_MS);
    return () => {
      clearTimeout(timerId);
    };
  }, [feedback]);

  return { feedback, setFeedback };
};
