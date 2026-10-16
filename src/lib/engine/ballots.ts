/* Ballot notices: the morning a ballot opens, every player who may vote in it
   gets a notice (template ballot_notice) saying what is decided, why they vote,
   what is at stake, who votes, the choices, the exact line to send and when it
   closes. A player who joins while a ballot is open gets theirs the next
   morning. Once per ballot and voter. Called by the morning cron after the
   scheduled mail, before the dispatches are written. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate, letterLinks } from "@/lib/email/letter";
import { gameMailbox, newMessageId } from "@/lib/email/resend";
import { fill } from "@/lib/email/templates";
import { loadTemplate, renderTemplate } from "@/lib/email/template-store";
import { ballotSections, loadBallots, type Ballot } from "@/lib/game/ballots";

/* Who issues the notice: Personnel runs the employee elections; a body's own secretary its motions. */
const office = (b: Ballot) => (b.election ? "Personnel & Administration" : `Office of the Secretary, ${b.body}`);

export function noticeVars(b: Ballot, name: string, roundNo: number) {
  const s = ballotSections(b, gameMailbox().address);
  return {
    name, number: b.number, title: b.title, office: office(b),
    decided: s.decided, why: s.why, stakes: s.stakes, electorate: s.electorate,
    choices_heading: s.choicesHeading, choices: s.choices, how: s.how, closes: s.closes,
    closes_short: b.closesLabel.replace(/\s*\(the lock of Round \d+\)$/, ""), game_date: gameDate(roundNo),
  };
}

export async function deliverBallotNotices(db: SupabaseClient, campaignId: string, round: { id: string; number: number }): Promise<{ sent: number }> {
  const { data: pcs } = await db.from("characters").select("id, name, title, players(email, file_token)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const { data: open } = await db.from("motions").select("id").eq("campaign_id", campaignId).eq("status", "open").lte("opens_round", round.number).limit(1);
  if (!open?.length || !pcs?.length) return { sent: 0 };
  const { fields } = await loadTemplate(db, "ballot_notice");
  let sent = 0;
  for (const pc of pcs) {
    const pl = (Array.isArray(pc.players) ? pc.players[0] : pc.players) as { email: string; file_token: string | null } | null;
    const { ballots } = await loadBallots(db, campaignId, pc.id as string);
    for (const b of ballots.filter((x) => x.eligible && x.status === "open")) {
      const key = `ballot.notice:${b.id}:${pc.id}`;
      const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
      if (dup) continue;
      const vars = noticeVars(b, pc.name as string, round.number);
      const links = letterLinks(pl?.file_token ?? null);
      // `title` is the ballot's; the recipient line comes from `to`.
      const rendered = await renderTemplate(db, "ballot_notice", vars, links, { to: { name: pc.name as string, title: (pc.title as string | null) ?? null } });
      const { data: row, error } = await db.from("correspondence").insert({
        campaign_id: campaignId, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: null,
        to_characters: [pc.id], to_addresses: pl?.email ? [pl.email] : [], subject: rendered.subject,
        body_text: fill(fields.body, vars).trim(), body_html: rendered.html,
        raw: { letter_kind: "notice", classification: fill(fields.classification, vars) || null, office: { office: office(b) }, ballot: b.number },
      }).select("id").single();
      if (error) throw new Error(`ballot notice: ${error.message}`);
      if (pl?.email) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
      await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "open", kind: "ballot.notice", payload: { motion_id: b.id, number: b.number, character: pc.id, correspondence_id: row.id }, idempotency_key: key, visible_to: [pc.id] });
      sent++;
    }
  }
  return { sent };
}
