# Simulated season sim-ep2

Campaign 12a7b808-f551-4995-aed8-4de2c75ac7a5. 6 synthetic players: Ruth Lindqvist (analyst), Dale Harker (operative), Marjorie Pell (negotiator), Tom Brekke (administrator), Carla Osei (analyst), Walt Sorensen (negotiator). Started 2026-10-17T18:49:49.517Z.

## Findings, compared with sim-ep1 (read 2026-10-17)

| measure | sim-ep1 | sim-ep2 |
|---|---|---|
| orders refunded by the clerk | 85 of 225 (38%) | 71 of 260 (27%) |
| EXAMINE refused | 40 of 101 | 13 of 126 |
| REQUEST_FILES refused | 25 of 29 | 28 of 37 |
| letters between players delivered | 4 | 25 |
| goals met | 2, both partial | 2, both full |
| AU at the end | all 60 | all 60 |
| engine model-minutes per player-day | 2.4 | 2.0 |
| engine prompt tokens per player-day | ~21k | ~17k |

The fixes held: every menu price matched the rulebook; 51 of 84 dispatches carried a Returned-by-the-clerk section; extraction calls per round fell by about 40%; the colleague ruling sent players to write to each other (letters between players rose sixfold).

New or still open:
1. **Players want to meet colleagues in person.** 9 of 13 refused interviews named a colleague; Sorensen tried Osei five times. The rulebook's MEET <person> (in person, off the record, unquotable) would answer this.
2. **Records still holds too little** (28 of 37 refused). Design call.
3. **The economy still never binds** (all at 60). Design call.
4. **One player won both employee seats** (Osei took E-77-001 and E-77-002). The rules mean one seat per person.
5. **A note to the clerk on the line after an order is swallowed into it.** The first standing order ever filed reads "surveil the Tagus road Note to the clerk: …", and a request carried a note into its text. orderContinuation should stop at "Note".
6. **LEAK and ATTEND miss things players hold or expect**: LEAK of a held clipping found nothing (LEAK matches the index only); ATTEND of a committee vote or a meeting is refused because committee sessions are not on the calendar.
7. Mechanics still barely used: one standing order (ran eight nights), one trip-wire fired, one PROTECT, no agreements, declarations or proxies.

## Round 1

### Ruth Lindqvist (analyst) · 20 AU · orders
Reply:
```
D
B
IF Julian Thorne requests my Case File THEN PROTECT my desk
```
Letters written: 1
- **submit_manifest** Non-Disclosure and Non-Compete Agreement → resolved (mitigated): Ruth Lindqvist's paperwork (submit manifest) went through. The matter of "Security flags vehicle entries that were never logged" is, for now, handled.
- **request_files** Building 7 architectural drawings → resolved (document): Records delivered a copy of "Facilities maintenance ledger, Building 7 (1977)". It is in the Case File.
### Dale Harker (operative) · 30 AU · orders
Reply:
```
C
VOTE E-77-001: Harker
VOTE E-77-002: Harker
```
Letters written: 0
- **visit** Security Operations Center → resolved (ruling): The clerk could not place "Security Operations Center". Units returned. Name a building, a gate, a road, or a property.
### Marjorie Pell (negotiator) · 26 AU · orders
Reply:
```
B
VOTE E-77-001: Pell
VOTE E-77-002: Pell
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
### Tom Brekke (administrator) · 27 AU · orders
Reply:
```
B
ORDER: REQUEST_FILES loading dock manifest, September 28, 1977
VOTE E-77-001: Osei
VOTE E-77-002: Lindqvist

Note: The unlogged vehicle entries at the loading dock are noted. I am proceeding through standard channels.
```
Letters written: 1
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **request_files** loading dock manifest, September 28, 1977 → resolved (ruling): The clerk could not match "loading dock manifest, September 28, 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 27 AU · orders
Reply:
```
A
VOTE E-77-001: Osei
VOTE E-77-002: Osei
```
Letters written: 1
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 21 AU · orders
Reply:
```
A
B
VOTE E-77-001: Sorensen
VOTE E-77-002: Sorensen
ORDER: EXAMINE sayer-clipping
ORDER: EXAMINE campus-map
```
Letters written: 0
- **examine** Newspaper clipping with a symbol circled in red → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **examine** campus-map → skipped: beyond your balance at the lock

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 2 (0 guarded).

## Round 2

### Ruth Lindqvist (analyst) · 37 AU · orders
Reply:
```
A
C
VOTE E-77-001: Lindqvist
VOTE E-77-002: Lindqvist
FORM 14-B
```
Letters written: 1
- **request_files** Security vehicle entry logs for the last 48 hours → resolved (ruling): The clerk could not match "Security vehicle entry logs for the last 48 hours" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Facilities maintenance ledger, Building 7 (1977) → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
### Dale Harker (operative) · 47 AU · orders
Reply:
```
A
C
D
VOTE E-77-001: Harker
VOTE E-77-002: Harker
```
Letters written: 2
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **visit** Gate 4 security booth → resolved (ruling): The clerk could not place "Gate 4 security booth". Units returned. Name a building, a gate, a road, or a property.
- **request_files** Vehicle entry logs from Gate 4 → resolved (ruling): The clerk could not match "Vehicle entry logs from Gate 4" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Marjorie Pell (negotiator) · 42 AU · orders
Reply:
```
B
C
VOTE E-77-001: Pell
VOTE E-77-002: Pell
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **request_files** Security Department → resolved (ruling): The clerk could not match "Security Department" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Tom Brekke (administrator) · 41 AU · orders
Reply:
```
A
B
ORDER: EXAMINE confidentiality-clause
```
Letters written: 1
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **request_files** security incident logs, north gate, October 10 → resolved (ruling): The clerk could not match "security incident logs, north gate, October 10" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** confidentiality-clause → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
### Carla Osei (analyst) · 30 AU · orders
Reply:
```
A
D
ORDER: EXAMINE Ely-HARVEST-letter
ORDER: RESEARCH the HARVEST project and Dr. Marsh's sampling authority
```
Letters written: 0
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **examine** Ely-HARVEST-letter → resolved (ruling): Carla Osei does not hold "HARVEST sampling authorizations, 1976". Units returned; request it first, or EXAMINE something in the Case File.
- **research** the HARVEST project and Dr. Marsh's sampling authority → resolved (research): The company library took Carla Osei's request on "the HARVEST project and Dr. Marsh's sampling authority"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Walt Sorensen (negotiator) · 35 AU · orders
Reply:
```
A
C
ORDER: EXAMINE sayer-clipping
```
Letters written: 2
- **request_files** Vehicle entry logs for North Gate, October 10-11 → resolved (ruling): The clerk could not match "Vehicle entry logs for North Gate, October 10-11" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (1 guarded).

## Round 3

