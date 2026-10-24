/* The societies and how they approach people. Interest is computed from what
   the engine already records (knowledge, Case File, letters written); when it
   crosses a society's threshold the society writes, once, with a card the
   player can examine. Accepting (a reply, or attending the meeting named)
   joins the society; a provocation is Security's trap and joins nothing.
   Membership is never automatically betrayal of Royce. PROPOSED 2026-10-14. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { newMessageId, gameMailbox } from "@/lib/email/resend";
import { gameDate } from "@/lib/email/letter";
import { seizeHoldings } from "./equipment";

type Trigger = { w: number } & ({ knows: string } | { holds: string } | { wrote_to: string } | { form_q11: true } | { noticed_by_security: number });

export type Society = {
  slug: string; name: string; org: string | null;             // org: the organizations.name; null for a provocation
  approacher: string;                                           // NPC slug who writes, or whose name the letter uses
  letterhead?: { name: string; place: string } | null;
  threshold: number;
  meeting: { place: string; text: string };
  triggers: Trigger[];
  invitation: { subject: string; body: string; card: { slug: string; title: string; body: string; wrongDetail: { text: string; grants: string } } };
  genuine: boolean;
};

export const SOCIETIES: Society[] = [
  {
    slug: "vigil", name: "the Vigil", org: "Council of the Vigil (Keepers)", approacher: "bernard", threshold: 3, genuine: true,
    meeting: { place: "tagus-church", text: "the church at dusk, any day this week; bring nothing and no light" },
    triggers: [{ knows: "visited.tagus-church", w: 1 }, { knows: "visited.tagus-cemetery", w: 1 }, { knows: "tagus.tower_hum_heard", w: 2 }, { knows: "tagus.1921_row_no_frost_seen", w: 2 }, { holds: "vetch-page", w: 2 }, { wrote_to: "bernard", w: 2 }, { form_q11: true, w: 1 }, { knows: "vetch_page.paper_anachronism_noticed", w: 1 }, { knows: "tagus.1921_burials_same_week", w: 1 }, { knows: "vigil.farm_meeting_seen", w: 1 }, { knows: "visited.tagus-cellar", w: 1 }, { knows: "tagus.man_came_up_seen", w: 1 }, { wrote_to: "rud", w: 2 }, { knows: "tagus.pgs_man_at_farm_seen", w: 1 }, { knows: "account.filed", w: 1 }, { knows: "descended.tagus", w: 1 }],
    invitation: { subject: "(no subject)", body: "Friend,\n\nYou have been out to the church, or you have written, or you have heard it. That is enough for the council to ask. We are not what the papers say and we are not what the company says. We keep a thing asleep by remembering it wrong on purpose, and we are getting old.\n\nIf you want to understand, come to the church at dusk any evening this week. Bring nothing. Bring no light. If you do not come, nothing follows, and nobody will ask again.\n\nIf you show this to the company, we will know by Thursday.\n\nE.",
      card: { slug: "vigil-invitation", title: "A folded note, delivered by hand (the Vigil)", body: "A half sheet, folded twice, pencil. *Come to the church at dusk. Bring nothing. Bring no light.* Under it, a ring with a short bar across it, drawn carefully, and the letter E.", wrongDetail: { text: "the hand is Elmer Bernard's, down to the way he crosses an E; this came from Tagus, not from the company", grants: "vigil.invitation_hand_noticed" } } },
  },
  {
    slug: "congregation", name: "the Congregation of the Last Light", org: "The Congregation of the Last Light (Ascendant cell)", approacher: "sayer", threshold: 3, genuine: true,
    meeting: { place: "tagus-elevator", text: "the old grain elevator in Tagus, after midnight, any night this week" },
    triggers: [{ wrote_to: "sayer", w: 2 }, { holds: "sayer-letter-with-royce-layout", w: 1 }, { holds: "greeley-notebook", w: 2 }, { holds: "greeley-notebook-page", w: 1 }, { knows: "is.future_jobs_unattended_noticed", w: 1 }, { knows: "b7.lights_at_night_seen", w: 1 }, { knows: "b9.night_delivery_seen", w: 1 }, { wrote_to: "jthorne", w: 1 }, { knows: "congregation.elevator_meeting_seen", w: 1 }, { knows: "greeley.last_entry_describes_test", w: 1 }, { knows: "visited.tagus-cellar", w: 1 }, { holds: "brandvold-field-book", w: 1 }, { knows: "tagus.installation_eleven_minutes_seen", w: 1 }, { knows: "tagus.instrument_rise_matches_choir_nights_noticed", w: 2 }, { knows: "visited.tagus-shaft", w: 1 }, { knows: "descent.threshold.2", w: 2 }],
    invitation: { subject: "The shapes of the rooms, again", body: "Dear Colleague,\n\nYou have read what I sent, or you have seen the lights, or you have looked at the log and not looked away. Good. The old men in Tagus want to keep it asleep. We think it has been asleep long enough.\n\nThere are people near you who feel as you do, and one of them is closer than you think. Go to the old grain elevator in Tagus after midnight, any night this week, and knock twice. Or write to me and say the word *April*, and someone will find you.\n\nMartin Sayer",
      card: { slug: "congregation-invitation", title: "A card with a ring and a bar, and a time (the Congregation)", body: "A plain card. The ring-and-bar symbol, drawn with a compass. *The elevator. After midnight. Knock twice.* On the back, typed: *the last light is the first.*", wrongDetail: { text: "the typeface is the IBM Selectric face used in Information Systems and nowhere else on campus; this card was typed in Building 3", grants: "congregation.card_typed_in_is_noticed" } } },
  },
  {
    slug: "provocation", name: "the Vigil", org: null, approacher: "fisk", letterhead: { name: "The Vigil", place: "Tagus, North Dakota" }, threshold: 3, genuine: false,
    meeting: { place: "building-2-lockers", text: "the Building 2 locker room at 2300 on Thursday" },
    triggers: [{ noticed_by_security: 3, w: 3 }],
    invitation: { subject: "(no subject)", body: "You have been seen where you should not have been, and we are glad of it. The company does not know what it has. We do.\n\nIf you want to know what is under Building 7, be in the Building 2 locker room at 2300 on Thursday. Come alone. Tell no one at the company.\n\n— the Vigil",
      card: { slug: "provocation-invitation", title: "A typed note signed 'the Vigil'", body: "A typed note on heavy bond paper. *Building 2 locker room, 2300, Thursday. Come alone.* Signed, typed, *the Vigil*.", wrongDetail: { text: "held to the light the paper carries the RI watermark; it is Royce bond, and the Vigil, whatever it is, does not buy its stationery from Procurement", grants: "provocation.royce_watermark_noticed" } } },
  },
];

export function societyByName(text: string): Society | null {
  const t = text.toLowerCase();
  if (/congregation|last light|ascendant/.test(t)) return SOCIETIES[1];
  if (/vigil|keeper|council|church/.test(t)) return SOCIETIES[0];
  return null;
}

async function interest(db: SupabaseClient, campaignId: string, characterId: string, s: Society): Promise<number> {
  const [{ data: kn }, { data: items }, { data: wrote }, { data: forms }] = await Promise.all([
    db.from("knowledge").select("fact_key").eq("character_id", characterId),
    db.from("case_items").select("slug").eq("character_id", characterId).eq("status", "held"),
    db.from("correspondence").select("to_characters").eq("campaign_id", campaignId).eq("from_character", characterId),
    db.from("correspondence_events").select("payload, correspondence!inner(from_character)").eq("kind", "form_submission").eq("correspondence.from_character", characterId),
  ]);
  const knows = new Set((kn ?? []).map((k) => k.fact_key as string));
  const holds = (items ?? []).map((i) => i.slug as string);
  const wroteTo = new Set((wrote ?? []).flatMap((w) => w.to_characters as string[]));
  const { data: npcs } = await db.from("characters").select("id, slug").eq("campaign_id", campaignId).is("player_id", null);
  const npcId = (slug: string) => (npcs ?? []).find((n) => n.slug === slug)?.id as string | undefined;
  const q11 = (forms ?? []).some((f) => { const a = (f.payload as { answers?: Record<string, string> }).answers ?? {}; const v = (a["11"] ?? "").trim(); return v && !/^none\b/i.test(v); });
  let score = 0;
  for (const t of s.triggers) {
    if ("knows" in t && knows.has(t.knows)) score += t.w;
    else if ("holds" in t && holds.some((h) => h === t.holds || h.startsWith(t.holds + "-from-"))) score += t.w;
    else if ("wrote_to" in t && npcId(t.wrote_to) && wroteTo.has(npcId(t.wrote_to)!)) score += t.w;
    else if ("form_q11" in t && q11) score += t.w;
    else if ("noticed_by_security" in t) {
      const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
      const { count } = await db.from("knowledge").select("id", { count: "exact", head: true }).in("character_id", (sec ?? []).map((x) => x.id)).like("fact_key", "noticed:%").contains("value", { from: characterId });
      if ((count ?? 0) >= t.noticed_by_security) score += t.w;
    }
  }
  return score;
}

/* At the morning, from Episode 3 day 5 (07 §arc) on: each society writes once to whoever has earned it. */
export async function issueInvitations(db: SupabaseClient, campaignId: string, round: { id: string; number: number; episode: number; episodeRound: number }): Promise<number> {
  if (round.episode < 3 || (round.episode === 3 && round.episodeRound < 5)) return 0;
  const { data: pcs } = await db.from("characters").select("id, name, players(email)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const { data: npcs } = await db.from("characters").select("id, slug").eq("campaign_id", campaignId).is("player_id", null);
  let n = 0;
  for (const pc of pcs ?? []) {
    const email = ((Array.isArray(pc.players) ? pc.players[0] : pc.players) as { email: string } | null)?.email ?? null;
    for (const s of SOCIETIES) {
      const key = `invite:${s.slug}:${pc.id}`;
      const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
      if (dup) continue;
      if ((await interest(db, campaignId, pc.id as string, s)) < s.threshold) continue;
      const from = s.genuine ? (npcs ?? []).find((x) => x.slug === s.approacher)?.id ?? null : null;
      const { data: row } = await db.from("correspondence").insert({ campaign_id: campaignId, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: from, to_characters: [pc.id], to_addresses: email ? [email] : [], subject: s.invitation.subject, body_text: s.invitation.body, raw: { letter_kind: "letter", invitation: s.slug, letterhead: s.letterhead ?? null, office: s.genuine ? null : { office: s.letterhead?.name ?? s.name } } }).select("id").single();
      if (row && email) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
      await db.from("case_items").upsert({ campaign_id: campaignId, character_id: pc.id, slug: s.invitation.card.slug, kind: "letter", drawer: "documents", title: s.invitation.card.title, written_label: gameDate(round.number), body: s.invitation.card.body, round_received: round.number, how_obtained: "Found in your tray, no envelope.", copy_note: "The note itself.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug", ignoreDuplicates: true });
      await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "open", kind: "society.invited", payload: { society: s.slug, genuine: s.genuine, character: pc.id, correspondence_id: row?.id ?? null, round: round.number }, idempotency_key: key });
      n++;
    }
  }
  return n;
}

