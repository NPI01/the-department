import { renderLetter, letterLinks, splitSections, type Letter, type LetterKind, type LetterLinks } from "./letter";

/* The game's email templates. Each has default copy here and a set of
   editable fields the showrunner can override from the console (stored in
   mail_templates). Copy uses {{variables}} the sender fills in; `sample`
   holds the values the console previews with.

   In the body, a line starting "## " begins a section with that heading
   (the dispatch uses these). Pure: runs on the server and in the editor. */

export type TemplateFields = {
  label: string;           // the stamp; empty = the kind's default
  subject: string;
  preheader: string;       // inbox preview line; empty = start of the body
  classification: string;
  fromName: string;
  fromTitle: string;
  date: string;
  body: string;
  signatureName: string;
  signatureTitle: string;
};

export type TemplateDef = {
  key: string;
  name: string;
  description: string;
  status: "live" | "planned";
  usedBy: string;
  kind: LetterKind;
  defaults: TemplateFields;
  vars: { name: string; about: string }[];
  sample: Record<string, string>;
  player: boolean;          // recipient is a player (gets the personnel-file link)
};

const blank: Omit<TemplateFields, "subject" | "body" | "fromName"> = { label: "", preheader: "", classification: "", fromTitle: "", date: "", signatureName: "", signatureTitle: "" };
const SAMPLE_PLAYER = { name: "Test Employee", title: "Junior Analyst", department: "Procurement & Logistics", email: "employee@example.com" };