### Ruth Lindqvist (analyst) · 51 AU · orders
Reply:
```
A
B
ORDER: EXAMINE facilities-ledger-b7
```
Letters written: 1
- **request_files** Security vehicle entry logs, Station R, last 48 hours, from Security Office → resolved (ruling): The clerk could not match "Security vehicle entry logs, Station R, last 48 hours, from Security Office" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** facilities-ledger-b7 → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
B
ORDER: REQUEST_FILES Gate 4 vehicle entry log, October 1977, from Security Office
IF Fisk requests Form 14-B THEN HOLD
Note to clerk: Clarifying Gate 4 log source to Security Office after previous attempts failed.
```
Letters written: 2
- **interview** Leonard Fisk, Security Analyst → resolved (conversation): Dale Harker sat down with Leonard Fisk. What was said arrives in Leonard Fisk's own words this morning, if they chose to put any of it in writing.
- **request_files** Gate 4 vehicle entry log, October 1977, from Security Office → resolved (ruling): The clerk could not match "Gate 4 vehicle entry log, October 1977, from Security Office" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Marjorie Pell (negotiator) · 45 AU · orders
Reply:
```
A
B
ORDER: RESEARCH the three names on the altered personnel files in the Tagus municipal directory
IF anyone requests the altered personnel records THEN ORDER: PROTECT my desk
VOTE E-77-001: Marjorie Pell
VOTE E-77-002: Marjorie Pell
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **research** the three names on the altered personnel files in the Tagus municipal directory → resolved (research): The company library took Marjorie Pell's request on "the three names on the altered personnel files in the Tagus municipal directory"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the
### Tom Brekke (administrator) · 48 AU · orders
Reply:
```
A
C
ORDER: EXAMINE campus-map
VOTE E-77-001: Osei
VOTE E-77-002: Lindqvist
```
Letters written: 1
- **request_files** audit trail templates for Q3 inventory → resolved (document): Records delivered a copy of "Campus plat, Station R (Facilities issue)". It is in the Case File.
- **interview** Gerald Voss, Senior Logistics Officer → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (Facilities issue)": the Facilities plat shows Building 7 as RESTRICTED and no Building 9; the Procurement copy shows an unlabelled square where Building 9 would be.
### Carla Osei (analyst) · 33 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the research brief on the HARVEST project
D
```
Letters written: 2
- **examine** Research Brief: the HARVEST project and Dr. Marsh's sampling authority → resolved (examined): A close reading of "Research Brief: the HARVEST project and Dr. Marsh's sampling authority" found nothing beyond what it says.
- **request_files** HARVEST sampling authorizations, 1976 → resolved (document): Records delivered a copy of "HARVEST sampling authorizations, 1976". It is in the Case File.
- **examine** the research brief on the HARVEST project → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **visit** Dr. Sarah Ely's office → resolved (visit): Carla Osei went to Dr. Sarah Ely’s office. A single desk sits beneath a north-facing window, holding a stack of unopened memos and a brass ashtray with two unsmoked cigarettes. The chair is leather, worn smooth on the armrests, and a potted
### Walt Sorensen (negotiator) · 39 AU · orders
Reply:
```
C
ORDER: RESEARCH the 1921 Halvorsen property and the 1974 shell company transfer
VOTE E-77-001: Sorensen
VOTE E-77-002: Sorensen
```
Letters written: 2
- **request_files** Flight 77-ON instrument logs, Aerospace Systems → resolved (document): Records delivered a copy of "Flight test log 77-ON (Prairie Meridian)". It is in the Case File.
- **research** the 1921 Halvorsen property and the 1974 shell company transfer → resolved (research): The company library took Walt Sorensen's request on "the 1921 Halvorsen property and the 1974 shell company transfer"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by mo

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 4 (0 guarded).

## Round 4

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE facilities-ledger-b7
```
Letters written: 0
- **request_files** Vehicle entry logs, Station R, Security Office, Oct 11-13 → resolved (ruling): The clerk could not match "Vehicle entry logs, Station R, Security Office, Oct 11-13" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **examine** facilities-ledger-b7 → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
ORDER: REQUEST_FILES Gate 4 vehicle entry log, October 1977, from Security Office
TO: Leonard Fisk, Carla Osei
```
Letters written: 2
- **examine** The Royce Report, No. 1 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **request_files** Gate 4 vehicle entry log, October 1977, from Security Office → resolved (ruling): The clerk could not match "Gate 4 vehicle entry log, October 1977, from Security Office" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Marjorie Pell (negotiator) · 58 AU · orders
Reply:
```
A
C
B
```
Letters written: 2
- **examine** Research Brief: The Three Names on the Altered Personnel Files in the Tagus Muni → resolved (examined): A close reading of "Research Brief: The Three Names on the Altered Personnel Files in the Tagus Municipal Directory" found nothing beyond what it says.
- **request_files** Tagus Municipal Directory (1974-1977) → resolved (ruling): The clerk could not match "Tagus Municipal Directory (1974-1977)" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **interview** Elmer Bernard → resolved (conversation): Marjorie Pell sat down with Elmer Bernard. What was said arrives in Elmer Bernard's own words this morning, if they chose to put any of it in writing.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
C
VOTE E-77-001: Osei
VOTE E-77-002: Lindqvist
Note to clerk: Item 8842 is on the invoice but not the physical count. Voss is aware of the discrepancy and the wet floor. I am proceeding with the requested verification through Records.
```
Letters written: 1
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (Facilities issue)": the Facilities plat shows Building 7 as RESTRICTED and no Building 9; the Procurement copy shows an unlabelled square where Building 9 would be.
- **interview** Gerald Voss → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
- **request_files** Item 8842 title verification records → resolved (ruling): The clerk could not match "Item 8842 title verification records" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 41 AU · orders
Reply:
```
A
C
ORDER: EXAMINE harvest-auth-1976
TO: Maya Okafor

Maya,

Thanks for the straight answer on the permits. I understand the chain of command restriction; I won't press that. I’d like to take you up on the inventory help. I can be at the supply closet this afternoon after lunch. I’m curious what’s in the boxes anyway, and I have a few minutes to spare.

Also, I noticed the Royce Report mentions night flights shifting to 0200. Does Procurement handle the logistics for those? I’m just trying to get a handle on the new schedule for my field work. 

See you at the closet.

Carla
```
Letters written: 0
- **examine** The Royce Report, No. 1 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **request_files** 1977 HARVEST sampling continuation sheet → resolved (document): Records delivered a copy of "HARVEST sampling authorizations, 1976". It is in the Case File.
- **examine** harvest-auth-1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
### Walt Sorensen (negotiator) · 50 AU · orders
Reply:
```
B
ORDER: EXAMINE research-the-1921-halvorsen-property-and-the-
ORDER: EXAMINE sayer-clipping
```
Letters written: 2
- **examine** Flight test log 77-ON (Prairie Meridian) → resolved (examined): A close reading of "Flight test log 77-ON (Prairie Meridian)": the log records a forced landing at Minot AFB that the base's own log, quoted on the facing page, does not show.
- **examine** research-the-1921-halvorsen-property-and-the- → resolved (examined): A close reading of "Research Brief: The 1921 Halvorsen Property and the 1974 Shell Company Transfer" found nothing beyond what it says.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, newsletter.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 5

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
B
A
VOTE E-77-001: Okafor
VOTE E-77-002: Osei
```
Letters written: 0
- **interview** Security Office clerk → resolved (ruling): The clerk could not tell who "Security Office clerk" names. Units returned. Use a surname from the directory, or name a place to ask around.
- **request_files** Security Office vehicle log index → resolved (ruling): The clerk could not match "Security Office vehicle log index" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE the campus plat, Station R, focusing on the south-east corner and the missing Building 7
```
Letters written: 0
- **interview** Leonard Fisk → resolved (conversation): Dale Harker sat down with Leonard Fisk. What was said arrives in Leonard Fisk's own words this morning, if they chose to put any of it in writing.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** the campus plat, Station R, focusing on the south-east corner and the missing Bu → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: RESEARCH the 1921 Halvorsen land transfer records in Minot
ORDER: EXAMINE royce-report-r4
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **request_files** Elmer Bernard's meeting notes → resolved (ruling): The clerk could not match "Elmer Bernard's meeting notes" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **research** the 1921 Halvorsen land transfer records in Minot → resolved (research): The company library took Marjorie Pell's request on "the 1921 Halvorsen land transfer records in Minot"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **examine** royce-report-r4 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 55 AU · orders
Reply:
```
A
C
VOTE E-77-001: Osei
VOTE E-77-002: Lindqvist
ORDER: EXAMINE royce-report-r4
ORDER: EXAMINE campus-plat-a
ORDER: EXAMINE campus-map
ORDER: EXAMINE confidentiality-clause
ORDER: REQUEST_FILES 1974 PGS invoice archive binder
ORDER: REQUEST_FILES Q3 reconciliation list
ORDER: FORM 14-B
```
Letters written: 1
- **examine** The Royce Report, No. 1 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **interview** Gerald Voss → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
- **examine** royce-report-r4 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **examine** campus-plat-a → resolved (examined): A close reading of "Campus plat, Station R (Facilities issue)": the Facilities plat shows Building 7 as RESTRICTED and no Building 9; the Procurement copy shows an unlabelled square where Building 9 would be.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (Facilities issue)": the Facilities plat shows Building 7 as RESTRICTED and no Building 9; the Procurement copy shows an unlabelled square where Building 9 would be.
- **examine** confidentiality-clause → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **request_files** 1974 PGS invoice archive binder → resolved (document): Records delivered a copy of "Prairie Geological Services invoices, 1974 (originals)". It is in the Case File.
- **request_files** Q3 reconciliation list → resolved (ruling): The clerk could not match "Q3 reconciliation list" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 58 AU · orders
Reply:
```
A
C
ORDER: EXAMINE the 1976 authorization sheet
ORDER: ANALYZE the jar
```
Letters written: 2
- **examine** HARVEST sampling authorizations, 1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **interview** Dale Harker → resolved (ruling): Dale Harker is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Dale Harker".
- **examine** the 1976 authorization sheet → resolved (ruling): Nothing in the Case File matches "the 1976 authorization sheet". Units returned.
- **analyze** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
C
B
ORDER: EXAMINE sayer-clipping

