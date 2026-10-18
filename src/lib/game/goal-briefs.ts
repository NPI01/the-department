/* What a Personal Goal means, for the player who holds it. Player-safe: what the
   goal asks, what the character already knows on day one, where to look, and
   what would settle it. The condition that decides a goal stays in secret
   canon (canon/secret/07) and is never shown. PROPOSED 2026-10-13. */
export type GoalBrief = { what: string; known: string; leads: string[]; proof: string };

export const GOAL_BRIEFS: Record<string, GoalBrief> = {
  "ep2-1": {
    what: "The county has eleven dead-cattle cases on its books since 1975. Some were Royce's HARVEST crews sampling tissue, authorized or not; some were lightning and coyotes; at least one is something nobody can explain. Sort them.",
    known: "The Minot paper has run the steer story. HARVEST's 1976 lots are authorized; the 1977 continuation sheet has a lot with no signatures. The sheriff keeps his own ledger and lets nobody else touch it.",
    leads: ["Write to Sheriff Hollis for his livestock case ledger; he will want something in return.", "Request the PGS field unit log from Procurement; it says which nights a crew went out and in which truck.", "The motor pool sign-out log is open to anyone; match trucks to nights.", "Visit the Vane barn and the Halvorsen parcel; ask who comes at night.", "When you are ready to say it under your name, reply FORM 22 for the Statement of Livestock Cases: one letter per case, and question 14 decides whether the sheriff may have it."],
    proof: "A Form 22 on file that puts each of the eleven cases in its right column. A statement that is mostly wrong is still a statement, and the people who read it will remember what you laid on the company.",
  },
  "ep2-2": {
    what: "Paul Greeley died in July in a laboratory accident the company says was electrical. His notebook was listed among his effects, struck off, and never reached his family. Find it, or enough of it, and put it before the Research Committee.",
    known: "His sister has written three times. A custodian clearing room 2-C found something. The inventory of effects is in Personnel; the sealed locker is in Building 2.",
    leads: ["Request Greeley's inventory of effects from Personnel and examine who struck the notebook off.", "The Building 2 locker is sealed by Security; search it with the right access, or get Security to open it.", "Request the Applied Physics daybook for 12 July from Dr. Kovic; a page is missing.", "The Research Committee's employee seat is the way to put a document in front of it."],
    proof: "The notebook or its pages in your Case File and in the Committee's hands.",
  },
  "ep2-3": {
    what: "In June 1976 the sheriff logged a warm metal fragment found beside a dead heifer as 'ordnance' and wrote that he referred it to Minot Air Force Base. It is still in his locker. Applied Physics would very much like to have it.",
    known: "The sheriff's ledger lists it as case 7, tag E-76-19. Dr. Kovic keeps a fragment of his own and knows what one looks like.",
    leads: ["Write to Sheriff Hollis; he will not hand it over, but he may say what it is worth to him.", "Watch the Sheriff's office at night; he visits the locker alone.", "Dr. Kovic will trade for it; Walter Crane will pay for it; neither will say so first.", "The county attorney, the state veterinarian and the Air Force are all levers, and all of them cost the company something."],
    proof: "The fragment, or the signed-out tag, in a Royce laboratory.",
  },
  "ep2-4": {
    what: "Ballot R-77-002 asks the Research Committee to hand the county HARVEST's authorizations and PGS's field logs and to record a finding on Lot 77-B. Your department has told you which way it must go. Carry it.",
    known: "Five staff seats and one employee seat. Vale and both Thornes lean against; Ely leans for and can be made certain; Kovic is for sale, and the price is the thing in the sheriff's locker.",
    leads: ["Lobby committee members in person (ORDER: LOBBY <name> FOR or AGAINST); each has a price.", "Ely moves on proof that 77-B was unsigned; Kovic moves on word of the fragment in the county locker.", "The employee seat was elected in Episode 1; whoever holds it votes."],
    proof: "The ballot closing the way your department requires.",
  },
  "ep4-1": {
    what: "Lyle Brandvold, a surveyor for Prairie Geological Services, sent three depth readings for one hole under the utility cellar at Tagus on the afternoon before Thanksgiving and has not been seen since. His wife has been to the sheriff. Find him.",
    known: "His truck is at the PGS yard and his field book is not in it. The cellar door was locked from outside the next morning. Elmer Bernard says a man came up out of the ground that night and walked west.",
    leads: ["Write to Elmer Bernard, who saw the man; he will say which way he went.", "Watch the cellar and the farm west of Tagus at night; a surveyor who will not go home has to be somewhere.", "Write to Mrs. Agnes Rud at the farm, politely and without a form; she answers the polite.", "Sheriff Hollis has the missing-person report and would rather find the man with the company's help than without it."],
    proof: "Seeing him, meeting him, or holding a page in his hand that says where he has been.",
  },
  "ep4-2": {
    what: "Prairie Geological Services maintains 'agricultural monitoring equipment' near Tagus, loses a surveyor and tells Procurement rather than Security, and answers its telephone in Building 1. Establish what it is and who at Royce runs it.",
    known: "PGS is paid through Procurement's cost centre 4410. Its field supervisor wrote to Gerald Voss as 'Director, PGS'. The county land records at Stanley are public.",
    leads: ["Request the PGS payroll register and the overdue memo from Procurement; Voss holds both and will not want to.", "Go to the Mountrail County courthouse at Stanley and read the deed for the church parcel; anyone may.", "Maya Okafor files what arrives for PGS and has family in Tagus.", "Three former PGS men are in the county: Sandvik will not talk, Mahlum says they were looking for a tunnel, Pfeifer says there was never any digging."],
    proof: "A PGS paper in your Case File and a name on it that is also on Royce's books.",
  },
  "ep4-3": {
    what: "Finance keeps an index of the company's federal contracts in the CFO's cabinet. The Aerospace member of the Safety Committee has as good as said the Tagus structure is held under one of them. Get the index out and in front of the Board.",
    known: "Margaret Hensley keeps it and has never shown it. Col. Baines has told the Committee to apply to her for it and then explain themselves to the Chairman. Walter Crane reads anything about money.",
    leads: ["Write to Margaret Hensley; she is nearer to showing it than she lets on, and the surveyor has made it a liability.", "Examine the index if you get it; the 1969 line for the Tagus parcel says more than it should.", "File it with the Board, or hand a copy to any director; Crane and Hensley are the two who want it read.", "This goal is judged through Episode 7: the Board will take it up when it must, and it pays more if it goes in now."],
    proof: "The index, or a copy of it, in a director's hands.",
  },
  "ep4-4": {
    what: "Ballot S-77-004 asks the Safety Committee to pour concrete into the Tagus utility structure and fence the parcel. Your department has told you which way it must go. Carry it.",
    known: "Sloane sponsors it and Armitage leans with him; Voss leans for and can be made certain; Baines is against and cannot be moved; Hensley is near the middle and moves on what the measurements mean. The employee seat votes.",
    leads: ["Lobby committee members in person (ORDER: LOBBY <name> FOR or AGAINST); each has a price.", "Voss moves once his own name is on a PGS paper; Hensley moves on a laboratory's word that the three depths are real.", "The ballot opens on the 26th and closes at the lock of the 30th."],
    proof: "The ballot closing the way your department requires.",
  },
  "ep4-5": {
    what: "Three instruments hung from one bolt in the Tagus cellar gave three depths. Dr. Vale wants a witness and Dr. Kovic wants a number. Go down the company's stairs as far as the landing and bring back a measurement a laboratory can use.",
    known: "The upper flight is twenty-one steps of 1920s concrete to a landing and a wall. Two steel tapes are still clipped to the bolt there. Kovic has a hand magnetometer in the cabinet by bench 4.",
    leads: ["Travel to Tagus and visit the utility cellar; the door has a PGS lock and Bernard knows who has keys.", "Search the landing; take what is there.", "Have Applied Physics or Advanced Materials analyze what you bring back.", "Vale wants the church clock's time against your watch; Kovic wants the magnetometer back with its numbers."],
    proof: "Having stood on the landing, and a tape, a reading or a laboratory report that says what the hole does to a measurement.",
  },
  "ep4-6": {
    what: "Under the instrument hut on the Halvorsen parcel there is a room with eight years of strip charts in it. Prairie Geological Services calls it a pump house. Get in and bring out its log.",
    known: "The hatch inside the hut is padlocked. Two men go down most nights at 2330 with a case. The monitoring is paid for under a federal contract that Security has never been shown.",
    leads: ["Watch the Halvorsen parcel at night; the hatch opens on a schedule.", "Security clearance or a Security grant gets a search past the padlock; so does the Congregation, which knows another way in.", "Information Systems can read the log's trace against its own job log; Applied Physics can read the baseline.", "Sloane wants the log to prove the site is nobody's business but his; Vale wants it to prove the opposite."],
    proof: "The monitoring log in your Case File.",
  },
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
