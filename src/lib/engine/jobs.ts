/* The job worker. Drains `jobs` in small idempotent batches. Each handler must
   be safe to run twice: it checks for the effect before applying it.
   Kinds:
     route       resolve a correspondence row's recipients to characters
     deliver_letter  copy a player's letter to other players' characters and send it
     grammar     apply deterministic acts (vote/hold/order/accept/reject/transfer) from a trusted sender
     extract     ask the model for non-binding structured events; store with provenance
     tick_phase  one resolution phase of a locked round (deterministic; stubs grow into rules)
     send        deliver an outbound correspondence row via Resend
     player_brief  the console's model-written note on a player (src/lib/admin/brief.ts)
     approve_application / first_memo  onboarding (./onboarding.ts) */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chatJson, type LedgerRow } from "@/lib/cobble";
import { gameMailbox, sendMail } from "@/lib/email/resend";
import { gameDate, letterLinks, renderLetter, splitSections, type LetterKind } from "@/lib/email/letter";
import { badgeNumber, bioForPrompt, bioFrom, particulars } from "@/lib/game/personnel";
import { renderTemplate } from "@/lib/email/template-store";
import { approveApplication, firstMemo } from "./onboarding";
import { fetchReceived, orderContinuation, parseGrammar, parseSalutation, replyMode, stripQuoted, surnameKey, type GrammarAct } from "@/lib/email/inbound";
import { describePrice, priceFreeform } from "@/lib/engine/pricing";
import { generateStaffReply, loadDossier, type CastSheet, type Memory } from "@/lib/engine/npc";
import { FORMS, formIsKnown, parseFormSubmission } from "@/lib/engine/forms";
import { blankFormLetter, fileForm } from "@/lib/engine/file-form";
import { renderDirectoryLetter } from "@/lib/email/directory";
import { sendMorningDispatch } from "@/lib/engine/morning";
import { rule } from "@/lib/engine/rounds";
import { advancePressure, inferVerb, resolveOrder, VERB_COST, type Ctx } from "@/lib/engine/resolve";
import { authorizedDivisions, conditionLabel, conditionMet, contactReports, findInRoster, parseCondition, recordPresence, setDeclaration, type Condition, type Roster } from "@/lib/engine/contacts";
import { episodeOf } from "@/lib/engine/world";
import { growRound, loadLivePlaces, openWorldRequests } from "@/lib/engine/grow";
import { moves as roomMoves, triage as roomTriage } from "@/lib/engine/room";
import { judgeGoals } from "@/lib/game/goal-predicates";
import { campaignForPlayer } from "@/lib/game/cohorts";
import { acceptInvitation, declineInvitation, outstandingInvitations, securityPurge, societyByName } from "@/lib/engine/societies";
import { committeeByName, fileWithCommittee } from "@/lib/game/filing";
import { castNpcVotes } from "@/lib/engine/governance";
import { sendDocumentCopy } from "@/lib/game/transfer";
import { fileResearchBrief } from "@/lib/engine/research";
import { findEquipment, holdingsFor, returnDue, transferHolding, transferUnits } from "@/lib/engine/equipment";
import { informantReports } from "@/lib/engine/informants";
import { activeDirectives, extendByMotion } from "@/lib/engine/directives";
import { cancelStanding, enqueueStanding, fileStanding, listStanding, STANDING_UPKEEP } from "@/lib/engine/standing";
import { applyProxies, giveProxy } from "@/lib/engine/proxies";
import { absenceTick, endLeave, leaveAbstentions, MAX_LEAVE, startLeave } from "@/lib/engine/leave";
import { agreementsOf, announceActive, enforceAgreements, proposeAgreement } from "@/lib/engine/agreements";
import { newMessageId } from "@/lib/email/resend";
import { menuFor, renderFooter, renderHelp, renderReceipt, replyAddress, textToHtml, type DirectoryEntry, type LedgerLine } from "@/lib/engine/dispatch";
import { writeBrief } from "@/lib/admin/brief";

/* Short stable key for a remembered sentence (djb2), so re-runs do not duplicate. */
function hashKey(text: string): string {
  let h = 5381; const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
async function roundNumber(db: SupabaseClient, roundId: string | null): Promise<number | null> {
  if (!roundId) return null;
  const { data } = await db.from("rounds").select("number").eq("id", roundId).maybeSingle();
  return (data?.number as number | undefined) ?? null;
}

type Job = { id: number; kind: string; payload: Record<string, unknown>; attempts: number };

/* Fast work first. A slow model call must never hold up routing, orders or
   receipts (measured 2026-10-12: one extraction claimed in a batch of five
   locked the other four for ten minutes). */
const PRIORITY = ["route", "fetch_body", "grammar", "send", "tick_phase", "morning_dispatch", "npc_reply", "research_brief", "extract"];

/* Claim one job: the highest-priority due job whose lock is free or stale.
   The lock is taken with a conditional update so two workers cannot both win. */
export async function claimNext(db: SupabaseClient): Promise<Job | null> {
  const now = new Date().toISOString();
  const stale = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data } = await db.from("jobs").select("id, kind, payload, attempts, locked_at").is("done_at", null).lte("run_after", now)
    .or(`locked_at.is.null,locked_at.lt.${stale}`).order("id").limit(25);
  const candidates = ((data ?? []) as (Job & { locked_at: string | null })[]).sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind) || a.id - b.id);
  for (const j of candidates) {
    const q = db.from("jobs").update({ locked_at: now }).eq("id", j.id);
    const { data: won } = await (j.locked_at ? q.eq("locked_at", j.locked_at) : q.is("locked_at", null)).select("id");
    if (won?.length) return { id: j.id, kind: j.kind, payload: j.payload, attempts: j.attempts };
  }
  return null;
}

/* Kept for callers that drain in batches; claims one at a time underneath. */
export async function claimJobs(db: SupabaseClient, limit = 5): Promise<Job[]> {
  const out: Job[] = [];
  for (let i = 0; i < limit; i++) { const j = await claimNext(db); if (!j) break; out.push(j); }
  return out;
}

export async function runJob(db: SupabaseClient, job: Job): Promise<void> {
  try {
    const handler = HANDLERS[job.kind];
    if (!handler) throw new Error(`unknown job kind ${job.kind}`);
    await handler(db, job.payload);
    await db.from("jobs").update({ done_at: new Date().toISOString(), locked_at: null }).eq("id", job.id);
  } catch (e) {
    const attempts = job.attempts + 1;
    const backoff = Math.min(60 * 2 ** attempts, 3600) * 1000;
    await db.from("jobs").update({ attempts, error: String((e as Error).message).slice(0, 500), locked_at: null, run_after: new Date(Date.now() + backoff).toISOString(), ...(attempts >= 5 ? { done_at: new Date().toISOString() } : {}) }).eq("id", job.id);
  }
}

/* "Re: Fwd: Your first assignment" → "Your first assignment". */
export function baseSubject(s: string): string {
  return s.replace(/^\s*(?:(?:re|fwd?|aw|sv)\s*(?:\[\d+\])?\s*:\s*)+/i, "").trim();
}

/* The part of a player's letter meant for its reader: the leading "Re:" line,
   the "To:" lines and the clerk's order lines (menu letters, ORDER:, HOLD, VOTE)
   are dropped. Empty when the letter was only orders. */
export function letterBody(text: string): string {
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && (!lines[i].trim() || /^(?:re|subject|subj|to|cc)\s*:/i.test(lines[i].trim()))) i++;
  const kept = lines.slice(i).filter((l) => !/^\s*(?:ORDER\s*:.*|STANDING(?:\s+ORDER)?\s*:.*|CANCEL\s+(?:STANDING|ALL|MY|ORDERS|PROXY).*|(?:REVOKE|WITHDRAW)\s+(?:MY\s+)?PROXY.*|PROXY\s.*|LEAVE(?:\s.*)?|RETURN(?:\s.*)?|TRANSFER\s.*|(?:SEND|GIVE|FORWARD)\s.+\sTO\s.*|FILE\s.+\sWITH\s.*|FORM\s+[A-Z0-9-]+|FALLBACK\s*:.*|AUTHORIZE\s.*|AUTHORISE\s.*|REVOKE\s.*|ATTITUDE\s.*|VOTE\s+\S+\s*:.*|H\.?|HOLD(?:\s+POSITION)?(?:\s+EXCEPT\s.*)?|(?:ORDER\s*:?\s*)?[A-GX](?:\s*[,/ ]\s*[A-GX])*\.?|([A-G])\1\.?)\s*$/i.test(l) && !/^\s*IF\s.+\b(?:THEN\b|:)/.test(l));
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* True when the reply contained only commands (DIRECTORY/HELP), so no receipt is owed. */
function nothingFoundExceptCommands(acts: GrammarAct[]) { return acts.length > 0 && acts.every((a) => a.kind === "command" || a.kind === "form_request" || (a.kind === "order" && a.verb === "freeform" && /\bdirectory\b/i.test(a.args))); }

const ledger = (db: SupabaseClient) => async (r: LedgerRow) => { await db.from("model_ledger").insert({ tag: r.tag, model: r.model, ok: r.ok, status: r.status, ms: r.ms, prompt_tokens: r.usage?.prompt_tokens ?? null, completion_tokens: r.usage?.completion_tokens ?? null, error: r.error }); };

