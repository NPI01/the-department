/* EMERGENCY_DIRECTIVE "<text>" (rulebook §6.3, §8.5): an officer who holds
   emergency authority issues an order that takes effect at once and expires
   two rounds later unless the Safety Committee extends it. Deterministic:
   the clerk reads the text as one of four kinds the engine can enforce, and
   refuses anything else.

     seal <place>          the place is closed: visits, searches and watches
                           there are refused and reported to Security
     suspend <colleague>   their access to Records and restricted places is
                           suspended (the purge's own mechanism)
     curfew                nobody leaves the campus: TRAVEL is refused
     open <document>       a file is open to every clearance while it lasts

   Authority: the Board's Chairman, the Safety Committee's chair, or anyone
   the record names (facts authority.emergency.<char>, set by the showrunner or
   a passed motion). Directives are numbered D-77-NNN, recorded in facts, and
   sent to every desk as a memo from the officer. PROPOSED 2026-10-16. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate } from "@/lib/email/letter";
import { newMessageId } from "@/lib/email/resend";
import { placesFor, documentsFor } from "./world";

type Db = SupabaseClient;
export const DIRECTIVE_ROUNDS = 2;
export const EXTENSION_ROUNDS = 5;

export type Directive = { number: string; kind: "seal" | "suspend" | "curfew" | "open"; target: string | null; target_name: string | null; by: string; by_name: string; round: number; until: number; text: string };

export async function holdsEmergencyAuthority(db: Db, campaignId: string, characterId: string): Promise<{ ok: boolean; as: string | null }> {
  const { data: seats } = await db.from("memberships").select("role, organizations!inner(slug, name)").eq("character_id", characterId);
  for (const s of seats ?? []) {
    const o = (Array.isArray(s.organizations) ? s.organizations[0] : s.organizations) as { slug: string; name: string };
    const role = String(s.role ?? "");
    if (o.slug === "board" && /chairman/i.test(role)) return { ok: true, as: "Chairman of the Board" };
    if (o.slug === "safety-committee" && /^chair\b/i.test(role)) return { ok: true, as: "Chair of the Safety Committee" };
  }
  const { data: f } = await db.from("facts").select("value").eq("campaign_id", campaignId).eq("key", `authority.emergency.${characterId}`).maybeSingle();
  if (f) return { ok: true, as: ((f.value as { as?: string } | null)?.as) ?? "holder of emergency authority" };
  return { ok: false, as: null };
}

export async function activeDirectives(db: Db, campaignId: string, roundNo: number): Promise<Directive[]> {
  const { data } = await db.from("facts").select("value").eq("campaign_id", campaignId).like("key", "directive.D-%");
  return (data ?? []).map((f) => f.value as Directive).filter((d) => d.until >= roundNo);
}
export const sealed = (ds: Directive[], placeSlug: string) => ds.find((d) => d.kind === "seal" && d.target === placeSlug) ?? null;
export const curfew = (ds: Directive[]) => ds.find((d) => d.kind === "curfew") ?? null;
export const opened = (ds: Directive[], docSlug: string) => ds.find((d) => d.kind === "open" && d.target === docSlug) ?? null;

type Person = { id: string; slug: string; name: string; player: boolean; division: string | null };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/* The clerk's reading of the directive's text. */
export function parseDirective(text: string, p: { episode: number; people: Person[]; findPerson: (t: string, people: Person[]) => Person | null }): { kind: Directive["kind"]; target: string | null; target_name: string | null; label: string } | { error: string } {
  const t = norm(text.replace(/^\s*(?:emergency[_ ]directive\s*:?\s*)/i, ""));
  const place = () => { let best: { slug: string; name: string; n: number } | null = null; for (const pl of placesFor(p.episode)) for (const a of pl.aliases.map(norm)) if (a && t.includes(a) && (!best || a.length > best.n)) best = { slug: pl.slug, name: pl.name, n: a.length }; return best; };
  const doc = () => { let best: { slug: string; title: string; n: number } | null = null; for (const d of documentsFor(p.episode)) for (const a of d.aliases.map(norm)) if (a && t.includes(a) && (!best || a.length > best.n)) best = { slug: d.slug, title: d.title, n: a.length }; return best; };
  if (/\b(curfew|nobody leaves|no one leaves|no vehicles? (?:leaves?|out|through)|(?:nobody|no one|no vehicles?) (?:is |are )?to leave|confine(?:d)? to (?:the )?campus|stay on campus|no travel|gates? \d* ?(?:is |are )?(?:closed|shut)|lockdown)\b/.test(t)) return { kind: "curfew", target: null, target_name: null, label: "a curfew: nobody leaves the campus" };
  if (/\b(seal|sealed|close|closed|off limits|no entry|shut)\b/.test(t)) { const pl = place(); if (!pl) return { error: "name the place to be sealed" }; return { kind: "seal", target: pl.slug, target_name: pl.name, label: `${pl.name} sealed` }; }
  if (/\b(suspend|suspended|revoke|revoked|bar|barred|strip)\b/.test(t)) { const who = p.findPerson(text, p.people.filter((x) => x.player)); if (!who) return { error: "name the employee whose access is suspended (a colleague, by surname)" }; return { kind: "suspend", target: who.id, target_name: who.name, label: `${who.name}'s access suspended` }; }
  if (/\b(declassif|open(?:ed)? to all|release|unseal|unsealed|make available|all clearances)\b/.test(t)) { const d = doc(); if (!d) return { error: "name the file to be opened" }; return { kind: "open", target: d.slug, target_name: d.title, label: `"${d.title}" open to every clearance` }; }
  return { error: "a directive can seal a place, suspend a colleague's access, declare a curfew, or open a file to all clearances; say which" };
}

