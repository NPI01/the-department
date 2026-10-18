/* Episode 04 — The Church at Tagus (rounds 43–56; days 1–14 of the episode).
   A Prairie Geological Services surveyor fails to report over Thanksgiving
   after sending three depth readings for one void under the utility cellar
   by St. Olaf; the company's quiet land purchases come into the open; the
   Safety Committee votes on sealing the entrance. PROPOSED (2026-10-18).
   Truths this rests on (canon/secret/02, 00, 16): the upper flight is ordinary
   concrete and ends at a wall near the twentieth step; two measurements of one
   descent differ by design; nobody is lost for a round unless they choose to
   stay; the 1969 SENTINEL contracts already carry the stairway's depths. The
   surveyor came up the same night and is at the Rud farm. */
import type { DocumentDef, PlaceDef, PressureTier } from "./types";

export const DOCUMENTS_04: DocumentDef[] = [
  {
    slug: "brandvold-last-message", episode: 4, title: "Teletype slip: field message, L. Brandvold, 23 November 1977", kind: "memo",
    aliases: ["last message", "brandvold's message", "the teletype", "the three depths", "depth readings", "field message", "surveyor's message"],
    holder: "procurement-logistics", access: {},
    grants: ["tagus.void_reported", "tagus.three_depths"],
    wrongDetail: { text: "the three readings are timed 1640, 1640 and 1640: not three attempts over an afternoon but one measurement, read three ways at once", grants: "tagus.three_depths_same_minute_noticed" },
    from: "Prairie Geological Services", written: "23 November 1977",
    body: "**PGS FIELD — TELETYPE — 23 NOV 77 — 1702**\n\nTO PGS OFFICE / ATTN G.V.\nFM BRANDVOLD, SITE T, UTILITY CELLAR\n\nVOID BELOW LOWER LANDING CONFIRMED. PLUMB LINE 1640: 11 FT TO FLOOR. STEEL TAPE 1640: 40 FT TO FLOOR. WEIGHTED LINE 1640: NO BOTTOM AT 300 FT, LINE SLACK. ALL THREE FROM SAME BOLT. REQUEST SECOND MAN. GOING DOWN TO CHECK THE TAPE.\n\n(END)",
  },
  {
    slug: "pgs-overdue-report", episode: 4, title: "Memorandum: field surveyor overdue (PGS to G. Voss)", kind: "memo",
    aliases: ["overdue report", "pgs memo", "surveyor overdue", "the overdue memo", "pgs report to voss", "missing surveyor"],
    holder: "voss", access: { clearance: 2, department: ["procurement-logistics"], via: "voss" }, notice: true,
    grants: ["pgs.surveyor_overdue", "pgs.reported_to_voss_not_security"],
    wrongDetail: { text: "the memo is addressed to Mr. Voss as 'Director, Prairie Geological Services' and carries no copy to Corporate Security; a Royce subsidiary that loses a man tells Procurement and nobody else", grants: "pgs.voss_is_pgs_director_noticed" },
    from: "Prairie Geological Services", written: "24 November 1977",
    body: "**PRAIRIE GEOLOGICAL SERVICES — MEMORANDUM**\n\nTo: G. Voss, Director, PGS\n\nField surveyor L. Brandvold did not report at 1800 on the 23rd and is not at the motel in Stanley. His truck is at the yard; his field book is not in it. Last message attached. The site door was found closed and locked from outside at 0700 on the 24th. We have not called the sheriff. Instruction requested.\n\n— R.K., field supervisor",
  },
  {
    slug: "brandvold-field-book", episode: 4, title: "Field book, L. Brandvold, PGS (October–November 1977)", kind: "document",
    aliases: ["field book", "brandvold's field book", "the surveyor's book", "survey book", "his field book", "the book from the truck"],
    holder: "pgs-yard", access: { clearance: 4, department: ["procurement-logistics", "corporate-security"] }, notice: true,
    grants: ["tagus.field_book_held", "tagus.cellar_surveyed_six_times", "tagus.lower_landing_wall"],
    wrongDetail: { text: "every entry is in one hand except the last, where the words 'no bottom' and the initials O.S. are in another; somebody was down there with him on the 23rd who is not on the PGS crew list", grants: "tagus.field_book_second_hand_noticed" },
    analyses: [
      { department: "applied-physics", text: "A plumb line, a steel tape and a weighted line hung from one bolt cannot read 11, 40 and 300 feet unless the lines were not hanging straight. The plumb bob was deflected; the tape, being stiff, less so; the weighted line, which follows any pull, most. The instruments did not fail. Something below the landing pulled sideways, and pulled harder on the line that could follow it. All three readings are correct measurements of a space that does not have one depth.", grants: ["tagus.depths_all_correct_confirmed", "tagus.lateral_pull_measured"] },
      { department: "information-systems", text: "The six survey dates in the book, set against the Information Systems job log, fall on the nights the console ran unattended batch jobs. Whoever scheduled those jobs knew when a man would be on the stairs, or the other way round.", grants: ["tagus.survey_dates_match_choir_nights_noticed"] },
    ],
    from: "Prairie Geological Services", written: "November 1977",
    body: "**FIELD BOOK — L. BRANDVOLD — PGS**\n\n*12 Oct.* Site T cellar. Upper flight 21 steps, 7 in. rise, concrete, 1920s pour. Lower landing: wall. Sounded hollow.\n*19 Oct.* Same. Wall. Counted 20 steps today; recounted, 21.\n*26 Oct.* Core at lower landing: 14 in. concrete, then nothing. Void.\n*2 Nov.* Magnetometer reads high at the 12th step and higher at the wall. Watch lost four minutes.\n*16 Nov.* Bore hole enlarged. Air moves in it. Cold, then not.\n*23 Nov.* Three lines, one bolt: 11 / 40 / **no bottom**. Going down to check the tape. — O.S.",
  },
  {
    slug: "pgs-payroll-1977", episode: 4, title: "Prairie Geological Services payroll register, 1977", kind: "document",
    aliases: ["pgs payroll", "payroll register", "pgs staff", "who works for pgs", "pgs employees", "the payroll"],
    holder: "procurement-logistics", access: { clearance: 2, department: ["procurement-logistics"], via: "voss" }, notice: true,
    grants: ["pgs.payroll_lists_six", "pgs.paid_through_royce_procurement"],
    wrongDetail: { text: "one name, O. Sandvik, has drawn a field surveyor's pay every month since 1969 against badge number 0000, a number the badge office has never issued; the October roster's extra name is his", grants: "pgs.sandvik_paid_no_badge_noticed" },
    from: "Procurement & Logistics", written: "1977",
    body: "**PRAIRIE GEOLOGICAL SERVICES — PAYROLL — 1977** *(paid through Royce Procurement, cost centre 4410)*\n\n| Name | Role | Since | Badge |\n|---|---|---|---|\n| Kessel, R. | field supervisor | 1972 | 2214 |\n| Lund, T. | technician | 1975 | 3107 |\n| Brandvold, L. | field surveyor | 1976 | 3390 |\n| Pfeifer, D. | driver (to 8/77) | 1973 | 2560 |\n| Mahlum, C. | technician (to 6/76) | 1970 | 1811 |\n| Sandvik, O. | field surveyor | 1969 | 0000 |",
  },
  {
    slug: "royce-geological-survey-1969", episode: 4, title: "Royce Geological Survey, Tagus parcel, 1969 (PGS-69-044, with Sketch B)", kind: "report",
    aliases: ["1969 survey", "geological survey", "document b", "pgs-69-044", "the tagus survey", "vale's copy of the survey", "two maps"],
    holder: "vale", access: { clearance: 4, via: "vale" }, notice: true,
    grants: ["tagus.survey_1969_two_maps", "tagus.survey_recommends_monitoring", "tagus.survey_sketch_b_exists"],
    wrongDetail: { text: "the dimensions of the lower structure are given 'per Dwg. 68-24', a drawing number from the year before the survey; nothing else in the file is numbered that way, and the archive copy in Records has no Sketch B at all", grants: "tagus.survey_cites_68_24_noticed" },
    from: "Prairie Geological Services for Royce Industries", written: "August 1969",
    body: "**ROYCE INDUSTRIES — GEOLOGICAL SURVEY — TAGUS PARCEL — PGS-69-044**\n\nTwo crews surveyed the utility cellar on consecutive days.\n\n*Sketch A (crew 1):* a stair of 21 steps to a landing 14 ft below grade; a cellar 9 × 11 ft; no further passage.\n*Sketch B (crew 2):* a stair of 20 steps to a landing 14 ft below grade; a second flight continuing below the landing, dimensions per Dwg. 68-24; not descended.\n\nThe crews could not reconcile their sketches. Recommendation: acquire the parcel; instrument the cellar; continuous monitoring. — CC: A. Vale",
  },
  {
    slug: "sentinel-contract-index", episode: 4, title: "Index of federal contracts, 1969–1977 (Finance cabinet)", kind: "document",
    aliases: ["contract index", "federal contracts", "the index", "hensley's index", "sentinel index", "verification site t", "site t"],
    holder: "hensley", access: { clearance: 4, via: "hensley" }, notice: true,
    grants: ["sentinel.contract_index_exists", "sentinel.verification_site_t_named", "sentinel.program_name_seen"],
    wrongDetail: { text: "the 1969 line for Verification Site T lists 'depth readings per Appendix C: 11 ft / 40 ft / indeterminate'; the company's own first survey of the site is dated the following year, and the surveyor's readings of last week are the same three numbers", grants: "sentinel.depths_known_in_1969_noticed" },
    analyses: [
      { department: "procurement-logistics", text: "The contract numbers carry the prefix DSA-69, and the source line of appropriation 77-S in the general ledger, 'federal contract, reference withheld', foots exactly to the sum of the three DSA-69 contracts' 1977 drawdowns. The withheld reference is this index.", grants: ["sentinel.index_matches_77s_noticed"] },
    ],
    from: "Finance", written: "1969–77",
    body: "**ROYCE INDUSTRIES — FEDERAL CONTRACTS — INDEX (restricted)**\n\n| No. | Year | Program | Subject |\n|---|---|---|---|\n| DSA-69-112 | 1969 | SENTINEL | verification; instrumentation; Station R sub-level |\n| DSA-69-113 | 1969 | SENTINEL | assessment; aerial survey, Sector 4 |\n| DSA-69-114 | 1969 | SENTINEL | containment; **Verification Site T** (Tagus parcel); acquire, instrument, monitor; depth readings per Appendix C: 11 ft / 40 ft / indeterminate |\n| DSA-73-021 | 1973 | SENTINEL | OMEGA chamber, phase II |\n\nDrawdowns 1977 see 77-S. — M.H.",
  },
  {
    slug: "pgs-monitoring-log", episode: 4, title: "Monitoring log, Site T installation (pen recorder and visitors), 1969–77", kind: "document",
    aliases: ["monitoring log", "installation log", "site t log", "the log under the hut", "pen recorder log", "visitors log", "hut log"],
    holder: "tagus-installation", access: { clearance: 4, department: ["corporate-security"] }, notice: true,
    grants: ["tagus.installation_monitors_cellar", "tagus.installation_logs_visitors", "tagus.installation_eight_years"],
    wrongDetail: { text: "the visitors column is initials only for eight years, except 14 August 1977: 'E. Marsh — D.A. sign-out', the only visit by name, and the only one by a woman", grants: "tagus.marsh_visited_august_noticed" },
    analyses: [
      { department: "information-systems", text: "The magnetometer trace rises on the same nights as the unattended batch jobs in the Information Systems job log, to the minute of their start, and settles when they end. The cellar and the mainframe are being read together by somebody who schedules both.", grants: ["tagus.instrument_rise_matches_choir_nights_noticed"] },
      { department: "applied-physics", text: "The trace's baseline has climbed every year since 1969 and climbed fastest this October. Whatever is being monitored is not steady; it is being fed.", grants: ["tagus.baseline_rising_confirmed"] },
    ],
    from: "Prairie Geological Services", written: "1969–77",
    body: "**SITE T — MONITORING LOG**\n\nPen recorder, magnetometer, cellar microphone. Visitors by initials.\n\n*1969–76:* G.V., F.B., R.K., O.S., recurring. Trace flat with nightly spikes.\n*14 Aug 77:* E. Marsh — D.A. sign-out. 40 min. Trace: see strip.\n*Oct 77:* spikes nightly 0300–0330, rising.\n*23 Nov 77:* L.B. down 1641. Trace off scale 1641–1652. Door closed from outside 2310. Visitor O.S., not signed.",
  },
  {
    slug: "stanley-land-records-tagus", episode: 4, title: "Mountrail County land records: the Tagus church parcel (1921–1969)", kind: "document",
    aliases: ["land records", "the deed", "county records", "mountrail records", "tagus deed", "land records at stanley", "the parcel deed"],
    holder: "stanley-courthouse", access: { clearance: 1 },
    grants: ["tagus.parcel_bought_1969_by_pgs", "tagus.parcel_was_the_churchs"],
    wrongDetail: { text: "the 1969 deed is signed for the buyer by G. Voss as 'agent, Prairie Geological Services' and witnessed by 'F. Baines, Col., USAF': a serving officer witnessing a private company's purchase, three years before either man appears on Royce's own payroll", grants: "tagus.deed_signed_voss_baines_1969_noticed" },
    from: "Mountrail County Register of Deeds", written: "1969",
    body: "**MOUNTRAIL COUNTY — REGISTER OF DEEDS — TAGUS, LOTS 4–6, BLOCK 2**\n\n*1921.* Utility structure and cellar erected by the Northern Correspondence Society, L. Bell, trustee. Conveyed to St. Olaf Lutheran, 1933.\n*1961.* Church council resolves to keep the cellar locked.\n*1969.* Lots 4–6 conveyed by St. Olaf Lutheran to Prairie Geological Services, $1.00 and other consideration. For the buyer: G. Voss, agent. Witness: F. Baines, Col., USAF.",
  },
  {
    slug: "cellar-tapes", episode: 4, title: "Two steel tapes and a bolt, lower landing, Tagus cellar", kind: "object",
    aliases: ["the tapes", "steel tapes", "the bolt", "the surveyor's tapes", "tapes on the landing", "measuring tapes"],
    holder: "tagus-cellar", access: { clearance: 1 },
    grants: ["tagus.two_tapes_one_bolt", "tagus.stood_on_lower_landing"],
    wrongDetail: { text: "both tapes are clipped to the same bolt and run down the same bore hole; one is paid out to 11 ft and one to 40, and both are taut", grants: "tagus.tapes_both_taut_noticed" },
    analyses: [
      { department: "advanced-materials", text: "Both tapes are ordinary stamped steel, but the 40-foot tape is stretched: its foot marks are 12.4 inches apart below the 20-foot mark and 12 above it. Steel does not stretch three per cent under a plumb bob. It was pulled from below by something that let go.", grants: ["tagus.tape_stretched_confirmed"] },
    ],
    from: "found", written: "November 1977",
    body: "Two engineer's tapes clipped to one eyebolt set in the landing floor, both running into a bore hole the width of a fist. The first reads 11 ft at the lip. The second reads 40 ft. You can pull neither up.",
  },
  {
    slug: "ashby-inspection-notice", episode: 4, title: "Notice of inspection: Verification Site T (C. Ashby, contracting officer)", kind: "letter",
    aliases: ["inspection notice", "ashby's letter", "the federal letter", "notice of inspection", "ashby's notice", "the contracting officer's letter"],
    holder: "royce", access: { clearance: 4 }, notice: true,
    grants: ["sentinel.inspection_noticed", "sentinel.ashby_named"],
    wrongDetail: { text: "the notice cites contract DSA-69-114 and calls the parcel 'Verification Site T', a name the company has never used in a letter to the county or the sheriff; whoever wrote it has read the company's own index", grants: "sentinel.site_t_name_federal_noticed" },
    from: "C. Ashby, Contracting Officer", written: "5 December 1977",
    body: "**DEFENSE SUPPLY — CONTRACTING OFFICE — (address withheld)**\n\nMr. Royce,\n\nUnder clause 14 of contract DSA-69-114 the Government will inspect Verification Site T on 6 December. The site is to be accessible in its contracted condition. Any alteration to the structure since 23 November is to be reported to me in writing before the inspection, with the name of the officer who ordered it.\n\nC. Ashby, Contracting Officer",
  },
  {
    slug: "brandvold-page", episode: 4, title: "A page torn from a field book (L. Brandvold)", kind: "document",
    aliases: ["brandvold's page", "the torn page", "page from the field book", "the surveyor's page", "brandvold's letter"],
    holder: "brandvold", access: { clearance: 5, via: "brandvold" },
    grants: ["brandvold.alive", "brandvold.three_days_one_night", "brandvold.warns_against_pour"],
    wrongDetail: { text: "the page is dated 23, 24 and 25 November in three places, in his hand, and the ink is the same; he wrote three days of entries in one night and does not know it", grants: "brandvold.dates_changed_noticed" },
    from: "L. Brandvold", written: "November 1977",
    body: "*23 Nov.* Went down to check the tape. Lower flight is there. Counted.\n*24 Nov.* Still counting. The light is below me and it is not mine. Somebody above is saying my name wrong.\n*25 Nov.* Came up. Door was shut. It was Thursday night. It was still Thursday night.",
  },
];

