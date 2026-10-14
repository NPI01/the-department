import { adminDb } from "./auth";

/* The cohort monitor: every campaign, its seats and round, and per player the
   signs that matter: when they last wrote, whether they are missing turns,
   whether Security has them, what the engine has sent them. Console reads. */

export type PlayerRow = {
  id: string; name: string; title: string | null; division: string | null; email: string | null;
  lastIn: string | null; lastDispatch: string | null; lettersIn7d: number; missedOf3: number; au: number | null;
  goalsOpen: number; goalsMet: number; summoned: boolean; invited: string[]; member: string[];
};
export type CohortRow = {
  id: string; slug: string; title: string; status: string; timezone: string; cohortSize: number; seatsTaken: number; scheduledStart: string | null;
  round: { number: number; episodeRound: number | null; status: string; locksAt: string; opensAt: string } | null; episode: number;
  dispatchesToday: number; scriptedToday: number; invitations: number; summonses: number;
  mailUnsent: number; sendFailed: number; staffPending: number; motionsOpen: { number: string; title: string; closes: number }[];
  players: PlayerRow[];
};

export async function getCohortMonitor(): Promise<{ cohorts: CohortRow[]; modelErrors24h: number; jobsFailed: number }> {
  const db = await adminDb();
  const since7d = new Date(Date.now() - 7 * 86400_000).toISOString();
  const since24h = new Date(Date.now() - 86400_000).toISOString();
  const [{ data: campaigns }, { count: modelErrors24h }, { count: jobsFailed }] = await Promise.all([
    db.from("campaigns").select("*").order("created_at"),
    db.from("model_ledger").select("id", { count: "exact", head: true }).eq("ok", false).gte("created_at", since24h),
    db.from("jobs").select("id", { count: "exact", head: true }).not("error", "is", null).is("done_at", null),
  ]);
  const cohorts: CohortRow[] = [];
  for (const c of campaigns ?? []) {
    const cid = c.id as string;
    const [{ count: seats }, { data: rounds }, { data: pcs }, { data: motions }] = await Promise.all([
      db.from("applications").select("id", { count: "exact", head: true }).eq("campaign_id", cid).in("status", ["submitted", "approved"]),
      db.from("rounds").select("id, number, episode_round, status, locks_at, opens_at").eq("campaign_id", cid).order("number", { ascending: false }).limit(3),
      db.from("characters").select("id, name, title, status, divisions(name), players(email)").eq("campaign_id", cid).not("player_id", "is", null).in("status", ["active", "missing"]).order("name"),
      db.from("motions").select("number, title, closes_round, opens_round").eq("campaign_id", cid).eq("status", "open"),
    ]);
    const current = rounds?.[0] ?? null;
    const resolved = (rounds ?? []).filter((r) => r.status === "resolved").map((r) => r.id as string);
    const episode = current ? Math.floor((Number(current.number) - 1) / 14) + 1 : 0;
    const [{ count: dispatchesToday }, { count: scriptedToday }, { count: invitations }, { count: summonses }, { count: mailUnsent }, { count: sendFailed }, { count: staffPending }] = await Promise.all([
      current ? db.from("events").select("id", { count: "exact", head: true }).eq("round_id", current.id).eq("kind", "dispatch.sent") : Promise.resolve({ count: 0 }),
      current ? db.from("events").select("id", { count: "exact", head: true }).eq("round_id", current.id).eq("kind", "mail.scripted") : Promise.resolve({ count: 0 }),
      db.from("events").select("id", { count: "exact", head: true }).eq("campaign_id", cid).eq("kind", "society.invited"),
      db.from("events").select("id", { count: "exact", head: true }).eq("campaign_id", cid).eq("kind", "security.summons"),
      db.from("correspondence").select("id", { count: "exact", head: true }).eq("campaign_id", cid).eq("direction", "outbound").is("raw->sent", null).neq("to_addresses", "{}").gte("received_at", since24h),
      db.from("jobs").select("id", { count: "exact", head: true }).eq("kind", "send").not("error", "is", null).is("done_at", null),
      db.from("jobs").select("id", { count: "exact", head: true }).eq("kind", "npc_reply").is("done_at", null),
    ]);
    const players: PlayerRow[] = [];
    for (const pc of pcs ?? []) {
      const pid = pc.id as string;
      const [{ data: lastIn }, { count: lettersIn7d }, { data: lastDispatch }, { data: packets }, { data: au }, { data: goals }, { data: summ }, { data: inv }, { data: mem }] = await Promise.all([
        db.from("correspondence").select("received_at").eq("direction", "inbound").eq("from_character", pid).is("raw->source", null).order("received_at", { ascending: false }).limit(1).maybeSingle(),
        db.from("correspondence").select("id", { count: "exact", head: true }).eq("direction", "inbound").eq("from_character", pid).gte("received_at", since7d),
        db.from("events").select("created_at").eq("kind", "dispatch.sent").contains("payload", { character: pid }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        resolved.length ? db.from("order_packets").select("mode").eq("character_id", pid).in("round_id", resolved) : Promise.resolve({ data: [] as { mode: string }[] }),
        db.from("resources").select("balance").eq("character_id", pid).eq("kind", "au").maybeSingle(),
        db.from("character_goals").select("status").eq("character_id", pid),
        db.from("events").select("id").eq("kind", "security.summons").contains("payload", { character: pid }).limit(1),
        db.from("events").select("payload").eq("kind", "society.invited").contains("payload", { character: pid }),
        db.from("memberships").select("organizations!inner(name, kind)").eq("character_id", pid).eq("organizations.kind", "society"),
      ]);
      players.push({
        id: pid, name: pc.name as string, title: (pc.title as string | null) ?? null, division: ((Array.isArray(pc.divisions) ? pc.divisions[0] : pc.divisions) as { name: string } | null)?.name ?? null,
        email: ((Array.isArray(pc.players) ? pc.players[0] : pc.players) as { email: string } | null)?.email ?? null,
        lastIn: (lastIn?.received_at as string | undefined) ?? null, lastDispatch: (lastDispatch?.created_at as string | undefined) ?? null, lettersIn7d: lettersIn7d ?? 0,
        missedOf3: ((packets ?? []) as { mode: string }[]).filter((p) => p.mode === "missed").length, au: au ? Number(au.balance) : null,
        goalsOpen: (goals ?? []).filter((g) => g.status === "open").length, goalsMet: (goals ?? []).filter((g) => g.status === "met").length,
        summoned: Boolean(summ?.length), invited: (inv ?? []).map((e) => (e.payload as { society: string }).society),
        member: (mem ?? []).map((m) => ((Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) as { name: string }).name.replace(/\s*\(.*\)$/, "")),
      });
    }
    cohorts.push({
      id: cid, slug: c.slug as string, title: c.title as string, status: c.status as string, timezone: c.timezone as string, cohortSize: Number(c.cohort_size ?? 12), seatsTaken: seats ?? 0, scheduledStart: (c.scheduled_start as string | null) ?? null,
      round: current ? { number: Number(current.number), episodeRound: (current.episode_round as number | null) ?? null, status: current.status as string, locksAt: current.locks_at as string, opensAt: current.opens_at as string } : null, episode,
      dispatchesToday: dispatchesToday ?? 0, scriptedToday: scriptedToday ?? 0, invitations: invitations ?? 0, summonses: summonses ?? 0,
      mailUnsent: mailUnsent ?? 0, sendFailed: sendFailed ?? 0, staffPending: staffPending ?? 0,
      motionsOpen: ((motions ?? []) as { number: string; title: string; closes_round: number; opens_round: number }[]).filter((m) => !current || m.opens_round <= Number(current.number)).map((m) => ({ number: m.number, title: m.title, closes: m.closes_round })),
      players,
    });
  }
  return { cohorts, modelErrors24h: modelErrors24h ?? 0, jobsFailed: jobsFailed ?? 0 };
}
