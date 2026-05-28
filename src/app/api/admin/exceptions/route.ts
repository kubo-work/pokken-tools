import { NextResponse } from "next/server";
import { exceptionsSchema } from "@/lib/schema";
import { setExceptions } from "@/lib/kv/exceptions";

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = exceptionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  await setExceptions(parsed.data);
  return NextResponse.json({ ok: true });
}
