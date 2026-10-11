import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, type LedgerRow } from "@/lib/cobble";
import { activityWith } from "./activity";
import type { Character } from "./queries";

/* A showrunner's note on one player: what they have done, what they appear to
   be after, and whether they are drifting away. Admin-only; the model may see
   their mail but never secret canon. Runs as job kind `player_brief`. */
export async function writeBrief(db: SupabaseClient, briefId: string) {
  const { data: brief } = await db.from("player_briefs").select("id, player_id, campaign_id, status").eq("id", briefId).single();
  if (!brief || brief.status === "done") return;
  try {
    let q = db.from("characters").select("*").eq("player_id", brief.player_id);
    if (brief.campaign_id) q = q.eq("campaign_id", brief.campaign_id);
    const { data: ch } = await q.limit(1).maybeSingle();
    if (!ch) throw new Error("player has no character in this season");
    const character = ch as Character;
    const a = await activityWith(db, character);
    const { data: latest } = await db.from("rounds").select("number").eq("campaign_id", character.campaign_id).in("status", ["open", "locked", "resolving", "resolved"]).order("number", { ascending: false }).limit(1).maybeSingle();

    const lines = [
      `CHARACTER: ${character.name}${character.title ? `, ${character.title}` : ""} (clearance ${character.clearance}, ${character.specialization ?? "no specialization"}, status ${character.status})`,
      `MAIL: ${a.sent} sent, ${a.received} received. Most-written-to: ${a.contacts.slice(0, 5).map(([n, k]) => `${n} (${k})`).join(", ") || "nobody"}.`,
      `ROUNDS WITH A PACKET: ${a.rounds}. Modes: ${JSON.stringify(a.modes)}. Order verbs: ${JSON.stringify(a.verbs)}.`,
      `VOTES: ${a.votes.map((v) => `${v.motions?.number ?? "?"} "${v.motions?.title ?? ""}" → ${v.choice}`).join("; ") || "none"}.`,
      `AGREEMENTS: ${a.agreements.map((g) => `${g.title ?? g.kind} with ${g.partyNames.join(", ")} (${g.status})`).join("; ") || "none"}.`,
      `MEMBERSHIPS: ${a.memberships.map((m) => `${m.organizations?.name}${m.role ? ` (${m.role})` : ""}`).join(", ") || "none"}.`,
      "",
      "RECENT ORDERS (newest first):",
      ...a.recentPackets.map((p) => `- round ${p.rounds?.number ?? "?"} [${p.mode}] ${p.orders.map((o) => `${o.verb} ${JSON.stringify(o.args).slice(0, 120)} (${o.status})`).join("; ")}`),
      "",
      "RECENT MAIL THEY SENT (newest first):",
      ...a.mail.map((m) => `--- to ${m.to.join(", ") || "?"} · ${m.received_at.slice(0, 10)} · ${m.subject ?? "(no subject)"}\n${m.body_text.slice(0, 700)}${m.correspondence_events.length ? `\n[extracted: ${m.correspondence_events.map((e) => e.kind).join(", ")}]` : ""}`),
    ];
    const system = "You are the showrunner's assistant for a play-by-email intrigue game set in 1977. From one player's record, write a brief for the showrunner (not the player). Three short sections with these headings: DONE (what they have actually done), PURSUING (what they appear to be after, their allies and targets, with the evidence), WATCH (engagement: active, drifting or gone; anything the showrunner should act on). Plain text, under 220 words. Say plainly when the record is too thin to judge. Do not invent events.";
    const ledger = async (r: LedgerRow) => { await db.from("model_ledger").insert({ tag: r.tag, model: r.model, ok: r.ok, status: r.status, ms: r.ms, prompt_tokens: r.usage?.prompt_tokens ?? null, completion_tokens: r.usage?.completion_tokens ?? null, error: r.error }); };
    const result = await chat([{ role: "system", content: system }, { role: "user", content: lines.join("\n").slice(0, 14000) }], { tag: "player_brief", maxTokens: 700, temperature: 0.4, think: false, patient: false, onLedger: ledger });
    await db.from("player_briefs").update({
      status: "done", body: result.text, model: result.model, through_round: latest?.number ?? null, error: null, finished_at: new Date().toISOString(),
      inputs: { sent: a.sent, received: a.received, rounds: a.rounds, votes: a.votes.length, mail_read: a.mail.length },
    }).eq("id", briefId);
  } catch (e) {
    await db.from("player_briefs").update({ status: "failed", error: String((e as Error).message).slice(0, 500), finished_at: new Date().toISOString() }).eq("id", briefId);
    throw e;
  }
}
