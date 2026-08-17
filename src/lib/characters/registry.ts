/**
 * 23キャラ固定のレジストリ。
 * 追加・削除がない前提なので、ID と表示名をここで一元管理する。
 * KVには技データだけ持つ。キャラ存在チェックと表示名はこのレジストリが正。
 */
export interface CharacterRegistryEntry {
  id: string;
  name: string;
}

export const CHARACTER_REGISTRY: readonly CharacterRegistryEntry[] = [
  { id: "pikachu", name: "ピカチュウ" },
  { id: "pikachu_libre", name: "マスクド・ピカチュウ" },
  { id: "lucario", name: "ルカリオ" },
  { id: "machamp", name: "カイリキー" },
  { id: "gengar", name: "ゲンガー" },
  { id: "blastoise", name: "カメックス" },
  { id: "charizard", name: "リザードン" },
  { id: "mewtwo", name: "ミュウツー" },
  { id: "shadow_mewtwo", name: "ダークミュウツー" },
  { id: "suicune", name: "スイクン" },
  { id: "weavile", name: "マニューラ" },
  { id: "gardevoir", name: "サーナイト" },
  { id: "blaziken", name: "バシャーモ" },
  { id: "sceptile", name: "ジュカイン" },
  { id: "empoleon", name: "エンペルト" },
  { id: "garchomp", name: "ガブリアス" },
  { id: "braixen", name: "テールナー" },
  { id: "chandelure", name: "シャンデラ" },
  { id: "aegislash", name: "ギルガルド" },
  { id: "darkrai", name: "ダークライ" },
  { id: "croagunk", name: "グレッグル" },
  { id: "scizor", name: "ハッサム" },
  { id: "decidueye", name: "ジュナイパー" },
] as const;

export const CHARACTER_IDS: readonly string[] = CHARACTER_REGISTRY.map(
  (entry) => entry.id,
);

const REGISTRY_BY_ID: Record<string, CharacterRegistryEntry> = Object.fromEntries(
  CHARACTER_REGISTRY.map((entry) => [entry.id, entry]),
);

export function getRegistryEntry(id: string): CharacterRegistryEntry | undefined {
  // isKnownCharacterId と同じ理由（constructor / __proto__ 等の prototype チェーン
  // 経由の誤解決を防ぐ）で Object.hasOwn を通してから読む。
  return Object.hasOwn(REGISTRY_BY_ID, id) ? REGISTRY_BY_ID[id] : undefined;
}

export function isKnownCharacterId(id: string): boolean {
  // REGISTRY_BY_ID[id] !== undefined だと constructor / __proto__ など prototype
  // チェーン経由で解決してしまい true になる。Object.hasOwn で自プロパティのみを見る。
  return Object.hasOwn(REGISTRY_BY_ID, id);
}
