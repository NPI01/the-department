/* The Unfinished Descent: Episode 5's mechanic, from canon/secret/02 (the
   stairway rules) and 16 §Episode 05. Deterministic: the model narrates, it
   does not decide.

   DESCEND (10 AU) from Tagus. The way down is the cellar door, or, once the
   Safety Committee has sealed it, the ventilation shaft under the plate in the
   Halvorsen windbreak (a Congregation member knows it; anyone who has visited
   the plate knows it). How far you get is a threshold, 1 to 4:
     1 perception   the wall at about twenty steps; two instruments disagree
     2 memory       the lower flight; something you have read, wrong by a detail
     3 identity     (invented by the Ascendants: no effect; the flight goes on)
     4 time         the absent are met: Marsh first, then Greeley, then Wren
   Threshold = 1 + floor(specific beliefs / 2) (+1 when the Convergence Index is
   40 or more), never above 4; a mind holding both the Keepers' and the
   Congregation's reading stops at 1 (rule 1: contradictory belief); a site under
   active Keeper practice caps everyone at 1 (rule 7); two or more people on the
   stairs the same night cap at 2 (the fifth descent, collective consciousness, is
   the planted lie: a person alone goes further). Episode 4 reaches the wall only.
   Beyond threshold 2 the descender carries a disturbance: one date on one held
   document changes, and the Index rises (rule 6). The 1984 chamber (threshold 7)
   is Episode 10's and is not here.

   Form 23, the Report of Descent, is Kovic's paper and the Keepers' practice at
   once: accounts that agree feed the Index (+2); three or more in one round that
   disagree on the count are containment (Index -3; descents capped at 1 that
   round and the next). PROPOSED 2026-10-23. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormSubmission } from "./forms";
import { factsFor } from "./conditions";

export const SPECIFIC_BELIEFS = [
  "tagus.lower_landing_wall", "tagus.two_tapes_one_bolt", "tagus.depths_all_correct_confirmed", "tagus.three_depths_same_minute_noticed", "tagus.lateral_pull_measured",
  "congregation.seven_descents_named", "congregation.pamphlet_read", "brandvold.three_days_one_night", "brandvold.dates_changed_noticed", "tagus.survey_sketch_b_exists",
  "tagus.marsh_visited_august_noticed", "tagus.baseline_rising_confirmed", "tagus.protocol_read", "tagus.orange_light_reported", "descent.threshold.2", "descent.threshold.3", "descent.threshold.4",
];
const KEEPER_READING = ["vigil.accounts_meant_to_disagree_noticed", "vigil.practice_contradictory_accounts"];
const ASCENDANT_READING = ["congregation.seven_descents_named", "congregation.pamphlet_read"];

export async function getIndex(db: SupabaseClient, campaignId: string): Promise<number> {
  const { data } = await db.from("rules").select("value").eq("campaign_id", campaignId).eq("key", "convergence.index").maybeSingle();
  return Number(data?.value ?? 0);
}
export async function bumpIndex(db: SupabaseClient, campaignId: string, delta: number): Promise<number> {
  const v = Math.max(0, Math.min(100, (await getIndex(db, campaignId)) + delta));
  await db.from("rules").upsert({ campaign_id: campaignId, key: "convergence.index", value: v }, { onConflict: "campaign_id,key" });
  return v;
}

/* Pure: how far a descent goes. */
export function thresholdFor(p: { episode: number; specific: number; index: number; confused: boolean; containment: boolean; company: boolean }): number {
  if (p.episode < 5 || p.containment || p.confused) return 1;
  let t = 1 + Math.floor(p.specific / 2) + (p.index >= 40 ? 1 : 0);
  if (p.company) t = Math.min(t, 2);
  return Math.max(1, Math.min(4, t));
}

const ABSENT = ["marsh", "greeley", "wren"] as const;

export type DescentResult = { threshold: number; solo: boolean; index: number; summary: string; learned: string[]; item: string | null; disturbed: string | null };

