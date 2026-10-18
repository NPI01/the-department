/* Episode 02 — The Harvest (rounds 15–28; days 1–14 of the episode). A rancher's
   dead steer with a Royce helicopter overhead puts HARVEST's sampling authority
   on trial, and Greeley's death stops looking like an accident. The cattle
   cases are a ledger: HARVEST sampling (authorized or not), ordinary causes, or
   something Royce cannot explain. PROPOSED (2026-10-13): bodies and the case
   ledger are first drafts; the truths follow canon/secret/03, /08 and /10. */
import type { DocumentDef, PlaceDef, PressureTier } from "./types";

export const DOCUMENTS_02: DocumentDef[] = [
  {
    slug: "minot-daily-news-steer", episode: 2, title: "Minot Daily News, 24 October 1977: 'Rancher: Company Helicopter Over Dead Steer'", kind: "document",
    aliases: ["newspaper", "the paper", "minot daily news", "news story", "the clipping about the steer", "press"],
    holder: "personnel-administration", access: {},
    grants: ["press.steer_story_published", "press.helicopter_named"], wrongDetail: { text: "the reporter quotes 'a Royce spokesman' by name, Leonard Fisk, who is not authorized to speak to the press and says he did not", grants: "press.fisk_misquoted_noticed" },
    from: "Minot Daily News", written: "24 October 1977",
    body: "**MINOT DAILY NEWS — Monday, October 24, 1977**\n\n**RANCHER: COMPANY HELICOPTER OVER DEAD STEER**\n\nTAGUS — Gary Vane, 52, says a helicopter with no lights hung over his north pasture for twenty minutes on the night of October 9, and that in the morning a three-year-old steer lay dead beneath where it had been, \"opened like a book, and not a drop on the grass.\" Vane has kept a tissue sample in a jar. \"It hasn't turned,\" he said. \"Two weeks. It should have turned.\"\n\nA Royce Industries spokesman, Leonard Fisk, said the company operates no aircraft after dark. The Ward County Sheriff's Department confirmed it had received a report and declined further comment.",
  },
  {
    slug: "sheriff-case-ledger", episode: 2, title: "Ward County Sheriff: livestock cases, 1975–77 (ledger)", kind: "document",
    aliases: ["case ledger", "cattle cases", "sheriff's ledger", "livestock cases", "the ledger of cases", "mutilation cases", "cattle ledger"],
    holder: "hollis", access: { clearance: 5, via: "hollis" },
    grants: ["cases.ledger_exists", "cases.eleven_since_1975", "cases.one_closed_as_ordnance"],
    wrongDetail: { text: "case 7 (Halvorsen parcel, June 1976) is closed 'ordnance recovered; referred to Minot AFB', but the evidence tag number, E-76-19, is still in the sheriff's own locker index", grants: "cases.ordnance_never_left_locker_noticed" },
    from: "Ward County Sheriff's Department", written: "1975–77",
    body: "**WARD COUNTY SHERIFF — LIVESTOCK CASES — 1975–1977**\n\n| No. | Date | Place | Finding | Status |\n|---|---|---|---|---|\n| 1 | 4/75 | County rd 12 | lightning | closed |\n| 2 | 9/75 | Vane north | drained, cut | open |\n| 3 | 11/75 | Halvorsen | scavengers | closed |\n| 4 | 4/76 | Vane north | drained, cut; tracks | open |\n| 5 | 6/76 | Halvorsen | drained, cut | open |\n| 6 | 6/76 | Halvorsen | — | see 7 |\n| 7 | 6/76 | Halvorsen | metal debris, 3 lb, warm | closed: ordnance; referred Minot AFB; tag E-76-19 |\n| 8 | 9/76 | County rd 12 | drained | open |\n| 9 | 7/77 | Vane north | drained, cut | open |\n| 10 | 9/77 | Vane north | drained, cut, eye | open |\n| 11 | 10/9/77 | Vane north | drained, cut; truck seen | open |",
  },
  {
    slug: "sheriff-evidence-e76-19", episode: 2, title: "Evidence tag E-76-19: metal debris, Halvorsen parcel (sheriff's locker)", kind: "object",
    aliases: ["evidence tag", "the debris", "metal debris", "e-76-19", "ordnance", "the fragment in the locker", "sheriff's evidence"],
    holder: "sheriff-locker", access: { clearance: 5, via: "hollis", sealed: true }, notice: true,
    grants: ["r1.fragment_in_sheriff_locker", "r1.fragment_warm_to_touch"],
    wrongDetail: { text: "the tag says 'referred to Minot AFB 7/76' but the chain-of-custody line has never been signed out; the thing has been in the locker for fifteen months", grants: "r1.fragment_never_referred_noticed" },
    analyses: [
      { department: "advanced-materials", text: "3 lb 2 oz. Dark grey, no seam, no casting or machining marks under magnification. Hardness beyond the bench tester's scale. Density 1.6 times that of steel. The alloy matches nothing in the reference set, and a filing taken for assay would not take an etch. After an hour on the bench in a cold room it read six degrees above the bench, with no source.", grants: ["r1.fragment_anomalous_alloy_confirmed", "r1.fragment_self_heating_confirmed"] },
      { department: "applied-physics", text: "Thermal output steady over twelve hours, not decaying. No radioactivity above background on the Geiger counter or the film badge. A weak, steady magnetic field that does not align with the earth's and does not move when the piece is turned. It is not ordnance; ordnance does not do any of this.", grants: ["r1.fragment_no_radiation_confirmed", "r1.fragment_field_measured"] },
    ],
    from: "Ward County Sheriff's Department", written: "June 1976",
    body: "**EVIDENCE — WARD COUNTY SHERIFF — TAG E-76-19**\n\nItem: metal fragment, 3 lb 2 oz, dark, no seam, no markings. Found 11 June 1976, Halvorsen parcel, 40 ft from carcass (case 5). Warm to the touch at recovery; still warm at logging. Classified ordnance (unexploded) by Sheriff Hollis. Referred to Minot AFB 7/76.\n\nChain of custody: IN — D. Hollis, 11 Jun 76. OUT — ________.",
  },
  {
    slug: "vane-sample-jar", episode: 2, title: "A jar of tissue that will not rot (G. Vane)", kind: "object",
    aliases: ["the jar", "tissue sample", "vane's sample", "the sample", "jar of tissue"],
    holder: "vane", access: { clearance: 5, via: "vane" },
    grants: ["vane.sample_exists", "vane.sample_does_not_decay"], wrongDetail: { text: "Vane's label dates the sample October 10, but the tissue is from the September 29 animal; he has two jars and has shown reporters the wrong one", grants: "vane.two_jars_noticed" },
    analyses: [
      { department: "biological-sciences", text: "Culture at 48 hours: no growth. Cells intact under the microscope, no autolysis, no bacterial action; the brine is tap water and table salt and would preserve nothing. The cut edges are not blade cuts: the tissue is sealed at the margin as if cauterized, down to the cell. The optic nerve is severed in one plane. Whatever took this animal did not use a knife, and the sample has not aged a day.", grants: ["vane.sample_no_decay_confirmed", "vane.cuts_cauterized_confirmed"] },
    ],
    from: "G. Vane", written: "October 1977",
    body: "A mason jar, lid taped. Inside, a cut of hide and something that was an eye. Label in pencil: *V-north, 10 Oct 77, G.V.* No smell. No cloud in the brine. Mr. Vane says it has not changed in two weeks and will not let it out of his sight.",
  },
  {
    slug: "pgs-field-log-sep-77", episode: 2, title: "Prairie Geological Services field unit log, September 1977", kind: "document",
    aliases: ["field log", "pgs field log", "field unit log", "sampling log", "crew log", "pgs log"],
    holder: "procurement-logistics", access: { clearance: 2, department: ["procurement-logistics"], via: "voss" }, notice: true,
    grants: ["pgs.field_unit_ran_night_of_29_sep", "pgs.truck_mp_14_used"],
    wrongDetail: { text: "the 29 September entry lists tissue 'hide, lymph, eye' and a crew of two by initials, but the authorization column is blank where every other entry carries Ely's and Baines's initials", grants: "pgs.29_sep_run_unauthorized_noticed" },
    analyses: [
      { department: "biological-sciences", text: "Hide, lymph and eye is a necropsy set, not an agricultural survey: lymph and ocular tissue must be taken by a veterinarian and chilled within the hour, or they are worthless. The crew of two is listed by initials with no qualification, and no transport is logged. Either a veterinarian went out that night who is not in this log, or the tissue was not taken for study.", grants: ["pgs.crew_not_qualified_for_tissue_noticed"] },
    ],
    from: "Prairie Geological Services", written: "September 1977",
    body: "**PRAIRIE GEOLOGICAL SERVICES — FIELD UNIT LOG — SEPTEMBER 1977**\n\n| Date | Site | Task | Crew | Vehicle | Auth. |\n|---|---|---|---|---|---|\n| 2 Sep | Halvorsen | instrument check | R.K., T.L. | MP-14 | S.E./F.B. |\n| 14 Sep | County rd 12 | soil | T.L. | MP-14 | S.E./F.B. |\n| 29 Sep | V-north | hide, lymph, eye | R.K., T.L. | MP-14 | — |",
  },
  {
    slug: "motor-pool-log-oct-77", episode: 2, title: "Motor pool sign-out log, October 1977", kind: "document",
    aliases: ["motor pool", "motor pool log", "vehicle log", "sign-out log", "truck log", "the trucks"],
    holder: "personnel-administration", access: { clearance: 1 }, logKey: "motor-pool",
    grants: ["motorpool.mp14_out_9_oct_no_name"], wrongDetail: { text: "truck MP-14 is signed out on Sunday 9 October to 'PGS' with no driver's name and returned at 0330 with 61 more miles on the clock than the Tagus round trip", grants: "motorpool.mp14_mileage_noticed" },
    analyses: [
      { department: "procurement-logistics", text: "The fuel chit filed against MP-14 for the night of 9 October is for 11.2 gallons, which at the truck's rated draw is 150 miles, not the 82 of the Tagus round trip; the chit is approved with the initials G.V., the same initials that approve the Prairie Geological payables.", grants: ["motorpool.mp14_fuel_chit_signed_gv_noticed"] },
    ],
    from: "Facilities Management", written: "October 1977",
    body: "**MOTOR POOL — SIGN-OUT — OCTOBER 1977**\n\n| Date | Vehicle | Out | In | Driver | Miles |\n|---|---|---|---|---|---|\n| 7 Oct | MP-03 | 0800 | 1700 | Okafor, M. | 42 |\n| 9 Oct | MP-14 | 2100 | 0330 | PGS | 143 |\n| 11 Oct | MP-14 | 0900 | 1200 | Pike | 18 |",
  },
  {
    slug: "harvest-protocol-1975", episode: 2, title: "Program HARVEST: sampling protocol (1975)", kind: "document",
    aliases: ["harvest protocol", "sampling protocol", "harvest charter", "the protocol", "harvest rules"],
    holder: "ely", access: { clearance: 3, department: ["biological-sciences"], via: "ely" },
    grants: ["harvest.protocol_requires_two_signatures", "harvest.tissue_limited_to_hide_and_blood"],
    wrongDetail: { text: "the protocol limits sampling to hide and blood and forbids ocular tissue; the 1977 lots list lymph and eye", grants: "harvest.eye_tissue_outside_protocol_noticed" },
    analyses: [
      { department: "biological-sciences", text: "Set against the 1977 lots the protocol is not merely exceeded but reversed: it forbids exactly the tissues the lots take. A protocol is rewritten on paper when a program changes its purpose; this one was not rewritten, which means the purpose changed and nobody wanted a signature on it.", grants: ["harvest.purpose_changed_unsigned_noticed"] },
    ],
    from: "Biological Sciences", written: "March 1975",
    body: "**PROGRAM HARVEST — SAMPLING PROTOCOL — March 1975**\n\n1. Purpose: agricultural monitoring of livestock health in Ward and Mountrail Counties under agreement with participating ranchers.\n2. Authority: each lot requires the signatures of the Director, Biological Sciences and the Safety Committee's Aerospace member (for air support).\n3. Tissue: hide and blood only. No ocular, neural or lymphatic tissue.\n4. Animals are to be left as found. Carcasses are the rancher's property.\n\n— S. Ely, Director",
  },
  {
    slug: "greeley-effects-inventory", episode: 2, title: "Inventory of effects: P. Greeley (Personnel)", kind: "document",
    aliases: ["greeley's effects", "effects inventory", "greeley inventory", "greeley's things", "his effects"],
    holder: "armitage", access: { clearance: 2, department: ["personnel-administration"], via: "armitage" },
    grants: ["greeley.effects_include_drawings", "greeley.effects_include_congregation_letters", "greeley.notebook_listed_then_struck"],
    wrongDetail: { text: "line 6, 'notebook, black, 1', is struck through and initialled H.S., with 'released to family' written in; the family's receipt, attached, lists five items and no notebook", grants: "greeley.notebook_withheld_noticed" },
    from: "Personnel & Administration", written: "July 1977",
    body: "**INVENTORY OF EFFECTS — GREELEY, P. — locker 2-14, Building 2**\n\n1. Coat, work, 1\n2. Boots, 1 pr\n3. Drawings, geometric, loose, 23 sheets\n4. Letters, 3, signed 'the Congregation'\n5. Photograph, family, 1\n6. ~~Notebook, black, 1~~ released to family — H.S.\n\nReceipt of family (attached): items 1, 2, 3, 4, 5.",
  },
  {
    slug: "greeley-lab-entry-12-july", episode: 2, title: "Laboratory daybook, Applied Physics, 12 July 1977 (Greeley's entry)", kind: "document",
    aliases: ["lab daybook", "daybook", "greeley's last entry", "lab entry", "12 july entry", "the test that never happened"],
    holder: "kovic", access: { clearance: 3, department: ["applied-physics"], via: "kovic" }, notice: true,
    grants: ["greeley.daybook_describes_a_test", "greeley.test_ran_eleven_minutes"],
    wrongDetail: { text: "the daybook page for 12 July is numbered 212; page 211 is 11 July and page 213 is 14 July, and 213 begins mid-sentence", grants: "greeley.daybook_page_removed_noticed" },
    from: "Applied Physics", written: "12 July 1977",
    body: "**APPLIED PHYSICS — LABORATORY DAYBOOK — p. 212 — 12 July 1977**\n\n2305. Bench 4, alone. Configuration per the drawing. Power at 0.4.\n2311. Reading steady. Hum at the threshold of hearing.\n2316. It answered. Not words. Eleven minutes by the bench clock; the wall clock shows four.\n2330. Shutting down. Will not do this again alone.\n\n*(p. 213, 14 July, begins:)* …and the bench was already cold when I came in, which K. says is impossible.",
  },
  {
    slug: "pma-contract-1976", episode: 2, title: "Prairie Meridian Aviation: services contract (1976)", kind: "document",
    aliases: ["pma contract", "aviation contract", "flight contract", "prairie meridian contract", "the contract", "night flight contract"],
    holder: "baines", access: { clearance: 3, department: ["aerospace-systems"], via: "baines" },
    grants: ["pma.contract_calibration_only", "pma.no_sampling_provision"], wrongDetail: { text: "the schedule of services lists 'calibration runs, Sector 4, as directed by the Director, Aerospace' and nothing else, but the 1977 invoices bill 'field support, Bio' under the same contract number", grants: "pma.bio_billed_under_calibration_noticed" },
    from: "Aerospace Systems", written: "1976",
    body: "**SERVICES CONTRACT — PRAIRIE MERIDIAN AVIATION — ROYCE INDUSTRIES — 1976**\n\nScope: calibration runs, Sector 4, nights as directed by the Director, Aerospace Systems. Aircraft: one rotorcraft, pilot and co-pilot. No passengers, no cargo, no landings off the strip without the Director's signature.\n\nSigned: F. Baines, Director; T. Bradley, Chief Pilot.",
  },
];

