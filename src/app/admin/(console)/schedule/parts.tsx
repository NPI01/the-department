import Link from "next/link";
import type { Decision, Episode, Round } from "@/lib/admin/queries";
import { fmtDate } from "@/lib/admin/format";
import { Badge, Empty, Table, statusTone } from "../ui";

const METHOD: Record<string, string> = {
  majority_of_seats: "majority of seats",
  majority_of_votes: "majority of votes cast",
  supermajority: "supermajority",
  leader_decides: "leader decides",
};

/* One motion: what it is, the tally against its threshold, and every vote. */
export function DecisionCard({ m, pending }: { m: Decision; pending?: boolean }) {
  const cast = m.tally.for + m.tally.against + m.tally.abstain;
  const width = (n: number) => `${cast ? (100 * n) / Math.max(cast, m.seats || cast) : 0}%`;
  const threshold = `${METHOD[m.threshold.method] ?? m.threshold.method}${m.threshold.fraction ? ` (${Math.round(m.threshold.fraction * 100)}%)` : ""}`;
  return (
    <article className="min-w-0 border border-rule p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{m.number && <span className="text-ink-2">{m.number} · </span>}{m.title}</h3>
        <Badge tone={pending && m.status === "open" ? "warn" : statusTone(m.status)}>{pending && m.status === "open" ? "to be decided" : m.status}</Badge>
      </div>
      <p className="mt-1 text-xs text-ink-2">
        {m.organization} · {m.kind} · needs {threshold} · open days {m.opens_round}–{m.closes_round}{m.sponsor && <> · sponsor {m.sponsor}</>}
      </p>
      {m.text && <p className="mt-2 line-clamp-3 text-sm">{m.text}</p>}

      <div className="mt-3 flex h-2 w-full overflow-hidden bg-paper-2" aria-label={`${m.tally.for} for, ${m.tally.against} against, ${m.tally.abstain} abstain`}>
        <span className="h-full bg-ok" style={{ width: width(m.tally.for) }} />
        <span className="h-full bg-stamp" style={{ width: width(m.tally.against) }} />
        <span className="h-full bg-rule" style={{ width: width(m.tally.abstain) }} />
      </div>
      <p className="mt-1 text-xs tabular-nums text-ink-2">
        <span className="text-ok">{m.tally.for} for</span> · <span className="text-stamp">{m.tally.against} against</span> · {m.tally.abstain} abstain{m.seats ? ` · ${m.seats} seats` : ""}
      </p>

      {m.votes.length ? (
        <div className="mt-3">
          <Table head={["Member", "Vote", "Weight", "Cast", "Via"]}>
            {m.votes.map((v) => (
              <tr key={v.character_id}>
                <td>{v.name} {v.pc ? <Badge tone="accent">player</Badge> : <Badge>npc</Badge>} {v.secret && <Badge tone="warn">secret</Badge>}</td>
                <td className={v.choice === "for" ? "text-ok" : v.choice === "against" ? "text-stamp" : "text-ink-2"}>{v.choice}</td>
                <td className="tabular-nums">{v.weight}</td>
                <td>day {v.cast_round}</td>
                <td className="text-ink-2">{v.source}</td>
              </tr>
            ))}
          </Table>
        </div>
      ) : <div className="mt-3"><Empty>No votes cast.</Empty></div>}
      {m.absent.length > 0 && <p className="mt-2 text-xs text-ink-2">Not voted: {m.absent.join(", ")}</p>}
    </article>
  );
}

/* The whole season as a strip of days, one row per episode. */
export function Timeline({ episodes, rounds, today, selected, marks, tz }: { episodes: Episode[]; rounds: Round[]; today: number | null; selected?: number; marks: Map<number, number>; tz: string }) {
  if (!rounds.length) return <Empty>No days are scheduled for this season yet.</Empty>;
  const groups = [
    ...episodes.map((e) => ({ key: e.id, label: `Ep ${e.number}`, title: e.title, href: `/admin/episodes/${e.id}`, rounds: rounds.filter((r) => r.episode_id === e.id) })),
    { key: "none", label: "—", title: "Not in an episode", href: null, rounds: rounds.filter((r) => !r.episode_id || !episodes.some((e) => e.id === r.episode_id)) },
  ].filter((g) => g.rounds.length);
  return (
    <div className="space-y-1.5">
      {groups.map((g) => (
        <div key={g.key} className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-xs text-ink-2" title={g.title}>{g.href ? <Link href={g.href} className="hover:underline">{g.label}</Link> : g.label}</span>
          <div className="flex flex-wrap gap-1">
            {g.rounds.map((r) => {
              const n = marks.get(r.number) ?? 0;
              const past = r.status === "resolved";
              return (
                <Link
                  key={r.id}
                  href={`/admin/schedule/${r.number}`}
                  prefetch={false}
                  title={`Day ${r.number} · ${fmtDate(r.opens_at, tz)} · ${r.status}${n ? ` · ${n} decision${n > 1 ? "s" : ""}` : ""}`}
                  className={`relative flex h-7 w-7 items-center justify-center border text-[10px] tabular-nums
                    ${r.number === selected ? "border-ink bg-ink font-semibold text-paper" : `hover:border-ink ${past ? "border-rule bg-paper-2 text-ink-2" : r.status === "scheduled" ? "border-rule/60 text-ink-2/70" : "border-accent text-accent"}`}
                    ${r.number === today ? "ring-2 ring-accent ring-offset-1 ring-offset-paper" : ""}`}
                >
                  {r.episode_round ?? r.number}
                  {n > 0 && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-stamp" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <p className="pt-2 text-[11px] text-ink-2">Cells show the day within the episode. Ringed: today. Red dot: a vote closes that day. Filled: resolved.</p>
    </div>
  );
}

export function GoToDay({ max, tz }: { max: number; tz: string }) {
  return (
    <form action="/admin/schedule" className="flex flex-wrap items-end gap-2 text-sm">
      <label className="block">
        <span className="block text-xs text-ink-2">Day number</span>
        <input name="day" type="number" min={1} max={max || undefined} className="w-24 border border-rule bg-paper-2 px-2 py-1" />
      </label>
      <span className="pb-1 text-xs text-ink-2">or</span>
      <label className="block">
        <span className="block text-xs text-ink-2">Calendar date ({tz})</span>
        <input name="date" type="date" className="border border-rule bg-paper-2 px-2 py-1" />
      </label>
      <button className="border border-ink px-3 py-1 hover:bg-ink hover:text-paper">Go</button>
    </form>
  );
}
