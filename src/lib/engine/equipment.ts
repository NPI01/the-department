/* Holdings: equipment a character signs out and keeps on the personnel file
   (rulebook §5.2, §6.3 REQUISITION). An item changes what an existing order
   produces (a camera makes a photograph of a night's sighting; a recorder makes
   a transcript of a conversation; a motor pool truck waives the trip; a badge
   opens one restricted place for one night), and every item leaves paper: a
   line in a log another player can pull. Items are seizable: Security's purge
   takes them, and a later OBTAIN may. Catalogue PROPOSED 2026-10-16; add items
   here as data, never in prompt text. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate } from "@/lib/email/letter";

export type Effect = "photograph" | "transcript" | "vehicle" | "pass";

export type EquipmentDef = {
  slug: string;
  name: string;
  aliases: string[];                 // lowercase words an order may use
  cost: number;                      // AU, charged at intake
  departments?: string[];            // division slugs that may sign for it; undefined = anyone
  clearance?: number;                // minimum clearance
  effect: Effect;
  loan?: number;                     // rounds before it goes back on its own (a truck, a badge)
  log: { key: string; line: (who: string, round: number) => string };   // the paper it leaves: facts log.<key>.<round>.<char>
  notice?: boolean;                  // Corporate Security is told who signed for it
  blurb: string;                     // on the personnel file
};

export const EQUIPMENT: EquipmentDef[] = [
  { slug: "camera", name: "35mm camera (Procurement stock)", aliases: ["camera", "35mm", "a camera", "the camera"], cost: 4, effect: "photograph",
    log: { key: "requisitions", line: (who, r) => `${gameDate(r)} · 35mm camera, 2 rolls · ${who} · returnable` },
    blurb: "A night's watch that shows something becomes a photograph in your Case File: evidence, not a story." },
  { slug: "recorder", name: "Portable cassette recorder", aliases: ["recorder", "tape recorder", "cassette recorder", "a recorder", "tape"], cost: 4, effect: "transcript",
    log: { key: "requisitions", line: (who, r) => `${gameDate(r)} · Cassette recorder, 3 tapes · ${who}` },
    blurb: "A conversation you have in person comes back as a transcript you can file. The person may notice the machine, and will remember it." },
  { slug: "truck", name: "Motor pool pickup (one night)", aliases: ["truck", "pickup", "vehicle", "a truck", "a vehicle", "motor pool truck", "company truck", "the truck"], cost: 3, effect: "vehicle", loan: 1,
    log: { key: "motor-pool", line: (who, r) => `${gameDate(r)} · MP-07 · out 1800 · in 0700 · ${who}` },
    blurb: "The trip beyond the fence costs nothing tonight. Your name goes in the motor pool log." },
  { slug: "badge", name: "Temporary access badge (one night)", aliases: ["badge", "access badge", "temporary badge", "a badge", "visitor badge", "pass", "a pass"], cost: 6, effect: "pass", loan: 1, departments: ["corporate-security", "personnel-administration"], clearance: 2, notice: true,
    log: { key: "badges", line: (who, r) => `${gameDate(r)} · temp badge T-${(r * 7) % 90 + 10} · ${who} · 24h` },
    blurb: "One restricted place, one night, without a patrol truck slowing down. Security issued it and knows who holds it." },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function findEquipment(text: string): EquipmentDef | null {
  const t = ` ${norm(text)} `; let best: { d: EquipmentDef; n: number } | null = null;
  for (const d of EQUIPMENT) for (const a of d.aliases) if (t.includes(` ${a} `) && (!best || a.length > best.n)) best = { d, n: a.length };
  return best?.d ?? null;
}

export type Holding = { id: string; slug: string; def: EquipmentDef; name: string; since: number | null; returns: number | null };

/* What a character holds tonight, by catalogue item. */
export async function holdingsFor(db: SupabaseClient, characterId: string): Promise<Holding[]> {
  const { data } = await db.from("assets").select("id, slug, name, provenance").eq("holder_id", characterId).eq("kind", "equipment").eq("status", "held");
  return (data ?? []).flatMap((a) => {
    const p = (a.provenance as { item?: string; round?: number; returns?: number } | null) ?? {};
    const def = EQUIPMENT.find((d) => d.slug === p.item);
    return def ? [{ id: a.id as string, slug: a.slug as string, def, name: a.name as string, since: p.round ?? null, returns: p.returns ?? null }] : [];
  });
}

export const holds = (hs: Holding[], effect: Effect) => hs.find((h) => h.def.effect === effect) ?? null;

