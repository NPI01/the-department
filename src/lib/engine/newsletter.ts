/* The company newsletter: THE ROYCE REPORT (name PROPOSED 2026-10-16), from
   Personnel & Administration, on the morning of days 4 and 11 of each episode
   (Thursdays), to every desk. The company's own voice set against the county
   paper's: cheerful, careful, bureaucratic. It welcomes new employees, reports
   committee business, notes directives in force, carries the week's
   recreation, and answers anything the Minot Daily News printed about the
   company without confirming a word of it. The model writes from the facts
   listed here and nothing else; a templated issue stands in if it fails.
   Never a secret: the guard is the living world's, with the project names. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, type LedgerRow } from "@/lib/cobble";
import { gameDate } from "@/lib/email/letter";
import { newMessageId } from "@/lib/email/resend";
import { SECRET_TERMS } from "./grow";
import { activeDirectives } from "./directives";
import { pressureFor } from "./world";

export const NEWSLETTER = { name: "The Royce Report", office: "Personnel & Administration", place: "Station R, North Dakota", volume: 6 };
export const NEWSLETTER_DAYS = [4, 11];

type Item = { kind: "welcome" | "ballot" | "election" | "open" | "directive" | "finding" | "pressure" | "press" | "quiet"; text: string };

function fallbackIssue(date: string, no: number, items: Item[]): string {
  const head = (k: Item["kind"]) => ({ welcome: "WELCOME ABOARD", ballot: "COMMITTEE BUSINESS", election: "COMMITTEE BUSINESS", open: "BEFORE THE COMMITTEES", directive: "NOTICE TO ALL STAFF", finding: "COMMITTEE BUSINESS", pressure: "AROUND THE STATION", press: "FOR THE RECORD", quiet: "AROUND THE STATION" }[k]);
  return `**${NEWSLETTER.name.toUpperCase()} — Vol. ${NEWSLETTER.volume}, No. ${no} — ${date}**\n\n${items.map((i) => `**${head(i.kind)}**\n\n${i.text}`).join("\n\n")}\n\n*Personnel & Administration, Building 1. Items for the next issue to Room 104 by Tuesday noon.*`;
}

export async function publishNewsletter(db: SupabaseClient, campaignId: string, round: { id: string; number: number; episodeRound: number; episode: number }, opts: { force?: boolean; onLedger?: (r: LedgerRow) => void | Promise<void> } = {}): Promise<{ published: boolean; items: number; model: string | null }> {
  if (!opts.force && !NEWSLETTER_DAYS.includes(round.episodeRound)) return { published: false, items: 0, model: null };
  const key = `newsletter:${campaignId}:${round.number}`;
  const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
  if (dup) return { published: false, items: 0, model: null };
  const date = gameDate(round.number);
  const { count: prior } = await db.from("events").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("kind", "newsletter.published");
  const no = (prior ?? 0) + 1;

  const { data: week } = await db.from("rounds").select("id, number, opens_at").eq("campaign_id", campaignId).gte("number", round.number - 7).lte("number", round.number).order("number");
  const weekIds = (week ?? []).map((r) => r.id as string);
  const since = (week ?? [])[0]?.opens_at as string | undefined;
  const items: Item[] = [];
  // New employees this week, by name, title and department: the company is proud of them.
  const { data: hires } = since ? await db.from("characters").select("name, title, divisions(name)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null).gte("created_at", since) : { data: [] };
  if (hires?.length) items.push({ kind: "welcome", text: `Please welcome ${hires.map((h) => `${h.name}${h.title ? `, ${h.title}` : ""}${(h.divisions as { name: string } | { name: string }[] | null) ? ` (${(Array.isArray(h.divisions) ? h.divisions[0] : h.divisions)?.name ?? ""})` : ""}`).join("; ")}. Orientation packets are in Room 104.` });
  if (weekIds.length) {
    const { data: evs } = await db.from("events").select("kind, payload").in("round_id", weekIds).in("kind", ["motion.closed", "election.closed", "motion.sponsored"]).order("id");
    for (const e of evs ?? []) {
      const v = e.payload as { number?: string; title?: string; passed?: boolean; finding?: string | null; winner_name?: string | null; org?: string; opens?: number; closes?: number };
      if (e.kind === "election.closed") items.push({ kind: "election", text: v.winner_name ? `${v.winner_name} has been elected employee representative (${v.number ?? ""}) and takes a full seat with the company's thanks to all who voted.` : `Election ${v.number ?? ""} closed without a vote cast; the seat remains open.` });
      else if (e.kind === "motion.closed") { items.push({ kind: "ballot", text: `${v.number ?? "A motion"}, "${v.title ?? ""}", ${v.passed ? "was carried" : "did not carry"}.` }); if (v.finding) items.push({ kind: "finding", text: `The body recorded that ${v.finding}.` }); }
      else if (e.kind === "motion.sponsored") items.push({ kind: "open", text: `${v.number ?? "A motion"}, "${v.title ?? ""}", has been placed before the ${String(v.org ?? "committee").replace(/-/g, " ")} and opens Round ${v.opens ?? ""}; members may vote until the close of Round ${v.closes ?? ""}.` });
    }
  }
  for (const d of await activeDirectives(db, campaignId, round.number)) items.push({ kind: "directive", text: `Emergency directive ${d.number}, issued by ${d.by_name}, remains in force until the close of Round ${d.until}: ${d.kind === "seal" ? `${d.target_name} is closed` : d.kind === "curfew" ? "no vehicle leaves Gate 2 after 1800" : d.kind === "suspend" ? "an employee's access is suspended pending review" : `${d.target_name} is open to all clearances`}. Thank you for your cooperation.` });
  // What the paper printed about the company this week, for the record.
  const { data: paper } = await db.from("correspondence").select("body_text, raw").eq("campaign_id", campaignId).not("raw->bulletin", "is", null).order("received_at", { ascending: false }).limit(1).maybeSingle();
  const paperRound = Number((paper?.raw as { bulletin?: number } | null)?.bulletin ?? 0);
  if (paper && paperRound > round.number - 7) {
    const heads = [...String(paper.body_text).matchAll(/^\*\*(.+?)\*\*$/gm)].map((m) => m[1]).filter((h) => !/minot daily news/i.test(h)).slice(0, 4);
    if (heads.length) items.push({ kind: "press", text: `The Minot Daily News of ${gameDate(paperRound)} carried the following headlines: ${heads.map((h) => `"${h}"`).join("; ")}. Employees are reminded that the company speaks through its spokesman only, and that the confidentiality agreement applies to conversations with the press.` });
  }
  const band = pressureFor(round.episode).find((t) => round.episodeRound >= t.rounds[0] && round.episodeRound <= t.rounds[1]);
  if (band) items.push({ kind: "pressure", text: `Around the station: ${band.text}` });
  if (!items.length) items.push({ kind: "quiet", text: "A quiet week at Station R. The cafeteria reminds staff that the Thursday special is walleye." });

  let body = fallbackIssue(date, no, items); let model: string | null = null;
  const system = `You write one issue of ${NEWSLETTER.name}, the internal newsletter of Royce Industries, Station R, North Dakota, published by Personnel & Administration, dated ${date}, Vol. ${NEWSLETTER.volume}, No. ${no}. Voice: a 1977 corporate newsletter, cheerful and careful, mimeographed; the company is a good employer and says so. Four to six items, each a bold heading in capitals (**LIKE THIS**) and two to four sentences. Begin with the line **${NEWSLETTER.name.toUpperCase()} — Vol. ${NEWSLETTER.volume}, No. ${no} — ${date}** and end with *Personnel & Administration, Building 1. Items for the next issue to Room 104 by Tuesday noon.* Under 380 words.
RULES: report only the facts given; never add names, numbers, projects or causes that are not in them. Welcome new employees warmly by name. Report committee business as settled. Anything the county paper printed about the company is answered without confirming or denying a word of it: the company's position is that its work is agricultural and industrial research, that it operates no aircraft after dark, and that employees do not speak to the press. One item may be recreation: the bowling league, the blood drive, the cafeteria, the company picnic, a safety reminder. Never use these words or ideas: Convergence, Drawing 68-24, the Keepers, the Ascendants, 1984, retrocausal, Sublevel Nine, Kessler, Vetch, Clara Wren, the Omega Point, time loops, the future, SENTINEL, NIGHTJAR, CHOIR, ORPHEUS, HARVEST, LANTERN, the chamber, the stairway.`;
  try {
    const res = await chat([{ role: "system", content: system }, { role: "user", content: `THE FACTS THIS WEEK:\n${items.map((i) => `- ${i.text}`).join("\n")}\n\nWrite the issue.` }], { tag: "newsletter", temperature: 0.6, maxTokens: 900, think: false, timeoutMs: 120_000, onLedger: opts.onLedger });
    const text = res.text.replace(/^```[a-z]*\n?|```$/gm, "").trim();
    if (text.length > 300 && !SECRET_TERMS.test(text)) { body = text; model = res.model; }
  } catch { /* the templated issue stands */ }

  const { data: pcs } = await db.from("characters").select("id, players(email)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const players = (pcs ?? []).map((c) => ({ id: c.id as string, email: ((Array.isArray(c.players) ? c.players[0] : c.players) as { email: string } | null)?.email ?? null }));
  const ids = players.map((p) => p.id);
  if (players.length) {
    const { data: row } = await db.from("correspondence").insert({ campaign_id: campaignId, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: null, to_characters: ids, to_addresses: players.map((p) => p.email).filter((e): e is string => Boolean(e)), subject: `${NEWSLETTER.name} — No. ${no} — ${date}`, body_text: body, raw: { letter_kind: "memo", classification: "Internal", office: { office: NEWSLETTER.office, department: "Royce Industries" }, newsletter: round.number, number: no, model } }).select("id").single();
    if (row) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
    await db.from("case_items").upsert(ids.map((id) => ({ campaign_id: campaignId, character_id: id, slug: `royce-report-r${round.number}`, kind: "memo", drawer: "documents", title: `${NEWSLETTER.name}, No. ${no}, ${date}`, from_label: NEWSLETTER.office, written_label: date, body, round_received: round.number, how_obtained: "In every tray at Station R.", copy_note: "The mimeograph itself.", grade: "intelligence", status: "held" })), { onConflict: "character_id,slug", ignoreDuplicates: true });
  }
  await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "open", kind: "newsletter.published", payload: { issue: NEWSLETTER.name, number: no, round: round.number, items: items.length, model }, idempotency_key: key, visible_to: ids });
  return { published: true, items: items.length, model };
}
