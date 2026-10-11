import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { Loading, PageHeader, Panel } from "../ui";
import { PasswordForm } from "./password-form";

export default function AccountPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader kicker="Account" title={admin.email}>Signed in as {admin.role}.</PageHeader>
      <Panel title="Password">
        <p className="mb-4 text-sm text-ink-2">Set a password to sign in without waiting for an emailed link. The link stays available as a fallback.</p>
        <PasswordForm />
      </Panel>
    </>
  );
}
