/* Formal agreements (rulebook §7.8). A player proposes one in a letter:

     AGREEMENT: "Files for a vote" WITH Okafor, Pruitt
     TERMS: Okafor sends the motor pool log to Pruitt by round 6
     TERMS: Pruitt votes FOR R-77-002
     KIND: formal                    (formal | political | secret)

   The engine numbers it (A-77-NNN), tells every party, and the agreement
   takes effect when every party has sent ACCEPT AGREEMENT A-77-NNN; one
   REJECT withdraws it. Each night the diplomatic phase carries out the parts
   it can (a pledged vote is cast if the party has not voted; units and
   documents due are handed over) and marks a breach when a party fails. A
   breach is known to every party; a political agreement, and its breach, is
   known to everyone. Terms the clerk cannot read are recorded as a party's
   word, kept and never enforced. The agreement's number is stored in
   agreements.title so that ACCEPT/REJECT (jobs.ts) keep working. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate } from "@/lib/email/letter";
import { newMessageId } from "@/lib/email/resend";
import { sendDocumentCopy } from "@/lib/game/transfer";
import { findInRoster, type Roster } from "./contacts";
import { transferHolding, transferUnits, findEquipment } from "./equipment";
import { rule } from "./rounds";

type Db = SupabaseClient;
export type AgreementKind = "formal" | "political" | "secret";
export type Term =
  | { kind: "vote"; who: string; who_name: string; motion: string; choice: "for" | "against" | "abstain"; text: string; done?: number; breached?: number }
  | { kind: "units"; who: string; who_name: string; to: string; to_name: string; amount: number; by: number | null; text: string; done?: number; breached?: number }
  | { kind: "item"; who: string; who_name: string; to: string; to_name: string; item: string; by: number | null; text: string; done?: number; breached?: number }
  | { kind: "word"; who: string | null; who_name: string | null; text: string };
export type Terms = { name: string; kind: AgreementKind; terms: Term[] };

const byRound = (t: string) => { const m = t.match(/\bby\s+(?:the\s+)?(?:lock\s+of\s+)?round\s+(\d{1,3})\b/i); return m ? Number(m[1]) : null; };

export function parseTerm(text: string, roster: Roster, parties: Roster): Term {
  const t = text.trim().replace(/[.;]+$/, "");
  const who = (s: string) => findInRoster(s, parties) ?? findInRoster(s, roster);
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^(.+?)\s+(?:votes?|will vote|to vote)\s+(for|against|abstain(?:s)?)\s+(?:on\s+)?([A-Z]-\d{2}-\d{3})\b/i))) {
    const w = who(m[1]); if (w) return { kind: "vote", who: w.id, who_name: w.name, motion: m[3].toUpperCase(), choice: /^abstain/i.test(m[2]) ? "abstain" : m[2].toLowerCase() as "for" | "against", text: t };
  }
  if ((m = t.match(/^(.+?)\s+(?:transfers?|sends?|gives?|pays?|will (?:transfer|send|give|pay))\s+(\d+)\s*(?:AU|units?|action units?)?\s+to\s+(.+?)(?:\s+by\s+.*)?$/i))) {
    const w = who(m[1]); const to = who(m[3]); if (w && to) return { kind: "units", who: w.id, who_name: w.name, to: to.id, to_name: to.name, amount: Number(m[2]), by: byRound(t), text: t };
  }
  if ((m = t.match(/^(.+?)\s+(?:sends?|gives?|hands?(?: over)?|transfers?|will (?:send|give|hand|transfer))\s+(?:a copy of\s+)?(?:the\s+|their\s+|his\s+|her\s+)?(.+?)\s+to\s+(.+?)(?:\s+by\s+.*)?$/i))) {
    const w = who(m[1]); const to = who(m[3]); if (w && to) return { kind: "item", who: w.id, who_name: w.name, to: to.id, to_name: to.name, item: m[2].trim(), by: byRound(t), text: t };
  }
  const first = t.match(/^(?:(?:dr|mr|mrs|ms|miss)\.?\s+)?(\S+)/i)?.[1] ?? "";
  const w = who(first) ?? ((m = t.match(/^(\S+\s+\S+)/)) ? who(m[1]) : null);
  return { kind: "word", who: w?.id ?? null, who_name: w?.name ?? null, text: t };
}

export async function nextAgreementNumber(db: Db, campaignId: string): Promise<string> {
  const { data } = await db.from("agreements").select("title").eq("campaign_id", campaignId).like("title", "A-77-%");
  const max = Math.max(0, ...(data ?? []).map((a) => Number(String(a.title).split("-").pop()) || 0));
  return `A-77-${String(max + 1).padStart(3, "0")}`;
}

export const termLine = (t: Term) => t.kind === "word" ? `${t.text} (a party's word; not enforced)` : `${t.text}${t.breached ? ` — BROKEN, Round ${t.breached}` : t.done ? ` — done, Round ${t.done}` : ""}`;

export async function proposeAgreement(db: Db, p: { campaignId: string; roundId: string; round: number; correspondenceId: string; proposer: { id: string; name: string }; name: string; withNames: string[]; termTexts: string[]; kind: AgreementKind; roster: Roster }): Promise<{ ok: true; number: string; parties: string[]; terms: Term[]; line: string } | { ok: false; error: string }> {
  const players = p.roster.filter((r) => r.player);
  const parties: Roster = [{ id: p.proposer.id, slug: "", name: p.proposer.name, player: true }];
  const missing: string[] = [];
  for (const nm of p.withNames) { const who = findInRoster(nm, players.filter((x) => x.id !== p.proposer.id)); if (who && !parties.some((x) => x.id === who.id)) parties.push(who); else if (!who) missing.push(nm); }
  if (parties.length < 2) return { ok: false, error: `name at least one colleague in your cohort as a party${missing.length ? ` (no one called ${missing.join(", ")}); staff make their own bargains by letter` : ""}` };
  if (!p.termTexts.length) return { ok: false, error: "give at least one TERMS: line" };
  const terms = p.termTexts.map((t) => parseTerm(t, p.roster, parties));
  const number = await nextAgreementNumber(db, p.campaignId);
  const value: Terms = { name: p.name, kind: p.kind, terms };
  const { error } = await db.from("agreements").insert({ campaign_id: p.campaignId, kind: p.kind, title: number, terms: value, parties: parties.map((x) => x.id), accepted_by: [p.proposer.id], status: "proposed", proposed_round: p.round, source_correspondence: p.correspondenceId });
  if (error) return { ok: false, error: error.message };
  // Every other party is told, with the lines to answer.
  const { data: chars } = await db.from("characters").select("id, name, players(email)").in("id", parties.slice(1).map((x) => x.id));
  for (const c of chars ?? []) {
    const email = ((Array.isArray(c.players) ? c.players[0] : c.players) as { email: string } | null)?.email ?? null;
    const body = `${c.name},\n\n${p.proposer.name} proposes a ${p.kind} agreement, "${p.name}", numbered ${number}, between ${parties.map((x) => x.name).join(", ")}. Its terms, as the clerk read them:\n\n${terms.map((t) => `  • ${termLine(t)}`).join("\n")}\n\nIt takes effect when every party has sent the line\n\n    ACCEPT AGREEMENT ${number}\n\nand lapses if any party sends REJECT AGREEMENT ${number}. ${p.kind === "formal" ? "Once in force, the company carries out what it can of these terms at the lock each night (a pledged vote is cast unless the party has voted; units and documents due are handed over) and records a breach when a party fails." : p.kind === "political" ? "A political agreement is public: every employee is told when it takes effect, and when it is broken." : "A secret agreement is known only to its parties; a breach is known to them."}\n\n— Personnel & Administration, for the record`;
    const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, round_id: p.roundId, direction: "outbound", message_id: newMessageId(), from_character: null, to_characters: [c.id], to_addresses: email ? [email] : [], subject: `Agreement proposed: ${number}, "${p.name}"`, body_text: body, raw: { letter_kind: "notice", classification: p.kind === "secret" ? "Personal & Confidential" : "Internal", office: { office: "Personnel & Administration", department: "Royce Industries" }, agreement: number } }).select("id").single();
    if (row && email) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
  }
  await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "intake", kind: "agreement.proposed", payload: { number, name: p.name, kind: p.kind, parties: parties.map((x) => x.id), terms: terms.map(termLine) }, idempotency_key: `agreement:${p.campaignId}:${number}`, visible_to: parties.map((x) => x.id) });
  return { ok: true, number, parties: parties.map((x) => x.name), terms, line: `AGREEMENT ${number} "${p.name}" proposed (${p.kind}) with ${parties.slice(1).map((x) => x.name).join(", ")} — ${terms.length} term${terms.length === 1 ? "" : "s"}${terms.some((t) => t.kind === "word") ? `, of which ${terms.filter((t) => t.kind === "word").length} the clerk records as a party's word and cannot enforce` : ""}; in force when every party sends ACCEPT AGREEMENT ${number}` };
}

/* When the last party accepts (jobs.ts): parties are told; a political agreement is told to everyone. */
export async function announceActive(db: Db, campaignId: string, roundId: string | null, round: number, agreementId: string) {
  const { data: ag } = await db.from("agreements").select("title, kind, parties, terms").eq("id", agreementId).single();
  if (!ag) return;
  const v = ag.terms as Terms;
  const { data: everyone } = await db.from("characters").select("id").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const audience = ag.kind === "political" ? (everyone ?? []).map((c) => c.id as string) : (ag.parties as string[]);
  await db.from("events").insert({ campaign_id: campaignId, round_id: roundId, phase: "intake", kind: "agreement.active", payload: { number: ag.title, name: v.name, kind: ag.kind, parties: ag.parties, text: `agreement ${ag.title}, "${v.name}", is in force between its parties${ag.kind === "political" ? " and is public" : ""}` }, idempotency_key: `agreement:${agreementId}:active`, visible_to: audience });
  if (audience.length) await db.from("knowledge").insert(audience.map((id) => ({ character_id: id, fact_key: `agreement.${ag.title}`, value: { kind: "info_share", text: `${ag.title} "${v.name}" (${ag.kind}) is in force: ${v.terms.map((t) => t.text).join("; ")}`, round }, confidence: 1, source_kind: "dispatch", source_ref: null, learned_round: round })));
}

