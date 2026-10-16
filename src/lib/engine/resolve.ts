/* Verb rules: how an order becomes an outcome. Deterministic; the model never
   decides. Each verb reads the world (documents, places, people, the round)
   and the character (clearance, department), and writes what follows: a copy
   in the Case File, knowledge rows, a note in Security's memory, a refund.
   The outcome summary is for the morning narrator and is player-safe. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { documentsFor, placesFor, pressureFor, episodeOf } from "./world";
import type { Access, DocumentDef, PlaceDef } from "./world/types";
import { gameDate } from "@/lib/email/letter";
import { newMessageId, gameMailbox } from "@/lib/email/resend";
import { applyLobby } from "./governance";
import { acceptInvitation, accessRestricted, outstandingInvitations } from "./societies";

export type Outcome = {
  kind: "document" | "refused" | "referred" | "sighting" | "visit" | "found" | "nothing" | "conversation" | "lobbied" | "mitigated" | "examined" | "ruling";
  summary: string;            // one or two sentences for the narrator; what the player now knows
  learned: string[];          // knowledge keys granted
  refund: number;             // Action Units returned (a ruling that nothing could be done)
  item?: string;              // case item slug delivered
  noticed?: boolean;          // Corporate Security learned of it
  verb: string; target: string | null;
};

export type Ctx = {
  campaignId: string; roundId: string; roundNo: number; episodeRound: number; episode?: number;
  character: { id: string; slug: string; name: string; clearance: number; division: string | null; title: string | null; societies?: string[] };
  dry?: boolean;
};

export const VERB_COST: Record<string, number> = { report: 3, request_files: 6, interview: 4, surveil: 10, visit: 5, examine: 3, search: 8, lobby: 5, attend: 4, submit_manifest: 4, approve_overtime: 4, reconcile_maps: 6, approve_corridors: 6, clear_invoices: 6, issue_statement: 6 };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

function findDocument(text: string, episode = 1): DocumentDef | null {
  const t = norm(text); let best: { d: DocumentDef; n: number } | null = null;
  for (const d of documentsFor(episode)) for (const a of d.aliases.map(norm)) if (t.includes(a)) { const n = a.length; if (!best || n > best.n) best = { d, n }; }
  return best?.d ?? null;
}
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
    [/\b(lobby|persuade|convince|vote with|support the motion|oppose the motion)\b/, "lobby"],
    [/\b(watch|stake out|stakeout|follow|surveil|keep an eye|after dark|at night|overnight)\b/, "surveil"],
    [/\b(search|go through|rifle|look through|open the|break into|the drawer|the locker|investigate|look around|poke around)\b/, "search"],
    [/\b(examine|study|read closely|look closely|compare|inspect|check the)\b/, "examine"],
    [/\b(ask|talk|speak|interview|question|lunch|coffee with|meet with|see him|see her|chat|introduce|approach|walk up to)\b/, "interview"],
    [/\b(request|pull|get the|obtain|copy of|file|files|records|ledger|log|logs|report|invoices|authorizations|memo)\b/, "request_files"],
    [/\b(go to|visit|drive|walk to|look at|see the|check out|go into|go inside|enter|travel to|head to|go out to|go back to)\b/, "visit"],
    [/\b(attend|sit in|be present)\b/, "attend"],
  ];
  for (const [re, verb] of rules) if (re.test(t)) return { verb, target: text };
  return { verb: "unknown", target: text };
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
  if (!ctx.dry) await db.from("case_items").upsert({ campaign_id: ctx.campaignId, character_id: ctx.character.id, slug, kind: d.kind === "map" ? "map" : d.kind === "letter" ? "letter" : d.kind === "memo" ? "memo" : d.kind === "report" ? "report" : d.kind === "object" ? "object" : "document", drawer: d.kind === "map" ? "maps" : "documents", title: d.title, from_label: d.from ?? null, written_label: d.written ?? null, body: d.body, round_received: ctx.roundNo, how_obtained: how, copy_note: "A copy; the original stays where it was.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug" });
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
  }
  const travel = Number(order.args.travel ?? 0);
  const allBack = outs.every((o) => o.kind === "ruling" && o.refund > 0);
  const lead = outs.find((o) => o.kind !== "ruling") ?? outs[0];
  return {
    kind: lead.kind, verb: outs.map((o) => o.verb).join("+"), target: lead.target,
    summary: dedupeSentences(outs.map((o) => o.summary).join(" ")),
    learned: outs.flatMap((o) => o.learned), item: outs.find((o) => o.item)?.item,
    noticed: outs.some((o) => o.noticed), refund: outs.reduce((n, o) => n + o.refund, 0) + (allBack ? travel : 0),
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
  if (verb === "freeform" || !VERB_COST[verb]) { const inf = inferVerb(text); verb = inf.verb; }
  const base = { learned: [] as string[], refund: 0, verb, target: null as string | null };
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
    if (!ctx.dry) {
      const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", ctx.campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
      for (const s of sec ?? []) await db.from("knowledge").insert({ character_id: s.id, fact_key: `reported:${who.slug}:${hash(ctx.character.id).toString(36)}`, value: { kind: "reported", text: `${ctx.character.name} reported ${who.name} to Security`, from: ctx.character.id, from_name: ctx.character.name, about: who.id, round: ctx.roundNo }, confidence: 1, source_kind: "told", learned_round: ctx.roundNo });
      await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "security.reported", payload: { by: ctx.character.id, about: who.id, round: ctx.roundNo }, idempotency_key: `reported:${ctx.character.id}:${who.id}:${ctx.roundNo}` });
    }
    return { ...base, kind: "conversation", summary: `${ctx.character.name} reported ${who.name} to Corporate Security. The clerk took the name and asked nothing else. Security will not say what it does with names.`, noticed: false };
  }
  if (verb === "attend" || verb === "visit" || verb === "surveil") {
    // Going where an invitation says to go accepts it, whatever the order called it.
    const p = findPlace(text, episode);
    if (p && !ctx.dry) {
      const open = await outstandingInvitations(db, ctx.campaignId, ctx.character.id);
      const inv = open.find((s) => s.meeting.place === p.slug);
      if (inv) { base.target = inv.slug; return { ...base, kind: "conversation", summary: await acceptInvitation(db, { campaignId: ctx.campaignId, roundId: ctx.roundId, roundNo: ctx.roundNo, characterId: ctx.character.id, characterName: ctx.character.name, characterSlug: ctx.character.slug, society: inv }) }; }
    }
  }
  if (verb === "request_files") {
    const d = findDocument(text, episode);
    if (!d) return ruled(`The clerk could not match "${text}" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.`);
    base.target = d.slug;
    const keptAt = placesFor(episode).find((pl) => pl.slug === d.holder);
    if (keptAt) return ruled(`Records does not hold "${d.title}"; it is kept at ${keptAt.name}. Units returned. Go there, or search there, and see.`);
    if (d.notice) await notify(db, ctx, `${ctx.character.name} requested "${d.title}" on the night of Round ${ctx.roundNo}.`);
    if (allowed(d.access, ctx.character)) { const item = await deliver(db, ctx, d, "Requested through Records."); return { ...base, kind: "document", summary: `Records delivered a copy of "${d.title}". It is in the Case File.`, learned: d.grants, item, noticed: d.notice }; }
    if (d.access.via) { const who = people.find((p) => p.slug === d.access.via); return { ...base, kind: "referred", summary: `Records does not hold "${d.title}"; it is kept by ${who?.name ?? d.access.via} personally. The request was logged and referred; a letter to them might do what a requisition cannot.`, noticed: d.notice }; }
    return { ...base, kind: "refused", summary: `Records refused "${d.title}": clearance ${d.access.clearance ?? 3} required${d.access.department ? ` (or a request from ${d.access.department.join(" or ")})` : ""}. The request was logged.`, noticed: d.notice };
  }
  if (verb === "surveil" || verb === "visit") {
    const p = findPlace(text, episode);
    if (!p) return ruled(`The clerk could not place "${text}". Units returned. Name a building, a gate, a road, or a property.`);
    base.target = p.slug;
    if (verb === "visit") { if (p.restricted) await notify(db, ctx, `${ctx.character.name} was seen at ${p.name} in daylight, Round ${ctx.roundNo}.`); await learn(db, ctx, [`visited.${p.slug}`], "witnessed", null); return { ...base, kind: "visit", summary: `${ctx.character.name} went to ${p.name}. ${p.visit}`, learned: [`visited.${p.slug}`], noticed: p.restricted }; }
    const s = p.surveil.find((x) => (x.episode ?? 1) === episode && ctx.episodeRound >= x.rounds[0] && ctx.episodeRound <= x.rounds[1]) ?? p.surveil.find((x) => (x.episode ?? 1) < episode && ctx.episodeRound >= x.rounds[0] && ctx.episodeRound <= x.rounds[1]);
    const seen = hash(`${ctx.roundId}:${ctx.character.id}:${p.slug}`) % 4 !== 0;   // one night in four shows nothing
    if (!s || !seen) return { ...base, kind: "nothing", summary: `A night on ${p.name}: cold, quiet, nothing that would go in a report. ${p.restricted ? "A patrol truck slowed as it passed." : ""}`.trim(), noticed: p.restricted };
    if (s.restricted || p.restricted) await notify(db, ctx, `${ctx.character.name} spent the night of Round ${ctx.roundNo} watching ${p.name}.`);
    await learn(db, ctx, [s.grants], "witnessed", null);
    return { ...base, kind: "sighting", summary: `A night watching ${p.name}: ${s.text}.`, learned: [s.grants], noticed: s.restricted || p.restricted };
  }
  if (verb === "search") {
    const p = findPlace(text, episode);
    if (!p) return ruled(`The clerk could not place "${text}". Units returned.`);
    base.target = p.slug;
    if (!allowed(p.searchAccess, ctx.character)) { await notify(db, ctx, `${ctx.character.name} tried to get into ${p.name} on the night of Round ${ctx.roundNo}.`); return { ...base, kind: "refused", summary: `${p.name} is locked, sealed or watched; ${ctx.character.name} could not get in and was probably seen trying.`, noticed: true }; }
    const docs = (p.contains ?? []).map((s) => documentsFor(episode).find((d) => d.slug === s)).filter((d): d is DocumentDef => Boolean(d));
    if (p.restricted) await notify(db, ctx, `${ctx.character.name} was in ${p.name} after hours, Round ${ctx.roundNo}.`);
    if (!docs.length) return { ...base, kind: "nothing", summary: `A search of ${p.name} turned up nothing that could be carried away. ${p.visit}`, noticed: p.restricted };
    const d = docs[0]; const item = await deliver(db, ctx, d, `Found in ${p.name}.`);
    return { ...base, kind: "found", summary: `In ${p.name}, ${ctx.character.name} found "${d.title}" and took it. It is in the Case File.`, learned: d.grants, item, noticed: p.restricted };
  }
  if (verb === "examine") {
    const d = findDocument(text, episode);
    if (!d) return ruled(`Nothing in the Case File matches "${text}". Units returned.`);
    base.target = d.slug;
    const { data: held } = ctx.dry ? { data: [{ slug: d.slug }] } : await db.from("case_items").select("slug").eq("character_id", ctx.character.id).eq("slug", d.slug);
    if (!held?.length) return ruled(`${ctx.character.name} does not hold "${d.title}". Units returned; request it first.`);
    if (!d.wrongDetail) return { ...base, kind: "examined", summary: `A close reading of "${d.title}" found nothing beyond what it says.` };
    await learn(db, ctx, [d.wrongDetail.grants], "inferred", null);
    return { ...base, kind: "examined", summary: `A close reading of "${d.title}": ${d.wrongDetail.text}.`, learned: [d.wrongDetail.grants] };
  }
  if (verb === "interview" || verb === "lobby") {
    let who = findPerson(text, people.filter((p) => !p.player));
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
      if (p.restricted) await notify(db, ctx, `${ctx.character.name} was asking questions at ${p.name}, Round ${ctx.roundNo}.`);
      await learn(db, ctx, [`asked.${p.slug}`], "told", null);
      return { ...base, kind: "conversation", summary: `${ctx.character.name} asked around at ${p.name}. ${p.ask ?? p.visit}`, learned: [`asked.${p.slug}`], noticed: p.restricted };
    }
    base.target = who.slug;
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
      const { data: row } = await db.from("correspondence").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, direction: "inbound", message_id: newMessageId(), from_character: ctx.character.id, from_address: null, to_characters: [who.id], to_addresses: [gameMailbox().address], subject: verb === "lobby" ? `In person: ${ctx.character.name} on the motion` : `In person: ${text.slice(0, 60)}`, body_text: `[In person, ${gameDate(ctx.roundNo)}.] ${ctx.character.name} came to see ${who.name}${verb === "lobby" ? ` about the motion before the Board, and asked for their vote${lobbyNote}` : ` and asked about: ${text}`}.`, trusted: true, raw: { letter_kind: "interview", verb, source: "order" } }).select("id").single();
      if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: who.id }, run_after: new Date(Date.now() + 60_000).toISOString() });
      await db.from("relationships").upsert({ campaign_id: ctx.campaignId, from_character: who.id, to_character: ctx.character.id, obligation: 0.1, updated_at: new Date().toISOString() }, { onConflict: "from_character,to_character", ignoreDuplicates: true });
    }
    return { ...base, kind: verb === "lobby" ? "lobbied" : "conversation", summary: verb === "lobby" ? `${ctx.character.name} put the motion to ${who.name} in person${lobbyNote}. What ${who.name} made of it arrives in their own words, if they choose to put it in writing.` : `${ctx.character.name} sat down with ${who.name}. What was said arrives in ${who.name}'s own words this morning, if they chose to put any of it in writing.` };
  }
  if (["submit_manifest", "approve_overtime", "reconcile_maps", "approve_corridors", "clear_invoices", "issue_statement"].includes(verb)) {
    const tier = pressureFor(episode).find((t) => t.mitigation?.verbs.includes(verb) && ctx.episodeRound >= t.rounds[0] && ctx.episodeRound <= t.rounds[1]);
    if (!tier) return ruled(`There is nothing for ${verb.replace(/_/g, " ")} to act on this week. Units returned.`);
    if (tier.mitigation?.department && !(ctx.character.division && tier.mitigation.department.includes(ctx.character.division))) return ruled(`${verb.replace(/_/g, " ")} must come from ${tier.mitigation.department.join(" or ")}. Units returned.`);
    if (!ctx.dry) {
      await db.from("facts").upsert({ campaign_id: ctx.campaignId, key: `pressure.ep${episode}.tier${tier.tier}.mitigated`, value: { by: ctx.character.id, round: ctx.roundNo }, established_round: ctx.roundNo, secret: true }, { onConflict: "campaign_id,key" });
      const { data: idx } = await db.from("rules").select("value").eq("campaign_id", ctx.campaignId).eq("key", "convergence.index").maybeSingle();
      await db.from("rules").upsert({ campaign_id: ctx.campaignId, key: "convergence.index", value: Math.max(0, Number(idx?.value ?? 0) - 1) }, { onConflict: "campaign_id,key" });
      await db.from("events").insert({ campaign_id: ctx.campaignId, round_id: ctx.roundId, phase: "strategic", kind: "pressure.mitigated", payload: { episode, tier: tier.tier, by: ctx.character.id, verb }, idempotency_key: `mitigated:${ctx.campaignId}:${episode}:${tier.tier}` });
    }
    return { ...base, kind: "mitigated", summary: `${ctx.character.name}'s paperwork (${verb.replace(/_/g, " ")}) went through. The matter of "${tier.text}" is, for now, handled.` };
  }
  if (verb === "attend") return ruled(`Nothing on the company calendar, and no invitation you hold, matched "${text}". Units returned.`);
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
