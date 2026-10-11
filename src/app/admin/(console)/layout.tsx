import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { getSeasons } from "@/lib/admin/queries";
import { signOut } from "../login/actions";
import { Nav, NavList } from "./nav";
import { SeasonSelect } from "./season-select";
import { Badge, Loading, statusTone } from "./ui";

export const metadata: Metadata = { title: "Showrunner · The Department" };
// The console reads the session on every request; it is not meant to prerender.
export const instant = false;

export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b border-rule px-4 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r md:px-3 md:py-6">
        <div className="mb-4 px-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-2">The Department</p>
          <p className="text-sm font-semibold">Showrunner console</p>
        </div>
        <Suspense fallback={<NavList />}><Nav /></Suspense>
        <div className="mt-4 space-y-3 px-3 md:mt-8">
          <Suspense><Season /></Suspense>
          <Suspense><Who /></Suspense>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
        <Suspense fallback={<Loading />}>
          <Gate>{children}</Gate>
        </Suspense>
      </main>
    </div>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

async function Season() {
  const { season, seasons } = await getSeasons();
  if (!season) return <p className="text-xs text-ink-2">No season in the database. Run <code>pnpm seed</code>.</p>;
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-2">Season</p>
      {seasons.length > 1 ? <SeasonSelect seasons={seasons} current={season.slug} /> : <p className="text-sm">{season.title}</p>}
      <Badge tone={statusTone(season.status)}>{season.status}</Badge>
    </div>
  );
}

async function Who() {
  const admin = await requireAdmin();
  return (
    <form action={signOut} className="text-xs text-ink-2">
      <p className="truncate" title={admin.email}>{admin.email}</p>
      <button className="underline hover:text-ink">Sign out</button>
    </form>
  );
}
