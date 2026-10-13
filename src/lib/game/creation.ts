/* Character creation: the Identity Matrix, skills, knowledge, positions,
   supervisors and the Episode 1 goal pool. The player-facing text of all of
   this is docs/character-creation-draft.md (PROPOSED, in Review); keep the
   two in step. Pure: used by the application form and the approval job. */

export const IDENTITIES = [
  { key: "credentialed", name: "Credentialed", points: 8, clearance: 2, startAu: 10,
    blurb: "You arrive with a degree, a reference and a file that checks out. Royce clears you a level higher than the rest of your cohort, and expects you to behave like it.",
    engine: "clearance 2 at start" },
  { key: "transfer", name: "Transfer", points: 10, clearance: 1, startAu: 10,
    blurb: "You came from another company, or another Royce site. Somebody here already knows you, and remembers you well.",
    engine: "your supervisor starts warmly disposed toward you" },
  { key: "walk-in", name: "Walk-in", points: 13, clearance: 1, startAu: 5,
    blurb: "You answered an advertisement. Nobody vouched for you and nobody is watching you. You have more to learn and less to start with.",
    engine: "start with 5 AU instead of 10" },
  { key: "referred", name: "Referred", points: 10, clearance: 1, startAu: 10,
    blurb: "Someone at Royce put your name forward. They have not said why, and they have not said what they want for it. They will.",
    engine: "you begin owing a favour to the director who referred you" },
] as const;
export type IdentityKey = (typeof IDENTITIES)[number]["key"];

export const SPECIALIZATIONS = [
  { key: "analyst", name: "Analyst", blurb: "Reading documents; noticing what does not fit." },
  { key: "negotiator", name: "Negotiator", blurb: "People, bargains, coalitions." },
  { key: "operative", name: "Operative", blurb: "Fieldwork, discretion, getting in and out." },
  { key: "administrator", name: "Administrator", blurb: "Procedure, paperwork, committees." },
] as const;
export type SpecializationKey = (typeof SPECIALIZATIONS)[number]["key"];

export type Purchasable = { key: string; name: string; cost: 1 | 2 | 3; blurb: string; requires?: string };

export const SKILLS: Purchasable[] = [
  { key: "procedure", name: "Procedure", cost: 1, blurb: "Forms, filing, protocol. Knowing which office a request goes to and what it must say." },
  { key: "shorthand", name: "Shorthand", cost: 1, blurb: "Fast, accurate notes. What you heard is what you wrote." },
  { key: "driving", name: "Driving", cost: 1, blurb: "Prairie roads, night, snow, no lights." },
  { key: "interviewing", name: "Interviewing", cost: 2, blurb: "Getting people to say more than they meant to." },
  { key: "persuasion", name: "Persuasion", cost: 2, blurb: "Making a case, trading favours, holding a room." },
  { key: "surveillance", name: "Surveillance", cost: 2, blurb: "Watching without being seen; knowing when you are watched." },
  { key: "fieldcraft", name: "Fieldcraft", cost: 2, blurb: "Moving unnoticed, outdoors and indoors, in and out." },
  { key: "accounting", name: "Accounting", cost: 2, blurb: "Reading a ledger for what it hides." },
  { key: "instrumentation", name: "Instrumentation", cost: 2, blurb: "Reading, rigging and quietly altering equipment." },
  { key: "forgery", name: "Forgery", cost: 3, blurb: "A memo, a signature, a requisition that was never issued.", requires: "procedure" },
  { key: "lockwork", name: "Lockwork", cost: 3, blurb: "Doors, cabinets, lockers.", requires: "fieldcraft" },
  { key: "ciphers", name: "Codes & Ciphers", cost: 3, blurb: "Making and breaking them.", requires: "instrumentation" },
];

export const KNOWLEDGE: Purchasable[] = [
  { key: "purchasing", name: "Purchasing & Logistics", cost: 1, blurb: "Invoices, manifests, vendors, freight." },
  { key: "personnel", name: "Personnel & Company Policy", cost: 1, blurb: "Who reports to whom, and what the handbook says." },
  { key: "local-history", name: "Local History & the Prairie", cost: 1, blurb: "Counties, railroads, ranches, old names." },
  { key: "press", name: "Press & Publicity", cost: 1, blurb: "Newspapers, reporters, what makes a story." },
  { key: "metallurgy", name: "Metallurgy & Materials", cost: 2, blurb: "Alloys, samples, what a lab can and cannot do." },
  { key: "aviation", name: "Aviation", cost: 2, blurb: "Aircraft, flight records, corridors, the base." },
  { key: "biology", name: "Veterinary & Biological Science", cost: 2, blurb: "Tissue, livestock, sampling, disease." },
  { key: "physics", name: "Physics & Energy Systems", cost: 2, blurb: "Power, instruments, experiments, what the readings mean." },
  { key: "computing", name: "Computing & Statistics", cost: 2, blurb: "Mainframes, logs, patterns in numbers." },
  { key: "security", name: "Industrial Security", cost: 2, blurb: "Badges, perimeters, investigations, how Security thinks." },
  { key: "federal", name: "Federal Procurement & the Services", cost: 2, blurb: "Contracts, sponsors, the Air Force, who signs what." },
  { key: "occult", name: "The Occult, as 1977 understands it", cost: 2, blurb: "Societies, symbols, rituals, the newspapers' Devil Cult." },
];