export const PLACES_04: PlaceDef[] = [
  { slug: "tagus-cellar", town: "tagus", offCampus: true, episode: 4, name: "the utility cellar by St. Olaf, Tagus", aliases: ["utility cellar", "the cellar", "tagus cellar", "the stairs", "the stairway", "cellar by the church", "the steel door", "site t", "the utility structure"], restricted: true,
    visit: "A concrete blockhouse behind the church with a steel door, PGS padlock, and twenty-one steps going down. At the bottom a landing and a wall that was poured after the stairs were. On the twelfth step your watch and the church clock disagree, and at the wall two steel tapes run into a hole the width of a fist. You counted twenty on the way back up.",
    ask: "Elmer Bernard says the door has had a company lock on it since 1969 and a church lock before that, that he does not go in, and that on Thursday night a man came up out of it and stood with his hand on the door for a long time.",
    surveil: [
      { episode: 4, rounds: [1, 7], text: "at 0110 the steel door opened from inside; a man in a PGS jacket came up, pulled it shut, and stood with his palm flat on it for ten minutes; he walked to the church, did not go in, and went west on the Rud road on foot", grants: "tagus.man_came_up_seen", restricted: true },
      { episode: 4, rounds: [8, 14], text: "a PGS truck and a second truck with no markings at the cellar door at 0200; two men carried in a case and a third, in a suit, carried nothing and wrote in a notebook; the church tower hummed loud enough to hear from the road", grants: "tagus.unmarked_truck_at_cellar_seen", restricted: true },
    ],
    contains: ["cellar-tapes"], searchAccess: { clearance: 1 } },
  { slug: "tagus-installation", town: "tagus", offCampus: true, episode: 4, name: "the installation under the Halvorsen instrument hut", aliases: ["the installation", "under the hut", "monitoring room", "royce installation", "the hatch", "site t installation", "the room under the halvorsen hut", "instrument hut hatch"], restricted: true,
    visit: "The hatch inside the instrument hut is padlocked. Through its grille: a steel ladder down to lit concrete, a pen recorder ticking, a telephone with no dial, and a bank of strip charts eight years deep.",
    ask: "A man in a PGS jacket says it is a pump house, that there is nothing to see, and that if you are from the company you should know that, and if you are not you should leave.",
    surveil: [
      { episode: 4, rounds: [1, 14], text: "the hatch opened at 2330 and two men went down with a case; at 0016 the pen recorder's hum stopped for eleven minutes and the hut's light dimmed to nothing and came back; the men came up at 0140 and one of them was sick in the grass", grants: "tagus.installation_eleven_minutes_seen", restricted: true },
    ],
    contains: ["pgs-monitoring-log"], searchAccess: { clearance: 4, department: ["corporate-security", "procurement-logistics"] } },
  { slug: "stanley-courthouse", town: "stanley", offCampus: true, episode: 4, name: "the Mountrail County courthouse, Stanley", aliases: ["stanley courthouse", "the courthouse at stanley", "register of deeds", "county land office", "land office", "mountrail county courthouse"],
    visit: "A stone courthouse, a register of deeds behind a brass rail, and the big books on a slanted shelf. Anyone may read them. Nobody does.",
    ask: "The clerk says a man from the company was in on Friday for the same book, in a good coat, and copied the Tagus pages by hand without asking for help, and that he was not from Procurement because he did not know where Procurement was.",
    surveil: [], contains: ["stanley-land-records-tagus"], searchAccess: { clearance: 1 } },
];

