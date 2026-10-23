/* Verb rules: how an order becomes an outcome. Deterministic; the model never
   decides. Each verb reads the world (documents, places, people, the round)
   and the character (clearance, department), and writes what follows: a copy
   in the Case File, knowledge rows, a note in Security's memory, a refund.
   The outcome summary is for the morning narrator and is player-safe. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { documentsFor, placesFor, pressureFor, episodeOf, deptName, labWorkFor, paperworkFor, PAPERWORK_VERBS, nearestDocuments, matchDocument } from "./world";
import type { Access, DocumentDef, PlaceDef } from "./world/types";
import { gameDate } from "@/lib/email/letter";
import { newMessageId, gameMailbox } from "@/lib/email/resend";
import { applyLobby, getStance } from "./governance";
import { committeeByName } from "@/lib/game/filing";
import { acceptInvitation, accessRestricted, outstandingInvitations } from "./societies";
import type { Presence } from "./contacts";
import { researchSlug, researchSubject } from "./research";
import { findEquipment, holdingsFor, holds, logLines, requisition, type Holding } from "./equipment";
import { findLoot, guardOf, guardsTonight, layProtection, takeLoot, watchfulIn, type Scope } from "./custody";
import { dismiss, recruit } from "./informants";
import { writeLog } from "./equipment";
import { findTown } from "./world/towns";
import { parseMotion, sponsorMotion } from "./motions";
import { endGrace, underGrace } from "./grace";
import { curfew, holdsEmergencyAuthority, issueDirective, opened, parseDirective, sealed, type Directive } from "./directives";

export type Outcome = {
  kind: "document" | "refused" | "referred" | "sighting" | "visit" | "found" | "nothing" | "conversation" | "lobbied" | "mitigated" | "examined" | "leaked" | "research" | "requisitioned" | "obtained" | "protected" | "recruited" | "analyzed" | "travelled" | "sponsored" | "directed" | "attended" | "met" | "ruling";
  summary: string;            // one or two sentences for the narrator; what the player now knows
  learned: string[];          // knowledge keys granted
  refund: number;             // Action Units returned (a ruling that nothing could be done)
  item?: string;              // case item slug delivered
  noticed?: boolean;          // Corporate Security learned of it
  presence?: Presence[];      // what the character touched tonight, for contact reports and trip-wires (contacts.ts)
  verb: string; target: string | null;
};

export type Ctx = {
  campaignId: string; roundId: string; roundNo: number; episodeRound: number; episode?: number;
  character: { id: string; slug: string; name: string; clearance: number; division: string | null; title: string | null; societies?: string[]; authorizedDivisions?: string[]; holdings?: Holding[]; specialization?: string | null; location?: { slug: string; name: string; round: number } | null };   // location: away from campus since a TRAVEL (null = Station R)   // authorizedDivisions: files opened by a colleague's AUTHORIZE; holdings: equipment in hand (equipment.ts)
  dry?: boolean;
  directives?: Directive[];   // emergency directives in force tonight (directives.ts)
  closed?: { slug: string; text: string }[];   // places the story has closed tonight (PlaceDef.closedBy; operations.ts)
};

export const VERB_COST: Record<string, number> = { report: 3, request_files: 6, interview: 4, surveil: 10, visit: 5, examine: 3, search: 8, lobby: 5, attend: 4, leak: 6, research: 10, requisition: 4, obtain: 8, protect: 4, recruit: 10, dismiss: 1, analyze: 6, travel: 5, sponsor_motion: 5, emergency_directive: 0, meet: 3, submit_manifest: 4, approve_overtime: 4, reconcile_maps: 6, approve_corridors: 6, clear_invoices: 6, issue_statement: 6 };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const EQUIPMENT_NAMES = "a 35mm camera, a cassette recorder, a motor pool truck for the night, a temporary badge (Security or Personnel only)";
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

function findDocument(text: string, episode = 1): DocumentDef | null { return matchDocument(text, episode); }
function findPlace(text: string, episode = 1): PlaceDef | null {
  const t = norm(text); let best: { p: PlaceDef; n: number } | null = null;
  for (const p of placesFor(episode)) for (const a of p.aliases.map(norm)) if (t.includes(a)) { const n = a.length; if (!best || n > best.n) best = { p, n }; }
  return best?.p ?? null;
}
type Person = { id: string; slug: string; name: string; division: string | null; player: boolean };
function findPerson(text: string, people: Person[]): Person | null {
  const t = norm(text);
  for (const p of people) { const sur = norm(p.name).split(" ").pop()!; if (sur.length > 2 && new RegExp(`\\b${sur}\\b`).test(t)) return p; }
  for (const p of people) { const first = norm(p.name).split(" ")[0]; if (first.length > 3 && new RegExp(`\\b${first}\\b`).test(t)) return p; }
  return null;
}

function allowed(a: Access | undefined, c: Ctx["character"]): boolean {
  if (!a) return true;
  if (a.society && c.societies?.includes(a.society)) return true;
  if (a.department && c.division && a.department.includes(c.division)) return true;
  if (a.department && c.authorizedDivisions?.some((d) => a.department!.includes(d))) return true;   // a colleague's standing AUTHORIZE
  if (a.clearance !== undefined && c.clearance >= a.clearance) return true;
  return a.clearance === undefined && !a.department && !a.via;
}

/* What the clerk makes of free text: a verb and the words that name its target. */
export function inferVerb(text: string): { verb: string; target: string } {
  const t = norm(text);
  const rules: [RegExp, string][] = [
    [/\b(manifest|submit a manifest|vehicle manifest|sign-out|sign out log)\b/, "submit_manifest"], [/\b(overtime|coverage)\b/, "approve_overtime"], [/\b(reconcile|coordinates)\b/, "reconcile_maps"],
    [/\b(statement to the county|issue a statement|press statement|statement to the press|official statement)\b/, "issue_statement"], [/\b(clear the invoices|clear invoices|pay the invoices|settle the invoices)\b/, "clear_invoices"], [/\b(approve the corridors?|flight corridors?)\b/, "approve_corridors"],
    [/\b(report .* to security|report .* to corporate security|turn in|inform security|tell security about)\b/, "report"],
    [/\b(leak|to the (?:paper|press|newspaper|reporter|minot daily news)|tip off (?:the paper|haugen|the press))\b/, "leak"],
    [/\b(research(?! committee)|look up|read up|background on|find out (?:more )?about|the library|county records|back issues|newspaper morgue)\b/, "research"],
    [/\b(requisition|sign out (?!log)|sign for a|check out a|borrow|a camera|the camera|tape recorder|a recorder|a truck|a pickup|the truck|a vehicle|a badge|temporary badge|visitor badge)\b/, "requisition"],
    [/\b(protect|stand guard|guard (?:my|the|over|it)|post a guard|lock up|lock away|hide|keep .* safe|secure my|cover my tracks|keep my head down)\b/, "protect"],   // "the night guard" is a person to ask, not a thing to guard
    [/\b(recruit|as (?:an|my) informant|keep me informed|on retainer|pay .* to (?:report|tell me|keep)|be my eyes)\b/, "recruit"],
    [/\b(dismiss|release my informant|let .* go|stop paying|drop my informant|end the arrangement)\b/, "dismiss"],
    [/\b(obtain|steal|lift|pinch|swipe|get hold of|take .* (?:from|off|out of)|make off with|help myself to)\b/, "obtain"],
    [/\b(emergency[ _]directive|by emergency authority|emergency order)\b/, "emergency_directive"],
    [/\b(sponsor(?:_| a |\s)motion|put a motion|move that|table a motion|bring a motion|propose a motion|a motion before|motion to)\b/, "sponsor_motion"],
    [/\b(lobby|persuade|convince|vote with|support the motion|oppose the motion)\b/, "lobby"],
    [/\b(watch|stake out|stakeout|follow|surveil|keep an eye|after dark|at night|overnight)\b/, "surveil"],
    [/\b(search|go through|rifle|look through|open the|break into|the drawer|the locker|investigate|look around|poke around)\b/, "search"],
    [/\b(analy[sz]e|analysis|run (?:it|the sample|a sample|tests) |lab test|test the sample|under the microscope|assay|correlate|cross[ -]?reference|put .* through the lab|have the lab)\b/, "analyze"],
    [/\b(examine|study|read closely|look closely|compare|inspect|check the)\b/, "examine"],
    [/\b(ask (?:the )?(?:records|archives|procurement|personnel|facilities|finance|stores) for|ask records)\b/, "request_files"],
    [/\b(meet (?:with |up with )?|sit down with|have (?:coffee|lunch|a drink|a word) with|catch up with|in person with|corner)\b/, "meet"],
    [/\b(ask|talk|speak|interview|question|lunch|coffee with|meet with|see him|see her|chat|introduce|approach|walk up to)\b/, "interview"],
    [/\b(request|pull|get the|obtain|copy of|file|files|records|ledger|log|logs|report|invoices|authorizations|memo)\b/, "request_files"],
    [/\b(travel|drive (?:out |up |down |over )?to|go (?:out |up |down |over )?to (?:tagus|minot|split rock|stanley|town)|head (?:out |up |down )?(?:to|for)|spend the night in|stay (?:the night )?in|overnight in|return to (?:station r|campus|the campus)|go back to (?:station r|campus|the campus)|come (?:back )?home)\b/, "travel"],
    [/\b(go to|visit|drive|walk to|look at|see the|check out|go into|go inside|enter|head to|go out to|go back to)\b/, "visit"],
    [/\b(attend|sit in|be present)\b/, "attend"],
  ];
  for (const [re, verb] of rules) if (re.test(t)) return { verb, target: text };
  return { verb: "unknown", target: text };
}

