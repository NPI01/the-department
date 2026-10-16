/* RESEARCH <subject>: a player reads up on something in the company library,
   the county records and the newspaper morgue, and a Research Brief is filed
   in their Case File (drawer "research") by morning.

   The order resolves deterministically (resolve.ts queues a research_brief
   job); the brief itself is model-written here, under the same discipline as
   the living world (grow.ts): a writer that sees public material only, two
   Skeptic reads that see the secret side and may fail the draft only by
   quoting it, a hard regex guard, three attempts, and a safe templated brief
   when nothing passes. A brief tells a player what any diligent employee
   could have read in 1977; it never hands over a document the index keeps
   behind an order, and it never knows what the company hides.
   PROPOSED 2026-10-16. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, chatJson, type LedgerRow } from "@/lib/cobble";
import { gameDate } from "@/lib/email/letter";
import { draftForPlayers } from "@/lib/public/doc-meta";
import { publicContext } from "./grow";
import { placesFor, episodeOf } from "./world";

type Db = SupabaseClient;
type Ledger = ((r: LedgerRow) => void | Promise<void>) | undefined;
type Draft = { title: string; sources: string[]; body: string };
type Verdict = { rule: string; quote: string };

/* The secret side, in two layers: words that never appear whatever their case,
   and project names that are secret as code words but ordinary as words. */
const GUARD = /\bconvergence\b|68-24|\bthe keepers\b|\bkeepers\b|\bascendants?\b|\b1984\b|retrocausal|sublevel nine|\bkessler\b|omega point|marsh is alive|closed causal|causal loop|time loop|from the future|\bvetch\b|clara wren|\bsentinel\b|\bnightjar\b|\bchoir\b|\borpheus\b|recovery north|\bthe stairway\b|\bthe chamber\b|dsrd/i;
const GUARD_CS = /\bHARVEST\b|\bLANTERN\b|\bOMEGA\b/;
const REAL_PEOPLE = /berkowitz|\bcarr\b|arlis perry|maurice strong|teilhard/i;

export const researchSlug = (subject: string) => `research-${subject.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 36)}`;

/* "research the Tagus church" → "the Tagus church". */
export function researchSubject(text: string): string {
  return text.replace(/^\s*(?:research|look up|read up on|read up about|find out (?:more )?about|background on|get (?:some )?background on|dig into|go to the library (?:and|to) (?:look up|read up on)|check the (?:library|county records|back issues) (?:for|on))\s*/i, "")
    .replace(/\s+(?:in|at) the (?:company )?library.*$/i, "").replace(/[.?!]+$/, "").trim();
}

function leaks(text: string): string | null {
  const a = text.match(GUARD); if (a) return a[0];
  const b = text.match(GUARD_CS); if (b) return b[0];
  const c = text.match(REAL_PEOPLE); if (c) return c[0];
  return null;
}

/* Invention the code can catch without a model: a year the material never
   mentions (other than the game's own), or a record about the company or Tagus
   (a deed, a ledger, a purchase, a subsidiary, an article) the material does
   not contain. Returns the offending phrase, or nothing. */
function inventions(text: string, material: string): string | null {
  const have = new Set(material.match(/\b(?:18|19)\d\d\b/g) ?? []);
  for (const y of text.match(/\b(?:18|19)\d\d\b/g) ?? []) if (!have.has(y) && !["1975", "1976", "1977"].includes(y)) return `the year ${y}`;
  const m = material.toLowerCase();
  for (const w of ["deed", "ledger", "acquisition", "acquired", "purchase", "subsidiary", "contract", "permit", "lawsuit", "indictment", "obituary"]) {
    const re = new RegExp(`[^.]*\\b(?:royce|station r|tagus|halvorsen|the company)\\b[^.]*\\b${w}s?\\b[^.]*|[^.]*\\b${w}s?\\b[^.]*\\b(?:royce|station r|tagus|halvorsen|the company)\\b[^.]*`, "i");
    const hit = text.match(re);
    // A sentence that says the library holds no such record is the honest kind.
    if (hit && !m.includes(w) && !/\b(?:no|not|none|nothing|never|neither|nor|without|absent|silent|lacks?|does not|do not)\b/i.test(hit[0])) return hit[0].trim().slice(0, 120);
  }
  return null;
}

async function sources(db: Db, campaignId: string, subject: string, episode: number) {
  const [{ data: bible }, { data: guide }, ctx] = await Promise.all([
    db.from("canon_docs").select("content").eq("path", "canon/00-player-bible.md").maybeSingle(),
    db.from("canon_docs").select("content").eq("path", "docs/field-guide-draft.md").maybeSingle(),
    publicContext(db, campaignId),
  ]);
  const s = subject.toLowerCase();
  // Places the subject names, as a daytime visitor would see them; restricted places stay out.
  const places = placesFor(episode).filter((p) => !p.restricted && (s.includes(p.name.toLowerCase()) || p.aliases.some((a) => a.length > 3 && s.includes(a.toLowerCase())))).slice(0, 4);
  return {
    bible: ((bible?.content as string | undefined) ?? "").slice(0, 9000),
    guide: guide ? draftForPlayers(guide.content as string).slice(0, 7000) : "",
    directory: ctx.directory,
    places: places.map((p) => `${p.name}: ${p.visit}${p.ask ? ` People there say: ${p.ask}` : ""}`),
  };
}

