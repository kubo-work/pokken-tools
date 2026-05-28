import { auth } from "@/lib/auth/config";
import { listAllowedEmails } from "@/lib/d1/allowedEmails";
import { AllowedEmailsForm } from "@/components/admin/AllowedEmailsForm";

export const dynamic = "force-dynamic";

export default async function AdminAllowedEmailsPage() {
  const [session, emails] = await Promise.all([auth(), listAllowedEmails()]);
  return (
    <AllowedEmailsForm
      initialEmails={emails}
      currentUserEmail={session?.user?.email}
    />
  );
}