/* Where an order ends up: a town by name, or the town an off-campus place sits in, or the place itself. */
export function destinationOf(text: string, episode: number): { slug: string; name: string } | null {
  const town = findTown(text);
  if (town) return { slug: town.slug, name: town.name };
  const p = findPlace(text, episode);
  if (p?.offCampus) { const t = (p.town ? findTown(p.town) : null) ?? findTown(`${p.name} ${p.aliases.join(" ")}`); return t ? { slug: t.slug, name: t.name } : { slug: p.slug, name: p.name }; }
  return null;
}
async function setLocation(db: SupabaseClient, ctx: Ctx, loc: { slug: string; name: string } | null) {
  ctx.character.location = loc ? { ...loc, round: ctx.roundNo } : null;
  if (ctx.dry) return;
  if (loc) await db.from("facts").upsert({ campaign_id: ctx.campaignId, key: `location.${ctx.character.id}`, value: { ...loc, round: ctx.roundNo }, established_round: ctx.roundNo, secret: true }, { onConflict: "campaign_id,key" });
  else await db.from("facts").delete().eq("campaign_id", ctx.campaignId).eq("key", `location.${ctx.character.id}`);
}
/* An order done on campus brings a traveller home. */
async function cameHome(db: SupabaseClient, ctx: Ctx) { if (ctx.character.location) await setLocation(db, ctx, null); }
/* ATTEND a committee session (rulebook §6.3): the attendee hears where each staff member stands on every
   motion open before the body, and is seen there by anyone else who attended. Leans are read, never moved. */
async function attendSession(db: SupabaseClient, ctx: Ctx, base: { learned: string[]; refund: number; verb: string; target: string | null; presence: Presence[] | undefined }, orgName: string): Promise<Outcome> {
  const { data: org } = await db.from("organizations").select("id, name, slug").eq("campaign_id", ctx.campaignId).eq("name", orgName).maybeSingle();
  if (!org) return { ...base, kind: "ruling", summary: `No body called ${orgName} sits this season. Units returned.`, refund: VERB_COST.attend };
  await cameHome(db, ctx);
  const presence: Presence[] = [{ kind: "place", slug: `${org.slug}-session`, name: `the ${org.name} session`, verb: "attend" }];
  const { data: motions } = await db.from("motions").select("id, number, title").eq("organization_id", org.id).eq("status", "open").neq("kind", "election").lte("opens_round", ctx.roundNo).order("closes_round");
  if (!motions?.length) return { ...base, kind: "attended", target: org.slug, summary: `${ctx.character.name} sat at the back of the ${org.name} session. Minutes, a budget line, a long discussion of the parking allocation; nothing before the body that a new hire would care about.`, presence };
  const { data: seats } = await db.from("memberships").select("character_id, characters(slug, name, player_id)").eq("organization_id", org.id);
  const lines: string[] = []; const learned: string[] = [];
  for (const m of motions) {
    const fors: string[] = [], against: string[] = [], quiet: string[] = [];
    for (const s of seats ?? []) {
      const c = (Array.isArray(s.characters) ? s.characters[0] : s.characters) as { slug: string; name: string; player_id: string | null } | null;
      if (!c || c.player_id) continue;
      const lean = (await getStance(db, ctx.campaignId, m.number as string, c.slug)).lean;
      (lean > 0.15 ? fors : lean < -0.15 ? against : quiet).push(c.name);
      learned.push(`lean.${m.number}.${c.slug}.${lean > 0.15 ? "for" : lean < -0.15 ? "against" : "undecided"}`);
    }
    lines.push(`On ${m.number}, "${m.title}": ${fors.length ? `${fors.join(", ")} spoke for it` : "nobody spoke for it"}; ${against.length ? `${against.join(", ")} against` : "nobody against"}${quiet.length ? `; ${quiet.join(", ")} said nothing that committed them` : ""}.`);
  }
  if (!ctx.dry) { learned.push(`attended.${org.slug}.r${ctx.roundNo}`); await learn(db, ctx, learned, "witnessed", null); }
  return { ...base, kind: "attended", target: org.slug, summary: `${ctx.character.name} sat at the back of the ${org.name} session. ${lines.join(" ")} Members' own votes are cast by ballot and were not shown.`, learned, presence };
}

/* MEET <colleague> (rulebook §6.3): in person, off the record. The colleague hears it the next morning in the
   meeter's words, in a section of their dispatch; nothing is on paper, so nothing can be filed, forwarded,
   intercepted or quoted. Both must be in the same place: on campus, or in the same town. Seen together only
   if the meeting is at a named place. */
async function meetColleague(db: SupabaseClient, ctx: Ctx, base: { learned: string[]; refund: number; verb: string; target: string | null; presence: Presence[] | undefined }, mate: { id: string; slug: string; name: string }, text: string, episode: number): Promise<Outcome> {
  const ruledMeet = (summary: string): Outcome => ({ ...base, kind: "ruling", summary, refund: VERB_COST.meet });
  const [{ data: leave }, { data: loc }] = ctx.dry ? [{ data: null }, { data: null }] : await Promise.all([
    db.from("facts").select("key").eq("campaign_id", ctx.campaignId).eq("key", `leave.${mate.id}`).maybeSingle(),
    db.from("facts").select("value").eq("campaign_id", ctx.campaignId).eq("key", `location.${mate.id}`).maybeSingle(),
  ]);
  if (leave) return ruledMeet(`${mate.name} is on leave and was not at Station R. Units returned.`);
  const theirs = (loc?.value as { slug: string; name: string } | null) ?? null;
  const mine = ctx.character.location ?? null;
  if ((theirs?.slug ?? null) !== (mine?.slug ?? null)) return ruledMeet(`${mate.name} was ${theirs ? `in ${theirs.name}` : "at Station R"} and ${ctx.character.name} ${mine ? `in ${mine.name}` : "at Station R"}; they could not sit down together. Units returned.`);
  // What was said: quoted words, or what follows "about" or a colon; else the order itself.
  const quoted = text.match(/["\u201c](.{3,600}?)["\u201d]/)?.[1];
  const after = text.match(/\b(?:about|re|regarding|to say|and say|and tell (?:them|him|her))\b\s*(.{3,600})$/i)?.[1] ?? text.match(/:\s*(.{3,600})$/)?.[1];
  // The place is named before what is said ("MEET Osei at the barn about …"); a place mentioned in the words is not where they sat.
  const cut = Math.min(...[quoted, after].filter((x): x is string => Boolean(x)).map((x) => text.indexOf(x)).filter((i) => i >= 0), text.length);
  const place = findPlace(text.slice(0, cut), episode);
  // A bare MEET (a name, perhaps a place) has nothing to hear in the morning: the clerk asks for the subject.
  if (!quoted && !after) {
    const rest = norm(text).replace(norm(mate.name), " ").replace(norm(mate.name.split(" ").slice(-1)[0]), " ").replace(place ? norm(place.name) : "\u0000", " ").replace(/\b(?:with|at|in|the|a|an|on|over|for|up|sit|down|meet|coffee|lunch|campus|tonight|today)\b/g, " ").trim();
    if (rest.split(/\s+/).filter((w) => w.length > 1).length < 3) return ruledMeet(`${ctx.character.name} named ${mate.name} but not what to say, and there is nothing for ${mate.name} to hear in the morning. Units returned. Write: MEET ${mate.name} about <what you want to say>.`);
  }
  const words = (quoted ?? after ?? text).trim().replace(/\s+/g, " ").slice(0, 600);
  const where = place ? ` at ${place.name}` : "";
  if (!ctx.dry) {
    await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "meet.held", payload: { from: ctx.character.id, from_name: ctx.character.name, to: mate.id, to_name: mate.name, words, place: place?.name ?? null, round: ctx.roundNo }, idempotency_key: `meet:${ctx.roundId}:${ctx.character.id}:${mate.id}`, visible_to: [ctx.character.id, mate.id] });
    await db.from("knowledge").insert([
      { character_id: mate.id, fact_key: `told:${ctx.character.slug}:meet:${ctx.roundNo}`, value: { kind: "in_person", text: words, from: ctx.character.id, from_name: ctx.character.name, round: ctx.roundNo, off_record: true }, confidence: 1, source_kind: "told", source_ref: null, learned_round: ctx.roundNo },
      { character_id: ctx.character.id, fact_key: `met.${mate.slug}.r${ctx.roundNo}`, value: { true: true, round: ctx.roundNo, with: mate.id }, confidence: 1, source_kind: "witnessed", source_ref: null, learned_round: ctx.roundNo },
    ]);
  }
  return { ...base, kind: "met", target: mate.slug, summary: `${ctx.character.name} sat down with ${mate.name}${where}. What was said is off the record: nothing on paper to file, forward, intercept or quote. ${mate.name} hears it in the morning, in ${ctx.character.name}'s own words.`, learned: [`met.${mate.slug}.r${ctx.roundNo}`], presence: place ? [{ kind: "place", slug: place.slug, name: place.name, verb: "visit" }] : undefined };
}

/* The thing in the character's Case File that the words name: by the index's vocabulary first (a document's
   aliases), then by the held item's own title or short name. A copy (sent on, taken) counts. Returns the
   held row and the index document it is a copy of, if any; items with no index entry (the orientation pack,
   briefs, photographs, transcripts) come back with doc null. */
