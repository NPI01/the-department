/* The standing layer: things a player sets once that shape how every later
   night resolves. Rulebook §6.4, §6.7, §7.10. After Starweb (conditional fire,
   ambush, ally and loader declarations) and Quest (attitudes). Deterministic;
   no model anywhere here.

     presence         who touched what tonight, written as orders resolve
                      (resolve.ts returns it; the strategic phase records it)
     conditions       IF <trigger> THEN <order>: parsed at intake against the
                      roster and the index, judged after the night's first pass
                      against the presence ledger, the record and the ballots
     contact reports  two people who touched the same place, file or person in
                      one night each learn the other was there, unless one of
                      them was covert (a watcher, an Operative, a thief)
     watchful hold    a character who held, or sent nothing, learns who pulled
                      their department's files and who reported them
     declarations     AUTHORIZE / REVOKE / ATTITUDE toward a named colleague,
                      never disclosed to that colleague */
import type { SupabaseClient } from "@supabase/supabase-js";
import { surnameKey } from "@/lib/email/inbound";
import { documentsFor, placesFor } from "./world";
import { guardsTonight, selfGuarded } from "./custody";
import type { DocumentDef, PlaceDef } from "./world/types";

type Db = SupabaseClient;

export type Presence = { kind: "place" | "document" | "person"; slug: string; name: string; verb: string; covert?: boolean };

/* Verbs whose presence at a place is seen by anyone else there; a watcher's is not. */
const OVERT = new Set(["visit", "search", "attend", "interview", "request_files", "lobby"]);

export type Condition =
  | { kind: "request"; who: string | null; who_name: string | null; doc: string; doc_title: string }
  | { kind: "at_place"; who: string | null; who_name: string | null; place: string; place_name: string }
  | { kind: "watches"; who: string | null; who_name: string | null; place: string; place_name: string }
  | { kind: "reported"; who: string | null; who_name: string | null }
  | { kind: "motion"; motion: string; result: "passed" | "failed" }
  | { kind: "fallback" };

export type Roster = { id: string; slug: string; name: string; player: boolean }[];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const ANYONE = /^(?:anyone|anybody|someone|somebody|any\s+(?:colleague|player|employee|one)|a\s+colleague|an\s+employee|they|people|somebody\s+else|anyone\s+else)$/;

export function findDocumentDef(text: string, episode: number): DocumentDef | null {
  const t = norm(text); let best: { d: DocumentDef; n: number } | null = null;
  for (const d of documentsFor(episode)) for (const a of d.aliases.map(norm)) if (a && t.includes(a) && (!best || a.length > best.n)) best = { d, n: a.length };
  return best?.d ?? null;
}
export function findPlaceDef(text: string, episode: number): PlaceDef | null {
  const t = norm(text); let best: { p: PlaceDef; n: number } | null = null;
  for (const p of placesFor(episode)) for (const a of p.aliases.map(norm)) if (a && t.includes(a) && (!best || a.length > best.n)) best = { p, n: a.length };
  return best?.p ?? null;
}

/* "Okafor" / "Dr. Ely" / "Maya Okafor" against the roster. */
export function findInRoster(text: string, roster: Roster): Roster[number] | null {
  const key = surnameKey(text.replace(/^(?:my colleague|colleague|the)\s+/i, ""));
  if (!key) return null;
  return roster.find((x) => x.slug === key) ?? roster.find((x) => surnameKey(x.name) === key) ?? roster.find((x) => x.name.toLowerCase().includes(key)) ?? null;
}

/* The trigger of a conditional order, read at intake. Errors are for the
   receipt: a condition the clerk cannot read is not filed. */
