"use client";
import { useActionState } from "react";
import { decide } from "./actions";

const btn = "border px-2.5 py-1 text-xs disabled:opacity-50";

/* Approve / revise / reject a proposal, or answer a question. The note is
   required to revise and is the answer for questions. */
export function DecisionForm({ id, kind, status, note }: { id: string; kind: string; status: string; note: string | null }) {
  const [state, action, pending] = useActionState(decide, undefined);
  if (status !== "open") {
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <button name="decision" value="reopen" disabled={pending} className={`${btn} border-rule text-ink-2 hover:border-ink hover:text-ink`}>Reopen</button>
        {state?.error && <span className="text-xs text-stamp">{state.error}</span>}
      </form>
    );
  }
  const question = kind === "question";
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="note"
        defaultValue={note ?? ""}
        rows={question ? 3 : 2}
        placeholder={question ? "Your answer" : "Note (required to request a revision)"}
        className="w-full border border-rule bg-paper px-2 py-1.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex flex-wrap items-center gap-2">
        {question ? (
          <button name="decision" value="answer" disabled={pending} className={`${btn} border-ink hover:bg-ink hover:text-paper`}>Answer</button>
        ) : (
          <>
            <button name="decision" value="approve" disabled={pending} className={`${btn} border-ok text-ok hover:bg-ok hover:text-paper`}>Approve</button>
            <button name="decision" value="revise" disabled={pending} className={`${btn} border-warn text-warn hover:bg-warn hover:text-paper`}>Revise</button>
            <button name="decision" value="reject" disabled={pending} className={`${btn} border-stamp text-stamp hover:bg-stamp hover:text-paper`}>Reject</button>
          </>
        )}
        {pending && <span className="text-xs text-ink-2">Saving…</span>}
        {state?.error && <span className="text-xs text-stamp">{state.error}</span>}
      </div>
    </form>
  );
}
