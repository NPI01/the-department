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
    if (r.ok) { setState("done"); setMsg(j.message ?? "Your application has been filed."); }
    else { setState("error"); setMsg(j.error ?? "The form could not be filed."); }
  }
  if (state === "done") return (
    <div className="mt-6 border-2 border-red p-5 text-paper bg-ink/40">
      <p className="type text-lg">{msg}</p>
      <p className="mt-2 text-xs text-paper/70">Watch for a receipt from thedepartment@weird.delivery. If it does not arrive, check the folder your mail client hides things in.</p>
    </div>
  );
  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
      <div className="grid gap-4">
        <label className="block">
          <span className="text-[11px] tracking-[0.22em] uppercase text-paper/70">Correspondence address</span>
          <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" className="type mt-1 w-full border-b-2 border-paper/50 bg-transparent px-0 py-2 text-xl text-paper placeholder:text-paper/30 outline-none focus:border-red" />
        </label>
        <label className="block">
          <span className="text-[11px] tracking-[0.22em] uppercase text-paper/70">Prior experience, if any (optional)</span>
          <input name="note" type="text" placeholder="Records. Procurement. I once saw something." className="type mt-1 w-full border-b-2 border-paper/50 bg-transparent px-0 py-2 text-lg text-paper placeholder:text-paper/30 outline-none focus:border-red" />
        </label>
      </div>
      <div className="flex items-end">
        <button disabled={state === "sending"} className="display w-full sm:w-auto border-2 border-red bg-red px-7 py-4 text-xl text-paper tracking-wider transition hover:bg-transparent hover:text-red disabled:opacity-50">
          {state === "sending" ? "Filing…" : "Apply"}
        </button>
      </div>
      {state === "error" && <p className="type text-red sm:col-span-2">{msg}</p>}
    </form>
  );
}
