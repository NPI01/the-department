/* pnpm dispatch:test <email> [first name]
   Registers the address as a player with a character in Season One (if new),
   opens Round 1 if no round is open, records a menu of orders for the
   character, and sends the Round 1 morning dispatch. Replies are handled by
   the deployed inbound pipeline. */
import { config } from "dotenv";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "../src/lib/email/resend";
import { recordMenu, renderDispatch, renderMenu, replyAddress, textToHtml, type MenuOption } from "../src/lib/engine/dispatch";
config({ path: join(resolve(import.meta.dirname, ".."), ".env.local") });

const email = (process.argv[2] || "").toLowerCase();
const first = process.argv[3] || "Nathan";
if (!email) { console.error("usage: pnpm dispatch:test <email> [first]"); process.exit(2); }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

(async () => {
  const { data: campaign } = await db.from("campaigns").select("id").eq("slug", "season-one").single();
  const cid = campaign!.id as string;
  const { data: player } = await db.from("players").upsert({ email, display_name: first, consent_ai_processing_at: new Date().toISOString() }, { onConflict: "email" }).select("id, mail_token").single();
  const slug = email.split("@")[0].replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  const { data: div } = await db.from("divisions").select("id").eq("campaign_id", cid).eq("slug", "information-systems").single();
  const { data: ch } = await db.from("characters").upsert({ campaign_id: cid, player_id: player!.id, slug, name: `${first} (new hire)`, title: "Systems Programmer", division_id: div!.id, clearance: 1, status: "active" }, { onConflict: "campaign_id,slug" }).select("id").single();
  await db.from("resources").upsert({ character_id: ch!.id, kind: "au", balance: 20, cap: 60 }, { onConflict: "character_id,kind" });

  let { data: round } = await db.from("rounds").select("id, number, locks_at").eq("campaign_id", cid).eq("status", "open").maybeSingle();
  if (!round) {
    // Lock at the next 8:00 PM Eastern.
    const now = new Date();
    const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const lockEt = new Date(et); lockEt.setHours(20, 0, 0, 0); if (lockEt <= et) lockEt.setDate(lockEt.getDate() + 1);
    const offsetMs = now.getTime() - et.getTime();
    const locksAt = new Date(lockEt.getTime() + offsetMs);
    const { data: ep } = await db.from("episodes").upsert({ campaign_id: cid, number: 1, title: "Orientation", status: "active", starts_round: 1 }, { onConflict: "campaign_id,number" }).select("id").single();
    const r = await db.from("rounds").upsert({ campaign_id: cid, episode_id: ep!.id, number: 1, episode_round: 1, opens_at: now.toISOString(), locks_at: locksAt.toISOString(), status: "open" }, { onConflict: "campaign_id,number" }).select("id, number, locks_at").single();
    round = r.data;
  }

  const options: MenuOption[] = [
    { code: "A", verb: "request_files", args: "Facilities ledger, Building 7", label: "Pull the Facilities ledger for Building 7", cost: 6 },
    { code: "B", verb: "request_files", args: "HARVEST sampling authorizations, 1976", label: "Ask Records for the 1976 HARVEST sampling authorizations", cost: 6 },
    { code: "C", verb: "surveil", args: "perimeter road after dark", label: "Walk the perimeter road after dark and see what lands", cost: 10 },
    { code: "D", verb: "interview", args: "Maya Okafor, Procurement, about Building 9", label: "Buy Maya Okafor lunch and ask about her map", cost: 4 },
  ];
  await recordMenu(db, cid, round!.id, ch!.id, options);

  const lockStr = new Date(round!.locks_at).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long", hour: "numeric", minute: "2-digit" });
  const text = renderDispatch({
    first, date: "Monday, October 10, 1977", round: 1, episode: "Episode I · Orientation",
    narrative: `You arrived at Station R yesterday with the October cohort, eleven others and a woman from Procurement who dropped her photographs at the badge table. Your office is in Building 3, second floor, Information Systems. The desk was cleared in a hurry; there is a coffee ring on the blotter and a page torn from a calendar in the drawer, September, with the 29th circled.\n\nThis is your first morning. Each morning a dispatch like this one arrives: what happened overnight, what came in the mail, and what you can do with your day. You write to whomever you like during the day. At 8:00 PM Eastern the Department reads your orders and the night passes.`,
    overnight: [
      "Dorothy Armitage (Personnel) welcomes you and asks that you familiarize yourself with the confidentiality agreement. Her door, she says, is open. Most doors here are not.",
      "Facilities Management issued your department's plat of the property. Building 7, in the south-east corner, is marked RESTRICTED. Nobody has mentioned a Building 7.",
      "Dr. Sarah Ely (Biological Sciences) copied all departments on an URGENT memo: a shipment designated for September 28 was never logged into cold storage. The crates are missing. She wishes Dr. Marsh were still here to oversee it.",
      "The Ward County Sheriff telephoned Corporate Security about a dead steer on the Vane ranch and a company truck seen beside it. Security has asked that no one respond to the Sheriff directly.",
    ],
    menu: renderMenu(options, 20),
    signature: "— Personnel & Administration, Royce Industries",
  }).replace("Orders lock at 8:00 PM Eastern.", `Orders lock ${lockStr} Eastern.`);

  const from = replyAddress(player!.mail_token);
  const r = await sendMail({ to: email, from, replyTo: from, subject: "Monday, October 10 — Round 1 of 14 — your first morning at Station R", text, html: textToHtml(text) });
  console.log(r.error ? `✗ ${r.error}` : `✓ dispatch sent to ${email} (resend ${r.id}); replies go to the tokenized address; round locks ${lockStr} ET`);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
