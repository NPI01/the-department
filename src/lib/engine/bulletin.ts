/* The weekly paper (rulebook §9.4; after Quest's rumour cards and newsletter,
   Starweb's quarterly). The Minot Daily News comes out on the morning of days
   7 and 14 of each episode and goes to every desk at Station R: what the
   committees decided, what the company will say, what the week felt like, and
   whatever has been leaked to it (the LEAK verb, resolve.ts). A leak the paper
   prints becomes shared knowledge: every player gains what the document grants,
   at low confidence. The model writes in the paper's voice from the facts
   listed here and nothing else; a templated issue stands in if it fails.
   PROPOSED 2026-10-16. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, type LedgerRow } from "@/lib/cobble";
import { gameDate } from "@/lib/email/letter";
import { newMessageId } from "@/lib/email/resend";
import { loadLivePlaces, SECRET_TERMS } from "./grow";
import { documentsFor, pressureFor } from "./world";

export const PAPER = { name: "Minot Daily News", place: "Minot, North Dakota" };
export const ISSUE_DAYS = [7, 14];

type Item = { kind: "ballot" | "election" | "finding" | "leak" | "pressure" | "quiet"; text: string; slug?: string };

function fallbackIssue(date: string, items: Item[]): string {
  const lines = items.map((i) => i.kind === "leak" ? `**DOCUMENT REACHES THE NEWS**\n\n${i.text}` : i.kind === "pressure" ? `**AROUND STATION R**\n\n${i.text}` : `**FROM THE COMPANY**\n\n${i.text}`);
  return `**${PAPER.name.toUpperCase()} — ${date}**\n\n${lines.join("\n\n")}\n\n*Haugen, staff.*`;
}

export async function publishBulletin(db: SupabaseClient, campaignId: string, round: { id: string; number: number; episodeRound: number; episode: number }, opts: { force?: boolean; onLedger?: (r: LedgerRow) => void | Promise<void> } = {}): Promise<{ published: boolean; items: number; model: string | null }> {
  if (!opts.force && !ISSUE_DAYS.includes(round.episodeRound)) return { published: false, items: 0, model: null };
  const key = `bulletin:${campaignId}:${round.number}`;
  const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
  if (dup) return { published: false, items: 0, model: null };
  await loadLivePlaces(db);
  const date = gameDate(round.number);

  // The week: the seven rounds before this morning.
  const { data: week } = await db.from("rounds").select("id, number").eq("campaign_id", campaignId).gte("number", round.number - 7).lt("number", round.number);
  const weekIds = (week ?? []).map((r) => r.id as string);
  const items: Item[] = [];
  if (weekIds.length) {
    const { data: evs } = await db.from("events").select("kind, payload").in("round_id", weekIds).in("kind", ["motion.closed", "election.closed"]).order("id");
    for (const e of evs ?? []) {
      const v = e.payload as { number?: string; title?: string; passed?: boolean; finding?: string | null; winner_name?: string | null; for?: number; against?: number };
      if (e.kind === "election.closed") items.push({ kind: "election", text: v.winner_name ? `Royce Industries confirmed that ${v.winner_name} will sit as employee representative following the vote ${v.number ?? ""}.` : `The company's election ${v.number ?? ""} closed with the seat unfilled.` });
      else {
        items.push({ kind: "ballot", text: `The company's ${v.number ?? "motion"}, "${v.title ?? ""}", ${v.passed ? "carried" : "failed"}${typeof v.for === "number" ? ` (${v.for} for, ${v.against ?? 0} against)` : ""}.` });
        if (v.finding) items.push({ kind: "finding", text: `In the same session the body recorded that ${v.finding}.` });
      }
    }
  }
  // Leaks not yet printed.
  const { data: leaks } = await db.from("facts").select("key, value").eq("campaign_id", campaignId).like("key", "leak.%");
  const pending = (leaks ?? []).filter((f) => !(f.value as { printed?: boolean }).printed);
  const docs = documentsFor(round.episode);
  const leaked = pending.map((f) => ({ fact: f, doc: docs.find((d) => d.slug === (f.key as string).slice("leak.".length)) ?? null })).filter((x) => x.doc);
  for (const { doc } of leaked) items.push({ kind: "leak", slug: doc!.slug, text: `A document described as "${doc!.title}" reached this newspaper this week from a source who asked not to be named. ${doc!.body.replace(/\*\*/g, "").replace(/\s+/g, " ").slice(0, 400)}` });
  // The week's weather at the company, as the paper would notice it.
  const band = pressureFor(round.episode).find((t) => round.episodeRound >= t.rounds[0] && round.episodeRound <= t.rounds[1]);
  if (band) items.push({ kind: "pressure", text: band.text });
  if (!items.length) items.push({ kind: "quiet", text: "Royce Industries had no comment this week and the sheriff's office reported a quiet one." });

  // The issue, in the paper's voice.
  let body = fallbackIssue(date, items); let model: string | null = null;
  const system = `You write one issue of the Minot Daily News, a small-town North Dakota daily, dated ${date}. Reporter Haugen covers Royce Industries and the county. Plain wire-service prose, short paragraphs, 1977: no computers, no internet. Write three to five items, each as a bold headline line (**LIKE THIS**) followed by two to four sentences. Begin with the line **${PAPER.name.toUpperCase()} — ${date}** and end with *Haugen, staff.* Under 380 words in all.