/* The paper an item leaves, readable by whoever pulls the log it belongs to. */
export async function writeLog(db: SupabaseClient, campaignId: string, key: string, round: number, characterId: string, line: string) {
  await db.from("facts").upsert({ campaign_id: campaignId, key: `log.${key}.${round}.${characterId}`, value: { line, round, by: characterId }, established_round: round, secret: false }, { onConflict: "campaign_id,key" });
}
export async function logLines(db: SupabaseClient, campaignId: string, key: string): Promise<string[]> {
  const { data } = await db.from("facts").select("value").eq("campaign_id", campaignId).like("key", `log.${key}.%`).order("established_round");
  return (data ?? []).map((f) => (f.value as { line: string }).line);
}

/* Sign something out. The order's rules (who may, what it costs) are checked by the caller. */
export async function requisition(db: SupabaseClient, p: { campaignId: string; characterId: string; characterSlug: string; characterName: string; round: number }, def: EquipmentDef): Promise<{ ok: true; returns: number | null } | { ok: false; error: string }> {
  const { data: have } = await db.from("assets").select("id").eq("holder_id", p.characterId).eq("kind", "equipment").eq("status", "held").contains("provenance", { item: def.slug }).maybeSingle();
  if (have) return { ok: false, error: `${p.characterName} already holds a ${def.name.toLowerCase()}.` };
  const returns = def.loan ? p.round + def.loan : null;
  const slug = `${def.slug}-${p.characterSlug}-r${p.round}`;
  const { error } = await db.from("assets").insert({ campaign_id: p.campaignId, holder_id: p.characterId, kind: "equipment", slug, name: def.name, description: def.blurb, provenance: { item: def.slug, round: p.round, returns, how: "Requisitioned through Procurement." }, tier: null, secret: false, status: "held", status_round: p.round });
  if (error) return { ok: false, error: error.message };
  await writeLog(db, p.campaignId, def.log.key, p.round, p.characterId, def.log.line(p.characterName, p.round));
  return { ok: true, returns };
}

/* Loans that have run out go back on their own at the world phase. */
export async function returnDue(db: SupabaseClient, campaignId: string, round: number): Promise<number> {
  const { data } = await db.from("assets").select("id, holder_id, name, provenance").eq("campaign_id", campaignId).eq("kind", "equipment").eq("status", "held");
  let n = 0;
  for (const a of data ?? []) {
    const returns = (a.provenance as { returns?: number } | null)?.returns;
    if (!returns || returns > round) continue;
    await db.from("assets").update({ status: "returned", status_round: round, status_note: "Returned at the end of the loan." }).eq("id", a.id);
    if (a.holder_id) await db.from("events").insert({ campaign_id: campaignId, kind: "equipment.returned", payload: { character: a.holder_id, name: a.name, round }, idempotency_key: `returned:${a.id}`, visible_to: [a.holder_id as string] });
    n++;
  }
  return n;
}

/* Everything a character holds is taken. Security's purge calls this; a colleague's OBTAIN may. */
export async function seizeHoldings(db: SupabaseClient, p: { campaignId: string; characterId: string; round: number; roundId?: string | null; by: string; note: string }): Promise<string[]> {
  const { data } = await db.from("assets").select("id, name").eq("holder_id", p.characterId).eq("kind", "equipment").eq("status", "held");
  const names: string[] = [];
  for (const a of data ?? []) {
    await db.from("assets").update({ status: "seized", status_round: p.round, status_note: p.note }).eq("id", a.id);
    await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId ?? null, kind: "equipment.seized", payload: { character: p.characterId, name: a.name, by: p.by, round: p.round, note: p.note }, idempotency_key: `seized:${a.id}`, visible_to: [p.characterId] });
    names.push(a.name as string);
  }
  return names;
}

/* For the personnel file: held, and what has gone, with why. */
export async function holdingsPage(db: SupabaseClient, characterId: string): Promise<{ held: { name: string; blurb: string | null; since: number | null; returns: number | null }[]; gone: { name: string; status: string; round: number | null; note: string | null }[] }> {
  const { data } = await db.from("assets").select("name, description, provenance, status, status_round, status_note, created_at").eq("holder_id", characterId).eq("kind", "equipment").order("created_at");
  const held: { name: string; blurb: string | null; since: number | null; returns: number | null }[] = []; const gone: { name: string; status: string; round: number | null; note: string | null }[] = [];
  for (const a of data ?? []) {
    const p = (a.provenance as { round?: number; returns?: number } | null) ?? {};
    if (a.status === "held") held.push({ name: a.name as string, blurb: (a.description as string | null) ?? null, since: p.round ?? null, returns: p.returns ?? null });
    else gone.push({ name: a.name as string, status: a.status as string, round: (a.status_round as number | null) ?? null, note: (a.status_note as string | null) ?? null });
  }
  return { held, gone };
}
