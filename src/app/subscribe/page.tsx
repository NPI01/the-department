import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { stripeConfigured } from "@/lib/stripe";
import { PublicShell } from "../_public-shell";

export const metadata: Metadata = { title: "Apply · The Department", description: "Subscribe for $2.99 a month and complete your Employment Application." };

export default function SubscribePage({ searchParams }: PageProps<"/subscribe">) {
  const open = stripeConfigured();
  return (
    <PublicShell kicker="Royce Industries · Personnel & Administration" title="Apply">
      <div className="type space-y-4 text-[16px] leading-relaxed">
        <p>The Department is a play-by-mail game. A subscription is $2.99 a month and covers one character for as long as you keep it. Cancel at any time; your character is placed on leave and your file is kept.</p>
        <p>After payment you complete the Employment Application: who you are, what you know, and a short interview. Personnel reviews applications within 24 hours. Approved employees receive their file, their department and their supervisor by mail, and their first instructions later the same day.</p>
      </div>
      <Suspense><Notice searchParams={searchParams} /></Suspense>
      {open ? (
        <form method="post" action="/api/stripe/checkout" className="mt-8 max-w-md space-y-3">
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-[0.2em] text-ink-2">Correspondence address</span>
            <input name="email" type="email" required autoComplete="email" className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 outline-none focus:border-red" />
          </label>
          <button className="border-2 border-ink px-4 py-2 text-[11px] uppercase tracking-[0.25em] hover:border-red hover:text-red">Subscribe · $2.99 a month</button>
          <p className="text-xs text-ink-2">Payment is handled by Stripe. Mail you send to the game is read by software, including AI models, to run the simulation.</p>
        </form>
      ) : (
        <p className="mt-8 border-2 border-red p-3 text-sm text-red">Subscriptions are not open yet. Leave your address on the <Link href="/#apply" className="underline">front page</Link> and you will be told when a cohort convenes.</p>
      )}
    </PublicShell>
  );
}

async function Notice({ searchParams }: { searchParams: PageProps<"/subscribe">["searchParams"] }) {
  const sp = await searchParams;
  if (sp.canceled) return <p className="mt-6 text-sm text-ink-2">Checkout was cancelled. Nothing was charged.</p>;
  if (sp.error === "email") return <p className="mt-6 text-sm text-red">Enter a valid correspondence address.</p>;
  if (sp.error === "session") return <p className="mt-6 text-sm text-red">We could not confirm your payment. If you were charged, write to thedepartment@weird.delivery and a person will sort it out.</p>;
  return null;
}