export function parseCondition(trigger: string, p: { roster: Roster; episode: number }): { condition: Condition; label: string } | { error: string } {
  const t = trigger.trim().replace(/^if\s+/i, "").replace(/[.;,]+$/, "").trim();
  const low = t.toLowerCase();
  let m: RegExpMatchArray | null;
  if ((m = low.match(/^(?:the\s+)?(?:motion|ballot|vote)?\s*([a-z]-\d{2}-\d{3})\s+(passes|carries|is carried|is passed|succeeds|goes through|is adopted|fails|is defeated|is rejected|does not pass|loses|is lost)\b/))) {
    const result = /pass|carr|succeed|through|adopt/.test(m[2]) ? "passed" : "failed";
    return { condition: { kind: "motion", motion: m[1].toUpperCase(), result }, label: `${m[1].toUpperCase()} ${result === "passed" ? "passes" : "fails"}` };
  }
  if (/^(?:the\s+)?(?:order|one|line)\s+above\s+(?:fails|cannot be done|is refused|is ruled out|does not go through|comes to nothing)$|^(?:that|it)\s+fails$|^otherwise$|^fallback$/.test(low)) return { condition: { kind: "fallback" }, label: "the order above fails" };
  const who = (s: string): { ok: true; id: string | null; name: string | null } | { ok: false; error: string } => {
    const w = s.trim().replace(/^(?:my\s+colleague\s+|colleague\s+)/i, "");
    if (ANYONE.test(w.toLowerCase())) return { ok: true, id: null, name: null };
    const hit = findInRoster(w, p.roster);
    return hit ? { ok: true, id: hit.id, name: hit.name } : { ok: false, error: `no one in the directory is called "${s.trim()}"` };
  };
  if ((m = t.match(/^(.+?)\s+(?:watches|surveils|stakes out|keeps an eye on|is watching|are watching)\s+(.+)$/i))) {
    const w = who(m[1]); if (!w.ok) return { error: w.error };
    const pl = findPlaceDef(m[2], p.episode); if (!pl) return { error: `the clerk could not place "${m[2]}"` };
    return { condition: { kind: "watches", who: w.id, who_name: w.name, place: pl.slug, place_name: pl.name }, label: `${w.name ?? "anyone"} watches ${pl.name}` };
  }
  if ((m = t.match(/^(.+?)\s+(?:reports?|turns? in|informs? on|denounces?)\s+(?:on\s+)?me\b/i))) {
    const w = who(m[1]); if (!w.ok) return { error: w.error };
    return { condition: { kind: "reported", who: w.id, who_name: w.name }, label: `${w.name ?? "anyone"} reports me to Security` };
  }
  if (/^i am reported\b/i.test(t)) return { condition: { kind: "reported", who: null, who_name: null }, label: "anyone reports me to Security" };
  if ((m = t.match(/^(.+?)\s+(?:requests?|pulls?|requisitions?|calls? for|asks?\s+(?:records\s+)?for|sends? for)\s+(.+)$/i))) {
    const w = who(m[1]); if (!w.ok) return { error: w.error };
    const d = findDocumentDef(m[2], p.episode); if (!d) return { error: `the clerk could not match "${m[2]}" to any file on the index` };
    return { condition: { kind: "request", who: w.id, who_name: w.name, doc: d.slug, doc_title: d.title }, label: `${w.name ?? "anyone"} requests "${d.title}"` };
  }
  if ((m = t.match(/^(.+?)\s+(?:is|are)\s+(?:seen\s+|found\s+|noticed\s+)?(?:at|in|near|around|inside)\s+(.+)$/i)) || (m = t.match(/^(.+?)\s+(?:goes|go|visits?|turns? up at|appears? at|shows? up at|searches|searches through|enters|gets? into|breaks? into|attends?)\s+(?:to\s+|into\s+)?(.+)$/i))) {
    const w = who(m[1]); if (!w.ok) return { error: w.error };
    const pl = findPlaceDef(m[2], p.episode); if (!pl) return { error: `the clerk could not place "${m[2]}"` };
    return { condition: { kind: "at_place", who: w.id, who_name: w.name, place: pl.slug, place_name: pl.name }, label: `${w.name ?? "anyone"} is seen at ${pl.name}` };
  }
  return { error: `the clerk could not read the condition "${t}". Conditions it can read: <name or anyone> requests <file>; <name or anyone> is seen at <place>; <name or anyone> watches <place>; <name or anyone> reports me; <ballot number> passes or fails; the order above fails` };
}

export function conditionLabel(c: Condition): string {
  switch (c.kind) {
    case "motion": return `${c.motion} ${c.result === "passed" ? "passes" : "fails"}`;
    case "fallback": return "the order above fails";
    case "reported": return `${c.who_name ?? "anyone"} reports me to Security`;
    case "request": return `${c.who_name ?? "anyone"} requests "${c.doc_title}"`;
    case "watches": return `${c.who_name ?? "anyone"} watches ${c.place_name}`;
    case "at_place": return `${c.who_name ?? "anyone"} is seen at ${c.place_name}`;
  }
}

/* ---------- the presence ledger ---------- */
export async function recordPresence(db: Db, p: { campaignId: string; roundId: string; characterId: string }, rows: Presence[]) {
  if (!rows.length) return;
  await db.from("presence").upsert(rows.map((r) => ({ campaign_id: p.campaignId, round_id: p.roundId, character_id: p.characterId, verb: r.verb, target_kind: r.kind, target_slug: r.slug, target_name: r.name, covert: Boolean(r.covert) })), { onConflict: "round_id,character_id,verb,target_kind,target_slug", ignoreDuplicates: true });
}

