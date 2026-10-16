import type { SupabaseClient } from "@supabase/supabase-js";
import { stripQuoted } from "@/lib/email/inbound";

/* The Case File: everything a character holds, as their own copy, plus the
   player's private notes. Items come from two places: case_items (documents,
   photographs, maps, findings, filed by the engine or the console) and the
   letters the character sent or received, read straight from correspondence.
   Nothing here touches facts or secret canon. Notes are the player's alone:
   no character, model or job reads case_notes. */

export type Drawer = "correspondence" | "documents" | "photographs" | "maps" | "research" | "findings";
export type Grade = "intelligence" | "evidence" | "finding";
export type ItemStatus = "held" | "handed_over" | "seized" | "stolen" | "destroyed";

export type CaseItem = {
  key: string;                // short name in orders, and what notes point at
  kind: string;
  drawer: Drawer;
  title: string;
  from: string | null;
  to: string | null;
  writtenLabel: string | null;
  writtenOn: string | null;   // ISO date, for ordering by when it was written
  body: string | null;        // canon Markdown
  image: string | null;       // a URL the browser can load
  caption: string | null;
  round: number | null;
  receivedAt: string;         // ordering within a round
  how: string | null;
  copy: string | null;
  grade: Grade;
  status: ItemStatus;
  statusNote: string | null;
  statusRound: number | null;
};

export type CaseNote = { id: string; itemKey: string | null; quote: string | null; body: string; links: string[]; round: number | null; createdAt: string };

export type CaseFile = {
  character: { id: string; campaignId: string; name: string };
  campaignTitle: string;
  round: number | null;
  items: CaseItem[];
  notes: CaseNote[];
};

export const KINDS = ["letter", "memo", "document", "report", "photograph", "map", "diagram", "object", "testimony", "finding"] as const;
export const DRAWERS: Drawer[] = ["correspondence", "documents", "photographs", "maps", "research", "findings"];
export const GRADES: Grade[] = ["intelligence", "evidence", "finding"];
export const STATUSES: ItemStatus[] = ["held", "handed_over", "seized", "stolen", "destroyed"];
export const BUCKET = "case-file";

export const STATUS_LABEL: Record<ItemStatus, string> = { held: "Held", handed_over: "Handed over", seized: "Seized", stolen: "Stolen", destroyed: "Destroyed" };

/* An order-friendly short name: lowercase words joined by hyphens. */
export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 48);
}
export const letterKey = (correspondenceId: string) => `letter-${correspondenceId.slice(0, 8)}`;

export async function characterForToken(db: SupabaseClient, token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const { data: player } = await db.from("players").select("id").eq("file_token", token).maybeSingle();
  if (!player) return null;
  const { data: chars } = await db.from("characters").select("id, campaign_id, name").eq("player_id", player.id).order("created_at", { ascending: false }).limit(1);
  const c = chars?.[0];
  return c ? { id: c.id as string, campaignId: c.campaign_id as string, name: c.name as string } : null;
}

export async function currentRound(db: SupabaseClient, campaignId: string): Promise<number | null> {
  const { data } = await db.from("rounds").select("number").eq("campaign_id", campaignId).in("status", ["open", "locked", "resolving"]).order("number", { ascending: false }).limit(1).maybeSingle();
  return (data?.number as number | undefined) ?? null;
}

/* The in-game day a letter went out: Round 1 is Monday 10 October 1977 (see gameDate
   in email/letter.ts). Letters from before Round 1 are dated the day before. */
function gameDay(round: number | null) {
  const d = new Date(Date.UTC(1977, 9, 10 + (round ?? 0) - 1));
  return { iso: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) };
}

type ItemRow = {
  slug: string; kind: string; drawer: Drawer; title: string; from_label: string | null; written_label: string | null; written_on: string | null;
  body: string | null; image_path: string | null; caption: string | null; round_received: number | null; how_obtained: string | null; copy_note: string | null;
  grade: Grade; status: ItemStatus; status_note: string | null; status_round: number | null; created_at: string;
};
type LetterRow = { id: string; subject: string | null; body_text: string; from_character: string | null; to_characters: string[]; cc_characters: string[]; raw: { letter_kind?: string; classification?: string; office?: { office: string } | null; ballot?: string } | null; round_id: string | null; received_at: string };

/* Ballot notices are office letters (no in-world sender) that a player needs
   to keep, so they are filed with the correspondence. Other game notices
   (dispatches, receipts) are not. */
export function ballotNotices(db: SupabaseClient, campaignId: string, characterId: string) {
  return db.from("correspondence").select("id, subject, body_text, from_character, to_characters, cc_characters, raw, round_id, received_at")
    .eq("campaign_id", campaignId).is("from_character", null).not("raw->>ballot", "is", null).contains("to_characters", [characterId]).limit(100);
}

