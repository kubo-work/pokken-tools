import type { Route } from "./+types/exceptions";
import { getAllCharacters } from "@/lib/kv/getCharacters";
import { getExceptions } from "@/lib/kv/exceptions";
import { ExceptionsForm } from "@/components/admin/ExceptionsForm";

export async function loader() {
  const [characters, exceptions] = await Promise.all([
    getAllCharacters(),
    getExceptions(),
  ]);
  return { characters, exceptions };
}

export default function AdminExceptionsPage({
  loaderData,
}: Route.ComponentProps) {
  const { characters, exceptions } = loaderData;
  return (
    <ExceptionsForm characters={characters} initialExceptions={exceptions} />
  );
}
