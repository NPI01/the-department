"use client";
import { useActionState } from "react";
import { requestLink, signInWithPassword } from "./actions";

const input = "mt-1 w-full border border-rule bg-paper-2 px-3 py-2 outline-none focus:border-accent";
const button = "border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-50";

export function LoginForm() {
  const [pw, pwAction, pwPending] = useActionState(signInWithPassword, undefined);
  const [link, linkAction, linkPending] = useActionState(requestLink, undefined);
  if (link?.sent) {
    return (
      <p className="mt-6 text-sm leading-relaxed">
        If that address is on the staff list, a sign-in link is on its way. Open it in this browser.
      </p>
    );
  }
  const error = pw?.error ?? link?.error;
  return (
    <form action={pwAction} className="mt-6 space-y-3">
      <label className="block text-sm">
        <span className="text-ink-2">Staff address</span>
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="block text-sm">
        <span className="text-ink-2">Password</span>
        <input name="password" type="password" autoComplete="current-password" className={input} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pwPending} className={button}>{pwPending ? "Signing in…" : "Sign in"}</button>
        <button formAction={linkAction} formNoValidate disabled={linkPending} className="text-sm text-ink-2 underline hover:text-ink">
          {linkPending ? "Sending…" : "Email me a link instead"}
        </button>
      </div>
      {error && <p className="text-sm text-stamp">{error}</p>}
    </form>
  );
}
