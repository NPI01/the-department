"use client";
import { createBrowserClient } from "@supabase/ssr";
import { cookieOptions } from "@/lib/supabase/cookie-options";

export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookieOptions: cookieOptions() });
}
