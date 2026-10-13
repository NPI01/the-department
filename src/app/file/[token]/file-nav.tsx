import Link from "next/link";

/* The tabs across the top of every page in a player's file, drawn as the
   tabs on a row of manila folders. The token is the only key, as everywhere
   under /file. */
export type FileTab = "file" | "directory" | "case" | "standings";

const TABS: { key: FileTab; label: string; short?: string; path: string }[] = [
  { key: "file", label: "Personnel file", short: "File", path: "" },
  { key: "directory", label: "Directory", path: "/directory" },
  { key: "case", label: "Case File", path: "/case" },
  { key: "standings", label: "Standings", path: "/standings" },
];

const label = (t: (typeof TABS)[number]) => t.short ? <><span className="sm:hidden">{t.short}</span><span className="hidden sm:inline">{t.label}</span></> : t.label;

export function FileNav({ token, active }: { token: string; active?: FileTab }) {
  return (
    <nav className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 text-xs uppercase tracking-[0.25em]">
        <Link href="/" className="hover:text-red">Weird.Delivery · The Department</Link>
        <span className="flex gap-4">
          <Link href="/rules" className="hover:text-red">Rulebook</Link>
          <Link href="/guide" className="hover:text-red">Field guide</Link>
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b-2 border-ink">
        {TABS.map((t) => t.key === active
          ? <span key={t.key} aria-current="page" className="relative -mb-0.5 shrink-0 border-2 border-b-0 border-ink bg-paper-2 px-2.5 pb-2.5 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-red sm:px-4 sm:text-[11px] sm:tracking-[0.2em]">{label(t)}</span>
          : <Link key={t.key} href={`/file/${token}${t.path}`} className="mt-1 shrink-0 border-2 border-b-0 border-rule bg-paper px-2.5 py-1.5 text-[10px] uppercase tracking-[0.15em] text-ink-2 hover:border-ink hover:text-ink sm:px-4 sm:text-[11px] sm:tracking-[0.2em]">{label(t)}</Link>)}
      </div>
    </nav>
  );
}
