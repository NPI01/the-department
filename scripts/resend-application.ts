/* pnpm tsx scripts/resend-application.ts <email>
   Re-sends a player's "Your Employment Application" letter (the same template
   and link the Stripe webhook sends once). Use when the first one never
   arrived — check the address is not on Resend's suppression list first. */
import { config } from "dotenv";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "../src/lib/email/resend";
import { letterLinks } from "../src/lib/email/letter";
import { renderTemplate } from "../src/lib/email/template-store";
config({ path: join(resolve(import.meta.dirname, ".."), ".env.local") });

const email = (process.argv[2] || "").toLowerCase();
if (!email) { console.error("usage: pnpm tsx scripts/resend-application.ts <email>"); process.exit(2); }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

(async () => {
  const { data: player, error } = await db.from("players").select("id, email, file_token").eq("email", email).maybeSingle();
  if (error || !player) { console.error(`no player with email ${email}`); process.exit(1); }
  const links = letterLinks(player.file_token);
  const applyUrl = `${links.rules.replace(/\/rules$/, "")}/apply/${player.file_token}`;
  const { subject, html, text } = await renderTemplate(db, "application_link", { email: player.email, apply_url: applyUrl }, links);
  const r = await sendMail({ to: player.email, subject, html, text });
  await db.from("events").insert({
    campaign_id: process.env.CAMPAIGN_ID, kind: "player.application_resent",
    payload: { player_id: player.id, sent: !r.error, error: r.error, resend_id: r.id },
  });
  if (r.error) { console.error(`send failed: ${r.error}`); process.exit(1); }
  console.log(`sent "${subject}" to ${player.email} (resend id ${r.id})`);
})();
