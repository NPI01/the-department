"use client";
import { useActionState, useState } from "react";
import { openRequest } from "./actions";

const input = "mt-1 w-full border border-rule bg-paper-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent";

export function OpenRequestForm({ campaigns, places }: { campaigns: { id: string; title: string }[]; places: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(openRequest, undefined);
  const [kind, setKind] = useState("person_at_place");
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm"><span className="text-ink-2">Cohort</span>
        <select name="campaign_id" className={input}>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      </label>
      <label className="block text-sm"><span className="text-ink-2">Kind</span>
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
          <option value="person_at_place">A person at a known place</option>
          <option value="place">A new place</option>
        </select>
      </label>
      {kind === "person_at_place" && (
        <label className="block text-sm"><span className="text-ink-2">Place</span>
          <select name="place_slug" className={input}>{places.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select>
        </label>
      )}
      <label className="block text-sm"><span className="text-ink-2">The words of the order</span><span className="text-xs text-ink-2"> · what the player wrote, or what you want written</span>
        <textarea name="clause" rows={3} required className={input} placeholder={kind === "place" ? "the bar on the Tagus road" : "walk up to whoever comes out and introduce myself"} />
      </label>
      <button disabled={pending} className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-50">{pending ? "Opening…" : "Open the request"}</button>
      {state?.ok && <p className="text-sm text-ok">{state.ok}</p>}
      {state?.error && <p className="text-sm text-stamp">{state.error}</p>}
    </form>
  );
}