export async function outstandingInvitations(db: SupabaseClient, campaignId: string, characterId: string): Promise<Society[]> {
  const { data: inv } = await db.from("events").select("payload").eq("campaign_id", campaignId).eq("kind", "society.invited").contains("payload", { character: characterId });
  const { data: done } = await db.from("events").select("payload").eq("campaign_id", campaignId).in("kind", ["society.joined", "society.declined", "society.trapped"]).contains("payload", { character: characterId });
  const closed = new Set((done ?? []).map((e) => (e.payload as { society: string }).society));
  return (inv ?? []).map((e) => (e.payload as { society: string }).society).filter((s) => !closed.has(s)).map((s) => SOCIETIES.find((x) => x.slug === s)!).filter(Boolean);
}

/* Accept: by reply (ACCEPT INVITATION …) or by attending the meeting named. */
export async function acceptInvitation(db: SupabaseClient, p: { campaignId: string; roundId: string; roundNo: number; characterId: string; characterName: string; characterSlug: string; society: Society }): Promise<string> {
  const s = p.society;
  if (!s.genuine) {
    // Security's trap: nothing to join; Security now has a name.
    const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", p.campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
    for (const x of sec ?? []) await db.from("knowledge").insert({ character_id: x.id, fact_key: `noticed:${p.characterSlug}:bait`, value: { kind: "noticed", text: `${p.characterName} answered the Vigil note Security sent, and came to the locker room`, from: p.characterId, from_name: p.characterName, round: p.roundNo }, confidence: 1, source_kind: "told", learned_round: p.roundNo });
    await db.from("facts").upsert({ campaign_id: p.campaignId, key: `purge.${p.characterId}.flag`, value: { reason: "took the bait", round: p.roundNo }, established_round: p.roundNo, secret: true }, { onConflict: "campaign_id,key" });
    await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "strategic", kind: "society.trapped", payload: { society: s.slug, character: p.characterId, round: p.roundNo }, idempotency_key: `trapped:${s.slug}:${p.characterId}` });
    return `${p.characterName} went to the Building 2 locker room at 2300 and waited. Nobody came. A light was on in the Security office across the lot, and it stayed on.`;
  }
  const { data: org } = await db.from("organizations").select("id").eq("campaign_id", p.campaignId).eq("name", s.org!).single();
  await db.from("memberships").upsert({ organization_id: org!.id, character_id: p.characterId, role: "initiate", voting_weight: 0, since_round: p.roundNo }, { onConflict: "organization_id,character_id" });
  await db.from("knowledge").insert({ character_id: p.characterId, fact_key: `member.${s.slug}`, value: { true: true, round: p.roundNo }, confidence: 1, source_kind: "witnessed", learned_round: p.roundNo });
  const { data: npc } = await db.from("characters").select("id, name").eq("campaign_id", p.campaignId).eq("slug", s.approacher).single();
  if (npc) {
    await db.from("knowledge").insert({ character_id: npc.id, fact_key: `told:${p.characterSlug}:joined:${s.slug}`, value: { kind: "joined", text: `${p.characterName} accepted ${s.name}'s invitation and came`, from: p.characterId, from_name: p.characterName, round: p.roundNo }, confidence: 1, source_kind: "told", learned_round: p.roundNo });
    // The approacher writes the note a new member gets, through the usual pipeline.
    const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, round_id: p.roundId, direction: "inbound", message_id: newMessageId(), from_character: p.characterId, to_characters: [npc.id], to_addresses: [gameMailbox().address], subject: `In person: ${p.characterName} came`, body_text: `[In person, ${gameDate(p.roundNo)}.] ${p.characterName} accepted the invitation and came to ${s.meeting.text.split(",")[0]}. They are now an initiate of ${s.name}.`, trusted: true, raw: { letter_kind: "interview", verb: "join", source: "society" } }).select("id").single();
    if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: npc.id }, run_after: new Date(Date.now() + 120_000).toISOString() });
  }
  await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "strategic", kind: "society.joined", payload: { society: s.slug, character: p.characterId, round: p.roundNo }, idempotency_key: `joined:${s.slug}:${p.characterId}`, visible_to: [p.characterId] });
  return `${p.characterName} went where the note said and was let in. ${s.name} has taken them as an initiate; what that means arrives in their own words.`;
}

