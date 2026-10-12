import type { Metadata } from "next";
import Link from "next/link";
import { RoundsDemo } from "../_landing/RoundsDemo";

export const metadata: Metadata = {
  title: "Three rounds — The Department",
  description: "A new hire's first three days at Royce Industries, compressed into two minutes. Dispatches, correspondence, orders, the 8 PM lock, and the morning after.",
};

/* Full-screen player for the three-rounds demonstration. The same component
   the landing page embeds, filling the viewport. */
export default function DemoPage() {
  return (
    <main className="flex h-dvh flex-col bg-ink text-paper">
      <header className="flex items-center justify-between border-b border-paper/20 px-3 py-2 text-[11px] tracking-[0.25em] uppercase sm:px-4">
        <Link href="/" className="display text-sm tracking-[0.35em]">Weird<span className="text-red">.</span>Delivery</Link>
        <span className="hidden text-paper/60 sm:inline">The Department · three rounds, about two minutes</span>
        <Link href="/#apply" className="border border-current px-3 py-1 hover:border-red hover:text-red">Apply</Link>
      </header>
      <div className="min-h-0 flex-1"><RoundsDemo fill /></div>
    </main>
  );
}
