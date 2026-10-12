import { GOALS } from "@/lib/game/creation";
import { goalsFor, scoreOf } from "@/lib/game/goals";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Badge, Empty, Panel } from "../../ui";
import { assignGoalAction, decideGoal } from "./goal-actions";

/* Personal Goals for one player character: the showrunner judges each against
   its condition in canon/secret/07 and marks it met (with the points given)
   or not met, and can hand out further goals from the pool. */
export async function GoalsPanel({ characterId, campaignId }: { characterId: string; campaignId: string }) {
  const goals = await goalsFor(supabaseAdmin(), characterId);
  const held = new Set(goals.map((g) => g.goalKey));
  const field = "border border-rule bg-paper px-2 py-1 text-sm";
  return (
    <Panel title={`Personal Goals · ${scoreOf(goals)} points`} className="mt-4">
      {goals.length ? (
        <ul className="space-y-4">
          {goals.map((g) => (
            <li key={g.id} className="border-b border-rule pb-4 last:border-b-0">
              <p className="text-sm"><Badge tone={g.status === "met" ? "ok" : g.status === "failed" ? "bad" : "warn"}>{g.status}</Badge> <span className="font-medium">{g.text}</span> <span className="text-ink-2">· {g.points} pts{g.goalKey ? ` · ${g.goalKey}` : ""}{g.deadline ? ` · due ${g.deadline}` : ""}</span></p>
              {g.note && <p className="mt-1 text-xs text-ink-2">Ruling: {g.note}</p>}
              <form action={decideGoal} className="mt-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="goal_id" value={g.id} />
                <input type="hidden" name="character_id" value={characterId} />
                <input name="awarded" type="number" min={0} max={100} defaultValue={g.awarded ?? g.points} className={`${field} w-20`} aria-label="Points awarded" />
                <input name="note" defaultValue={g.note ?? ""} placeholder="Ruling the player sees (optional)" className={`${field} min-w-0 flex-1`} />
                <button name="status" value="met" className="border border-ok px-2 py-1 text-xs uppercase tracking-wider text-ok hover:bg-ok hover:text-paper">Met</button>
                <button name="status" value="failed" className="border border-ink-2 px-2 py-1 text-xs uppercase tracking-wider hover:bg-ink hover:text-paper">Not met</button>
                <button name="status" value="open" className="border border-rule px-2 py-1 text-xs uppercase tracking-wider hover:border-ink">Reopen</button>
              </form>
            </li>
          ))}
        </ul>
      ) : <Empty>No goals yet. The starting goal is recorded at hiring.</Empty>}
      <form action={assignGoalAction} className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        <input type="hidden" name="character_id" value={characterId} />
        <input type="hidden" name="campaign_id" value={campaignId} />
        <select name="goal_key" className={`${field} min-w-0 flex-1`} defaultValue="">
          <option value="" disabled>Give another goal from the pool…</option>
          {Object.entries(GOALS).filter(([k]) => !held.has(k)).map(([k, g]) => <option key={k} value={k}>{k} · {g.points} pts · {g.text}</option>)}
        </select>
        <button className="border border-ink px-3 py-1 text-xs uppercase tracking-wider hover:bg-ink hover:text-paper">Assign</button>
      </form>
    </Panel>
  );
}
