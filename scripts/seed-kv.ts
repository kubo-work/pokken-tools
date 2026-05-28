/**
 * data/ 配下の JSON を Cloudflare KV に投入する seed スクリプト。
 *
 * 使い方:
 *   npx tsx scripts/seed-kv.ts --local   # .wrangler/state 配下のローカルKV
 *   npx tsx scripts/seed-kv.ts --remote  # 本番KV
 *
 * 内部で wrangler kv key put を呼ぶ。wrangler が認証済みである必要がある。
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const BINDING = "FRAME_DATA_KV";
const DATA_DIR = path.resolve(process.cwd(), "data");

function parseFlag(): "--local" | "--remote" {
  const arg = process.argv[2];
  if (arg === "--local" || arg === "--remote") {
    return arg;
  }
  console.error("Usage: tsx scripts/seed-kv.ts --local | --remote");
  process.exit(1);
}

function putKv(target: "--local" | "--remote", key: string, value: string): void {
  const result = spawnSync(
    "npx",
    ["wrangler", "kv", "key", "put", "--binding", BINDING, target, key, value],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Failed to put KV key: ${key}`);
  }
}

function main(): void {
  const target = parseFlag();

  // characters
  const charactersDir = path.join(DATA_DIR, "characters");
  const files = readdirSync(charactersDir).filter((name) => name.endsWith(".json"));
  for (const file of files) {
    const id = file.replace(/\.json$/, "");
    const raw = readFileSync(path.join(charactersDir, file), "utf8");
    console.log(`[seed] character:${id}`);
    putKv(target, `character:${id}`, raw);
  }

  // exceptions
  const exceptionsRaw = readFileSync(path.join(DATA_DIR, "exceptions.json"), "utf8");
  console.log("[seed] exceptions");
  putKv(target, "exceptions", exceptionsRaw);

  console.log(`\n${files.length} characters + exceptions seeded to ${target.slice(2)} KV.`);
}

main();