export const TEMPLATES: TemplateDef[] = [
  {
    key: "receipt",
    name: "Application receipt",
    description: "Sent the moment someone files Form RI-1 on the website.",
    status: "live",
    usedBy: "POST /api/enlist",
    kind: "notice",
    player: false,
    defaults: {
      ...blank,
      subject: "Receipt of Form RI-1",
      preheader: "Your application for employment has been received and filed.",
      classification: "Internal",
      fromName: "Personnel & Administration",
      fromTitle: "Royce Industries",
      date: "October 1977",
      body: "Your application for employment has been received and filed.\n\nEmployees are hired in cohorts. You will be notified at this address when a cohort is convened. Until then, the rulebook and the field guide below describe what employment involves.\n\nPlease retain this receipt.",
      signatureName: "Personnel & Administration",
      signatureTitle: "Station R, North Dakota",
    },
    vars: [{ name: "email", about: "the applicant's address" }],
    sample: { email: "applicant@example.com" },
  },
  {
    key: "offer",
    name: "Offer of employment",
    description: "Sent to each player when their cohort convenes. Adapted from the Round 1 offer letter in canon/04.",
    status: "planned",
    usedBy: "cohort convening (not built yet)",
    kind: "notice",
    player: true,
    defaults: {
      ...blank,
      label: "Employment Confirmation",
      subject: "Employment Confirmation",
      classification: "Internal",
      fromName: "Personnel & Administration",
      fromTitle: "Royce Industries",
      date: "October 2, 1977",
      body: "Your acceptance of the Royce Industries offer is recorded. You are appointed {{title}}, {{department}}. Your start date is {{start_date}}. Report to Building 1, Room 104, at 0800 hours.\n\nBring your government-issued identification and two passport photographs. The relocation stipend has been deposited. The confidentiality agreement is attached. Sign page three.\n\nYour first dispatch arrives at 9:00 AM Eastern on {{first_dispatch}}. Your personnel file, the rulebook and the field guide are linked below.",
      signatureName: "Personnel & Administration",
      signatureTitle: "Station R, North Dakota",
    },
    vars: [
      { name: "name", about: "character name" }, { name: "title", about: "job title" }, { name: "department", about: "department name" },
      { name: "start_date", about: "in-game start date" }, { name: "first_dispatch", about: "real date of the first dispatch" },
    ],
    sample: { ...SAMPLE_PLAYER, start_date: "October 10, 1977", first_dispatch: "Monday, November 2" },
  },
  {
    key: "dispatch",
    name: "Morning dispatch",
    description: "Each player's 9:00 AM report: results, letters, committee business, balance and address book. The engine fills each section.",
    status: "planned",
    usedBy: "narrate phase (not built yet)",
    kind: "dispatch",
    player: true,
    defaults: {
      ...blank,
      subject: "Dispatch for {{game_date}}",
      classification: "Personal & Confidential",
      fromName: "Personnel & Administration",
      fromTitle: "Royce Industries",
      body: "Good morning. Overnight results, correspondence and committee business follow. Your balance stands at {{balance}} AU.\n\n## Your orders\n{{orders}}\n\n## Correspondence received\n{{correspondence}}\n\n## Committee business\n{{committees}}\n\n## Address book\n{{address_book}}",
    },
    vars: [
      { name: "name", about: "character name" }, { name: "game_date", about: "in-game date" }, { name: "balance", about: "AU balance" },
      { name: "orders", about: "rulings on last night's orders" }, { name: "correspondence", about: "letters received" },
      { name: "committees", about: "motions opened or closed" }, { name: "address_book", about: "sealed addresses" },
    ],
    sample: {
      ...SAMPLE_PLAYER, game_date: "Tuesday, October 11, 1977", balance: "30",
      orders: "ORDER: REQUEST_FILES Procurement manifests, Sept 1977\n\n[Ruling and result: what happened, and the rule that decided it.]",
      correspondence: "[Letters that reached you overnight, one line each.]",
      committees: "[Motions opened or closed, and how the vote stands.]",
      address_book: "[Your sealed addresses for today.]",
    },
  },
  {
    key: "letter",
    name: "Letter between characters",
    description: "The wrapper for every letter a character sends a player (staff letters and relayed player mail). The body is the letter itself.",
    status: "live",
    usedBy: "job: send (outbound correspondence)",
    kind: "letter",
    player: true,
    defaults: {
      ...blank,
      subject: "{{subject}}",
      fromName: "{{sender_name}}",
      fromTitle: "{{sender_title}}",
      body: "{{body}}",
      signatureName: "{{sender_name}}",
      signatureTitle: "{{sender_title}}",
    },
    vars: [
      { name: "subject", about: "the letter's subject" }, { name: "body", about: "the letter's text" },
      { name: "sender_name", about: "the writing character" }, { name: "sender_title", about: "their title" }, { name: "name", about: "recipient's character" },
    ],
    sample: {
      ...SAMPLE_PLAYER, subject: "N/A", sender_name: "Elmer Bernard", sender_title: "St. Olaf Church, Tagus",
      body: "Dear Friend,\n\nI found your name on the list Royce dropped off at the post office this morning. They said you're new people. New blood. That's good, maybe. The old stories say the ground likes fresh feet.\n\nDon't go out at night. They watch you. Not the men in uniforms. The ground itself. It knows when you're listening.",
    },
  },
  {
    key: "undeliverable",
    name: "Mail room: no such employee",
    description: "Returned when a player writes to an address that does not exist.",
    status: "planned",
    usedBy: "inbound routing (not built yet)",
    kind: "notice",
    player: true,
    defaults: {
      ...blank,
      label: "Mail Room",
      subject: "Returned: {{subject}}",
      classification: "Internal",
      fromName: "Mail Room",
      fromTitle: "Personnel & Administration",
      body: "Your letter addressed to {{address}} could not be delivered. No employee of that name is listed in the Personnel Directory.\n\nThe directory is linked from your personnel file below. If the person you wrote to is not an employee, they must write to you first.",
      signatureName: "Mail Room",
    },
    vars: [{ name: "address", about: "the address that failed" }, { name: "subject", about: "the returned letter's subject" }],
    sample: { ...SAMPLE_PLAYER, address: "nobody@weird.delivery", subject: "Building 7" },
  },
  {
    key: "unsealed",
    name: "Mail room: letter without your seal",
    description: "Sent when a player's letter arrives without their seal: delivered as correspondence, but its command lines are held.",
    status: "planned",
    usedBy: "inbound routing (not built yet)",
    kind: "notice",
    player: true,
    defaults: {
      ...blank,
      label: "Mail Room",
      subject: "Held: {{subject}}",
      classification: "Internal",
      fromName: "Mail Room",
      fromTitle: "Personnel & Administration",
      body: "Your letter to {{recipient}} was delivered, but it did not carry your seal, so the command lines in it have been held:\n\n{{held}}\n\nTo act on them, reply to this notice with CONFIRM {{code}} before the 8:00 PM lock. In future, write to the sealed addresses in your morning dispatch.",
      signatureName: "Mail Room",
    },
    vars: [{ name: "recipient", about: "who the letter went to" }, { name: "held", about: "the held command lines" }, { name: "code", about: "confirmation code" }, { name: "subject", about: "the letter's subject" }],
    sample: { ...SAMPLE_PLAYER, recipient: "Dr. Sarah Ely", held: "VOTE B-77-001: AGAINST", code: "K7F2", subject: "The Board vote" },
  },
  {
    key: "confirm",
    name: "Confirmation requested",
    description: "Sent when the engine reads an intent to act in a letter that used no command line. Nothing happens unless the player confirms.",
    status: "planned",
    usedBy: "extraction (not built yet)",
    kind: "notice",
    player: true,
    defaults: {
      ...blank,
      label: "Confirmation Requested",
      subject: "Did you mean to act?",
      classification: "Internal",
      fromName: "Personnel & Administration",
      fromTitle: "Royce Industries",
      body: "Your letter of today reads as though you meant to commit to the following:\n\n{{intent}}\n\nNothing has been done. To make it so, reply with CONFIRM {{code}} before the 8:00 PM lock. If you did not mean it, ignore this notice.",
      signatureName: "Personnel & Administration",
    },
    vars: [{ name: "intent", about: "the act the engine read" }, { name: "code", about: "confirmation code" }],
    sample: { ...SAMPLE_PLAYER, intent: "VOTE B-77-001: FOR", code: "Q2M9" },
  },
  {
    key: "application_link",
    name: "Your application is open",
    description: "Sent after a successful subscription with the link to the Employment Application.",
    status: "live",
    usedBy: "Stripe webhook (checkout.session.completed)",
    kind: "notice",
    player: true,
    defaults: {
      ...blank,
      label: "Employment Application",
      subject: "Your Employment Application",
      classification: "Internal",
      fromName: "Personnel & Administration",
      fromTitle: "Royce Industries",
      date: "October 1977",
      body: "Thank you for your interest in Royce Industries. Your Employment Application is open at the address below. Complete every section; Personnel reviews applications within 24 hours.\n\n{{apply_url}}\n\nThis address is yours alone. Do not share it.",
      signatureName: "Personnel & Administration",
      signatureTitle: "Station R, North Dakota",
    },
    vars: [{ name: "apply_url", about: "the applicant's private application link" }, { name: "email", about: "their address" }],
    sample: { email: "applicant@example.com", apply_url: "https://weird.delivery/apply/0123456789abcdef0123456789abcdef" },
  },
  {
    key: "employment_file",
    name: "Employment file (approval)",
    description: "Sent two hours after an application is filed: the character summary, action points, department, position, supervisor, and the personnel file link.",
    status: "live",
    usedBy: "job: approve_application",
    kind: "notice",
    player: true,
    defaults: {
      ...blank,
      label: "Employment File",
      subject: "Employment confirmed: {{position}}, {{department}}",
      preheader: "Your application has been approved. Report to {{supervisor_name}}.",
      classification: "Personal & Confidential",
      fromName: "Personnel & Administration",
      fromTitle: "Royce Industries",
      date: "{{game_date}}",
      body: "Your application for employment has been approved. Welcome to Royce Industries.\n\n## Appointment\nYou are appointed {{position}} in {{department}}, clearance level {{clearance}}, reporting to {{supervisor_name}}, {{supervisor_title}}. Your first instructions will come from {{supervisor_name}} later today.\n\n## Your file\n{{summary}}\n\n## Action points\nYou begin with {{au_start}} Action Units (AU) and receive {{au_income}} AU each morning, up to a maximum of {{au_cap}}. AU pay for the orders you give; letters and votes cost nothing.\n\n## Writing to people\nAll company correspondence passes through the mail room at {{game_address}}. To answer a letter, reply to it. To write to anyone in the Personnel Directory, send a new message to {{game_address}} with their name on the first line, like this:\n\nTO: {{supervisor_name}}\n\nYour personnel file and the Personnel Directory are at the link below. Keep that link private.",
      signatureName: "Personnel & Administration",
      signatureTitle: "Station R, North Dakota",
    },
    vars: [
      { name: "name", about: "character name" }, { name: "position", about: "job title" }, { name: "department", about: "department" }, { name: "clearance", about: "clearance level" },
      { name: "supervisor_name", about: "the department head" }, { name: "supervisor_title", about: "their title" }, { name: "summary", about: "identity, specialization, skills, knowledge" },
      { name: "au_start", about: "starting AU" }, { name: "au_income", about: "AU per round" }, { name: "au_cap", about: "AU cap" }, { name: "game_address", about: "the game mailbox" }, { name: "game_date", about: "in-game date" },
    ],
    sample: {
      ...SAMPLE_PLAYER, position: "Junior Procurement Analyst", department: "Procurement & Logistics", clearance: "1", supervisor_name: "Gerald Voss", supervisor_title: "Director, Procurement & Logistics",
      summary: "Identity: Transfer. Specialization: Analyst.\nSkills: Procedure, Accounting, Interviewing.\nKnowledge: Purchasing & Logistics, Federal Procurement & the Services.",
      au_start: "10", au_income: "20", au_cap: "60", game_address: "thedepartment@weird.delivery", game_date: "Monday, October 10, 1977",
    },
  },
  {
    key: "first_memo",
    name: "First memo from the supervisor",
    description: "Sent six hours after approval (never 10 PM–8 AM local): the supervisor's welcome and the player's Personal Goal.",
    status: "live",
    usedBy: "job: first_memo",
    kind: "memo",
    player: true,
    defaults: {
      ...blank,
      subject: "Your first assignment",
      classification: "Confidential",
      fromName: "{{supervisor_name}}",
      fromTitle: "{{supervisor_title}}",
      date: "{{game_date}}",
      body: "{{name}},\n\nPersonnel tells me you start with us today. I run a quiet department and I expect it kept that way.\n\nYour first assignment, which you will not discuss outside this office: {{goal}} Report to me on your progress by {{deadline}}. If you need files, requisitions or introductions, ask; if you need to go somewhere, tell me first.\n\nThe campus map on your desk is the only authorized one for this department. Do not compare it with anyone else's.",
      signatureName: "{{supervisor_name}}",
      signatureTitle: "{{supervisor_title}}",
    },
    vars: [{ name: "name", about: "character name" }, { name: "goal", about: "the Personal Goal" }, { name: "deadline", about: "when to report" }, { name: "supervisor_name", about: "the department head" }, { name: "supervisor_title", about: "their title" }, { name: "game_date", about: "in-game date" }],
    sample: { ...SAMPLE_PLAYER, goal: "Determine who approved the Tagus shipments.", deadline: "the end of the month", supervisor_name: "Gerald Voss", supervisor_title: "Director, Procurement & Logistics", game_date: "Monday, October 10, 1977" },
  },
];

