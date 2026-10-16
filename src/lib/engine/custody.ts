/* Custody: who holds what, and taking it (rulebook §6.3 OBTAIN and PROTECT,
   §5.2 holdings). Deterministic.

   PROTECT lays a guard for one night, recorded in facts protect.<round>.<char>
   with a scope: everything the character holds and their department's files
   ("my desk"), one item, one document on the index, or themselves (their
   movements are not listed in anyone's contact report). The strategic phase
   resolves PROTECT before any other order, so a guard laid tonight stops a
   theft attempted tonight.

   OBTAIN takes a document the index keeps behind clearance, or an item from a
   colleague's desk. Against a guard it fails and the guard learns who tried
   (an Operative is only "someone"). Against a colleague who held or sent
   nothing, it succeeds but they learn who. Otherwise it succeeds unseen and
   the morning tells them it is gone. Security hears of it when the file is
   sealed, logged, kept by a person, or kept in a restricted place. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { EQUIPMENT, findEquipment, type EquipmentDef } from "./equipment";

type Db = SupabaseClient;
export type Scope = { kind: "all" } | { kind: "self" } | { kind: "item"; slug: string; title: string } | { kind: "doc"; slug: string; title: string };

export async function layProtection(db: Db, p: { campaignId: string; roundNo: number; characterId: string; division: string | null }, scope: Scope) {
  await db.from("facts").upsert({ campaign_id: p.campaignId, key: `protect.${p.roundNo}.${p.characterId}.${scope.kind}${"slug" in scope ? `.${scope.slug}` : ""}`, value: { ...scope, by: p.characterId, division: p.division, round: p.roundNo }, established_round: p.roundNo, secret: true }, { onConflict: "campaign_id,key" });
}

type Guard = { by: string; division: string | null; kind: Scope["kind"]; slug?: string };

export async function guardsTonight(db: Db, campaignId: string, roundNo: number): Promise<Guard[]> {
  const { data } = await db.from("facts").select("value").eq("campaign_id", campaignId).like("key", `protect.${roundNo}.%`);
  return (data ?? []).map((f) => f.value as Guard);
}

/* Who guards this thing tonight: a colleague's item or desk, or a document a department keeps. */
export function guardOf(guards: Guard[], target: { ownerId?: string; itemSlug?: string; docSlug?: string; holderDivision?: string | null }): Guard | null {
  for (const g of guards) {
    if (target.ownerId && g.by === target.ownerId && (g.kind === "all" || (g.kind === "item" && g.slug === target.itemSlug))) return g;
    if (target.docSlug && g.kind === "doc" && g.slug === target.docSlug) return g;
    if (target.docSlug && target.holderDivision && g.kind === "all" && g.division === target.holderDivision) return g;
  }
  return null;
}

/* Characters whose movements are guarded tonight (contacts.ts treats them as covert). */
export const selfGuarded = (guards: Guard[]) => new Set(guards.filter((g) => g.kind === "self").map((g) => g.by));

/* What a colleague holds that an order might name: a Case File item or a piece of equipment. */
export type Loot = { kind: "case"; slug: string; title: string } | { kind: "equipment"; assetId: string; name: string; def: EquipmentDef };

export async function findLoot(db: Db, ownerId: string, text: string): Promise<Loot | null> {
  const want = text.toLowerCase().replace(/^(?:the|a|an|their|his|her)\s+/, "").trim();
  const { data: items } = await db.from("case_items").select("slug, title").eq("character_id", ownerId).eq("status", "held").neq("drawer", "correspondence");
  const hit = (items ?? []).find((i) => i.slug === want) ?? (items ?? []).find((i) => (i.title as string).toLowerCase().includes(want)) ?? (items ?? []).find((i) => want.includes(i.slug as string));
  if (hit) return { kind: "case", slug: hit.slug as string, title: hit.title as string };
  const def = findEquipment(text);
  if (def) {
    const { data: a } = await db.from("assets").select("id, name").eq("holder_id", ownerId).eq("kind", "equipment").eq("status", "held").contains("provenance", { item: def.slug }).maybeSingle();
    if (a) return { kind: "equipment", assetId: a.id as string, name: a.name as string, def };
  }
  return null;
}

/* The taking itself. The victim's copy is marked, the thief's copy is filed with its provenance. */
export async function takeLoot(db: Db, p: { campaignId: string; roundNo: number; thief: { id: string; slug: string; name: string }; victim: { id: string; slug: string; name: string } }, loot: Loot): Promise<string> {
  if (loot.kind === "case") {
    const { data: item } = await db.from("case_items").select("*").eq("character_id", p.victim.id).eq("slug", loot.slug).single();
    if (!item) return loot.title;
    await db.from("case_items").update({ status: "stolen", status_round: p.roundNo, status_note: `Missing from your desk on the morning of Round ${p.roundNo + 1}.` }).eq("id", item.id);
    await db.from("case_items").upsert({ campaign_id: p.campaignId, character_id: p.thief.id, slug: `${loot.slug}`.slice(0, 36) + `-taken-r${p.roundNo}`, kind: item.kind, drawer: item.drawer, title: item.title, from_label: item.from_label, written_label: item.written_label, written_on: item.written_on, body: item.body, image_path: item.image_path, caption: item.caption, asset_id: item.asset_id, round_received: p.roundNo, how_obtained: `Taken from ${p.victim.name}'s desk, Round ${p.roundNo}, without their knowledge.`, copy_note: item.copy_note ? `${item.copy_note} Theirs, now yours.` : "Theirs, now yours.", grade: item.grade, status: "held" }, { onConflict: "character_id,slug" });
    return item.title as string;
  }
  await db.from("assets").update({ status: "lost", status_round: p.roundNo, status_note: `Missing from your desk, Round ${p.roundNo}.` }).eq("id", loot.assetId);
  await db.from("assets").insert({ campaign_id: p.campaignId, holder_id: p.thief.id, kind: "equipment", slug: `${loot.def.slug}-${p.thief.slug}-r${p.roundNo}-taken`, name: loot.name, description: loot.def.blurb, provenance: { item: loot.def.slug, round: p.roundNo, returns: loot.def.loan ? p.roundNo + loot.def.loan : null, how: `Taken from ${p.victim.name}'s desk.`, taken_from: p.victim.id }, tier: null, secret: false, status: "held", status_round: p.roundNo });
  return loot.name;
}

/* Players in a division who held or sent nothing tonight: at their desks, and alert. */
export async function watchfulIn(db: Db, roundId: string, division: string): Promise<{ id: string; name: string }[]> {
  const { data } = await db.from("order_packets").select("mode, characters!inner(id, name, player_id, divisions!inner(slug))").eq("round_id", roundId).in("mode", ["hold", "missed"]).eq("characters.divisions.slug", division);
  return (data ?? []).flatMap((r) => { const c = (Array.isArray(r.characters) ? r.characters[0] : r.characters) as { id: string; name: string; player_id: string | null } | null; return c?.player_id ? [{ id: c.id, name: c.name }] : []; });
}

export const EQUIPMENT_WORDS = EQUIPMENT.flatMap((d) => d.aliases);
