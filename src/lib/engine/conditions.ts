/* Conditions on world state: a fact the engine has recorded, with the fields
   it must carry. Used by scheduled mail (`when`), closed places (`closedBy`)
   and anything else that should happen only on one branch of the story. A
   finding is `finding.<claim>` with { established }, an operation is
   `operation.<key>` with { status }, a motion's instruction is
   `goal.instruction.<goal>` with { result }. Deterministic. PROPOSED 2026-10-18. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Condition } from "./world/types";

/* Every fact the campaign holds under the given keys, as a map. */
export async function factsFor(db: SupabaseClient, campaignId: string, keys: string[]): Promise<Map<string, Record<string, unknown>>> {
  if (!keys.length) return new Map();
  const { data } = await db.from("facts").select("key, value").eq("campaign_id", campaignId).in("key", [...new Set(keys)]);
  return new Map((data ?? []).map((f) => [f.key as string, (f.value as Record<string, unknown>) ?? {}]));
}

/* True when the fact exists and every field in `equals` matches it. A condition
   with no `equals` asks only that the fact exist. */
export function holds(c: Condition, facts: Map<string, Record<string, unknown>>): boolean {
  const v = facts.get(c.fact);
  if (!v) return false;
  for (const [k, want] of Object.entries(c.equals ?? {})) if (v[k] !== want) return false;
  return true;
}

export async function conditionHolds(db: SupabaseClient, campaignId: string, c: Condition): Promise<boolean> {
  return holds(c, await factsFor(db, campaignId, [c.fact]));
}
