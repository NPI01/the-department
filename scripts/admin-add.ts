/* Put an address on the showrunner console's allowlist.
   pnpm admin:add someone@example.com [staff]
   They sign in at /admin/login with a magic link sent to that address. */
import { config as loadEnv } from "dotenv";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: join(resolve(import.meta.dirname, ".."), ".env.local") });
const [email, role = "showrunner"] = process.argv.slice(2);
if (!email?.includes("@")) { console.error("usage: pnpm admin:add <email> [showrunner|staff]"); process.exit(2); }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
db.from("admins").upsert({ email: email.toLowerCase(), role }, { onConflict: "email" }).then(({ error }) => {
  if (error) { console.error("✗", error.message); process.exit(1); }
  console.log(`✓ ${email.toLowerCase()} is on the allowlist as ${role}`);
});
