import type { Route } from "./+types/allowed-emails";
import { userContext } from "@/auth/context";
import { listAllowedEmails } from "@/lib/d1/allowedEmails";
import { AllowedEmailsForm } from "@/components/admin/AllowedEmailsForm";

export const loader = async ({ context }: Route.LoaderArgs) => {
  const emails = await listAllowedEmails();
  return { emails, currentUserEmail: context.get(userContext).email };
};

export default function AdminAllowedEmailsPage({
  loaderData,
}: Route.ComponentProps) {
  const { emails, currentUserEmail } = loaderData;
  return (
    <AllowedEmailsForm
      initialEmails={emails}
      currentUserEmail={currentUserEmail}
    />
  );
}