export async function nextDirectiveNumber(db: Db, campaignId: string): Promise<string> {
  const { data } = await db.from("facts").select("key").eq("campaign_id", campaignId).like("key", "directive.D-77-%");
  const max = Math.max(0, ...(data ?? []).map((f) => Number(String(f.key).split("-").pop()) || 0));
  return `D-77-${String(max + 1).padStart(3, "0")}`;
}

/* Issue: recorded, enforced from now, sent to every desk. */
export async function issueDirective(db: Db, p: { campaignId: string; roundId: string; roundNo: number; by: { id: string; name: string; title: string | null }; as: string; kind: Directive["kind"]; target: string | null; target_name: string | null; label: string; text: string; dry?: boolean }): Promise<Directive> {
  const number = p.dry ? "D-77-000" : await nextDirectiveNumber(db, p.campaignId);
  const d: Directive = { number, kind: p.kind, target: p.target, target_name: p.target_name, by: p.by.id, by_name: p.by.name, round: p.roundNo, until: p.roundNo + DIRECTIVE_ROUNDS, text: p.text.slice(0, 400) };
  if (p.dry) return d;
  await db.from("facts").upsert({ campaign_id: p.campaignId, key: `directive.${number}`, value: d, established_round: p.roundNo, secret: false }, { onConflict: "campaign_id,key" });
  if (p.kind === "suspend" && p.target) await db.from("facts").upsert({ campaign_id: p.campaignId, key: `purge.${p.target}.restricted_until`, value: { round: d.until, directive: number }, established_round: p.roundNo, secret: true }, { onConflict: "campaign_id,key" });
  const { data: pcs } = await db.from("characters").select("id, players(email)").eq("campaign_id", p.campaignId).eq("status", "active").not("player_id", "is", null);
  const ids = (pcs ?? []).map((c) => c.id as string);
  const emails = (pcs ?? []).map((c) => ((Array.isArray(c.players) ? c.players[0] : c.players) as { email: string } | null)?.email).filter((e): e is string => Boolean(e));
  const body = `TO ALL STAFF, STATION R\n\nBy emergency authority as ${p.as}, effective at once and for ${DIRECTIVE_ROUNDS} days unless extended by the Safety Committee:\n\n${p.label.charAt(0).toUpperCase()}${p.label.slice(1)}.\n\nIn the officer's words: "${d.text}"\n\nThis directive is numbered ${number} and expires at the lock of Round ${d.until}. A motion before the Safety Committee naming ${number} may extend it.\n\n— ${p.by.name}${p.by.title ? `, ${p.by.title}` : ""}`;
  const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, round_id: p.roundId, direction: "outbound", message_id: newMessageId(), from_character: p.by.id, to_characters: ids, to_addresses: emails, subject: `EMERGENCY DIRECTIVE ${number}`, body_text: body, raw: { letter_kind: "memo", classification: "Directive", directive: number } }).select("id").single();
  if (row && emails.length) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
  await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "strategic", kind: "directive.issued", payload: { ...d, label: p.label, date: gameDate(p.roundNo) }, idempotency_key: `directive:${p.campaignId}:${number}`, visible_to: ids });
  // Everyone knows; staff remember who did it.
  const { data: npcs } = await db.from("characters").select("id").eq("campaign_id", p.campaignId).eq("status", "active").is("player_id", null).not("division_id", "is", null);
  await db.from("knowledge").insert([...ids, ...(npcs ?? []).map((n) => n.id as string)].map((cid) => ({ character_id: cid, fact_key: `directive.${number}`, value: { kind: "info_share", text: `${p.by.name} issued emergency directive ${number}: ${p.label}`, from: p.by.id, from_name: p.by.name, round: p.roundNo }, confidence: 1, source_kind: "dispatch", source_ref: row?.id ?? null, learned_round: p.roundNo })));
  return d;
}

/* At the governance close: a passed Safety Committee motion naming a directive extends it. */
export async function extendByMotion(db: Db, campaignId: string, motion: { number: string | null; title: string; passed: boolean; orgSlug: string | null }, roundNo: number): Promise<string | null> {
  if (!motion.passed || motion.orgSlug !== "safety-committee") return null;
  const m = motion.title.match(/\bD-77-\d{3}\b/i); if (!m) return null;
  const key = `directive.${m[0].toUpperCase()}`;
  const { data } = await db.from("facts").select("value").eq("campaign_id", campaignId).eq("key", key).maybeSingle();
  if (!data) return null;
  const d = data.value as Directive;
  const until = Math.max(d.until, roundNo) + EXTENSION_ROUNDS;
  await db.from("facts").update({ value: { ...d, until, extended_by: motion.number } }).eq("campaign_id", campaignId).eq("key", key);
  if (d.kind === "suspend" && d.target) await db.from("facts").upsert({ campaign_id: campaignId, key: `purge.${d.target}.restricted_until`, value: { round: until, directive: d.number }, established_round: roundNo, secret: true }, { onConflict: "campaign_id,key" });
  return d.number;
}
