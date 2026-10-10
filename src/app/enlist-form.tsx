"use client";
import { useState } from "react";

export function EnlistForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    const r = await fetch("/api/enlist", { method: "POST", body: JSON.stringify({ email: fd.get("email"), note: fd.get("note") }), headers: { "Content-Type": "application/json" } });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setState("done"); setMsg(j.message ?? "Your request has been filed."); }
    else { setState("error"); setMsg(j.error ?? "The form could not be filed."); }
  }
  if (state === "done") return <p className="mt-4 text-sm">{msg}</p>;
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-sm">
        <span className="text-ink-2">Correspondence address</span>
        <input name="email" type="email" required placeholder="you@example.com" className="mt-1 w-full rounded-none border border-rule bg-paper-2 px-3 py-2 outline-none focus:border-accent" />
      </label>
      <label className="block text-sm">
        <span className="text-ink-2">Prior experience, if any (optional)</span>
        <textarea name="note" rows={2} className="mt-1 w-full rounded-none border border-rule bg-paper-2 px-3 py-2 outline-none focus:border-accent" />
      </label>
      <button disabled={state === "sending"} className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-50">
        {state === "sending" ? "Filing…" : "File request"}
      </button>
      {state === "error" && <p className="text-sm text-stamp">{msg}</p>}
    </form>
  );
}