export const templateByKey = (key: string) => TEMPLATES.find((t) => t.key === key);

export function fill(s: string, vars: Record<string, string | number | null | undefined>) {
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])));
}

/* Template fields + values → a Letter for renderLetter. */
export function buildLetter(def: TemplateDef, f: TemplateFields, vars: Record<string, string | number | null | undefined>, links: LetterLinks, extra: Partial<Letter> = {}): Letter {
  const v = (s: string) => fill(s, vars).trim();
  const { body: intro, sections } = splitSections(v(f.body));
  return {
    kind: def.kind,
    label: v(f.label) || null,
    subject: v(f.subject),
    preheader: v(f.preheader) || undefined,
    classification: v(f.classification) || null,
    from: { name: v(f.fromName), title: v(f.fromTitle) || null },
    to: vars.name ? { name: String(vars.name), title: vars.title ? String(vars.title) : null } : vars.email ? { name: String(vars.email) } : null,
    date: v(f.date) || null,
    body: intro,
    sections,
    signature: v(f.signatureName) ? { name: v(f.signatureName), title: v(f.signatureTitle) || null } : null,
    links,
    ...extra,
  };
}

/* Preview render with the template's sample values. */
export function renderSample(def: TemplateDef, f: TemplateFields) {
  const letter = buildLetter(def, f, def.sample, letterLinks(def.player ? "0123456789abcdef0123456789abcdef" : null),
    def.kind === "dispatch" ? { round: { number: 2, episode: 1, episodeRound: 2 } } : {});
  return { subject: letter.subject, ...renderLetter(letter) };
}
