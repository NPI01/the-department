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

export type Effect = "photograph" | "transcript" | "vehicle" | "pass" | "readings";

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
  { slug: "magnetometer", name: "Hand magnetometer (Applied Physics, bench 4 cabinet)", aliases: ["magnetometer", "the magnetometer", "hand magnetometer", "kovic's instrument", "the instrument from bench 4"], cost: 4, effect: "readings", departments: ["applied-physics"],
    log: { key: "requisitions", line: (who, r) => `${gameDate(r)} · hand magnetometer, bench 4 · ${who} · returnable` },
    blurb: "Carried down the Tagus stairs it reads the field at each step, twice, and the two readings are written down whether or not they agree. Applied Physics signs for it; Dr. Kovic wants it back with the numbers." },
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

/* Everything a character holds is taken; their informants are warned off. Security's purge calls this. */
export async function seizeHoldings(db: SupabaseClient, p: { campaignId: string; characterId: string; round: number; roundId?: string | null; by: string; note: string }): Promise<string[]> {
  const { data } = await db.from("assets").select("id, name, kind").eq("holder_id", p.characterId).in("kind", ["equipment", "informant"]).eq("status", "held");
  const names: string[] = [];
  for (const a of data ?? []) {
    await db.from("assets").update({ status: a.kind === "informant" ? "lost" : "seized", status_round: p.round, status_note: a.kind === "informant" ? "Warned off by Corporate Security." : p.note }).eq("id", a.id);
    await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId ?? null, kind: "equipment.seized", payload: { character: p.characterId, name: a.name, by: p.by, round: p.round, note: p.note }, idempotency_key: `seized:${a.id}`, visible_to: [p.characterId] });
    names.push(a.name as string);
  }
  return names;
}

/* TRANSFER <item> TO <name>: a piece of equipment changes hands. Loans keep their return round; the log says so. */
export async function transferHolding(db: SupabaseClient, p: { campaignId: string; round: number; from: { id: string; name: string }; to: { id: string; name: string; slug: string; player: boolean }; text: string }): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const def = findEquipment(p.text);
  if (!def) return { ok: false, error: `nothing under Holdings matches "${p.text}"` };
  const { data: a } = await db.from("assets").select("id, name, provenance").eq("holder_id", p.from.id).eq("kind", "equipment").eq("status", "held").contains("provenance", { item: def.slug }).maybeSingle();
  if (!a) return { ok: false, error: `${p.from.name} holds no ${def.name.toLowerCase()}` };
  const { data: dup } = await db.from("assets").select("id").eq("holder_id", p.to.id).eq("kind", "equipment").eq("status", "held").contains("provenance", { item: def.slug }).maybeSingle();
  if (dup) return { ok: false, error: `${p.to.name} already holds a ${def.name.toLowerCase()}` };
  const prov = (a.provenance as Record<string, unknown>) ?? {};
  await db.from("assets").update({ status: "returned", status_round: p.round, status_note: `Handed to ${p.to.name}.` }).eq("id", a.id);
  await db.from("assets").insert({ campaign_id: p.campaignId, holder_id: p.to.id, kind: "equipment", slug: `${def.slug}-${p.to.slug}-r${p.round}-from`, name: a.name, description: def.blurb, provenance: { ...prov, how: `Handed over by ${p.from.name}, Round ${p.round}.`, from: p.from.id }, tier: null, secret: false, status: "held", status_round: p.round });
  await writeLog(db, p.campaignId, def.log.key, p.round, p.to.id, `${gameDate(p.round)} · ${def.name} · handed by ${p.from.name} to ${p.to.name}`);
  if (p.to.player) await db.from("events").insert({ campaign_id: p.campaignId, kind: "transfer.received", payload: { to: p.to.id, from: p.from.id, from_name: p.from.name, what: a.name, round: p.round, text: `${p.from.name} handed the player a ${String(a.name).toLowerCase()}; it is under Holdings` }, idempotency_key: `transfer:${a.id}:${p.round}`, visible_to: [p.to.id] });
  else await db.from("knowledge").insert({ character_id: p.to.id, fact_key: `told:${p.from.id.slice(0, 8)}:handed:${def.slug}:${p.round}`, value: { kind: "info_share", text: `${p.from.name} handed me a ${String(a.name).toLowerCase()} on ${gameDate(p.round)}`, from: p.from.id, from_name: p.from.name, round: p.round }, confidence: 1, source_kind: "told", source_ref: null, learned_round: p.round });
  return { ok: true, name: a.name as string };
}