async function heldItem(db: SupabaseClient, ctx: Ctx, text: string, episode: number): Promise<{ slug: string; title: string; doc: DocumentDef | null } | null> {
  const d = findDocument(text, episode);
  if (ctx.dry) return d ? { slug: d.slug, title: d.title, doc: d } : null;
  const { data: items } = await db.from("case_items").select("slug, title").eq("character_id", ctx.character.id).eq("status", "held").neq("drawer", "correspondence");
  const rows = (items ?? []) as { slug: string; title: string }[];
  const base = (s: string) => s.replace(/-from-.*$|-taken-r\d+$/, "");
  const t = norm(text);
  let hit = d ? rows.find((i) => base(i.slug) === d.slug) : undefined;
  const bare = t.replace(/^(?:the|a|an|my)\s+/, "");
  if (!hit) hit = rows.find((i) => t.includes(norm(i.title)) || norm(i.title).includes(bare) || t.includes(norm(i.slug)) || (bare.length >= 8 && norm(i.slug).includes(bare)));
  if (!hit) hit = rows.find((i) => { const words = norm(i.title).split(" ").filter((w) => w.length > 3); return words.length > 0 && words.filter((w) => t.includes(w)).length >= Math.min(2, words.length); });
  if (!hit) return null;
  const doc = documentsFor(episode).find((x) => x.slug === base(hit!.slug)) ?? documentsFor(episode).find((x) => norm(x.title) === norm(hit!.title)) ?? null;
  return { slug: hit.slug, title: hit.title, doc };
}
async function learn(db: SupabaseClient, ctx: Ctx, keys: string[], source: string, ref: string | null) {
  if (ctx.dry || !keys.length) return;
  await db.from("knowledge").insert(keys.map((k) => ({ character_id: ctx.character.id, fact_key: k, value: { true: true, round: ctx.roundNo }, confidence: 0.8, source_kind: source, source_ref: ref, learned_round: ctx.roundNo })));
}
/* Corporate Security remembers who asked for what. */
async function notify(db: SupabaseClient, ctx: Ctx, text: string) {
  if (ctx.dry) return;
  const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", ctx.campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
  for (const s of sec ?? []) await db.from("knowledge").insert({ character_id: s.id, fact_key: `noticed:${ctx.character.slug}:${hash(text).toString(36)}`, value: { kind: "noticed", text, from: ctx.character.id, from_name: ctx.character.name, round: ctx.roundNo }, confidence: 1, source_kind: "told", source_ref: null, learned_round: ctx.roundNo });
}
async function deliver(db: SupabaseClient, ctx: Ctx, d: DocumentDef, how: string): Promise<string> {
  const slug = `${d.slug}`;
  // A log the engine keeps: the lines equipment left since the printed page (equipment.ts).
  const extra = d.logKey && !ctx.dry ? await logLines(db, ctx.campaignId, d.logKey) : [];
  const body = extra.length ? `${d.body}\n\n*Entries added since the page was typed:*\n${extra.map((l) => `- ${l}`).join("\n")}` : d.body;
  if (!ctx.dry) await db.from("case_items").upsert({ campaign_id: ctx.campaignId, character_id: ctx.character.id, slug, kind: d.kind === "map" ? "map" : d.kind === "letter" ? "letter" : d.kind === "memo" ? "memo" : d.kind === "report" ? "report" : d.kind === "object" ? "object" : "document", drawer: d.kind === "map" ? "maps" : "documents", title: d.title, from_label: d.from ?? null, written_label: d.written ?? null, body, round_received: ctx.roundNo, how_obtained: how, copy_note: "A copy; the original stays where it was.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug" });
  await learn(db, ctx, d.grants, "document", null);
  return slug;
}

/* A free-form order priced in steps (pricing.ts) is carried out step by step:
   each step is tried on its own clause first, then on the whole order (so
   "introduce myself" happens at the Building 7 named earlier). Each step's
   units come back if it could not be done; the trip comes back if nothing
   could be. */
export async function resolveOrder(db: SupabaseClient, ctx: Ctx, order: { id: string; verb: string; args: Record<string, unknown> }): Promise<Outcome> {
  const steps = (order.args.steps as { verb: string; clause: string }[] | string[] | undefined) ?? [];
  if (order.verb !== "freeform" || !steps.length) return resolveOne(db, ctx, order);
  const whole = String(order.args.text ?? "");
  const outs: Outcome[] = [];
  for (const raw of steps) {
    const st = typeof raw === "string" ? { verb: raw, clause: whole } : raw;
    const cost = VERB_COST[st.verb] ?? 5;
    let out = await resolveOne(db, ctx, { ...order, verb: st.verb, args: { ...order.args, text: st.clause, cost } });
    if (out.kind === "ruling" && out.refund > 0 && st.clause !== whole) out = await resolveOne(db, ctx, { ...order, verb: st.verb, args: { ...order.args, text: whole, cost } });
    outs.push(out);
    // Stores first, the road after: a truck signed out in this order carries the rest of it.
    if (out.kind === "requisitioned" && !ctx.dry) ctx.character.holdings = await holdingsFor(db, ctx.character.id);
  }
  const travel = Number(order.args.travel ?? 0);
  const allBack = outs.every((o) => o.kind === "ruling" && o.refund > 0);
  const truck = travel > 0 && !allBack && holds(ctx.character.holdings ?? [], "vehicle");   // a motor pool truck in hand: the trip costs nothing
  const there = travel > 0 && !allBack && !truck && Boolean(ctx.character.location) && destinationOf(whole, ctx.episode ?? episodeOf(ctx.roundNo))?.slug === ctx.character.location?.slug;   // already there since a TRAVEL
  const lead = outs.find((o) => o.kind !== "ruling") ?? outs[0];
  return {
    kind: lead.kind, verb: outs.map((o) => o.verb).join("+"), target: lead.target,
    summary: dedupeSentences(outs.map((o) => o.summary).join(" ") + (truck ? " The motor pool truck took the trip; nothing was charged for the road." : there ? ` Already in ${ctx.character.location!.name}; nothing was charged for the road.` : "")),
    learned: outs.flatMap((o) => o.learned), item: outs.find((o) => o.item)?.item,
    noticed: outs.some((o) => o.noticed), refund: outs.reduce((n, o) => n + o.refund, 0) + (allBack || truck || there ? travel : 0),
    presence: outs.flatMap((o) => o.presence ?? []),
  };
}

