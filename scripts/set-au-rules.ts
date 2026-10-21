/* Action Units: 20 a round, a hard cap of 20, nothing carried over, no hold bonus
   (2026-10-21). Writes the rules for every campaign and brings every balance and
   cap down to 20 at once.
     pnpm tsx scripts/set-au-rules.ts     re-runnable */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: camps } = await db.from("campaigns").select("id, slug");
  const rules: [string, number][] = [["au.per_round", 20], ["au.cap", 20], ["au.start", 20], ["au.hold_bonus", 0]];
  for (const c of camps ?? []) {
    for (const [key, value] of rules) {
      const { data: ex } = await db.from("rules").select("id").eq("campaign_id", c.id).eq("key", key).maybeSingle();
      if (ex) await db.from("rules").update({ value }).eq("id", ex.id); else await db.from("rules").insert({ campaign_id: c.id, key, value });
    }
    const { data: chars } = await db.from("characters").select("id").eq("campaign_id", c.id).not("player_id", "is", null);
    const ids = (chars ?? []).map((x) => x.id as string);
    let clamped = 0;
    if (ids.length) {
      const { data: res } = await db.from("resources").select("character_id, balance").in("character_id", ids).eq("kind", "au");
      for (const r of res ?? []) { const bal = Math.min(20, Number(r.balance ?? 0)); if (bal !== Number(r.balance)) clamped++; await db.from("resources").update({ balance: bal, cap: 20 }).eq("character_id", r.character_id).eq("kind", "au"); }
    }
    console.log(`${String(c.slug).padEnd(16)} rules set; ${ids.length} players, ${clamped} balances brought down to 20`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