type PresenceRow = { character_id: string; verb: string; target_kind: "place" | "document" | "person"; target_slug: string; target_name: string; covert: boolean };

/* Judged after the night's first pass. The order's own packet is passed for the fallback. */
export async function conditionMet(db: Db, p: { campaignId: string; roundId: string; roundNo: number; me: string; packet: { seq: number; status: string; condition: unknown; outcome: { kind: string } | null }[]; seq: number }, c: Condition): Promise<{ met: boolean; because: string }> {
  if (c.kind === "motion") {
    const { data } = await db.from("motions").select("status, closes_round").eq("campaign_id", p.campaignId).eq("number", c.motion).maybeSingle();
    if (!data) return { met: false, because: `no ballot ${c.motion} on the books` };
    if (Number(data.closes_round) !== p.roundNo) return { met: false, because: `${c.motion} did not close tonight` };
    const met = data.status === c.result;
    return { met, because: `${c.motion} ${data.status === "passed" ? "carried" : data.status === "failed" ? "failed" : "is still open"}` };
  }
  if (c.kind === "fallback") {
    // The nearest earlier unconditional order in the packet.
    const prev = [...p.packet].filter((o) => o.seq < p.seq && !o.condition).sort((a, b) => b.seq - a.seq)[0];
    if (!prev) return { met: false, because: "there was no order above it" };
    const failed = prev.status === "skipped" || (prev.status === "resolved" && ["ruling", "refused", "nothing"].includes(prev.outcome?.kind ?? ""));
    return { met: failed, because: failed ? "the order above came to nothing" : "the order above went through" };
  }
  if (c.kind === "reported") {
    const { data } = await db.from("events").select("payload").eq("round_id", p.roundId).eq("kind", "security.reported").contains("payload", { about: p.me });
    const hit = (data ?? []).find((e) => !c.who || (e.payload as { by: string }).by === c.who);
    return { met: Boolean(hit), because: hit ? "a report was made" : "nobody reported you" };
  }
  const q = db.from("presence").select("character_id, verb, target_kind, target_slug, target_name, covert").eq("round_id", p.roundId).neq("character_id", p.me);
  const { data } = c.kind === "request" ? await q.eq("target_kind", "document").eq("target_slug", c.doc) : await q.eq("target_kind", "place").eq("target_slug", c.place);
  const rows = ((data ?? []) as PresenceRow[]).filter((r) => !c.who || r.character_id === c.who);
  const hit = c.kind === "request" ? rows.find((r) => r.verb === "request_files" || r.verb === "search")
    : c.kind === "watches" ? rows.find((r) => r.verb === "surveil")
    : rows.find((r) => OVERT.has(r.verb));
  return { met: Boolean(hit), because: hit ? "the condition was met" : "the condition was not met" };
}

/* ---------- contact reports and the watchful hold ---------- */
type Person = { id: string; slug: string; name: string; division: string | null; specialization: string | null; player: boolean };

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

async function securityIds(db: Db, campaignId: string): Promise<string[]> {
  const { data } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
  return (data ?? []).map((s) => s.id as string);
}

