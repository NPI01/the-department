"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Markdown } from "@/lib/canon/render";
import { askHelp } from "./actions";

/* The help desk: a short out-of-character conversation about how to play.
   Turns live in client state only; the desk gets the last few for context. */

type Turn = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = ["How do I give an order?", "What does IF … THEN do?", "What happens when I hold?", "How do I write to another player?", "How do I file evidence with a committee?", "What are Action Units?"];

export function HelpDesk({ token }: { token: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [turns.length, pending]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || pending) return;
    setError(null); setDraft("");
    const history = turns;
    setTurns((t) => [...t, { role: "user", text: q }]);
    start(async () => {
      const r = await askHelp({ token, question: q, history });
      if ("error" in r) { setError(r.error); setTurns((t) => t.slice(0, -1)); setDraft(q); }
      else setTurns((t) => [...t, { role: "assistant", text: r.answer }]);
    });
  };

  return (
    <section id="desk" className="mt-14">
      <p className="text-xs uppercase tracking-[0.3em] text-red">Out of character</p>
      <h2 className="display mt-2 text-4xl">The help desk</h2>
      <p className="mt-3 text-sm text-ink-2">Ask how something works and the desk answers from the rulebook, the field guide and the list above. It knows nothing about the story that you could not read in those, and it will say so. Nothing you ask here is part of the game. The first answer of the day can take up to a minute; later ones are quicker.</p>
      <div className="mt-6 border-2 border-ink bg-paper-2 shadow-[6px_6px_0_0_var(--ink)]">
        <div className="max-h-[32rem] space-y-4 overflow-y-auto p-4">
          {turns.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => ask(s)} className="border border-rule bg-paper px-3 py-1.5 text-left text-xs text-ink-2 hover:border-ink hover:text-ink">{s}</button>)}
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "ml-8" : "mr-8"}>
              <p className="text-[10px] uppercase tracking-[0.25em] text-ink-2">{t.role === "user" ? "You" : "Help desk"}</p>
              <div className={`type mt-1 border px-3 py-2 text-[14px] leading-relaxed ${t.role === "user" ? "whitespace-pre-wrap border-rule bg-paper" : "border-ink bg-paper"}`}>{t.role === "user" ? t.text : <Markdown md={t.text} compact />}</div>
            </div>
          ))}
          {pending && <p className="text-xs text-ink-2">The desk is looking it up…</p>}
          {error && <p className="border border-red px-3 py-2 text-xs text-red">{error}</p>}
          <div ref={end} />
        </div>
        <form className="flex items-end gap-2 border-t-2 border-ink bg-paper p-3" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
          <textarea ref={box} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(draft); } }} rows={2} maxLength={1200} placeholder="How do I…" className="type min-h-[3rem] flex-1 resize-y border border-rule bg-paper-2 px-3 py-2 text-[14px] focus:border-ink focus:outline-none" />
          <button type="submit" disabled={pending || !draft.trim()} className="border-2 border-ink bg-ink px-4 py-2 text-xs uppercase tracking-[0.2em] text-paper hover:bg-red disabled:opacity-40">Ask</button>
        </form>
      </div>
    </section>
  );
}