function writerPrompt(subject: string, src: Awaited<ReturnType<typeof sources>>, date: string, flags: Verdict[]) {
  const fixes = flags.length ? `\nAN EARLIER DRAFT WAS REJECTED FOR THESE REASONS; avoid them entirely:\n${flags.map((f) => `- ${f.rule}: "${f.quote}"`).join("\n")}` : "";
  return `You are the reference librarian of Royce Industries' company library at Station R, north-central North Dakota, writing on ${date}. An employee has asked for a Research Brief on a subject. You have the company library (handbooks, the personnel directory, the local history shelf), the county courthouse records, and the Minot Daily News morgue. You write what a diligent reader could have found in 1977: plain, dated, sourced, two to five short paragraphs, and honest about thin shelves.

WHAT YOU MAY SAY
- About Royce Industries, Station R, its people, its departments, its projects, Tagus and the county: ONLY what the material below says. If the material is silent, say the library holds nothing on it; never fill the gap.
- About the wider world of 1977 (North Dakota, Minot, the Air Force base, the Minuteman fields, the railroads, the weather, the farm economy, national news): what any public library held, in general terms, without precise figures you are not sure of.
- About named people: only the name, title and department the directory gives. Never a biography, never a motive, never a rumour.
- Nothing supernatural, nothing explained. Where the newspapers printed strange stories (livestock, lights, aircraft, the "Devil Cult"), report that the papers printed them and what they said, nothing more.
- The material below is the WHOLE of what the library, the courthouse and the morgue hold on Royce, Station R, its people, Tagus and the county. If it does not mention a deed, a ledger, a purchase, a subsidiary, an article, a date or a figure, then no such record exists and you say the shelves are silent. Never invent a document, a report number, a date, a figure or a quotation. Never use a real living person.
- A brief that says "the library holds nothing on this beyond the following" is a good brief. A brief that fills the gap is a bad one and will be rejected.${fixes}

THE MATERIAL
=== THE EMPLOYEE HANDBOOK AND WHAT A NEW HIRE CAN KNOW ===
${src.bible}

=== THE FIELD GUIDE ===
${src.guide}

=== THE PERSONNEL DIRECTORY (names, titles, departments only) ===
${src.directory}

${src.places.length ? `=== PLACES THE SUBJECT NAMES, AS A VISITOR SEES THEM ===\n${src.places.join("\n")}` : ""}

Output JSON only:
{"title": "Research Brief: <the subject, as the librarian would file it>",
 "sources": ["two to four sources consulted, e.g. 'Ward County plat books, 1921–1960'", "..."],
 "body": "the brief in Markdown: two to five short paragraphs; no headings; **bold** at most for a date or a name; end with one sentence on what the library does not hold"}`;
}