/* The diplomatic phase: carry out what can be carried out; mark breaches. */
export async function enforceAgreements(db: Db, round: { campaignId: string; id: string; number: number }): Promise<{ done: number; breached: number; fulfilled: number }> {
  const out = { done: 0, breached: 0, fulfilled: 0 };
  const { data: ags } = await db.from("agreements").select("id, title, kind, parties, terms").eq("campaign_id", round.campaignId).eq("status", "active");
  const cap = Number(await rule(db, round.campaignId, "au.cap", 60));
  const { data: everyone } = await db.from("characters").select("id, name, slug, player_id").eq("campaign_id", round.campaignId);
  const person = (id: string) => (everyone ?? []).find((c) => c.id === id);
  for (const ag of ags ?? []) {
    const v = ag.terms as Terms; let changed = false; let broke = false;
    for (const t of v.terms) {
      if (t.kind === "word" || t.done || t.breached) continue;
      const fail = async (why: string) => {
        t.breached = round.number; broke = true; changed = true; out.breached++;
        const audience = ag.kind === "political" ? (everyone ?? []).filter((c) => c.player_id).map((c) => c.id as string) : (ag.parties as string[]);
        await db.from("events").insert({ campaign_id: round.campaignId, round_id: round.id, phase: "diplomatic", kind: "agreement.breached", payload: { number: ag.title, name: v.name, by: t.who, by_name: t.who_name, term: t.text, why, text: `${t.who_name} broke agreement ${ag.title}, "${v.name}": ${t.text} (${why})` }, idempotency_key: `breach:${ag.id}:${v.terms.indexOf(t)}`, visible_to: audience });
        if (audience.length) await db.from("knowledge").insert(audience.map((id) => ({ character_id: id, fact_key: `breach:${ag.title}:${v.terms.indexOf(t)}`, value: { kind: "breach", text: `${t.who_name} broke ${ag.title} "${v.name}": ${t.text} (${why})`, who: t.who, who_name: t.who_name, round: round.number }, confidence: 1, source_kind: "dispatch", source_ref: null, learned_round: round.number })));
      };
      if (t.kind === "vote") {
        const { data: m } = await db.from("motions").select("id, status, opens_round, closes_round").eq("campaign_id", round.campaignId).eq("number", t.motion).maybeSingle();
        if (!m) continue;
        const { data: vote } = await db.from("votes").select("choice").eq("motion_id", m.id).eq("character_id", t.who).maybeSingle();
        if (m.status === "open") {
          if (!vote && Number(m.opens_round) <= round.number) {
            // Is the party a member? Only a member's vote counts; a pledge by a non-member is their word.
            const { data: org } = await db.from("motions").select("organization_id").eq("id", m.id).single();
            const { data: seat } = await db.from("memberships").select("character_id").eq("organization_id", org!.organization_id).eq("character_id", t.who).maybeSingle();
            if (seat) { await db.from("votes").insert({ motion_id: m.id, character_id: t.who, choice: t.choice, weight: 1, cast_round: round.number, source: "agreement", secret: false }); }
          }
          continue;
        }
        if (vote?.choice === t.choice) { t.done = round.number; changed = true; out.done++; } else await fail(vote ? `voted ${vote.choice}` : "did not vote");
        continue;
      }
      const due = t.by === null || t.by <= round.number;
      if (!due) continue;
      const from = person(t.who); const to = person(t.to);
      if (!from || !to) { await fail("a party is gone"); continue; }
      if (t.kind === "units") {
        const r = await transferUnits(db, { campaignId: round.campaignId, round: round.number, from: { id: from.id, name: from.name }, to: { id: to.id, name: to.name, player: Boolean(to.player_id) }, amount: t.amount, cap });
        if (r.ok && r.moved >= t.amount) { t.done = round.number; changed = true; out.done++; } else await fail(r.ok ? `only ${r.moved} of ${t.amount} AU could be moved` : r.error);
        continue;
      }
      // An item: a document in the Case File goes as a copy; equipment changes hands.
      const want = t.item.toLowerCase();
      const { data: items } = await db.from("case_items").select("slug, title").eq("character_id", from.id).eq("status", "held");
      const hit = (items ?? []).find((i) => i.slug === want) ?? (items ?? []).find((i) => (i.title as string).toLowerCase().includes(want));
      if (hit) { const r = await sendDocumentCopy(db, { campaignId: round.campaignId, fromCharacterId: from.id, toCharacterId: to.id, itemSlug: hit.slug as string, round: round.number, note: `Under agreement ${ag.title}.` }); if (r.ok) { t.done = round.number; changed = true; out.done++; } else await fail(r.error); continue; }
      if (findEquipment(t.item)) { const r = await transferHolding(db, { campaignId: round.campaignId, round: round.number, from: { id: from.id, name: from.name }, to: { id: to.id, name: to.name, slug: to.slug, player: Boolean(to.player_id) }, text: t.item }); if (r.ok) { t.done = round.number; changed = true; out.done++; } else await fail(r.error); continue; }
      await fail(`${from.name} holds nothing called "${t.item}"`);
    }
    const open = v.terms.some((t) => t.kind !== "word" && !t.done && !t.breached);
    const status = broke ? "breached" : !open ? "fulfilled" : "active";
    if (status === "fulfilled") out.fulfilled++;
    if (changed || status !== "active") await db.from("agreements").update({ terms: v, status }).eq("id", ag.id);
    if (status === "fulfilled") await db.from("events").insert({ campaign_id: round.campaignId, round_id: round.id, phase: "diplomatic", kind: "agreement.fulfilled", payload: { number: ag.title, name: v.name, text: `agreement ${ag.title}, "${v.name}", is fulfilled: every term the company could carry out has been` }, idempotency_key: `fulfilled:${ag.id}`, visible_to: ag.parties as string[] });
  }
  return out;
}

/* For a party's dispatch: what they are in, and what waits on their answer. */
export async function agreementsOf(db: Db, campaignId: string, characterId: string): Promise<string[]> {
  const { data } = await db.from("agreements").select("title, kind, status, parties, accepted_by, terms").eq("campaign_id", campaignId).contains("parties", [characterId]).in("status", ["proposed", "active"]);
  return (data ?? []).map((a) => {
    const v = a.terms as Terms;
    const mine = (a.accepted_by as string[]).includes(characterId);
    return a.status === "proposed"
      ? `${a.title} "${v.name}" (${a.kind}) proposed; ${mine ? `waiting on ${(a.parties as string[]).length - (a.accepted_by as string[]).length} other part${(a.parties as string[]).length - (a.accepted_by as string[]).length === 1 ? "y" : "ies"}` : `ACCEPT AGREEMENT ${a.title} or REJECT AGREEMENT ${a.title}`}.`
      : `${a.title} "${v.name}" (${a.kind}) in force: ${v.terms.map(termLine).join("; ")}.`;
  });
}

export { gameDate };
