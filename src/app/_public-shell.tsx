import Link from "next/link";
import type { ReactNode } from "react";

/* Frame for the player-facing reference pages (rulebook, field guide, file):
   the landing page's ink and type, a narrow reading column. */
export function PublicShell({ kicker, title, banner, children }: { kicker: string; title: string; banner?: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <nav className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3 text-xs uppercase tracking-[0.25em]">
        <Link href="/" className="hover:text-red">Weird.Delivery · The Department</Link>
        <span className="flex gap-4">
          <Link href="/rules" className="hover:text-red">Rulebook</Link>
          <Link href="/guide" className="hover:text-red">Field guide</Link>
          <Link href="/about" className="hover:text-red">About</Link>
        </span>
      </nav>
      <p className="text-xs uppercase tracking-[0.3em] text-red">{kicker}</p>
      <h1 className="display mt-3 text-5xl sm:text-6xl">{title}</h1>
      {banner && <div className="mt-6 border-2 border-red p-3 text-sm text-red">{banner}</div>}
      <div className="mt-10">{children}</div>
      <footer className="mt-16 border-t border-rule pt-4 text-xs text-ink-2">
        The Department is a play-by-mail game from Weird.Delivery. Questions about the rules: reply to any letter from the game.
      </footer>
    </main>
  );
}
