import { getAllCharacters } from "@/lib/kv/getCharacters";
import { getExceptions } from "@/lib/kv/exceptions";
import { PunishSearch } from "./PunishSearch";

export const dynamic = "force-dynamic";

export default async function PunishPage() {
  const [characters, exceptions] = await Promise.all([
    getAllCharacters(),
    getExceptions(),
  ]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">確定反撃検索</h1>
        <p className="page-lead">
          ガードされた攻撃側の技と、反撃する防御側のキャラを選ぶと、確定する反撃技を列挙します。
        </p>
      </div>
      <PunishSearch characters={characters} exceptions={exceptions} />
    </>
  );
}
