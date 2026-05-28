import { getAllCharacters } from "@/lib/kv/getCharacters";
import { getExceptions } from "@/lib/kv/exceptions";
import { ExceptionsForm } from "@/components/admin/ExceptionsForm";

export const dynamic = "force-dynamic";

export default async function AdminExceptionsPage() {
  const [characters, exceptions] = await Promise.all([
    getAllCharacters(),
    getExceptions(),
  ]);

  return <ExceptionsForm characters={characters} initialExceptions={exceptions} />;
}