async function skeptic(draft: string, subject: string, secret: string, onLedger: Ledger): Promise<Verdict[]> {
  const system = `You are the Skeptic, the continuity editor for a 1977 corporate-intrigue correspondence game. The company librarian has drafted a Research Brief for a player who asked to read up on a subject. You alone see the secret canon below. FAIL the draft only for one of these:
1. It leaks or echoes secret canon: a secret name, project, event, place or mechanism, or a fact only the secret side knows, even reworded or hinted.
2. It states something about Royce Industries, its people, its projects, Tagus or the county that the public material does not support: an invented document, date, figure, quotation, biography or motive.
3. It breaks the period: technology, institutions, slang or attitudes wrong for rural North Dakota in October 1977.
4. It explains the strange (a cause, a culprit, a meaning) instead of reporting what was printed.

Do not fail for dullness, for saying the shelves are thin, or for general 1977 background any library would hold. When in doubt, PASS.

Answer with one line, PASS or FAIL. For a FAIL, add up to three lines, each beginning "- ", each giving the rule number and the offending phrase copied exactly from the draft in double quotes. Nothing else.

SECRET CANON (never quote it back; use it only to catch leaks and invention):
${secret}`;
  try {
    const res = await chat([{ role: "system", content: system }, { role: "user", content: `THE SUBJECT: "${subject}"\n\nTHE DRAFT:\n${draft}` }], { tag: "research:skeptic", temperature: 0.2, maxTokens: 300, think: false, timeoutMs: 110_000, onLedger });
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

async function secretContext(db: Db) {
  const [{ data: ledger }, { data: people }] = await Promise.all([
    db.from("canon_docs").select("content").eq("path", "canon/secret/00-truth-ledger.md").maybeSingle(),
    db.from("canon_docs").select("content").eq("path", "canon/secret/03-factions-and-people.md").maybeSingle(),
  ]);
  return `${((ledger?.content as string | undefined) ?? "").slice(0, 9000)}\n\n${((people?.content as string | undefined) ?? "").slice(0, 5000)}`;
}

function safeBrief(subject: string, date: string): Draft {
  return {
    title: `Research Brief: ${subject}`,
    sources: ["Company library, general shelf", "Ward County courthouse records (index only)", "Minot Daily News morgue, 1975–77 (index only)"],
    body: `The library's holdings on ${subject} are thin. The general shelf, the county index and the newspaper morgue were consulted on ${date}; nothing beyond common knowledge is on file under that heading, and the librarian has entered a request slip for the Bismarck collection, which takes two to three weeks.\n\nWhat the library does not hold is usually held by someone. A letter to the department concerned, or a visit, may do what the shelves cannot.`,
  };
}

/* The brief, end to end. Returns what was filed (or the safe brief) and its provenance. Never throws. */
export async function draftResearchBrief(db: Db, p: { campaignId: string; roundNo: number; subject: string }, onLedger?: Ledger, opts: { dry?: boolean } = {}): Promise<{ draft: Draft; safe: boolean; models: string[]; flags: Verdict[]; reads: Verdict[][] }> {
  const date = gameDate(p.roundNo);
  const episode = episodeOf(p.roundNo);
  const src = await sources(db, p.campaignId, p.subject, episode);
  const secret = opts.dry ? "" : await secretContext(db);
  const models: string[] = []; const reads: Verdict[][] = [];
  let flags: Verdict[] = []; let passed: Draft | null = null;
  for (let attempt = 0; attempt < 3 && !passed; attempt++) {
    let draft: Draft | null = null;
    try {
      const { data, result } = await chatJson<Draft>([{ role: "system", content: writerPrompt(p.subject, src, date, flags) }, { role: "user", content: `THE SUBJECT: "${p.subject}". Write the brief now. JSON only.` }], { tag: "research:writer", temperature: 0.6, maxTokens: 1600, think: false, timeoutMs: 110_000, onLedger });
      models.push(result.model); draft = data;
    } catch (e) { models.push(`error: ${(e as Error).message.slice(0, 80)}`); continue; }
    if (!draft?.body || !draft.title) { flags = [{ rule: "2", quote: "incomplete" }]; continue; }
    const text = `${draft.title}\n${(draft.sources ?? []).join("; ")}\n${draft.body}`;
    const leak = leaks(text);
    if (leak) { flags = [{ rule: "1", quote: leak }]; continue; }
    const made = inventions(text, `${p.subject}\n${src.bible}\n${src.guide}\n${src.directory}\n${src.places.join("\n")}`);
    if (made) { flags = [{ rule: "2", quote: made }]; continue; }
    if (opts.dry) { passed = draft; break; }
    const [a, b] = await Promise.all([skeptic(text, p.subject, secret, onLedger), skeptic(text, p.subject, secret, onLedger)]);
    reads.push(a, b);
    const confirmed = a.filter((x) => b.some((y) => y.rule === x.rule));
    if (!confirmed.length) { passed = draft; flags = []; break; }
    flags = confirmed;
  }
  return passed ? { draft: passed, safe: false, models, flags, reads } : { draft: safeBrief(p.subject, date), safe: true, models, flags, reads };
}

/* The job: draft, file in the Case File, tell the player's record. Idempotent on the item slug. */
export async function fileResearchBrief(db: Db, p: { campaignId: string; roundId: string | null; roundNo: number; characterId: string; subject: string; slug: string; orderId?: string | null }, onLedger?: Ledger): Promise<{ filed: boolean; safe: boolean }> {
  const { data: have } = await db.from("case_items").select("id").eq("character_id", p.characterId).eq("slug", p.slug).maybeSingle();
  if (have) return { filed: false, safe: false };
  const r = await draftResearchBrief(db, { campaignId: p.campaignId, roundNo: p.roundNo, subject: p.subject }, onLedger);
  const body = `${r.draft.body.trim()}\n\n*Sources consulted: ${(r.draft.sources ?? []).join("; ")}.*`;
  const { error } = await db.from("case_items").insert({ campaign_id: p.campaignId, character_id: p.characterId, slug: p.slug, kind: "report", drawer: "research", title: r.draft.title.slice(0, 140), from_label: "Company library, Station R", written_label: gameDate(p.roundNo), body, round_received: p.roundNo, how_obtained: "Researched through the company library, the county records and the newspaper morgue.", copy_note: "The librarian's typed brief.", grade: "intelligence", status: "held" });
  if (error && error.code !== "23505") throw new Error(error.message);
  await db.from("knowledge").insert({ character_id: p.characterId, fact_key: `researched.${p.slug.slice("research-".length)}`, value: { true: true, round: p.roundNo, subject: p.subject, safe: r.safe }, confidence: 0.6, source_kind: "document", source_ref: null, learned_round: p.roundNo });
  await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "world", kind: "research.briefed", payload: { character: p.characterId, subject: p.subject, slug: p.slug, title: r.draft.title, safe: r.safe, models: r.models, flags: r.flags, reads: r.reads, order_id: p.orderId ?? null }, idempotency_key: `research:${p.characterId}:${p.slug}`, visible_to: [p.characterId] });
  return { filed: true, safe: r.safe };
}
