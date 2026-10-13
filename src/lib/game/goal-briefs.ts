/* What a Personal Goal means, for the player who holds it. Player-safe: what the
   goal asks, what the character already knows on day one, where to look, and
   what would settle it. The condition that decides a goal stays in secret
   canon (canon/secret/07) and is never shown. PROPOSED 2026-10-13. */
export type GoalBrief = { what: string; known: string; leads: string[]; proof: string };

export const GOAL_BRIEFS: Record<string, GoalBrief> = {
  "ep1-1": {
    what: "Prairie Geological Services, a Royce subsidiary, has been paying for concrete, cable and well-drilling at a parcel near Tagus where nothing has ever been built. Somebody at Royce approved those shipments. Find out who.",
    known: "You have seen the 1974 payables summary on a Procurement desk: eleven loads of concrete to the Halvorsen parcel, approved with two initials.",
    leads: ["Request the 1974 PGS invoices from Procurement (Gerald Voss keeps the originals).", "Ask Margaret Hensley's office what a PGS invoice needs before Finance pays it.", "A Financial Analyst in your own department will have the ledger side of the same story."],
    proof: "A document in your Case File that names the approver, or a committee finding that says who it was.",
  },
  "ep1-2": {
    what: "Somebody inside Royce has been passing company material to outsiders: a building layout has turned up in a letter from Yonkers, New York. Identify who sent it.",
    known: "Corporate Security has intercepted letters from a Martin Sayer that describe the campus too well. Sloane believes the leak is an employee.",
    leads: ["Get hold of a Sayer letter that contains a Royce layout; the Cult Recruit in your cohort may receive one.", "Information Systems keeps the outbound mail log; a Systems Programmer can read it.", "Compare the layout in the letter with the Facilities plat and the Procurement copy; only some people hold the version with Building 9."],
    proof: "Holding the letter with the layout and being able to say, with a reason, who sent it.",
  },
  "ep1-3": {
    what: "ORPHEUS is a project in Applied Physics that nobody outside it will name in a memo. Get authorized access to one of its samples, or get a sample into your hands.",
    known: "Three fragments exist on campus: in Dr. Elias Thorne's lab, in Dr. Kovic's lab, and, the rumour goes, in the sheriff's evidence locker.",
    leads: ["Request the ORPHEUS access roster from Applied Physics and see whose signature grants access.", "Dr. Ely's countersignature is needed for biological handling; a Biological Researcher in your cohort can ask for it.", "Visit the labs; see where the samples are kept and who checks on them."],
    proof: "Access granted on the roster, or a fragment in your Case File.",
  },
  "ep1-4": {
    what: "Three personnel records in this building have been altered: a transfer, a death, and an employee nobody has met. Explain all three.",
    known: "Dr. Marsh's transfer notice is typed on a form that did not exist on its own effective date. Paul Greeley's locker was sealed by someone whose initials are not on the incident report. The October roster has one more name than the badge office has badges.",
    leads: ["Request the Marsh transfer notice and the October roster from Personnel (Dorothy Armitage keeps both).", "Request the Greeley incident report from Security, or ask who ordered the locker sealed.", "The Executive Assistant in your cohort sees the routing slips that say who sent what where."],
    proof: "Knowing, with a document for each, that the transfer is false, that a ghost employee exists, and who sealed the locker.",
  },
  "ep1-5": {
    what: "A flight test log from Prairie Meridian Aviation, flight 77-ON, has gone missing before the flight review on October 19. Recover it.",
    known: "Capt. Bradley flew 77-ON. The log did not reach Aerospace Systems. The base at Minot has no record of a landing that night.",
    leads: ["Write to Capt. Bradley; he keeps the log himself and has reasons not to hand it to Aerospace.", "Security's perimeter logs for that night show what came and went; a Security Investigator can read them.", "Visit the Prairie Meridian strip and see what the hangar keeps."],
    proof: "The 77-ON log in your Case File before the review.",
  },
  "ep1-6": {
    what: "HARVEST is Biological Sciences' agricultural monitoring program: tissue sampled from cattle in the county. Establish whether its samples were taken under legitimate authority, and get a committee to say so either way.",
    known: "The 1976 authorizations each carry two signatures. The 1977 continuation sheet has a lot, 77-B, with none.",
    leads: ["Request the HARVEST sampling authorizations and the Lot 77-B sampling order from Dr. Ely.", "Ask Col. Baines whether Aerospace signed for any night sampling runs.", "The Research Committee can establish a finding; its employee seat is elected in Round 3."],
    proof: "A Research Committee finding, either way, on whether the sampling was authorized.",
  },
  "ep1-7": {
    what: "A classified appropriation is moving through Royce's accounts under a reference nobody will explain. Trace it, and find out how far over budget it has run.",
    known: "Finance carries an appropriation numbered 77-S. Its ledger page is in Margaret Hensley's office, and its totals do not add up.",
    leads: ["Write to Margaret Hensley; she keeps the ledger page and has her own reasons to want it read.", "The 1974 PGS invoices, held by Procurement, show where some of the money went.", "Examine any ledger page you obtain; the arithmetic is the clue."],
    proof: "The 77-S ledger page in your Case File and an understanding of the overrun.",
  },
  "ep1-8": {
    what: "The Information Systems job log shows batch jobs run on dates that have not happened yet: entries dated later this month, and one that is years away. Explain how they got there.",
    known: "You have seen the October job log. Jobs are stamped with the date they ran. Several carry dates after today, all run at 0300, all from the console, on nights the operator log says nobody was on duty.",
    leads: ["Request the IS job log and the operator shift log from your own department; both are yours to read.", "Ask Julian Thorne who holds console authority after midnight; batch authorizations are his.", "A Financial Analyst in your cohort can see whether the budget was reallocated to cover console time nobody ordered."],
    proof: "Knowing where the future-dated entries come from, with the logs to show it, or showing that they are a genuine anomaly the records cannot explain.",
  },
  "ep1-9": {
    what: "A motion, B-77-001 'Departmental Reporting Reform', closes before the Board on October 16. Your office has told you, in a sealed memo, which way it must go. Secure enough Board votes to make that happen.",
    known: "Seven seats. Hensley sponsors the motion; Sloane and Armitage lean with her. Royce, Vale and Baines lean against. Walter Crane, the outside director, is undecided.",
    leads: ["Lobby directors in person (ORDER: LOBBY <name> FOR or AGAINST); each has a price.", "Crane moves on evidence of financial exposure; Baines moves on proof about the night flights; Vale rewards anyone who lobbies against.", "The Personnel Administrator in your cohort hears who is lobbying whom."],
    proof: "The motion closing the way the sealed memo requires.",
  },
};
