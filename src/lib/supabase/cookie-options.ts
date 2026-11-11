/* Shared by every Supabase client so the auth cookie is scoped the same way.
   In production the session lives on .weird.delivery so one sign-in covers every
   game. The server reads AUTH_COOKIE_DOMAIN; the browser cannot see that variable,
   so it works the domain out from the page's host. Locally (localhost) the cookie
   stays host-only. */
const SHARED = ".weird.delivery";

function cookieDomain(): string | undefined {
  if (process.env.AUTH_COOKIE_DOMAIN) return process.env.AUTH_COOKIE_DOMAIN;
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "weird.delivery" || h.endsWith(SHARED)) return SHARED;
  }
  return undefined;
}

export function cookieOptions() {
  return {
    domain: cookieDomain(),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

/* Before this fix the browser wrote the session to a host-only cookie as well,
   so some browsers hold two cookies of the same name. Drop the host-only copy
   (a delete without a Domain only touches that one) so the shared one rules. */
export function dropHostOnlyDuplicates() {
  if (typeof document === "undefined" || !cookieDomain()) return;
  const seen = new Set<string>();
  for (const pair of document.cookie.split("; ")) {
    const name = pair.split("=")[0];
    if (!name.startsWith("sb-")) continue;
    if (seen.has(name)) document.cookie = `${name}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
    seen.add(name);
  }
}