export async function loadCaseFile(db: SupabaseClient, character: { id: string; campaignId: string; name: string }): Promise<CaseFile> {
  const me = character.id;
  const [{ data: campaign }, { data: itemRows }, { data: letterRows }, { data: noteRows }, { data: rounds }, round] = await Promise.all([
    db.from("campaigns").select("title").eq("id", character.campaignId).maybeSingle(),
    db.from("case_items").select("slug, kind, drawer, title, from_label, written_label, written_on, body, image_path, caption, round_received, how_obtained, copy_note, grade, status, status_note, status_round, created_at").eq("character_id", me).order("created_at"),
    // Letters between characters: ones this character wrote or was sent. Game notices (no in-world sender) are not evidence.
    db.from("correspondence").select("id, subject, body_text, from_character, to_characters, cc_characters, raw, round_id, received_at")
      .eq("campaign_id", character.campaignId).not("from_character", "is", null)
      .or(`from_character.eq.${me},to_characters.cs.{${me}},cc_characters.cs.{${me}}`).order("received_at").limit(500),
    db.from("case_notes").select("id, item_key, quote, body, links, round, created_at").eq("character_id", me).order("created_at"),
    db.from("rounds").select("id, number, opens_at").eq("campaign_id", character.campaignId).order("number"),
    currentRound(db, character.campaignId),
  ]);
  const { data: noticeRows } = await ballotNotices(db, character.campaignId, me);

  const roundById = new Map(((rounds ?? []) as { id: string; number: number }[]).map((r) => [r.id, r.number]));
  const roundAt = (iso: string) => {
    let n: number | null = null;
    for (const r of (rounds ?? []) as { number: number; opens_at: string }[]) if (r.opens_at <= iso) n = r.number;
    return n;
  };
  // A form filed from the hosted page is a document (its own Case File item), not a letter.
  const letters = [...((letterRows ?? []) as LetterRow[]).filter((l) => l.raw?.letter_kind !== "form" && l.raw?.letter_kind !== "initiative"), ...((noticeRows ?? []) as LetterRow[])].sort((a, b) => a.received_at.localeCompare(b.received_at));
  const people = new Set(letters.flatMap((l) => [l.from_character, ...l.to_characters]).filter((x): x is string => !!x));
  const { data: chars } = people.size ? await db.from("characters").select("id, name, title").in("id", [...people]) : { data: [] };
  const who = new Map(((chars ?? []) as { id: string; name: string; title: string | null }[]).map((c) => [c.id, c.id === me ? "You" : c.title ? `${c.name}, ${c.title}` : c.name]));

  // TODO(aliases): when ESTABLISH_ALIAS lands, a letter written under an alias must show the alias here, never the owner.
  const letterItems: CaseItem[] = letters.map((l) => {
    const mine = l.from_character === me;
    const round = (l.round_id ? roundById.get(l.round_id) : undefined) ?? roundAt(l.received_at);
    const day = gameDay(round);
    const kind = l.raw?.ballot ? "notice" : l.raw?.letter_kind === "memo" ? "memo" : "letter";
    return {
      key: letterKey(l.id), kind, drawer: "correspondence", title: l.subject?.trim() || "(no subject)",
      from: l.from_character ? who.get(l.from_character) ?? "Unknown" : l.raw?.office?.office ?? "Royce Industries", to: l.to_characters.map((t) => who.get(t) ?? "Unknown").join("; ") || null,
      writtenLabel: day.label, writtenOn: day.iso, body: mine ? stripQuoted(l.body_text) : l.body_text,
      image: null, caption: null, round, receivedAt: l.received_at,
      how: mine ? "You wrote it. This is your carbon." : "Delivered to you through the mail room.",
      copy: mine ? "Your copy of a letter you sent" : `Original, addressed to you${l.raw?.classification ? ` · ${l.raw.classification}` : ""}`,
      grade: "evidence", status: "held", statusNote: null, statusRound: null,
    };
  });

  const rows = (itemRows ?? []) as ItemRow[];
  const stored = rows.map((r) => r.image_path).filter((p): p is string => !!p && !p.startsWith("/"));
  const signed = new Map<string, string>();
  if (stored.length) {
    const { data } = await db.storage.from(BUCKET).createSignedUrls(stored, 60 * 60);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }
  const fileItems: CaseItem[] = rows.map((r) => ({
    key: r.slug, kind: r.kind, drawer: r.drawer, title: r.title, from: r.from_label, to: null, writtenLabel: r.written_label, writtenOn: r.written_on,
    body: r.body, image: r.image_path ? (r.image_path.startsWith("/") ? r.image_path : signed.get(r.image_path) ?? null) : null, caption: r.caption,
    round: r.round_received, receivedAt: r.created_at, how: r.how_obtained, copy: r.copy_note, grade: r.grade, status: r.status, statusNote: r.status_note, statusRound: r.status_round,
  }));

  return {
    character, campaignTitle: (campaign?.title as string | undefined) ?? "Royce Industries", round,
    items: [...letterItems, ...fileItems],
    notes: ((noteRows ?? []) as { id: string; item_key: string | null; quote: string | null; body: string; links: string[]; round: number | null; created_at: string }[])
      .map((n) => ({ id: n.id, itemKey: n.item_key, quote: n.quote, body: n.body, links: n.links ?? [], round: n.round, createdAt: n.created_at })),
  };
}
