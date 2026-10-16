/* The living world (docs/living-world-draft.md). Where a player's order reaches
   for something the index does not have (a person at a place that has nobody,
   a place that cannot be found), the lock writes a world request, and the grow
   phase runs the writers' room on it before the order resolves:

     brief (code)  →  Character Writer (public canon only)  →  Skeptic ×2 (sees
     the secret side; a flag counts when both reads agree and the quoted phrase is
     in the draft)  →  fresh retry with the flags, at most twice  →  hard limits
     (code)  →  the row.

   Decided 2026-10-16: auto-live, except a draft the Skeptic still flags is held
   for the showrunner; depth only (no secrets of their own); reuse across
   cohorts is automatic; the Qwen team on Cobble writes. A failure here costs
   nothing but depth: the order then resolves as it would have without this. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, chatJson, type LedgerRow } from "@/lib/cobble";
import type { CastSheet } from "./npc";
import { inferVerb } from "./resolve";
import { episodeOf, placesFor, setLivePlaces } from "./world";
import type { PlaceDef } from "./world/types";

type Db = SupabaseClient;
export type WorldRequest = RequestRow;
export type RequestKind = "person_at_place" | "place";
type RequestRow = { id: string; campaign_id: string; round_id: string | null; round: number; order_id: string | null; character_id: string | null; kind: RequestKind; place_slug: string | null; clause: string; verb: string };

const SECRET_TERMS = /\bconvergence\b|68-24|\bthe keepers\b|\bkeepers\b|\bascendants?\b|\b1984\b|retrocausal|sublevel nine|\bkessler\b|omega point|marsh is alive|closed causal|causal loop|time loop|from the future|\bvetch\b|clara wren|\bsentinel\b|\bnightjar\b|\bchoir\b|\borpheus\b|\bharvest\b|\blantern\b|recovery north|\bchamber\b/i;
/* Real people from the bibles: background only, never a generated character or relative. */
const REAL_PEOPLE = /berkowitz|\bcarr\b|arlis perry|maurice strong|teilhard/i;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const slugify = (s: string) => norm(s).replace(/ /g, "-").slice(0, 48);
const surname = (name: string) => norm(name).split(" ").pop() ?? "";

/* ---------- live places into the index ---------- */
export async function loadLivePlaces(db: Db) {
  const { data } = await db.from("world_places").select("def").eq("status", "live");
  setLivePlaces(((data ?? []) as { def: PlaceDef }[]).map((r) => r.def));
}

/* ---------- opening requests at the lock ---------- */
const PLACE_VERBS = new Set(["visit", "search", "surveil", "attend", "interview"]);

function findPlace(text: string, episode: number): PlaceDef | null {
  const t = norm(text); let best: { p: PlaceDef; n: number } | null = null;
  for (const p of placesFor(episode)) for (const a of p.aliases.map(norm)) if (t.includes(a)) { if (!best || a.length > best.n) best = { p, n: a.length }; }
  return best?.p ?? null;
}

/* After funding: every reserved order's steps are read for gaps. A conversation
   at a place with nobody there asks for a person; a place verb whose target the
   index cannot place asks for a place. One request per gap per round. */
