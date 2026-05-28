import { NextResponse } from "next/server";
import { isKnownCharacterId } from "@/lib/characters/registry";
import { characterSchema } from "@/lib/schema";
import { setCharacter } from "@/lib/kv/setCharacter";

type Params = Promise<{ id: string }>;

/**
 * キャラの技データを KV へ保存。
 * middleware で認証済みのリクエストのみ到達する。
 */
export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  if (!isKnownCharacterId(id)) {
    return NextResponse.json({ error: "Unknown character id" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = characterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (parsed.data.id !== id) {
    return NextResponse.json(
      { error: "Path id and body id mismatch" },
      { status: 400 },
    );
  }
  await setCharacter(parsed.data);
  return NextResponse.json({ ok: true });
}
