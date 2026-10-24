/* Episode 05 — The Unfinished Descent (rounds 57–70; 11 to 24 December 1977).
   Someone goes down the stairway, with or without permission, and the
   instruments disagree about what they found. The descent itself is a verb
   (stairway.ts); this file is what the week leaves lying about: Kovic's
   protocol, Vale's brief, the Keepers' page, the Congregation's card, a pilot's
   unfiled note, a guard roster with a gap, and the card a descender finds on
   the twelfth step. PROPOSED (2026-10-23). Truths: the stairway rules (02); the
   fifth descent is a planted lie (00); Marsh has descended once and is alive. */
import type { DocumentDef, PlaceDef, PressureTier } from "./types";

export const DOCUMENTS_05: DocumentDef[] = [
  {
    slug: "kovic-descent-protocol", episode: 5, title: "Protocol for instrumented descent, Tagus structure (Applied Physics)", kind: "memo",
    aliases: ["descent protocol", "kovic's protocol", "instrumented descent", "the protocol for the stairs", "protocol for descent", "descent procedure"],
    holder: "applied-physics", access: { clearance: 1 },
    grants: ["tagus.protocol_read", "tagus.form_23_required"],
    wrongDetail: { text: "the expected step count above the landing is typed as 21, and below it a pencilled 20 is crossed out and 19 written in by a hand that is not Kovic's; somebody has been down and did not agree with the typist", grants: "tagus.protocol_counts_disagree_noticed" },
    from: "Applied Physics", written: "December 1977",
    body: "**APPLIED PHYSICS — PROTOCOL — INSTRUMENTED DESCENT, TAGUS STRUCTURE**\n\n1. One observer at a time. 2. Carry the hand magnetometer (bench 4 cabinet); read it at the top of the church steps, at the landing, and at the lowest point reached, twice, one minute apart, instrument not moved. 3. Count the steps down and the steps up and write both. 4. Note your watch at the lowest point and the church clock when you come up. 5. File Form 23 within twenty-four hours and before reading any other report. Expected count above landing: 21. Below: ~~20~~ 19.\n\n— A. Kovic",
  },
  {
    slug: "vale-brief-r77005", episode: 5, title: "Brief for R-77-005: experiments on the Tagus passage (Dr. Vale)", kind: "memo",
    aliases: ["vale's brief", "brief for r-77-005", "r-77-005", "experiments on the passage", "the brief on the passage", "vale's motion", "the experiments motion"],
    holder: "vale", access: { clearance: 3, via: "vale" }, notice: true,
    grants: ["tagus.experiments_proposed", "tagus.experiments_phases_three"],
    wrongDetail: { text: "the brief's budget line is drawn on appropriation 77-S, the federal money, with no line of the company's own; the passage is to be studied on the sponsor's account", grants: "tagus.experiments_funded_by_77s_noticed" },
    from: "Office of the Chief Scientist", written: "11 December 1977",
    body: "**BRIEF FOR THE RESEARCH COMMITTEE — R-77-005 — Experiments on the Tagus passage**\n\nThe structure below the utility cellar at Tagus is not a cellar. Three instruments disagree about its depth and a surveyor's watch disagreed with the church clock. The Committee is asked to authorize three phases: (1) instrumented descents by Applied Physics observers under protocol; (2) continuous monitoring from the existing installation; (3) a synchronized observation with the Building 7 apparatus, date to be set. Budget: appropriation 77-S, phase II. The organism resists the cut; let us look at what is growing.\n\n— A. Vale",
  },
  {
    slug: "keepers-practice-page", episode: 5, title: "A page for a new member: the practice (the farm west of Tagus)", kind: "document",
    aliases: ["the practice", "practice page", "rud's page", "the keepers' practice", "write yours", "a page from the farm", "the council's instructions"],
    holder: "rud", access: { clearance: 5, via: "rud", society: "vigil" },
    grants: ["vigil.practice_contradictory_accounts", "vigil.practice_page_read"],
    wrongDetail: { text: "the page's three sample accounts are headed 14 October 1921, and the third is in the same hand as the 1961 bell entry in the church register; whoever wrote it was at the stairs in 1921 and at the bell in 1961", grants: "vigil.practice_hand_1961_noticed" },
    from: "the Council", written: "1932; copied 1977",
    body: "**WHAT WE DO AT THE GATE**\n\nWhen you have been down, write what you counted and what you saw before you speak to anyone who was there. Write it on the company's own form if the company has one; they will file it and we will have it. Do not read another's account until yours is filed. Three accounts of one night that do not agree are a lid. One account that everybody signs is a door.\n\n*14 October.* Twenty-one down, nineteen up. Blue. — C.W.\n*14 October.* Twenty down, twenty up. No light. — H.B.\n*14 October.* I did not count. — E.",
  },
  {
    slug: "congregation-descent-card", episode: 5, title: "A card naming the night (the Congregation of the Last Light)", kind: "letter",
    aliases: ["the night card", "congregation card", "the card naming the night", "seven names", "the descent card", "sayer's card"],
    holder: "sayer", access: { clearance: 5, via: "sayer", society: "congregation" },
    grants: ["congregation.group_descent_called", "congregation.seven_named"],
    wrongDetail: { text: "the card names seven who will go down together and the seventh line is blank; the pamphlet says the seventh descent is the opening, and they have left a place for whoever it is", grants: "congregation.seventh_blank_noticed" },
    from: "the Congregation of the Last Light", written: "December 1977",
    body: "A plain card, the ring and bar drawn with a compass. *The plate in the windbreak. The fourth night, 0200. All together, the same thing in mind.* Seven lines for names. Six are filled. The seventh is blank.",
  },
  {
    slug: "bradley-orange-light-note", episode: 5, title: "Unfiled note: orange light over the Tagus cellar (Capt. T. Bradley)", kind: "memo",
    aliases: ["bradley's note", "orange light", "the orange light", "unfiled note", "bradley's unfiled note", "light over the cellar"],
    holder: "bradley", access: { clearance: 4, via: "bradley" },
    grants: ["tagus.orange_light_reported", "tagus.light_seen_from_air"],
    wrongDetail: { text: "the note times the light at 0211, eleven minutes after the hut's recorder stopped on the installation log, and Bradley wrote 'eleven minutes' in the margin without knowing about the log", grants: "tagus.light_matches_eleven_minutes_noticed" },
    from: "Prairie Meridian Aviation", written: "16 December 1977",
    body: "**NOT FILED — T.B.**\n\nSector 4, 0211, 1,200 ft. Orange light on the ground at the Tagus church, steady, no flicker, about the size of the cellar roof. Co-pilot saw it. Compasses steady this time. Held for eleven minutes by my watch and went out like a switch. Not reporting this to Baines. Not reporting it to anyone.",
  },
  {
    slug: "sloane-guard-roster-tagus", episode: 5, title: "Guard roster, Tagus utility structure, December 1977 (Corporate Security)", kind: "document",
    aliases: ["guard roster", "tagus guard", "the guard at the cellar", "guard schedule", "security roster tagus", "who guards the cellar"],
    holder: "corporate-security", access: { clearance: 2, department: ["corporate-security"], via: "fisk" }, notice: true,
    grants: ["tagus.guard_posted", "tagus.guard_shifts_known"],
    wrongDetail: { text: "the night shift ends at 0200 and the next begins at 0300; nobody is rostered for the hour between, on any night, and the roster is initialled by Sloane", grants: "tagus.guard_gap_0200_noticed" },
    from: "Corporate Security", written: "December 1977",
    body: "**GUARD — TAGUS UTILITY STRUCTURE — DECEMBER 1977**\n\n| Shift | Hours | Post |\n|---|---|---|\n| day | 0800–1800 | cellar door |\n| evening | 1800–0200 | cellar door |\n| night | 0300–0800 | cellar door |\n\nNo admittance without Research Committee authority. — H.S.",
  },
  {
    slug: "marsh-card-twelfth-step", episode: 5, title: "A card found on the twelfth step, Tagus stairs", kind: "document",
    aliases: ["the card on the stairs", "card from the twelfth step", "the index card", "find the original date", "the card from the stairs"],
    holder: "tagus-cellar", access: { clearance: 5 },
    grants: ["marsh.card_on_stairs"],
    wrongDetail: { text: "the hand is the hand of the instruction on the page in Dr. Marsh's old office, down to the way the capital F is made", grants: "marsh.card_hand_matches_vetch_instruction_noticed" },
    from: "unknown", written: "undated",
    body: "A plain index card, soft at the corners. One line in a careful hand: *Find the original date.* Under it, smaller: *Not the copy. The one they moved.*",
  },
];