export async function openWorldRequests(db: Db, round: { id: string; campaignId: string; number: number }): Promise<number> {
  await loadLivePlaces(db);
  const episode = episodeOf(round.number);
  const { data: packets } = await db.from("order_packets").select("character_id, orders(id, verb, args, status)").eq("round_id", round.id);
  const { data: roster } = await db.from("characters").select("id, name, npc_state").eq("campaign_id", round.campaignId).eq("status", "active");
  const people = (roster ?? []) as { id: string; name: string; npc_state: { place?: string } | null }[];
  const peopleAt = (slug: string) => people.some((p) => p.npc_state?.place === slug);
  const named = (text: string) => { const t = norm(text); return people.some((p) => { const s = surname(p.name); return s.length > 2 && new RegExp(`\\b${s}\\b`).test(t); }); };
  let opened = 0;
  for (const pk of packets ?? []) {
    for (const o of ((pk.orders ?? []) as { id: string; verb: string; args: { text?: string; steps?: { verb: string; clause: string }[] }; status: string }[]).filter((x) => x.status === "reserved")) {
      const steps = o.args.steps?.length ? o.args.steps : [{ verb: o.verb === "freeform" ? inferVerb(o.args.text ?? "").verb : o.verb, clause: o.args.text ?? "" }];
      for (const st of steps) {
        if (!PLACE_VERBS.has(st.verb)) continue;
        const place = findPlace(st.clause, episode) ?? findPlace(o.args.text ?? "", episode);
        let kind: RequestKind | null = null; let placeSlug: string | null = null;
        if (st.verb === "interview") { if (!named(st.clause) && place && !peopleAt(place.slug)) { kind = "person_at_place"; placeSlug = place.slug; } }
        else if (!place && /\b(building|office|room|shed|barn|house|farm|bar|cafe|diner|store|station|yard|lot|hangar|lab|clinic|school|motel|hotel|garage|church|hall)\b/i.test(st.clause)) kind = "place";
        if (!kind) continue;
        const { data: dup } = await db.from("world_requests").select("id").eq("campaign_id", round.campaignId).eq("round", round.number).eq("kind", kind).eq(kind === "place" ? "clause" : "place_slug", kind === "place" ? st.clause : placeSlug!).maybeSingle();
        if (dup) continue;
        await db.from("world_requests").insert({ campaign_id: round.campaignId, round_id: round.id, round: round.number, order_id: o.id, character_id: pk.character_id, kind, place_slug: placeSlug, clause: st.clause, verb: st.verb });
        opened++;
      }
    }
  }
  return opened;
}

/* ---------- the writers' room ---------- */
type PersonDraft = { name: string; title: string; department: string | null; public_profile: string; sheet: CastSheet; reason_at_place: string };
type PlaceDraft = { name: string; aliases: string[]; visit: string; ask: string; restricted: boolean; off_campus: boolean; sightings: { text: string }[] };
type Verdict = { rule: string; quote: string };

const HOUSE = `You are in the writers' room for THE DEPARTMENT, a correspondence game set in October 1977 in north-central North Dakota, 40–60 miles from Minot. Players are new hires at ROYCE INDUSTRIES, a private R&D company on 600 acres of prairie (campus: Station R). Tone: corporate and bureaucratic; the strangeness enters through paperwork that does not agree, never through spectacle. Period: teletypes, carbons, mainframes, telephone logs, mimeographs; no personal computers, no internet, no mobile phones.

You write DEPTH, not plot. The people and places you write are real to the world and have something small to want and to hide, but they know nothing about the company's secrets, hold no documents, sit on no committee, and decide nothing. Never coin a name that echoes a name you are given. Never use a real person. Write plainly: specific nouns, short sentences.`;

async function publicContext(db: Db, campaignId: string) {
  const [{ data: dir }, { data: divs }, { data: chars }, { data: world }] = await Promise.all([
    db.from("canon_docs").select("content").eq("path", "canon/02-personnel-directory.md").maybeSingle(),
    db.from("divisions").select("slug, name").eq("campaign_id", campaignId),
    db.from("characters").select("name"),
    db.from("world_people").select("name"),
  ]);
  const names = [...new Set([...(chars ?? []).map((c) => c.name as string), ...(world ?? []).map((w) => w.name as string)])];
  return { directory: ((dir?.content as string | undefined) ?? "").slice(0, 7000), divisions: (divs ?? []) as { slug: string; name: string }[], names };
}

async function secretContext(db: Db) {
  const [{ data: ledger }, { data: people }] = await Promise.all([
    db.from("canon_docs").select("content").eq("path", "canon/secret/00-truth-ledger.md").maybeSingle(),
    db.from("canon_docs").select("content").eq("path", "canon/secret/03-factions-and-people.md").maybeSingle(),
  ]);
  return `${((ledger?.content as string | undefined) ?? "").slice(0, 9000)}\n\n${((people?.content as string | undefined) ?? "").slice(0, 5000)}`;
}

