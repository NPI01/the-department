/* The world across episodes. A document, place, sighting or tier belongs to an
   episode (default 1) and exists from that episode on. */
import { DOCUMENTS, PLACES, PRESSURE } from "./episode-01";
import { DOCUMENTS_01_MORE } from "./episode-01-more";
import { DOCUMENTS_02, DOCUMENTS_02_MORE, PLACES_02, PRESSURE_02 } from "./episode-02";
import { DOCUMENTS_03, PLACES_03, PRESSURE_03 } from "./episode-03";
import { SCHEDULED_03 } from "./episode-03-mail";
import { DOCUMENTS_04, PLACES_04, PRESSURE_04 } from "./episode-04";
import { SCHEDULED_04 } from "./episode-04-mail";
import { SCHEDULED, type ScheduledItem } from "./episode-01-mail";
import { SCHEDULED_02 } from "./episode-02-mail";
import type { DocumentDef, PlaceDef, PressureTier } from "./types";

const ALL_DOCUMENTS: DocumentDef[] = [...DOCUMENTS, ...DOCUMENTS_01_MORE, ...DOCUMENTS_02, ...DOCUMENTS_02_MORE, ...DOCUMENTS_03, ...DOCUMENTS_04];
const ALL_PLACES: PlaceDef[] = [...PLACES, ...PLACES_02, ...PLACES_03, ...PLACES_04];
const ALL_PRESSURE: PressureTier[] = [...PRESSURE.map((t) => ({ episode: 1, ...t })), ...PRESSURE_02, ...PRESSURE_03, ...PRESSURE_04];

let LIVE_DOCUMENTS: DocumentDef[] = [];
export function setLiveDocuments(docs: DocumentDef[]) { LIVE_DOCUMENTS = docs; }
export const documentsFor = (episode: number) => [...ALL_DOCUMENTS, ...LIVE_DOCUMENTS.filter((l) => !ALL_DOCUMENTS.some((d) => d.slug === l.slug))].filter((d) => (d.episode ?? 1) <= episode);
/* Places the engine wrote overnight (world_places, status live). Loaded by
   setLivePlaces() at the start of each lock phase and each intake, so the
   deterministic rules see them without every caller becoming async. */
let LIVE_PLACES: PlaceDef[] = [];
export function setLivePlaces(places: PlaceDef[]) { LIVE_PLACES = places; }
export const placesFor = (episode: number) => [...ALL_PLACES, ...LIVE_PLACES.filter((l) => !ALL_PLACES.some((p) => p.slug === l.slug))].filter((p) => (p.episode ?? 1) <= episode);
/* The files on the index nearest to a request the clerk could not match: word
   overlap between the request and each file's title and aliases, excluding files
   nobody below clearance 5 could be told exist. For the clerk's suggestion. */
const STOP = new Set(["the", "a", "an", "of", "for", "from", "to", "in", "on", "at", "and", "or", "my", "our", "his", "her", "their", "office", "department", "records", "log", "logs", "file", "files", "record", "october", "1977", "station", "r", "royce", "company", "request", "copy", "all", "any", "last", "this", "that", "with", "by", "re", "about", "please"]);
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
/* The clerk's match: the longest alias, or the file's own title or the head of it
   (before a colon or a parenthesis), that the request contains. Titles count because
   briefs and the clerk's own suggestions quote them. */
const normText = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
export function matchDocument(text: string, episode: number): DocumentDef | null {
  const t = normText(text); let best: { d: DocumentDef; n: number } | null = null;
  for (const d of documentsFor(episode)) {
    const heads = [d.title, d.title.split(" (")[0], d.title.split(":")[0]].map(normText).filter((h) => h.length >= 12);
    for (const a of [...d.aliases.map(normText), ...heads]) if (a && t.includes(a) && (!best || a.length > best.n)) best = { d, n: a.length };
  }
  return best?.d ?? null;
}

export function nearestDocuments(text: string, episode: number, n = 2): DocumentDef[] {
  const q = words(text); if (!q.size) return [];
  const scored = documentsFor(episode).filter((d) => (d.access.clearance ?? 0) < 5).map((d) => {
    const w = words(`${d.title} ${d.aliases.join(" ")}`); let hit = 0; for (const x of q) if (w.has(x)) hit++;
    return { d, score: hit / Math.sqrt(q.size) };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((x) => x.d);
}

export const pressureFor = (episode: number) => ALL_PRESSURE.filter((t) => (t.episode ?? 1) === episode);
export const scheduledFor = (episode: number): ScheduledItem[] => (episode === 1 ? SCHEDULED : episode === 2 ? SCHEDULED_02 : episode === 3 ? SCHEDULED_03 : episode === 4 ? SCHEDULED_04 : []);
export const episodeOf = (roundNumber: number, perEpisode = 14) => Math.floor((roundNumber - 1) / perEpisode) + 1;

export const DEPT_NAMES: Record<string, string> = { "procurement-logistics": "Procurement & Logistics", "personnel-administration": "Personnel & Administration", "corporate-security": "Corporate Security", "information-systems": "Information Systems", "biological-sciences": "Biological Sciences", "applied-physics": "Applied Physics", "advanced-materials": "Advanced Materials", "aerospace-systems": "Aerospace Systems" };
export const deptName = (slug: string | null) => slug ? (DEPT_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())) : "your department";

/* The departments whose laboratories can add something to a held item (ANALYZE), by the index entry it is
   a copy of (a copy sent on or taken counts); none means the page is what it is. */
export function labWorkFor(slug: string, title?: string | null): string[] {
  const base = slug.replace(/-from-.*$|-taken-r\d+$/, "");
  const all = documentsFor(99);
  const d = all.find((x) => x.slug === base) ?? (title ? all.find((x) => x.title.toLowerCase() === title.toLowerCase()) : undefined);
  return (d?.analyses ?? []).map((a) => a.department);
}

/* The paperwork (mitigation order) that can reach this week's matter, if any. */
export function paperworkFor(episode: number, episodeRound: number) {
  const tier = pressureFor(episode).find((t) => episodeRound >= t.rounds[0] && episodeRound <= t.rounds[1]) ?? null;
  return { tier, verbs: tier?.mitigation?.verbs ?? [], departments: tier?.mitigation?.department ?? null };
}
export const PAPERWORK_VERBS = ["submit_manifest", "approve_overtime", "reconcile_maps", "approve_corridors", "clear_invoices", "issue_statement"];