RULES: report only the facts given; never add names, numbers, causes or conclusions that are not in them. A leaked document is described in a sentence or two from the summary given, never quoted at length. Never use these words or ideas: Convergence, Drawing 68-24, the Keepers, the Ascendants, 1984, retrocausal, Sublevel Nine, Kessler, Vetch, Clara Wren, the Omega Point, time loops, the future, SENTINEL, NIGHTJAR, CHOIR, ORPHEUS, HARVEST, LANTERN. You may add weather, grain prices and one line of county routine.`;
  try {
    const res = await chat([{ role: "system", content: system }, { role: "user", content: `THE FACTS THIS WEEK:\n${items.map((i) => `- ${i.text}`).join("\n")}\n\nWrite the issue.` }], { tag: "bulletin", temperature: 0.7, maxTokens: 900, think: false, timeoutMs: 120_000, onLedger: opts.onLedger });
    const text = res.text.replace(/^```[a-z]*\n?|```$/gm, "").trim();
    if (text.length > 300 && !SECRET_TERMS.test(text)) { body = text; model = res.model; }
  } catch { /* the templated issue stands */ }

  // Every desk at Station R: a letter on the paper's own paper, and a clipping in the Case File.
  const { data: pcs } = await db.from("characters").select("id, players(email)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const players = (pcs ?? []).map((c) => ({ id: c.id as string, email: ((Array.isArray(c.players) ? c.players[0] : c.players) as { email: string } | null)?.email ?? null }));
  const ids = players.map((p) => p.id);
  const title = `${PAPER.name}, ${date}`;
  if (players.length) {
    const { data: row } = await db.from("correspondence").insert({ campaign_id: campaignId, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: null, to_characters: ids, to_addresses: players.map((p) => p.email).filter((e): e is string => Boolean(e)), subject: `${PAPER.name} — ${date}`, body_text: body, raw: { letter_kind: "letter", letterhead: PAPER, office: { office: PAPER.name, department: PAPER.place }, bulletin: round.number, model } }).select("id").single();
    if (row) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
    await db.from("case_items").upsert(ids.map((id) => ({ campaign_id: campaignId, character_id: id, slug: `minot-daily-news-r${round.number}`, kind: "document", drawer: "documents", title, from_label: PAPER.name, written_label: date, body, round_received: round.number, how_obtained: "Delivered to every desk at Station R.", copy_note: "The paper itself.", grade: "intelligence", status: "held" })), { onConflict: "character_id,slug", ignoreDuplicates: true });
    // What a printed leak teaches everyone, at the confidence of a newspaper.
    const grants = leaked.flatMap(({ doc }) => doc!.grants.map((g) => ({ g, title: doc!.title })));
    if (grants.length) await db.from("knowledge").insert(ids.flatMap((id) => grants.map(({ g, title: t }) => ({ character_id: id, fact_key: g, value: { true: true, round: round.number, via: "press", title: t }, confidence: 0.5, source_kind: "dispatch", source_ref: null, learned_round: round.number }))));
  }
  for (const { fact } of leaked) await db.from("facts").update({ value: { ...(fact.value as object), printed: true, printed_round: round.number } }).eq("campaign_id", campaignId).eq("key", fact.key as string);
  await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "open", kind: "bulletin.published", payload: { issue: PAPER.name, round: round.number, items: items.length, leaks: leaked.map((l) => l.doc!.slug), model }, idempotency_key: key, visible_to: ids });
  return { published: true, items: items.length, model };
}
