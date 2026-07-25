import { redirect } from "react-router";
import type { Route } from "./+types/signout";
import { destroyUserSession } from "@/auth/session.server";

/**
 * サインアウト（resource route）。セッションを破棄してトップへ戻す。
 * admin レイアウトのログアウトフォームから POST される。
 */
export const action = async ({ request }: Route.ActionArgs) =>
  destroyUserSession(request, "/");

export const loader = () => redirect("/");
