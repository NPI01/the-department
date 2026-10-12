/* The job worker. Drains `jobs` in small idempotent batches. Each handler must
   be safe to run twice: it checks for the effect before applying it.
   Kinds:
     route       resolve a correspondence row's recipients to characters
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
import { renderTemplate } from "@/lib/email/template-store";
import { approveApplication, firstMemo } from "./onboarding";
import { fetchReceived, parseGrammar, parseSalutation, replyMode, stripQuoted, surnameKey, type GrammarAct } from "@/lib/email/inbound";
import { generateStaffReply, loadDossier } from "@/lib/engine/npc";
import { newMessageId } from "@/lib/email/resend";
import { menuFor, renderDirectory, renderReceipt, replyAddress, textToHtml, type DirectoryEntry, type LedgerLine } from "@/lib/engine/dispatch";
import { writeBrief } from "@/lib/admin/brief";

type Job = { id: number; kind: string; payload: Record<string, unknown>; attempts: number };

/* Fast work first. A slow model call must never hold up routing, orders or
   receipts (measured 2026-10-12: one extraction claimed in a batch of five
   locked the other four for ten minutes). */
const PRIORITY = ["route", "fetch_body", "grammar", "send", "tick_phase", "npc_reply", "extract"];

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

/* True when the reply contained only commands (DIRECTORY/HELP), so no receipt is owed. */
function nothingFoundExceptCommands(acts: GrammarAct[]) { return acts.length > 0 && acts.every((a) => a.kind === "command" || (a.kind === "order" && a.verb === "freeform" && /\bdirectory\b/i.test(a.args))); }

const ledger = (db: SupabaseClient) => async (r: LedgerRow) => { await db.from("model_ledger").insert({ tag: r.tag, model: r.model, ok: r.ok, status: r.status, ms: r.ms, prompt_tokens: r.usage?.prompt_tokens ?? null, completion_tokens: r.usage?.completion_tokens ?? null, error: r.error }); };