export const PLACES_05: PlaceDef[] = [
  { slug: "tagus-shaft", town: "tagus", offCampus: true, episode: 5, name: "the windbreak plate (the shaft)", aliases: ["windbreak plate", "the plate", "the shaft", "ventilation shaft", "the halvorsen windbreak", "windbreak", "under the plate", "the shaft in the windbreak"], restricted: true,
    visit: "A steel plate the size of a manhole set in a concrete collar in the Halvorsen windbreak, a ring in it, the grass worn to it from the road. Lift it and there is a ladder, a ventilation shaft, and the smell of wet stone coming up warm. It goes down to the room under the hut, and from the room a door nobody has mentioned opens on a stair.",
    ask: "Nobody is there to ask. The plate is nobody's, which is how it has stayed where it is.",
    surveil: [
      { episode: 5, rounds: [3, 5], text: "at 0200 a line of six lamps crossed the windbreak from the road, stopped at the plate, and went down one by one; the lamps came up at 0340, five of them, and nobody spoke on the way back to the cars", grants: "congregation.group_descent_seen", restricted: true },
      { episode: 5, rounds: [6, 14], text: "a man alone at the plate at 0100 with no lamp, who lifted it, listened, and put it back without going down; an old man, by the way he knelt", grants: "tagus.sandvik_at_plate_seen", restricted: true },
    ],
    contains: [], searchAccess: { clearance: 5 } },
];

export const PRESSURE_05: PressureTier[] = [
  { episode: 5, tier: 1, rounds: [1, 3], text: "the hand magnetometer is signed out of the bench 4 cabinet to nobody; Security posts a guard on the Tagus cellar door and Applied Physics posts a protocol", mitigation: null },
  { episode: 5, tier: 2, rounds: [4, 6], text: "lamps in the Halvorsen windbreak at two in the morning; the sheriff takes a trespass complaint from the Halvorsen estate's lawyer", mitigation: { verbs: ["issue_statement"], department: ["corporate-security"] } },
  { episode: 5, tier: 3, rounds: [7, 9], text: "the Research Committee ballot on the passage is scheduled; Dr. Vale asks Personnel for the names of everyone who has been to Tagus this month", mitigation: null },
  { episode: 5, tier: 4, rounds: [10, 12], text: "two employees report lost hours on Form 14-B in the same week; Personnel asks the company doctor to see them", mitigation: { verbs: ["approve_overtime"], department: ["personnel-administration"] } },
  { episode: 5, tier: 5, rounds: [13, 14], text: "Christmas Eve: the offices close at noon; a date on a document in somebody's file is not the date they remember", mitigation: null },
];
