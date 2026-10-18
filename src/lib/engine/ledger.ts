/* Form 22, the Statement of Livestock Cases: what a player asserts the county's
   eleven cases were, on the record. Scored here against the truth the engine
   holds (canon/secret/13: four authorized HARVEST lots, two unauthorized, two
   ordinary, three the company cannot explain). Filing it is the move Episode 2
   is about: knowing the ledger is one thing, saying it under your name and
   deciding who may read it is another. Deterministic. PROPOSED 2026-10-18.

   What a filing writes:
     facts   ledger.statement.<character>   the letters, the score, what was wrongly laid on the company, release
     knowledge (filer)  ledger.statement_filed; ledger.reconstructed (9+ of 11); ledger.false_accusation
                        (an ordinary or unexplained case laid on HARVEST); ledger.statement_wrong (5 or fewer)
     knowledge (Research Committee staff)  told:<slug>:ledger, the summary
     if released to the county: facts disclosure.ledger_to_county.<character>; Sheriff Hollis is told, and
       answers in his own words (an inbound letter to him through the staff-reply pipeline) */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormSubmission } from "./forms";
import { gameDate } from "@/lib/email/letter";
import { gameMailbox, newMessageId } from "@/lib/email/resend";

export type CaseClass = "A" | "B" | "C" | "D";
export const LEDGER_TRUTH: Record<number, CaseClass> = { 1: "C", 2: "A", 3: "C", 4: "A", 5: "D", 6: "D", 7: "D", 8: "A", 9: "A", 10: "B", 11: "B" };
export const CASE_LABELS: Record<number, string> = { 1: "4/75, county road 12", 2: "9/75, Vane north", 3: "11/75, Halvorsen", 4: "4/76, Vane north", 5: "6/76, Halvorsen", 6: "6/76, Halvorsen", 7: "6/76, Halvorsen (debris)", 8: "9/76, county road 12", 9: "7/77, Vane north", 10: "9/77, Vane north", 11: "10/9/77, Vane north" };
const CLASS_TEXT: Record<CaseClass, string> = { A: "company sampling, authorized", B: "company sampling, no authorization on file", C: "ordinary cause", D: "unexplained" };

/* The letter a player wrote, or the words they used for it. */
export function classify(answer: string | undefined): CaseClass | null {
  const t = (answer ?? "").trim();
  if (!t) return null;
  const m = t.match(/^\(?([abcd])\)?(?:\b|[.):\-\s])/i);
  if (m) return m[1].toUpperCase() as CaseClass;
  const l = t.toLowerCase();
  if (/unauthori[sz]ed|no (?:authori[sz]ation|signature)|unsigned|without (?:authority|a signature)/.test(l)) return "B";
  if (/authori[sz]ed|harvest|sampling|company|royce/.test(l)) return "A";
  if (/lightning|scaveng|coyote|predator|disease|natural|ordinary|rustl|weather|exposure/.test(l)) return "C";
  if (/unexplain|unknown|cannot|can't|no explanation|inexplicable|debris|fragment/.test(l)) return "D";
  return null;
}

