import type { SupabaseClient } from "@supabase/supabase-js";

/* Ballots as a player meets them: what is being decided, why they have a vote
   (or why not), what is at stake, who votes, the choices, the exact line to
   send, and when it closes. One source for the ballot notice letter, the
   morning dispatch's Ballots section and the Ballots page, so all three say the
   same thing. Elections are motions of kind 'election' (votes in
   election_votes); everything else is a motion voted FOR/AGAINST/ABSTAIN by the
   body's members (votes). Nothing here reads engine-side truth: no leans,
   prices or hidden loyalties, only what the rules say and what the player did. */

export type Person = { id: string; name: string; title: string | null; department: string | null; me: boolean };

export type Ballot = {
  id: string;
  number: string;
  title: string;
  election: boolean;
  body: string;                 // "Research Committee"
  text: string | null;          // the motion as moved
  stakes: string | null;        // player-facing: what rides on it
  opensRound: number;
  closesRound: number;
  closesLabel: string;          // "8:00 PM EDT on Thursday 16 October (the lock of Round 3)"
  closesTonight: boolean;
  status: "open" | "passed" | "failed" | "withdrawn";
  threshold: { method: string; fraction?: number };
  eligible: boolean;
  myVote: string | null;        // candidate name, or FOR / AGAINST / ABSTAIN
  voters: Person[];             // who may vote
  candidates: Person[];         // elections only
  result: string | null;        // closed ballots: what happened
};

type Row = { id: string; number: string; title: string; kind: string; text: string | null; stakes: string | null; opens_round: number; closes_round: number; status: Ballot["status"]; threshold: Ballot["threshold"]; organization_id: string; organizations: { name: string } | { name: string }[] | null };

const one = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x) ?? null;

/* "8:00 PM EDT on Thursday 16 October", in the campaign's time zone. */
export function fmtClose(iso: string, tz: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const day = d.toLocaleDateString("en-GB", { timeZone: tz, weekday: "long", day: "numeric", month: "long" });
  return `${time} on ${day}`;
}