/* Steps at the same place repeat its description; keep each sentence once. */
function dedupeSentences(text: string) {
  const seen = new Set<string>();
  // Split after a full stop, but not after "St.", "Dr.", "Col." and the like.
  return text.split(/(?<=(?<!\b(?:St|Mr|Mrs|Ms|Dr|Col|Ret|Sgt|Lt|Capt|Gen|Rev|No))[.!?]["”']?)\s+/).filter((x) => { const k = x.trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; }).map((x) => x.trim()).join(" ");
}

async function resolveOne(db: SupabaseClient, ctx: Ctx, order: { id: string; verb: string; args: Record<string, unknown> }): Promise<Outcome> {
  const text = String(order.args.text ?? "");
  let verb = order.verb;
  if (verb === "freeform" || VERB_COST[verb] === undefined) { const inf = inferVerb(text); verb = inf.verb; }
  const base = { learned: [] as string[], refund: 0, verb, target: null as string | null, presence: undefined as Presence[] | undefined };
  const { data: roster } = await db.from("characters").select("id, slug, name, player_id, divisions(slug)").eq("campaign_id", ctx.campaignId).eq("status", "active");
  const people: Person[] = (roster ?? []).map((r) => ({ id: r.id as string, slug: r.slug as string, name: r.name as string, division: ((Array.isArray(r.divisions) ? r.divisions[0] : r.divisions) as { slug: string } | null)?.slug ?? null, player: Boolean(r.player_id) }));
  const paid = Number(order.args.cost ?? 5);
  const episode = ctx.episode ?? episodeOf(ctx.roundNo);
  const ruled = (summary: string): Outcome => ({ ...base, kind: "ruling", summary, refund: paid });

  if ((verb === "request_files" || verb === "search") && !ctx.dry && (await accessRestricted(db, ctx.campaignId, ctx.character.id, ctx.roundNo))) {
    return { ...base, kind: "refused", summary: `${ctx.character.name}'s access is suspended pending interview with Corporate Security; Records and restricted areas are closed to them until then.` };
  }
  if (verb === "report") {
    const who = findPerson(text, people.filter((p) => p.player));
    if (!who) return ruled(`The clerk could not tell whom "${text}" names. Units returned. Use a colleague's surname.`);
    base.target = who.slug;
    // The induction grace: a new hire cannot be reported, and reporting ends the reporter's own.
    if (!ctx.dry && (await underGrace(db, ctx.campaignId, who.id, ctx.roundNo))) return ruled(`${who.name} is still in induction; Security does not take reports on new hires in their first days. Units returned.`);
    if (!ctx.dry) await endGrace(db, ctx.campaignId, ctx.character.id, ctx.roundNo, `reported ${who.name}`);
    if (!ctx.dry) {
      const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", ctx.campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
      for (const s of sec ?? []) await db.from("knowledge").insert({ character_id: s.id, fact_key: `reported:${who.slug}:${hash(ctx.character.id).toString(36)}`, value: { kind: "reported", text: `${ctx.character.name} reported ${who.name} to Security`, from: ctx.character.id, from_name: ctx.character.name, about: who.id, round: ctx.roundNo }, confidence: 1, source_kind: "told", learned_round: ctx.roundNo });
      await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "security.reported", payload: { by: ctx.character.id, about: who.id, round: ctx.roundNo }, idempotency_key: `reported:${ctx.character.id}:${who.id}:${ctx.roundNo}` });
    }
    return { ...base, kind: "conversation", summary: `${ctx.character.name} reported ${who.name} to Corporate Security. The clerk took the name and asked nothing else. Security will not say what it does with names.`, noticed: false, presence: [{ kind: "person", slug: who.slug, name: who.name, verb: "report", covert: true }] };
  }
  if (verb === "attend" || verb === "visit" || verb === "surveil") {
    // Going where an invitation says to go accepts it, whatever the order called it.
    const p = findPlace(text, episode);
    if (p && !ctx.dry) {
      const open = await outstandingInvitations(db, ctx.campaignId, ctx.character.id);
      const inv = open.find((s) => s.meeting.place === p.slug);
      if (inv) { base.target = inv.slug; return { ...base, kind: "conversation", summary: await acceptInvitation(db, { campaignId: ctx.campaignId, roundId: ctx.roundId, roundNo: ctx.roundNo, characterId: ctx.character.id, characterName: ctx.character.name, characterSlug: ctx.character.slug, society: inv }), presence: [{ kind: "place", slug: p.slug, name: p.name, verb: "attend" }] }; }
    }
  }
  if (verb === "request_files") {
    await cameHome(db, ctx);
    const d = findDocument(text, episode);
    if (!d) {
      // The miss is recorded (what players ask for and cannot get is how the index grows), and the clerk names the nearest files.
      if (!ctx.dry) { let h = 5381; for (const c of norm(text)) h = ((h << 5) + h + c.charCodeAt(0)) | 0; await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "records.unmatched", payload: { text, character: ctx.character.id, round: ctx.roundNo }, idempotency_key: `unmatched:${ctx.roundId}:${ctx.character.id}:${(h >>> 0).toString(36)}` }); }
      const near = nearestDocuments(text, episode);
      const keeper = (x: DocumentDef) => { const pl = placesFor(episode).find((p) => p.slug === x.holder); if (pl) return `kept at ${pl.name}`; const who = people.find((p) => p.slug === x.holder); if (who) return `kept by ${who.name}`; return `held by ${deptName(x.holder)}`; };
      const hint = near.length ? ` The nearest files on the index are ${near.map((x) => `"${x.title}" (${keeper(x)})`).join(" and ")}. Ask for one of those by name,` : " Name the file,";
      return ruled(`The clerk could not match "${text}" to any file on the company's index. Units returned.${hint} or the office or person who keeps it.`);
    }
    base.target = d.slug;
    const keptAt = placesFor(episode).find((pl) => pl.slug === d.holder);
    if (keptAt) return ruled(`Records does not hold "${d.title}"; it is kept at ${keptAt.name}. Units returned. Go there, or search there, and see.`);
    if (d.notice) await notify(db, ctx, `${ctx.character.name} requested "${d.title}" on the night of Round ${ctx.roundNo}.`);
    // Records logs every request, so anyone else asking for the same file this week hears the file is out.
    base.presence = [{ kind: "document", slug: d.slug, name: d.title, verb: "request_files" }];
    const op = opened(ctx.directives ?? [], d.slug);
    if (allowed(d.access, ctx.character) || op) { const item = await deliver(db, ctx, d, op ? `Requested through Records under directive ${op.number}.` : "Requested through Records."); return { ...base, kind: "document", summary: `Records delivered a copy of "${d.title}"${op ? ` under directive ${op.number}` : ""}. It is in the Case File.`, learned: d.grants, item, noticed: d.notice }; }
    if (d.access.via) {
      const who = people.find((p) => p.slug === d.access.via);
      // Records sends the request on to the keeper as a letter; they answer in their own words, and may hand the file over (handover.ts).
      if (who && !ctx.dry) {
        const { data: row } = await db.from("correspondence").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, direction: "inbound", message_id: newMessageId(), from_character: ctx.character.id, to_characters: [who.id], to_addresses: [gameMailbox().address], subject: `Referred by Records: ${d.title}`, body_text: `[Referred by Records, ${gameDate(ctx.roundNo)}.] ${ctx.character.name} asked Records for "${d.title}". Records does not hold it; you keep it. The request as written: "${text}".`, trusted: true, raw: { letter_kind: "referral", verb: "request_files", document: d.slug, source: "records" } }).select("id").single();
        if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: who.id }, run_after: new Date(Date.now() + 120_000).toISOString() });
      }
      return { ...base, kind: "referred", summary: `Records does not hold "${d.title}"; it is kept by ${who?.name ?? d.access.via} personally. Records has sent the request on to them, and what they make of it arrives in their own words.`, noticed: d.notice };
    }
    return { ...base, kind: "refused", summary: `Records refused "${d.title}": clearance ${d.access.clearance ?? 3} required${d.access.department ? ` (or a request from ${d.access.department.join(" or ")})` : ""}. The request was logged.`, noticed: d.notice };
  }
  if (verb === "surveil" || verb === "visit") {
    const p = findPlace(text, episode);
    if (!p) return ruled(`The clerk could not place "${text}". Units returned. Name a building, a gate, a road, or a property.`);
    base.target = p.slug;
    base.presence = [{ kind: "place", slug: p.slug, name: p.name, verb, covert: verb === "surveil" }];
    if (!p.offCampus) await cameHome(db, ctx);
    const sl = sealed(ctx.directives ?? [], p.slug);
    if (sl) { await notify(db, ctx, `${ctx.character.name} was at ${p.name} under directive ${sl.number}, Round ${ctx.roundNo}.`); return { ...base, kind: "refused", summary: `${p.name} is sealed under emergency directive ${sl.number}: a guard, a chain, a notice with the number on it. ${ctx.character.name} was seen there and turned away.`, noticed: true }; }
    const cl = (ctx.closed ?? []).find((c) => c.slug === p.slug);
    if (cl) { if (p.restricted) await notify(db, ctx, `${ctx.character.name} was at ${p.name}, which is closed, Round ${ctx.roundNo}.`); return { ...base, kind: "refused", summary: `${ctx.character.name} went to ${p.name}. ${cl.text}`, noticed: Boolean(p.restricted) }; }
    const pass = holds(ctx.character.holdings ?? [], "pass");
    if (verb === "visit") { if (p.restricted && !pass) await notify(db, ctx, `${ctx.character.name} was seen at ${p.name} in daylight, Round ${ctx.roundNo}.`); await learn(db, ctx, [`visited.${p.slug}`], "witnessed", null); return { ...base, kind: "visit", summary: `${ctx.character.name} went to ${p.name}${pass && p.restricted ? ", badge on the lapel, and nobody looked twice" : ""}. ${p.visit}`, learned: [`visited.${p.slug}`], noticed: p.restricted && !pass }; }
    const s = p.surveil.find((x) => (x.episode ?? 1) === episode && ctx.episodeRound >= x.rounds[0] && ctx.episodeRound <= x.rounds[1]) ?? p.surveil.find((x) => (x.episode ?? 1) < episode && ctx.episodeRound >= x.rounds[0] && ctx.episodeRound <= x.rounds[1]);
    const seen = hash(`${ctx.roundId}:${ctx.character.id}:${p.slug}`) % 4 !== 0;   // one night in four shows nothing
    if (!s || !seen) return { ...base, kind: "nothing", summary: `A night on ${p.name}: cold, quiet, nothing that would go in a report. ${p.restricted ? "A patrol truck slowed as it passed." : ""}`.trim(), noticed: p.restricted };
    if (s.restricted || p.restricted) await notify(db, ctx, `${ctx.character.name} spent the night of Round ${ctx.roundNo} watching ${p.name}.`);
    await learn(db, ctx, [s.grants], "witnessed", null);
    // A camera in hand: the sighting is a photograph in the Case File, evidence rather than a story.
    const camera = holds(ctx.character.holdings ?? [], "photograph");
    let photo: string | undefined;
    if (camera && !ctx.dry) {
      photo = `photo-${p.slug}-r${ctx.roundNo}`;
      await db.from("case_items").upsert({ campaign_id: ctx.campaignId, character_id: ctx.character.id, slug: photo, kind: "photograph", drawer: "photographs", title: `Photograph: ${p.name}, night of ${gameDate(ctx.roundNo)}`, from_label: ctx.character.name, written_label: gameDate(ctx.roundNo), body: `*35mm, pushed two stops, grain like sand.* ${s.text}.`, round_received: ctx.roundNo, how_obtained: `Taken by ${ctx.character.name} with a Procurement camera.`, copy_note: "The negative is yours.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug" });
    }
    return { ...base, kind: "sighting", summary: `A night watching ${p.name}: ${s.text}.${camera ? " The camera has it; the print is in the Case File." : ""}`, learned: [s.grants], noticed: s.restricted || p.restricted, item: photo };
  }
  if (verb === "search") {
    const p = findPlace(text, episode);
    if (!p) return ruled(`The clerk could not place "${text}". Units returned.`);
    base.target = p.slug;
    base.presence = [{ kind: "place", slug: p.slug, name: p.name, verb: "search" }];
    const sl = sealed(ctx.directives ?? [], p.slug);
    if (sl) { await notify(db, ctx, `${ctx.character.name} tried ${p.name} under directive ${sl.number}, Round ${ctx.roundNo}.`); return { ...base, kind: "refused", summary: `${p.name} is sealed under emergency directive ${sl.number}; ${ctx.character.name} could not get in and was seen trying.`, noticed: true }; }
    const cl = (ctx.closed ?? []).find((c) => c.slug === p.slug);
    if (cl) { if (p.restricted) await notify(db, ctx, `${ctx.character.name} tried ${p.name}, which is closed, on the night of Round ${ctx.roundNo}.`); return { ...base, kind: "refused", summary: `${ctx.character.name} tried ${p.name} after dark. ${cl.text}`, noticed: Boolean(p.restricted) }; }
    const pass = holds(ctx.character.holdings ?? [], "pass");
    if (!allowed(p.searchAccess, ctx.character) && !pass) { await notify(db, ctx, `${ctx.character.name} tried to get into ${p.name} on the night of Round ${ctx.roundNo}.`); return { ...base, kind: "refused", summary: `${p.name} is locked, sealed or watched; ${ctx.character.name} could not get in and was probably seen trying.`, noticed: true }; }
    const docs = (p.contains ?? []).map((s) => documentsFor(episode).find((d) => d.slug === s)).filter((d): d is DocumentDef => Boolean(d));
    if (p.restricted && !pass) await notify(db, ctx, `${ctx.character.name} was in ${p.name} after hours, Round ${ctx.roundNo}.`);
    if (!docs.length) return { ...base, kind: "nothing", summary: `A search of ${p.name} turned up nothing that could be carried away. ${p.visit}`, noticed: p.restricted };
    const d = docs[0]; const item = await deliver(db, ctx, d, `Found in ${p.name}.`);
    return { ...base, kind: "found", summary: `In ${p.name}, ${ctx.character.name} found "${d.title}" and took it. It is in the Case File.`, learned: d.grants, item, noticed: p.restricted, presence: [...(base.presence ?? []), { kind: "document", slug: d.slug, name: d.title, verb: "search", covert: true }] };
  }
  if (verb === "analyze") {
    // ANALYZE <item>: a department's laboratory reading of something held, from the item's own data; a report, evidence grade.
    const h = await heldItem(db, ctx, text, episode);
    if (!h) { const d0 = findDocument(text, episode); return ruled(d0 ? `${ctx.character.name} does not hold "${d0.title}". Units returned; a laboratory needs the thing itself, or a copy.` : `Nothing in the Case File matches "${text}". Units returned.`); }
    const d = h.doc;
    base.target = h.slug;
    if (!d?.analyses?.length) {
      const { data: rows } = ctx.dry ? { data: [] } : await db.from("case_items").select("slug, title").eq("character_id", ctx.character.id).eq("status", "held").neq("drawer", "correspondence");
      const ours = ((rows ?? []) as { slug: string; title: string }[]).filter((i) => labWorkFor(i.slug, i.title).includes(ctx.character.division ?? "")).map((i) => `"${i.title}"`);
      return ruled(`There is nothing a laboratory could add to "${h.title}"; the page is what it is. Units returned. EXAMINE it instead. ${ours.length ? `Of what you hold, ${deptName(ctx.character.division)} can analyze ${ours.slice(0, 3).join(", ")}.` : `Nothing you hold is work for the ${deptName(ctx.character.division)} laboratory yet; the Case File marks what is.`}`);
    }
    const mine = d.analyses.find((a) => a.department === ctx.character.division);
    if (!mine) return ruled(`"${d.title}" is work for ${d.analyses.map((a) => deptName(a.department)).join(" or ")}, not ${deptName(ctx.character.division)}. Units returned. SEND a copy to someone there.`);
    const slug = `analysis-${d.slug}`.slice(0, 44) + `-${(ctx.character.division ?? "x").slice(0, 10)}`;
    const { data: have } = ctx.dry ? { data: null } : await db.from("case_items").select("id").eq("character_id", ctx.character.id).eq("slug", slug).maybeSingle();
    if (have) return ruled(`${deptName(ctx.character.division)} has already reported on "${d.title}"; the report is in the Case File. Units returned.`);
    if (!ctx.dry) await db.from("case_items").insert({ campaign_id: ctx.campaignId, character_id: ctx.character.id, slug, kind: "report", drawer: "documents", title: `Laboratory report: ${d.title} (${deptName(ctx.character.division)})`, from_label: `${deptName(ctx.character.division)}, Royce Industries`, written_label: gameDate(ctx.roundNo), body: `**${deptName(ctx.character.division).toUpperCase()} — LABORATORY REPORT — ${gameDate(ctx.roundNo)}**\n\n*Subject: ${d.title}. Submitted by ${ctx.character.name}.*\n\n${mine.text}`, round_received: ctx.roundNo, how_obtained: `Analyzed in ${deptName(ctx.character.division)} at ${ctx.character.name}'s request.`, copy_note: "The laboratory's typed report; the bench copy stays with the department.", grade: "evidence", status: "held" });
    await learn(db, ctx, mine.grants, "inferred", null);
    return { ...base, kind: "analyzed", summary: `${deptName(ctx.character.division)} put "${d.title}" through the laboratory. The report is in the Case File: ${mine.text.split(". ")[0]}.`, learned: mine.grants, item: slug };
  }
  if (verb === "examine") {
    const h = await heldItem(db, ctx, text, episode);
    if (!h) { const d0 = findDocument(text, episode); return ruled(d0 ? `${ctx.character.name} does not hold "${d0.title}". Units returned; request it first, or EXAMINE something in the Case File.` : `Nothing in the Case File matches "${text}". Units returned.`); }
    const d = h.doc;
    base.target = h.slug;
    if (!d?.wrongDetail) return { ...base, kind: "examined", summary: `A close reading of "${h.title}" found nothing beyond what it says.` };
    await learn(db, ctx, [d.wrongDetail.grants], "inferred", null);
    return { ...base, kind: "examined", summary: `A close reading of "${d.title}": ${d.wrongDetail.text}.`, learned: [d.wrongDetail.grants] };
  }
  if (verb === "meet") {
    // MEET a colleague: in person, off the record. MEET staff or a local is a conversation as INTERVIEW has it.
    const mate = findPerson(text, people.filter((p) => p.player && p.id !== ctx.character.id));
    if (mate) return meetColleague(db, ctx, base, mate, text, episode);
    verb = "interview"; base.verb = "interview";
  }
  if (verb === "interview" || verb === "lobby") {
    let who = findPerson(text, people.filter((p) => !p.player));
    if (!who) {
      // A colleague: the sitting is a MEET (in person, off the record); the price difference comes back.
      const mate = findPerson(text, people.filter((p) => p.player && p.id !== ctx.character.id));
      if (mate) { const out = await meetColleague(db, { ...ctx }, { ...base, verb: "meet" }, mate, text, episode); return out.kind === "met" ? { ...out, refund: out.refund + Math.max(0, paid - VERB_COST.meet) } : { ...out, refund: paid }; }
    }
    if (!who && verb === "interview") {
      // Nobody named: whoever the living world put at the place is met (grow.ts), and from now on is in the directory.
      const p = findPlace(text, episode);
      if (p) {
        const { data: there } = await db.from("characters").select("id, slug, name, npc_state").eq("campaign_id", ctx.campaignId).eq("status", "active").is("player_id", null).eq("npc_state->>place", p.slug).limit(1).maybeSingle();
        if (there) {
          who = { id: there.id as string, slug: there.slug as string, name: there.name as string, division: null, player: false };
          if (!ctx.dry && !(there.npc_state as { listed?: boolean } | null)?.listed) await db.from("characters").update({ npc_state: { ...(there.npc_state as object), listed: true } }).eq("id", there.id);
          await learn(db, ctx, [`met.${who.slug}`], "witnessed", null);
        }
      }
    }
    if (!who) {
      // Not a listed person: asking around at a place (a guard, a clerk, whoever is there).
      const p = findPlace(text, episode);
      if (!p) return ruled(`The clerk could not tell who "${text}" names. Units returned. Use a surname from the directory, or name a place to ask around.`);
      base.target = p.slug;
      base.presence = [{ kind: "place", slug: p.slug, name: p.name, verb: "interview" }];
      if (!p.offCampus) await cameHome(db, ctx);
      if (p.restricted) await notify(db, ctx, `${ctx.character.name} was asking questions at ${p.name}, Round ${ctx.roundNo}.`);
      await learn(db, ctx, [`asked.${p.slug}`], "told", null);
      return { ...base, kind: "conversation", summary: `${ctx.character.name} asked around at ${p.name}. ${p.ask ?? p.visit}`, learned: [`asked.${p.slug}`], noticed: p.restricted };
    }
    base.target = who.slug;
    base.presence = [{ kind: "person", slug: who.slug, name: who.name, verb }];
    if (who.division) await cameHome(db, ctx);   // staff are seen on campus; a local is seen where they live
    let lobbyNote = "";
    if (verb === "lobby" && !ctx.dry) {
      const direction: "for" | "against" = /\b(against|oppose|block|kill|vote no|no on)\b/i.test(text) ? "against" : "for";
      const { data: motion } = await db.from("motions").select("id, number, organization_id").eq("campaign_id", ctx.campaignId).eq("status", "open").lte("opens_round", ctx.roundNo).neq("kind", "election").order("closes_round").limit(1).maybeSingle();
      if (!motion) return ruled(`There is no motion open to lobby ${who.name} on. Units returned.`);
      const { data: seat } = await db.from("memberships").select("character_id").eq("organization_id", motion.organization_id).eq("character_id", who.id).maybeSingle();
      if (!seat) return ruled(`${who.name} holds no seat on the body deciding ${motion.number}. Units returned.`);
      const r = await applyLobby(db, { campaignId: ctx.campaignId, motionNumber: motion.number as string, npcSlug: who.slug, npcId: who.id, lobbyist: { id: ctx.character.id, name: ctx.character.name }, direction, round: ctx.roundNo });
      lobbyNote = ` (${direction}; ${r.flipped ? "persuaded: " : ""}${r.because})`;
      base.learned.push(`lobbied.${who.slug}.${direction}`);
    }
    if (!ctx.dry) {
      // The conversation happened; the person writes the note they would send the next morning (or declines in a line).
      const recorder = holds(ctx.character.holdings ?? [], "transcript");
      const { data: row } = await db.from("correspondence").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, direction: "inbound", message_id: newMessageId(), from_character: ctx.character.id, from_address: null, to_characters: [who.id], to_addresses: [gameMailbox().address], subject: verb === "lobby" ? `In person: ${ctx.character.name} on the motion` : `In person: ${text.slice(0, 60)}`, body_text: `[In person, ${gameDate(ctx.roundNo)}.] ${ctx.character.name} came to see ${who.name}${verb === "lobby" ? ` about the motion before the Board, and asked for their vote${lobbyNote}` : ` and asked about: ${text}`}.${recorder ? " A cassette recorder sat on the desk between them." : ""}`, trusted: true, raw: { letter_kind: "interview", verb, source: "order", recorded: Boolean(recorder) } }).select("id").single();
      // The person remembers the machine; what they said comes back as a transcript (jobs.ts npc_reply).
      if (recorder) await db.from("knowledge").insert({ character_id: who.id, fact_key: `told:${ctx.character.slug}:recorded:${ctx.roundNo}`, value: { kind: "info_share", text: `${ctx.character.name} brought a tape recorder to the conversation on ${gameDate(ctx.roundNo)}`, from: ctx.character.id, from_name: ctx.character.name, round: ctx.roundNo }, confidence: 1, source_kind: "told", source_ref: row?.id ?? null, learned_round: ctx.roundNo });
      if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: who.id }, run_after: new Date(Date.now() + 60_000).toISOString() });
      await db.from("relationships").upsert({ campaign_id: ctx.campaignId, from_character: who.id, to_character: ctx.character.id, obligation: 0.1, updated_at: new Date().toISOString() }, { onConflict: "from_character,to_character", ignoreDuplicates: true });
    }
    return { ...base, kind: verb === "lobby" ? "lobbied" : "conversation", summary: verb === "lobby" ? `${ctx.character.name} put the motion to ${who.name} in person${lobbyNote}. What ${who.name} made of it arrives in their own words, if they choose to put it in writing.` : `${ctx.character.name} sat down with ${who.name}. What was said arrives in ${who.name}'s own words this morning, if they chose to put any of it in writing.` };
  }
  if (verb === "recruit" || verb === "dismiss") {
    // RECRUIT / DISMISS: an informant (informants.ts). Staff and locals only; someone who knows you.
    const who = findPerson(text, people.filter((p) => !p.player));
    if (!who) {
      const mate = findPerson(text, people.filter((p) => p.player && p.id !== ctx.character.id));
      if (mate) return ruled(`${mate.name} is a colleague in your cohort; informants are staff and locals only. Units returned. To bind a colleague, propose an AGREEMENT; to ask them, write: "TO: ${mate.name}".`);
      return ruled(`The clerk could not tell whom "${text}" names. Units returned. Use a surname from the directory.`);
    }
    base.target = who.slug;
    if (ctx.dry) return { ...base, kind: "recruited", summary: `(dry) ${verb} ${who.name}` };
    if (verb === "dismiss") { const ok = await dismiss(db, { campaignId: ctx.campaignId, roundNo: ctx.roundNo, playerId: ctx.character.id, playerSlug: ctx.character.slug, target: who }); return ok ? { ...base, kind: "recruited", summary: `${ctx.character.name} ended the arrangement with ${who.name}. No more notes, no more consideration.` } : ruled(`${who.name} does not inform for ${ctx.character.name}. Units returned.`); }
    const r = await recruit(db, { campaignId: ctx.campaignId, roundId: ctx.roundId, roundNo: ctx.roundNo, player: { id: ctx.character.id, slug: ctx.character.slug, name: ctx.character.name, division: ctx.character.division }, target: who, text });
    if (!r.ok) return ruled(`${r.error} Units returned.`);
    return { ...base, kind: "recruited", summary: r.summary, noticed: r.noticed, presence: [{ kind: "person", slug: who.slug, name: who.name, verb: "interview" }] };
  }
  if (verb === "emergency_directive") {
    // EMERGENCY_DIRECTIVE "<text>": officers only; in force at once for two rounds; everyone is told (directives.ts).
    const auth = ctx.dry ? { ok: true, as: "(dry)" } : await holdsEmergencyAuthority(db, ctx.campaignId, ctx.character.id);
    if (!auth.ok) return ruled(`${ctx.character.name} holds no emergency authority; only the Chairman of the Board and the Chair of the Safety Committee do, or whoever the record names.`);
    const quoted = text.match(/["\u201c]([^"\u201d]{4,400})["\u201d]/)?.[1] ?? text;
    const pd = parseDirective(quoted, { episode, people, findPerson });
    if ("error" in pd) return ruled(`The clerk could not give effect to the directive: ${pd.error}.`);
    await cameHome(db, ctx);
    const d = await issueDirective(db, { campaignId: ctx.campaignId, roundId: ctx.roundId, roundNo: ctx.roundNo, by: { id: ctx.character.id, name: ctx.character.name, title: ctx.character.title }, as: auth.as ?? "officer", kind: pd.kind, target: pd.target, target_name: pd.target_name, label: pd.label, text: quoted, dry: ctx.dry });
    base.target = d.number;
    return { ...base, kind: "directed", summary: `${ctx.character.name}, as ${auth.as}, issued emergency directive ${d.number}: ${pd.label}. It is in force at once, on every desk by morning, and expires at the lock of Round ${d.until} unless the Safety Committee extends it.` };
  }
  if (verb === "sponsor_motion") {
    // SPONSOR_MOTION <body> "<title>" CLOSES <round>: numbered tonight, announced tomorrow, open until its closing lock (motions.ts).
    const ask = parseMotion(text);
    if ("error" in ask) return ruled(`The clerk could not file the motion: ${ask.error}. Units returned.`);
    await cameHome(db, ctx);
    const r = await sponsorMotion(db, { campaignId: ctx.campaignId, roundId: ctx.roundId, roundNo: ctx.roundNo, episode, sponsor: { id: ctx.character.id, slug: ctx.character.slug, name: ctx.character.name, specialization: ctx.character.specialization ?? null }, ask, dry: ctx.dry });
    if (!r.ok) return ruled(`${r.error}. Units returned.`);
    base.target = r.number;
    return { ...base, kind: "sponsored", summary: r.summary };
  }
  if (verb === "travel") {
    // TRAVEL: the trip beyond the fence, made before anything else moves (jobs.ts). You are there until an order brings you home.
    const home = /\b(station r|campus|the campus|home|back)\b/i.test(text) && !findTown(text);
    if (home) { if (!ctx.character.location) return ruled(`${ctx.character.name} is already at Station R. Units returned.`); const was = ctx.character.location.name; await setLocation(db, ctx, null); return { ...base, kind: "travelled", summary: `${ctx.character.name} drove back from ${was} and signed in at Gate 2.` }; }
    const dest = destinationOf(text, episode);
    if (!dest) return ruled(`The clerk could not place "${text}". Units returned. Name a town (Tagus, Minot, Split Rock Basin, Stanley) or a place beyond the fence.`);
    const cf = curfew(ctx.directives ?? []);
    if (cf) { await notify(db, ctx, `${ctx.character.name} tried to leave by Gate 2 under directive ${cf.number}, Round ${ctx.roundNo}.`); return { ...base, kind: "refused", summary: `Gate 2 is closed under emergency directive ${cf.number}; ${ctx.character.name} was turned back, and the guard wrote the name down.`, noticed: true }; }
    if (ctx.character.location?.slug === dest.slug) return ruled(`${ctx.character.name} is already in ${dest.name}. Units returned.`);
    base.target = dest.slug;
    await setLocation(db, ctx, dest);
    if (!ctx.dry) await writeLog(db, ctx.campaignId, "gate", ctx.roundNo, ctx.character.id, `${gameDate(ctx.roundNo)} · ${ctx.character.name} · out after 1800 · ${dest.name}`);
    const town = findTown(dest.name);
    const truck = holds(ctx.character.holdings ?? [], "vehicle");
    return { ...base, kind: "travelled", summary: `${ctx.character.name} signed out at Gate 2 and drove to ${dest.name}${truck ? " in the motor pool truck" : ""}. ${town?.arrive ?? ""} The night is spent there, and the nights after until an order brings them home; orders there cost no further trip.`.replace(/\s+/g, " "), presence: [{ kind: "place", slug: dest.slug, name: dest.name, verb: "visit" }] };
  }
  if (verb === "protect") {
    // PROTECT: a guard for one night over my desk, one item, a document my department keeps, or myself. Laid before anything else moves (jobs.ts).
    const t = norm(text);
    let scope: Scope | null = null;
    if (/\b(myself|my movements|me|my tracks|my head down)\b/.test(t)) scope = { kind: "self" };
    else if (/\b(my desk|my files|everything|my case file|my things|my office|my holdings|my department s files|the department s files|our files)\b/.test(t) || t === "protect") scope = { kind: "all" };
    else {
      const d = findDocument(text, episode);
      if (d && d.holder === ctx.character.division) scope = { kind: "doc", slug: d.slug, title: d.title };
      else if (!ctx.dry) {
        const mine = await findLoot(db, ctx.character.id, text);
        if (mine) scope = { kind: "item", slug: mine.kind === "case" ? mine.slug : mine.def.slug, title: mine.kind === "case" ? mine.title : mine.name };
        else if (d) return ruled(`"${d.title}" is not kept by ${ctx.character.division?.replace(/-/g, " ") ?? "your department"}; ${ctx.character.name} cannot guard it. Units returned.`);
      }
    }
    if (!scope) return ruled(`The clerk could not tell what "${text}" is to be protected. Units returned. Say "my desk", name an item you hold or a file your department keeps, or say "myself".`);
    if (!ctx.dry) await layProtection(db, { campaignId: ctx.campaignId, roundNo: ctx.roundNo, characterId: ctx.character.id, division: ctx.character.division }, scope);
    const what = scope.kind === "self" ? "their own movements: nobody's report lists where they went tonight" : scope.kind === "all" ? `everything on their desk and ${ctx.character.division ? `${ctx.character.division.replace(/-/g, " ")}'s files` : "their files"}` : `"${scope.title}"`;
    return { ...base, kind: "protected", summary: `${ctx.character.name} spent the night guarding ${what}. Anyone who tried the drawer will have found it watched.` };
  }
  if (verb === "obtain") {
    // OBTAIN: a document the index keeps behind clearance, or an item from a colleague's desk.
    const guards = ctx.dry ? [] : await guardsTonight(db, ctx.campaignId, ctx.roundNo);
    const operative = ctx.character.specialization === "operative";
    const thiefName = operative ? "someone" : ctx.character.name;
    const colleagues = people.filter((p) => p.player && p.id !== ctx.character.id);
    const fromM = text.match(/\b(?:from|off|out of)\s+(.+?)(?:'s\s+(?:desk|office|cabinet|drawer|file|case file))?\s*$/i);
    const possM = text.match(/\b([A-Z][\w.-]+(?:\s+[A-Z][\w.-]+)?)'s\s+(.+)$/);   // "Okafor's camera"
    const victim = fromM ? findPerson(fromM[1], colleagues) : possM ? findPerson(possM[1], colleagues) : null;
    if (victim) {
      const want = (fromM ? text.replace(fromM[0], "") : possM![2]).replace(/^\s*(?:obtain|steal|lift|pinch|swipe|take|get hold of|make off with|help myself to)\s+/i, "").trim();
      const loot = ctx.dry ? null : await findLoot(db, victim.id, want);
      if (!loot) return ruled(`${victim.name} holds nothing the clerk could match to "${want}". Units returned.`);
      base.target = victim.slug;
      const lootSlug = loot.kind === "case" ? loot.slug : loot.def.slug; const lootName = loot.kind === "case" ? loot.title : loot.name;
      if (!ctx.dry && (await underGrace(db, ctx.campaignId, victim.id, ctx.roundNo))) return ruled(`${victim.name} is still in induction; their desk is in the induction wing, with a Personnel clerk at the door. Units returned.`);
      if (!ctx.dry) await endGrace(db, ctx.campaignId, ctx.character.id, ctx.roundNo, `took from ${victim.name}'s desk`);
      const guard = guardOf(guards, { ownerId: victim.id, itemSlug: lootSlug });
      const tell = async (kind: string, text: string, who: string | null) => { if (ctx.dry) return; await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind, payload: { by: victim.id, who, who_name: who ? ctx.character.name : null, what: lootName, text, round: ctx.roundNo }, idempotency_key: `${kind}:${ctx.roundId}:${victim.id}:${ctx.character.id}:${lootSlug}`, visible_to: [victim.id] }); await db.from("knowledge").insert({ character_id: victim.id, fact_key: `${kind.replace(".", ":")}:${ctx.character.slug}:${ctx.roundNo}:${lootSlug}`, value: { kind, text, who, who_name: who ? ctx.character.name : null, what: lootName, round: ctx.roundNo }, confidence: 1, source_kind: "witnessed", source_ref: null, learned_round: ctx.roundNo }); };
      if (guard) { await tell("contact.theft_failed", `${thiefName} tried your desk for "${lootName}" last night and found it guarded`, operative ? null : ctx.character.id); return { ...base, kind: "refused", summary: `${victim.name}'s "${lootName}" was watched; ${ctx.character.name} could not get near it${operative ? "" : ", and was seen trying"}.`, presence: [{ kind: "person", slug: victim.slug, name: victim.name, verb: "obtain", covert: true }] }; }
      const { data: vp } = ctx.dry ? { data: null } : await db.from("order_packets").select("mode").eq("round_id", ctx.roundId).eq("character_id", victim.id).maybeSingle();
      const watchful = vp?.mode === "hold" || vp?.mode === "missed";
      const got = ctx.dry ? lootName : await takeLoot(db, { campaignId: ctx.campaignId, roundNo: ctx.roundNo, thief: { id: ctx.character.id, slug: ctx.character.slug, name: ctx.character.name }, victim: { id: victim.id, slug: victim.slug, name: victim.name } }, loot);
      await tell("contact.theft", watchful ? `${thiefName} took "${got}" from your desk last night; you were there and saw it go` : `"${got}" is missing from your desk this morning`, watchful && !operative ? ctx.character.id : null);
      return { ...base, kind: "obtained", summary: `${ctx.character.name} took "${got}" from ${victim.name}'s desk. It is in the Case File${loot.kind === "equipment" ? " and under Holdings" : ""}.${watchful ? ` ${victim.name} was at their desk${operative ? " and saw someone" : " and saw who"}.` : ""}`, presence: [{ kind: "person", slug: victim.slug, name: victim.name, verb: "obtain", covert: true }] };
    }
    const d = findDocument(text, episode);
    if (!d) return ruled(`The clerk could not match "${text}" to a file on the index or to anything a colleague holds. Units returned. Name the file, or say what and from whom.`);
    base.target = d.slug;
    if (allowed(d.access, ctx.character) && !d.access.via && !placesFor(episode).some((pl) => pl.slug === d.holder)) return ruled(`${ctx.character.name} is entitled to "${d.title}"; ask Records for it. Units returned.`);
    const keeper = people.find((p) => p.slug === d.holder) ?? (d.access.via ? people.find((p) => p.slug === d.access.via) : null);
    const keptAt = placesFor(episode).find((pl) => pl.slug === d.holder);
    const holderDivision = !keeper && !keptAt ? d.holder : null;
    const guard = guardOf(guards, { docSlug: d.slug, holderDivision });
    if (guard) {
      const g = people.find((p) => p.id === guard.by);
      if (!ctx.dry && g) { await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "contact.theft_failed", payload: { by: g.id, who: operative ? null : ctx.character.id, who_name: operative ? null : ctx.character.name, what: d.title, text: `${thiefName} tried for "${d.title}" last night and found it guarded`, round: ctx.roundNo }, idempotency_key: `theft_failed:${ctx.roundId}:${g.id}:${ctx.character.id}:${d.slug}`, visible_to: [g.id] }); }
      return { ...base, kind: "refused", summary: `"${d.title}" was watched tonight; ${ctx.character.name} could not get near it${operative ? "" : ", and was seen trying"}.`, presence: [{ kind: "document", slug: d.slug, name: d.title, verb: "obtain", covert: true }] };
    }
    const where = keeper ? `${keeper.name}'s office` : keptAt ? keptAt.name : `the ${String(d.holder).replace(/-/g, " ")} files`;
    const item = await deliver(db, ctx, d, `Taken from ${where}, Round ${ctx.roundNo}, without authorization.`);
    const loud = Boolean(d.access.sealed || d.notice || keeper || keptAt?.restricted);
    if (loud) await notify(db, ctx, `"${d.title}" went missing from ${where} on the night of Round ${ctx.roundNo}${operative ? "" : `; ${ctx.character.name} was seen near it`}.`);
    if (keeper && !ctx.dry) await db.from("knowledge").insert({ character_id: keeper.id, fact_key: `told:${ctx.character.slug}:took:${d.slug}`, value: { kind: "info_share", text: `"${d.title}" was taken from my office on the night of Round ${ctx.roundNo}${operative ? "" : `; ${ctx.character.name} was seen near it`}`, from: ctx.character.id, from_name: ctx.character.name, round: ctx.roundNo }, confidence: operative ? 0.5 : 1, source_kind: "witnessed", source_ref: null, learned_round: ctx.roundNo });
    // A watchful colleague in the department that keeps it learns who, unless the thief is an Operative.
    if (holderDivision && !ctx.dry) for (const w of await watchfulIn(db, ctx.roundId, holderDivision)) { if (w.id === ctx.character.id) continue; await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "contact.watch", payload: { by: w.id, who: operative ? null : ctx.character.id, who_name: operative ? null : ctx.character.name, what: d.title, verb: "obtain", text: `${thiefName} took "${d.title}" from ${holderDivision.replace(/-/g, " ")}'s files while you were at your desk`, round: ctx.roundNo }, idempotency_key: `watch:${ctx.roundId}:${w.id}:obtain:${d.slug}:${ctx.character.id}`, visible_to: [w.id] }); }
    return { ...base, kind: "obtained", summary: `${ctx.character.name} took "${d.title}" from ${where}. It is in the Case File, and it will be missed${loud ? "; Security has the report already" : ""}.`, learned: d.grants, item, noticed: loud, presence: [{ kind: "document", slug: d.slug, name: d.title, verb: "obtain", covert: true }] };
  }
  if (verb === "requisition") {
    // REQUISITION <item>: signed out from Procurement stores tonight, on the personnel file by morning, and in a log.
    const item = findEquipment(text);
    if (!item) return ruled(`Procurement stores could not match "${text}" to anything on the shelf. Units returned. The shelf holds: ${EQUIPMENT_NAMES}.`);
    base.target = item.slug;
    if (item.departments && !(ctx.character.division && item.departments.includes(ctx.character.division))) return ruled(`A ${item.name.toLowerCase()} is signed for by ${item.departments.map((d) => d.replace(/-/g, " ")).join(" or ")} only. Units returned.`);
    if (item.clearance && ctx.character.clearance < item.clearance) return ruled(`A ${item.name.toLowerCase()} needs clearance ${item.clearance}. Units returned.`);
    if (paid < item.cost) return ruled(`A ${item.name.toLowerCase()} costs ${item.cost} AU to sign out; ${paid} were committed. Units returned.`);
    if (ctx.dry) return { ...base, kind: "requisitioned", summary: `(dry) ${item.name}` };
    const r = await requisition(db, { campaignId: ctx.campaignId, characterId: ctx.character.id, characterSlug: ctx.character.slug, characterName: ctx.character.name, round: ctx.roundNo }, item);
    if (!r.ok) return ruled(`${r.error} Units returned.`);
    if (item.notice) await notify(db, ctx, `${ctx.character.name} was issued a ${item.name.toLowerCase()} on Round ${ctx.roundNo}.`);
    return { ...base, kind: "requisitioned", summary: `Procurement stores signed a ${item.name.toLowerCase()} out to ${ctx.character.name}${r.returns ? `, due back by the morning of Round ${r.returns}` : ""}. It is on the personnel file under Holdings, and in the ${item.log.key.replace(/-/g, " ")} log.`, noticed: Boolean(item.notice), refund: Math.max(0, paid - item.cost) };
  }
  if (verb === "research") {
    // RESEARCH <subject>: the library takes the request tonight; the brief is drafted
    // by a job (research.ts) and is in the Case File by morning. Nothing is noticed.
    const subject = researchSubject(text);
    if (!subject || subject.length < 3) return ruled(`The librarian could not tell what "${text}" is to be researched. Units returned. Name a subject: a place, a company, a year, a question.`);
    const slug = researchSlug(subject);
    base.target = slug;
    const { data: have } = ctx.dry ? { data: null } : await db.from("case_items").select("id").eq("character_id", ctx.character.id).eq("slug", slug).maybeSingle();
    if (have) return ruled(`The library already gave ${ctx.character.name} a brief on "${subject}"; it is in the Case File. Units returned.`);
    if (!ctx.dry) await db.from("jobs").insert({ kind: "research_brief", payload: { campaign_id: ctx.campaignId, round_id: ctx.roundId, round: ctx.roundNo, character_id: ctx.character.id, subject, slug, order_id: order.id } });
    return { ...base, kind: "research", summary: `The company library took ${ctx.character.name}'s request on "${subject}"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.`, learned: [] };
  }
  if (verb === "leak") {
    // LEAK <item>: a copy of something held goes to the Minot Daily News for its next
    // issue (bulletin.ts). Each leak after the first by the same person this episode
    // costs 2 AU more. A file Security logs requests for is cross-referenced: the
    // paper has it, Records knows who pulled it.
    const h = await heldItem(db, ctx, text, episode);
    if (!h) { const d0 = findDocument(text, episode); return ruled(d0 ? `${ctx.character.name} does not hold "${d0.title}". Units returned; a leak needs the paper in hand.` : `Nothing in the Case File matches "${text}". Units returned. Name the document you mean to leak.`); }
    if (/^minot-daily-news/.test(h.slug)) return ruled(`"${h.title}" is the paper's own issue; it has printed it already. Units returned.`);
    // An index document goes by its own slug (its grants spread when printed); anything else held goes as its copy.
    const d = h.doc ?? { slug: h.slug.slice(0, 60), title: h.title, notice: false, grants: [] as string[] };
    base.target = d.slug;
    const { data: itemRow } = h.doc || ctx.dry ? { data: null } : await db.from("case_items").select("body").eq("character_id", ctx.character.id).eq("slug", h.slug).maybeSingle();
    const { data: prior } = await db.from("facts").select("key, value").eq("campaign_id", ctx.campaignId).like("key", "leak.%");
    if ((prior ?? []).some((f) => f.key === `leak.${d.slug}`)) return ruled(`The paper already has "${d.title}". Units returned.`);
    const mine = (prior ?? []).filter((f) => (f.value as { by?: string; episode?: number }).by === ctx.character.id && (f.value as { episode?: number }).episode === episode).length;
    const surcharge = 2 * mine;
    if (surcharge > 0 && paid < VERB_COST.leak + surcharge) return ruled(`A ${mine + 1}${mine + 1 === 2 ? "nd" : mine + 1 === 3 ? "rd" : "th"} leak this episode costs ${VERB_COST.leak + surcharge} AU; ${paid} were committed. Units returned.`);
    if (!ctx.dry) {
      await db.from("facts").upsert({ campaign_id: ctx.campaignId, key: `leak.${d.slug}`, value: { by: ctx.character.id, by_name: ctx.character.name, round: ctx.roundNo, episode, title: d.title, printed: false, ...(h.doc ? {} : { body: String(itemRow?.body ?? "").slice(0, 1500) }) }, established_round: ctx.roundNo, secret: true }, { onConflict: "campaign_id,key" });
      await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "press.leaked", payload: { by: ctx.character.id, item: d.slug, title: d.title, round: ctx.roundNo }, idempotency_key: `leak:${ctx.campaignId}:${d.slug}`, visible_to: [ctx.character.id] });
      if (d.notice) await notify(db, ctx, `The Minot Daily News has "${d.title}". Records' log shows ${ctx.character.name} requested it.`);
    }
    return { ...base, kind: "leaked", summary: `A copy of "${d.title}" went to the Minot Daily News by way of the counter on Main, left with a man who did not give his name. It will be in the paper's next issue.${d.notice ? " Records keeps a log of who asks for that file." : ""}`, noticed: Boolean(d.notice), refund: Math.max(0, paid - VERB_COST.leak - surcharge), presence: [{ kind: "document", slug: d.slug, name: d.title, verb: "leak", covert: true }] };
  }
  if (PAPERWORK_VERBS.includes(verb)) {
    // Paperwork reaches one thing: this week's matter, by the form that matter calls for, from the department it names.
    const label = (v: string) => v.toUpperCase();
    const pw = paperworkFor(episode, ctx.episodeRound);
    const tier = pw.verbs.includes(verb) ? pw.tier : null;
    if (!pw.verbs.length) return ruled(`No paperwork reaches what is happening this week; it will run its course. Units returned. Do not file ${label(verb)} again until the dispatch offers paperwork.`);
    const from = pw.departments ? `, from ${pw.departments.map(deptName).join(" or ")}` : "";
    if (!tier) return ruled(`${label(verb)} is not the paperwork this week calls for. Units returned. This week's is ${pw.verbs.map(label).join(" or ")}${from}.`);
    const { data: done } = ctx.dry ? { data: null } : await db.from("facts").select("value").eq("campaign_id", ctx.campaignId).eq("key", `pressure.ep${episode}.tier${tier.tier}.mitigated`).maybeSingle();
    if (done) { const by = (done.value as { by?: string; round?: number }); return ruled(`This week's paperwork is already through${by.by === ctx.character.id ? ", filed by you" : ""}${by.round ? ` on Round ${by.round}` : ""}. Units returned.`); }
    if (pw.departments && !(ctx.character.division && pw.departments.includes(ctx.character.division))) return ruled(`${label(verb)} must come${from.slice(1)}. Units returned. Ask someone there to file it.`);
    if (!ctx.dry) {
      await db.from("facts").upsert({ campaign_id: ctx.campaignId, key: `pressure.ep${episode}.tier${tier.tier}.mitigated`, value: { by: ctx.character.id, round: ctx.roundNo }, established_round: ctx.roundNo, secret: true }, { onConflict: "campaign_id,key" });
      const { data: idx } = await db.from("rules").select("value").eq("campaign_id", ctx.campaignId).eq("key", "convergence.index").maybeSingle();
      await db.from("rules").upsert({ campaign_id: ctx.campaignId, key: "convergence.index", value: Math.max(0, Number(idx?.value ?? 0) - 1) }, { onConflict: "campaign_id,key" });
      await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "pressure.mitigated", payload: { episode, tier: tier.tier, by: ctx.character.id, verb }, idempotency_key: `mitigated:${ctx.campaignId}:${episode}:${tier.tier}` });
    }
    return { ...base, kind: "mitigated", summary: `${ctx.character.name}'s paperwork (${verb.replace(/_/g, " ")}) went through. The matter of "${tier.text}" is, for now, handled.` };
  }
  if (verb === "attend") {
    // A committee session: sit at the back and hear where the members stand on what is before them.
    const mm = text.match(/\b([BRS]-\d{2}-\d{3})\b/i);
    let orgName = committeeByName(text);
    if (!orgName && mm) { const { data: mo } = await db.from("motions").select("organizations(name)").eq("campaign_id", ctx.campaignId).eq("number", mm[1].toUpperCase()).maybeSingle(); orgName = ((Array.isArray(mo?.organizations) ? mo?.organizations[0] : mo?.organizations) as { name: string } | null)?.name ?? null; }
    if (orgName) return attendSession(db, ctx, base, orgName);
    return ruled(`Nothing on the company calendar, and no invitation you hold, matched "${text}". Units returned. Committee sessions can be attended: ATTEND the Board, the Research Committee or the Safety Committee.`);
  }
  return ruled(`The clerk could not make an order of "${text}". Units returned. Say what you want to request, watch, search, examine, or whom you want to see.`);
}

