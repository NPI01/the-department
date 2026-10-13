/* NPC seats vote. Each director has a lean on each motion (-1..1) seeded from
   canon and moved by lobbying; some have a price (evidence a lobbyist must
   hold) that flips them outright. At the close, every member without a cast
   vote votes by lean; only members' votes count. Leans live in `facts` under
   motion.<number>.stance.<slug>. */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Stance = { lean: number; price?: { any_of: string[]; sets: number; note: string } | null; moved?: { by: string; round: number; how: string }[] };

export async function getStance(db: SupabaseClient, campaignId: string, motionNumber: string, slug: string): Promise<Stance> {
  const { data } = await db.from("facts").select("value").eq("campaign_id", campaignId).eq("key", `motion.${motionNumber}.stance.${slug}`).maybeSingle();
  return ((data?.value as Stance | undefined) ?? { lean: 0 });
}
export async function setStance(db: SupabaseClient, campaignId: string, motionNumber: string, slug: string, s: Stance, round: number | null) {
  await db.from("facts").upsert({ campaign_id: campaignId, key: `motion.${motionNumber}.stance.${slug}`, value: s, established_round: round, secret: true }, { onConflict: "campaign_id,key" });
}

/* A conversation in person: returns what happened, for the resolver's summary and the NPC's note. */
export async function applyLobby(db: SupabaseClient, p: { campaignId: string; motionNumber: string; npcSlug: string; npcId: string; lobbyist: { id: string; name: string }; direction: "for" | "against"; round: number }): Promise<{ moved: boolean; flipped: boolean; lean: number; because: string }> {
  const s = await getStance(db, p.campaignId, p.motionNumber, p.npcSlug);
  const dir = p.direction === "for" ? 1 : -1;
  let because = "listened, promised nothing";
  let flipped = false;
  if (s.price?.any_of.length) {
    const { data: held } = await db.from("knowledge").select("fact_key").eq("character_id", p.lobbyist.id).in("fact_key", s.price.any_of);
    if ((held ?? []).length) { s.lean = s.price.sets; flipped = true; because = s.price.note; }
  }
  if (!flipped) { s.lean = Math.max(-1, Math.min(1, s.lean + dir * 0.25)); because = Math.sign(s.lean) === dir ? "leans further your way" : "unmoved in substance; the visit is remembered"; }
  s.moved = [...(s.moved ?? []), { by: p.lobbyist.id, round: p.round, how: `${p.direction}: ${because}` }].slice(-12);
  await setStance(db, p.campaignId, p.motionNumber, p.npcSlug, s, p.round);
  return { moved: true, flipped, lean: s.lean, because };
}

/* At the close: members who have not voted vote by lean. Returns the count. */
export async function castNpcVotes(db: SupabaseClient, m: { id: string; number: string | null; campaign_id: string; organization_id: string }, round: number): Promise<{ cast: number }> {
  const { data: members } = await db.from("memberships").select("character_id, voting_weight, characters(slug, player_id)").eq("organization_id", m.organization_id);
  const { data: votes } = await db.from("votes").select("character_id").eq("motion_id", m.id);
  const voted = new Set((votes ?? []).map((v) => v.character_id as string));
  let cast = 0;
  for (const mem of members ?? []) {
    const ch = (Array.isArray(mem.characters) ? mem.characters[0] : mem.characters) as { slug: string; player_id: string | null } | null;
    if (!ch || ch.player_id || voted.has(mem.character_id as string)) continue;
    const s = m.number ? await getStance(db, m.campaign_id, m.number, ch.slug) : { lean: 0 };
    const choice = s.lean > 0.15 ? "for" : s.lean < -0.15 ? "against" : "abstain";
    await db.from("votes").insert({ motion_id: m.id, character_id: mem.character_id, choice, weight: mem.voting_weight ?? 1, cast_round: round, source: "npc", secret: false });
    cast++;
  }
  return { cast };
}
