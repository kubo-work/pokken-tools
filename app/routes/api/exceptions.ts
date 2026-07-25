import type { Route } from "./+types/exceptions";
import { requireApiUser } from "@/auth/session.server";
import { exceptionsSchema } from "@/lib/schema";
import { setExceptions } from "@/lib/kv/exceptions";
import { parseJsonBody } from "@/lib/parseJsonBody";

/** 例外設定の保存(PUT)。resource route。 */
export const action = async ({ request }: Route.ActionArgs) => {
  await requireApiUser(request);

  if (request.method !== "PUT") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const exceptions = await parseJsonBody(request, exceptionsSchema);
  await setExceptions(exceptions);
  return Response.json({ ok: true });
};