/* TRANSFER <n> AU TO <name>: units change hands at once, up to what the sender has and the receiver's cap. A staff receiver remembers it, and is a little obliged. */
export async function transferUnits(db: SupabaseClient, p: { campaignId: string; round: number; from: { id: string; name: string }; to: { id: string; name: string; player: boolean }; amount: number; cap: number }): Promise<{ ok: true; moved: number; kept: number } | { ok: false; error: string }> {
  const n = Math.floor(p.amount);
  if (!(n > 0)) return { ok: false, error: "name a number of units" };
  const { data: mine } = await db.from("resources").select("balance").eq("character_id", p.from.id).eq("kind", "au").maybeSingle();
  const have = Number(mine?.balance ?? 0);
  if (have < n) return { ok: false, error: `${p.from.name} has ${have} AU, not ${n}` };
  const { data: theirs } = await db.from("resources").select("balance").eq("character_id", p.to.id).eq("kind", "au").maybeSingle();
  const room = p.to.player ? Math.max(0, p.cap - Number(theirs?.balance ?? 0)) : n;
  const moved = Math.min(n, room);
  if (moved <= 0) return { ok: false, error: `${p.to.name} is at the cap of ${p.cap} AU and can take none` };
  await db.from("resources").update({ balance: have - moved }).eq("character_id", p.from.id).eq("kind", "au");
  await db.from("resources").upsert({ character_id: p.to.id, kind: "au", balance: Number(theirs?.balance ?? 0) + moved, ...(p.to.player ? { cap: p.cap } : {}) }, { onConflict: "character_id,kind" });
  if (p.to.player) await db.from("events").insert({ campaign_id: p.campaignId, kind: "transfer.received", payload: { to: p.to.id, from: p.from.id, from_name: p.from.name, what: `${moved} AU`, round: p.round, text: `${p.from.name} transferred ${moved} Action Units to the player` }, idempotency_key: `transfer:au:${p.from.id}:${p.to.id}:${Date.now()}`, visible_to: [p.to.id] });
  else {
    await db.from("knowledge").insert({ character_id: p.to.id, fact_key: `told:${p.from.id.slice(0, 8)}:units:${p.round}:${Date.now().toString(36)}`, value: { kind: "info_share", text: `${p.from.name} put ${moved} units' worth of consideration my way on ${gameDate(p.round)}`, from: p.from.id, from_name: p.from.name, round: p.round }, confidence: 1, source_kind: "told", source_ref: null, learned_round: p.round });
    const { data: rel } = await db.from("relationships").select("obligation").eq("from_character", p.to.id).eq("to_character", p.from.id).maybeSingle();
    await db.from("relationships").upsert({ campaign_id: p.campaignId, from_character: p.to.id, to_character: p.from.id, obligation: Math.min(1, Number(rel?.obligation ?? 0) + moved / 20), updated_at: new Date().toISOString() }, { onConflict: "from_character,to_character" });
  }
  return { ok: true, moved, kept: n - moved };
}

/* For the personnel file: held, and what has gone, with why. */
export async function holdingsPage(db: SupabaseClient, characterId: string): Promise<{ held: { name: string; blurb: string | null; since: number | null; returns: number | null }[]; gone: { name: string; status: string; round: number | null; note: string | null }[] }> {
  const { data } = await db.from("assets").select("name, description, provenance, status, status_round, status_note, created_at").eq("holder_id", characterId).in("kind", ["equipment", "informant"]).order("created_at");
  const held: { name: string; blurb: string | null; since: number | null; returns: number | null }[] = []; const gone: { name: string; status: string; round: number | null; note: string | null }[] = [];
  for (const a of data ?? []) {
    const p = (a.provenance as { round?: number; returns?: number } | null) ?? {};
    if (a.status === "held") held.push({ name: a.name as string, blurb: (a.description as string | null) ?? null, since: p.round ?? null, returns: p.returns ?? null });
    else gone.push({ name: a.name as string, status: a.status as string, round: (a.status_round as number | null) ?? null, note: (a.status_note as string | null) ?? null });
  }
  return { held, gone };
}
