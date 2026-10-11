"use client";
import { useActionState } from "react";
import { setPassword } from "./actions";

const input = "mt-1 w-full border border-rule bg-paper-2 px-3 py-2 outline-none focus:border-accent";

export function PasswordForm() {
  const [state, action, pending] = useActionState(setPassword, undefined);
  return (
    <form action={action} className="max-w-sm space-y-3">
      <label className="block text-sm">
        <span className="text-ink-2">New password</span>
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className={input} />
      </label>
      <label className="block text-sm">
        <span className="text-ink-2">Again</span>
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={input} />
      </label>
      <button disabled={pending} className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-50">
        {pending ? "Saving…" : "Set password"}
      </button>
      {state?.ok && <p className="text-sm text-ok">Saved. You can sign in with it from now on.</p>}
      {state?.error && <p className="text-sm text-stamp">{state.error}</p>}
    </form>
  );
}
