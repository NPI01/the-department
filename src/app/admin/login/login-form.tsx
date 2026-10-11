"use client";
import { useActionState } from "react";
import { requestLink } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(requestLink, undefined);
  if (state?.sent) {
    return (
      <p className="mt-6 text-sm leading-relaxed">
        If that address is on the staff list, a sign-in link is on its way. Open it in this browser.
      </p>
    );
  }
  return (
    <form action={action} className="mt-6 space-y-3">
      <label className="block text-sm">
        <span className="text-ink-2">Staff address</span>
        <input name="email" type="email" required autoComplete="email" className="mt-1 w-full border border-rule bg-paper-2 px-3 py-2 outline-none focus:border-accent" />
      </label>
      <button disabled={pending} className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-50">
        {pending ? "Sending…" : "Send sign-in link"}
      </button>
      {state?.error && <p className="text-sm text-stamp">{state.error}</p>}
    </form>
  );
}
