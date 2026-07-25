import { redirect } from "react-router";
import type { Route } from "./+types/google";
import { getAuthenticator, GOOGLE_STRATEGY } from "@/auth/authenticator.server";

/**
 * OAuth 開始（resource route）。
 * signin フォームからの POST を受け、Google の認可画面へリダイレクトする
 * （authenticate が Response を throw し、React Router がそれを応答として返す）。
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const authenticator = await getAuthenticator(request);
  return await authenticator.authenticate(GOOGLE_STRATEGY, request);
};

/** GET で直接来た場合はサインイン画面へ戻す。 */
export const loader = () => redirect("/auth/signin");