export const PLACES_02: PlaceDef[] = [
  { slug: "sheriff-office", town: "minot", offCampus: true, episode: 2, name: "the Sheriff's office, Minot", aliases: ["sheriff's office", "sheriff office", "county sheriff", "the courthouse", "minot courthouse"], visit: "A counter, a deputy, a coffee pot older than the deputy. Behind the counter a steel door with a padlock and a hand-lettered sign: EVIDENCE — SHERIFF ONLY.", ask: "The deputy says the sheriff is out at the Vane place more than he is in, that the livestock file is the sheriff's own and nobody else touches it, and that the company's lawyer has already called twice this week.", surveil: [], contains: [], searchAccess: { clearance: 5 } },
  { slug: "sheriff-locker", town: "minot", offCampus: true, episode: 2, name: "the evidence locker, Sheriff's office", aliases: ["evidence locker", "the locker in minot", "sheriff's locker", "evidence room"], restricted: true, visit: "A padlocked steel door behind the deputy's counter. You are not getting past the deputy in daylight.", surveil: [{ episode: 2, rounds: [1, 14], text: "at 2340 the sheriff let himself in alone, stayed eleven minutes, and came out carrying nothing; the light in there is the only one in the building he leaves on", grants: "sheriff.visits_locker_at_night_seen", restricted: true }], contains: ["sheriff-evidence-e76-19"], searchAccess: { clearance: 5 } },
  { slug: "vane-barn", town: "tagus", offCampus: true, episode: 2, name: "the Vane barn", aliases: ["vane barn", "vane's barn", "the barn", "vane's place", "vane house"], visit: "A barn, a shotgun by the door, a mason jar on a shelf above the workbench with the lid taped down. Mr. Vane watches you look at it.", ask: "Vane says the helicopter came three nights running before the steer; that the company truck had a man in it who would not get out; that the sheriff is a good man who is afraid of the company; and that he will show the jar to anyone, and give it to nobody.", surveil: [{ episode: 2, rounds: [1, 6], text: "a helicopter without lights held over the north pasture for twenty minutes at 0130; the cattle stood at the far fence and did not low", grants: "vane.helicopter_over_pasture_seen" }, { episode: 2, rounds: [7, 14], text: "a car with Minot plates parked at the gate at 0200 and left when the yard light came on", grants: "vane.night_visitor_seen" }] },
  { slug: "halvorsen-parcel", town: "tagus", offCampus: true, episode: 2, name: "the Halvorsen parcel", aliases: ["halvorsen parcel", "halvorsen", "the parcel", "pgs site", "the concrete pad", "monitoring site"], restricted: true, visit: "A quarter-section of prairie with a concrete pad, a fenced instrument hut, a cable trench, and no building anywhere. PRAIRIE GEOLOGICAL SERVICES — AGRICULTURAL MONITORING — NO TRESPASS.", ask: "Nobody is there to ask. A rancher on the road says the surveyors come at night and leave by morning, and that the hut hums when the wind is down.", surveil: [{ episode: 2, rounds: [1, 14], text: "two men in PGS jackets came at 2300 in truck MP-14, opened the instrument hut, and lowered a case into the ground through a hatch inside it; they left at 0140", grants: "pgs.night_crew_at_hut_seen", restricted: true }], contains: [], searchAccess: { clearance: 4, department: ["corporate-security"] } },
  { slug: "pgs-yard", town: "tagus", offCampus: true, episode: 2, name: "the PGS yard, Tagus road", aliases: ["pgs yard", "prairie geological yard", "the yard", "pgs office"], restricted: true, visit: "A Quonset hut, two trucks, a fuel tank. A sign that has been repainted over an older sign. Nobody answers the door in daylight.", surveil: [{ episode: 2, rounds: [1, 14], text: "truck MP-14 left at 2240 with two men and came back at 0300; a hose was run from the truck bed to a drain for ten minutes", grants: "pgs.truck_washed_at_night_seen", restricted: true }], contains: ["pgs-field-log-sep-77", "brandvold-field-book"], searchAccess: { clearance: 4, department: ["corporate-security", "procurement-logistics"] } },
  { slug: "minot-daily-news", town: "minot", offCampus: true, episode: 2, name: "the Minot Daily News office", aliases: ["minot daily news office", "the newspaper office", "the paper's office", "the reporter", "newsroom"], visit: "A storefront on Main, a teletype, a reporter named Haugen who covered the steer and wants to know who you are.", ask: "Haugen says the quote from 'Leonard Fisk' came by telephone from a man who gave that name, that the sheriff's deputy told him off the record there have been eleven cases, and that he has a photograph of the steer he did not print.", surveil: [] },
];

export const PRESSURE_02: PressureTier[] = [
  { episode: 2, tier: 1, rounds: [1, 3], text: "the Minot paper runs the steer story and names the company", mitigation: { verbs: ["issue_statement"], department: ["corporate-security", "personnel-administration"] } },
  { episode: 2, tier: 2, rounds: [4, 6], text: "the sheriff asks the company, in writing, who signed out truck MP-14", mitigation: { verbs: ["submit_manifest"] } },
  { episode: 2, tier: 3, rounds: [7, 9], text: "Vane Cattle Co. stops its hay deliveries; two other ranchers follow", mitigation: { verbs: ["clear_invoices"], department: ["procurement-logistics"] } },
  { episode: 2, tier: 4, rounds: [10, 12], text: "the state veterinarian writes to the sheriff asking to see the carcass; the Research Committee ballot is scheduled", mitigation: null },
  { episode: 2, tier: 5, rounds: [13, 14], text: "a television crew from Bismarck is seen at the Vane gate", mitigation: null },
];