function writerPrompt(req: RequestRow, place: PlaceDef | null, ctx: Awaited<ReturnType<typeof publicContext>>, flags: Verdict[], forbidden: string[]) {
  const avoid = `NAMES ALREADY IN USE (do not reuse a surname or a first-and-last name from this list): ${ctx.names.join("; ")}.`;
  const nope = forbidden.length ? `\nWORDS AND SUBJECTS YOU MUST NOT USE: ${forbidden.join("; ")}.` : "";
  const fixes = flags.length ? `\nAN EARLIER DRAFT WAS REJECTED FOR THESE REASONS; avoid them entirely:\n${flags.map((f) => `- ${f.rule}: "${f.quote}"`).join("\n")}` : "";
  if (req.kind === "person_at_place") {
    return `${HOUSE}

THE PLACE: ${place?.name ?? req.place_slug}. ${place?.visit ?? ""}${place?.ask ? ` What people there say to a stranger: ${place.ask}` : ""}
THE COMPANY'S DEPARTMENTS (use one of these slugs for department, or null for someone who is not Royce staff): ${ctx.divisions.map((d) => `${d.slug} (${d.name})`).join(", ")}.
THE PUBLIC PERSONNEL DIRECTORY, for the shape of a Royce job and the names to avoid:
${ctx.directory}

${avoid}${nope}${fixes}

A player wrote this order and went there: "${req.clause}". Write the one person who would plausibly be there to be met: an ordinary employee or local with a job that explains their presence. They are not important. They have one small thing they want from a new hire, one thing they will never put in writing (about their own life or job, not the company's secrets), two or three things they know first-hand about the place (mundane and true), and a voice.

Output JSON only:
{"name": "First Last", "title": "job title", "department": "slug or null", "reason_at_place": "one sentence",
 "public_profile": "one or two sentences a new hire could read in a directory, player-safe",
 "sheet": {"voice": {"register": "three words", "rules": ["...", "..."], "phrases": ["...", "..."], "signoff": "..."},
           "wants_from_newcomer": "...", "will_trade": ["..."], "never_says": ["..."], "knows": [{"fact": "...", "how": "..."}], "fears": ["..."], "ladder": {"episode_1": "what they will say in the first two weeks", "episode_2": "later", "episode_3": "later still"}}}`;
  }
  return `${HOUSE}

THE PLACES ALREADY IN THE WORLD (do not duplicate; use their style): ${placesFor(episodeOf(req.round)).slice(0, 24).map((p) => `${p.name}: ${p.visit}`).join(" | ")}

${avoid}${nope}${fixes}

A player wrote this order: "${req.clause}". Write the place it names as a new entry: a plain name, three or four aliases a player might use for it, what a daytime visit shows (two or three sentences, concrete, nothing supernatural), what whoever is there says to a stranger who asks, and one thing a night's watch might show (ordinary, or faintly odd). Say whether it is on the Royce campus or beyond the fence, and whether Security would notice someone there.

Output JSON only:
{"name": "...", "aliases": ["...", "..."], "visit": "...", "ask": "...", "restricted": false, "off_campus": true, "sightings": [{"text": "..."}]}`;
}

/* The Skeptic reads the draft against canon, the secret side, the period and the
   brief's scope. A reason counts only when its quoted phrase is in the draft. */