Note to clerk: I'm meeting Sayer in the break room as per option B. I'll look at the clipping while waiting.
```
Letters written: 2
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **interview** Martin Sayer → resolved (conversation): Walt Sorensen sat down with Martin Sayer. What was said arrives in Martin Sayer's own words this morning, if they chose to put any of it in writing.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.

Engine: absence.ticked×1, standing.queued×1, room.triage×1, world.grown×1, agreements.enforced×1, contacts.reported×1, informants.reported×1, room.moves×1, research.briefed×1
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- room.triage: {"decided":0}
- world.grown: {"done":0,"held":0,"failed":0}
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- informants.reported: {"notes":0,"lapsed":0}
- room.moves: {"proposed":2,"committed":1}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Round 6

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
VOTE E-77-001: Sorensen
VOTE E-77-002: Osei
C
ORDER: EXAMINE facilities-ledger-b7
ORDER: EXAMINE royce-report-r4
```
Letters written: 0
- **examine** The Royce Report, No. 1 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **examine** facilities-ledger-b7 → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
- **examine** royce-report-r4 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: REQUISITION a camera
ORDER: SURVEIL the south-east lot, Building 7 site, from the perimeter road after 2300 hours
VOTE E-77-001: Okafor
VOTE E-77-002: Okafor
```
Letters written: 2
- **interview** Carla Osei → resolved (ruling): Carla Osei is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Carla Osei".
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **requisition** a camera → resolved (requisitioned): Procurement stores signed a 35mm camera (procurement stock) out to Dale Harker. It is on the personnel file under Holdings, and in the requisitions log.
- **surveil** the south-east lot, Building 7 site, from the perimeter road after 2300 hours → resolved (sighting): A night watching the perimeter road: nothing but the patrol truck and, at 0300, a man walking the fence from outside with a lantern. The camera has it; the print is in the Case File.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE research-the-three-names-on-the-altered-perso
VOTE E-77-001: Pell
VOTE E-77-002: Pell
Note to clerk: The Request Files for Bernard's notes was returned; I will try to obtain them directly from him or through Okafor next round.
```
Letters written: 2
- **examine** Research Brief: The 1921 Halvorsen Land Transfer Records in Minot → resolved (examined): A close reading of "Research Brief: The 1921 Halvorsen Land Transfer Records in Minot" found nothing beyond what it says.
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** research-the-three-names-on-the-altered-perso → resolved (examined): A close reading of "Research Brief: The Three Names on the Altered Personnel Files in the Tagus Municipal Directory" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
ORDER: PROTECT my desk
VOTE E-77-001: Osei
VOTE E-77-002: Lindqvist
```
Letters written: 1
- **examine** Prairie Geological Services invoices, 1974 (originals) → resolved (examined): A close reading of "Prairie Geological Services invoices, 1974 (originals)": Dakota Concrete of Minot billed eleven loads to the Halvorsen parcel near Tagus, where no building has ever stood.
- **protect** my desk → resolved (protected): Tom Brekke spent the night guarding everything on their desk and procurement logistics's files. Anyone who tried the drawer will have found it watched.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
D
ORDER: EXAMINE harvest-auth-1976
ORDER: ANALYZE harvest-auth-1976
```
Letters written: 1
- **examine** HARVEST sampling authorizations, 1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **examine** harvest-auth-1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **analyze** harvest-auth-1976 → resolved (ruling): There is nothing a laboratory could add to "HARVEST sampling authorizations, 1976"; the page is what it is. Units returned. EXAMINE it instead.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
B
VOTE E-77-001: Okafor
VOTE E-77-002: Okafor
IF anyone requests the motor pool log THEN ORDER: PROTECT my desk
```
Letters written: 1
- **interview** Elmer Bernard → resolved (conversation): Walt Sorensen sat down with Elmer Bernard. What was said arrives in Elmer Bernard's own words this morning, if they chose to put any of it in writing.
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.

Engine: agreements.enforced×1, election.closed×2, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- election.closed: {"cast":6,"title":"Employee seat, Research Committee","votes":{"3aefafa2-20f5-4931-b006-65d1f0a037bc":2,"b48ece48-e82d-4a4d-b02b-615f5086d454":2,"ba567795-e52f-4fb5-a265-3c5415ba9345":1,"dc48151b-501f
- election.closed: {"cast":6,"title":"Employee seat, Safety Committee","votes":{"31f045d1-26f0-414b-91a5-8690161981d9":1,"3aefafa2-20f5-4931-b006-65d1f0a037bc":2,"b48ece48-e82d-4a4d-b02b-615f5086d454":1,"ba567795-e52f-4
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 4 (0 guarded).

## Round 7

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE the scuff mark on my workstation
IF B-77-001 fails THEN ORDER: LEAK minot-daily-news-r7
```
Letters written: 0
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **examine** the scuff mark on my workstation → resolved (ruling): Nothing in the Case File matches "the scuff mark on my workstation". Units returned.
- [IF] **leak** minot-daily-news-r7 → resolved (ruling): Because B-77-001 fails: Nothing in the Case File matches "minot-daily-news-r7". Units returned. Name the document you mean to leak.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
C
ORDER: EXAMINE the perimeter patrol schedule for the North Gate sector FROM Fisk
```
Letters written: 1
- **examine** Photograph: the perimeter road, night of Saturday, October 15, 1977 → resolved (examined): A close reading of "Photograph: the perimeter road, night of Saturday, October 15, 1977" found nothing beyond what it says.
- **request_files** Case File: 0300 Log and Camera Negatives → resolved (ruling): The clerk could not match "Case File: 0300 Log and Camera Negatives" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **visit** Building 7 site, south-east lot → resolved (visit): Dale Harker went to Building 7. A low concrete building in the south-east corner, no sign, one door, a card reader of a type the other buildings do not have. A smell of wet stone.
- **examine** the perimeter patrol schedule for the North Gate sector FROM Fisk → resolved (ruling): Nothing in the Case File matches "the perimeter patrol schedule for the North Gate sector FROM Fisk". Units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE research-the-three-names-on-the-altered-perso
IF B-77-001 passes THEN ORDER: LOBBY Osei

Clerk: B-77-001 closes tonight. I am not on the Board, so I am focusing on the records room and the news. Osei is the new employee rep; I will talk to her if the vote goes her way, but for now I need to see those file tags. Okafor is my friend now, and she has the motor pool logs. Armitage is playing me, but I am keeping the coffee meeting.
```
Letters written: 2
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **visit** Personnel Records Room → resolved (visit): Marjorie Pell went to the Records room. Rows of grey cabinets, a clerk, a requisition pad. Some drawers have two labels, one over the other.
- **examine** research-the-three-names-on-the-altered-perso → resolved (examined): A close reading of "Research Brief: The Three Names on the Altered Personnel Files in the Tagus Municipal Directory" found nothing beyond what it says.
- [IF] **lobby** Osei → skipped (ruling): Held against "B-77-001 passes", which did not come about (B-77-001 failed). Nothing was done; units returned.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
HOLD
IF anyone requests the motor pool log THEN ORDER: report to Voss
```
Letters written: 1
- **interview** Gerald Voss → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
C
A
ORDER: EXAMINE harvest-auth-1976
ORDER: EXAMINE royce-report-r4
IF Dr. Sarah Ely requests the temperature logs THEN ORDER: LEAK harvest-auth-1976
NOTE: Holding my seat on the Board to watch the B-77-001 close.
```
Letters written: 2
- **interview** Dale Harker → resolved (ruling): Dale Harker is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Dale Harker".
- **visit** The Board of Directors meeting hall → resolved (ruling): The clerk could not place "The Board of Directors meeting hall". Units returned. Name a building, a gate, a road, or a property.
- **examine** harvest-auth-1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **examine** royce-report-r4 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
B
D
VOTE B-77-001: ABSTAIN
STANDING ORDER: surveil the Tagus road
Note to the clerk: The B9 note is the key. I am tracking the 'second pour' reference.
```
Letters written: 2
- **interview** Carla Osei → resolved (ruling): Carla Osei is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Carla Osei".
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **attend** Board vote on B-77-001 → resolved (ruling): Nothing on the company calendar, and no invitation you hold, matched "Board vote on B-77-001". Units returned.
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (nothing): A night on the Building 9 site: cold, quiet, nothing that would go in a report. A patrol truck slowed as it passed.

Engine: agreements.enforced×1, motion.closed×1, world.grown×1, room.moves×1, bulletin.published×1, contacts.reported×1, condition.fired×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- motion.closed: {"for":3,"seats":7,"title":"Departmental Reporting Reform","number":"B-77-001","passed":false,"quorum":true,"abstain":1,"against":3,"finding":null,"motion_id":"27e83eee-cd18-4d54-a833-90c0de009cf0"}
- world.grown: {"done":1,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 2 (0 guarded).

## Round 8

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE minot-daily-news-r7
ORDER: REQUEST_FILES Royce Report, No. 1, October 13, 1977
Note: The 'scuff mark' was likely a magnetic interaction from the perimeter drift. I am verifying the newspaper's content regarding the employee representatives.
```
Letters written: 1
- **request_files** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (ruling): The clerk could not match "The Royce Report, No. 1, Thursday, October 13, 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **request_files** Royce Report, No. 1, October 13, 1977 Note: The 'scuff mark' was likely a magnet → resolved (ruling): The clerk could not match "Royce Report, No. 1, October 13, 1977 Note: The 'scuff mark' was likely a magnetic interaction from the perimeter drift. I am verifying the newspaper's content regarding the employee representatives." to any file 
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
C
ORDER: EXAMINE the North Gate patrol schedule copy in my Case File
NOTE: Fisk is stonewalling. Osei is the only one moving the needle on the 1976 auths.
```
Letters written: 2
- **request_files** Case File: 0300 Log and Camera Negatives from Leonard Fisk → resolved (ruling): The clerk could not match "Case File: 0300 Log and Camera Negatives from Leonard Fisk" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **interview** Carla Osei → resolved (ruling): Carla Osei is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Carla Osei".
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **examine** the North Gate patrol schedule copy in my Case File NOTE: Fisk is stonewalling.  → resolved (ruling): Nothing in the Case File matches "the North Gate patrol schedule copy in my Case File NOTE: Fisk is stonewalling. Osei is the only one moving the needle on the 1976 auths.". Units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
C
TO: Maya Okafor
TO: Ruth Lindqvist
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **visit** The Boardroom → resolved (ruling): The clerk could not place "The Boardroom". Units returned. Name a building, a gate, a road, or a property.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
H
```
Letters written: 0
- **examine** Prairie Geological Services invoices, 1974 (originals) → resolved (examined): A close reading of "Prairie Geological Services invoices, 1974 (originals)": Dakota Concrete of Minot billed eleven loads to the Halvorsen parcel near Tagus, where no building has ever stood.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE harvest-auth-1976
ORDER: EXAMINE minot-daily-news-r7
```
Letters written: 2
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **examine** HARVEST sampling authorizations, 1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **examine** harvest-auth-1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
B
ORDER: RESEARCH water rights disputes in Ward County, 1976
Note: The B9 note is the key. I am tracking the 'second pour' reference per Sayer's advice.
```
Letters written: 2
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **research** water rights disputes in Ward County, 1976 Note: The B9 note is the key. I am tr → resolved (research): The company library took Walt Sorensen's request on "water rights disputes in Ward County, 1976 Note: The B9 note is the key. I am tracking the 'second pour' reference per Sayer's advice"; the librarian pulls the county records and the news
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (sighting): A night watching the Building 9 site: a truck came to the pad at 0300 and men unloaded something long under a tarp into the ground, through a hatch you had not seen in daylight.

