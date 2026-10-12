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
import { fetchReceived, parseGrammar, stripQuoted, type GrammarAct } from "@/lib/email/inbound";
import { menuFor, renderReceipt, replyAddress, textToHtml } from "@/lib/engine/dispatch";
import { writeBrief } from "@/lib/admin/brief";

type Job = { id: number; kind: string; payload: Record<string, unknown>; attempts: number };

export async function claimJobs(db: SupabaseClient, limit = 5): Promise<Job[]> {
  const now = new Date().toISOString();
  const { data } = await db.from("jobs").select("id, kind, payload, attempts").is("done_at", null).lte("run_after", now)
    .or(`locked_at.is.null,locked_at.lt.${new Date(Date.now() - 10 * 60_000).toISOString()}`).order("id").limit(limit);
  const jobs = (data ?? []) as Job[];
  if (jobs.length) await db.from("jobs").update({ locked_at: now }).in("id", jobs.map((j) => j.id));
  return jobs;
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
    for (const name of recipients.map((r) => r.name).filter(Boolean) as string[]) {
      const { data: hit } = await db.from("characters").select("id").eq("campaign_id", campaign).ilike("name", `%${name.replace(/[%_]/g, "")}%`).limit(1).maybeSingle();
      if (hit) to.add(hit.id);
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
    for (const n of npcs ?? []) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: id, character_id: n.id }, run_after: new Date(Date.now() + 15 * 60_000).toISOString() });
  },

  async grammar(db, p) {
    if (!p.trusted) return; // untrusted senders' acts wait for web confirmation
    const id = p.correspondence_id as string;
    const acts = (p.acts as GrammarAct[]) ?? [];
    const { data: c } = await db.from("correspondence").select("campaign_id, from_character, from_address, body_text, subject, message_id").eq("id", id).single();
    if (!c?.from_character) throw new Error("sender not yet routed"); // retry after route
    const { data: round } = await db.from("rounds").select("id, number, locks_at").eq("campaign_id", c.campaign_id).eq("status", "open").maybeSingle();
    if (!round) return; // no open round: acts are ignored, dispatch will say so
    const key = `grammar:${id}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (dup) return;

    const menu = await menuFor(db, round.id, c.from_character);
    const recorded: string[] = [];
    const orderRows: { verb: string; args: Record<string, unknown>; label: string }[] = [];
    let hold = false;
    for (const a of acts) {
      if (a.kind === "select") {
        const opt = menu.find((o) => o.code === a.code);
        if (a.code === "X") continue; // X is the free-form prompt, not an option
        if (!opt) { recorded.push(`${a.code}. — not on tonight's list, ignored`); continue; }
        orderRows.push({ verb: opt.verb, args: { text: opt.args, code: opt.code, cost: opt.cost }, label: `${opt.code}. ${opt.label} (${opt.cost} AU)` });
      } else if (a.kind === "order") {
        orderRows.push({ verb: a.verb, args: { text: a.args, freeform: true }, label: `ORDER: ${a.verb}${a.args ? " " + a.args : ""} — cost ruled in the morning` });
      } else if (a.kind === "hold") hold = true;
      else if (a.kind === "vote") {
        const { data: m } = await db.from("motions").select("id, status, number").eq("campaign_id", c.campaign_id).eq("number", a.motion).maybeSingle();
        if (m?.status === "open") { await db.from("votes").upsert({ motion_id: m.id, character_id: c.from_character, choice: a.choice, cast_round: round.number, source: "email_grammar", source_ref: id }, { onConflict: "motion_id,character_id" }); recorded.push(`VOTE ${m.number}: ${a.choice.toUpperCase()}`); }
        else recorded.push(`VOTE ${a.motion} — no open ballot by that number, ignored`);
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

    // The latest reply replaces the previous packet for this round.
    if (orderRows.length || hold) {
      const { data: packet } = await db.from("order_packets").upsert({ round_id: round.id, character_id: c.from_character, mode: hold && !orderRows.length ? "hold" : "orders", source: "email" }, { onConflict: "round_id,character_id" }).select("id").single();
      if (packet) {
        await db.from("orders").delete().eq("packet_id", packet.id).eq("status", "pending");
        if (orderRows.length) await db.from("orders").insert(orderRows.map((r, i) => ({ packet_id: packet.id, seq: i + 1, verb: r.verb, args: r.args })));
        if (hold) recorded.push(orderRows.length ? "HOLD — noted, but orders were given, so they take precedence" : "HOLD — conserving; standing orders continue (+5 AU in the morning)");
        recorded.unshift(...orderRows.map((r) => r.label));
      }
    }
    await db.from("events").insert({ campaign_id: c.campaign_id, round_id: round.id, phase: "intake", kind: "grammar.recorded", payload: { acts, recorded }, idempotency_key: key, visible_to: [c.from_character] });

    // The receipt. Count the lines that were not acts as notes.
    const noteLines = (c.body_text as string).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith(">") && !/^(?:ORDER\b|HOLD\b|H\.?$|VOTE\b|ACCEPT\b|REJECT\b|TRANSFER\b|[A-GX](?:\s*[,/ ]\s*[A-GX])*\.?$)/i.test(l) && !/^(?:—|--|on .* wrote:)/i.test(l)).length;
    const { data: ch } = await db.from("characters").select("name, players(email, mail_token, display_name)").eq("id", c.from_character).single();
    const player = (ch as { players?: { email: string; mail_token: string; display_name: string | null } | null } | null)?.players;
    if (player?.email) {
      const first = (player.display_name || ch?.name || "there").split(" ")[0];
      const lockAt = new Date(round.locks_at).toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", weekday: "long" }) + " Eastern";
      const text = renderReceipt({ first, round: round.number, recorded, notes: noteLines, lockAt });
      await sendMail({ to: player.email, from: replyAddress(player.mail_token), replyTo: replyAddress(player.mail_token), subject: `Re: ${c.subject ?? `Orders — Round ${round.number}`}`, text, html: textToHtml(text), inReplyTo: c.message_id ?? undefined });
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
    const { data, result } = await chatJson<{ events: { kind: string; payload: unknown; confidence: number; span: string }[] }>([{ role: "system", content: system }, { role: "user", content: `SUBJECT: ${c.subject ?? ""}\n\n${c.body_text.slice(0, 6000)}` }], { tag: "extract", maxTokens: 1500, onLedger: ledger(db) });
    const events = (data?.events ?? []).filter((e) => e && e.kind && typeof e.confidence === "number");
    if (!events.length) return;
    await db.from("correspondence_events").insert(events.map((e) => ({ correspondence_id: id, kind: e.kind, payload: e.payload ?? {}, confidence: Math.max(0, Math.min(1, e.confidence)), span: e.span ?? null, provenance: { model: result.model, usage: result.usage }, requires_confirmation: e.kind === "vote_intent" || e.kind === "order_intent" })));
  },

  async npc_reply(db, p) {
    // Placeholder until the Character Writer role is mounted: record that a reply is owed.
    await db.from("events").insert({ campaign_id: process.env.CAMPAIGN_ID, kind: "npc.reply_owed", payload: p, idempotency_key: `npc_reply:${p.correspondence_id}:${p.character_id}` }).select("id");
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
