/* Scheduled operations: things the company has on its calendar that run on a
   given day of an episode unless somebody stops them. The ORPHEUS field
   calibration on Episode 1 day 9 is the first. Deterministic: at the world
   phase of its day an operation is stopped if its place is sealed under an
   emergency directive tonight, or if its authorization paper is in a player's
   Case File by any route but Records (lifted from a desk, found in a search,
   handed on); otherwise it ran. Either way the result is a fact every later
   episode can read (`operation.<key>` with { status }), an event in every
   player's dispatch, and a knowledge row on every player
   (`operation.<key>.<status>`), so goals and scheduled mail can turn on it.
   What the players never see is who stopped it, unless they tell each other.
   PROPOSED 2026-10-18. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sealed, type Directive } from "./directives";
import { factsFor, holds } from "./conditions";
import { placesFor } from "./world";

export type OperationDef = {
  key: string; episode: number; day: number;
  name: string;                 // player-safe
  place?: string;               // place slug; a seal directive on it tonight stops the operation
  authorization?: string;       // document slug; the original in a player's hands stops the operation
  ran: string; stopped: string; // what the morning says, player-safe
};

export const OPERATIONS: OperationDef[] = [
  {
    key: "orpheus_calibration_r9", episode: 1, day: 9, name: "the Applied Physics field calibration scheduled for Building 7",
    place: "building-7", authorization: "orpheus-calibration-authorization",
    ran: "The field calibration scheduled for Building 7 ran last night as planned. Building 7's door was open from 2100 to 0140, the lights in the south-east corner were on, and the perimeter sensors logged a magnetic drift that Facilities has already explained as the weather.",
    stopped: "The field calibration scheduled for Building 7 did not run last night. Dr. Elias Thorne's office could not produce the countersigned authorization at the door, Security would not open Building 7 without it, and the procedure is postponed without a date. Applied Physics and Advanced Materials are asking each other who had the paper.",
  },
];

export async function resolveOperations(db: SupabaseClient, p: { campaignId: string; roundId: string; roundNo: number; episode: number; episodeRound: number; directives: Directive[] }): Promise<{ resolved: number }> {
  const due = OPERATIONS.filter((o) => o.episode === p.episode && o.day === p.episodeRound);
  if (!due.length) return { resolved: 0 };
  const facts = await factsFor(db, p.campaignId, due.map((o) => `operation.${o.key}`));
  const { data: pcs } = await db.from("characters").select("id").eq("campaign_id", p.campaignId).eq("status", "active").not("player_id", "is", null);
  const ids = (pcs ?? []).map((c) => c.id as string);
  let n = 0;
  for (const o of due) {
    if (facts.has(`operation.${o.key}`)) continue;
    let how: string | null = null; let by: string | null = null;
    const seal = o.place ? sealed(p.directives, o.place) : null;
    if (seal) how = `sealed under directive ${seal.number}`;
    if (!how && o.authorization && ids.length) {
      const { data: held } = await db.from("case_items").select("character_id, slug, how_obtained").in("character_id", ids).eq("status", "held").like("slug", `${o.authorization}%`);
      const lifted = (held ?? []).find((h) => (h.slug === o.authorization || /-taken-r\d+$/.test(String(h.slug))) && !/^Requested through Records/.test(String(h.how_obtained ?? "")));
      if (lifted) { how = "the authorization could not be produced"; by = lifted.character_id as string; }
    }
    const status = how ? "stopped" : "ran";
    await db.from("facts").upsert({ campaign_id: p.campaignId, key: `operation.${o.key}`, value: { status, round: p.roundNo, how, by }, established_round: p.roundNo, secret: false }, { onConflict: "campaign_id,key" });
    await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "world", kind: "operation.resolved", payload: { key: o.key, name: o.name, status, text: status === "ran" ? o.ran : o.stopped, round: p.roundNo }, idempotency_key: `operation:${p.campaignId}:${o.key}`, visible_to: ids });
    if (ids.length) await db.from("knowledge").insert(ids.map((cid) => ({ character_id: cid, fact_key: `operation.${o.key}.${status}`, value: { kind: "info_share", text: status === "ran" ? o.ran : o.stopped, round: p.roundNo }, confidence: 1, source_kind: "dispatch", learned_round: p.roundNo })));
    n++;
  }
  return { resolved: n };
}

/* Places closed tonight by the story (PlaceDef.closedBy): visits, searches and
   watches there are refused with the place's own words. Computed once a lock. */
export async function closedPlacesTonight(db: SupabaseClient, campaignId: string, episode: number): Promise<{ slug: string; text: string }[]> {
  const places = placesFor(episode).filter((p) => p.closedBy);
  if (!places.length) return [];
  const facts = await factsFor(db, campaignId, places.map((p) => p.closedBy!.fact));
  return places.filter((p) => holds(p.closedBy!, facts)).map((p) => ({ slug: p.slug, text: p.closedBy!.text }));
}
