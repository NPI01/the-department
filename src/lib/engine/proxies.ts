/* PROXY <ballot> TO <member> (rulebook §6.5): a member of a body lets another
   member carry their vote on one motion. Free, given or withdrawn any time
   before the close; a vote of your own always wins. At the close, a giver who
   has not voted votes as the holder voted (a staff holder votes by their
   lean, like any staff seat); a holder who abstained or did not vote leaves
   the giver abstaining. The holder is told; a proxy is a trust declared, not
   a secret one. Recorded in facts proxy.<motion>.<giver>. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { findInRoster, type Roster } from "./contacts";

type Db = SupabaseClient;
type Proxy = { to: string; to_name: string; round: number; motion_id: string };

export async function giveProxy(db: Db, p: { campaignId: string; roundId: string | null; round: number; motionNumber: string; giver: { id: string; name: string; slug: string }; to: string | null; roster: Roster }): Promise<{ ok: true; line: string } | { ok: false; error: string }> {
  const { data: m } = await db.from("motions").select("id, number, status, kind, opens_round, organization_id, organizations(name)").eq("campaign_id", p.campaignId).eq("number", p.motionNumber.toUpperCase()).maybeSingle();
  if (!m || m.status !== "open" || Number(m.opens_round) > p.round) return { ok: false, error: `no open ballot by the number ${p.motionNumber.toUpperCase()}` };
  if ((m as { kind?: string }).kind === "election") return { ok: false, error: `${m.number} is an election; there are no proxies in an election` };
  const org = (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) as { name: string } | null;
  const { data: members } = await db.from("memberships").select("character_id").eq("organization_id", m.organization_id);
  const memberIds = new Set((members ?? []).map((x) => x.character_id as string));
  if (!memberIds.has(p.giver.id)) return { ok: false, error: `${p.giver.name} has no vote on ${m.number}; only members of the ${org?.name ?? "body"} may give a proxy` };
  const key = `proxy.${m.number}.${p.giver.id}`;
  if (p.to === null) {
    const { data: had } = await db.from("facts").select("value").eq("campaign_id", p.campaignId).eq("key", key).maybeSingle();
    if (!had) return { ok: false, error: `${p.giver.name} holds no proxy out on ${m.number}` };
    await db.from("facts").delete().eq("campaign_id", p.campaignId).eq("key", key);
    return { ok: true, line: `REVOKED PROXY on ${m.number} — your vote is your own again` };
  }
  const holder = findInRoster(p.to, p.roster.filter((r) => r.id !== p.giver.id));
  if (!holder) return { ok: false, error: `no one in the directory is called "${p.to}"` };
  if (!memberIds.has(holder.id)) return { ok: false, error: `${holder.name} is not a member of the ${org?.name ?? "body"} and cannot carry a vote on ${m.number}` };
  const value: Proxy = { to: holder.id, to_name: holder.name, round: p.round, motion_id: m.id as string };
  await db.from("facts").upsert({ campaign_id: p.campaignId, key, value, established_round: p.round, secret: true }, { onConflict: "campaign_id,key" });
  // The holder is told.
  const text = `${p.giver.name} has given you their proxy on ${m.number}: unless they vote themselves, their vote follows yours`;
  if (holder.player) await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "intake", kind: "proxy.given", payload: { motion: m.number, from: p.giver.id, from_name: p.giver.name, to: holder.id, text, round: p.round }, idempotency_key: `proxy:${m.id}:${p.giver.id}:${holder.id}:${p.round}`, visible_to: [holder.id] });
  else await db.from("knowledge").insert({ character_id: holder.id, fact_key: `told:${p.giver.slug}:proxy:${m.number}`, value: { kind: "info_share", text, from: p.giver.id, from_name: p.giver.name, round: p.round }, confidence: 1, source_kind: "told", source_ref: null, learned_round: p.round });
  return { ok: true, line: `PROXY ${m.number} → ${holder.name} — your vote follows theirs unless you vote yourself; PROXY ${m.number} TO NOBODY takes it back` };
}

/* At the close, after staff seats have voted: givers who did not vote vote as their holder did. */
export async function applyProxies(db: Db, p: { campaignId: string; motionId: string; motionNumber: string | null; round: number }): Promise<number> {
  if (!p.motionNumber) return 0;
  const { data: facts } = await db.from("facts").select("key, value").eq("campaign_id", p.campaignId).like("key", `proxy.${p.motionNumber}.%`);
  if (!facts?.length) return 0;
  const { data: votes } = await db.from("votes").select("character_id, choice").eq("motion_id", p.motionId);
  const choice = new Map((votes ?? []).map((v) => [v.character_id as string, v.choice as string]));
  let n = 0;
  for (const f of facts) {
    const giver = (f.key as string).split(".").pop()!;
    const v = f.value as Proxy;
    if (choice.has(giver)) continue;                 // their own vote wins
    const c = choice.get(v.to) ?? "abstain";
    await db.from("votes").insert({ motion_id: p.motionId, character_id: giver, choice: c, weight: 1, cast_round: p.round, source: "proxy", secret: false });
    n++;
  }
  return n;
}

/* For the giver's dispatch. */
export async function proxiesOf(db: Db, campaignId: string, characterId: string): Promise<{ motion: string; to_name: string }[]> {
  const { data } = await db.from("facts").select("key, value").eq("campaign_id", campaignId).like("key", "proxy.%").like("key", `%.${characterId}`);
  return (data ?? []).map((f) => ({ motion: (f.key as string).split(".")[1], to_name: (f.value as Proxy).to_name }));
}
