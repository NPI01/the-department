/* What a Personal Goal means, for the player who holds it. Player-safe: what the
   goal asks, what the character already knows on day one, where to look, and
   what would settle it. The condition that decides a goal stays in secret
   canon (canon/secret/07) and is never shown. PROPOSED 2026-10-13.

   Leads (rewritten 2026-10-19): each names the exact index title and the order
   that gets it, in the clerk's own syntax, because two simulated cohorts read
   the pulls and still never requested the document the goal turns on. A file
   kept by a person is asked for by letter (TO: name); Records only refers. */
export type GoalBrief = { what: string; known: string; leads: string[]; proof: string };

export const GOAL_BRIEFS: Record<string, GoalBrief> = {
  "ep2-1": {
    what: "The county has eleven dead-cattle cases on its books since 1975. Some were Royce's HARVEST crews sampling tissue, authorized or not; some were lightning and coyotes; at least one is something nobody can explain. Sort them.",
    known: "The Minot paper has run the steer story. HARVEST's 1976 lots are authorized; the 1977 continuation sheet has a lot with no signatures. The sheriff keeps his own ledger and lets nobody else touch it.",
    leads: ["TO: Sheriff Dale Hollis, asking for Ward County Sheriff: livestock cases, 1975\u201377 (ledger); he keeps it himself and will want something back.", "ORDER: REQUEST_FILES Prairie Geological Services field unit log, September 1977 (Procurement colleagues; others TO: Gerald Voss) and ORDER: REQUEST_FILES Motor pool sign-out log, October 1977 (anyone).", "ORDER: EXAMINE each: the 29 September run has no authorization; MP-14 came back with 61 miles too many; case 7's tag never left the locker.", "ORDER: VISIT the Vane barn (Gary Vane will talk) and ORDER: SURVEIL the Halvorsen parcel (what goes down the hatch at night).", "When you are ready to say it under your name: FORM 22 (Statement of Livestock Cases), one letter per case; question 14 decides whether the sheriff may have it."],
    proof: "A Form 22 on file that puts each of the eleven cases in its right column. A statement that is mostly wrong is still a statement, and the people who read it will remember what you laid on the company.",
  },
  "ep2-2": {
    what: "Paul Greeley died in July in a laboratory accident the company says was electrical. His notebook was listed among his effects, struck off, and never reached his family. Find it, or enough of it, and put it before the Research Committee.",
    known: "His sister has written three times. A custodian clearing room 2-C found something. The inventory of effects is in Personnel; the sealed locker is in Building 2.",
    leads: ["ORDER: REQUEST_FILES Inventory of effects: P. Greeley (Personnel) (Personnel colleagues; others TO: Dorothy Armitage) and ORDER: EXAMINE it: the notebook is struck off and initialled.", "ORDER: SEARCH the Building 2 locker room (clearance 3 or a Security grant; TO: Leonard Fisk for the key) for Notebook, P. Greeley (from his locker).", "TO: Dr. Aris Kovic, asking for Laboratory daybook, Applied Physics, 12 July 1977 (Greeley's entry); ORDER: EXAMINE it: page 212 is missing.", "ORDER: REQUEST_FILES Badge reader log, Building 2, July 1977 (Corporate Security; via Fisk) and EXAMINE it; then ORDER: INTERVIEW at the Building 2 locker room, where the custodian works nights.", "To put it before the Committee: FILE Notebook, P. Greeley WITH Research Committee, or SEND <the notebook or the page> TO <any committee member>."],
    proof: "The notebook or its pages in your Case File and in the Committee's hands.",
  },
  "ep2-3": {
    what: "In June 1976 the sheriff logged a warm metal fragment found beside a dead heifer as 'ordnance' and wrote that he referred it to Minot Air Force Base. It is still in his locker. Applied Physics would very much like to have it.",
    known: "The sheriff's ledger lists it as case 7, tag E-76-19. Dr. Kovic keeps a fragment of his own and knows what one looks like.",
    leads: ["TO: Sheriff Dale Hollis; he will not hand over Evidence tag E-76-19, but he may say what it is worth to him.", "ORDER: SURVEIL the evidence locker, Sheriff's office: he visits it alone at 2340.", "ORDER: SEARCH the evidence locker, Sheriff's office (sealed; it will be seen); ORDER: TRAVEL Minot first.", "TO: Dr. Aris Kovic and TO: Walter Crane; each wants the fragment and neither will say so first. ORDER: ANALYZE Evidence tag E-76-19 once held."],
    proof: "The fragment, or the signed-out tag, in a Royce laboratory.",
  },
  "ep2-4": {
    what: "Ballot R-77-002 asks the Research Committee to hand the county HARVEST's authorizations and PGS's field logs and to record a finding on Lot 77-B. Your department has told you which way it must go. Carry it.",
    known: "Five staff seats and one employee seat. Vale and both Thornes lean against; Ely leans for and can be made certain; Kovic is for sale, and the price is the thing in the sheriff's locker.",
    leads: ["ORDER: LOBBY Dr. Sarah Ely FOR once you hold Sampling order, HARVEST Lot 77-B (unsigned) and have EXAMINEd it; she turns on proof it was unsigned.", "ORDER: LOBBY Dr. Aris Kovic FOR once you hold Ward County Sheriff: livestock cases, 1975\u201377 (ledger) and have EXAMINEd it; he turns on word of the fragment in the county locker.", "If you hold the employee seat: VOTE R-77-002: FOR or AGAINST as instructed. The ballot opens Round 23 and closes at the lock of Round 27."],
    proof: "The ballot closing the way your department requires.",
  },
  "ep4-1": {
    what: "Lyle Brandvold, a surveyor for Prairie Geological Services, sent three depth readings for one hole under the utility cellar at Tagus on the afternoon before Thanksgiving and has not been seen since. His wife has been to the sheriff. Find him.",
    known: "His truck is at the PGS yard and his field book is not in it. The cellar door was locked from outside the next morning. Elmer Bernard says a man came up out of the ground that night and walked west.",
    leads: ["TO: Elmer Bernard, who saw the man come up; he will say which way he walked.", "ORDER: TRAVEL Tagus, then ORDER: SURVEIL the farm west of Tagus (a man in a PGS jacket at first light) and ORDER: SURVEIL the utility cellar by St. Olaf, Tagus.", "TO: Agnes Rud, politely and without a form; ORDER: INTERVIEW at the farm west of Tagus meets her in person.", "TO: Sheriff Dale Hollis, who has the missing-person report and would rather find the man with the company's help."],
    proof: "Seeing him, meeting him, or holding a page in his hand that says where he has been.",
  },
  "ep4-2": {
    what: "Prairie Geological Services maintains 'agricultural monitoring equipment' near Tagus, loses a surveyor and tells Procurement rather than Security, and answers its telephone in Building 1. Establish what it is and who at Royce runs it.",
    known: "PGS is paid through Procurement's cost centre 4410. Its field supervisor wrote to Gerald Voss as 'Director, PGS'. The county land records at Stanley are public.",
    leads: ["ORDER: REQUEST_FILES Prairie Geological Services payroll register, 1977 and ORDER: REQUEST_FILES Memorandum: field surveyor overdue (PGS to G. Voss) (Procurement colleagues; others TO: Gerald Voss); ORDER: EXAMINE each.", "ORDER: TRAVEL Stanley, then ORDER: SEARCH the Mountrail County courthouse, Stanley for Mountrail County land records: the Tagus church parcel; ORDER: EXAMINE the deed's signatures.", "ORDER: SEARCH St. Olaf Lutheran, Tagus for Tagus municipal directory, 1974 and EXAMINE it: PGS's telephone number.", "TO: Maya Okafor, who answers the PGS telephone; TO: Curtis Mahlum (coffee), TO: Dennis Pfeifer (the 1974 invoice breaks him), TO: Ole Sandvik (do not mention the company)."],
    proof: "A PGS paper in your Case File and a name on it that is also on Royce's books.",
  },
  "ep4-3": {
    what: "Finance keeps an index of the company's federal contracts in the CFO's cabinet. The Aerospace member of the Safety Committee has as good as said the Tagus structure is held under one of them. Get the index out and in front of the Board.",
    known: "Margaret Hensley keeps it and has never shown it. Col. Baines has told the Committee to apply to her for it and then explain themselves to the Chairman. Walter Crane reads anything about money.",
    leads: ["TO: Margaret Hensley, asking to see Index of federal contracts, 1969\u20131977 (Finance cabinet); tell her, in writing, what the surveyor's three readings were.", "ORDER: EXAMINE Index of federal contracts, 1969\u20131977 (Finance cabinet): the 1969 line already lists the three depths. ORDER: ANALYZE it in Procurement's hands: the DSA-69 drawdowns foot to 77-S.", "FILE Index of federal contracts, 1969\u20131977 WITH Board of Directors, or SEND it TO Walter Crane or TO Margaret Hensley.", "Judged through Episode 7; it pays 25 now and 10 later."],
    proof: "The index, or a copy of it, in a director's hands.",
  },
  "ep4-4": {
    what: "Ballot S-77-004 asks the Safety Committee to pour concrete into the Tagus utility structure and fence the parcel. Your department has told you which way it must go. Carry it.",
    known: "Sloane sponsors it and Armitage leans with him; Voss leans for and can be made certain; Baines is against and cannot be moved; Hensley is near the middle and moves on what the measurements mean. The employee seat votes.",
    leads: ["ORDER: LOBBY Gerald Voss FOR once you hold Memorandum: field surveyor overdue (PGS to G. Voss), Prairie Geological Services payroll register, 1977 or the Stanley deed and have EXAMINEd it; his own name on a PGS paper makes him certain.", "ORDER: LOBBY Margaret Hensley AGAINST once a laboratory has confirmed the depths: ORDER: SEARCH the utility cellar by St. Olaf, Tagus for Two steel tapes and a bolt, then ORDER: ANALYZE them in Advanced Materials, or ORDER: ANALYZE Field book, L. Brandvold, PGS in Applied Physics.", "Col. Frank Baines does not move. Dorothy Armitage leans to seal. If you hold the employee seat, VOTE S-77-004: FOR or AGAINST as instructed; the ballot opens Round 45 and closes at the lock of Round 49."],
    proof: "The ballot closing the way your department requires.",
  },
  "ep4-5": {
    what: "Three instruments hung from one bolt in the Tagus cellar gave three depths. Dr. Vale wants a witness and Dr. Kovic wants a number. Go down the company's stairs as far as the landing and bring back a measurement a laboratory can use.",
    known: "The upper flight is twenty-one steps of 1920s concrete to a landing and a wall. Two steel tapes are still clipped to the bolt there. Kovic has a hand magnetometer in the cabinet by bench 4.",
    leads: ["ORDER: TRAVEL Tagus, then ORDER: VISIT the utility cellar by St. Olaf, Tagus (the door has a PGS lock; TO: Elmer Bernard for who has keys).", "ORDER: SEARCH the utility cellar by St. Olaf, Tagus for Two steel tapes and a bolt, lower landing, Tagus cellar; ORDER: EXAMINE them (both taut, one bolt).", "ORDER: ANALYZE Two steel tapes and a bolt in Advanced Materials (the tape is stretched), or ORDER: SEARCH the PGS yard, Tagus road for Field book, L. Brandvold, PGS and ORDER: ANALYZE it in Applied Physics (the plumb line was deflected).", "TO: Dr. Adrian Vale with the church clock's time against your watch; TO: Dr. Aris Kovic with the magnetometer's numbers."],
    proof: "Having stood on the landing, and a tape, a reading or a laboratory report that says what the hole does to a measurement.",
  },
  "ep4-6": {
    what: "Under the instrument hut on the Halvorsen parcel there is a room with eight years of strip charts in it. Prairie Geological Services calls it a pump house. Get in and bring out its log.",
    known: "The hatch inside the hut is padlocked. Two men go down most nights at 2330 with a case. The monitoring is paid for under a federal contract that Security has never been shown.",
    leads: ["ORDER: TRAVEL Tagus, then ORDER: SURVEIL the installation under the Halvorsen instrument hut: the hatch opens at 2330 and the pen recorder stops for eleven minutes.", "ORDER: SEARCH the installation under the Halvorsen instrument hut for Monitoring log, Site T installation (clearance 4, or Corporate Security or Procurement); the Congregation knows another way in.", "ORDER: ANALYZE Monitoring log, Site T installation in Information Systems (the trace rises on the unattended-job nights) or Applied Physics (the baseline climbs every year).", "TO: Harold Sloane or TO: Dr. Adrian Vale: each wants the log for the opposite reason."],
    proof: "The monitoring log in your Case File.",
  },
  "ep5-1": {
    what: "Below the first landing of the utility cellar at Tagus there is a wall, and a surveyor who went past it says there is a second flight. Go down, past the wall, and come back.",
    known: "The upper flight is twenty-one steps. If the Safety Committee sealed the door in November, the way down is a ventilation shaft under a steel plate in the Halvorsen windbreak; the Congregation knows it and Dennis Pfeifer poured its collar. How far you get depends on what you believe is down there, and a person alone gets further than a party.",
    leads: ["ORDER: TRAVEL Tagus, then ORDER: DESCEND (10 AU); or put both in one order: TRAVEL Tagus and go down the stairs.", "If the door is sealed: ORDER: VISIT the windbreak plate first (the shaft), or join the Congregation, whose members know the way.", "Read before you go: ORDER: EXAMINE Field book, L. Brandvold, PGS and Two steel tapes and a bolt if you hold them; TO: Lyle Brandvold, who went down and came back.", "Go alone. Two on the stairs the same night stop at the second landing."],
    proof: "Having been below the wall: the night's orders will say what you found.",
  },
  "ep5-2": {
    what: "Applied Physics requires a Report of Descent, Form 23, from anyone who has gone below the first landing, written before they have read anyone else's: steps down, steps up, light, sound, your watch against the church clock. Go down, and file yours.",
    known: "The form is Kovic's. Mrs. Rud at the farm west of Tagus wants the same thing for her own reasons: write yours, do not read theirs first.",
    leads: ["ORDER: TRAVEL Tagus, then ORDER: DESCEND.", "Reply FORM 23 for the blank; file it the morning after, with your own counts, before you talk to anyone who went down.", "ORDER: REQUEST_FILES Protocol for instrumented descent, Tagus structure (Applied Physics) for what Kovic expects."],
    proof: "A Form 23 on file in your name, after a descent.",
  },
  "ep5-3": {
    what: "Dr. Kovic has a hand magnetometer in the cabinet by bench 4 and wants it carried below the landing and brought back with the numbers. Two readings a minute apart on the same step will not agree. Bring him both.",
    known: "Applied Physics signs for the instrument. The readings become a document in your Case File; the Research Committee is the body that decides whether experiments continue.",
    leads: ["ORDER: REQUISITION the magnetometer (Applied Physics colleagues; others ask Dr. Kovic to sign for it).", "ORDER: TRAVEL Tagus, then ORDER: DESCEND with the instrument in hand; the readings are written down for you.", "SEND Magnetometer readings, Tagus stairs TO Dr. Aris Kovic, or FILE them WITH Research Committee.", "TO: Dr. Aris Kovic with the numbers; he promised a place on JANUS for them."],
    proof: "Readings taken below the landing, in your Case File or in Kovic's hands.",
  },
  "ep5-4": {
    what: "Ballot R-77-005 asks the Research Committee to authorize experiments on the Tagus passage. Your department has told you which way it must go. Carry it.",
    known: "Vale sponsors it; Kovic and Julian Thorne lean with him; Elias Thorne leans a little his way; Ely leans against and turns hard against if shown where the money comes from. The employee seat votes. Opens Round 63, closes at the lock of Round 69.",
    leads: ["ORDER: LOBBY Dr. Sarah Ely AGAINST once you hold Brief for R-77-005: experiments on the Tagus passage (Dr. Vale) and have EXAMINEd it: the budget line is appropriation 77-S.", "ORDER: LOBBY Dr. Elias Thorne FOR or AGAINST; he is the movable one.", "If you hold the employee seat: VOTE R-77-005: FOR or AGAINST as instructed, any day the ballot is open, including the closing day."],
    proof: "The ballot closing the way your department requires.",
  },
  "ep5-5": {
    what: "People who go far enough down the Tagus stairs report meeting someone there. Go far enough to find out who.",
    known: "Depth follows belief: the more you know and hold to about what is below, the further the stairs go. Contradictory beliefs stop you at the wall; company on the stairs stops you at the second landing; three disagreeing Reports of Descent in one round stop everyone.",
    leads: ["Read everything first: ORDER: EXAMINE the Field book, the tapes, the survey, the pamphlet, the monitoring log; each thing you hold to about the stairs is a step further.", "TO: Lyle Brandvold and TO: Agnes Rud, who both know what is below and will not agree with each other.", "ORDER: TRAVEL Tagus, then ORDER: DESCEND, alone, on a night nobody else is going.", "Do not file your Form 23 until you have been as far as you mean to go; three disagreeing accounts close the stairs."],
    proof: "Having met someone on the stairs who should not be there.",
  },
  "ep5-6": {
    what: "The people at the farm west of Tagus keep a thing quiet by writing it down wrong on purpose: three accounts of one night that do not agree. Get three Reports of Descent onto the record in one round that disagree on the count.",
    known: "Form 23 asks for steps down and steps up as numbers. Three or more filed in the same round with different counts is what the farm calls the practice; the company calls it bad data. Both are right.",
    leads: ["Go down yourself: ORDER: TRAVEL Tagus, ORDER: DESCEND, then FORM 23 with your own count.", "Get two others down the same week and filing the same round: ORDER: MEET <colleague> about going down and filing Form 23 the same morning; SEND them nothing to copy.", "TO: Agnes Rud, who will tell you why the counts must differ and will send her own people down if yours will not."],
    proof: "Three Reports of Descent in one round that disagree, with yours among them.",
  },
  "ep1-1": {
    what: "Prairie Geological Services, a Royce subsidiary, has been paying for concrete, cable and well-drilling at a parcel near Tagus where nothing has ever been built. Somebody at Royce approved those shipments. Find out who.",
    known: "You have seen the 1974 payables summary on a Procurement desk: eleven loads of concrete to the Halvorsen parcel, approved with two initials.",
    leads: ["ORDER: REQUEST_FILES Loading dock manifest, 28 September 1977 (anyone may; then ORDER: EXAMINE it: three chilled cases signed out to truck MP-14).", "TO: Maya Okafor, to take up her lunch; she has the key to the basement cabinet where the 1974 PGS payables sit.", "TO: Gerald Voss, asking to see Prairie Geological Services invoices, 1974 (originals); he keeps them himself and Records will only refer you. ORDER: OBTAIN Prairie Geological Services invoices, 1974 (originals) if he will not.", "ORDER: EXAMINE Prairie Geological Services invoices, 1974 (originals) once held: the approver's initials on page 3 are the proof.", "ORDER: EXAMINE Q3 inventory reconciliation, Procurement & Logistics (Procurement colleagues may REQUEST_FILES it; others write to Voss): lines 40\u201345 are the same money."],
    proof: "A document in your Case File that names the approver, or a committee finding that says who it was.",
  },
  "ep1-2": {
    what: "Somebody inside Royce has been passing company material to outsiders: a building layout has turned up in a letter from Yonkers, New York. Identify who sent it.",
    known: "Corporate Security has intercepted letters from a Martin Sayer that describe the campus too well. Sloane believes the leak is an employee.",
    leads: ["TO: Leonard Fisk, for the intercepted letters from Martin Sayer; Sloane says Fisk holds them.", "ORDER: MEET <the colleague Sayer wrote to> about the Sayer layout; one of your cohort received Building layout, hand-drawn (enclosed by M. Sayer) on Round 6. Ask them to SEND it to you.", "ORDER: EXAMINE Building layout, hand-drawn (enclosed by M. Sayer) once held: the hand is a draughtsman's, and the corner note names a building and a pour.", "TO: Julian Thorne, asking for Batch authorizations, Director of Information Systems (J-T); an Information Systems colleague can ORDER: REQUEST_FILES Terminal access log, Information Systems, October 1977 and EXAMINE it."],
    proof: "Holding the letter with the layout and being able to say, with a reason, who sent it.",
  },
  "ep1-3": {
    what: "ORPHEUS is a project in Applied Physics that nobody outside it will name in a memo. Get authorized access to one of its samples, or get a sample into your hands.",
    known: "Three fragments exist on campus: in Dr. Elias Thorne's lab, in Dr. Kovic's lab, and, the rumour goes, in the sheriff's evidence locker.",
    leads: ["TO: Dr. Aris Kovic, asking for Access roster, Project ORPHEUS (Applied Physics); he keeps it personally. Then ORDER: EXAMINE Access roster, Project ORPHEUS: the roster notes a third fragment and where it is.", "TO: Dr. Elias Thorne, taking up his request to help move the prototypes; that is how a name goes on the roster. TO: Dr. Sarah Ely for the biological-handling countersignature.", "ORDER: REQUEST_FILES Calibration log, prototypes, Advanced Materials, October 1977 (Advanced Materials colleagues; others write to Elias Thorne) and ORDER: EXAMINE it.", "ORDER: VISIT Building 7 by day and ORDER: SURVEIL Building 7 at night, to see where the sample goes on the 19th."],
    proof: "Access granted on the roster, or a fragment in your Case File.",
  },
  "ep1-4": {
    what: "Three personnel records in this building have been altered: a transfer, a death, and an employee nobody has met. Explain all three.",
    known: "Dr. Marsh's transfer notice is typed on a form that did not exist on its own effective date. Paul Greeley's locker was sealed by someone whose initials are not on the incident report. The October roster has one more name than the badge office has badges.",
    leads: ["ORDER: REQUEST_FILES Personnel roster, Station R, October 1977 and ORDER: REQUEST_FILES Personnel notice: transfer of Dr. E. Marsh (Personnel & Administration colleagues; others write TO: Dorothy Armitage, who keeps both).", "ORDER: EXAMINE Personnel roster, Station R, October 1977 (one name more than badges) and ORDER: EXAMINE Personnel notice: transfer of Dr. E. Marsh (read the form number at the foot).", "ORDER: REQUEST_FILES Personnel file index, October 1977 (Personnel & Administration) and ORDER: EXAMINE it: file 77-P-042 has no badge.", "TO: Harold Sloane, asking for Incident report: P. Greeley, July 1977; it is sealed (clearance 3 or a Security grant). ORDER: EXAMINE it for the gap in the timeline and the initials on the seal."],
    proof: "Knowing, with a document for each, that the transfer is false, that a ghost employee exists, and who sealed the locker.",
  },
  "ep1-5": {
    what: "A flight test log from Prairie Meridian Aviation, flight 77-ON, has gone missing before the flight review on October 19. Recover it.",
    known: "Capt. Bradley flew 77-ON. The log did not reach Aerospace Systems. The base at Minot has no record of a landing that night.",
    leads: ["TO: Capt. Thomas Bradley, asking for Flight test log 77-ON (Prairie Meridian); he keeps it himself and has reasons not to give it to Aerospace. His price is help clearing his name.", "ORDER: VISIT the Prairie Meridian strip by day; ORDER: SURVEIL the Prairie Meridian strip at night, to see what the hangar keeps and when the aircraft flies.", "ORDER: REQUEST_FILES Gate 2 vehicle log (October 1977) (Corporate Security colleagues) for the night of the 10th, and ORDER: REQUEST_FILES Vehicle entry log, Gate 4 (north gate), October 1977.", "The review is 19 October: the log in your Case File before then is full points, after is five."],
    proof: "The 77-ON log in your Case File before the review.",
  },
  "ep1-6": {
    what: "HARVEST is Biological Sciences' agricultural monitoring program: tissue sampled from cattle in the county. Establish whether its samples were taken under legitimate authority, and get a committee to say so either way.",
    known: "The 1976 authorizations each carry two signatures. The 1977 continuation sheet has a lot, 77-B, with none.",
    leads: ["TO: Dr. Sarah Ely, asking for Sampling order, HARVEST Lot 77-B (unsigned) and HARVEST sampling authorizations, 1976; Biological Sciences colleagues may ORDER: REQUEST_FILES both.", "ORDER: EXAMINE Sampling order, HARVEST Lot 77-B (unsigned): no signatures where the 1976 lots carry two.", "ORDER: REQUEST_FILES Loading dock manifest, 28 September 1977 and ORDER: EXAMINE it (three chilled cases out to MP-14); ORDER: REQUEST_FILES Cold storage temperature log, Annex B, September\u2013October 1977 and EXAMINE it (the door held at 0210 on the 29th).", "TO: Col. Frank Baines, answering his question whether Aerospace signed for any night run; TO: Margaret Hensley for Prairie Meridian Aviation invoices, 1977 (Finance), three of which are coded to HARVEST.", "The finding comes in Episode 2: the Research Committee's ballot R-77-002. If you hold the employee seat, VOTE R-77-002: FOR; otherwise ORDER: LOBBY Dr. Sarah Ely FOR once you hold the unsigned order."],
    proof: "A Research Committee finding, either way, on whether the sampling was authorized.",
  },
  "ep1-7": {
    what: "A classified appropriation is moving through Royce's accounts under a reference nobody will explain. Trace it, and find out how far over budget it has run.",
    known: "Finance carries an appropriation numbered 77-S. Its ledger page is in Margaret Hensley's office, and its totals do not add up.",
    leads: ["TO: Margaret Hensley, taking up her invitation to foot the page: Ledger page: appropriation 77-S (Finance). She keeps it; Records will only refer you.", "ORDER: EXAMINE Ledger page: appropriation 77-S (Finance) once held: the overrun line is $212,000 more than the sum of its entries.", "ORDER: REQUEST_FILES Prairie Geological Services invoices, 1974 (originals) (Procurement colleagues; others write to Voss) to see where part of the money went.", "ORDER: EXAMINE Q3 inventory reconciliation, Procurement & Logistics (via Voss): lines 40\u201345 are the north installation's maintenance under another name."],
    proof: "The 77-S ledger page in your Case File and an understanding of the overrun.",
  },
  "ep1-8": {
    what: "The Information Systems job log shows batch jobs run on dates that have not happened yet: entries dated later this month, and one that is years away. Explain how they got there.",
    known: "You have seen the October job log. Jobs are stamped with the date they ran. Several carry dates after today, all run at 0300, all from the console, on nights the operator log says nobody was on duty.",
    leads: ["ORDER: REQUEST_FILES Information Systems job log, October 1977 and ORDER: REQUEST_FILES Operator shift log, Information Systems, October 1977; both are your department's to read.", "ORDER: EXAMINE Information Systems job log, October 1977 (jobs dated after today, all at 0300, unattended) and ORDER: EXAMINE Operator shift log, Information Systems, October 1977 (the 8 October evening shift is signed in a hand that is not the operator's).", "TO: Julian Thorne, asking for Batch authorizations, Director of Information Systems (J-T); ORDER: EXAMINE it: the CHR-RECON series is authorized before it existed.", "ORDER: REQUEST_FILES Terminal access log, Information Systems, October 1977 and ORDER: EXAMINE it: the 0300 sessions sign on from terminal 00."],
    proof: "Knowing where the future-dated entries come from, with the logs to show it, or showing that they are a genuine anomaly the records cannot explain.",
  },
  "ep1-9": {
    what: "A motion, B-77-001 'Departmental Reporting Reform', closes before the Board on October 16. Your office has told you, in a sealed memo, which way it must go. Secure enough Board votes to make that happen.",
    known: "Seven seats. Hensley sponsors the motion; Sloane and Armitage lean with her. Royce, Vale and Baines lean against. Walter Crane, the outside director, is undecided.",
    leads: ["ORDER: LOBBY Walter Crane FOR (or AGAINST, as the sealed memorandum requires); ORDER: LOBBY Col. Frank Baines FOR (or AGAINST). Each director has a price and lobbying costs units; the ballot closes at the lock of Round 7.", "Crane moves on money leaving without a return: hold and EXAMINE Ledger page: appropriation 77-S (Finance) (TO: Margaret Hensley) or Prairie Geological Services invoices, 1974 (originals) (TO: Gerald Voss) before you lobby him.", "Baines moves on proof the night flights serve sampling he never signed for: ORDER: REQUEST_FILES Vehicle entry log, Gate 4 (north gate), October 1977 and EXAMINE it, or TO: Margaret Hensley for Prairie Meridian Aviation invoices, 1977 (Finance) and EXAMINE them.", "ORDER: MEET <the Personnel Administrator in your cohort> about who is lobbying whom; they hear the routing. Report to the Chairman's office by Round 5 as the memorandum says."],
    proof: "The motion closing the way the sealed memo requires.",
  },
};
