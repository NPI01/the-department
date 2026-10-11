import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Showrunner sign-in · The Department" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-16 sm:py-24">
      <p className="text-xs uppercase tracking-[0.25em] text-ink-2">The Department</p>
      <h1 className="mt-2 text-xl font-semibold">Showrunner console</h1>
      <Suspense>
        <Notice searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </main>
  );
}

async function Notice({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const sp = await searchParams;
  if (sp.error) return <p className="mt-4 text-sm text-stamp">That sign-in link was invalid or expired. Request a new one.</p>;
  if (sp.denied) {
    return (
      <div className="mt-4 text-sm">
        <p className="text-stamp">This account is not on the staff list.</p>
        <form action={signOut} className="mt-2"><button className="underline">Sign out</button></form>
      </div>
    );
  }
  return null;
}