export async function scoreLedgerStatement(db: SupabaseClient, p: { campaignId: string; roundId: string | null; roundNo: number; characterId: string; characterSlug: string; characterName: string; submission: FormSubmission; index: string }) {
  const s = p.submission;
  const answers: Record<number, CaseClass | null> = {};
  for (let n = 1; n <= 11; n++) answers[n] = classify(s.answers[n + 1]);
  const correct = Object.keys(LEDGER_TRUTH).map(Number).filter((n) => answers[n] === LEDGER_TRUTH[n]);
  const wrong = Object.keys(LEDGER_TRUTH).map(Number).filter((n) => answers[n] && answers[n] !== LEDGER_TRUTH[n]);
  const falseHarvest = wrong.filter((n) => (answers[n] === "A" || answers[n] === "B") && (LEDGER_TRUTH[n] === "C" || LEDGER_TRUTH[n] === "D"));
  const missedHarvest = wrong.filter((n) => (LEDGER_TRUTH[n] === "A" || LEDGER_TRUTH[n] === "B") && (answers[n] === "C" || answers[n] === "D"));
  const release = /^\s*y(?:es)?\b/i.test(s.answers[14] ?? "");
  const score = correct.length;
  const by = (c: CaseClass) => Object.keys(answers).map(Number).filter((n) => answers[n] === c);
  const summary = `${p.characterName} filed Form 22 (${p.index}) on the county's eleven livestock cases: ${(["A", "B", "C", "D"] as CaseClass[]).map((c) => `${CLASS_TEXT[c]}: ${by(c).length ? `cases ${by(c).join(", ")}` : "none"}`).join("; ")}. Release to the county: ${release ? "YES" : "NO"}.`;

  await db.from("facts").upsert({ campaign_id: p.campaignId, key: `ledger.statement.${p.characterId}`, value: { answers, score, correct, wrong, false_harvest: falseHarvest, missed_harvest: missedHarvest, release, index: p.index, round: p.roundNo }, established_round: p.roundNo, secret: false }, { onConflict: "campaign_id,key" });

  const keys = ["ledger.statement_filed", ...(score >= 9 ? ["ledger.reconstructed"] : []), ...(falseHarvest.length ? ["ledger.false_accusation"] : []), ...(score <= 5 ? ["ledger.statement_wrong"] : [])];
  const { data: have } = await db.from("knowledge").select("fact_key").eq("character_id", p.characterId).in("fact_key", keys);
  const got = new Set((have ?? []).map((k) => k.fact_key as string));
  const fresh = keys.filter((k) => !got.has(k));
  if (fresh.length) await db.from("knowledge").insert(fresh.map((k) => ({ character_id: p.characterId, fact_key: k, value: { true: true, index: p.index, score, round: p.roundNo }, confidence: 1, source_kind: "witnessed", learned_round: p.roundNo })));

  // The Research Committee's staff hear what was asserted (the body the ballot sits before).
  const { data: org } = await db.from("organizations").select("id").eq("campaign_id", p.campaignId).eq("name", "Research Committee").maybeSingle();
  const { data: mem } = org ? await db.from("memberships").select("character_id, characters!inner(player_id)").eq("organization_id", org.id).is("characters.player_id", null) : { data: [] };
  const staff = (mem ?? []).map((m) => m.character_id as string);
  if (staff.length) await db.from("knowledge").insert(staff.map((cid) => ({ character_id: cid, fact_key: `told:${p.characterSlug}:ledger:${p.index}`, value: { kind: "form", text: summary, from: p.characterId, from_name: p.characterName, round: p.roundNo, form: "22", index: p.index }, confidence: 1, source_kind: "told", learned_round: p.roundNo })));

  if (!release) return { score, release, summary };
  await db.from("facts").upsert({ campaign_id: p.campaignId, key: `disclosure.ledger_to_county.${p.characterId}`, value: { index: p.index, score, round: p.roundNo }, established_round: p.roundNo, secret: false }, { onConflict: "campaign_id,key" });
  const { data: hollis } = await db.from("characters").select("id").eq("campaign_id", p.campaignId).eq("slug", "hollis").maybeSingle();
  if (!hollis) return { score, release, summary };
  await db.from("knowledge").insert({ character_id: hollis.id, fact_key: `told:${p.characterSlug}:ledger:${p.index}`, value: { kind: "form", text: summary, from: p.characterId, from_name: p.characterName, round: p.roundNo, form: "22", index: p.index }, confidence: 1, source_kind: "told", learned_round: p.roundNo });
  // The statement goes to the sheriff by post; he answers in his own words through the usual pipeline.
  const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, round_id: p.roundId, direction: "inbound", message_id: newMessageId(), from_character: p.characterId, to_characters: [hollis.id], to_addresses: [gameMailbox().address], subject: `Statement of livestock cases (Form 22, ${p.index})`, body_text: `[By post, ${gameDate(p.roundNo)}.] ${summary}\n\nThe statement lists, case by case: ${Object.keys(answers).map(Number).map((n) => `case ${n} (${CASE_LABELS[n]}): ${answers[n] ? CLASS_TEXT[answers[n]!] : "no answer"}`).join("; ")}.`, trusted: true, raw: { letter_kind: "form", form: "22", source: "ledger" } }).select("id").single();
  if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: hollis.id }, run_after: new Date(Date.now() + 180_000).toISOString() });
  return { score, release, summary };
}