/* After every order of the night has resolved. Returns counts for the phase event. */
export async function contactReports(db: Db, round: { campaignId: string; id: string; number: number; episode: number }): Promise<{ seen: number; watched: number; passed_to_security: number }> {
  const [{ data: rows }, { data: packets }, { data: chars }, { data: decls }, { data: reports }] = await Promise.all([
    db.from("presence").select("character_id, verb, target_kind, target_slug, target_name, covert").eq("round_id", round.id),
    db.from("order_packets").select("character_id, mode, watch_except").eq("round_id", round.id),
    db.from("characters").select("id, slug, name, player_id, specialization, divisions(slug)").eq("campaign_id", round.campaignId).eq("status", "active"),
    db.from("declarations").select("from_character, to_character, attitude").eq("campaign_id", round.campaignId),
    db.from("events").select("payload").eq("round_id", round.id).eq("kind", "security.reported"),
  ]);
  const people = new Map<string, Person>(((chars ?? []) as unknown as { id: string; slug: string; name: string; player_id: string | null; specialization: string | null; divisions: { slug: string } | { slug: string }[] | null }[]).map((c) => [c.id, { id: c.id, slug: c.slug, name: c.name, player: Boolean(c.player_id), specialization: c.specialization, division: (Array.isArray(c.divisions) ? c.divisions[0] : c.divisions)?.slug ?? null }]));
  const attitude = new Map<string, "friendly" | "neutral" | "hostile">((decls ?? []).map((d) => [`${d.from_character}:${d.to_character}`, d.attitude as "friendly" | "neutral" | "hostile"]));
  const guarded = selfGuarded(await guardsTonight(db, round.campaignId, round.number));   // PROTECT myself: not listed tonight
  const covertFor = (r: PresenceRow) => r.covert || guarded.has(r.character_id) || people.get(r.character_id)?.specialization === "operative";
  const security = await securityIds(db, round.campaignId);
  const knowledge: Record<string, unknown>[] = []; const events: Record<string, unknown>[] = [];
  let seen = 0, watched = 0, passed = 0;

  // Who saw whom. A row is visible to another person at the same target unless it
  // is covert; a watcher's row is visible only to another watcher.
  const groups = new Map<string, PresenceRow[]>();
  for (const r of (rows ?? []) as PresenceRow[]) { const k = `${r.target_kind}:${r.target_slug}`; groups.set(k, [...(groups.get(k) ?? []), r]); }
  const reported = new Set<string>();
  for (const group of groups.values()) {
    for (const a of group) for (const b of group) {
      if (a.character_id === b.character_id) continue;
      const bVisible = !covertFor(b) && (b.verb !== "surveil" || a.verb === "surveil");
      if (!bVisible) continue;
      const key = `${a.character_id}:${b.character_id}:${b.target_kind}:${b.target_slug}`;
      if (reported.has(key)) continue; reported.add(key);
      const who = people.get(b.character_id); const me = people.get(a.character_id);
      if (!who || !me || !me.player) continue;
      const what = b.target_kind === "document" ? `"${b.target_name}"` : b.target_name;
      const text = b.target_kind === "document" ? `${who.name} also asked Records for ${what}` : b.target_kind === "person" ? `${who.name} was also in to see ${what}` : b.verb === "surveil" ? `${who.name} was also watching ${what}` : `${who.name} was at ${what}`;
      knowledge.push({ character_id: a.character_id, fact_key: `seen:${who.slug}:${round.number}:${b.target_kind}:${b.target_slug}`, value: { kind: "seen", text, who: who.id, who_name: who.name, what: b.target_name, verb: b.verb, round: round.number }, confidence: 0.9, source_kind: "witnessed", source_ref: null, learned_round: round.number });
      events.push({ campaign_id: round.campaignId, round_id: round.id, phase: "strategic", kind: "contact.seen", payload: { by: a.character_id, who: who.id, who_name: who.name, what: b.target_name, kind: b.target_kind, verb: b.verb, text, round: round.number }, idempotency_key: `seen:${round.id}:${key}`, visible_to: [a.character_id] });
      seen++;
      // A hostile attitude passes the sighting to Corporate Security the same night, unasked.
      if (attitude.get(`${a.character_id}:${b.character_id}`) === "hostile" && security.length) {
        const note = `${me.name} reports that ${text}, Round ${round.number}.`;
        for (const s of security) knowledge.push({ character_id: s, fact_key: `noticed:${who.slug}:${hash(note).toString(36)}`, value: { kind: "noticed", text: note, from: who.id, from_name: who.name, reported_by: me.id, round: round.number }, confidence: 1, source_kind: "told", source_ref: null, learned_round: round.number });
        passed++;
      }
    }
  }

  // The watchful hold: a character who held or sent nothing learns who pulled their
  // department's files and who reported them, except those they let pass.
  const docs = new Map(documentsFor(round.episode).map((d) => [d.slug, d]));
  const { data: locs } = await db.from("facts").select("key").eq("campaign_id", round.campaignId).like("key", "location.%");
  const away = new Set((locs ?? []).map((f) => (f.key as string).slice("location.".length)));
  for (const pk of packets ?? []) {
    if (pk.mode !== "hold" && pk.mode !== "missed") continue;
    if (away.has(pk.character_id as string)) continue;   // not at their desk: they are in a town somewhere
    const me = people.get(pk.character_id as string); if (!me?.player) continue;
    const pass = new Set<string>([...((pk.watch_except as string[] | null) ?? []), ...(decls ?? []).filter((d) => d.from_character === me.id && d.attitude === "friendly").map((d) => d.to_character as string)]);
    const notice = (who: Person, text: string, what: string, verb: string) => {
      const k = `${who.slug}:${verb}:${what}`;
      knowledge.push({ character_id: me.id, fact_key: `watch:${k}:${round.number}`, value: { kind: "watch", text, who: who.id, who_name: who.name, what, verb, round: round.number }, confidence: 1, source_kind: "witnessed", source_ref: null, learned_round: round.number });
      events.push({ campaign_id: round.campaignId, round_id: round.id, phase: "strategic", kind: "contact.watch", payload: { by: me.id, who: who.id, who_name: who.name, what, verb, text, round: round.number }, idempotency_key: `watch:${round.id}:${me.id}:${k}`, visible_to: [me.id] });
      watched++;
    };
    for (const r of (rows ?? []) as PresenceRow[]) {
      if (r.character_id === me.id || pass.has(r.character_id) || r.target_kind !== "document" || r.verb !== "request_files") continue;
      const d = docs.get(r.target_slug); const who = people.get(r.character_id);
      if (!d || !who || !me.division) continue;
      if (d.holder === me.division || d.access.department?.includes(me.division)) notice(who, `${who.name} asked Records for "${d.title}", one of ${me.division.replace(/-/g, " ")}'s files, while you were at your desk`, d.title, "request_files");
    }
    for (const e of reports ?? []) {
      const v = e.payload as { by: string; about: string };
      if (v.about !== me.id || pass.has(v.by)) continue;
      const who = people.get(v.by); if (!who) continue;
      notice(who, `${who.name} reported you to Corporate Security last night; you were at your desk when the clerk came by for your file`, "a report to Security", "report");
    }
  }
  if (knowledge.length) await db.from("knowledge").insert(knowledge);
  if (events.length) await db.from("events").upsert(events, { onConflict: "idempotency_key", ignoreDuplicates: true });
  return { seen, watched, passed_to_security: passed };
}

