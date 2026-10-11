"use server";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SEASON_COOKIE } from "@/lib/admin/queries";
import { cobbleConfig } from "@/lib/cobble";
import { runJob } from "@/lib/engine/jobs";

export async function chooseSeason(fd: FormData) {
  await requireAdmin();
  const slug = String(fd.get("season") ?? "");
  (await cookies()).set(SEASON_COOKIE, slug, { path: "/admin", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  refresh();
}

/* Queue a model-written brief on a player, then start it straight away after
   the response. If this instance dies mid-write the worker picks the job up. */
export async function requestBrief(fd: FormData) {
  const admin = await requireAdmin();
  const playerId = String(fd.get("player_id") ?? "");
  const campaignId = String(fd.get("campaign_id") ?? "") || null;
  const db = supabaseAdmin();
  const { data: brief } = await db.from("player_briefs").insert({ player_id: playerId, campaign_id: campaignId, requested_by: admin.id }).select("id").single();
  if (!brief) return;
  const { data: job } = await db.from("jobs").insert({ kind: "player_brief", payload: { brief_id: brief.id }, locked_at: new Date().toISOString() }).select("id, kind, payload, attempts").single();
  if (job) after(() => runJob(supabaseAdmin(), job));
  refresh();
}

/* One-token request to each model in the chain, no retries: is a replica
   answering right now? Results land in the model ledger as tag "probe". */
export async function probeModels() {
  await requireAdmin();
  const cfg = cobbleConfig();
  const db = supabaseAdmin();
  await Promise.all(cfg.models.map(async (model) => {
    const t0 = Date.now();
    let status: number | null = null; let error: string | null = null; let ok = false;
    let usage: { prompt_tokens?: number; completion_tokens?: number } | null = null;
    try {
      const res = await fetch(`${cfg.base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with OK." }], max_tokens: 2, chat_template_kwargs: { enable_thinking: false } }),
        signal: AbortSignal.timeout(20_000),
      });
      status = res.status;
      const body = await res.text();
      ok = res.ok;
      if (ok) usage = JSON.parse(body)?.usage ?? null;
      else error = body.slice(0, 200);
    } catch (e) { error = (e as Error).message; }
    await db.from("model_ledger").insert({ tag: "probe", model, ok, status, ms: Date.now() - t0, prompt_tokens: usage?.prompt_tokens ?? null, completion_tokens: usage?.completion_tokens ?? null, error });
  }));
  refresh();
}