const HANDLERS: Record<string, (db: SupabaseClient, p: Record<string, unknown>) => Promise<void>> = {
  async route(db, p) {
    const id = p.correspondence_id as string;
    const recipients = (p.recipients as { slug?: string; name?: string }[]) ?? [];
    const { data: c } = await db.from("correspondence").select("id, campaign_id, from_address, to_characters, in_reply_to").eq("id", id).single();
    if (!c || c.to_characters?.length) return; // already routed
    const campaign = c.campaign_id ?? process.env.CAMPAIGN_ID;
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
    // A reply to a letter goes to whoever wrote it.
    if (!to.size && c.in_reply_to) {
      const { data: parent } = await db.from("correspondence").select("from_character").eq("message_id", c.in_reply_to).maybeSingle();
      if (parent?.from_character) to.add(parent.from_character);
    }
    const { data: sender } = await db.from("players").select("id").eq("email", c.from_address).maybeSingle();
    let from: string | null = null;
    if (sender) { const { data: pc } = await db.from("characters").select("id").eq("campaign_id", campaign).eq("player_id", sender.id).maybeSingle(); from = pc?.id ?? null; }
    await db.from("correspondence").update({ to_characters: [...to], from_character: from, campaign_id: campaign }).eq("id", id);
    if (!to.size) { await db.from("events").insert({ campaign_id: campaign, kind: "mail.unrouted", payload: { correspondence_id: id }, idempotency_key: `unrouted:${id}` }); return; }
    // NPC recipients get a reply job; the model answers in the next dispatch window.
    const { data: npcs } = await db.from("characters").select("id").in("id", [...to]).is("player_id", null);
    // Staff answer within a few minutes: long enough to feel like a person, short enough to keep a conversation going.
    for (const n of npcs ?? []) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: id, character_id: n.id }, run_after: new Date(Date.now() + (2 + Math.random() * 4) * 60_000).toISOString() });
  },

  async grammar(db, p) {
    if (!p.trusted) return; // untrusted senders' acts wait for web confirmation
    const id = p.correspondence_id as string;
    const { data: c } = await db.from("correspondence").select("campaign_id, from_character, from_address, body_text, subject, message_id").eq("id", id).single();
    if (!c?.from_character) throw new Error("sender not yet routed"); // retry after route
    // Always parse from the stored body with the current grammar; the acts in
    // the job payload were parsed at receipt and may be stale.
    const acts: GrammarAct[] = c.body_text ? parseGrammar(c.body_text as string) : ((p.acts as GrammarAct[]) ?? []);
    const { data: round } = await db.from("rounds").select("id, number, locks_at").eq("campaign_id", c.campaign_id).eq("status", "open").maybeSingle();
    if (!round) return; // no open round: acts are ignored, dispatch will say so
    const key = `grammar:${id}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;
    // A letter to a person that carries no order lines is correspondence, not
    // an order packet: no receipt, the addressee answers instead.
    const { data: routed } = await db.from("correspondence").select("to_characters").eq("id", id).single();
    if (!acts.length && (routed?.to_characters as string[] | null)?.length) return;

    const menu = await menuFor(db, round.id, c.from_character);
    const recorded: string[] = [];
    const ignored: string[] = [];
    const orderRows: { verb: string; args: Record<string, unknown>; label: string }[] = [];
    let hold = false;
    const mode = replyMode(c.body_text as string);
    const commands = new Set<string>();
    for (const a of acts) {
      if (a.kind === "command") { commands.add(a.name); continue; }
      if (a.kind === "order" && a.verb === "freeform" && /\bdirectory\b/i.test(a.args)) { commands.add("directory"); continue; }
      if (a.kind === "select") {
        const opt = menu.find((o) => o.code === a.code);
        if (a.code === "X") continue; // X is the free-form prompt, not an option
        if (!opt) { ignored.push(`${a.code} — not on tonight's list`); continue; }
        orderRows.push({ verb: opt.verb, args: { text: opt.args, code: opt.code, cost: opt.cost }, label: `${opt.code}. ${opt.label} (${opt.cost} AU)` });
      } else if (a.kind === "order") {
        orderRows.push({ verb: a.verb, args: { text: a.args, freeform: a.verb === "freeform" }, label: `ORDER: ${a.verb === "freeform" ? a.args : `${a.verb.toUpperCase()}${a.args ? " " + a.args : ""}`} — cost ruled in the morning` });
      } else if (a.kind === "hold") hold = true;
      else if (a.kind === "vote") {
        const { data: m } = await db.from("motions").select("id, status, number").eq("campaign_id", c.campaign_id).eq("number", a.motion).maybeSingle();
        if (m?.status === "open") { await db.from("votes").upsert({ motion_id: m.id, character_id: c.from_character, choice: a.choice, cast_round: round.number, source: "email_grammar", source_ref: id }, { onConflict: "motion_id,character_id" }); recorded.push(`VOTE ${m.number}: ${a.choice.toUpperCase()}`); }
        else ignored.push(`VOTE ${a.motion} — no open ballot by that number`);
      } else if (a.kind === "accept" || a.kind === "reject") {
        const { data: ag } = await db.from("agreements").select("id, accepted_by, parties, status").eq("campaign_id", c.campaign_id).eq("title", a.agreement).maybeSingle();
        if (ag && ag.status === "proposed" && ag.parties.includes(c.from_character)) {
          if (a.kind === "reject") await db.from("agreements").update({ status: "withdrawn" }).eq("id", ag.id);
          else { const accepted = [...new Set([...ag.accepted_by, c.from_character])]; await db.from("agreements").update({ accepted_by: accepted, status: accepted.length >= ag.parties.length ? "active" : "proposed" }).eq("id", ag.id); }
          recorded.push(`${a.kind.toUpperCase()} AGREEMENT ${a.agreement}`);
        }
      } else if (a.kind === "transfer") {
        orderRows.push({ verb: "transfer", args: a as unknown as Record<string, unknown>, label: `TRANSFER ${a.amount} ${a.resource} to ${a.to}` });
      }
    }

    // A reply that says "also" adds to the packet; any other reply replaces it.
    const nothingFound = !orderRows.length && !hold && !recorded.length && !ignored.length && !commands.size;
    let replaced = false; const added: string[] = [];
    if (orderRows.length || hold) {
      const { data: packet } = await db.from("order_packets").upsert({ round_id: round.id, character_id: c.from_character, mode: hold && !orderRows.length ? "hold" : "orders", source: "email" }, { onConflict: "round_id,character_id" }).select("id").single();
      if (packet) {
        const { data: existing } = await db.from("orders").select("id, seq, verb, args").eq("packet_id", packet.id).eq("status", "pending").order("seq");
        const keep = mode === "append" ? (existing ?? []) : [];
        if (mode !== "append" && (existing ?? []).length) { await db.from("orders").delete().eq("packet_id", packet.id).eq("status", "pending"); replaced = true; }
        const fresh = orderRows.filter((r) => !keep.some((k) => (k.args as { code?: string }).code && (k.args as { code?: string }).code === (r.args as { code?: string }).code));
        if (fresh.length) await db.from("orders").insert(fresh.map((r, i) => ({ packet_id: packet.id, seq: keep.length + i + 1, verb: r.verb, args: r.args })));
        if (mode === "append") {
          added.push(...fresh.map((r) => r.label));
          for (const r of orderRows.filter((r) => !fresh.includes(r))) ignored.push(`${r.label} — already on file`);
        }
        if (hold) recorded.push(orderRows.length || keep.length ? "HOLD — noted, but orders are on file, so they take precedence" : "HOLD — conserving; standing orders continue (+5 AU in the morning)");
      }
    }
    // The full list now on file, labelled from the menu where possible.
    const { data: pk } = await db.from("order_packets").select("id, mode").eq("round_id", round.id).eq("character_id", c.from_character).maybeSingle();
    const { data: rows } = pk ? await db.from("orders").select("verb, args").eq("packet_id", pk.id).eq("status", "pending").order("seq") : { data: [] };
    const onFile = (rows ?? []).map((r) => {
      const a = r.args as { code?: string; text?: string; freeform?: boolean; cost?: number };
      const opt = a.code ? menu.find((o) => o.code === a.code) : null;
      return opt ? `${opt.code}. ${opt.label} (${opt.cost} AU)` : a.freeform ? `ORDER: ${a.text} — cost ruled in the morning` : `ORDER: ${r.verb.toUpperCase()} ${a.text ?? ""}`.trim();
    });
    // Action Units: menu costs are known; free-form orders carry an estimate
    // until the morning ruling. Orders are funded in the order given; the
    // first one that does not fit, and everything after it, is unfunded.
    const FREEFORM_EST = 5;
    const { data: au } = await db.from("resources").select("balance").eq("character_id", c.from_character).eq("kind", "au").maybeSingle();
    const balance = Number(au?.balance ?? 0);
    let spent = 0;
    const ledger: LedgerLine[] = (rows ?? []).map((r) => {
      const a = r.args as { code?: string; freeform?: boolean; cost?: number; text?: string };
      const opt = a.code ? menu.find((o) => o.code === a.code) : null;
      const cost = opt ? opt.cost : FREEFORM_EST;
      const label = opt ? `${opt.code}. ${opt.label}` : `ORDER: ${(a.text ?? "").slice(0, 40)}${(a.text ?? "").length > 40 ? "…" : ""}`;
      const funded = spent + cost <= balance; if (funded) spent += cost;
      return { label, cost, estimated: !opt, funded };
    });
    if (pk && ledger.some((l) => !l.funded)) {
      // Flag unfunded orders on the rows so the lock phase skips them unless changed.
      for (const [i, r] of (rows ?? []).entries()) await db.from("orders").update({ args: { ...(r.args as object), funded: ledger[i].funded } }).eq("packet_id", pk.id).eq("seq", i + 1);
    }
    if (pk?.mode === "hold" && !onFile.length) onFile.push("HOLD — conserving");
    await db.from("events").insert({ campaign_id: c.campaign_id, round_id: round.id, phase: "intake", kind: "grammar.recorded", payload: { acts, mode, added, replaced, ignored, onFile, recorded }, idempotency_key: key, visible_to: [c.from_character] });

    // The receipt. Count the lines that were not acts as notes.
    const noteLines = (c.body_text as string).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith(">") && parseGrammar(l).length === 0 && !/^(?:—|--|on .* wrote:)/i.test(l)).length;
    const { data: ch } = await db.from("characters").select("name, players(email, mail_token, display_name)").eq("id", c.from_character).single();
    const player = (ch as { players?: { email: string; mail_token: string; display_name: string | null } | null } | null)?.players;
    if (player?.email) {
      const first = (player.display_name || ch?.name || "there").split(" ")[0];
      const lockAt = new Date(round.locks_at).toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", weekday: "long" }) + " Eastern";
      const from = replyAddress(player.mail_token);
      const reSubject = /^re:/i.test(c.subject ?? "") ? (c.subject as string) : `Re: ${c.subject ?? `Orders — Round ${round.number}`}`;
      if (commands.has("directory") || commands.has("help")) {
        const { data: chars } = await db.from("characters").select("slug, name, title, player_id, status, divisions(name)").eq("campaign_id", c.campaign_id).eq("status", "active").order("name");
        const entry = (x: { slug: string; name: string; title: string | null; divisions: { name: string } | { name: string }[] | null }): DirectoryEntry => ({ name: x.name, title: x.title, division: Array.isArray(x.divisions) ? x.divisions[0]?.name ?? null : x.divisions?.name ?? null, address: `${x.slug}@${process.env.EMAIL_DOMAIN || "weird.delivery"}` });
        const cohort = (chars ?? []).filter((x) => x.player_id && x.player_id !== null).map(entry);
        const staff = (chars ?? []).filter((x) => !x.player_id).map(entry);
        const { data: orgs } = await db.from("organizations").select("name, kind").eq("campaign_id", c.campaign_id).in("kind", ["council", "committee"]);
        const text = renderDirectory({ first, cohort, staff, committees: (orgs ?? []).map((o) => o.name) });
        await sendMail({ to: player.email, from, replyTo: from, subject: "Personnel Directory · Station R", text, html: textToHtml(text), inReplyTo: c.message_id ?? undefined });
      }
      if (commands.has("resign")) {
        await db.from("characters").update({ status: "retired" }).eq("id", c.from_character);
        const text = `${first},\n\nYour resignation is recorded. Your character is retired at the next lock and you will receive no further dispatches. The Department thanks you for your service and asks that you remember the confidentiality agreement.\n\n— Personnel & Administration, Royce Industries\n\nIf this was a mistake, write to thedepartment@weird.delivery.`;
        await sendMail({ to: player.email, from, replyTo: from, subject: "Resignation recorded", text, html: textToHtml(text), inReplyTo: c.message_id ?? undefined });
        return;
      }
      if (!(commands.size && nothingFoundExceptCommands(acts))) {
        const text = renderReceipt({ first, round: round.number, onFile: [...onFile, ...recorded.filter((r) => r.startsWith("VOTE") || r.startsWith("HOLD") || r.startsWith("ACCEPT") || r.startsWith("REJECT"))], added, replaced, ignored, notes: noteLines, lockAt, nothingFound, ledger, balance });
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
    const { data: c } = await db.from("correspondence").select("id, subject, body_text, from_character, to_characters").eq("id", id).single();
    if (!c) return;
    const { count } = await db.from("correspondence_events").select("id", { count: "exact", head: true }).eq("correspondence_id", id);
    if (count) return; // already extracted
    const system = `You read one email from a player in a 1977 corporate-intrigue correspondence game and list the game-relevant things it does. You never decide anything; you propose. Output JSON: {"events":[{"kind":"claim|proposal|offer|threat|promise|info_share|vote_intent|order_intent","payload":{},"confidence":0..1,"span":"quoted text"}]}. Claims are what the sender asserts as fact (payload: {subject, claim}). Proposals/offers are deals (payload: {to, give, get, conditions}). Promises are commitments (payload: {to, what, by}). vote_intent and order_intent are only when the sender clearly means to act but did not use the formal grammar (payload: {what}). Be conservative: fewer, surer events.`;
    const { data, result } = await chatJson<{ events: { kind: string; payload: unknown; confidence: number; span: string }[] }>([{ role: "system", content: system }, { role: "user", content: `SUBJECT: ${c.subject ?? ""}\n\n${c.body_text.slice(0, 6000)}` }], { tag: "extract", maxTokens: 1500, timeoutMs: 110_000, onLedger: ledger(db) });
    const events = (data?.events ?? []).filter((e) => e && e.kind && typeof e.confidence === "number");
    if (!events.length) return;
    await db.from("correspondence_events").insert(events.map((e) => ({ correspondence_id: id, kind: e.kind, payload: e.payload ?? {}, confidence: Math.max(0, Math.min(1, e.confidence)), span: e.span ?? null, provenance: { model: result.model, usage: result.usage }, requires_confirmation: e.kind === "vote_intent" || e.kind === "order_intent" })));
  },

  async npc_reply(db, p) {
    const id = p.correspondence_id as string; const npcId = p.character_id as string;
    const key = `npc_reply:${id}:${npcId}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;
    const { data: c } = await db.from("correspondence").select("campaign_id, thread_id, round_id, from_character, from_address, subject, body_text, message_id").eq("id", id).single();
    if (!c?.from_character) throw new Error("sender not yet routed");
    const { data: npc } = await db.from("characters").select("id, slug, name, title, divisions(name)").eq("id", npcId).single();
    const { data: pc } = await db.from("characters").select("id, name, title, divisions(name), players(email)").eq("id", c.from_character).single();
    if (!npc || !pc) throw new Error("character missing");
    const dept = (x: { divisions?: { name: string } | { name: string }[] | null }) => Array.isArray(x.divisions) ? x.divisions[0]?.name ?? null : x.divisions?.name ?? null;
    const playerEmail = (pc as { players?: { email: string } | { email: string }[] | null }).players;
    const email = Array.isArray(playerEmail) ? playerEmail[0]?.email : playerEmail?.email;
    if (!email) return; // nothing to send to
    const { data: round } = c.round_id ? await db.from("rounds").select("number").eq("id", c.round_id).maybeSingle() : await db.from("rounds").select("number").eq("campaign_id", c.campaign_id).eq("status", "open").maybeSingle();
    const roundNo = round?.number ?? 1;
    // Earlier letters between the two, oldest first.
    const { data: prior } = await db.from("correspondence").select("from_character, body_text, received_at").eq("campaign_id", c.campaign_id).neq("id", id)
      .or(`and(from_character.eq.${c.from_character},to_characters.cs.{${npcId}}),and(from_character.eq.${npcId},to_characters.cs.{${c.from_character}})`).order("received_at").limit(6);
    const thread = (prior ?? []).map((x) => ({ from: x.from_character === npcId ? npc.name : pc.name, body: (x.body_text as string).slice(0, 1200) }));
    const salute = parseSalutation(c.body_text as string);
    const dossier = await loadDossier(db, { name: npc.name, title: npc.title, department: dept(npc) });
    const reply = await generateStaffReply({ dossier, player: { name: pc.name, title: pc.title, department: dept(pc) }, letter: { subject: salute.subject ?? (c.subject as string | null), body: c.body_text as string, date: gameDate(roundNo) }, thread, round: roundNo, onLedger: ledger(db) });
    const { data: row, error } = await db.from("correspondence").insert({
      campaign_id: c.campaign_id, thread_id: c.thread_id, round_id: c.round_id, direction: "outbound", message_id: newMessageId(), in_reply_to: c.message_id,
      from_character: npcId, to_characters: [c.from_character], to_addresses: [email], subject: reply.subject, body_text: reply.body,
      raw: { letter_kind: "letter", model: reply.model, guarded: reply.guarded, shared: reply.shared, wants: reply.wants, in_reply_to_correspondence: id },
    }).select("id").single();
    if (error) throw new Error(error.message);
    await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
    await db.from("events").insert({ campaign_id: c.campaign_id, round_id: c.round_id, phase: "intake", kind: "npc.replied", payload: { to: id, reply: row.id, npc: npc.slug, model: reply.model, guarded: reply.guarded, shared: reply.shared, wants: reply.wants }, idempotency_key: key, visible_to: [c.from_character] });
  },

  async tick_phase(db, p) {
    const roundId = p.round_id as string; const phase = p.phase as string;
    const key = `phase:${roundId}:${phase}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;
    const { data: round } = await db.from("rounds").select("campaign_id, number").eq("id", roundId).single();
    if (!round) throw new Error("round missing");
    if (phase === "validate") {
      // Missed-turn defaults: every active player character without a packet gets mode=missed.
      const { data: chars } = await db.from("characters").select("id").eq("campaign_id", round.campaign_id).eq("status", "active").not("player_id", "is", null);
      for (const ch of chars ?? []) await db.from("order_packets").upsert({ round_id: roundId, character_id: ch.id, mode: "missed", source: "default" }, { onConflict: "round_id,character_id", ignoreDuplicates: true });
    }
    if (phase === "governance") {
      const { data: motions } = await db.from("motions").select("id, threshold, organization_id").eq("campaign_id", round.campaign_id).eq("status", "open").lte("closes_round", round.number);
      for (const m of motions ?? []) {
        const { data: votes } = await db.from("votes").select("choice, weight").eq("motion_id", m.id);
        const { count: seats } = await db.from("memberships").select("character_id", { count: "exact", head: true }).eq("organization_id", m.organization_id);
        const forW = (votes ?? []).filter((v) => v.choice === "for").reduce((n, v) => n + Number(v.weight), 0);
        const againstW = (votes ?? []).filter((v) => v.choice === "against").reduce((n, v) => n + Number(v.weight), 0);
        const t = m.threshold as { method: string; fraction?: number };
        const passed = t.method === "majority_of_seats" ? forW > (seats ?? 0) / 2 : t.method === "supermajority" ? forW >= (t.fraction ?? 0.67) * (forW + againstW) && forW > 0 : forW > againstW;
        await db.from("motions").update({ status: passed ? "passed" : "failed" }).eq("id", m.id);
        await db.from("events").insert({ campaign_id: round.campaign_id, round_id: roundId, phase, kind: "motion.closed", payload: { motion_id: m.id, passed, for: forW, against: againstW, seats }, idempotency_key: `motion:${m.id}:closed` });
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

  async player_brief(db, p) {
    await writeBrief(db, p.brief_id as string);
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
      ? await db.from("characters").select("slug, name, title, divisions(name)").eq("id", c.from_character).maybeSingle()
      : { data: null };
    const sender = from as { slug: string; name: string; title: string | null; divisions: { name: string } | null } | null;
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
        : kind === "letter" && sender
          ? await renderTemplate(db, "letter", { subject: c.subject ?? "(no subject)", body: c.body_text, sender_name: sender.name, sender_title: sender.title ?? sender.divisions?.name ?? "", name: to?.name, title: to?.title }, common.links,
              { ...common, ...(c.raw?.classification ? { classification: c.raw.classification as string } : {}) })
          : renderLetter({
              kind,
              subject: c.subject ?? "(no subject)",
              from: sender ? { name: sender.name, title: sender.title, department: sender.divisions?.name } : { name: "Personnel & Administration", department: "Royce Industries" },
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