export async function descend(db: SupabaseClient, p: { campaignId: string; roundId: string; roundNo: number; episode: number; character: { id: string; slug: string; name: string }; withInstrument: boolean; dry: boolean }): Promise<DescentResult> {
  const [{ data: kn }, index, facts] = await Promise.all([
    db.from("knowledge").select("fact_key").eq("character_id", p.character.id),
    getIndex(db, p.campaignId),
    factsFor(db, p.campaignId, [`containment.tagus`, `encounter.marsh.first`, `encounter.greeley.first`, `encounter.wren.first`]),
  ]);
  const knows = new Set((kn ?? []).map((k) => k.fact_key as string));
  const specific = SPECIFIC_BELIEFS.filter((k) => knows.has(k)).length;
  const confused = KEEPER_READING.some((k) => knows.has(k)) && ASCENDANT_READING.some((k) => knows.has(k));
  const cont = facts.get("containment.tagus") as { round?: number } | undefined;
  const containment = Boolean(cont && Number(cont.round) >= p.roundNo - 1);
  // Company on the stairs tonight: another player's descent recorded this round.
  const { data: others } = await db.from("facts").select("key").eq("campaign_id", p.campaignId).like("key", `descent.${p.roundNo}.%`).neq("key", `descent.${p.roundNo}.${p.character.id}`);
  const company = (others ?? []).length > 0;
  const threshold = thresholdFor({ episode: p.episode, specific, index, confused, containment, company });
  const learned: string[] = ["descended.tagus", `descent.threshold.${threshold}`];
  const parts: string[] = [];
  const watch = 10 + threshold * 7, clock = 10 + (threshold >= 4 ? 90 : threshold >= 2 ? 25 : 12);   // minutes by the watch, minutes by the church clock
  parts.push(`${p.character.name} went down the Tagus stairs${company ? ", not alone," : " alone"}${p.withInstrument ? ", the magnetometer in hand" : ""}.`);
  if (threshold === 1) parts.push(`Twenty-one steps, a landing, a wall that was poured after the stairs were. ${containment ? "The wall is a wall tonight; whatever the stairs are on other nights, three people have written them down differently this week and the writing holds." : confused ? "Two accounts of what lies below fought each other on the way down, and the wall was the only thing both could agree on." : "The count down was twenty-one and the count back up was twenty."} The watch says ${watch} minutes; the church clock says ${clock}.`);
  if (threshold >= 2) parts.push(`Below the landing the wall was not a wall. A second flight, narrower, the same concrete, going down into a dark that took the lamp without giving anything back. ${company ? "With others on the stairs the second flight ended at another landing and another wall; the Congregation's pamphlet says the opposite, and the pamphlet is wrong." : ""}`);
  if (threshold >= 2) {
    // The memory pool: something the descender has read, wrong by one detail.
    const noticed = [...knows].filter((k) => k.endsWith("_noticed")).sort();
    const pick = noticed[(p.roundNo + noticed.length) % Math.max(1, noticed.length)];
    parts.push(pick ? `On the second flight something came back that ${p.character.name} had read in a file this month (${pick.replace(/^[a-z]+\./, "").replace(/_noticed$/, "").replace(/_/g, " ")}), word for word, except for one detail that was not in the file and is now hard to be sure about.` : `On the second flight ${p.character.name} heard their own name said once, in the voice of someone they could not place.`);
  }
  if (threshold >= 3) parts.push(`The flight went on. There is a third threshold in the Congregation's pamphlet, the one they call identity; nothing happened at it, which is its own kind of answer.`);
  let item: string | null = null;
  if (threshold >= 4) {
    const who = ABSENT.find((a) => !facts.has(`encounter.${a}.first`)) ?? ABSENT[p.roundNo % ABSENT.length];
    learned.push(`encounter.${who}`);
    if (!p.dry) await db.from("facts").upsert({ campaign_id: p.campaignId, key: `encounter.${who}.first`, value: { character: p.character.id, round: p.roundNo }, established_round: p.roundNo, secret: true }, { onConflict: "campaign_id,key" });
    if (who === "marsh") {
      parts.push(`At the fourth threshold there was someone on the stairs below, coming up. A woman in a company parka with a lamp held low, who stopped two steps down and looked at ${p.character.name} for a long moment and said: "You are early. Find the original date." She went on up past them and was not on the landing when ${p.character.name} got there. Her face is on a personnel file that says she transferred out of state in September. On the twelfth step, on the way up, a card that had not been there on the way down.`);
      item = "marsh-card-twelfth-step";
      if (!p.dry) await db.from("case_items").upsert({ campaign_id: p.campaignId, character_id: p.character.id, slug: item, kind: "document", drawer: "documents", title: "A card found on the twelfth step, Tagus stairs", from_label: "unknown", written_label: "undated", body: "A plain index card, soft at the corners. One line in a careful hand: *Find the original date.* Under it, smaller: *Not the copy. The one they moved.*", round_received: p.roundNo, how_obtained: `Found on the twelfth step of the Tagus stairs, coming up, Round ${p.roundNo}.`, copy_note: "The card itself.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug" });
    } else if (who === "greeley") parts.push(`At the fourth threshold a young man in a laboratory coat was sitting on a step with a notebook open on his knee, writing. He did not look up. The page he was writing on was numbered 212. When ${p.character.name} came back up the step was empty and the concrete where he had sat was warm.`);
    else parts.push(`At the fourth threshold a woman in a long coat of a cut nobody has worn for fifty years stood with her back to the wall and her eyes shut, counting under her breath. She reached twenty, opened her eyes, said "It will burn," quite calmly, and was not there.`);
  }
  // Instruments disagree by design (rule 2), by an amount that grows with the Index.
  let readings: string | null = null;
  if (p.withInstrument) {
    const a = 180 + threshold * 40, b = Math.round(a * (1 + 0.1 + index / 200));
    readings = `tagus-readings-r${p.roundNo}`;
    parts.push(`The magnetometer read ${a} at the lowest step reached and ${b} on the same step a minute later, with nothing moved; at the top it read 40, as it had at the bottom of the church steps. Both numbers are written down.`);
    if (!p.dry) await db.from("case_items").upsert({ campaign_id: p.campaignId, character_id: p.character.id, slug: readings, kind: "document", drawer: "documents", title: `Magnetometer readings, Tagus stairs, Round ${p.roundNo}`, from_label: p.character.name, written_label: `Round ${p.roundNo}`, body: `**READINGS — TAGUS STAIRS — ROUND ${p.roundNo}**\n\nChurch steps, top: 40. Landing: ${a - 40}. Lowest step reached (threshold ${threshold}): ${a}; one minute later, same step, instrument not moved: ${b}. Watch: ${watch} min below. Church clock: ${clock} min. Observer: ${p.character.name}.`, round_received: p.roundNo, how_obtained: "Taken on the stairs with the Applied Physics magnetometer.", copy_note: "Your own readings.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug" });
    learned.push("tagus.instruments_disagree_measured");
    item = item ?? readings;
  }
  // Costs (rule 6): beyond the second threshold a date changes on a document you hold, and the Index rises.
  let disturbed: string | null = null;
  if (threshold >= 3 && !p.dry) {
    const { data: held } = await db.from("case_items").select("id, slug, title, body, copy_note").eq("character_id", p.character.id).eq("status", "held").not("body", "is", null).order("created_at");
    const cand = (held ?? []).find((i) => /\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(String(i.body)) || /\b(19\d\d)\b/.test(String(i.body)));
    if (cand) {
      let body = String(cand.body);
      const m = body.match(/\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December)\b/);
      if (m) body = body.replace(m[0], `${Math.max(1, Number(m[1]) + (Number(m[1]) % 2 ? 1 : -1))} ${m[2]}`);
      else { const y = body.match(/\b(19\d\d)\b/)!; body = body.replace(y[0], String(Number(y[1]) + (Number(y[1]) % 2 ? 1 : -1))); }
      await db.from("case_items").update({ body, copy_note: `${cand.copy_note ? `${cand.copy_note} ` : ""}One date on this is not the date you remember reading.` }).eq("id", cand.id);
      disturbed = cand.title as string;
      learned.push(`disturbance.r${p.roundNo}`);
    }
    await bumpIndex(db, p.campaignId, threshold >= 4 ? 2 : 1);
  } else if (threshold === 2 && !p.dry) await bumpIndex(db, p.campaignId, 1);
  if (!p.dry) {
    await db.from("facts").upsert({ campaign_id: p.campaignId, key: `descent.${p.roundNo}.${p.character.id}`, value: { threshold, solo: !company, index, instrument: p.withInstrument, round: p.roundNo }, established_round: p.roundNo, secret: true }, { onConflict: "campaign_id,key" });
    await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "strategic", kind: "descent.made", payload: { character: p.character.id, name: p.character.name, threshold, solo: !company, round: p.roundNo, disturbed }, idempotency_key: `descent:${p.roundId}:${p.character.id}`, visible_to: [p.character.id] });
  }
  parts.push(`Up top it was still night. The count back was ${threshold >= 2 ? "not the count down" : "twenty"}.${disturbed ? ` Later, going through the Case File, a date on "${disturbed}" is not the date ${p.character.name} remembers reading.` : ""}`);
  return { threshold, solo: !company, index, summary: parts.join(" "), learned, item, disturbed };
}

