/* Episode 03 — The Devil Cult (rounds 29–42). Security purges the cult it
   invented; real invitations arrive in the middle of it; a forged ritual
   diagram turns up in a security file; the Safety Committee authorizes or
   blocks internal surveillance. PROPOSED (2026-10-14). Truths: Sloane ran the
   disinformation campaign (03); the Vigil's Keepers contain, the Ascendant cell
   recruits (03); Document C's pamphlet is Sloane's own (08). */
import type { DocumentDef, PlaceDef, PressureTier } from "./types";

export const DOCUMENTS_03: DocumentDef[] = [
  {
    slug: "fisk-symbol-memo", episode: 3, title: "Memorandum: a recurring symbol (L. Fisk)", kind: "memo",
    aliases: ["fisk's memo", "symbol memo", "the symbol", "fisk's symbol", "recurring symbol"],
    holder: "corporate-security", access: {},
    grants: ["sec.symbol_memo_circulated"], wrongDetail: { text: "Fisk's sketch of the symbol is traced, line for line, from the margin of the 1883 survey map reproduced in a county history, not from anything seized; the tracing even keeps the surveyor's smudge", grants: "sec.symbol_traced_from_1883_noticed" },
    from: "Corporate Security", written: "October 1977",
    body: "**ROYCE INDUSTRIES · CORPORATE SECURITY · MEMORANDUM**\n\nTo all departments. A symbol, reproduced below, has been observed on company property on four occasions since September: scratched into a bench in Building 2, chalked on the Gate 2 booth, in the margin of a requisition, and on a pamphlet seized at Tagus. A ring with a short bar across it. Any employee who has seen it is to report the time and place to this office on Form 14-B. Do not discuss it.\n\n*(sketch: a ring, a bar across its lower third)*\n\n— L. Fisk, for the Director",
  },
  {
    slug: "security-report-occult-1977", episode: 3, title: "Corporate Security report: occult activity, Mountrail and Ward Counties (1977)", kind: "report",
    aliases: ["security report", "occult report", "sloane's report", "the report on the cult", "devil cult report", "document c"],
    holder: "sloane", access: { clearance: 4, department: ["corporate-security"], via: "sloane" }, notice: true,
    grants: ["sec.report_names_vigil", "sec.report_claims_four_employees", "sec.report_counts_eleven_mutilations"],
    wrongDetail: { text: "the report dates the seized pamphlet to 22 September 1977 at the Tagus post office; the Tagus post office closed with the last business in 1976, so nothing was seized there", grants: "sec.pamphlet_date_forgery_noticed" },
    from: "Corporate Security", written: "October 1977",
    body: "**ROYCE INDUSTRIES · CORPORATE SECURITY · REPORT (restricted)**\n**Occult activity, Mountrail and Ward Counties, 1975–77**\n\n1. Eleven livestock mutilations since 1975 (county records).\n2. A group calling itself the Vigil, with at least four employees of this company among its adherents (names withheld; Exhibit 1).\n3. A pamphlet seized at the Tagus post office, 22 September 1977, bearing the symbol at Exhibit 2 and language consistent with the New York correspondent's letters.\n4. A ritual diagram recovered from Building 2 (Exhibit 3), consistent with the pamphlet.\n\nRecommendation: internal surveillance of named employees; suspension of clearances pending interview.\n\n— H. Sloane, Director",
  },
  {
    slug: "forged-ritual-diagram", episode: 3, title: "Exhibit 3: ritual diagram (Security file)", kind: "diagram",
    aliases: ["ritual diagram", "exhibit 3", "the diagram in the security file", "forged diagram", "the ritual drawing"],
    holder: "sloane", access: { clearance: 5, via: "sloane", sealed: true }, notice: true,
    grants: ["sec.exhibit3_exists"], wrongDetail: { text: "the diagram is drawn on Royce drafting film with the RI code block in the corner and a 1977 batch number; nobody outside the company could have drawn it on that", grants: "sec.diagram_forged_noticed" },
    from: "Corporate Security", written: "1977",
    body: "A diagram on drafting film: a ring with a bar, nested figures, candles at the points, a Latin phrase misspelled twice. In the corner, faint, the RI code block and a batch number: RI-DF-77-04.",
  },
  {
    slug: "st-olaf-register", episode: 3, title: "Burial register, St. Olaf Lutheran, Tagus (1920–1925)", kind: "document",
    aliases: ["burial register", "church register", "st. olaf register", "the register", "parish register"],
    holder: "tagus-church", access: { clearance: 1 },
    grants: ["tagus.1921_burials_same_week", "tagus.1921_burials_unnamed"], wrongDetail: { text: "eight burials in the week of 14 October 1921 are entered with no names and one hand, and the hand is the same as the 1961 entry recording the bell's removal", grants: "tagus.register_same_hand_1921_1961_noticed" },
    from: "St. Olaf Lutheran", written: "1921",
    body: "**ST. OLAF LUTHERAN — BURIALS — 1921**\n\n| Date | Name | Age | Note |\n|---|---|---|---|\n| 14 Oct | — | — | of the survey party |\n| 14 Oct | — | — | of the survey party |\n| 15 Oct | — | — | |\n| 15 Oct | — | — | |\n| 16 Oct | — | — | |\n| 16 Oct | — | — | |\n| 17 Oct | — | — | |\n| 17 Oct | — | — | *the last light* |\n\n*(1961, same hand:)* Bell removed to Minot by order of the council.",
  },
  {
    slug: "congregation-pamphlet", episode: 3, title: "Pamphlet: 'The Seven Descents' (Congregation of the Last Light)", kind: "document",
    aliases: ["the pamphlet", "seven descents", "congregation pamphlet", "the seven descents pamphlet"],
    holder: "sayer", access: { clearance: 5, via: "sayer", society: "congregation" },
    grants: ["congregation.pamphlet_read", "congregation.seven_descents_named"], wrongDetail: { text: "the seventh descent is described in the future tense and dated; the date is next April", grants: "congregation.pamphlet_dates_april_noticed" },
    from: "the Congregation of the Last Light", written: "1977",
    body: "**THE SEVEN DESCENTS**\n\nThe first is the cellar. The second is the count that will not hold. The third is the light that is not a light. The fourth is the voice that answers. The fifth is the room that was already there. The sixth is the one who went down and came back wrong. The seventh is the opening, and it will be in April, and we will be there.",
  },
  {
    slug: "keepers-account-book", episode: 3, title: "The Keepers' account book (a page copied for a new member)", kind: "document",
    aliases: ["account book", "keepers' book", "the council's book", "contradictory accounts", "the keepers' accounts"],
    holder: "keepers-farm", access: { clearance: 5, society: "vigil" },
    grants: ["vigil.practice_contradictory_accounts", "vigil.contain_not_worship"], wrongDetail: { text: "three accounts of the same night, in three hands, disagree on the number of steps and agree on nothing else, and the page is headed 'as it should be'", grants: "vigil.accounts_meant_to_disagree_noticed" },
    from: "the Council", written: "1921–77",
    body: "**AS IT SHOULD BE**\n\n*14 October.* Twenty-one down, nineteen up. The light was blue. — C.W.\n*14 October.* Twenty down, twenty up. There was no light. — H.B.\n*14 October.* I did not count. I did not go down. The light was in the church. — E.\n\nWrite yours. Do not read theirs first.",
  },
  {
    slug: "purge-list", episode: 3, title: "Corporate Security: employees named for interview (October 1977)", kind: "document",
    aliases: ["purge list", "the list", "interview list", "named employees", "suspect list", "sloane's list"],
    holder: "sloane", access: { clearance: 5, via: "sloane" }, notice: true,
    grants: ["sec.purge_list_exists"], wrongDetail: { text: "two of the names were added in a different ink after the list was initialled, and both are people who asked Security for files in the first week", grants: "sec.purge_list_padded_noticed" },
    from: "Corporate Security", written: "October 1977",
    body: "**EMPLOYEES NAMED FOR INTERVIEW** — *(names as the engine holds them)*",
  },
];

