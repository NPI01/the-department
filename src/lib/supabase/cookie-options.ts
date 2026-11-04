/* Shared by every Supabase client so the auth cookie is scoped the same way.
   Set AUTH_COOKIE_DOMAIN=.weird.delivery in production to share the session
   across subdomains; leave it unset locally for a host-only cookie. */
export function cookieOptions() {
  return {
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