async function skeptic(draft: string, req: RequestRow, secret: string, names: string[], onLedger?: (r: LedgerRow) => void | Promise<void>): Promise<Verdict[]> {
  const system = `You are the Skeptic, the continuity editor for a 1977 corporate-intrigue correspondence game. The writers' room has drafted a new ${req.kind === "place" ? "place" : "minor character"} to add depth where a player went looking. You alone see the secret canon below. FAIL the draft only for one of these:
1. It contradicts canon: a canon person's role, status or location; an established event; the geography (Station R, Tagus, Minot, the county).
2. It leaks or echoes secret canon: a secret name, project, event or mechanism, or a fact only the secret side knows, even reworded.
3. It breaks the period: technology, slang, prices, institutions or attitudes wrong for rural North Dakota in October 1977; impossible geography or numbers.
4. It overreaches the brief: the character or place decides something, holds a document, sits on a body, knows a company secret, is connected to the central mystery, or reuses a name (or a surname) already in use.
5. It uses a real person.

Do not fail for tone, dullness, small invented details of a job, or a want that is merely ordinary. Depth that touches nothing is the goal. When in doubt, PASS.

Answer with one line, PASS or FAIL. For a FAIL, add up to three lines, each beginning "- ", each giving the rule number and the offending phrase copied exactly from the draft in double quotes. Nothing else.

NAMES IN USE: ${names.join("; ")}

SECRET CANON (never quote it back; use it only to catch leaks and contradictions):
${secret}`;
  try {
    const res = await chat([{ role: "system", content: system }, { role: "user", content: `THE REQUEST: ${req.kind} — "${req.clause}"${req.place_slug ? ` at ${req.place_slug}` : ""}.\n\nTHE DRAFT:\n${draft}` }], { tag: `grow:skeptic`, temperature: 0.2, maxTokens: 300, think: false, timeoutMs: 110_000, onLedger });
    const lines = res.text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length || /^pass\b/i.test(lines[0])) return [];
    const soft = (t: string) => t.toLowerCase().replace(/[‘’“”]/g, "'").replace(/\s+/g, " ");
    const hay = soft(draft);
    const out: Verdict[] = [];
    for (const l of lines.slice(1)) {
      const m = l.match(/^-\s*(\d)?[^"“]*["“](.+?)["”]\s*$/);
      if (!m) continue;
      const q = soft(m[2]).replace(/"/g, "'");
      if (q.length >= 6 && hay.includes(q)) out.push({ rule: m[1] ?? "?", quote: m[2] });
    }
    return out.slice(0, 3);
  } catch { return []; }
}

/* Two reads; a flag is confirmed when both reads cite the same rule. */
async function review(draft: string, req: RequestRow, secret: string, names: string[], onLedger?: (r: LedgerRow) => void | Promise<void>) {
  const [a, b] = await Promise.all([skeptic(draft, req, secret, names, onLedger), skeptic(draft, req, secret, names, onLedger)]);
  const confirmed = a.filter((x) => b.some((y) => y.rule === x.rule));
  return { confirmed, reads: [a, b] };
}

/* Hard limits no model crosses. Returns what is wrong, or nothing. */
function limitsPerson(d: PersonDraft, ctx: Awaited<ReturnType<typeof publicContext>>): string[] {
  const bad: string[] = [];
  if (!d?.name || !/^[A-Za-z'.\- ]{4,40}$/.test(d.name) || d.name.trim().split(/\s+/).length < 2) bad.push("name");
  const sn = surname(d.name ?? "");
  if (sn && ctx.names.some((n) => surname(n) === sn)) bad.push(`surname ${sn} already in use`);
  if (REAL_PEOPLE.test(d.name ?? "")) bad.push("real person");
  const text = JSON.stringify(d);
  const leak = text.match(SECRET_TERMS); if (leak) bad.push(`secret term "${leak[0]}"`);
  if (d.department && !ctx.divisions.some((x) => x.slug === d.department)) bad.push(`department ${d.department}`);
  if (!d.public_profile || !d.sheet?.voice) bad.push("incomplete");
  return bad;
}
function limitsPlace(d: PlaceDraft, requestPlace: PlaceDef | null): string[] {
  const bad: string[] = [];
  if (!d?.name || !d.visit || !Array.isArray(d.aliases) || !d.aliases.length) bad.push("incomplete");
  const leak = JSON.stringify(d).match(SECRET_TERMS); if (leak) bad.push(`secret term "${leak[0]}"`);
  if (d.restricted && !requestPlace?.restricted) d.restricted = false;   // never restricted unless the request's place was
  return bad;
}

/* The room, end to end, for one request. Never throws. */
export async function growRequest(db: Db, req: RequestRow, onLedger?: (r: LedgerRow) => void | Promise<void>, opts: { dry?: boolean } = {}): Promise<{ status: "done" | "held" | "failed"; note: string; draft?: unknown; flags?: Verdict[]; models?: string[] }> {
  const episode = episodeOf(req.round);
  const place = req.place_slug ? placesFor(episode).find((p) => p.slug === req.place_slug) ?? null : null;
  // Reuse: another cohort already met someone here.
  if (req.kind === "person_at_place" && req.place_slug && !opts.dry) {
    const { data: existing } = await db.from("world_people").select("id").eq("place_slug", req.place_slug).eq("status", "live").order("created_at").limit(1).maybeSingle();
    if (existing) { await instantiate(db, existing.id as string, req.campaign_id); return { status: "done", note: "reused" }; }
  }
  const ctx = await publicContext(db, req.campaign_id);
  const secret = await secretContext(db);
  const forbidden = ["convergence", "68-24", "the Keepers", "Ascendants", "1984", "Sublevel Nine", "Kessler", "Omega Point", "Marsh", "Greeley", "SENTINEL", "NIGHTJAR", "HARVEST", "ORPHEUS", "LANTERN", "CHOIR", "the chamber", "the stairway", "the Vigil", "Sayer", "Vetch", "Wren", "cult", "ritual", "mutilation", "helicopter", "alien", "UFO"];
  const models: string[] = []; const drafts: unknown[] = []; const reads: Verdict[][] = [];
  let flags: Verdict[] = [];
  let last: PersonDraft | PlaceDraft | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const prompt = writerPrompt(req, place, ctx, flags, forbidden);
    let draft: PersonDraft | PlaceDraft | null = null;
    try {
      const { data, result } = await chatJson<PersonDraft | PlaceDraft>([{ role: "system", content: prompt }, { role: "user", content: "Write it now. JSON only." }], { tag: `grow:writer:${req.kind}`, temperature: 0.8, maxTokens: 1500, think: false, timeoutMs: 110_000, onLedger });
      models.push(result.model); draft = data;
    } catch (e) { models.push(`error: ${(e as Error).message.slice(0, 80)}`); continue; }
    if (!draft) continue;
    drafts.push(draft);
    const hard = req.kind === "person_at_place" ? limitsPerson(draft as PersonDraft, ctx) : limitsPlace(draft as PlaceDraft, place);
    if (hard.length) { flags = hard.map((h) => ({ rule: "4", quote: h })); continue; }
    const r = await review(JSON.stringify(draft, null, 1), req, secret, ctx.names, onLedger);
    reads.push(...r.reads);
    last = draft;
    if (!r.confirmed.length) { flags = []; break; }
    flags = r.confirmed;
  }
  const provenance = { models, drafts, skeptic: reads, flags };
  if (opts.dry) return { status: last ? (flags.length ? "held" : "done") : "failed", note: "dry run", draft: last, flags, models };
  if (!last) { await db.from("world_requests").update({ status: "failed", result: { note: "no usable draft", flags }, decided_at: new Date().toISOString() }).eq("id", req.id); return { status: "failed", note: "no usable draft" }; }
  const status = flags.length ? "held" : "live";
  const origin = { campaign_id: req.campaign_id, round: req.round, order_id: req.order_id, request_id: req.id };
  if (req.kind === "person_at_place") {
    const d = last as PersonDraft;
    const base = slugify(d.name); let slug = base;
    for (let i = 2; ; i++) { const { data: taken } = await db.from("world_people").select("id").eq("slug", slug).maybeSingle(); if (!taken) break; slug = `${base}-${i}`; }
    const { data: row, error } = await db.from("world_people").insert({ slug, name: d.name.trim(), title: d.title?.trim() || null, department_slug: d.department || null, public_profile: d.public_profile.trim(), sheet: { ...d.sheet, reason_at_place: d.reason_at_place }, place_slug: req.place_slug, status, origin, provenance }).select("id").single();
    if (error) { await db.from("world_requests").update({ status: "failed", result: { note: error.message } }).eq("id", req.id); return { status: "failed", note: error.message }; }
    if (status === "live") await instantiate(db, row.id as string, req.campaign_id);
    await db.from("world_requests").update({ status: status === "live" ? "done" : "held", result: { world_person_id: row.id, flags }, decided_at: new Date().toISOString() }).eq("id", req.id);
    return { status: status === "live" ? "done" : "held", note: d.name };
  }
  const d = last as PlaceDraft;
  const base = slugify(d.name); let slug = base;
  for (let i = 2; ; i++) { const { data: taken } = await db.from("world_places").select("id").eq("slug", slug).maybeSingle(); if (!taken && !placesFor(99).some((p) => p.slug === slug)) break; slug = `${base}-${i}`; }
  const def: PlaceDef = { slug, episode, name: d.name.trim(), aliases: [...new Set([d.name.toLowerCase(), ...d.aliases.map((a) => a.toLowerCase())])], restricted: Boolean(d.restricted), offCampus: Boolean(d.off_campus), visit: d.visit.trim(), ask: d.ask?.trim() || undefined, surveil: (d.sightings ?? []).slice(0, 1).map((s) => ({ rounds: [1, 14] as [number, number], text: s.text, grants: `seen.${slug}` })) };
  const { data: row, error } = await db.from("world_places").insert({ slug, def, status, origin, provenance }).select("id").single();
  if (error) { await db.from("world_requests").update({ status: "failed", result: { note: error.message } }).eq("id", req.id); return { status: "failed", note: error.message }; }
  if (status === "live") await loadLivePlaces(db);
  await db.from("world_requests").update({ status: status === "live" ? "done" : "held", result: { world_place_id: row.id, flags }, decided_at: new Date().toISOString() }).eq("id", req.id);
  return { status: status === "live" ? "done" : "held", note: d.name };
}

/* A world person becomes a character of this campaign: their own memory,
   letters and obligations here, the same voice everywhere. Not listed in the
   directory until someone in the cohort meets them. */
export async function instantiate(db: Db, worldPersonId: string, campaignId: string): Promise<string | null> {
  const { data: w } = await db.from("world_people").select("id, slug, name, title, department_slug, public_profile, sheet, place_slug").eq("id", worldPersonId).maybeSingle();
  if (!w) return null;
  const { data: have } = await db.from("characters").select("id").eq("campaign_id", campaignId).eq("world_person_id", w.id).maybeSingle();
  if (have) return have.id as string;
  const { data: div } = w.department_slug ? await db.from("divisions").select("id").eq("campaign_id", campaignId).eq("slug", w.department_slug).maybeSingle() : { data: null };
  const npc_state = { ...(w.sheet as object), listed: false, place: w.place_slug, world_person_id: w.id, letterhead: w.department_slug ? null : { name: w.name, place: "North Dakota" } };
  const { data: row, error } = await db.from("characters").insert({ campaign_id: campaignId, player_id: null, slug: w.slug, name: w.name, title: w.title, division_id: div?.id ?? null, clearance: 1, public_profile: w.public_profile, npc_state, status: "active", world_person_id: w.id }).select("id").single();
  if (error) { if (error.code === "23505") { const { data: again } = await db.from("characters").select("id").eq("campaign_id", campaignId).eq("slug", w.slug).maybeSingle(); return (again?.id as string) ?? null; } throw new Error(error.message); }
  return row.id as string;
}

/* The grow phase: every open request of the round, in order. Never throws. */
export async function growRound(db: Db, round: { id: string; campaignId: string; number: number }, onLedger?: (r: LedgerRow) => void | Promise<void>): Promise<{ done: number; held: number; failed: number }> {
  await loadLivePlaces(db);
  const { data: reqs } = await db.from("world_requests").select("*").eq("campaign_id", round.campaignId).eq("round", round.number).eq("status", "open").order("created_at");
  const out = { done: 0, held: 0, failed: 0 };
  for (const r of (reqs ?? []) as RequestRow[]) {
    try { out[(await growRequest(db, r, onLedger)).status]++; }
    catch (e) { out.failed++; await db.from("world_requests").update({ status: "failed", result: { note: (e as Error).message.slice(0, 200) } }).eq("id", r.id); }
  }
  await db.from("events").insert({ campaign_id: round.campaignId, round_id: round.id, phase: "grow", kind: "world.grown", payload: out, idempotency_key: `grown:${round.id}` });
  return out;
}