export const DEJA_VU = [
  { key: "never", label: "Never" },
  { key: "occasionally", label: "Occasionally" },
  { key: "daily", label: "About once a day" },
  { key: "often", label: "More than once a day" },
] as const;

/* Per department: the junior position new hires get (alternating where canon
   gives two), the supervisor (department head, by character slug), and the
   Episode 1 goals from canon/secret/07 the supervisor can assign. Goals are
   handed out so that no two players in a season share one. Applied Physics
   has no goal in canon 07 (TBD); it draws from the common pool. */
export const DEPARTMENTS: Record<string, { positions: string[]; supervisor: string; goals: string[] }> = {
  "advanced-materials": { positions: ["Junior Research Scientist"], supervisor: "ethorne", goals: ["ep1-3"] },
  "aerospace-systems": { positions: ["Junior Aerospace Engineer"], supervisor: "baines", goals: ["ep1-5"] },
  "biological-sciences": { positions: ["Junior Biological Researcher"], supervisor: "ely", goals: ["ep1-6"] },
  "applied-physics": { positions: ["Junior Instrumentation Technician"], supervisor: "kovic", goals: [] },
  "information-systems": { positions: ["Junior Systems Programmer"], supervisor: "jthorne", goals: ["ep1-8"] },
  "procurement-logistics": { positions: ["Junior Procurement Analyst", "Junior Financial Analyst"], supervisor: "voss", goals: ["ep1-1", "ep1-7"] },
  "corporate-security": { positions: ["Junior Security Investigator"], supervisor: "sloane", goals: ["ep1-2"] },
  "personnel-administration": { positions: ["Junior Personnel Administrator", "Executive Assistant"], supervisor: "armitage", goals: ["ep1-4", "ep1-9"] },
};

/* The player-facing goal text, from the Objective column of canon/secret/07.
   The predicate the engine scores stays in that document. Objectives 10–12
   (Cult Recruit, Federal Informant, Independent Investigator) are not a
   supervisor's to give and are not in this pool. Points are the published
   value, the base figure from 07; partial credit and bonuses stay secret. */
export const GOALS: Record<string, { text: string; deadline: string; points: number }> = {
  "ep1-1": { text: "Determine who approved the Tagus shipments.", deadline: "the end of the month", points: 15 },
  "ep1-2": { text: "Identify who has been passing company material to outsiders.", deadline: "the end of the month", points: 20 },
  "ep1-3": { text: "Obtain access to an ORPHEUS sample.", deadline: "the end of the month", points: 15 },
  "ep1-4": { text: "Explain three altered personnel records.", deadline: "the end of the month", points: 20 },
  "ep1-5": { text: "Recover the missing NIGHTJAR test log before the flight review.", deadline: "October 19", points: 15 },
  "ep1-6": { text: "Establish whether the HARVEST samples were obtained under legitimate authority.", deadline: "the end of the month", points: 20 },
  "ep1-7": { text: "Trace a classified appropriation through the company accounts.", deadline: "the end of the month", points: 15 },
  "ep1-8": { text: "Explain the future-dated entries in the computer records.", deadline: "the end of the month", points: 20 },
  "ep1-9": { text: "Secure enough Board support to carry the departmental reporting motion the way this office requires.", deadline: "October 16", points: 25 },
  // Episode 02 — The Harvest (PROPOSED 2026-10-13): handed out by the showrunner from the console.
  "ep2-1": { text: "Establish, case by case, which of the county's dead cattle were HARVEST sampling and which were not.", deadline: "November 6", points: 20 },
  "ep2-2": { text: "Get Paul Greeley's notebook, or what is left of it, in front of the Research Committee.", deadline: "November 6", points: 20 },
  "ep2-3": { text: "Get the thing in the sheriff's evidence locker into a Royce laboratory, by any means the company will survive.", deadline: "November 6", points: 25 },
  "ep2-4": { text: "Carry the Research Committee's ballot on cooperating with the county the way your department needs it to go.", deadline: "November 2", points: 20 },
};

export const ALL_GOAL_KEYS = Object.keys(GOALS);

export function identity(key: string) { return IDENTITIES.find((i) => i.key === key); }
export const byKey = (list: Purchasable[]) => Object.fromEntries(list.map((p) => [p.key, p]));

/* Validate a purchase set against the budget and prerequisites. */
export function priceOut(identityKey: string, skills: string[], knowledge: string[]): { ok: boolean; spent: number; budget: number; problems: string[] } {
  const id = identity(identityKey);
  const problems: string[] = [];
  if (!id) return { ok: false, spent: 0, budget: 0, problems: ["Choose an identity."] };
  const S = byKey(SKILLS), K = byKey(KNOWLEDGE);
  let spent = 0;
  for (const k of new Set(skills)) { const p = S[k]; if (!p) problems.push(`Unknown skill ${k}.`); else { spent += p.cost; if (p.requires && !skills.includes(p.requires)) problems.push(`${p.name} requires ${S[p.requires].name}.`); } }
  for (const k of new Set(knowledge)) { const p = K[k]; if (!p) problems.push(`Unknown knowledge ${k}.`); else spent += p.cost; }
  if (spent > id.points) problems.push(`That is ${spent} points; ${id.name} has ${id.points}.`);
  if (!skills.length && !knowledge.length) problems.push("Choose at least one skill or area of knowledge.");
  return { ok: !problems.length, spent, budget: id.points, problems };
}
