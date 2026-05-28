import { getEnv } from "@/lib/cloudflare";

export interface AllowedEmail {
  email: string;
  createdAt: string;
}

/** OAuth ログイン時にこのチェックが通らないと拒否する。 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  const env = await getEnv();
  const result = await env.DB.prepare(
    "SELECT 1 FROM allowed_emails WHERE email = ? LIMIT 1",
  )
    .bind(email)
    .first();
  return result !== null;
}

export async function listAllowedEmails(): Promise<AllowedEmail[]> {
  const env = await getEnv();
  const result = await env.DB.prepare(
    "SELECT email, created_at AS createdAt FROM allowed_emails ORDER BY email ASC",
  ).all<AllowedEmail>();
  return result.results;
}

/** すでに存在する場合は何もしない（冪等）。 */
export async function addAllowedEmail(email: string): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare(
    "INSERT INTO allowed_emails (email) VALUES (?) ON CONFLICT (email) DO NOTHING",
  )
    .bind(email)
    .run();
}

export async function removeAllowedEmail(email: string): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM allowed_emails WHERE email = ?").bind(email).run();
}