const HANDLERS: Record<string, (db: SupabaseClient, p: Record<string, unknown>) => Promise<void>> = {
  async route(db, p) {
    const id = p.correspondence_id as string;
    const recipients = (p.recipients as { slug?: string; name?: string }[]) ?? [];
    const { data: c } = await db.from("correspondence").select("id, campaign_id, from_address, to_characters, in_reply_to").eq("id", id).single();
    if (!c || c.to_characters?.length) return; // already routed
    // The sender's cohort: their latest character's campaign; the environment's campaign is the last resort.
    let campaign = c.campaign_id as string | null;
    if (!campaign) {
      const { data: pl } = await db.from("players").select("id").eq("email", c.from_address).maybeSingle();
      if (pl) campaign = await campaignForPlayer(db, pl.id as string);
    }
    campaign = campaign ?? process.env.CAMPAIGN_ID ?? null;
    if (!campaign) { await db.from("events").insert({ campaign_id: process.env.CAMPAIGN_ID, kind: "mail.unrouted", payload: { correspondence_id: id, reason: "no cohort" }, idempotency_key: `unrouted:${id}` }).then(() => undefined, () => undefined); return; }
    const to = new Set<string>();
    // Addressed by name (TO: lines) or by legacy per-character mailbox.
    const slugs = recipients.map((r) => r.slug).filter(Boolean) as string[];
    if (slugs.length) {
      const { data: chars } = await db.from("characters").select("id").eq("campaign_id", campaign).in("slug", slugs);
      const { data: aliases } = await db.from("aliases").select("character_id").eq("campaign_id", campaign).in("mailbox", slugs);
      for (const x of chars ?? []) to.add(x.id); for (const x of aliases ?? []) to.add(x.character_id);
    }
    // Names from TO: lines, from the salutation ("Mr. Fisk,"), or a bare
    // address: match on surname against the roster.
    const { data: bodyRow } = await db.from("correspondence").select("body_text").eq("id", id).single();
    const names = [...(recipients.map((r) => r.name).filter(Boolean) as string[]), ...parseSalutation((bodyRow?.body_text as string) ?? "").names];
    if (names.length) {
      const { data: roster } = await db.from("characters").select("id, name, slug").eq("campaign_id", campaign).eq("status", "active");
      for (const name of names) {
        const key = surnameKey(name);
        if (!key) continue;
        const hit = (roster ?? []).find((x) => x.slug === key || surnameKey(x.name) === key || x.name.toLowerCase().includes(key));
        if (hit) to.add(hit.id);
      }
    }
    const { data: sender } = await db.from("players").select("id").eq("email", c.from_address).maybeSingle();
    let from: string | null = null;
    if (sender) { const { data: pc } = await db.from("characters").select("id").eq("campaign_id", campaign).eq("player_id", sender.id).maybeSingle(); from = pc?.id ?? null; }
    // A reply to a letter goes to whoever wrote it. The mail provider replaces
    // our Message-ID with its own, so In-Reply-To rarely matches; fall back to
    // the latest letter from a person to this character under the same subject.
    if (!to.size && c.in_reply_to) {
      const { data: parent } = await db.from("correspondence").select("from_character").eq("message_id", c.in_reply_to).maybeSingle();
      if (parent?.from_character) to.add(parent.from_character);
    }
    if (!to.size && from) {
      const { data: subj } = await db.from("correspondence").select("subject").eq("id", id).single();
      const base = baseSubject((subj?.subject as string | null) ?? "");
      if (base) {
        const { data: parent } = await db.from("correspondence").select("from_character").eq("campaign_id", campaign).eq("direction", "outbound").eq("subject", base)
          .contains("to_characters", [from]).not("from_character", "is", null).neq("from_character", from).order("received_at", { ascending: false }).limit(1).maybeSingle();
        if (parent?.from_character) to.add(parent.from_character as string);
      }
    }
    if (from) to.delete(from); // "Best, Joe" is a signature, not an address
    await db.from("correspondence").update({ to_characters: [...to], from_character: from, campaign_id: campaign }).eq("id", id);
    if (!to.size) { await db.from("events").insert({ campaign_id: campaign, kind: "mail.unrouted", payload: { correspondence_id: id }, idempotency_key: `unrouted:${id}` }); return; }
    const { data: recips } = await db.from("characters").select("id, player_id").in("id", [...to]);
    // Staff answer within a few minutes: long enough to feel like a person, short enough to keep a conversation going.
    for (const n of (recips ?? []).filter((x) => !x.player_id)) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: id, character_id: n.id }, run_after: new Date(Date.now() + (2 + Math.random() * 4) * 60_000).toISOString() });
    // Another player's character gets the letter itself, by inter-office mail.
    if (from && (recips ?? []).some((x) => x.player_id)) await db.from("jobs").insert({ kind: "deliver_letter", payload: { correspondence_id: id } });
  },

  /* A player's letter to other players' characters: copied as an outbound
     letter from the writer's character to each recipient, on the letterhead,
     and sent. Order lines in it were for the clerk and are left out; a reply
     that was only order lines is not a letter. */
  async deliver_letter(db, p) {
    const id = p.correspondence_id as string;
    const key = `delivered:${id}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;
    const { data: c } = await db.from("correspondence").select("campaign_id, round_id, thread_id, message_id, from_character, to_characters, subject, body_text").eq("id", id).single();
    if (!c?.from_character) return;
    const { data: recips } = await db.from("characters").select("id, name, players(email)").in("id", c.to_characters as string[]).not("player_id", "is", null).neq("id", c.from_character);
    const body = letterBody((c.body_text as string) ?? "");
    if (!body || !recips?.length) return;
    const { data: dispatchSubject } = await db.from("correspondence").select("id").eq("campaign_id", c.campaign_id).eq("subject", baseSubject((c.subject as string | null) ?? "")).is("from_character", null).limit(1).maybeSingle();
    // A letter written as a reply to the morning dispatch carries the dispatch's subject; its own "Re:" line wins, and a dispatch subject is never reused.
    const subject = parseSalutation(c.body_text as string).subject ?? (dispatchSubject ? "A letter" : (c.subject as string | null)?.trim() || "A letter");
    const delivered: string[] = [];
    for (const r of recips as unknown as { id: string; name: string; players: { email: string } | null }[]) {
      const email = r.players?.email; if (!email) continue;
      const { data: row, error } = await db.from("correspondence").insert({
        campaign_id: c.campaign_id, thread_id: c.thread_id, round_id: c.round_id, direction: "outbound", message_id: newMessageId(), in_reply_to: c.message_id,
        from_character: c.from_character, to_characters: [r.id], to_addresses: [email], subject, body_text: body,
        raw: { letter_kind: "letter", source: "player", in_reply_to_correspondence: id },
      }).select("id").single();
      if (error) throw new Error(error.message);
      await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
      delivered.push(row.id);
    }
    await db.from("events").insert({ campaign_id: c.campaign_id, round_id: c.round_id, phase: "intake", kind: "letter.delivered", payload: { from: id, copies: delivered }, idempotency_key: key, visible_to: [c.from_character, ...recips.map((r) => r.id)] });
  },

  async grammar(db, p) {
    if (!p.trusted) return; // untrusted senders' acts wait for web confirmation
    const id = p.correspondence_id as string;
    const { data: c } = await db.from("correspondence").select("campaign_id, from_character, from_address, body_text, subject, message_id").eq("id", id).single();
    if (!c?.from_character) throw new Error("sender not yet routed"); // retry after route
    // Always parse from the stored body with the current grammar; the acts in
    // the job payload were parsed at receipt and may be stale.
    const acts: GrammarAct[] = c.body_text ? parseGrammar(c.body_text as string) : ((p.acts as GrammarAct[]) ?? []);
    const { data: openRound } = await db.from("rounds").select("id, number, locks_at").eq("campaign_id", c.campaign_id).eq("status", "open").maybeSingle();
    // Between the lock and the next dispatch there is no open round. Commands and
    // forms still work (the clerk never sleeps); orders wait for the morning.
    const { data: latest } = openRound ? { data: null } : await db.from("rounds").select("id, number, locks_at").eq("campaign_id", c.campaign_id).order("number", { ascending: false }).limit(1).maybeSingle();
    const round = openRound ?? latest;
    if (!round) return;
    const afterLock = !openRound;
    const key = `grammar:${id}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;
    const { data: routed } = await db.from("correspondence").select("to_characters").eq("id", id).single();
    const { data: ch0 } = await db.from("characters").select("name, title, players(email, mail_token, file_token, display_name)").eq("id", c.from_character).single();
    const player0 = (ch0 as { players?: { email: string; mail_token: string; file_token: string | null; display_name: string | null } | null } | null)?.players;

    // A filled-in form: file it deterministically; the office that owns it is told; receipt.
    const form = c.body_text ? parseFormSubmission(c.body_text as string) : null;
    if (form && Object.keys(form.answers).length && formIsKnown(form.form)) {
      await fileForm(db, { campaignId: c.campaign_id, characterId: c.from_character, submission: form, correspondenceId: id, source: "email", toCharacters: (routed?.to_characters as string[] | null) ?? [] });
      if (!acts.length) return; // the form was the letter
    }
    // A letter to a person that carries no order lines is correspondence, not
    // an order packet: no receipt, the addressee answers instead.
    if (!acts.length && (routed?.to_characters as string[] | null)?.length) return;

    await loadLivePlaces(db); // generated places count when an order is priced
    const menu = afterLock ? [] : await menuFor(db, round.id, c.from_character);
    const recorded: string[] = [];
    const ignored: string[] = [];
    const orderRows: { verb: string; args: Record<string, unknown>; label: string; condition?: Condition | null }[] = [];
    let hold = false; const holdExcept: string[] = [];
    const mode = replyMode(c.body_text as string);
    const commands = new Set<string>();
    const episode = episodeOf(round.number);
    const { data: roster0 } = await db.from("characters").select("id, slug, name, player_id").eq("campaign_id", c.campaign_id).eq("status", "active");
    const roster: Roster = (roster0 ?? []).map((x) => ({ id: x.id as string, slug: x.slug as string, name: x.name as string, player: Boolean(x.player_id) }));
    // One order row from a menu letter or an ORDER: line. A free-form order is priced
    // now, by what it asks for (pricing.ts); a named verb at its listed price.
    const rowFor = (t: { kind: "select"; code: string } | { kind: "order"; verb: string; args: string }): { verb: string; args: Record<string, unknown>; label: string } | { error: string } => {
      if (t.kind === "select") {
        const opt = menu.find((o) => o.code === t.code);
        if (!opt) return { error: `${t.code} — not on tonight's list` };
        return { verb: opt.verb, args: { text: opt.args, code: opt.code, cost: opt.cost }, label: `${opt.code}. ${opt.label} (${opt.cost} AU)` };
      }
      const priced = t.verb === "freeform" ? priceFreeform(t.args, episode) : null;
      const cost = priced ? priced.total : t.verb === "requisition" ? (findEquipment(t.args)?.cost ?? VERB_COST.requisition) : (VERB_COST[t.verb] ?? 5);
      return { verb: t.verb, args: { text: t.args, freeform: t.verb === "freeform", cost, ...(priced ? { steps: priced.steps.map((x) => ({ verb: x.verb, clause: x.clause })), travel: priced.travel, price: describePrice(priced) } : {}) }, label: `ORDER: ${t.verb === "freeform" ? t.args : `${t.verb.toUpperCase()}${t.args ? " " + t.args : ""}`} — ${priced ? describePrice(priced) : `${cost} AU`}` };
    };
    for (const a of acts) {
      if (a.kind === "command") { commands.add(a.name); continue; }
      if (a.kind === "form_request") { commands.add(formIsKnown(a.form) ? `form:${a.form}` : "form:unknown"); continue; }
      if (a.kind === "file") {
        // FILE <item> WITH <committee>: evidence before a body. Free; paperwork, not an order.
        const { data: mine } = await db.from("case_items").select("slug, title").eq("character_id", c.from_character).eq("status", "held");
        const want = a.item.toLowerCase();
        const item = (mine ?? []).find((i) => i.slug === want) ?? (mine ?? []).find((i) => (i.title as string).toLowerCase().includes(want));
        const orgName = committeeByName(a.with);
        if (!item) ignored.push(`FILE ${a.item} — nothing in your Case File by that name`);
        else if (!orgName) ignored.push(`FILE ${a.item} WITH ${a.with} — the bodies are the Research Committee, the Safety Committee and the Board`);
        else { const r = await fileWithCommittee(db, { campaignId: c.campaign_id, characterId: c.from_character, itemSlug: item.slug, orgName, round: round.number, roundId: round.id }); recorded.push(r.ok ? `FILED "${r.title}" WITH the ${r.org} (${r.members} members told${r.moved.length ? `; ${r.moved.join(", ")} moved` : ""})` : `FILE ${a.item} — ${r.error}`); }
        continue;
      }
      if (a.kind === "invitation") {
        const open = await outstandingInvitations(db, c.campaign_id, c.from_character);
        const named = a.society ? societyByName(a.society) : null;
        // "the Vigil" may mean the genuine note or Security's; the genuine one wins if both are held.
        const target = open.find((s) => named ? s.name === named.name && s.genuine : true) ?? open.find((s) => named ? s.name === named.name : true) ?? null;
        if (!target) { ignored.push(`${a.answer.toUpperCase()} INVITATION — you hold no open invitation${a.society ? ` from ${a.society}` : ""}`); continue; }
        const { data: me } = await db.from("characters").select("name, slug").eq("id", c.from_character).single();
        if (a.answer === "accept") { const summary = await acceptInvitation(db, { campaignId: c.campaign_id, roundId: round.id, roundNo: round.number, characterId: c.from_character, characterName: me?.name ?? "", characterSlug: me?.slug ?? "", society: target }); recorded.push(`ACCEPTED the invitation from ${target.name} — ${summary}`); }
        else { await declineInvitation(db, { campaignId: c.campaign_id, roundId: round.id, roundNo: round.number, characterId: c.from_character, society: target }); recorded.push(`DECLINED the invitation from ${target.name}`); }
        continue;
      }
      if (a.kind === "elect") {
        // VOTE E-77-001: <colleague>: a seat election; plurality of cohort votes; a later vote replaces the earlier.
        const { data: em } = await db.from("motions").select("id, number, status, closes_round, opens_round").eq("campaign_id", c.campaign_id).eq("number", a.motion).maybeSingle();
        if (!em || em.status !== "open" || Number(em.opens_round) > round.number) { ignored.push(`VOTE ${a.motion} — no open election by that number`); continue; }
        const { data: cohort } = await db.from("characters").select("id, name, slug").eq("campaign_id", c.campaign_id).eq("status", "active").not("player_id", "is", null);
        const ck = surnameKey(a.candidate);
        const cand = (cohort ?? []).find((x) => x.slug === ck || surnameKey(x.name) === ck || x.name.toLowerCase().includes(ck));
        if (!cand) { ignored.push(`VOTE ${a.motion}: ${a.candidate} — no one in your cohort by that name`); continue; }
        await db.from("election_votes").upsert({ motion_id: em.id, voter_id: c.from_character, candidate_id: cand.id, cast_round: round.number, source: "email_grammar", source_ref: id }, { onConflict: "motion_id,voter_id" });
        recorded.push(`VOTE ${em.number}: ${cand.name}${cand.id === c.from_character ? " (yourself)" : ""} — closes at the lock of Round ${em.closes_round}`);
        continue;
      }
      if (a.kind === "send") {
        // SEND <item> TO <person>: a copy into their cabinet, with a cover letter. Free; not an order.
        const { data: mine } = await db.from("case_items").select("slug, title").eq("character_id", c.from_character).eq("status", "held");
        const want = a.item.toLowerCase();
        const item = (mine ?? []).find((i) => i.slug === want) ?? (mine ?? []).find((i) => (i.title as string).toLowerCase().includes(want));
        const { data: roster2 } = await db.from("characters").select("id, name, slug").eq("campaign_id", c.campaign_id).eq("status", "active").neq("id", c.from_character);
        const key2 = surnameKey(a.to);
        const who = (roster2 ?? []).find((x) => x.slug === key2 || surnameKey(x.name) === key2 || x.name.toLowerCase().includes(key2));
        if (!item) ignored.push(`SEND ${a.item} — nothing in your Case File by that name`);
        else if (!who) ignored.push(`SEND ${a.item} TO ${a.to} — no one in the directory by that name`);
        else { const r = await sendDocumentCopy(db, { campaignId: c.campaign_id, fromCharacterId: c.from_character, toCharacterId: who.id, itemSlug: item.slug, round: round.number }); recorded.push(r.ok ? `SENT "${r.title}" to ${who.name}${r.already ? " (they already held a copy)" : ""}` : `SEND ${a.item} — ${r.error}`); }
        continue;
      }
      if (a.kind === "order" && a.verb === "freeform" && /\bdirectory\b/i.test(a.args)) { commands.add("directory"); continue; }
      if (a.kind === "agreement") {
        // AGREEMENT: "<title>" WITH <names> + TERMS: lines: numbered, parties told, in force on the last ACCEPT (agreements.ts).
        const { data: me } = await db.from("characters").select("name").eq("id", c.from_character).single();
        const r = await proposeAgreement(db, { campaignId: c.campaign_id, roundId: round.id, round: round.number, correspondenceId: id, proposer: { id: c.from_character, name: me?.name ?? "" }, name: a.name, withNames: a.withNames, termTexts: a.terms, kind: a.agreementKind, roster });
        if (r.ok) recorded.push(r.line); else ignored.push(`AGREEMENT "${a.name}" — ${r.error}`);
        continue;
      }
      if (a.kind === "leave") {
        // LEAVE <rounds>: away on purpose from tonight's lock, up to MAX_LEAVE rounds; tonight's orders are set aside.
        const lv = await startLeave(db, { campaignId: c.campaign_id, characterId: c.from_character, round: round.number, rounds: a.rounds });
        const { data: pk0 } = await db.from("order_packets").select("id").eq("round_id", round.id).eq("character_id", c.from_character).maybeSingle();
        if (pk0) { await db.from("orders").delete().eq("packet_id", pk0.id).eq("status", "pending"); await db.from("order_packets").delete().eq("id", pk0.id); }
        recorded.push(`ON LEAVE from tonight through the lock of Round ${lv.until} (${Math.min(MAX_LEAVE, Math.max(1, a.rounds))} round${a.rounds === 1 ? "" : "s"}) — your desk, holdings and seat are kept; a seat abstains; informants wait; staff stop expecting replies. RETURN, or any order, brings you back early.`);
        continue;
      }
      if (a.kind === "return") {
        recorded.push((await endLeave(db, c.campaign_id, c.from_character)) ? "RETURNED from leave — expected at your desk from tonight" : "RETURN — you were not on leave");
        continue;
      }
      if (a.kind === "proxy") {
        // PROXY <ballot> TO <member>: free; the holder is told; applied at the close unless the giver votes (proxies.ts).
        const { data: me } = await db.from("characters").select("name, slug").eq("id", c.from_character).single();
        const r = await giveProxy(db, { campaignId: c.campaign_id, roundId: round.id, round: round.number, motionNumber: a.motion, giver: { id: c.from_character, name: me?.name ?? "", slug: me?.slug ?? "" }, to: a.to, roster });
        if (r.ok) recorded.push(r.line); else ignored.push(`PROXY ${a.motion} — ${r.error}`);
        continue;
      }
      if (a.kind === "standing") {
        // STANDING ORDER: <order> (or a doubled menu letter): filed once, run every night until CANCEL STANDING <n>.
        const r = rowFor(a.then);
        if ("error" in r) { ignored.push(`STANDING ORDER ${a.then.kind === "select" ? a.then.code : a.then.args} — ${r.error}`); continue; }
        const so = await fileStanding(db, { campaignId: c.campaign_id, characterId: c.from_character, round: round.number, verb: r.verb, args: { ...r.args, code: undefined }, label: r.label.replace(/\s+—\s+[^—]*$/, "") });
        recorded.push(`STANDING ${so.seq}: ${so.label} — ${Number(r.args.cost ?? 5)} AU tonight, then ${STANDING_UPKEEP} AU a round until CANCEL STANDING ${so.seq}; suspended on a night you send nothing`);
        continue;
      }
      if (a.kind === "cancel_standing") {
        const so = await cancelStanding(db, c.from_character, a.seq, round.number);
        if (so) recorded.push(`CANCELLED STANDING ${so.seq}: ${so.label}`); else ignored.push(`CANCEL STANDING ${a.seq} — no standing order by that number`);
        continue;
      }
      if (a.kind === "cancel_orders") {
        const { data: pk0 } = await db.from("order_packets").select("id").eq("round_id", round.id).eq("character_id", c.from_character).maybeSingle();
        if (pk0) { await db.from("orders").delete().eq("packet_id", pk0.id).eq("status", "pending"); await db.from("order_packets").delete().eq("id", pk0.id); }
        recorded.push(`CANCELLED tonight's orders — nothing is on file for Round ${round.number}${pk0 ? "" : " (nothing was)"}`);
        continue;
      }
      if (a.kind === "conditional") {
        // IF <trigger> THEN <order>: filed with its condition; judged after the night's first pass; units back if it never fires.
        const pc = parseCondition(a.trigger, { roster, episode });
        if ("error" in pc) { ignored.push(`IF ${a.trigger} — ${pc.error}`); continue; }
        const r = rowFor(a.then);
        if ("error" in r) { ignored.push(`IF ${pc.label} THEN ${a.then.kind === "select" ? a.then.code : a.then.args} — ${r.error}`); continue; }
        orderRows.push({ verb: r.verb, args: { ...r.args, conditional: true, condition_label: pc.label }, condition: pc.condition, label: `IF ${pc.label} THEN ${r.label} — held until the condition is met; units returned if it is not` });
        continue;
      }
      if (a.kind === "declare") {
        // AUTHORIZE / REVOKE / ATTITUDE: standing, free, never disclosed to the person named.
        const who = findInRoster(a.to, roster.filter((x) => x.player && x.id !== c.from_character));
        if (!who) { ignored.push(`${a.what.toUpperCase()} ${a.to} — no one in your cohort by that name`); continue; }
        const d = await setDeclaration(db, { campaignId: c.campaign_id, from: c.from_character, to: who.id, round: round.number }, a.what === "authorize" ? { authorized: true } : a.what === "revoke" ? { authorized: false, attitude: "neutral" } : { attitude: a.attitude ?? "neutral" });
        recorded.push(a.what === "authorize" ? `AUTHORIZED ${who.name} — may pull your department's files as if one of you, until you REVOKE; they are not told`
          : a.what === "revoke" ? `REVOKED ${who.name} — no longer pulls your department's files; they are not told`
          : `ATTITUDE ${who.name}: ${d.attitude.toUpperCase()} — ${d.attitude === "friendly" ? "may pull your department's files, and your watch lets them pass" : d.attitude === "hostile" ? "any sighting of them in your reports goes to Security the same night; any authorization is withdrawn" : "nothing automatic either way"}; they are not told`);
        continue;
      }
      if (a.kind === "select") {
        if (a.code === "X") continue; // X is the free-form prompt, not an option
        const r = rowFor(a);
        if ("error" in r) { ignored.push(r.error); continue; }
        orderRows.push(r);
      } else if (a.kind === "order") {
        const r = rowFor(a);
        if ("error" in r) { ignored.push(r.error); continue; }
        orderRows.push(r);
      } else if (a.kind === "hold") { hold = true; if (a.except) holdExcept.push(...a.except); }
      else if (a.kind === "vote") {
        const { data: m } = await db.from("motions").select("id, status, number, opens_round").eq("campaign_id", c.campaign_id).eq("number", a.motion).maybeSingle();
        if (m?.status === "open" && Number(m.opens_round) <= round.number) { await db.from("votes").upsert({ motion_id: m.id, character_id: c.from_character, choice: a.choice, cast_round: round.number, source: "email_grammar", source_ref: id }, { onConflict: "motion_id,character_id" }); recorded.push(`VOTE ${m.number}: ${a.choice.toUpperCase()}`); }
        else ignored.push(`VOTE ${a.motion} — no open ballot by that number`);
      } else if (a.kind === "accept" || a.kind === "reject") {
        const { data: ag } = await db.from("agreements").select("id, accepted_by, parties, status").eq("campaign_id", c.campaign_id).eq("title", a.agreement).maybeSingle();
        if (ag && ag.status === "proposed" && ag.parties.includes(c.from_character)) {
          if (a.kind === "reject") await db.from("agreements").update({ status: "withdrawn" }).eq("id", ag.id);
          else { const accepted = [...new Set([...ag.accepted_by, c.from_character])]; const active = accepted.length >= ag.parties.length; await db.from("agreements").update({ accepted_by: accepted, status: active ? "active" : "proposed" }).eq("id", ag.id); if (active) await announceActive(db, c.campaign_id, round.id, round.number, ag.id as string); }
          recorded.push(`${a.kind.toUpperCase()} AGREEMENT ${a.agreement}${a.kind === "accept" ? ([...new Set([...ag.accepted_by, c.from_character])].length >= ag.parties.length ? " — every party has accepted; it is in force from tonight" : " — waiting on the other parties") : " — withdrawn"}`);
        }
      } else if (a.kind === "transfer" || a.kind === "transfer_holding") {
        // TRANSFER <n> AU TO <name> / TRANSFER <item> TO <name>: free, at once; the receiver is told (equipment.ts).
        const who = findInRoster(a.to, roster.filter((x) => x.id !== c.from_character));
        const { data: me2 } = await db.from("characters").select("name").eq("id", c.from_character).single();
        if (!who) { ignored.push(`TRANSFER … TO ${a.to} — no one in the directory by that name`); continue; }
        if (a.kind === "transfer") {
          const cap = Number(await rule(db, c.campaign_id, "au.cap", 60));
          const r = await transferUnits(db, { campaignId: c.campaign_id, round: round.number, from: { id: c.from_character, name: me2?.name ?? "" }, to: { id: who.id, name: who.name, player: who.player }, amount: a.amount, cap });
          if (r.ok) recorded.push(`TRANSFERRED ${r.moved} AU to ${who.name}${r.kept ? ` (${r.kept} kept: they were at the cap)` : ""}`); else ignored.push(`TRANSFER ${a.amount} AU TO ${a.to} — ${r.error}`);
        } else {
          const r = await transferHolding(db, { campaignId: c.campaign_id, round: round.number, from: { id: c.from_character, name: me2?.name ?? "" }, to: { id: who.id, name: who.name, slug: who.slug, player: who.player }, text: a.item });
          if (r.ok) recorded.push(`TRANSFERRED the ${r.name.toLowerCase()} to ${who.name} — it is under their Holdings now, and in the log`); else ignored.push(`TRANSFER ${a.item} TO ${a.to} — ${r.error}; for a document, use SEND`);
        }
      }
    }

    // A reply that says "also" adds to the packet; any other reply replaces it.
    const nothingFound = !orderRows.length && !hold && !recorded.length && !ignored.length && !commands.size;
    let replaced = false; const added: string[] = [];
    if (afterLock && (orderRows.length || hold)) {
      // Orders after the lock are not taken; say so once and keep the commands.
      ignored.push(...orderRows.map((r) => `${r.label} — orders closed for Round ${round.number}; the morning dispatch opens the next`));
      if (hold) ignored.push(`HOLD — orders closed for Round ${round.number}`);
      orderRows.length = 0; hold = false;
    }
    if ((orderRows.length || hold) && !acts.some((a) => a.kind === "leave") && (await endLeave(db, c.campaign_id, c.from_character))) recorded.push("RETURNED from leave — any order brings you back");
    if (orderRows.length || hold) {
      // A hold with only conditional orders is still a hold: watchful, +5 AU, and the trip-wires stand.
      const unconditional = orderRows.filter((r) => !r.condition);
      const exceptIds: string[] = []; const exceptNames: string[] = [];
      for (const nm of holdExcept) { const who = findInRoster(nm, roster.filter((x) => x.id !== c.from_character)); if (who) { exceptIds.push(who.id); exceptNames.push(who.name); } else ignored.push(`HOLD EXCEPT ${nm} — no one in the directory by that name`); }
      const { data: packet } = await db.from("order_packets").upsert({ round_id: round.id, character_id: c.from_character, mode: hold && !unconditional.length ? "hold" : "orders", source: "email", watch_except: exceptIds }, { onConflict: "round_id,character_id" }).select("id").single();
      if (packet) {
        const { data: existing } = await db.from("orders").select("id, seq, verb, args, condition").eq("packet_id", packet.id).eq("status", "pending").order("seq");
        const keep = mode === "append" ? (existing ?? []) : [];
        if (mode !== "append" && (existing ?? []).length) { await db.from("orders").delete().eq("packet_id", packet.id).eq("status", "pending"); replaced = true; }
        const fresh = orderRows.filter((r) => !keep.some((k) => (k.args as { code?: string }).code && (k.args as { code?: string }).code === (r.args as { code?: string }).code && Boolean(k.condition) === Boolean(r.condition)));
        if (fresh.length) await db.from("orders").insert(fresh.map((r, i) => ({ packet_id: packet.id, seq: keep.length + i + 1, verb: r.verb, args: r.args, condition: r.condition ?? null })));
        if (mode === "append") {
          added.push(...fresh.map((r) => r.label));
          for (const r of orderRows.filter((r) => !fresh.includes(r))) ignored.push(`${r.label} — already on file`);
        }
        if (hold) recorded.push(unconditional.length || keep.some((k) => !k.condition) ? "HOLD — noted, but orders are on file, so they take precedence" : `HOLD — conserving; watchful at your desk${exceptNames.length ? ` (letting ${exceptNames.join(", ")} pass)` : ""}; +5 AU in the morning`);
      }
    }
    // The full list now on file, labelled from the menu where possible.
    const { data: pk } = await db.from("order_packets").select("id, mode").eq("round_id", round.id).eq("character_id", c.from_character).maybeSingle();
    const { data: rows } = pk ? await db.from("orders").select("verb, args, condition").eq("packet_id", pk.id).eq("status", "pending").order("seq") : { data: [] };
    const onFile = (rows ?? []).map((r) => {
      const a = r.args as { code?: string; text?: string; freeform?: boolean; cost?: number; price?: string; conditional?: boolean; condition_label?: string };
      const opt = a.code ? menu.find((o) => o.code === a.code) : null;
      const inner = opt ? `${opt.code}. ${opt.label} (${opt.cost} AU)` : a.freeform ? `ORDER: ${a.text} — ${a.price ?? "cost ruled in the morning"}` : `ORDER: ${r.verb.toUpperCase()} ${a.text ?? ""}`.trim();
      return a.conditional ? `IF ${a.condition_label ?? conditionLabel(r.condition as Condition)} THEN ${inner} — held until the condition is met` : inner;
    });
    // Action Units: menu costs are known; free-form orders are priced at intake
    // (older ones carry the flat estimate). Orders are funded in the order given;
    // the first one that does not fit, and everything after it, is unfunded.
    const FREEFORM_EST = 5;
    const { data: au } = await db.from("resources").select("balance").eq("character_id", c.from_character).eq("kind", "au").maybeSingle();
    const balance = Number(au?.balance ?? 0);
    let spent = 0;
    const ledger: LedgerLine[] = (rows ?? []).map((r) => {
      const a = r.args as { code?: string; freeform?: boolean; cost?: number; text?: string; conditional?: boolean };
      const opt = a.code ? menu.find((o) => o.code === a.code) : null;
      const cost = opt ? opt.cost : Number(a.cost ?? FREEFORM_EST);
      const label = `${a.conditional ? "IF… " : ""}${opt ? `${opt.code}. ${opt.label}` : `ORDER: ${(a.text ?? "").slice(0, 40)}${(a.text ?? "").length > 40 ? "…" : ""}`}`;
      const funded = spent + cost <= balance; if (funded) spent += cost;
      return { label, cost, estimated: !opt && a.cost === undefined, funded };
    });
    if (pk && ledger.some((l) => !l.funded)) {
      // Flag unfunded orders on the rows so the lock phase skips them unless changed.
      for (const [i, r] of (rows ?? []).entries()) await db.from("orders").update({ args: { ...(r.args as object), funded: ledger[i].funded } }).eq("packet_id", pk.id).eq("seq", i + 1);
    }
    if (pk?.mode === "hold" && !onFile.length) onFile.push("HOLD — conserving");
    await db.from("events").insert({ campaign_id: c.campaign_id, round_id: round.id, phase: "intake", kind: "grammar.recorded", payload: { acts, mode, added, replaced, ignored, onFile, recorded }, idempotency_key: key, visible_to: [c.from_character] });

    // The receipt. Count the lines that were not acts as notes.
    const bodyLines = (c.body_text as string).split(/\r?\n/);
    const continued = new Set(bodyLines.flatMap((l, i) => (/^ORDER\s*:/i.test(l.trim()) ? orderContinuation(bodyLines, i) : [])));
    const noteLines = bodyLines.map((l) => l.trim()).filter((l, i) => l && !continued.has(i) && !l.startsWith(">") && parseGrammar(l).length === 0 && !/^(?:—|--|on .* wrote:)/i.test(l)).length;
    const { data: ch } = await db.from("characters").select("name, players(email, mail_token, display_name)").eq("id", c.from_character).single();
    const player = (ch as { players?: { email: string; mail_token: string; display_name: string | null } | null } | null)?.players;
    if (player?.email) {
      const first = (player.display_name || ch?.name || "there").split(" ")[0];
      const lockAt = afterLock ? "the next lock; orders reopen with the morning dispatch at 9:00 AM Eastern" : new Date(round.locks_at).toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", weekday: "long" }) + " Eastern";
      const from = replyAddress(player.mail_token);
      const reSubject = /^re:/i.test(c.subject ?? "") ? (c.subject as string) : `Re: ${c.subject ?? `Orders — Round ${round.number}`}`;
      if (commands.has("help")) {
        const text = renderHelp(first);
        await sendMail({ to: player.email, from, replyTo: from, subject: "What the clerk reads", text, html: textToHtml(text), inReplyTo: c.message_id ?? undefined });
      }
      if (commands.has("directory")) {
        const { data: chars } = await db.from("characters").select("slug, name, title, player_id, status, division_id, npc_state, divisions(name)").eq("campaign_id", c.campaign_id).eq("status", "active").order("name");
        type Row = { slug: string; name: string; title: string | null; player_id: string | null; division_id: string | null; npc_state: { letterhead?: { place?: string } | null; listed?: boolean } | null; divisions: { name: string } | { name: string }[] | null };
        const entry = (x: Row): DirectoryEntry => ({ name: x.name, title: x.title, division: Array.isArray(x.divisions) ? x.divisions[0]?.name ?? null : x.divisions?.name ?? (x.npc_state?.letterhead?.place ?? null), address: `${x.slug}@${process.env.EMAIL_DOMAIN || "weird.delivery"}` });
        // npc_state.listed === false keeps a character out of the directory (a correspondent players must discover).
        const all = ((chars ?? []) as unknown as Row[]).filter((x) => x.npc_state?.listed !== false);
        const cohort = all.filter((x) => x.player_id).map(entry);
        const staff = all.filter((x) => !x.player_id && x.division_id).map(entry);
        const offCampus = all.filter((x) => !x.player_id && !x.division_id).map(entry);
        const { data: orgs } = await db.from("organizations").select("name, kind").eq("campaign_id", c.campaign_id).in("kind", ["council", "committee"]);
        const dir = renderDirectoryLetter({ first, to: { name: ch?.name ?? first, title: (ch0 as { title?: string | null } | null)?.title ?? null }, date: gameDate(round.number), cohort, staff, offCampus, committees: (orgs ?? []).map((o) => o.name), mailbox: gameMailbox().address, links: letterLinks(player0?.file_token) });
        await sendMail({ to: player.email, from, replyTo: from, subject: dir.subject, text: dir.text, html: dir.html, inReplyTo: c.message_id ?? undefined });
      }
      for (const cmd of commands) {
        if (!cmd.startsWith("form:")) continue;
        const fid = cmd.slice(5);
        if (fid === "unknown") {
          const text = `${first},\n\nNo form by that number is in use. The forms currently in use are: ${Object.values(FORMS).map((f) => `Form ${f.id} (${f.owner})`).join("; ")}. Reply FORM and the number to receive a blank.\n\n— The Department\n\n${renderFooter()}`;
          await sendMail({ to: player.email, from, replyTo: from, subject: "No such form", text, html: textToHtml(text), inReplyTo: c.message_id ?? undefined });
          continue;
        }
        const { data: me } = await db.from("characters").select("id, campaign_id, division_id, supervisor_id, created_at, divisions(name)").eq("id", c.from_character).single();
        const pt = me ? await particulars(db, me) : null;
        const deptName = (me?.divisions as unknown as { name: string } | null)?.name;
        const particularsLine = pt ? [`Badge ${pt.badge}`, deptName, pt.supervisor ? `Supervisor: ${pt.supervisor.name}${pt.supervisor.title ? `, ${pt.supervisor.title}` : ""}` : null].filter(Boolean).join(" · ") : null;
        const letter = blankFormLetter(fid, { particulars: particularsLine, to: { name: ch?.name ?? first, title: (ch0 as { title?: string | null } | null)?.title ?? null }, date: gameDate(round.number), fileToken: player0?.file_token ?? null, links: letterLinks(player0?.file_token) });
        const { html, text } = renderLetter(letter);
        await sendMail({ to: player.email, from, replyTo: from, subject: letter.subject, text, html, inReplyTo: c.message_id ?? undefined });
      }
      if (commands.has("resign")) {
        await db.from("characters").update({ status: "retired" }).eq("id", c.from_character);
        const text = `${first},\n\nYour resignation is recorded. Your character is retired at the next lock and you will receive no further dispatches. The Department thanks you for your service and asks that you remember the confidentiality agreement.\n\n— Personnel & Administration, Royce Industries\n\nIf this was a mistake, write to thedepartment@weird.delivery.`;
        await sendMail({ to: player.email, from, replyTo: from, subject: "Resignation recorded", text, html: textToHtml(text), inReplyTo: c.message_id ?? undefined });
        return;
      }
      if (!(commands.size && nothingFoundExceptCommands(acts))) {
        const text = renderReceipt({ first, round: round.number, onFile: [...onFile, ...(await listStanding(db, c.from_character)).map((s) => `STANDING ${s.seq}: ${s.label} — ${s.last_run_round === null ? `${Number((s.args as { cost?: number }).cost ?? 5)} AU tonight` : `${STANDING_UPKEEP} AU a round`}; CANCEL STANDING ${s.seq} ends it`), ...recorded.filter((r) => /^(VOTE|HOLD|ACCEPT|REJECT|SENT|SEND|ACCEPTED|DECLINED|FILED|FILE |AUTHORIZED|REVOKED|ATTITUDE|CANCELLED|PROXY|ON LEAVE|RETURN|TRANSFERRED|AGREEMENT)/.test(r)), ...(await agreementsOf(db, c.campaign_id, c.from_character)).map((l) => `AGREEMENT ${l}`)], added, replaced, ignored, notes: noteLines, lockAt, nothingFound, ledger, balance });
        await sendMail({ to: player.email, from, replyTo: from, subject: reSubject, text, html: textToHtml(text), inReplyTo: c.message_id ?? undefined });
      }
    }
  },

  async fetch_body(db, p) {
    const id = p.correspondence_id as string;
    const full = await fetchReceived(String(p.email_id ?? ""));
    if (!full || !full.text) throw new Error("body not available yet"); // retried with backoff
    const bodyText = stripQuoted(full.text);
    const { data: c } = await db.from("correspondence").select("auth").eq("id", id).single();
    await db.from("correspondence").update({ body_text: bodyText, body_html: full.html, in_reply_to: full.headers["in-reply-to"] ?? null, auth: { ...(c?.auth ?? {}), provider: full.authentication ?? null } }).eq("id", id);
    const acts = parseGrammar(bodyText);
    await db.from("jobs").insert([
      { kind: "grammar", payload: { correspondence_id: id, acts, trusted: Boolean(p.trusted) } },
      { kind: "extract", payload: { correspondence_id: id } },
    ]);
  },

  async extract(db, p) {
    const id = p.correspondence_id as string;
    const { data: c } = await db.from("correspondence").select("id, subject, body_text, from_character, to_characters, round_id").eq("id", id).single();
    if (!c) return;
    const { count } = await db.from("correspondence_events").select("id", { count: "exact", head: true }).eq("correspondence_id", id);
    if (count) return; // already extracted
    const system = `You read one email from a player in a 1977 corporate-intrigue correspondence game and list the game-relevant things it does. You never decide anything; you propose. Output JSON: {"events":[{"kind":"claim|proposal|offer|threat|promise|info_share|vote_intent|order_intent","payload":{},"confidence":0..1,"span":"quoted text"}]}. Claims are what the sender asserts as fact (payload: {subject, claim}). Proposals/offers are deals (payload: {to, give, get, conditions}). Promises are commitments (payload: {to, what, by}). vote_intent and order_intent are only when the sender clearly means to act but did not use the formal grammar (payload: {what}). Be conservative: fewer, surer events.`;
    const { data, result } = await chatJson<{ events: { kind: string; payload: unknown; confidence: number; span: string }[] }>([{ role: "system", content: system }, { role: "user", content: `SUBJECT: ${c.subject ?? ""}\n\n${c.body_text.slice(0, 6000)}` }], { tag: "extract", maxTokens: 1500, timeoutMs: 110_000, onLedger: ledger(db) });
    const events = (data?.events ?? []).filter((e) => e && e.kind && typeof e.confidence === "number");
    if (!events.length) return;
    await db.from("correspondence_events").insert(events.map((e) => ({ correspondence_id: id, kind: e.kind, payload: e.payload ?? {}, confidence: Math.max(0, Math.min(1, e.confidence)), span: e.span ?? null, provenance: { model: result.model, usage: result.usage }, requires_confirmation: e.kind === "vote_intent" || e.kind === "order_intent" })));
    // What the recipients were told, so a staff character remembers it next time.
    const told = events.filter((e) => ["claim", "info_share", "promise", "offer", "threat", "proposal"].includes(e.kind));
    const recipients = (c.to_characters as string[] | null) ?? [];
    if (c.from_character && told.length && recipients.length) {
      const roundNo = await roundNumber(db, c.round_id as string | null);
      const { data: from } = await db.from("characters").select("slug, name").eq("id", c.from_character).single();
      const rows = recipients.flatMap((rid) => told.map((e) => {
        const text = e.span || JSON.stringify(e.payload);
        return { character_id: rid, fact_key: `told:${from?.slug ?? "unknown"}:${hashKey(text)}`, value: { kind: e.kind, text, from: c.from_character, from_name: from?.name ?? null, round: roundNo }, confidence: Math.max(0, Math.min(1, e.confidence)), source_kind: "told", source_ref: id, learned_round: roundNo };
      }));
      await db.from("knowledge").insert(rows);
    }
  },

  async npc_reply(db, p) {
    const id = p.correspondence_id as string; const npcId = p.character_id as string;
    const key = `npc_reply:${id}:${npcId}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;
    const { data: c } = await db.from("correspondence").select("campaign_id, thread_id, round_id, from_character, from_address, subject, body_text, message_id").eq("id", id).single();
    if (!c?.from_character) throw new Error("sender not yet routed");
    const { data: npc } = await db.from("characters").select("id, slug, name, title, npc_state, divisions(name)").eq("id", npcId).single();
    const { data: pc } = await db.from("characters").select("id, slug, name, title, sheet, public_profile, divisions(name), players(email)").eq("id", c.from_character).single();
    if (!npc || !pc) throw new Error("character missing");
    const dept = (x: { divisions?: { name: string } | { name: string }[] | null }) => Array.isArray(x.divisions) ? x.divisions[0]?.name ?? null : x.divisions?.name ?? null;
    const playerEmail = (pc as { players?: { email: string } | { email: string }[] | null }).players;
    const email = Array.isArray(playerEmail) ? playerEmail[0]?.email : playerEmail?.email;
    if (!email) return; // nothing to send to
    const { data: round } = c.round_id ? await db.from("rounds").select("number").eq("id", c.round_id).maybeSingle() : await db.from("rounds").select("number").eq("campaign_id", c.campaign_id).order("number", { ascending: false }).limit(1).maybeSingle();
    const roundNo = round?.number ?? 1;
    // Other letters from this writer that this person has not answered yet
    // (their reply jobs are still pending) are answered in the same letter, so
    // two quick letters do not get two replies saying the same thing. Each is
    // claimed by its idempotency key; a claim lost to another worker is left out.
    // In-person visits and filled-in forms keep replies of their own.
    const { data: pending } = await db.from("jobs").select("payload").eq("kind", "npc_reply").is("done_at", null).contains("payload", { character_id: npcId });
    const pendingIds = (pending ?? []).map((j) => (j.payload as { correspondence_id: string }).correspondence_id).filter((x) => x !== id);
    const { data: others } = pendingIds.length
      ? await db.from("correspondence").select("id, subject, body_text, received_at, raw").in("id", pendingIds).eq("from_character", c.from_character).order("received_at")
      : { data: [] };
    const merged: { id: string; subject: string | null; body_text: string; received_at: string }[] = [];
    const isPlainLetter = (x: { body_text: string; raw: unknown }) => !(x.raw as { letter_kind?: string } | null)?.letter_kind && !Object.keys(parseFormSubmission(x.body_text ?? "")?.answers ?? {}).length;
    const { data: cSelf } = await db.from("correspondence").select("received_at, raw").eq("id", id).single();
    if (isPlainLetter({ body_text: c.body_text as string, raw: cSelf?.raw })) {
      for (const o of (others ?? []) as { id: string; subject: string | null; body_text: string; received_at: string; raw: unknown }[]) {
        if (!isPlainLetter(o)) continue;
        const { error: lost } = await db.from("events").insert({ campaign_id: c.campaign_id, round_id: c.round_id, phase: "intake", kind: "npc.reply_merged", payload: { letter: o.id, into: id, npc: npc.slug }, idempotency_key: `npc_reply:${o.id}:${npcId}` });
        if (!lost) merged.push(o);
      }
    }
    let replied = false;
    try {
      const batch = [...merged, { id, subject: c.subject as string | null, body_text: c.body_text as string, received_at: cSelf?.received_at as string }].sort((a, b) => a.received_at.localeCompare(b.received_at));
      // Earlier letters between the two: the latest six, oldest first.
      const { data: prior } = await db.from("correspondence").select("from_character, body_text, received_at").eq("campaign_id", c.campaign_id).not("id", "in", `(${batch.map((b) => b.id).join(",")})`).or("raw->>letter_kind.is.null,raw->>letter_kind.neq.initiative")
        .or(`and(from_character.eq.${c.from_character},to_characters.cs.{${npcId}}),and(from_character.eq.${npcId},to_characters.cs.{${c.from_character}})`).order("received_at", { ascending: false }).limit(6);
      const thread = (prior ?? []).reverse().map((x) => ({ from: x.from_character === npcId ? npc.name : pc.name, body: (x.body_text as string).slice(0, 1200) }));
      const salute = parseSalutation(c.body_text as string);
      const dossier = await loadDossier(db, { name: npc.name, title: npc.title, department: dept(npc), sheet: (npc.npc_state as CastSheet | null) ?? null });
      // What this character remembers: said (to whom) and heard (from this writer).
      const { data: known } = await db.from("knowledge").select("source_kind, value").eq("character_id", npcId).in("source_kind", ["stated", "told"]).order("created_at").limit(60);
      type KV = { kind?: string; text: string; to?: string; to_name?: string; from?: string };
      const memory: Memory = { saidToThisPerson: [], saidToOthers: [], heardFromThisPerson: [], filed: [] };
      const { data: filedEv } = await db.from("events").select("payload").eq("campaign_id", c.campaign_id).eq("kind", "form.filed").contains("payload", { character: pc.id });
      for (const f of filedEv ?? []) { const v = f.payload as { form: string; index: string; missing?: number[] }; memory.filed!.push(`Form ${v.form} (${v.index})${v.missing?.length ? ", incomplete" : ""}`); }
      const thisForm = parseFormSubmission(c.body_text as string);
      const { data: cRaw } = await db.from("correspondence").select("raw").eq("id", id).single();
      const letterKind = (cRaw?.raw as { letter_kind?: string } | null)?.letter_kind;
      const inPerson = letterKind === "interview";
      const recruitKind = letterKind === "recruit"; const informantKind = letterKind === "informant";
      const agreed = Boolean((cRaw?.raw as { agreed?: boolean } | null)?.agreed);
      const formNote = recruitKind
        ? `this was not a letter: the writer came to see you in person and asked you to pass along what you see and hear, for a consideration each week. ${agreed ? "You agreed, for your own reasons; say so in your own way, say what you can and cannot be expected to pass on, and name nothing you never put in writing." : "You are Corporate Security; you did not agree, and you have reported the approach. Write the short, civil note you would send them the next morning that gives nothing away about what you did."} Four to eight lines.`
        : informantKind
        ? `this is not a letter: you have been informing for this person since Round ${(cRaw?.raw as { since?: number } | null)?.since ?? "?"}, for a consideration. Write this week's note in your own voice: what you saw from your post (the clerk's lines above are what you actually saw; use them, name the names), what you heard, and nothing you never put in writing. If there was nothing, say so in a line and ask for the consideration anyway. Two to six lines, no greeting beyond a word.`
        : letterKind === "initiative"
        ? `this is not a letter from them: it is the note above, from the showrunner, that you have decided to write to this person first. They have not written to you. Write that first letter: why you are writing, what you want, and nothing beyond what the day allows. Do not thank them for a letter they did not send.`
        : inPerson
        ? `this was not a letter: the writer came to see you in person last night and asked what the line above says. Write the short note you would send them the next morning about that conversation: what you were willing to say to their face, and nothing you would not put on paper. If you would send nothing, write one line saying so.`
        : thisForm && Object.keys(thisForm.answers).length ? `this letter is a completed Form ${thisForm.form}; the clerk has filed it and sent the writer a receipt${thisForm.missing.length ? `; questions ${thisForm.missing.join(", ")} were left unanswered` : ""}. You may acknowledge it, pick at an answer, or ask for what is missing.` : null;
      for (const k of (known ?? []) as { source_kind: string; value: KV }[]) {
        if (k.source_kind === "stated") { if (k.value.to === pc.id) memory.saidToThisPerson.push(k.value.text); else memory.saidToOthers.push({ to: k.value.to_name ?? "a colleague", text: k.value.text }); }
        else if (k.value.from === pc.id) memory.heardFromThisPerson.push(k.value.text);
      }
      const letter = batch.length > 1
        ? { subject: baseSubject(batch[batch.length - 1].subject ?? "") || null, body: batch.map((b, i) => `[Letter ${i + 1} of ${batch.length}${b.subject ? `, subject: ${baseSubject(b.subject)}` : ""}]\n${b.body_text}`).join("\n\n"), date: gameDate(roundNo), formNote: `the writer sent you these ${batch.length} letters before you answered any of them. Answer them together in one letter; say each thing once.` }
        : { subject: salute.subject ?? (c.subject as string | null), body: c.body_text as string, date: gameDate(roundNo), formNote };
      const reply = await generateStaffReply({ dossier, player: { name: pc.name, title: pc.title, department: dept(pc), badge: badgeNumber(pc.id), bio: bioForPrompt(bioFrom(pc.sheet, pc.public_profile)) }, letter, thread, round: roundNo, memory, onLedger: ledger(db) });
      const { data: row, error } = await db.from("correspondence").insert({
        campaign_id: c.campaign_id, thread_id: c.thread_id, round_id: c.round_id, direction: "outbound", message_id: newMessageId(), in_reply_to: c.message_id,
        from_character: npcId, to_characters: [c.from_character], to_addresses: [email], subject: reply.subject, body_text: reply.body,
        raw: { letter_kind: "letter", model: reply.model, guarded: reply.guarded, rejected: reply.rejected, shared: reply.shared, wants: reply.wants, in_reply_to_correspondence: id, ...(merged.length ? { answers: batch.map((b) => b.id) } : {}) },
      }).select("id").single();
      if (error) throw new Error(error.message);
      await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
      replied = true;
      // A recorded conversation: what they put in writing is also a transcript in the player's Case File (equipment.ts).
      if ((cRaw?.raw as { recorded?: boolean } | null)?.recorded) await db.from("case_items").upsert({ campaign_id: c.campaign_id, character_id: pc.id, slug: `transcript-${npc.slug}-r${roundNo}`, kind: "testimony", drawer: "documents", title: `Transcript: ${npc.name}, ${gameDate(roundNo)}`, from_label: npc.name, written_label: gameDate(roundNo), body: `*Cassette, transcribed by ${pc.name}. The machine was on the desk; ${npc.name} knew it was there.*\n\n${reply.body}`, round_received: roundNo, how_obtained: `Recorded in person by ${pc.name}.`, copy_note: "The tape is yours.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug" });
      // Memory: the character remembers what they said and asked; the player's character now knows what they were told.
      const said = [...reply.shared.map((text) => ({ kind: "shared", text })), ...(reply.wants ? [{ kind: "asked", text: reply.wants }] : [])];
      if (said.length) {
        await db.from("knowledge").insert([
          ...said.map((s) => ({ character_id: npcId, fact_key: `stated:${pc.slug}:${hashKey(s.text)}`, value: { ...s, to: pc.id, to_name: pc.name, round: roundNo }, confidence: 1, source_kind: "stated", source_ref: row.id, learned_round: roundNo })),
          ...reply.shared.map((text) => ({ character_id: pc.id, fact_key: `told:${npc.slug}:${hashKey(text)}`, value: { kind: "info_share", text, from: npcId, from_name: npc.name, round: roundNo }, confidence: 0.6, source_kind: "told", source_ref: row.id, learned_round: roundNo })),
        ]);
      }
      await db.from("events").insert({ campaign_id: c.campaign_id, round_id: c.round_id, phase: "intake", kind: "npc.replied", payload: { to: id, reply: row.id, npc: npc.slug, model: reply.model, guarded: reply.guarded, shared: reply.shared, wants: reply.wants, ...(merged.length ? { answers: batch.map((b) => b.id) } : {}) }, idempotency_key: key, visible_to: [c.from_character] });
    } catch (e) {
      // No reply was queued: give the merged letters back so their own jobs (or this one's retry) answer them.
      if (merged.length && !replied) await db.from("events").delete().in("idempotency_key", merged.map((m) => `npc_reply:${m.id}:${npcId}`));
      throw e;
    }
  },

  async tick_phase(db, p) {
    const roundId = p.round_id as string; const phase = p.phase as string;
    const key = `phase:${roundId}:${phase}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;
    const { data: round } = await db.from("rounds").select("campaign_id, number, episode_round").eq("id", roundId).single();
    if (!round) throw new Error("round missing");
    if (phase === "validate") {
      // Missed-turn defaults: every active player character without a packet gets mode=missed.
      const { data: chars } = await db.from("characters").select("id").eq("campaign_id", round.campaign_id).eq("status", "active").not("player_id", "is", null);
      for (const ch of chars ?? []) await db.from("order_packets").upsert({ round_id: roundId, character_id: ch.id, mode: "missed", source: "default" }, { onConflict: "round_id,character_id", ignoreDuplicates: true });
      // Absence: the streak, leave at three, reassignment at seven; voluntary leaves run out (leave.ts).
      const absence = await absenceTick(db, { campaignId: round.campaign_id, id: roundId, number: round.number });
      await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "absence.ticked", payload: absence, idempotency_key: `absence:${roundId}` });
      // Standing orders join the night's packets before funding (standing.ts); a missed turn suspends them.
      const standing = await enqueueStanding(db, { campaignId: round.campaign_id, id: roundId, number: round.number });
      await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "standing.queued", payload: standing, idempotency_key: `standing:${roundId}` });
      // Funding at the lock: orders are paid for in the order given; the first that does not fit, and the rest, are skipped.
      const holdBonus = Number(await rule(db, round.campaign_id, "au.hold_bonus", 5));
      const { data: packets } = await db.from("order_packets").select("id, character_id, mode, orders(id, seq, args, status, condition, standing)").eq("round_id", roundId);
      for (const pk of packets ?? []) {
        const { data: au } = await db.from("resources").select("balance").eq("character_id", pk.character_id).eq("kind", "au").maybeSingle();
        let balance = Number(au?.balance ?? 0); let spent = 0;
        const orders = ((pk.orders ?? []) as { id: string; seq: number; args: { cost?: number }; status: string; condition: unknown; standing: boolean }[]).filter((o) => o.status === "pending").sort((a, b) => a.seq - b.seq);
        for (const o of orders) {
          const cost = Number(o.args?.cost ?? 5);
          if (spent + cost <= balance) { spent += cost; await db.from("orders").update({ status: "reserved", cost: { au: cost } }).eq("id", o.id); }
          else await db.from("orders").update({ status: "skipped", ruling: "beyond your balance at the lock" }).eq("id", o.id);
        }
        if (pk.mode === "hold" && !orders.some((o) => !o.condition && !o.standing)) balance += holdBonus;   // conditional and standing orders do not spoil a hold
        balance -= spent;
        await db.from("resources").upsert({ character_id: pk.character_id, kind: "au", balance }, { onConflict: "character_id,kind" });
      }
      // The gaps tonight's funded orders opened, for the grow phase.
      await openWorldRequests(db, { id: roundId, campaignId: round.campaign_id, number: round.number });
    }
    if (phase === "grow") {
      await growRound(db, { id: roundId, campaignId: round.campaign_id, number: round.number }, ledger(db));
    }
    if (phase === "triage" || phase === "moves") {
      // The Showrunner's Room. Never blocks the night: an error here is logged and the phase is done.
      const r = { id: roundId, campaignId: round.campaign_id, number: round.number, episodeRound: round.episode_round ?? round.number };
      try { const out = phase === "triage" ? await roomTriage(db, r, ledger(db)) : await roomMoves(db, r, ledger(db)); await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: `room.${phase}`, payload: out, idempotency_key: `room:${roundId}:${phase}` }); }
      catch (e) { await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "room.error", payload: { phase, error: (e as Error).message.slice(0, 300) }, idempotency_key: `room:${roundId}:${phase}:error` }); }
    }
    if (phase === "strategic") {
      await loadLivePlaces(db);
      const episode = episodeOf(round.number);
      // Each funded order meets the verb rules; the outcome is written down for the morning.
      const { data: packets } = await db.from("order_packets").select("id, character_id, characters(id, slug, name, clearance, title, specialization, divisions(slug))").eq("round_id", roundId);
      type Live = { id: string; ctx: Ctx };
      const live: Live[] = [];
      const directives = await activeDirectives(db, round.campaign_id, round.number);
      for (const pk of packets ?? []) {
        const chRaw = (Array.isArray(pk.characters) ? pk.characters[0] : pk.characters) as { id: string; slug: string; name: string; clearance: number; title: string | null; specialization: string | null; divisions: { slug: string } | { slug: string }[] | null } | null;
        if (!chRaw) continue;
        const division = (Array.isArray(chRaw.divisions) ? chRaw.divisions[0]?.slug : chRaw.divisions?.slug) ?? null;
        const { data: socs } = await db.from("memberships").select("organizations!inner(name, kind)").eq("character_id", chRaw.id).eq("organizations.kind", "society");
        const societies = (socs ?? []).map((m) => { const o = (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) as { name: string }; return /Vigil/.test(o.name) ? "vigil" : /Congregation/.test(o.name) ? "congregation" : o.name; });
        // Files a colleague's AUTHORIZE or friendship opens (contacts.ts).
        const authorized = await authorizedDivisions(db, round.campaign_id, chRaw.id);
        const holdings = await holdingsFor(db, chRaw.id);
        const { data: loc } = await db.from("facts").select("value").eq("campaign_id", round.campaign_id).eq("key", `location.${chRaw.id}`).maybeSingle();
        live.push({ id: pk.id as string, ctx: { campaignId: round.campaign_id, roundId, roundNo: round.number, episodeRound: round.episode_round ?? round.number, episode, directives, character: { id: chRaw.id, slug: chRaw.slug, name: chRaw.name, clearance: chRaw.clearance, division, title: chRaw.title, societies, authorizedDivisions: authorized, holdings, specialization: chRaw.specialization, location: (loc?.value as { slug: string; name: string; round: number } | null) ?? null } } });
      }
      const credit = async (characterId: string, refund: number) => {
        if (!refund) return;
        const { data: au } = await db.from("resources").select("balance").eq("character_id", characterId).eq("kind", "au").maybeSingle();
        await db.from("resources").upsert({ character_id: characterId, kind: "au", balance: Number(au?.balance ?? 0) + refund }, { onConflict: "character_id,kind" });
      };
      // One order: resolve, record the outcome and the presence it leaves, return the refund.
      const run = async (pk: Live, o: { id: string; seq: number; verb: string; args: Record<string, unknown> }, fired: string | null): Promise<number> => {
        const chId = pk.ctx.character.id;
        try {
          const out = await resolveOrder(db, pk.ctx, { id: o.id, verb: o.verb, args: o.args });
          const summary = fired ? `Because ${fired}: ${out.summary}` : out.summary;
          await db.from("orders").update({ status: "resolved", ruling: summary, args: { ...o.args, outcome: { ...out, summary } } }).eq("id", o.id);
          await recordPresence(db, { campaignId: round.campaign_id, roundId, characterId: chId }, out.presence ?? []);
          if (out.kind === "requisitioned") pk.ctx.character.holdings = await holdingsFor(db, chId);   // the next order of the night has it
          await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "order.resolved", payload: { order_id: o.id, verb: out.verb, kind: out.kind, target: out.target, learned: out.learned, refund: out.refund, fired }, idempotency_key: `order:${o.id}:resolved`, visible_to: [chId] });
          return out.refund;
        } catch (e) {
          const cost = Number((o.args as { cost?: number }).cost ?? 5);
          await db.from("orders").update({ status: "resolved", ruling: `The clerk could not carry this out (${(e as Error).message.slice(0, 80)}); units returned.`, args: { ...o.args, outcome: { kind: "ruling", summary: "could not be carried out; units returned", refund: cost, learned: [], verb: o.verb, target: null } } }).eq("id", o.id);
          return cost;
        }
      };
      // Pass zero: every PROTECT, so a guard laid tonight stops a theft attempted tonight (rulebook §6.6: defend first).
      type Row = { id: string; seq: number; verb: string; args: Record<string, unknown> };
      // Guards and trips go first: protection laid tonight holds tonight; a traveller is there before anything else happens.
      const FIRST = new Set(["protect", "travel"]);
      const isGuard = (o: Row) => FIRST.has(o.verb) || FIRST.has((o.args.steps as { verb: string }[] | undefined)?.[0]?.verb ?? "") || (o.verb === "freeform" && !(o.args.steps as unknown[] | undefined)?.length && FIRST.has(inferVerb(String(o.args.text ?? "")).verb));
      const unconditional = new Map<string, Row[]>();
      for (const pk of live) {
        const { data: orders } = await db.from("orders").select("id, seq, verb, args").eq("packet_id", pk.id).eq("status", "reserved").is("condition", null).order("seq");
        unconditional.set(pk.id, (orders ?? []) as Row[]);
        let refund = 0;
        for (const o of unconditional.get(pk.id)!.filter(isGuard)) refund += await run(pk, o, null);
        await credit(pk.ctx.character.id, refund);
      }
      // Pass one: every other unconditional order, in the order given.
      for (const pk of live) {
        let refund = 0;
        for (const o of unconditional.get(pk.id)!.filter((o) => !isGuard(o))) refund += await run(pk, o, null);
        await credit(pk.ctx.character.id, refund);
      }
      // Pass two: conditional orders, judged against the first pass (the presence
      // ledger, the record, tonight's ballots). A fired order cannot trigger another:
      // two trip-wires set against each other both stay quiet.
      for (const pk of live) {
        const { data: all } = await db.from("orders").select("id, seq, verb, args, status, condition").eq("packet_id", pk.id).order("seq");
        const packet = (all ?? []).map((o) => ({ seq: o.seq as number, status: o.status as string, condition: o.condition, outcome: ((o.args as { outcome?: { kind: string } }).outcome) ?? null }));
        let refund = 0;
        for (const o of (all ?? []).filter((x) => x.status === "reserved" && x.condition)) {
          const c = o.condition as Condition;
          const { met, because } = await conditionMet(db, { campaignId: round.campaign_id, roundId, roundNo: round.number, me: pk.ctx.character.id, packet, seq: o.seq as number }, c);
          if (met) {
            await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "condition.fired", payload: { order_id: o.id, condition: conditionLabel(c), because, round: round.number }, idempotency_key: `fired:${o.id}`, visible_to: [pk.ctx.character.id] });
            refund += await run(pk, o as { id: string; seq: number; verb: string; args: Record<string, unknown> }, conditionLabel(c));
          } else {
            const cost = Number((o.args as { cost?: number }).cost ?? 5);
            const summary = `Held against "${conditionLabel(c)}", which did not come about (${because}). Nothing was done; units returned.`;
            await db.from("orders").update({ status: "skipped", ruling: summary, args: { ...(o.args as object), outcome: { kind: "ruling", summary, refund: cost, learned: [], verb: o.verb, target: null } } }).eq("id", o.id);
            refund += cost;
          }
        }
        await credit(pk.ctx.character.id, refund);
      }
      // Who saw whom tonight, and what the watchful learned.
      const contacts = await contactReports(db, { campaignId: round.campaign_id, id: roundId, number: round.number, episode });
      await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "contacts.reported", payload: contacts, idempotency_key: `contacts:${roundId}` });
    }
    if (phase === "diplomatic") {
      // Formal agreements: carry out what can be carried out; mark breaches (agreements.ts).
      const ag = await enforceAgreements(db, { campaignId: round.campaign_id, id: roundId, number: round.number });
      await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "agreements.enforced", payload: ag, idempotency_key: `agreements:${roundId}` });
    }
    if (phase === "world") {
      // The pressure clock: a tier is reached at the lock of its band's last round unless mitigated.
      await advancePressure(db, round.campaign_id, roundId, round.episode_round ?? round.number, episodeOf(round.number));
      // Security's purge, at the lock of Episode 3 day 7.
      if (episodeOf(round.number) === 3 && (round.episode_round ?? round.number) === 7) await securityPurge(db, round.campaign_id, { id: roundId, number: round.number });
      // Personal Goals: judged by the record every night; unmet ones fail at the episode's last lock.
      const perEpisode = Number(await rule(db, round.campaign_id, "episode.rounds", 14));
      await judgeGoals(db, { campaignId: round.campaign_id, roundId, roundNo: round.number, episode: episodeOf(round.number, perEpisode), episodeRound: round.episode_round ?? round.number, perEpisode });
      // Loans run out: a truck or a badge goes back on its own (equipment.ts).
      await returnDue(db, round.campaign_id, round.number);
      // Informants: upkeep, lapses, and tonight's note from each (informants.ts).
      const inf = await informantReports(db, { campaignId: round.campaign_id, id: roundId, number: round.number });
      await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "informants.reported", payload: inf, idempotency_key: `informants:${roundId}` });
      // Income: every active player character draws the round's Action Units, to the cap.
      const per = Number(await rule(db, round.campaign_id, "au.per_round", 20)); const cap = Number(await rule(db, round.campaign_id, "au.cap", 60));
      const { data: chars } = await db.from("characters").select("id").eq("campaign_id", round.campaign_id).eq("status", "active").not("player_id", "is", null);
      for (const ch of chars ?? []) {
        const { data: au } = await db.from("resources").select("balance").eq("character_id", ch.id).eq("kind", "au").maybeSingle();
        await db.from("resources").upsert({ character_id: ch.id, kind: "au", balance: Math.min(cap, Number(au?.balance ?? 0) + per), cap }, { onConflict: "character_id,kind" });
      }
    }
    if (phase === "governance") {
      const { data: motions } = await db.from("motions").select("id, number, title, kind, campaign_id, threshold, organization_id, finding, organizations(name, slug)").eq("campaign_id", round.campaign_id).eq("status", "open").lte("closes_round", round.number);
      for (const m of motions ?? []) {
        if ((m as { kind?: string }).kind === "election") {
          // Plurality of cohort votes cast; ties to the earliest-created candidate; the winner is seated with clearance 2.
          const { data: ev } = await db.from("election_votes").select("candidate_id").eq("motion_id", m.id);
          const tally = new Map<string, number>();
          for (const v of ev ?? []) tally.set(v.candidate_id as string, (tally.get(v.candidate_id as string) ?? 0) + 1);
          const { data: cands } = tally.size ? await db.from("characters").select("id, name, created_at, clearance").in("id", [...tally.keys()]) : { data: [] };
          const ranked = (cands ?? []).sort((x, y) => (tally.get(y.id as string)! - tally.get(x.id as string)!) || (x.created_at as string).localeCompare(y.created_at as string));
          const winner = ranked[0] ?? null;
          if (winner) {
            await db.from("memberships").upsert({ organization_id: m.organization_id, character_id: winner.id, role: "Employee representative", voting_weight: 1, since_round: round.number }, { onConflict: "organization_id,character_id" });
            if (Number(winner.clearance) < 2) await db.from("characters").update({ clearance: 2 }).eq("id", winner.id);
          }
          await db.from("motions").update({ status: winner ? "passed" : "failed" }).eq("id", m.id);
          const { data: everyone } = await db.from("characters").select("id").eq("campaign_id", round.campaign_id).not("player_id", "is", null);
          await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "election.closed", payload: { motion_id: m.id, number: m.number, title: m.title, winner: winner?.id ?? null, winner_name: winner?.name ?? null, votes: Object.fromEntries([...tally.entries()]), cast: (ev ?? []).length }, idempotency_key: `election:${m.id}:closed`, visible_to: (everyone ?? []).map((c) => c.id) });
          continue;
        }
        // Directors who have not voted vote by their lean; only members' votes count; quorum is half the seats.
        await castNpcVotes(db, m, round.number);
        // Proxies: givers who did not vote follow their holder (proxies.ts).
        await applyProxies(db, { campaignId: round.campaign_id, motionId: m.id as string, motionNumber: m.number as string | null, round: round.number });
        await leaveAbstentions(db, { campaignId: round.campaign_id, motionId: m.id as string, organizationId: m.organization_id as string, round: round.number });
        const { data: members } = await db.from("memberships").select("character_id").eq("organization_id", m.organization_id);
        const memberIds = new Set((members ?? []).map((x) => x.character_id as string));
        const { data: votes } = await db.from("votes").select("character_id, choice, weight").eq("motion_id", m.id);
        const counted = (votes ?? []).filter((v) => memberIds.has(v.character_id as string));
        const seats = memberIds.size;
        const forW = counted.filter((v) => v.choice === "for").reduce((n, v) => n + Number(v.weight), 0);
        const againstW = counted.filter((v) => v.choice === "against").reduce((n, v) => n + Number(v.weight), 0);
        const t = m.threshold as { method: string; fraction?: number };
        const quorum = counted.length >= Math.ceil(seats / 2);
        const passed = quorum && (t.method === "majority_of_seats" ? forW > seats / 2 : t.method === "supermajority" ? forW >= (t.fraction ?? 0.67) * (forW + againstW) && forW > 0 : forW > againstW);
        await db.from("motions").update({ status: passed ? "passed" : "failed" }).eq("id", m.id);
        // A passed Safety motion naming an emergency directive extends it (directives.ts).
        const orgRow = (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) as { name: string; slug: string } | null;
        const extended = await extendByMotion(db, round.campaign_id, { number: m.number as string | null, title: m.title as string, passed, orgSlug: orgRow?.slug ?? null }, round.number);
        if (extended) await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "directive.extended", payload: { directive: extended, motion: m.number }, idempotency_key: `extended:${m.id}` });
        const { data: everyone } = await db.from("characters").select("id").eq("campaign_id", round.campaign_id).not("player_id", "is", null);
        // A finding: what the body is held to have established by this decision. Recorded for the engine, told to every player.
        const fdef = (m as { finding?: { claim: string; on: "passed" | "failed" | "either"; text: string; false_text?: string } | null }).finding ?? null;
        let findingText: string | null = null;
        if (fdef && (fdef.on === "either" || (fdef.on === "passed") === passed)) {
          const org = (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) as { name: string; slug: string } | null;
          const established = fdef.on === "either" ? passed : true;
          findingText = established ? fdef.text : (fdef.false_text ?? `the ${org?.name ?? "body"} declined to find ${fdef.text}`);
          await db.from("facts").upsert({ campaign_id: round.campaign_id, key: `finding.${fdef.claim}`, value: { established, by: org?.slug ?? null, motion: m.number, round: round.number, text: findingText }, established_round: round.number, secret: false }, { onConflict: "campaign_id,key" });
          if ((everyone ?? []).length) await db.from("knowledge").insert((everyone ?? []).map((c) => ({ character_id: c.id, fact_key: `finding.${fdef.claim}`, value: { established, text: findingText, by: org?.name ?? null, motion: m.number, round: round.number }, confidence: 1, source_kind: "dispatch", learned_round: round.number })));
        }
        await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "motion.closed", payload: { motion_id: m.id, number: m.number, title: m.title, passed, for: forW, against: againstW, seats, quorum, abstain: counted.filter((v) => v.choice === "abstain").length, finding: findingText }, idempotency_key: `motion:${m.id}:closed`, visible_to: (everyone ?? []).map((c) => c.id) });
      }
    }
    if (phase === "send") {
      await db.from("rounds").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", roundId);
      const { data: next } = await db.from("rounds").select("id").eq("campaign_id", round.campaign_id).eq("number", round.number + 1).maybeSingle();
      if (next) await db.from("rounds").update({ status: "open" }).eq("id", next.id);
    }
    // strategic / world / narrate / diplomatic: rules land here as the Rules Lawyer task is promoted.
    await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "phase.done", payload: {}, idempotency_key: key });
  },

  /* RESEARCH: the librarian's brief, drafted under the Skeptic and filed in the Case File (research.ts). */
  async research_brief(db, p) {
    await fileResearchBrief(db, { campaignId: p.campaign_id as string, roundId: (p.round_id as string | null) ?? null, roundNo: Number(p.round ?? 1), characterId: p.character_id as string, subject: String(p.subject ?? ""), slug: String(p.slug ?? ""), orderId: (p.order_id as string | null) ?? null }, ledger(db));
  },

  async player_brief(db, p) {
    await writeBrief(db, p.brief_id as string);
  },

  async morning_dispatch(db, p) {
    await sendMorningDispatch(db, { roundId: p.round_id as string, characterId: p.character_id as string }, ledger(db));
  },

  /* Deliver an outbound correspondence row: one message per recipient, each in
     the game's letterhead with that player's own file link, and a reply address
     carrying their own seal so their answer is trusted. Progress is recorded per
     recipient, so a retry never mails anyone twice. */
  async approve_application(db, p) { await approveApplication(db, p.application_id as string); },
  async first_memo(db, p) { await firstMemo(db, p.application_id as string); },

  async send(db, p) {
    const id = p.correspondence_id as string;
    const { data: c } = await db.from("correspondence").select("*").eq("id", id).single();
    if (!c || c.direction !== "outbound" || c.raw?.sent) return;
    const sentTo: string[] = c.raw?.sent_to ?? [];
    const resendIds: string[] = c.raw?.resend_ids ?? [];
    const { data: from } = c.from_character
      ? await db.from("characters").select("slug, name, title, division_id, npc_state, divisions(name)").eq("id", c.from_character).maybeSingle()
      : { data: null };
    const sender = from as { slug: string; name: string; title: string | null; division_id: string | null; npc_state: { letterhead?: { name: string; place: string } | null } | null; divisions: { name: string } | null } | null;
    // An outsider (no division) writes on their own paper, not Royce's.
    const outsider = sender && !sender.division_id ? (sender.npc_state?.letterhead ?? { name: sender.name, place: "North Dakota" }) : ((c.raw?.letterhead as { name: string; place: string } | null) ?? null);
    const { data: round } = c.round_id
      ? await db.from("rounds").select("number, episode_round, episodes(number)").eq("id", c.round_id).maybeSingle()
      : { data: null };
    const r = round as { number: number; episode_round: number | null; episodes: { number: number } | null } | null;

    const addresses = (c.to_addresses as string[]).map((a) => a.toLowerCase()).filter((a) => !sentTo.includes(a));
    const { data: players } = addresses.length ? await db.from("players").select("id, email, file_token, mail_token").in("email", addresses) : { data: [] };
    const { data: recips } = (c.to_characters as string[])?.length ? await db.from("characters").select("name, title, player_id").in("id", c.to_characters) : { data: [] };
    const kind = (c.raw?.letter_kind as LetterKind | undefined) ?? (sender ? "letter" : r ? "dispatch" : "notice");

    for (const addr of addresses) {
      const pl = ((players ?? []) as { id: string; email: string; file_token: string; mail_token: string }[]).find((x) => x.email === addr);
      const to = ((recips ?? []) as { name: string; title: string | null; player_id: string | null }[]).find((x) => pl && x.player_id === pl.id);
      const common = {
        to: to ? { name: to.name, title: to.title } : null,
        date: r ? gameDate(r.number) : null,
        round: kind === "dispatch" && r ? { number: r.number, episode: r.episodes?.number ?? null, episodeRound: r.episode_round } : null,
        links: letterLinks(pl?.file_token),
      };
      const { html, text } = c.body_html
        ? { html: c.body_html as string, text: c.body_text as string }
        : kind === "letter" && sender && !outsider
          ? await renderTemplate(db, "letter", { subject: c.subject ?? "(no subject)", body: c.body_text, sender_name: sender.name, sender_title: sender.title ?? sender.divisions?.name ?? "", name: to?.name, title: to?.title }, common.links,
              { ...common, ...(c.raw?.classification ? { classification: c.raw.classification as string } : {}) })
          : renderLetter({
              kind,
              label: outsider ? "Correspondence" : undefined,
              letterhead: outsider,
              subject: c.subject ?? "(no subject)",
              from: sender ? { name: sender.name, title: sender.title, department: outsider ? null : sender.divisions?.name } : (c.raw?.office as { office: string; department?: string } | null) ? { name: (c.raw.office as { office: string }).office, department: (c.raw.office as { department?: string }).department ?? "Royce Industries" } : { name: "Personnel & Administration", department: "Royce Industries" },
              classification: (c.raw?.classification as string | undefined) ?? null,
              ...splitSections(c.body_text as string),
              signature: sender ? { name: sender.name, title: sender.title } : null,
              ...common,
            });
      const first = !sentTo.length;
      // One mailbox for the whole game: the in-game sender is in the letterhead; the
      // reply address carries the player's seal so their answer is trusted.
      const res = await sendMail({
        to: addr,
        replyTo: pl ? gameMailbox().reply(pl.mail_token) : undefined,
        subject: c.subject ?? "(no subject)",
        text, html,
        messageId: first ? c.message_id ?? undefined : undefined,
        inReplyTo: c.in_reply_to ?? undefined,
      });
      if (res.error) throw new Error(res.error);
      sentTo.push(addr);
      if (res.id) resendIds.push(res.id);
      await db.from("correspondence").update({ raw: { ...(c.raw ?? {}), sent_to: sentTo, resend_ids: resendIds }, ...(first ? { message_id: res.messageId } : {}) }).eq("id", id);
    }
    await db.from("correspondence").update({ raw: { ...(c.raw ?? {}), sent: true, sent_to: sentTo, resend_ids: resendIds } }).eq("id", id);
  },
};