Engine: absence.ticked×1, world.grown×1, standing.queued×1, room.triage×1, agreements.enforced×1, contacts.reported×1, pressure.tier_reached×1, informants.reported×1, room.moves×1, research.briefed×1
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- world.grown: {"done":0,"held":0,"failed":0}
- standing.queued: {"queued":1,"suspended":0}
- room.triage: {"decided":0}
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- informants.reported: {"notes":0,"lapsed":0}
- room.moves: {"proposed":2,"committed":1}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 9

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: REQUEST_FILES system access logs, Building 4, October 15-16, 1977
```
Letters written: 1
- **visit** the Safety Committee breakroom → resolved (visit): Ruth Lindqvist went to the Building 3 breakroom. A percolator, a table with one short leg, a bulletin board of ride-shares and a notice about the October blood drive. The coffee tastes faintly of copper.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **request_files** system access logs, Building 4, October 15-16, 1977 → resolved (ruling): The clerk could not match "system access logs, Building 4, October 15-16, 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
HOLD EXCEPT Osei, Okafor
```
Letters written: 1
- **request_files** the original map coordinates from the Engineering office → resolved (ruling): The clerk could not match "the original map coordinates from the Engineering office" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** the Photograph: the perimeter road, night of Saturday, October 15, 1977 → resolved (examined): A close reading of "Photograph: the perimeter road, night of Saturday, October 15, 1977" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
C
B
ORDER: EXAMINE campus-map
ORDER: EXAMINE research-the-1921-halvorsen-land-transfer-rec
Note: The Boardroom is likely in Building 1. Will verify coordinates via C and clarify location for future visits.
```
Letters written: 1
- **request_files** The 1921 Halvorsen Land Transfer Records in Minot → resolved (ruling): The clerk could not match "The 1921 Halvorsen Land Transfer Records in Minot" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** research-the-1921-halvorsen-land-transfer-rec Note: The Boardroom is likely in B → resolved (examined): A close reading of "Research Brief: The 1921 Halvorsen Land Transfer Records in Minot" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
```
Letters written: 0
- **examine** Campus plat, Station R (Facilities issue) → resolved (examined): A close reading of "Campus plat, Station R (Facilities issue)": the Facilities plat shows Building 7 as RESTRICTED and no Building 9; the Procurement copy shows an unlabelled square where Building 9 would be.
- **interview** Dr. Aris Thorne → resolved (conversation): Tom Brekke sat down with Julian Thorne. What was said arrives in Julian Thorne's own words this morning, if they chose to put any of it in writing.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE harvest-auth-1976
ORDER: EXAMINE campus-map
```
Letters written: 2
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** harvest-auth-1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE sayer-letter-with-royce-layout
Note to the clerk: The B9 note is the key. I am tracking the 'second pour' reference. Baines is watching the NIGHTJAR tail, so I will not request the logs.
```
Letters written: 2
- **interview** Col. (Ret.) Frank Baines → resolved (conversation): Walt Sorensen sat down with Col. (Ret.) Frank Baines. What was said arrives in Col. (Ret.) Frank Baines's own words this morning, if they chose to put any of it in writing.
- **visit** Building 9 pad → resolved (visit): Walt Sorensen went to the Building 9 site. Where the Procurement map puts a square there is a graded pad, a fenced vent, and fresh concrete that nobody poured in daylight.
- **examine** sayer-letter-with-royce-layout Note to the clerk: The B9 note is the key. I am t → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (sighting): A night watching the Building 9 site: a truck came to the pad at 0300 and men unloaded something long under a tarp into the ground, through a hatch you had not seen in daylight.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Round 10

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE Dr. Thorne's letter
```
Letters written: 1
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **request_files** Building 4 maintenance logs, October 15-16 → resolved (ruling): The clerk could not match "Building 4 maintenance logs, October 15-16" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Dr. Thorne's letter → resolved (ruling): Nothing in the Case File matches "Dr. Thorne's letter". Units returned.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
C
ORDER: RESEARCH the discrepancy in the prototype calibration memos and the missing map coordinates from the 1974 Station R survey
ORDER: SURVEIL the Engineering office file room after dark to see who accesses the map custody records
```
Letters written: 1
- **interview** the Engineering office custodian → resolved (ruling): The clerk could not tell who "the Engineering office custodian" names. Units returned. Use a surname from the directory, or name a place to ask around.
- **research** the discrepancy in the prototype calibration memos and the missing map coordinat → resolved (research): The company library took Dale Harker's request on "the discrepancy in the prototype calibration memos and the missing map coordinates from the 1974 Station R survey"; the librarian pulls the county records and the newspaper morgue overnight
- **surveil** the Engineering office file room after dark to see who accesses the map custody  → resolved (nothing): A night on the Records room: cold, quiet, nothing that would go in a report.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
D
Note: The Halvorsen records are likely held by the Ward County Recorder in Minot, not the company library. Option B targets the Records Office index to locate the correct filing reference.
```
Letters written: 1
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **request_files** Records Office → resolved (ruling): The clerk could not match "Records Office" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Minot Daily News → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
C
HOLD EXCEPT Okafor, Pruitt
VOTE E-77-001: Osei
Note to clerk: The sealed envelope from Julian Thorne was opened at 08:00. The request to sign Form 12-B and the instruction to assist with the 'unmarked crate' in the sub-basement have been noted. I have not signed the form. I am maintaining procedural distance.
```
Letters written: 1
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (Facilities issue)": the Facilities plat shows Building 7 as RESTRICTED and no Building 9; the Procurement copy shows an unlabelled square where Building 9 would be.
- **request_files** Engineering calibration logs → resolved (ruling): The clerk could not match "Engineering calibration logs" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE harvest-auth-1976
ORDER: EXAMINE minot-daily-news-r7
```
Letters written: 2
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **examine** harvest-auth-1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE sayer-letter-with-royce-layout
ORDER: RESEARCH the 1976 irrigation dispute and funeral records in Ward County
ORDER: VISIT Baines
IF Baines requests the N-7704 maintenance log THEN ORDER: REQUEST_FILES N-7704 maintenance log
```
Letters written: 2
- **interview** Carla Osei → resolved (ruling): Carla Osei is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Carla Osei".
- **examine** sayer-letter-with-royce-layout → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **research** the 1976 irrigation dispute and funeral records in Ward County → resolved (research): The company library took Walt Sorensen's request on "the 1976 irrigation dispute and funeral records in Ward County"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by mor
- **visit** Baines → resolved (ruling): The clerk could not place "Baines". Units returned. Name a building, a gate, a road, or a property.
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (nothing): A night on the Building 9 site: cold, quiet, nothing that would go in a report. A patrol truck slowed as it passed.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, standing.queued×1, absence.ticked×1, pressure.tier_reached×1, informants.reported×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- standing.queued: {"queued":1,"suspended":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 2 (0 guarded).

## Round 11

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
B
ORDER: EXAMINE Dr. Thorne's letter
ORDER: EXAMINE facilities-ledger-b7
```
Letters written: 0
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** Dr. Thorne's letter → resolved (ruling): Nothing in the Case File matches "Dr. Thorne's letter". Units returned.
- **examine** facilities-ledger-b7 → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
B
ORDER: REQUISITION a camera
ORDER: VISIT the south gate at 1630, bring the perimeter road photograph and the lantern, talk to Carla Osei about the 1976 authorization records and sub-level zone keys
IF Fisk requests the motor pool log THEN ORDER: report Fisk to Security
```
Letters written: 2
- **examine** Research Brief: Prototype Calibration Discrepancies and 1974 Station R Survey Co → resolved (examined): A close reading of "Research Brief: Prototype Calibration Discrepancies and 1974 Station R Survey Coordinates" found nothing beyond what it says.
- **requisition** a camera → resolved (ruling): Dale Harker already holds a 35mm camera (procurement stock). Units returned.
- **visit** the south gate at 1630, bring the perimeter road photograph and the lantern, tal → resolved (visit): Dale Harker went to the perimeter road. Gravel, three miles round, the fence on one side and prairie on the other. Tire tracks at the south-east corner that do not belong to the patrol truck.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the smudged intake form on my desk
ORDER: EXAMINE the insurance claim letter in the outbox
```
Letters written: 2
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** the smudged intake form on my desk → resolved (ruling): Nothing in the Case File matches "the smudged intake form on my desk". Units returned.
- **examine** the insurance claim letter in the outbox → resolved (ruling): Nothing in the Case File matches "the insurance claim letter in the outbox". Units returned.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
H
```
Letters written: 0
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **request_files** Sheriff's incident report, Building 7 perimeter → resolved (document): Records delivered a copy of "Facilities maintenance ledger, Building 7 (1977)". It is in the Case File.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE harvest-auth-1976
ORDER: EXAMINE royce-report-r11
```
Letters written: 2
- **attend** The noon meeting with Walt Sorensen in Conference Room B → resolved (ruling): Nothing on the company calendar, and no invitation you hold, matched "The noon meeting with Walt Sorensen in Conference Room B". Units returned.
- **examine** harvest-auth-1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **examine** royce-report-r11 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE sayer-letter-with-royce-layout
ORDER: EXAMINE sayer-clipping
```
Letters written: 2
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **interview** Col. (Ret.) Frank Baines → resolved (conversation): Walt Sorensen sat down with Col. (Ret.) Frank Baines. What was said arrives in Col. (Ret.) Frank Baines's own words this morning, if they chose to put any of it in writing.
- **examine** sayer-letter-with-royce-layout → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (nothing): A night on the Building 9 site: cold, quiet, nothing that would go in a report. A patrol truck slowed as it passed.

Engine: world.grown×1, room.triage×1, newsletter.published×1, standing.queued×1, absence.ticked×1, informants.reported×1, agreements.enforced×1, contacts.reported×1, room.moves×1
- world.grown: {"done":1,"held":0,"failed":0}
- room.triage: {"decided":0}
- standing.queued: {"queued":1,"suspended":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- informants.reported: {"notes":0,"lapsed":0}
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.moves: {"proposed":2,"committed":2}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 12

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE facilities-ledger-b7

Note: Dr. Thorne's letter is not in my Case File; I am asking for the file directly.
```
Letters written: 0
- **interview** Dr. Thorne → resolved (conversation): Ruth Lindqvist sat down with Dr. Elias Thorne. What was said arrives in Dr. Elias Thorne's own words this morning, if they chose to put any of it in writing.
- **examine** facilities-ledger-b7 → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
B
C
ORDER: EXAMINE photo-perimeter-road-r6
ORDER: RESEARCH Sheriff Dale Hollis and Ward County records regarding the Vane cattle and 1976 land disputes
```
Letters written: 2
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **submit_manifest** a written statement to the Sheriff → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- **examine** photo-perimeter-road-r6 → resolved (examined): A close reading of "Photograph: the perimeter road, night of Saturday, October 15, 1977" found nothing beyond what it says.
- **research** Sheriff Dale Hollis and Ward County records regarding the Vane cattle and 1976 l → resolved (research): The company library took Dale Harker's request on "Sheriff Dale Hollis and Ward County records regarding the Vane cattle and 1976 land disputes"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brie
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE the smudged intake form
ORDER: EXAMINE the insurance claim letter
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** the smudged intake form → resolved (ruling): Nothing in the Case File matches "the smudged intake form". Units returned.
- **examine** the insurance claim letter → resolved (ruling): Nothing in the Case File matches "the insurance claim letter". Units returned.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
C
B
ORDER: EXAMINE facilities-ledger-b7
Note to clerk: The facilities ledger is new to my file. I will cross-reference the maintenance dates against the perimeter incident report. I am also reviewing the insurance adjuster's letter over the phone line as per option B. All actions remain within standard Procurement & Logistics channels.
```
Letters written: 2
- **examine** Facilities maintenance ledger, Building 7 (1977) → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
- **interview** Insurance adjuster, phone line → resolved (ruling): The clerk could not tell who "Insurance adjuster, phone line" names. Units returned. Use a surname from the directory, or name a place to ask around.
- **examine** facilities-ledger-b7 Note to clerk: The facilities ledger is new to my file. I w → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE minot-daily-news-r7
IF anyone requests harvest-auth-1976 THEN ORDER: PROTECT my desk
```
Letters written: 2
- **examine** HARVEST sampling authorizations, 1976 → resolved (examined): A close reading of "HARVEST sampling authorizations, 1976": Lot 77-B appears on the 1977 continuation sheet with no authorizing signature, where every 1976 lot has two.
- **request_files** Records Department, Lot 77-B authorization → resolved (document): Records delivered a copy of "Sampling order, HARVEST Lot 77-B (unsigned)". It is in the Case File.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- [IF] **protect** my desk → skipped (ruling): Held against "anyone requests "HARVEST sampling authorizations, 1976"", which did not come about (the condition was not met). Nothing was done; units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
D
ORDER: OBTAIN the unredacted flight line safety protocols FROM Baines
ORDER: EXAMINE sayer-letter-with-royce-layout
```
Letters written: 2
- **interview** Carla Osei → resolved (ruling): Carla Osei is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Carla Osei".
- **lobby** Col. (Ret.) Frank Baines → resolved (ruling): There is no motion open to lobby Col. (Ret.) Frank Baines on. Units returned.
- **obtain** the unredacted flight line safety protocols FROM Baines → resolved (ruling): The clerk could not match "the unredacted flight line safety protocols FROM Baines" to a file on the index or to anything a colleague holds. Units returned. Name the file, or say what and from whom.
- **examine** sayer-letter-with-royce-layout → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (sighting): A night watching the Building 9 site: a truck came to the pad at 0300 and men unloaded something long under a tarp into the ground, through a hatch you had not seen in daylight.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1, research.briefed×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 13

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
D
ORDER: EXAMINE facilities-ledger-b7
```
Letters written: 1
- **examine** Facilities maintenance ledger, Building 7 (1977) → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
- **attend** Safety Committee meeting → resolved (ruling): Nothing on the company calendar, and no invitation you hold, matched "Safety Committee meeting". Units returned.
- **examine** facilities-ledger-b7 → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
C
ORDER: INTERVIEW Maya Okafor, Procurement & Logistics, regarding the temporary storage code times and 1974 survey record requisitions
```
Letters written: 0
- **examine** Research Brief: Sheriff Dale Hollis and Ward County records regarding the Vane c → resolved (examined): A close reading of "Research Brief: Sheriff Dale Hollis and Ward County records regarding the Vane cattle and 1976 land disputes" found nothing beyond what it says.
- **submit_manifest** Letter from Maya Okafor → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- **interview** Maya Okafor, Procurement & Logistics, regarding the temporary storage code times → resolved (conversation): Dale Harker sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE the 1974 survey records for the north perimeter
IF Okafor is seen at Building 7 THEN ORDER: report Okafor to Security
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** the 1974 survey records for the north perimeter → resolved (ruling): Nothing in the Case File matches "the 1974 survey records for the north perimeter". Units returned.
- [IF] **freeform** report Okafor to Security → skipped (ruling): Held against "Maya Okafor is seen at Building 7", which did not come about (the condition was not met). Nothing was done; units returned.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
D
ORDER: RESEARCH perimeter incident report, Building 7, 1977
Note to clerk: I will comply with the Director's instruction to focus on the Q3 reconciliation and disregard the cross-reference for now. I am re-issuing my badge to maintain standard access and will review the ledger's internal consistency. I have not contacted the insurance adjuster.
```
Letters written: 2
- **visit** Security office, main lobby → resolved (visit): Tom Brekke went to Security Office, Main Lobby. A glass partition separates the public lobby from a small, carpeted office. Two wooden desks sit side-by-side, holding beige telephones, a stack of visitor badges, and a coffee maker with a st
- **examine** Facilities maintenance ledger, Building 7 (1977) → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
- **research** perimeter incident report, Building 7, 1977 Note to clerk: I will comply with th → resolved (research): The company library took Tom Brekke's request on "perimeter incident report, Building 7, 1977 Note to clerk: I will comply with the Director's instruction to focus on the Q3 reconciliation and disregard the cross-reference for now. I am re-
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE the locker key tag
```
Letters written: 1
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **visit** East stairwell → resolved (ruling): The clerk could not place "East stairwell". Units returned. Name a building, a gate, a road, or a property.
- **examine** the locker key tag → resolved (ruling): Carla Osei does not hold "Notebook, P. Greeley (from his locker)". Units returned; request it first, or EXAMINE something in the Case File.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
C
ORDER: RESEARCH the B9 site ruling and the status of Building 9
ORDER: INTERVIEW Sheriff Dale Hollis at the Sheriff's office tomorrow morning to discuss the Vane pasture logs and the mud tracks
```
Letters written: 2
- **interview** Carla Osei → resolved (ruling): Carla Osei is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Carla Osei".
- **research** the B9 site ruling and the status of Building 9 → resolved (research): The company library took Walt Sorensen's request on "the B9 site ruling and the status of Building 9"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **interview** Sheriff Dale Hollis at the Sheriff's office tomorrow morning to discuss the Vane → resolved (conversation): Walt Sorensen sat down with Sheriff Dale Hollis. What was said arrives in Sheriff Dale Hollis's own words this morning, if they chose to put any of it in writing.
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (sighting): A night watching the Building 9 site: a truck came to the pad at 0300 and men unloaded something long under a tarp into the ground, through a hatch you had not seen in daylight.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contact.seen×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":1,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":1,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Round 14

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
D
ORDER: EXAMINE minot-daily-news-r14
```
Letters written: 0
- **request_files** Information Systems files touching last night's matter → resolved (ruling): The clerk could not match "Information Systems files touching last night's matter" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **examine** minot-daily-news-r14 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE photo-perimeter-road-r6
```
Letters written: 1
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **interview** Marjorie Pell → resolved (ruling): Marjorie Pell is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Marjorie Pell".
- **examine** photo-perimeter-road-r6 → resolved (examined): A close reading of "Photograph: the perimeter road, night of Saturday, October 15, 1977" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
C
Note to clerk: The Sheriff's request for the October 9 gate log is a direct threat. I will handle this via phone call (Option C) to maintain control of the narrative, rather than sending a written request that could be leaked or misinterpreted. I will not leak anything to the press.
```
Letters written: 2
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **request_files** The 1974 survey records for the north perimeter → resolved (ruling): The clerk could not match "The 1974 survey records for the north perimeter" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **interview** Sheriff Dale Hollis → resolved (conversation): Marjorie Pell sat down with Sheriff Dale Hollis. What was said arrives in Sheriff Dale Hollis's own words this morning, if they chose to put any of it in writing.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
HOLD
A
B
```
Letters written: 2
- **examine** Research Brief: Perimeter Incident Report, Building 7, 1977 → resolved (examined): A close reading of "Facilities maintenance ledger, Building 7 (1977)": every entry for Building 7 is billed to Applied Physics, but the occupant column reads NONE LISTED for all of 1977.
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
B
C
ORDER: EXAMINE harvest-lot-77b-sampling-order
```
Letters written: 1
- **interview** Walt Sorensen → resolved (ruling): Walt Sorensen is a colleague in your cohort; the clerk arranges sittings with staff and locals only. Units returned. Write to them instead: a new message to the game's address beginning "TO: Walt Sorensen".
- **request_files** HARVEST Lot 77-B sampling logs → resolved (document): Records delivered a copy of "Sampling order, HARVEST Lot 77-B (unsigned)". It is in the Case File.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: RESEARCH the E-76-19 ordnance tag and the Halvorsen property parcel
IF Harold Sloane requests the Form 14-B THEN CANCEL STANDING 1
```
Letters written: 2
- **examine** Research Brief: The B9 Site Ruling and the Status of Building 9 → resolved (examined): A close reading of "Research Brief: The B9 Site Ruling and the Status of Building 9" found nothing beyond what it says.
- **request_files** Personnel & Administration → resolved (ruling): The clerk could not match "Personnel & Administration" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **research** the E-76-19 ordnance tag and the Halvorsen property parcel → resolved (research): The company library took Walt Sorensen's request on "the E-76-19 ordnance tag and the Halvorsen property parcel"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning
- [standing 1] **freeform** surveil the Tagus road Note to the clerk: The B9 note is the key. I am tracking  → resolved (sighting): A night watching the Building 9 site: a truck came to the pad at 0300 and men unloaded something long under a tarp into the ground, through a hatch you had not seen in daylight.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, bulletin.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, pressure.tier_reached×1, research.briefed×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (1 templated fallbacks). Staff replies: 2 (0 guarded).

## Model ledger for the run

| tag | calls | ok | minutes | prompt tokens | completion tokens |
|---|---|---|---|---|---|
| bulletin | 2 | 2 | 0.4 | 706 | 582 |
| dispatch | 93 | 93 | 26.5 | 138113 | 36802 |
| extract | 110 | 110 | 21.0 | 38269 | 40227 |
| grow:skeptic | 6 | 6 | 2.1 | 24056 | 12 |
| grow:writer:place | 3 | 3 | 0.6 | 4165 | 751 |
| neversays:Col. (Ret.) Frank Baines | 1 | 1 | 0.0 | 152 | 2 |
| neversays:Dr. Sarah Ely | 3 | 3 | 0.1 | 496 | 6 |
| neversays:Julian Thorne | 2 | 2 | 0.0 | 285 | 4 |
| neversays:Maya Okafor | 2 | 2 | 0.0 | 306 | 4 |
| newsletter | 2 | 2 | 0.5 | 1002 | 954 |
| npc:Col. (Ret.) Frank Baines | 5 | 5 | 1.5 | 14718 | 1454 |
| npc:Col. (Ret.) Frank Baines:retry1 | 1 | 1 | 0.3 | 3688 | 273 |
| npc:Dorothy Armitage | 12 | 12 | 4.3 | 44685 | 3627 |
| npc:Dr. Elias Thorne | 9 | 9 | 2.7 | 24000 | 2691 |
| npc:Dr. Elias Thorne:retry1 | 4 | 4 | 1.2 | 9811 | 1266 |
| npc:Dr. Elias Thorne:retry2 | 2 | 2 | 0.5 | 5095 | 562 |
| npc:Dr. Elias Thorne:retry3 | 1 | 1 | 0.3 | 3127 | 243 |
| npc:Dr. Sarah Ely | 15 | 15 | 5.3 | 55620 | 4628 |
| npc:Dr. Sarah Ely:retry1 | 7 | 7 | 2.5 | 26849 | 2099 |
| npc:Dr. Sarah Ely:retry2 | 4 | 4 | 1.3 | 14532 | 1136 |
| npc:Dr. Sarah Ely:retry3 | 1 | 1 | 0.3 | 3379 | 257 |
| npc:Elmer Bernard | 12 | 12 | 3.9 | 39387 | 3570 |
| npc:Gerald Voss | 15 | 15 | 5.9 | 61297 | 5205 |
| npc:Harold Sloane | 3 | 3 | 0.8 | 7916 | 835 |
| npc:Harold Sloane:retry1 | 1 | 1 | 0.3 | 2609 | 324 |
| npc:Julian Thorne | 1 | 1 | 0.3 | 2004 | 317 |
| npc:Leonard Fisk | 12 | 12 | 4.2 | 45309 | 3661 |
| npc:Leonard Fisk:retry1 | 2 | 2 | 0.7 | 7654 | 588 |
| npc:Leonard Fisk:retry2 | 1 | 1 | 0.4 | 3729 | 321 |
| npc:Martin Sayer | 9 | 9 | 3.1 | 28096 | 3076 |
| npc:Martin Sayer:retry1 | 2 | 2 | 0.6 | 5398 | 667 |
| npc:Maya Okafor | 25 | 25 | 8.4 | 82668 | 7679 |
| npc:Maya Okafor:retry1 | 12 | 12 | 3.8 | 41127 | 3298 |
| npc:Maya Okafor:retry2 | 5 | 5 | 1.6 | 16321 | 1240 |
| npc:Maya Okafor:retry3 | 3 | 3 | 1.2 | 9918 | 821 |
| npc:Sheriff Dale Hollis | 13 | 13 | 4.4 | 44833 | 4041 |
| research:skeptic | 20 | 20 | 6.3 | 76770 | 40 |
| research:writer | 18 | 17 | 8.8 | 82302 | 5772 |
| room:continuity | 17 | 16 | 4.7 | 80106 | 32 |
| room:dissent | 1 | 1 | 0.2 | 3477 | 63 |
| room:log | 14 | 14 | 5.6 | 48864 | 6437 |
| room:propose | 14 | 14 | 6.1 | 48989 | 6923 |
| room:revise | 1 | 1 | 0.3 | 3362 | 177 |
| room:rules | 16 | 16 | 4.3 | 6602 | 32 |
| room:skeptic | 16 | 16 | 4.2 | 7670 | 52 |
| sim:player | 84 | 84 | 42.4 | 556474 | 25962 |
| skeptic:Col. (Ret.) Frank Baines | 7 | 7 | 0.5 | 6435 | 26 |
| skeptic:Dorothy Armitage | 14 | 14 | 1.1 | 15983 | 96 |
| skeptic:Dr. Elias Thorne | 21 | 21 | 1.6 | 19428 | 681 |
| skeptic:Dr. Sarah Ely | 42 | 42 | 3.3 | 43999 | 1182 |
| skeptic:Elmer Bernard | 12 | 12 | 0.8 | 11732 | 24 |
| skeptic:Gerald Voss | 15 | 15 | 1.0 | 15693 | 30 |
| skeptic:Harold Sloane | 5 | 5 | 0.3 | 4607 | 62 |
| skeptic:Julian Thorne | 2 | 2 | 0.1 | 1730 | 48 |
| skeptic:Leonard Fisk | 17 | 17 | 1.4 | 19120 | 344 |
| skeptic:Martin Sayer | 15 | 15 | 1.1 | 14018 | 308 |
| skeptic:Maya Okafor | 68 | 67 | 5.3 | 64878 | 2164 |
| skeptic:Sheriff Dale Hollis | 13 | 13 | 0.9 | 12636 | 26 |

## Goals

- Ruth Lindqvist: Explain the future-dated entries in the computer records. (20) → failed
- Dale Harker: Identify who has been passing company material to outsiders. (20) → open
- Marjorie Pell: Explain three altered personnel records. (20) → failed
- Tom Brekke: Determine who approved the Tagus shipments. (15) → met (15 awarded)
- Carla Osei: Establish whether the HARVEST samples were obtained under legitimate authority. (20) → open
- Walt Sorensen: Recover the missing NIGHTJAR test log before the flight review. (15) → met (15 awarded)