export async function loadBallots(db: SupabaseClient, campaignId: string, characterId: string, opts: { closed?: boolean } = {}): Promise<{ round: number; ballots: Ballot[] }> {
  const [{ data: campaign }, { data: rounds }] = await Promise.all([
    db.from("campaigns").select("timezone").eq("id", campaignId).maybeSingle(),
    db.from("rounds").select("number, status, locks_at").eq("campaign_id", campaignId).order("number"),
  ]);
  const tz = (campaign?.timezone as string | undefined) ?? "America/New_York";
  const rs = (rounds ?? []) as { number: number; status: string; locks_at: string }[];
  const current = rs.find((r) => r.status === "open") ?? rs[rs.length - 1];
  const roundNo = current?.number ?? 0;

  let q = db.from("motions").select("id, number, title, kind, text, stakes, opens_round, closes_round, status, threshold, organization_id, organizations(name)").eq("campaign_id", campaignId).lte("opens_round", Math.max(roundNo, 1));
  q = opts.closed ? q.in("status", ["open", "passed", "failed"]) : q.eq("status", "open");
  const { data: motions } = await q.order("closes_round");
  const rows = (motions ?? []) as unknown as Row[];
  if (!rows.length) return { round: roundNo, ballots: [] };

  const orgIds = [...new Set(rows.map((r) => r.organization_id))];
  const [{ data: cohort }, { data: members }, { data: eVotes }, { data: mVotes }, { data: closedEvents }] = await Promise.all([
    db.from("characters").select("id, name, title, created_at, divisions(name, slug)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null).order("created_at"),
    db.from("memberships").select("organization_id, voting_weight, characters(id, name, title, divisions(name, slug))").in("organization_id", orgIds),
    db.from("election_votes").select("motion_id, candidate_id").eq("voter_id", characterId).in("motion_id", rows.map((r) => r.id)),
    db.from("votes").select("motion_id, choice").eq("character_id", characterId).in("motion_id", rows.map((r) => r.id)),
    opts.closed ? db.from("events").select("kind, payload").eq("campaign_id", campaignId).in("kind", ["election.closed", "motion.closed"]) : Promise.resolve({ data: [] }),
  ]);
  type D = { name: string; slug: string };
  type C = { id: string; name: string; title: string | null; divisions: D | D[] | null };
  // DSRD is not on the org chart new hires receive; its people appear under the Executive Office (as on the personnel file).
  const dept = (d: D | null) => (d ? (d.slug === "dsrd" ? "Executive Office" : d.name) : null);
  const person = (c: C): Person => ({ id: c.id, name: c.name, title: c.title, department: dept(one(c.divisions)), me: c.id === characterId });
  const cohortPeople = ((cohort ?? []) as unknown as C[]).map(person);
  const names = new Map(cohortPeople.map((p) => [p.id, p.name]));

  // When a round locks: its own locks_at if it exists; otherwise one day per round after the latest known lock.
  const last = rs[rs.length - 1];
  const lockAt = (n: number) => {
    const r = rs.find((x) => x.number === n);
    if (r) return r.locks_at;
    if (!last) return null;
    return new Date(new Date(last.locks_at).getTime() + (n - last.number) * 86_400_000).toISOString();
  };

  const ballots = rows.map((r): Ballot => {
    const election = r.kind === "election";
    const seated = ((members ?? []) as unknown as { organization_id: string; voting_weight: number; characters: C | C[] | null }[])
      .filter((m) => m.organization_id === r.organization_id && Number(m.voting_weight) > 0).map((m) => one(m.characters)).filter((c): c is C => !!c).map(person);
    const voters = election ? cohortPeople : seated;
    const ev = (eVotes ?? []).find((v) => v.motion_id === r.id);
    const mv = (mVotes ?? []).find((v) => v.motion_id === r.id);
    const at = lockAt(r.closes_round);
    const ce = ((closedEvents ?? []) as { kind: string; payload: { motion_id: string; winner_name?: string | null; cast?: number; passed?: boolean; for?: number; against?: number; abstain?: number; quorum?: boolean } }[]).find((e) => e.payload.motion_id === r.id);
    const result = r.status === "open" ? null
      : election ? (ce?.payload.winner_name ? `${ce.payload.winner_name} won the seat (${ce.payload.cast ?? 0} vote${ce.payload.cast === 1 ? "" : "s"} cast).` : "No votes were cast. The seat is empty.")
      : ce ? `${ce.payload.passed ? "Carried" : "Failed"}: ${ce.payload.for ?? 0} for, ${ce.payload.against ?? 0} against, ${ce.payload.abstain ?? 0} abstaining${ce.payload.quorum === false ? "; too few members voted (no quorum)" : ""}.` : r.status === "passed" ? "Carried." : "Failed.";
    return {
      id: r.id, number: r.number, title: r.title, election, body: one(r.organizations)?.name ?? "the Board", text: r.text, stakes: r.stakes,
      opensRound: r.opens_round, closesRound: r.closes_round,
      closesLabel: `${at ? `${fmtClose(at, tz)} ` : ""}(the lock of Round ${r.closes_round})`.trim(), closesTonight: r.closes_round === roundNo && current?.status === "open",
      status: r.status, threshold: r.threshold ?? { method: "majority_of_votes" },
      eligible: voters.some((v) => v.me),
      myVote: election ? (ev ? names.get(ev.candidate_id as string) ?? "a colleague no longer on staff" : null) : mv ? String(mv.choice).toUpperCase() : null,
      voters, candidates: election ? cohortPeople : [], result,
    };
  });
  return { round: roundNo, ballots };
}

const surname = (name: string) => name.trim().split(/\s+/).pop() ?? name;
const who = (p: Person) => `${p.name}${p.title ? `, ${p.title}` : ""}${p.department && !(p.title ?? "").includes(p.department) ? ` (${p.department})` : ""}${p.me ? " — you" : ""}`;

/* How the result is decided, in a player's words. Mirrors the governance phase in jobs.ts. */
export function howDecided(b: Ballot) {
  if (b.election) return "Whoever has the most votes when it closes wins the seat. A tie goes to whoever joined the company first. If nobody votes, the seat stays empty.";
  const seats = b.voters.length;
  const quorum = Math.ceil(seats / 2);
  const q = `At least ${quorum} of the ${seats} members must vote (an abstention counts as voting).`;
  if (b.threshold.method === "majority_of_seats") return `It carries only if more than half of all ${seats} seats vote FOR. ${q}`;
  if (b.threshold.method === "supermajority") return `It carries if at least ${Math.round((b.threshold.fraction ?? 0.67) * 100)}% of the FOR and AGAINST votes are FOR. ${q}`;
  return `It carries if more members vote FOR than AGAINST. ${q} A tie fails, and things stay as they are.`;
}

/* The notice's sections, as Markdown. `mailbox` is the game address players write to. */
export function ballotSections(b: Ballot, mailbox: string) {
  const example = b.election ? (b.candidates.find((c) => !c.me) ?? b.candidates[0]) : null;
  const line = b.election ? `VOTE ${b.number}: <surname>` : `VOTE ${b.number}: FOR`;
  return {
    decided: b.election
      ? `Who holds the employee seat on the ${b.body}. The seat is a full voting place on the committee, alongside the department heads who sit on it.`
      : `Motion ${b.number}, "${b.title}", before the ${b.body}. As moved:\n\n"${b.text ?? b.title}"`,
    why: b.election
      ? `The company charter reserves one seat on the Research Committee and one on the Safety Committee for an employee, elected by the newest cohort of hires. You are a member of that cohort, so you have one vote in this election${b.candidates.some((c) => c.me) ? ", and you are also a candidate" : ""}.`
      : b.eligible ? `You hold a seat on the ${b.body}, so you vote on every motion put before it.`
      : `You do not hold a seat on the ${b.body}, so you cannot vote on this. You can still write to its members, or LOBBY them in your orders, before it closes.`,
    stakes: b.stakes ?? (b.election ? `A seat on the ${b.body} and a vote on everything it decides.` : "What the motion says it will do, if it carries."),
    electorate: b.election
      ? `Every active member of your cohort: ${b.voters.length} employee${b.voters.length === 1 ? "" : "s"}. Each has one vote in this election.`
      : `The ${b.voters.length} members of the ${b.body}:\n\n${b.voters.map((v) => `- ${who(v)}`).join("\n")}`,
    choicesHeading: b.election ? "The candidates" : b.eligible ? "Your choices" : "The choices",
    choices: b.election
      ? `Every member of the cohort is a candidate, you included:\n\n${b.candidates.map((c) => `- ${who(c)}`).join("\n")}`
      : "- FOR the motion\n- AGAINST the motion\n- ABSTAIN: counted as voting, for neither side",
    how: b.election
      ? `Reply to this letter, or write to ${mailbox} from the address your letters arrive at, with this line on its own:\n\n${line}\n\nFor example, to vote for ${example ? example.name : "a colleague"}:\n\nVOTE ${b.number}: ${example ? surname(example.name) : "Baxter"}\n\nYou may vote for yourself. Voting costs no Action Units. If you vote again before it closes, your later vote replaces the earlier one. The clerk sends a receipt that names who you voted for.`
      : b.eligible ? `Reply to this letter, or write to ${mailbox} from the address your letters arrive at, with one of these lines on its own:\n\nVOTE ${b.number}: FOR\nVOTE ${b.number}: AGAINST\nVOTE ${b.number}: ABSTAIN\n\nVoting costs no Action Units. If you vote again before it closes, your later vote replaces the earlier one. The clerk sends a receipt.`
      : `You have no vote here. To work on a member, write to them, or choose a lobbying order from your morning dispatch.`,
    closes: `${b.closesLabel[0].toUpperCase()}${b.closesLabel.slice(1)}. ${howDecided(b)} The result is in everyone's dispatch the next morning.`,
  };
}

/* The morning dispatch's Ballots section: short, exact, the same every day until the close. */
export function dispatchBallotLines(ballots: Ballot[], fileUrl: string | null): string[] {
  const out: string[] = [];
  for (const b of ballots.filter((x) => x.status === "open")) {
    const head = `${b.number} · ${b.election ? `Election: ${b.title}` : `"${b.title}" before the ${b.body}`} · closes ${b.closesTonight ? "TONIGHT, " : ""}${b.closesLabel}`;
    if (!b.eligible) { out.push(`• ${head}. You have no vote on this; you can write to the members or lobby them.`); continue; }
    const mine = b.myVote ? `Your vote: ${b.myVote}. To change it, send` : `You have not voted. To vote, send`;
    out.push(`• ${head}. ${mine} the line "${b.election ? `VOTE ${b.number}: <surname>` : `VOTE ${b.number}: FOR`}"${b.election ? "" : " (or AGAINST, or ABSTAIN)"}.`);
  }
  if (out.length && fileUrl) out.push(`Candidates, stakes and the rules for each ballot: ${fileUrl}/ballots`);
  return out;
}
