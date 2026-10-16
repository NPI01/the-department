/* The News tab: the Minot Daily News as the engine prints it (bulletin.ts),
   read back from the correspondence rows that carried each issue, and turned
   into stories a page can set in columns. When a cohort has no issue yet, a
   specimen copy stands in so the tab is never blank. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate } from "@/lib/email/letter";

export type Story = { headline: string; paragraphs: string[] };
export type Issue = { round: number; date: string; stories: Story[]; byline: string | null; specimen: boolean; masthead?: string | null };

/* The bulletin's Markdown: a bold dateline, bold headlines, paragraphs, an italic byline. */
export function parseIssue(body: string, round: number, specimen = false): Issue {
  const lines = body.replace(/\r/g, "").split("\n").map((l) => l.trim());
  let date = gameDate(round); let byline: string | null = null; let masthead: string | null = null;
  const stories: Story[] = [];
  let cur: Story | null = null;
  for (const l of lines) {
    if (!l) continue;
    const bold = l.match(/^\*\*(.+?)\*\*$/);
    if (bold) {
      const text = bold[1].trim();
      if (/minot daily news|royce report/i.test(text) && !stories.length && !cur) { masthead = text; const parts = text.split(/\s[—–-]\s/); const d = parts[parts.length - 1]; if (d && /\d{4}/.test(d)) date = d.trim(); continue; }
      if (cur) stories.push(cur);
      cur = { headline: text.replace(/[.:]+$/, ""), paragraphs: [] };
      continue;
    }
    const by = l.match(/^\*(.+?)\*$/);
    if (by && /staff|haugen|correspondent|personnel|building 1|room 104/i.test(by[1]) && by[1].length < 160) { byline = by[1].replace(/\.$/, ""); continue; }
    const para = l.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    if (!cur) cur = { headline: "From the wire", paragraphs: [] };
    cur.paragraphs.push(para);
  }
  if (cur) stories.push(cur);
  return { round, date, stories: stories.filter((s) => s.paragraphs.length), byline, specimen, masthead };
}

export async function newslettersFor(db: SupabaseClient, campaignId: string): Promise<Issue[]> {
  const { data } = await db.from("correspondence").select("body_text, raw").eq("campaign_id", campaignId).eq("direction", "outbound").not("raw->newsletter", "is", null).order("received_at");
  const seen = new Set<number>(); const out: Issue[] = [];
  for (const r of data ?? []) {
    const round = Number((r.raw as { newsletter?: number }).newsletter);
    if (!round || seen.has(round)) continue; seen.add(round);
    out.push(parseIssue(r.body_text as string, round));
  }
  return out;
}

/* A specimen newsletter: the company's voice, from facts any cohort's first weeks would hold. */
export const NEWSLETTER_SPECIMEN_ROUND = 4;
export const NEWSLETTER_SPECIMEN = `**THE ROYCE REPORT — Vol. 6, No. 1 — ${gameDate(NEWSLETTER_SPECIMEN_ROUND)}**

**WELCOME ABOARD**

Personnel & Administration is pleased to welcome this month's new employees to Station R. Orientation packets, badge photographs and the confidentiality agreement are handled in Room 104; please have page three signed and returned by Friday. The Recreation Association reminds new staff that the bowling league bowls Tuesdays at the Minot lanes and that the company van leaves Gate 2 at 6:15.

**COMMITTEE BUSINESS**

Nominations for the two employee seats, one on the Research Committee and one on the Safety Committee, close at the lock of Round 3. Every employee has a vote. The seats carry a full voice on every motion put before the committee, and the company encourages new staff to stand.

**FOR THE RECORD**

Employees will have seen local press reports concerning livestock on ranches near Tagus. The company's position is unchanged: Royce Industries conducts agricultural and industrial research under agreement with participating ranchers, operates no aircraft after dark, and refers all inquiries to its spokesman. The confidentiality agreement applies to conversations with the press.

**SAFETY FIRST**

With the first hard frost expected this week, Facilities asks drivers to allow extra time on the perimeter road and to report any vehicle found outside the motor pool after hours to Gate 2. The cafeteria's Thursday special is walleye.

*Personnel & Administration, Building 1. Items for the next issue to Room 104 by Tuesday noon.*`;

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
