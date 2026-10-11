import type { SupabaseClient } from "@supabase/supabase-js";

/* One row per cron invocation in `cron_runs`, so the console can tell a quiet
   engine from one whose cron has stopped firing. Never lets bookkeeping fail
   the run itself. */
export async function heartbeat<T extends Record<string, unknown>>(db: SupabaseClient, route: string, run: () => Promise<T>): Promise<T> {
  const { data } = await db.from("cron_runs").insert({ route }).select("id").single();
  const finish = async (ok: boolean, detail: Record<string, unknown>) => {
    if (data) await db.from("cron_runs").update({ ok, detail, finished_at: new Date().toISOString() }).eq("id", data.id);
  };
  try {
    const result = await run();
    await finish(result.ok !== false, result);
    return result;
  } catch (e) {
    await finish(false, { error: String((e as Error).message).slice(0, 500) });
    throw e;
  }
}