export const PLACES_03: PlaceDef[] = [
  { slug: "keepers-farm", town: "tagus", offCampus: true, episode: 3, name: "the farm west of Tagus", aliases: ["keepers' farm", "the farm", "farm west of tagus", "the council's farm", "halvorsen farm"], restricted: true, visit: "A farmhouse, a workshop, a long low barn with its windows boarded from the inside. Nobody comes to the door unless you were told to come.", ask: "A woman at the pump says the farm is private and that if you were expected you would not be asking.", surveil: [{ episode: 3, rounds: [1, 14], text: "five cars at the farm at 2100; the barn lit until 0100; when they left, each driver stopped at the gate and wrote something in a book before going on", grants: "vigil.farm_meeting_seen", restricted: true }], contains: ["keepers-account-book"], searchAccess: { clearance: 5, society: "vigil" } },
  { slug: "tagus-elevator", town: "tagus", offCampus: true, episode: 3, name: "the old grain elevator, Tagus", aliases: ["grain elevator", "the elevator", "tagus elevator", "the old elevator"], restricted: true, visit: "A wooden elevator by the dead rail spur, padlocked, the lock new. Inside, through a gap, chairs in a ring and a lamp.", surveil: [{ episode: 3, rounds: [1, 14], text: "a light inside the elevator at 0200 for eleven minutes; three people left separately, one of them young and in a Royce parka", grants: "congregation.elevator_meeting_seen", restricted: true }], contains: [], searchAccess: { clearance: 5, society: "congregation" } },
  { slug: "security-office", episode: 3, name: "the Corporate Security office, Building 1", aliases: ["security office", "sloane's office", "fisk's office", "corporate security"], restricted: true, visit: "A counter, a clerk, two interview rooms with the blinds down. A list on the wall behind the clerk, face inward.", ask: "The clerk says interviews are by summons only and that the list is not his to show.", surveil: [{ episode: 3, rounds: [1, 14], text: "the lights in interview room 2 stayed on until 0230; a man left it alone and sat in his car in the lot for forty minutes before driving off", grants: "sec.late_interview_seen", restricted: true }], contains: ["purge-list"], searchAccess: { clearance: 5 } },
];

export const PRESSURE_03: PressureTier[] = [
  { episode: 3, tier: 1, rounds: [1, 2], text: "Security's memorandum about a symbol circulates; people stop talking in the breakroom", mitigation: null },
  { episode: 3, tier: 2, rounds: [3, 4], text: "Security begins interviews by summons; the first clearances are restricted", mitigation: null },
  { episode: 3, tier: 3, rounds: [5, 7], text: "letters arrive at home addresses; nobody will say from whom", mitigation: null },
  { episode: 3, tier: 4, rounds: [8, 11], text: "the Safety Committee ballot on internal surveillance is scheduled", mitigation: null },
  { episode: 3, tier: 5, rounds: [12, 14], text: "two employees do not come to work; their desks are cleared by Thursday", mitigation: { verbs: ["issue_statement"], department: ["personnel-administration"] } },
];
