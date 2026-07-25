import { z } from "zod";
import type { Route } from "./+types/allowed-emails";
import { requireApiUser } from "@/auth/session.server";
import { addAllowedEmail, removeAllowedEmail } from "@/lib/d1/allowedEmails";
import { emailSchema } from "@/lib/schema";
import { parseJsonBody } from "@/lib/parseJsonBody";

const addBodySchema = z.object({ email: emailSchema });

/**
 * 許可メールの追加(POST)/削除(DELETE)。resource route（コンポーネントなし）。
 * requireApiUser で /api/admin 相当の認証保護を行う。
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireApiUser(request);

  if (request.method === "POST") {
    const { email } = await parseJsonBody(request, addBodySchema);
    await addAllowedEmail(email);
    return Response.json({ email, createdAt: new Date().toISOString() });
  }

  if (request.method === "DELETE") {
    const email = new URL(request.url).searchParams.get("email");
    if (email === null || email === "") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }
    // 自分自身を削除させない安全装置（フロントの UI でも防いでいるが二重に防御）
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return Response.json(
        { error: "Cannot remove your own email" },
        { status: 400 },
      );
    }
    await removeAllowedEmail(email);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
};
