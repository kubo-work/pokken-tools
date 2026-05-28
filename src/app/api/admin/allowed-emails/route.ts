import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  addAllowedEmail,
  removeAllowedEmail,
} from "@/lib/d1/allowedEmails";
import { emailSchema } from "@/lib/schema";

const addBodySchema = z.object({ email: emailSchema });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = addBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  await addAllowedEmail(parsed.data.email);
  return NextResponse.json({
    email: parsed.data.email,
    createdAt: new Date().toISOString(),
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  if (email === null || email === "") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // 自分自身を削除させない安全装置（フロントの UI でも防いでいるが二重に防御）
  const session = await auth();
  if (
    session?.user?.email !== undefined &&
    session.user.email.toLowerCase() === email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Cannot remove your own email" },
      { status: 400 },
    );
  }

  await removeAllowedEmail(email);
  return NextResponse.json({ ok: true });
}
