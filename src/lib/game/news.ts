/* The News tab: the Minot Daily News as the engine prints it (bulletin.ts),
   read back from the correspondence rows that carried each issue, and turned
   into stories a page can set in columns. When a cohort has no issue yet, a
   specimen copy stands in so the tab is never blank. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate } from "@/lib/email/letter";

export type Story = { headline: string; paragraphs: string[] };
export type Issue = { round: number; date: string; stories: Story[]; byline: string | null; specimen: boolean };

/* The bulletin's Markdown: a bold dateline, bold headlines, paragraphs, an italic byline. */
export function parseIssue(body: string, round: number, specimen = false): Issue {
  const lines = body.replace(/\r/g, "").split("\n").map((l) => l.trim());
  let date = gameDate(round); let byline: string | null = null;
  const stories: Story[] = [];
  let cur: Story | null = null;
  for (const l of lines) {
    if (!l) continue;
    const bold = l.match(/^\*\*(.+?)\*\*$/);
    if (bold) {
      const text = bold[1].trim();
      if (/minot daily news/i.test(text) && !stories.length && !cur) { const d = text.split(/\s[—–-]\s/)[1]; if (d) date = d.trim(); continue; }
      if (cur) stories.push(cur);
      cur = { headline: text.replace(/[.:]+$/, ""), paragraphs: [] };
      continue;
    }
    const by = l.match(/^\*(.+?)\*$/);
    if (by && /staff|haugen|correspondent/i.test(by[1]) && by[1].length < 60) { byline = by[1].replace(/\.$/, ""); continue; }
    const para = l.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    if (!cur) cur = { headline: "From the wire", paragraphs: [] };
    cur.paragraphs.push(para);
  }
  if (cur) stories.push(cur);
  return { round, date, stories: stories.filter((s) => s.paragraphs.length), byline, specimen };
}

export async function issuesFor(db: SupabaseClient, campaignId: string): Promise<Issue[]> {
  const { data } = await db.from("correspondence").select("body_text, raw").eq("campaign_id", campaignId).eq("direction", "outbound").not("raw->bulletin", "is", null).order("received_at");
  const seen = new Set<number>(); const out: Issue[] = [];
  for (const r of data ?? []) {
    const round = Number((r.raw as { bulletin?: number }).bulletin);
    if (!round || seen.has(round)) continue; seen.add(round);
    out.push(parseIssue(r.body_text as string, round));
  }
  return out;
}

/* A specimen for a cohort with no issue yet: the steer story the county already
   knows (canon, Episode 2 mail) and the kind of small items a county daily runs. */
export const SPECIMEN_ROUND = 15;
export const SPECIMEN = `**MINOT DAILY NEWS — ${gameDate(SPECIMEN_ROUND)}**

**RANCHER: COMPANY HELICOPTER OVER DEAD STEER**

TAGUS — Gary Vane, 52, says a helicopter with no lights hung over his north pasture for twenty minutes on the night of October 9, and that in the morning a three-year-old steer lay dead beneath where it had been, "opened like a book, and not a drop on the grass." Vane has kept a tissue sample in a jar. "It hasn't turned," he said. "Two weeks. It should have turned."

A Royce Industries spokesman, Leonard Fisk, said the company operates no aircraft after dark. The Ward County Sheriff's Department confirmed it had received a report and declined further comment.

**COMMISSION PUTS OFF ROAD LEVY A SECOND TIME**

The Ward County Commission on Monday tabled, for the second meeting running, a proposed half-mill levy for gravel on the county roads west of the Souris. Commissioners said they wanted the state's figures on the Tagus road before voting. The road has carried more truck traffic this year than any year since the base was built, the county engineer said, and he did not say whose trucks.

**MARKETS: DURUM STEADY, CATTLE LOWER**

Durum held at the Minot elevators Monday while feeder cattle slipped a dollar at the sale barn on light receipts. Ranchers north of Tagus held back stock for a second week. "Nobody wants to sell into this," one said, and would not say into what.

**BASE SETS OPEN HOUSE FOR NOVEMBER**

Minot Air Force Base will open its gates to the public on the second Saturday in November, the base information office said. There will be a static display of aircraft and a band. No flying is scheduled.

*Haugen, staff.*`;
