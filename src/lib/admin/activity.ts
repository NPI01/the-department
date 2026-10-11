import type { SupabaseClient } from "@supabase/supabase-js";
import type { Agreement, Character } from "./queries";

/* Activity reads that take a client, so both the console (after its admin
   check) and the job worker (service role, no session) can use them. */

export async function namesWith(db: SupabaseClient, campaignId: string) {
  const { data } = await db.from("characters").select("id, name, slug, player_id").eq("campaign_id", campaignId);
  return new Map(((data ?? []) as { id: string; name: string; slug: string; player_id: string | null }[]).map((c) => [c.id, c]));
}

/* What a player's character has done: the raw material for the console's
   activity panel and for the model-written brief. */
export async function activityWith(db: SupabaseClient, character: Character) {
  const cid = character.id;
  const head = { count: "exact" as const, head: true };
  const [sent, received, { data: packets }, { data: votes }, { data: recentMail }, { data: agreements }, { data: memberships }, names] = await Promise.all([
    db.from("correspondence").select("id", head).eq("from_character", cid),
    db.from("correspondence").select("id", head).contains("to_characters", [cid]),
    db.from("order_packets").select("mode, source, rounds(number), orders(verb, args, status, ruling)").eq("character_id", cid),
    db.from("votes").select("choice, cast_round, source, motions(number, title, status)").eq("character_id", cid).order("cast_round", { ascending: false }),
    db.from("correspondence").select("id, subject, body_text, to_characters, received_at, correspondence_events(kind, payload, confidence, span)").eq("from_character", cid).order("received_at", { ascending: false }).limit(12),
    db.from("agreements").select("title, kind, status, parties, accepted_by, proposed_round").contains("parties", [cid]),
    db.from("memberships").select("role, organizations(name)").eq("character_id", cid),
    namesWith(db, character.campaign_id),
  ]);
  type Packet = { mode: string; source: string; rounds: { number: number } | null; orders: { verb: string; args: Record<string, unknown>; status: string; ruling: string | null }[] };
  const ps = ((packets ?? []) as unknown as Packet[]).sort((a, b) => (b.rounds?.number ?? 0) - (a.rounds?.number ?? 0));
  const modes = ps.reduce<Record<string, number>>((m, p) => ({ ...m, [p.mode]: (m[p.mode] ?? 0) + 1 }), {});
  const verbs = ps.flatMap((p) => p.orders).reduce<Record<string, number>>((m, o) => ({ ...m, [o.verb]: (m[o.verb] ?? 0) + 1 }), {});
  type MailRow = { id: string; subject: string | null; body_text: string; to_characters: string[]; received_at: string; correspondence_events: { kind: string; payload: Record<string, unknown>; confidence: number; span: string | null }[] };
  const mail = ((recentMail ?? []) as MailRow[]).map((m) => ({ ...m, to: m.to_characters.map((t) => names.get(t)?.name ?? "?") }));
  const contacts = mail.flatMap((m) => m.to).reduce<Record<string, number>>((acc, n) => ({ ...acc, [n]: (acc[n] ?? 0) + 1 }), {});
  return {
    sent: sent.count ?? 0,
    received: received.count ?? 0,
    rounds: ps.length,
    modes,
    verbs,
    recentPackets: ps.slice(0, 6),
    votes: (votes ?? []) as unknown as { choice: string; cast_round: number; source: string; motions: { number: string | null; title: string; status: string } | null }[],
    mail,
    contacts: Object.entries(contacts).sort((a, b) => b[1] - a[1]),
    agreements: ((agreements ?? []) as Agreement[]).map((a) => ({ ...a, partyNames: a.parties.map((x) => names.get(x)?.name ?? "?") })),
    memberships: (memberships ?? []) as unknown as { role: string | null; organizations: { name: string } | null }[],
  };
}

