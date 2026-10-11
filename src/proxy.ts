import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* Keeps the Supabase session cookie fresh on console routes and turns a
   signed-out visit to /admin into a trip to the login page. This is the
   optimistic check only; the console's layout and every read re-verify the
   admin allowlist on the server (src/lib/admin/auth.ts).

   A magic link whose redirect URL is not on Supabase's allow list falls back
   to the Site URL with ?code=…; send that on to /auth/confirm. */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  if (url.searchParams.has("code") && url.pathname !== "/auth/confirm") {
    const to = url.clone();
    to.pathname = "/auth/confirm";
    if (!to.searchParams.has("next")) to.searchParams.set("next", "/admin");
    return NextResponse.redirect(to);
  }
  if (!url.pathname.startsWith("/admin")) return NextResponse.next();

  let response = NextResponse.next({ request });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await sb.auth.getClaims();
  if (!data?.claims && url.pathname !== "/admin/login") {
    const to = url.clone();
    to.pathname = "/admin/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = { matcher: ["/", "/admin/:path*"] };