/* Form 23 filed: the account joins the round's accounts; agreement feeds, disagreement contains. */
export async function recordDescentAccount(db: SupabaseClient, p: { campaignId: string; roundId: string | null; roundNo: number; characterId: string; characterName: string; submission: FormSubmission; index: string }) {
  const s = p.submission;
  const num = (t: string | undefined) => { const m = (t ?? "").match(/\d+/); return m ? Number(m[0]) : null; };
  const down = num(s.answers[2]), up = num(s.answers[3]);
  await db.from("facts").upsert({ campaign_id: p.campaignId, key: `account.${p.roundNo}.${p.characterId}`, value: { down, up, light: s.answers[4] ?? null, sound: s.answers[5] ?? null, index: p.index, round: p.roundNo }, established_round: p.roundNo, secret: false }, { onConflict: "campaign_id,key" });
  await db.from("knowledge").insert({ character_id: p.characterId, fact_key: `account.filed`, value: { true: true, index: p.index, round: p.roundNo }, confidence: 1, source_kind: "witnessed", learned_round: p.roundNo });
  const { data: all } = await db.from("facts").select("key, value").eq("campaign_id", p.campaignId).like("key", `account.${p.roundNo}.%`);
  const rows = (all ?? []).map((r) => ({ who: (r.key as string).split(".")[2], down: (r.value as { down: number | null }).down }));
  const counts = rows.map((r) => r.down).filter((d): d is number => d !== null);
  const distinct = new Set(counts);
  if (rows.length >= 3 && distinct.size >= 2) {
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", `containment:${p.campaignId}:${p.roundNo}`).maybeSingle();
    if (!dup) {
      await db.from("facts").upsert({ campaign_id: p.campaignId, key: "containment.tagus", value: { round: p.roundNo, accounts: rows.length, counts: [...distinct] }, established_round: p.roundNo, secret: true }, { onConflict: "campaign_id,key" });
      await bumpIndex(db, p.campaignId, -3);
      await db.from("knowledge").insert(rows.map((r) => ({ character_id: r.who, fact_key: "vigil.containment_achieved", value: { true: true, round: p.roundNo }, confidence: 1, source_kind: "witnessed", learned_round: p.roundNo })));
      await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "intake", kind: "containment.active", payload: { round: p.roundNo, accounts: rows.length, counts: [...distinct] }, idempotency_key: `containment:${p.campaignId}:${p.roundNo}`, visible_to: rows.map((r) => r.who) });
    }
  } else if (rows.length >= 2 && distinct.size === 1) {
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", `consistent:${p.campaignId}:${p.roundNo}`).maybeSingle();
    if (!dup) {
      await bumpIndex(db, p.campaignId, 2);
      await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "intake", kind: "accounts.consistent", payload: { round: p.roundNo, accounts: rows.length, count: counts[0] }, idempotency_key: `consistent:${p.campaignId}:${p.roundNo}`, visible_to: rows.map((r) => r.who) });
    }
  }
  return { down, up, accounts: rows.length, distinct: distinct.size };
}
