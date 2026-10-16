/* What a free-form order costs. A free-form order is priced by what it asks
   for, not at a flat rate: the clerk reads it a clause at a time, and each
   kind of action it asks for (go somewhere, talk to someone, search a place,
   watch it overnight...) is charged at that verb's price, once. Going beyond
   the fence adds the trip (TRAVEL, rulebook §6). An order asks for at most
   MAX_STEPS kinds of action; anything past that is left out and the player is
   told. Priced when the letter arrives, so the receipt can say what it costs;
   the steps priced are the steps carried out (resolve.ts). Deterministic. */
import { VERB_COST, inferVerb } from "./resolve";
import { findEquipment } from "./equipment";
import { placesFor } from "./world";

export const TRAVEL_COST = 5;
export const MAX_STEPS = 4;
/* An order the clerk cannot read any action in is ruled in the morning at this price (refunded if nothing could be done). */
export const UNREAD_COST = 5;

const VERB_NAME: Record<string, string> = {
  request_files: "files", interview: "a conversation", surveil: "a night's watch", visit: "a visit", examine: "a close reading",
  search: "a search", lobby: "lobbying", attend: "attending", leak: "a leak to the paper", research: "research", requisition: "a requisition", submit_manifest: "a manifest", approve_overtime: "overtime",
  reconcile_maps: "reconciling maps", approve_corridors: "corridors", clear_invoices: "invoices", issue_statement: "a statement", report: "a report to Security",
};

/* Clauses that set a scene, a condition or a reason are not actions: "On my lunch break", "if I can find it", "so I can write to them". */
const NOT_AN_ACTION = /^(if|when|whenever|unless|so|so that|because|in case|in order|while|once|on my|during|since|which|who|where|as long as|hopefully|i hope|the name|the main thing)\b/;

const TOWNS = /\b(tagus|minot|split rock|out of town|into town|a ranch|the ranch|bismarck|stanley)\b/;
const MOVE = /\b(travel|drive|go|head|walk|ride|get)\s+(?:out\s+|back\s+|over\s+)?(?:to|into|out to|up to)\b|\bdrive out\b/;

export type Priced = { steps: { verb: string; cost: number; clause: string }[]; travel: number; total: number; left: string[]; read: boolean };

export function splitClauses(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    // "Dr. Ely" is a name, not the end of a clause.
    .replace(/\b(Dr|Mr|Mrs|Ms|Miss|St|Col|Sgt|Lt|Capt|Rev|Prof|Jr|Sr)\.\s/g, "$1 ")
    .split(/(?:[.;!?]+\s+|,\s*(?:and\s+)?(?:then\s+)?|\s+(?:and then|then|and|after that|afterwards|before that)\s+)/i)
    .map((c) => c.trim().replace(/^(i want to|i'd like to|i would like to|i will|i'll|i plan to|i'm going to|i am going to|try to|i want|please)\s+/i, "").trim())
    .filter(Boolean);
}

export function priceFreeform(text: string, episode = 1): Priced {
  const clauses = splitClauses(text);
  const steps: Priced["steps"] = [];
  const left: string[] = [];
  for (const clause of clauses) {
    if (NOT_AN_ACTION.test(clause.toLowerCase())) continue;
    const { verb } = inferVerb(clause);
    if (verb === "unknown" || !VERB_COST[verb] || steps.some((s) => s.verb === verb)) continue;
    if (steps.length >= MAX_STEPS) { left.push(clause); continue; }
    steps.push({ verb, cost: verb === "requisition" ? (findEquipment(clause)?.cost ?? VERB_COST.requisition) : VERB_COST[verb], clause });
  }
  // The trip is charged when the order goes somewhere beyond the fence, not when it merely mentions it:
  // a clause that visits, searches, watches or attends there, or one that travels there.
  const offCampus = placesFor(episode).filter((p) => p.offCampus).flatMap((p) => p.aliases.map((a) => a.toLowerCase()));
  const beyond = (c: string) => offCampus.some((a) => c.includes(a)) || TOWNS.test(c);
  const goesThere = clauses.some((c) => { const l = c.toLowerCase(); return beyond(l) && (MOVE.test(l) || ["visit", "search", "surveil", "attend"].includes(inferVerb(c).verb)); });
  const travel = steps.length && goesThere ? TRAVEL_COST : 0;
  const total = steps.length ? steps.reduce((n, s) => n + s.cost, 0) + travel : UNREAD_COST;
  return { steps, travel, total, left, read: steps.length > 0 };
}

/* "12 AU: a visit 5, a conversation 4, the trip 5" for the receipt. */
export function describePrice(p: Priced): string {
  if (!p.read) return `${p.total} AU, ruled in the morning; returned if nothing could be done`;
  const parts = [...p.steps.map((s) => `${VERB_NAME[s.verb] ?? s.verb.replace(/_/g, " ")} ${s.cost}`), ...(p.travel ? [`the trip ${p.travel}`] : [])];
  return `${p.total} AU (${parts.join(", ")})${p.left.length ? `; one order covers at most ${MAX_STEPS} kinds of action, so "${p.left.join("; ")}" was left out — send it as another order` : ""}`;
}