/* ---------- declarations ---------- */
export type Attitude = "friendly" | "neutral" | "hostile";

export async function setDeclaration(db: Db, p: { campaignId: string; from: string; to: string; round: number | null }, patch: { authorized?: boolean; attitude?: Attitude }): Promise<{ authorized: boolean; attitude: Attitude }> {
  const { data: cur } = await db.from("declarations").select("authorized, attitude").eq("from_character", p.from).eq("to_character", p.to).maybeSingle();
  let authorized = Boolean(cur?.authorized ?? false); let attitude = ((cur?.attitude as Attitude | undefined) ?? "neutral");
  if (patch.authorized !== undefined) authorized = patch.authorized;
  if (patch.attitude !== undefined) { attitude = patch.attitude; if (attitude === "hostile") authorized = false; }
  await db.from("declarations").upsert({ campaign_id: p.campaignId, from_character: p.from, to_character: p.to, authorized, attitude, updated_round: p.round, updated_at: new Date().toISOString() }, { onConflict: "from_character,to_character" });
  return { authorized, attitude };
}

/* Divisions whose files a character may pull as if they belonged to them:
   those of colleagues who authorized them or declared them a friend, and have
   not since declared them hostile. */
export async function authorizedDivisions(db: Db, campaignId: string, characterId: string): Promise<string[]> {
  const { data } = await db.from("declarations").select("from_character, authorized, attitude").eq("campaign_id", campaignId).eq("to_character", characterId);
  const grantors = (data ?? []).filter((d) => d.attitude !== "hostile" && (d.authorized || d.attitude === "friendly")).map((d) => d.from_character as string);
  if (!grantors.length) return [];
  const { data: chars } = await db.from("characters").select("divisions(slug)").in("id", grantors);
  return [...new Set((chars ?? []).map((c) => ((Array.isArray(c.divisions) ? c.divisions[0] : c.divisions) as { slug: string } | null)?.slug).filter((s): s is string => Boolean(s)))];
}

/* What a character has declared, for their own dispatch. Never anyone else's. */
export async function standingFor(db: Db, campaignId: string, characterId: string): Promise<{ authorized: string[]; friendly: string[]; hostile: string[] }> {
  const { data } = await db.from("declarations").select("to_character, authorized, attitude, characters!declarations_to_character_fkey(name)").eq("campaign_id", campaignId).eq("from_character", characterId);
  const out = { authorized: [] as string[], friendly: [] as string[], hostile: [] as string[] };
  for (const d of data ?? []) {
    const name = ((Array.isArray(d.characters) ? d.characters[0] : d.characters) as { name: string } | null)?.name ?? "?";
    if (d.attitude === "friendly") out.friendly.push(name); else if (d.attitude === "hostile") out.hostile.push(name); else if (d.authorized) out.authorized.push(name);
  }
  return out;
}