/* At the lock of a band's last round: the tier is reached unless mitigated. */
export async function advancePressure(db: SupabaseClient, campaignId: string, roundId: string, episodeRound: number, episode = 1): Promise<number | null> {
  const tier = pressureFor(episode).find((t) => t.rounds[1] === episodeRound);
  if (!tier) return null;
  const { data: m } = await db.from("facts").select("key").eq("campaign_id", campaignId).eq("key", `pressure.ep${episode}.tier${tier.tier}.mitigated`).maybeSingle();
  if (m) return null;
  const { data: dup } = await db.from("events").select("id").eq("idempotency_key", `pressure:${campaignId}:${episode}:${tier.tier}`).maybeSingle();
  if (dup) return null;
  const { data: idx } = await db.from("rules").select("value").eq("campaign_id", campaignId).eq("key", "convergence.index").maybeSingle();
  await db.from("rules").upsert({ campaign_id: campaignId, key: "convergence.index", value: Number(idx?.value ?? 0) + 2 }, { onConflict: "campaign_id,key" });
  await db.from("facts").upsert({ campaign_id: campaignId, key: `pressure.ep${episode}.tier${tier.tier}.reached`, value: { round: episodeRound }, established_round: episodeRound, secret: true }, { onConflict: "campaign_id,key" });
  await db.from("events").insert({ campaign_id: campaignId, round_id: roundId, phase: "world", kind: "pressure.tier_reached", payload: { episode, tier: tier.tier, text: tier.text }, idempotency_key: `pressure:${campaignId}:${episode}:${tier.tier}` });
  return tier.tier;
}