export const PRESSURE_04: PressureTier[] = [
  { episode: 4, tier: 1, rounds: [1, 3], text: "a surveyor is overdue at Tagus; the sheriff takes a missing-person report from his wife in Minot and asks the company, in writing, who Prairie Geological Services answers to", mitigation: { verbs: ["issue_statement"], department: ["corporate-security", "procurement-logistics"] } },
  { episode: 4, tier: 2, rounds: [4, 6], text: "the surveyor's wife is in the Minot paper; Finance asks Procurement for PGS's incorporation papers and does not get them", mitigation: { verbs: ["clear_invoices"], department: ["procurement-logistics"] } },
  { episode: 4, tier: 3, rounds: [7, 9], text: "the Safety Committee's sealing ballot closes; a Dakota Concrete truck is seen on the Tagus road either way", mitigation: null },
  { episode: 4, tier: 4, rounds: [10, 12], text: "a federal contracting officer writes to the Chairman about Verification Site T; the lights in Aerospace are on past midnight", mitigation: null },
  { episode: 4, tier: 5, rounds: [13, 14], text: "the cellar door is poured shut or guarded; the church tower at Tagus hums loud enough to be heard from the road, and the sheriff wants a statement on the surveyor", mitigation: { verbs: ["issue_statement"], department: ["corporate-security"] } },
];