export async function declineInvitation(db: SupabaseClient, p: { campaignId: string; roundId: string; roundNo: number; characterId: string; society: Society }) {
  await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "intake", kind: "society.declined", payload: { society: p.society.slug, character: p.characterId, round: p.roundNo }, idempotency_key: `declined:${p.society.slug}:${p.characterId}:${p.roundNo}` });
}

/* Security's purge, at the lock of Episode 3 day 7: named employees are summoned and their access restricted for two rounds. */
export async function securityPurge(db: SupabaseClient, campaignId: string, round: { id: string; number: number }): Promise<string[]> {
  const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
  const secIds = (sec ?? []).map((x) => x.id as string);
  const { data: pcs } = await db.from("characters").select("id, name, players(email)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const { data: sloane } = await db.from("characters").select("id").eq("campaign_id", campaignId).eq("slug", "sloane").maybeSingle();
  const named: string[] = [];
  for (const pc of pcs ?? []) {
    const { count } = await db.from("knowledge").select("id", { count: "exact", head: true }).in("character_id", secIds).like("fact_key", "noticed:%").contains("value", { from: pc.id });
    const { data: flag } = await db.from("facts").select("key").eq("campaign_id", campaignId).eq("key", `purge.${pc.id}.flag`).maybeSingle();
    const { count: reported } = await db.from("knowledge").select("id", { count: "exact", head: true }).in("character_id", secIds).like("fact_key", "reported:%").contains("value", { about: pc.id });
    if ((count ?? 0) < 3 && !flag && !(reported ?? 0)) continue;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", `summons:${pc.id}`).maybeSingle();
    if (dup) continue;
    await db.from("facts").upsert({ campaign_id: campaignId, key: `purge.${pc.id}.restricted_until`, value: { round: round.number + 2 }, established_round: round.number, secret: true }, { onConflict: "campaign_id,key" });
    // Everything signed out in their name is collected (equipment.ts).
    const seized = await seizeHoldings(db, { campaignId, characterId: pc.id as string, round: round.number, roundId: round.id, by: "corporate-security", note: "Collected by Corporate Security pending interview." });
    const email = ((Array.isArray(pc.players) ? pc.players[0] : pc.players) as { email: string } | null)?.email ?? null;
    const { data: row } = await db.from("correspondence").insert({ campaign_id: campaignId, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: sloane?.id ?? null, to_characters: [pc.id], to_addresses: email ? [email] : [], subject: "Summons to interview", body_text: `${pc.name},\n\nYou are named for interview by Corporate Security under the review announced to all staff. Report to Building 1, Room 112, at 0900 on the next working day. Your access to Records and to restricted areas is suspended until the interview is complete.${seized.length ? ` Equipment signed out in your name (${seized.join(", ")}) has been collected from your desk.` : ""} Do not discuss this summons.\n\nH. Sloane, Director`, raw: { letter_kind: "memo", classification: "Limited Distribution", summons: true } }).select("id").single();
    if (row && email) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
    await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "world", kind: "security.summons", payload: { character: pc.id, round: round.number, restricted_until: round.number + 2 }, idempotency_key: `summons:${pc.id}`, visible_to: [pc.id] });
    named.push(pc.name as string);
  }
  return named;
}

export async function accessRestricted(db: SupabaseClient, campaignId: string, characterId: string, roundNo: number): Promise<boolean> {
  const { data } = await db.from("facts").select("value").eq("campaign_id", campaignId).eq("key", `purge.${characterId}.restricted_until`).maybeSingle();
  return Number((data?.value as { round?: number } | null)?.round ?? 0) >= roundNo;
}
