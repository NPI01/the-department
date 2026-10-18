# Simulated season sim-ep3

Campaign c593ba20-013b-4517-b296-99dfe3ad2794. 6 synthetic players: Ruth Lindqvist (analyst), Dale Harker (operative), Marjorie Pell (negotiator), Tom Brekke (administrator), Carla Osei (analyst), Walt Sorensen (negotiator). Started 2026-10-18T05:45:01.118Z.

## Findings, compared with sim-ep1 and sim-ep2 (read 2026-10-18)

| measure | sim-ep1 | sim-ep2 | sim-ep3 |
|---|---|---|---|
| orders refunded by the clerk | 85 of 225 (38%) | 71 of 260 (27%) | 45 of 260 (17%) |
| EXAMINE refused | 40 of 101 | 13 of 126 | 4 of 122 |
| REQUEST_FILES refused | 25 of 29 | 28 of 37 | 24 of 30 |
| letters between players delivered | 4 | 25 | 3 |
| colleagues met in person (MEET) | — | — | 6 held, 2 refused |
| committee sessions attended (ATTEND) | — | — | 2 |
| goals met | 2, both partial | 2, both full | none (4 failed at Round 14, 1 for review, 1 open) |
| AU at the end | all 60 | all 60 | all 60 |
| engine model-minutes per player-day | 2.4 | 2.0 | 1.8 |
| engine prompt tokens per player-day | ~21k | ~17k | ~16k |

Engine figures leave out the synthetic players' own turns (84 calls, 41 minutes).

What held: one seat per person (E-77-002 passed over Harker, who sat on the other body, and seated Pell); the
Note/P.S. line no longer runs into orders (the standing PROTECT ran 13 clean nights); LEAK printed a held item;
ATTEND seated Sorensen at two Board sessions; INTERVIEW of staff kept working (28 conversations); 43 of 84
dispatches carried Returned by the clerk, 6 carried In person, off the record, and 2 fell back.

New or still open:
1. **A bare MEET records the name as the conversation.** Five of the six meetings were `ORDER: MEET Dale Harker`
   or `MEET Carla Osei` with nothing after the name. meetColleague falls back to the order text, so the colleague's
   morning section reports that the other person said "Carla Osei". Fix: rule a bare MEET with a refund ("say what
   you want to talk about"), or word it as "asked to sit down with you; nothing of substance".
2. **Letters between players fell back to 3.** The player prompt and directory did not change in 614fd0a, so this
   looks like variation between runs: in sim-ep2, 28 letters went to Osei, who acted as a hub. In sim-ep3, Harker and
   Osei met in person six times instead of writing, and most letters went to staff (Okafor alone got 25). One episode
   cannot show whether MEET is replacing letters.
3. **Records still holds too little**: 24 of 30 refused, the worst ratio so far. Lindqvist alone lost nine requests
   (Julian Thorne's logs, access logs, staff directories). Design call.
4. **The economy still never binds** (all at 60). Design call.
5. **ANALYZE is aimed at things a laboratory cannot read** (4 of 5 refused: clippings, a hand-drawn layout, a
   research brief, an unsigned form). Nothing in the Case File tells a player which items analysis can add to.
6. **Mitigation paperwork with nothing to mitigate is repeated**: Brekke filed SUBMIT_MANIFEST "Sheriff's official
   statement" on Rounds 11 and 12 after the receipt returned it; Sorensen did the same on Round 11.
7. **No goal was met.** Four were ruled failed at Round 14 and one went to review. Goals are hand-ruled, so this
   reflects play more than the engine, but no player assembled a case across three episodes.
8. Mechanics still barely used: one standing order, one trip-wire fired, no agreements, declarations or proxies.

## Round 1

### Ruth Lindqvist (analyst) · 24 AU · orders
Reply:
```
A
ORDER: EXAMINE campus-map
```
Letters written: 0
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
### Dale Harker (operative) · 22 AU · orders
Reply:
```
B
ORDER: VISIT Building 9 and look for signs of recent use or equipment
IF anyone requests the campus map THEN PROTECT my desk
```
Letters written: 0
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **visit** Building 9 and look for signs of recent use or equipment → resolved (visit): Dale Harker went to the Building 9 site. Where the Procurement map puts a square there is a graded pad, a fenced vent, and fresh concrete that nobody poured in daylight.
- [IF] **protect** my desk → skipped: beyond your balance at the lock
### Marjorie Pell (negotiator) · 21 AU · orders
Reply:
```
A
B
ORDER: EXAMINE campus-map
ORDER: EXAMINE confidentiality-clause
```
Letters written: 2
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** confidentiality-clause → skipped: beyond your balance at the lock
### Tom Brekke (administrator) · 27 AU · orders
Reply:
```
B
VOTE E-77-001: Lindqvist
VOTE E-77-002: Pell

Clerk: I am reviewing the NDA clauses as requested. I will not be comparing my map with others or visiting Building 7. I am voting for colleagues who do not require me to increase my visibility.
```
Letters written: 0
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
### Carla Osei (analyst) · 22 AU · orders
Reply:
```
B
C
ORDER: ANALYZE the campus plat
VOTE E-77-001: Osei
VOTE E-77-002: Osei
```
Letters written: 0
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **visit** Building 7 east stairwell → resolved (visit): Carla Osei went to Building 7. A low concrete building in the south-east corner, no sign, one door, a card reader of a type the other buildings do not have. A smell of wet stone.
- **analyze** the campus plat → skipped: beyond your balance at the lock
### Walt Sorensen (negotiator) · 20 AU · orders
Reply:
```
A
C
ORDER: EXAMINE sayer-clipping
ORDER: EXAMINE campus-map
VOTE E-77-001: Sorensen
VOTE E-77-002: Sorensen
STANDING ORDER: PROTECT my desk
```
Letters written: 2
- **examine** Newspaper clipping with a symbol circled in red → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **submit_manifest** Non-Disclosure and Non-Compete Agreement → resolved (mitigated): Walt Sorensen's paperwork (submit manifest) went through. The matter of "Security flags vehicle entries that were never logged" is, for now, handled.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **examine** campus-map → skipped: beyond your balance at the lock
- [standing 1] **protect** my desk → skipped: beyond your balance at the lock

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":1,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":1}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 1 (0 guarded).

## Round 2

### Ruth Lindqvist (analyst) · 41 AU · orders
Reply:
```
A
C
VOTE E-77-002: Okafor
VOTE E-77-001: Harker
```
Letters written: 1
- **request_files** Security vehicle log for October 10 → resolved (ruling): The clerk could not match "Security vehicle log for October 10" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
### Dale Harker (operative) · 38 AU · orders
Reply:
```
C
ORDER: FORM 14-B
VOTE E-77-001: Harker
VOTE E-77-002: Harker
IF anyone requests "Campus plat, Station R (Facilities issue)" THEN ORDER: PROTECT my desk
HOLD
```
Letters written: 2
- **interview** Harold Sloane → resolved (conversation): Dale Harker sat down with Harold Sloane. What was said arrives in Harold Sloane's own words this morning, if they chose to put any of it in writing.
- [IF] **protect** my desk → skipped (ruling): Held against "anyone requests "Campus plat, Station R (Facilities issue)"", which did not come about (the condition was not met). Nothing was done; units returned.
### Marjorie Pell (negotiator) · 31 AU · orders
Reply:
```
A
ORDER: EXAMINE campus-map
ORDER: EXAMINE confidentiality-clause
VOTE E-77-001: Pell
VOTE E-77-002: Pell

Clerk, please note: I am proceeding with the examination of the documents I hold now that they are in my file. I am also casting my ballots for the employee seats.
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** confidentiality-clause → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
### Tom Brekke (administrator) · 40 AU · orders
Reply:
```
A
D
IF anyone requests the HARVEST sampling order THEN C
```
Letters written: 1
- **request_files** Security Vehicle Entry Logs for Oct 10 → resolved (ruling): The clerk could not match "Security Vehicle Entry Logs for Oct 10" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- [IF] **interview** Dr. Adrian Vale → resolved (conversation): Because anyone requests "Sampling order, HARVEST Lot 77-B (unsigned)": Tom Brekke sat down with Dr. Adrian Vale. What was said arrives in Dr. Adrian Vale's own words this morning, if they chose to put any of it in writing.
### Carla Osei (analyst) · 28 AU · orders
Reply:
```
C
B
ORDER: REQUEST_FILES HARVEST sampling order, October 1977
ORDER: REQUEST_FILES motor pool sign-out log, October 1977
```
Letters written: 0
- **visit** Building 7 east stairwell → resolved (visit): Carla Osei went to Building 7. A low concrete building in the south-east corner, no sign, one door, a card reader of a type the other buildings do not have. A smell of wet stone.
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **request_files** HARVEST sampling order, October 1977 → resolved (document): Records delivered a copy of "Sampling order, HARVEST Lot 77-B (unsigned)". It is in the Case File.
- **request_files** motor pool sign-out log, October 1977 → resolved (ruling): The clerk could not match "motor pool sign-out log, October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Walt Sorensen (negotiator) · 26 AU · orders
Reply:
```
B
C
ORDER: TRAVEL Tagus and meet Elmer Bernard at St. Olaf Church, standing in the yard as instructed
VOTE E-77-001: Sorensen
VOTE E-77-002: Sorensen
```
Letters written: 1
- **interview** Elmer Bernard → resolved (conversation): Walt Sorensen sat down with Elmer Bernard. What was said arrives in Elmer Bernard's own words this morning, if they chose to put any of it in writing.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **travel** Tagus and meet Elmer Bernard at St. Olaf Church, standing in the yard as instruc → resolved (travelled): Walt Sorensen signed out at Gate 2 and drove to Tagus. Forty minutes west on the county road, the last ten on gravel. A grain elevator, a church, a store that is also the post office, nine houses with lights in four of them. The wind does n
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, condition.fired×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Round 3

### Ruth Lindqvist (analyst) · 48 AU · orders
Reply:
```
C
VOTE E-77-002: Harker
VOTE E-77-001: Harker
ORDER: REQUEST_FILES Julian Thorne's access log for the mainframe, October 1977
ORDER: RESEARCH future-dated entries in Royce Industries mainframe logs, 1977
```
Letters written: 0
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **request_files** Julian Thorne's access log for the mainframe, October 1977 → resolved (ruling): The clerk could not match "Julian Thorne's access log for the mainframe, October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **research** future-dated entries in Royce Industries mainframe logs, 1977 → resolved (research): The company library took Ruth Lindqvist's request on "future-dated entries in Royce Industries mainframe logs, 1977"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by mor
### Dale Harker (operative) · 55 AU · orders
Reply:
```
VOTE E-77-001: Harker
VOTE E-77-002: Harker
ORDER: EXAMINE campus-map
ORDER: REQUEST_FILES motor pool sign-out log, October 1977
```
Letters written: 2
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **request_files** motor pool sign-out log, October 1977 → resolved (ruling): The clerk could not match "motor pool sign-out log, October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Marjorie Pell (negotiator) · 47 AU · orders
Reply:
```
A
ORDER: EXAMINE the new hire orientation roster
VOTE E-77-001: Okafor
VOTE E-77-002: Okafor
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** the new hire orientation roster → resolved (ruling): Nothing in the Case File matches "the new hire orientation roster". Units returned.
### Tom Brekke (administrator) · 38 AU · orders
Reply:
```
A
B
VOTE E-77-001: Lindqvist
VOTE E-77-002: Pell
ORDER: REQUEST_FILES HARVEST Lot 77-B sampling order FROM Records
ORDER: EXAMINE campus-map
ORDER: EXAMINE confidentiality-clause
```
Letters written: 2
- **interview** Gerald Voss → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
- **request_files** HARVEST Lot 77-B sampling order → resolved (referred): Records does not hold "Sampling order, HARVEST Lot 77-B (unsigned)"; it is kept by Dr. Sarah Ely personally. The request was logged and referred; a letter to them might do what a requisition cannot.
- **request_files** HARVEST Lot 77-B sampling order FROM Records → resolved (referred): Records does not hold "Sampling order, HARVEST Lot 77-B (unsigned)"; it is kept by Dr. Sarah Ely personally. The request was logged and referred; a letter to them might do what a requisition cannot.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** confidentiality-clause → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
### Carla Osei (analyst) · 20 AU · orders
Reply:
```
A
B
ORDER: RESEARCH Vane north pasture grazing permit history
ORDER: TRAVEL Vane north pasture
```
Letters written: 1
- **examine** Sampling order, HARVEST Lot 77-B (unsigned) → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
- **research** HARVEST Lot 77-B procurement history → resolved (research): The company library took Carla Osei's request on "HARVEST Lot 77-B procurement history"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **research** Vane north pasture grazing permit history → resolved (research): The company library took Carla Osei's request on "Vane north pasture grazing permit history"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **travel** Vane north pasture → resolved (travelled): Carla Osei signed out at Gate 2 and drove to Tagus. Forty minutes west on the county road, the last ten on gravel. A grain elevator, a church, a store that is also the post office, nine houses with lights in four of them. The wind does not 
### Walt Sorensen (negotiator) · 33 AU · orders
Reply:
```
C
ORDER: TRAVEL Station R
ORDER: EXAMINE sayer-clipping
ORDER: ANALYZE sayer-clipping
```
Letters written: 2
- **examine** Review the Newspaper clipping with a symbol circled in red → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **travel** Station R → resolved (travelled): Walt Sorensen drove back from Tagus and signed in at Gate 2.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **analyze** sayer-clipping → resolved (ruling): There is nothing a laboratory could add to "Newspaper clipping with a symbol circled in red (from M. Sayer)"; the page is what it is. Units returned. EXAMINE it instead.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×3
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 4

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
B
```
Letters written: 0
- **examine** Research Brief: Allegations of Future-Dated Entries in Royce Industries Mainfram → resolved (examined): A close reading of "Research Brief: Allegations of Future-Dated Entries in Royce Industries Mainframe Logs, 1977" found nothing beyond what it says.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
B
ORDER: RESEARCH Vane Cattle Co. truck registrations, Ward County, 1976-1977
ORDER: EXAMINE royce-report-r4
```
Letters written: 1
- **request_files** Perimeter inspection logs, October 1977 → resolved (ruling): The clerk could not match "Perimeter inspection logs, October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **research** Vane Cattle Co. truck registrations, Ward County, 1976-1977 → resolved (research): The company library took Dale Harker's request on "Vane Cattle Co. truck registrations, Ward County, 1976-1977"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **examine** royce-report-r4 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 51 AU · orders
Reply:
```
A
ORDER: EXAMINE the Royce Report, No. 1, Thursday, October 13, 1977
ORDER: RESEARCH the new 0200 night flight schedule and audit trails
VOTE E-77-001: Marjorie Pell
VOTE E-77-002: Marjorie Pell

Note to clerk: I have the Royce Report in my Case File under the short name royce-report-r4. Please examine that document.
```
Letters written: 2
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **examine** the Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **research** the new 0200 night flight schedule and audit trails → resolved (research): The company library took Marjorie Pell's request on "the new 0200 night flight schedule and audit trails"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Tom Brekke (administrator) · 49 AU · orders
Reply:
```
C
B
VOTE E-77-001: Lindqvist
VOTE E-77-002: Pell
```
Letters written: 2
- **examine** The Royce Report, No. 1 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **request_files** HARVEST Lot 77-B sampling order → resolved (referred): Records does not hold "Sampling order, HARVEST Lot 77-B (unsigned)"; it is kept by Dr. Sarah Ely personally. The request was logged and referred; a letter to them might do what a requisition cannot.
### Carla Osei (analyst) · 30 AU · orders
Reply:
```
TRAVEL back to Station R
C
A
B
```
Letters written: 1
- **interview** Maya Okafor → resolved (conversation): Carla Osei sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** Research Brief: Vane north pasture grazing permit history → resolved (examined): A close reading of "Research Brief: Vane north pasture grazing permit history" found nothing beyond what it says.
- **examine** Research Brief: HARVEST Lot 77-B procurement history → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 41 AU · orders
Reply:
```
A
B
ORDER: EXAMINE sayer-clipping
```
Letters written: 1
- **interview** Elmer Bernard → resolved (conversation): Walt Sorensen sat down with Elmer Bernard. What was said arrives in Elmer Bernard's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, newsletter.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, pressure.tier_reached×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 5

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
B
```
Letters written: 0
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **request_files** Laboratory access request log, Information Systems → resolved (ruling): The clerk could not match "Laboratory access request log, Information Systems" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE research-vane-cattle-co-truck-registrations-w
Note to clerk: Sloane authorized the limited distribution maps. I am using that privilege to verify my inspection logs against the Vane registration data.
```
Letters written: 1
- **examine** Research Brief: Vane Cattle Co. truck registrations, Ward County, 1976-1977 → resolved (examined): A close reading of "Research Brief: Vane Cattle Co. truck registrations, Ward County, 1976-1977" found nothing beyond what it says.
- **interview** Harold Sloane → resolved (conversation): Dale Harker sat down with Harold Sloane. What was said arrives in Harold Sloane's own words this morning, if they chose to put any of it in writing.
- **examine** research-vane-cattle-co-truck-registrations-w → resolved (examined): A close reading of "Research Brief: Vane Cattle Co. truck registrations, Ward County, 1976-1977" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
B
VOTE E-77-001: Marjorie Pell
VOTE E-77-002: Marjorie Pell
```
Letters written: 2
- **examine** Research Brief: the new 0200 night flight schedule and audit trails → resolved (examined): A close reading of "Research Brief: the new 0200 night flight schedule and audit trails" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · hold
Reply:
```
HOLD
VOTE B-77-001: FOR
```
Letters written: 2
### Carla Osei (analyst) · 40 AU · orders
Reply:
```
A
B
ORDER: EXAMINE harvest-lot-77b-sampling-order
```
Letters written: 1
- **interview** Maya Okafor → resolved (conversation): Carla Osei sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 39 AU · orders
Reply:
```
A
ORDER: RESEARCH Ward County vehicle registration, trucks, north pasture, October 1977
ORDER: LEAK sayer-clipping
VOTE E-77-001: Sorensen
VOTE E-77-002: Sorensen

Note to clerk: The truck is the priority. If it is Ward County, it is not ours. If it is not, it is a problem.
```
Letters written: 1
- **interview** Elmer Bernard → resolved (conversation): Walt Sorensen sat down with Elmer Bernard. What was said arrives in Elmer Bernard's own words this morning, if they chose to put any of it in writing.
- **research** Ward County vehicle registration, trucks, north pasture, October 1977 → resolved (research): The company library took Walt Sorensen's request on "Ward County vehicle registration, trucks, north pasture, October 1977"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File
- **leak** sayer-clipping → resolved (leaked): A copy of "Newspaper clipping with a symbol circled in red (from M. Sayer)" went to the Minot Daily News by way of the counter on Main, left with a man who did not give his name. It will be in the paper's next issue.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 6

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: REQUEST_FILES Julian Thorne's file request log, Information Systems
```
Letters written: 0
- **request_files** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (ruling): The clerk could not match "The Royce Report, No. 1, Thursday, October 13, 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **request_files** Julian Thorne's file request log, Information Systems → resolved (ruling): The clerk could not match "Julian Thorne's file request log, Information Systems" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE campus-map
ORDER: EXAMINE royce-report-r4
VOTE E-77-001: Harker
VOTE E-77-002: Harker
```
Letters written: 1
- **interview** Harold Sloane → resolved (conversation): Dale Harker sat down with Harold Sloane. What was said arrives in Harold Sloane's own words this morning, if they chose to put any of it in writing.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** royce-report-r4 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
B
C
VOTE E-77-001: Pell
VOTE E-77-002: Pell
ORDER: EXAMINE research-the-new-0200-night-flight-schedule-a
ORDER: EXAMINE royce-report-r4
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** Research Brief: the new 0200 night flight schedule and audit trails → resolved (examined): A close reading of "Research Brief: the new 0200 night flight schedule and audit trails" found nothing beyond what it says.
- **examine** research-the-new-0200-night-flight-schedule-a → resolved (examined): A close reading of "Research Brief: the new 0200 night flight schedule and audit trails" found nothing beyond what it says.
- **examine** royce-report-r4 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
C
VOTE E-77-001: Lindqvist
VOTE E-77-002: Pell
ORDER: RESEARCH the 1974 PGS vendor logs and unmarked transports
ORDER: EXAMINE the unmarked transport vehicle incident report
```
Letters written: 2
- **request_files** Procurement records for HARVEST Lot 77-B → resolved (referred): Records does not hold "Sampling order, HARVEST Lot 77-B (unsigned)"; it is kept by Dr. Sarah Ely personally. The request was logged and referred; a letter to them might do what a requisition cannot.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **research** the 1974 PGS vendor logs and unmarked transports → resolved (research): The company library took Tom Brekke's request on "the 1974 PGS vendor logs and unmarked transports"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **examine** the unmarked transport vehicle incident report → resolved (ruling): Nothing in the Case File matches "the unmarked transport vehicle incident report". Units returned.
### Carla Osei (analyst) · 44 AU · orders
Reply:
```
A
ORDER: EXAMINE harvest-lot-77b-sampling-order
ORDER: RESEARCH HARVEST Lot 77-B sampling authorization and chain of custody
```
Letters written: 1
- **examine** Sampling order, HARVEST Lot 77-B (unsigned) → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
- **research** HARVEST Lot 77-B sampling authorization and chain of custody → resolved (research): The company library took Carla Osei's request on "HARVEST Lot 77-B sampling authorization and chain of custody"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Walt Sorensen (negotiator) · 49 AU · orders
Reply:
```
A
D
ORDER: TRAVEL Tagus and sit with Elmer Bernard at the church to hear the story of the 1883 surveyor and the compass that failed.
VOTE E-77-001: Sorensen
VOTE E-77-002: Sorensen
```
Letters written: 1
- **examine** Research Brief: Ward County vehicle registration, trucks, north pasture, October → resolved (examined): A close reading of "Research Brief: Ward County vehicle registration, trucks, north pasture, October 1977" found nothing beyond what it says.
- **analyze** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (ruling): There is nothing a laboratory could add to "Building layout, hand-drawn (enclosed by M. Sayer)"; the page is what it is. Units returned. EXAMINE it instead.
- **travel** Tagus and sit with Elmer Bernard at the church to hear the story of the 1883 sur → resolved (travelled): Walt Sorensen signed out at Gate 2 and drove to Tagus. Forty minutes west on the county road, the last ten on gravel. A grain elevator, a church, a store that is also the post office, nine houses with lights in four of them. The wind does n
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, election.closed×2, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, pressure.tier_reached×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- election.closed: {"cast":6,"title":"Employee seat, Research Committee","votes":{"5950f431-3a66-4406-b7b8-28c68718c918":1,"68418f42-8347-4564-bdf4-f66c3193361f":1,"a0f3f6b7-0421-4414-ac45-e6d271aedeb1":2,"b27fc644-9a4c
- election.closed: {"cast":6,"title":"Employee seat, Safety Committee","votes":{"5950f431-3a66-4406-b7b8-28c68718c918":1,"a0f3f6b7-0421-4414-ac45-e6d271aedeb1":2,"b27fc644-9a4c-4a31-aa50-bc3b0096018c":2,"ec1c29e0-c785-4
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 7

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
B
C
ORDER: EXAMINE research-future-dated-entries-in-royce-indust
```
Letters written: 1
- **examine** The Royce Report, No. 1 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **research** Julian Thorne, Information Systems → resolved (research): The company library took Ruth Lindqvist's request on "Julian Thorne, Information Systems"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **examine** research-future-dated-entries-in-royce-indust → resolved (examined): A close reading of "Research Brief: Allegations of Future-Dated Entries in Royce Industries Mainframe Logs, 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
D
ORDER: EXAMINE minot-daily-news-r7
```
Letters written: 0
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **request_files** Security incident reports → resolved (ruling): The clerk could not match "Security incident reports" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
C
ORDER: MEET Dorothy Armitage about the waiver: I need to clarify the countersignature requirement and the scope of the records involved before I commit to handling this personally. I value the trust you are placing in me, but I need to be certain I am not stepping outside my administrative scope in a way that could compromise the file or myself. I will bring the log to your office on Monday at ten as requested.
ORDER: LOBBY Walter Crane regarding B-77-001: I am writing to express my concern about the Departmental Reporting Reform. As a new member of the Staff Council, I believe transparency 
```
Letters written: 2
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **meet** Dorothy Armitage about the waiver: I need to clarify the countersignature requir → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **lobby** Walter Crane regarding B-77-001: I am writing to express my concern about the De → resolved (ruling): There is no motion open to lobby Walter Crane on. Units returned.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE research-the-1974-pgs-vendor-logs-and-unmarke
ORDER: EXAMINE minot-daily-news-r7
```
Letters written: 2
- **examine** Research Brief: The 1974 PGS Vendor Logs and Unmarked Transports → resolved (examined): A close reading of "Research Brief: The 1974 PGS Vendor Logs and Unmarked Transports" found nothing beyond what it says.
- **examine** research-the-1974-pgs-vendor-logs-and-unmarke → resolved (examined): A close reading of "Research Brief: The 1974 PGS Vendor Logs and Unmarked Transports" found nothing beyond what it says.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Carla Osei (analyst) · 55 AU · orders
Reply:
```
A
B
ORDER: EXAMINE harvest-lot-77b-sampling-order
Note: The research brief is thin. I will focus on the physical evidence and the paper's mention of the 1976 clipping.
```
Letters written: 2
- **examine** Research Brief: HARVEST Lot 77-B sampling authorization and chain of custody → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
B
A
ORDER: MEET Dale Harker about the staff council: I'd like to sit down and hear how the council is shaping up, and if there's room for a junior voice from Aerospace. I'm in Tagus right now, so I'll swing back to campus for this one.
IF B-77-001 passes THEN ORDER: LEAK minot-daily-news-r7
```
Letters written: 1
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **meet** Dale Harker about the staff council: I'd like to sit down and hear how the counc → resolved (ruling): Dale Harker was at Station R and Walt Sorensen in Tagus; they could not sit down together. Units returned.
- [IF] **leak** minot-daily-news-r7 → skipped (ruling): Held against "B-77-001 passes", which did not come about (B-77-001 failed). Nothing was done; units returned.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, motion.closed×1, world.grown×1, room.moves×1, bulletin.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- motion.closed: {"for":3,"seats":7,"title":"Departmental Reporting Reform","number":"B-77-001","passed":false,"quorum":true,"abstain":1,"against":3,"finding":null,"motion_id":"1b952f8e-d547-4379-b5e6-e17fcd8bfd5d"}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
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
ORDER: EXAMINE research-julian-thorne-information-systems
IF Julian Thorne is seen at Mainframe Room THEN ORDER: report Julian Thorne to Security
```
Letters written: 0
- **request_files** Personnel File of Julian Thorne, Information Systems → resolved (ruling): The clerk could not match "Personnel File of Julian Thorne, Information Systems" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** research-julian-thorne-information-systems → resolved (examined): A close reading of "Research Brief: Julian Thorne, Information Systems" found nothing beyond what it says.
### Dale Harker (operative) · 58 AU · orders
Reply:
```
A
D
ORDER: REQUISITION a camera
ORDER: SURVEIL east fence sensor array after dark, log any movement on the prairie meridian road
IF Okafor is seen at Building 7 THEN ORDER: report Okafor to Security
```
Letters written: 1
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **visit** Perimeter sensor array, East Fence → resolved (visit): Dale Harker went to the perimeter road. Gravel, three miles round, the fence on one side and prairie on the other. Tire tracks at the south-east corner that do not belong to the patrol truck.
- **requisition** a camera → resolved (requisitioned): Procurement stores signed a 35mm camera (procurement stock) out to Dale Harker. It is on the personnel file under Holdings, and in the requisitions log.
- **surveil** east fence sensor array after dark, log any movement on the prairie meridian roa → resolved (sighting): A night watching the Prairie Meridian strip: the helicopter went out at 0105 without lights and came back at 0220; the pilot sat in the cockpit for twenty minutes before he climbed down. The camera has it; the print is in the Case File.
- [IF] **freeform** report Okafor to Security → skipped (ruling): Held against "Maya Okafor is seen at Building 7", which did not come about (the condition was not met). Nothing was done; units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** Research Brief: the new 0200 night flight schedule and audit trails → resolved (examined): A close reading of "Research Brief: the new 0200 night flight schedule and audit trails" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
HOLD
ORDER: EXAMINE minot-daily-news-r7
VOTE B-77-001: AGAINST
```
Letters written: 0
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE minot-daily-news-r7
ORDER: EXAMINE harvest-lot-77b-sampling-order
```
Letters written: 1
- **interview** Maya Okafor → resolved (conversation): Carla Osei sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: TRAVEL back to Station R
ORDER: MEET Martin Sayer about the layout: I am back on campus. I know you are in the field, but I am sitting on the campus plat and the hand-drawn schematic. The symbol on the shaft matches the one on the 1976 clipping. I need to know what B9 is. If you are close to the gate, I can meet you at the loading dock.
```
Letters written: 1
- **request_files** Security Office logs for perimeter sensor drift → resolved (ruling): The clerk could not match "Security Office logs for perimeter sensor drift" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **attend** Board vote on perimeter sensor anomalies → resolved (attended): Walt Sorensen sat at the back of the Board of Directors session. Minutes, a budget line, a long discussion of the parking allocation; nothing before the body that a new hire would care about.
- **travel** back to Station R → resolved (travelled): Walt Sorensen drove back from Tagus and signed in at Gate 2.
- **meet** Martin Sayer about the layout: I am back on campus. I know you are in the field, → resolved (conversation): Walt Sorensen sat down with Martin Sayer. What was said arrives in Martin Sayer's own words this morning, if they chose to put any of it in writing.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, pressure.tier_reached×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (1 templated fallbacks). Staff replies: 4 (0 guarded).

## Round 9

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
B
C
ORDER: EXAMINE research-future-dated-entries-in-royce-indust
```
Letters written: 0
- **interview** The Facilities supervisor → resolved (ruling): The clerk could not tell who "The Facilities supervisor" names. Units returned. Use a surname from the directory, or name a place to ask around.
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **examine** research-future-dated-entries-in-royce-indust → resolved (examined): A close reading of "Research Brief: Allegations of Future-Dated Entries in Royce Industries Mainframe Logs, 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
C
ORDER: EXAMINE photo-prairie-meridian-strip-r8
IF Maya Okafor is seen at Building 7 THEN ORDER: report Okafor to Security
```
Letters written: 0
- **examine** Photograph: the Prairie Meridian strip, night of Monday, October 17, 1977 → resolved (examined): A close reading of "Photograph: the Prairie Meridian strip, night of Monday, October 17, 1977" found nothing beyond what it says.
- **research** Vane Cattle Co. truck registrations, Ward County, 1976-1977 → resolved (ruling): The library already gave Dale Harker a brief on "Vane Cattle Co. truck registrations, Ward County, 1976-1977"; it is in the Case File. Units returned.
- **visit** East Fence perimeter sensor array → resolved (visit): Dale Harker went to the perimeter road. Gravel, three miles round, the fence on one side and prairie on the other. Tire tracks at the south-east corner that do not belong to the patrol truck.
- **examine** photo-prairie-meridian-strip-r8 → resolved (examined): A close reading of "Photograph: the Prairie Meridian strip, night of Monday, October 17, 1977" found nothing beyond what it says.
- [IF] **freeform** report Okafor to Security → skipped (ruling): Held against "Maya Okafor is seen at Building 7", which did not come about (the condition was not met). Nothing was done; units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
B
ORDER: OBTAIN the temporary clerk's file FROM Dorothy Armitage
ORDER: EXAMINE the temporary clerk's file
ORDER: RESEARCH the temporary clerk's personnel file and the three altered intake forms
```
Letters written: 0
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **obtain** the temporary clerk's file FROM Dorothy Armitage → resolved (ruling): The clerk could not match "the temporary clerk's file FROM Dorothy Armitage" to a file on the index or to anything a colleague holds. Units returned. Name the file, or say what and from whom.
- **examine** the temporary clerk's file → resolved (ruling): Nothing in the Case File matches "the temporary clerk's file". Units returned.
- **research** the temporary clerk's personnel file and the three altered intake forms → resolved (research): The company library took Marjorie Pell's request on "the temporary clerk's personnel file and the three altered intake forms"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case Fi
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
IF Gerald Voss requests the Engineering calibration logs THEN C
```
Letters written: 1
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **request_files** Engineering calibration logs for the prototype → resolved (ruling): The clerk could not match "Engineering calibration logs for the prototype" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
D
B
```
Letters written: 1
- **analyze** Sampling order, HARVEST Lot 77-B (unsigned) → resolved (ruling): There is nothing a laboratory could add to "Sampling order, HARVEST Lot 77-B (unsigned)"; the page is what it is. Units returned. EXAMINE it instead.
- **interview** Dale Harker → resolved (met): Carla Osei sat down with Dale Harker. What was said is off the record: nothing on paper to file, forward, intercept or quote. Dale Harker hears it in the morning, in Carla Osei's own words.
### Walt Sorensen (negotiator) · 57 AU · orders
Reply:
```
A
C
B
ORDER: TRAVEL back to Station R
ORDER: ATTEND the Board of Directors
ORDER: REQUEST_FILES B9 schematic
```
Letters written: 0
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **research** Ward County vehicle registration → resolved (research): The company library took Walt Sorensen's request on "Ward County vehicle registration"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **interview** Martin Sayer → resolved (conversation): Walt Sorensen sat down with Martin Sayer. What was said arrives in Martin Sayer's own words this morning, if they chose to put any of it in writing.
- **travel** back to Station R → resolved (ruling): Walt Sorensen is already at Station R. Units returned.
- **attend** the Board of Directors → resolved (attended): Walt Sorensen sat at the back of the Board of Directors session. Minutes, a budget line, a long discussion of the parking allocation; nothing before the body that a new hire would care about.
- **request_files** B9 schematic → resolved (ruling): The clerk could not match "B9 schematic" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 10

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
C
B
```
Letters written: 0
- **request_files** Facilities staff directory for October → resolved (ruling): The clerk could not match "Facilities staff directory for October" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **visit** Mainframe room, Sublevel Two → resolved (visit): Ruth Lindqvist went to Mainframe Room, Sublevel Two. The air is thick with the smell of hot plastic and ozone, and the floor tiles are cold underfoot. Rows of grey cabinets stand in tight lines, their front panels blinking with a steady, rh
- **examine** Research Brief: Julian Thorne, Information Systems → resolved (examined): A close reading of "Research Brief: Julian Thorne, Information Systems" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: MEET Carla Osei about the raw data: I have the sensor logs from the east fence. Bring the Lot 77-B sampling order to the breakroom. I want to cross-reference the timestamp on the unsigned form with the gap in the sensor feed. If the coordinates on the failed calibrations match the plat, we have a location.
IF Maya Okafor requests the Lot 77-B sampling order THEN ORDER: REPORT Okafor to Security
```
Letters written: 1
- **interview** Carla Osei → resolved (met): Dale Harker sat down with Carla Osei. What was said is off the record: nothing on paper to file, forward, intercept or quote. Carla Osei hears it in the morning, in Dale Harker's own words.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **meet** Carla Osei about the raw data: I have the sensor logs from the east fence. Bring → resolved (met): Dale Harker sat down with Carla Osei at the Building 3 breakroom. What was said is off the record: nothing on paper to file, forward, intercept or quote. Carla Osei hears it in the morning, in Dale Harker's own words.
- [IF] **report** Okafor to Security → skipped (ruling): Held against "Maya Okafor requests "Sampling order, HARVEST Lot 77-B (unsigned)"", which did not come about (the condition was not met). Nothing was done; units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
D
ORDER: EXAMINE research-the-temporary-clerks-personnel-file-
```
Letters written: 1
- **examine** Research Brief: The Temporary Clerk's Personnel File and the Three Altered Intak → resolved (examined): A close reading of "Research Brief: The Temporary Clerk's Personnel File and the Three Altered Intake Forms" found nothing beyond what it says.
- **search** Personnel & Administration Filing Cabinet → resolved (ruling): The clerk could not place "Personnel & Administration Filing Cabinet". Units returned.
- **examine** research-the-temporary-clerks-personnel-file- → resolved (examined): A close reading of "Research Brief: The Temporary Clerk's Personnel File and the Three Altered Intake Forms" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE campus-map
ORDER: EXAMINE research-the-1974-pgs-vendor-logs-and-unmarke
```
Letters written: 1
- **interview** Maya Okafor → resolved (conversation): Tom Brekke sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** research-the-1974-pgs-vendor-logs-and-unmarke → resolved (examined): A close reading of "Research Brief: The 1974 PGS Vendor Logs and Unmarked Transports" found nothing beyond what it says.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
B
```
Letters written: 0
- **examine** Sampling order, HARVEST Lot 77-B (unsigned) → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
- **interview** Dale Harker → resolved (met): Carla Osei sat down with Dale Harker. What was said is off the record: nothing on paper to file, forward, intercept or quote. Dale Harker hears it in the morning, in Carla Osei's own words.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the three calibration memos for conflicting coordinates
```
Letters written: 1
- **attend** the 0900 debrief in Conference Room 4 → resolved (ruling): Nothing on the company calendar, and no invitation you hold, matched "the 0900 debrief in Conference Room 4". Units returned. Committee sessions can be attended: ATTEND the Board, the Research Committee or the Safety Committee.
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **examine** the three calibration memos for conflicting coordinates → resolved (ruling): Nothing in the Case File matches "the three calibration memos for conflicting coordinates". Units returned.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, pressure.tier_reached×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":2,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 2 (0 guarded).

## Round 11

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE research-future-dated-entries-in-royce-indust
```
Letters written: 0
- **request_files** Insurer correspondence regarding recent incidents → resolved (ruling): The clerk could not match "Insurer correspondence regarding recent incidents" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** The Royce Report, No. 2 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** research-future-dated-entries-in-royce-indust → resolved (examined): A close reading of "Research Brief: Allegations of Future-Dated Entries in Royce Industries Mainframe Logs, 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: MEET Maya Okafor about the sensor logs: I need to cross-reference the installation date on the 'Miscellaneous Hardware' purchase order with the logbook entry. Meet me in the supply closet, I’ll bring the coffee you didn’t want.
IF Maya Okafor requests "Sampling order, HARVEST Lot 77-B (unsigned)" THEN ORDER: REPORT Okafor to Security
```
Letters written: 1
- **interview** Carla Osei → resolved (met): Dale Harker sat down with Carla Osei. What was said is off the record: nothing on paper to file, forward, intercept or quote. Carla Osei hears it in the morning, in Dale Harker's own words.
- **examine** Photograph: the Prairie Meridian strip, night of Monday, October 17, 1977 → resolved (examined): A close reading of "Photograph: the Prairie Meridian strip, night of Monday, October 17, 1977" found nothing beyond what it says.
- **meet** Maya Okafor about the sensor logs: I need to cross-reference the installation da → resolved (conversation): Dale Harker sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- [IF] **report** Okafor to Security → skipped (ruling): Held against "Maya Okafor requests "Sampling order, HARVEST Lot 77-B (unsigned)"", which did not come about (the condition was not met). Nothing was done; units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
TO: Dorothy Armitage, Maya Okafor
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
C
ORDER: REQUEST_FILES motor pool sign-out log, October 1977
IF anyone requests the motor pool log THEN C
```
Letters written: 1
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **submit_manifest** Sheriff’s official statement → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- **request_files** motor pool sign-out log, October 1977 → resolved (ruling): The clerk could not match "motor pool sign-out log, October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
B
C
ORDER: EXAMINE harvest-lot-77b-sampling-order
```
Letters written: 0
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **interview** Dale Harker → resolved (met): Carla Osei sat down with Dale Harker. What was said is off the record: nothing on paper to file, forward, intercept or quote. Dale Harker hears it in the morning, in Carla Osei's own words.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
B
D
```
Letters written: 0
- **request_files** Ward County vehicle registration, trucks, north pasture, October 1977 → resolved (ruling): The clerk could not match "Ward County vehicle registration, trucks, north pasture, October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **interview** Harold Sloane → resolved (conversation): Walt Sorensen sat down with Harold Sloane. What was said arrives in Harold Sloane's own words this morning, if they chose to put any of it in writing.
- **submit_manifest** Official statement to Ward County Sheriff → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, newsletter.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":1,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 4 (0 guarded).

## Round 12

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: ANALYZE research-future-dated-entries-in-royce-indust
ORDER: EXAMINE royce-report-r11
```
Letters written: 2
- **request_files** Julian Thorne, Information Systems → resolved (ruling): The clerk could not match "Julian Thorne, Information Systems" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **visit** Royce Industries Mainframe Room → resolved (visit): Ruth Lindqvist went to Royce Industries Mainframe Room. The air is thick with the smell of hot plastic and ozone, and the floor tiles are cold underfoot. Rows of grey cabinets stand in tight lines, their front panels blinking with a steady,
- **analyze** research-future-dated-entries-in-royce-indust → resolved (ruling): There is nothing a laboratory could add to "Research Brief: Allegations of Future-Dated Entries in Royce Industries Mainframe Logs, 1977"; the page is what it is. Units returned. EXAMINE it instead.
- **examine** royce-report-r11 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE photo-prairie-meridian-strip-r8
```
Letters written: 2
- **visit** Sheriff Dale Hollis at the Ward County Sheriff's Office → resolved (visit): Dale Harker went to Ward County Sheriff's Office. A two-story brick building with a faded flag on the porch. Inside, the air smells of stale tobacco and floor wax. The front desk is empty except for a clipboard and a landline phone.
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** photo-prairie-meridian-strip-r8 → resolved (examined): A close reading of "Photograph: the Prairie Meridian strip, night of Monday, October 17, 1977" found nothing beyond what it says.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
B
A
IF Dorothy Armitage requests the motor pool log THEN ORDER: PROTECT my desk
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE campus-map
ORDER: REQUEST_FILES Legal department correspondence log, October 1977
ORDER: REQUEST_FILES motor pool sign-out log FROM Okafor
```
Letters written: 2
- **submit_manifest** Sheriff’s official statement → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- **examine** campus-map → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **request_files** Legal department correspondence log, October 1977 → resolved (ruling): The clerk could not match "Legal department correspondence log, October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **request_files** motor pool sign-out log FROM Okafor → resolved (ruling): The clerk could not match "motor pool sign-out log FROM Okafor" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE harvest-lot-77b-sampling-order
ORDER: EXAMINE research-harvest-lot-77-b-sampling-authorizat
```
Letters written: 0
- **interview** Dale Harker → resolved (met): Carla Osei sat down with Dale Harker. What was said is off the record: nothing on paper to file, forward, intercept or quote. Dale Harker hears it in the morning, in Carla Osei's own words.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
- **examine** research-harvest-lot-77-b-sampling-authorizat → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
B
FORM 14-B
1. Joseph Pruitt, badge 4471, Information Systems
2. Monday, October 10, about 8:15 AM.
IF Harold Sloane reports me THEN ORDER: TRAVEL Stanley
```
Letters written: 2
- **interview** Harold Sloane → resolved (conversation): Walt Sorensen sat down with Harold Sloane. What was said arrives in Harold Sloane's own words this morning, if they chose to put any of it in writing.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, pressure.tier_reached×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":2,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 13

### Ruth Lindqvist (analyst) · 60 AU · missed
Reply:
```
A / D / ORDER: EXAMINE research-future-dated-entries-in-royce-indust / ORDER: RESEARCH Julian Thorne, Director, Information Systems
```
Letters written: 2
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE research-vane-cattle-co-truck-registrations-w
IF Okafor is seen at Building 7 THEN ORDER: report Okafor to Security
```
Letters written: 2
- **interview** Sheriff Dale Hollis → resolved (conversation): Dale Harker sat down with Sheriff Dale Hollis. What was said arrives in Sheriff Dale Hollis's own words this morning, if they chose to put any of it in writing.
- **examine** research-vane-cattle-co-truck-registrations-w → resolved (examined): A close reading of "Research Brief: Vane Cattle Co. truck registrations, Ward County, 1976-1977" found nothing beyond what it says.
- [IF] **freeform** report Okafor to Security → skipped (ruling): Held against "Maya Okafor is seen at Building 7", which did not come about (the condition was not met). Nothing was done; units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
D
ORDER: EXAMINE the three altered intake forms found in the Royce Report, No. 2
```
Letters written: 2
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **visit** The company library → resolved (ruling): The clerk could not place "The company library". Units returned. Name a building, a gate, a road, or a property.
- **examine** the three altered intake forms found in the Royce Report, No. 2 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE research-the-1974-pgs-vendor-logs-and-unmarke
IF Voss requests the 1974 PGS requisition form THEN ORDER: LEAK research-the-1974-pgs-vendor-logs-and-unmarke
HOLD EXCEPT Okafor
```
Letters written: 0
- **examine** Research Brief: The 1974 PGS Vendor Logs and Unmarked Transports → resolved (examined): A close reading of "Research Brief: The 1974 PGS Vendor Logs and Unmarked Transports" found nothing beyond what it says.
- **visit** Motor Pool Office → resolved (visit): Tom Brekke went to Motor Pool Office. The interior smells of heavy diesel and rust. A single man in a canvas work shirt sits behind a counter cluttered with oil-stained ledgers and a rotary phone, sorting keys into a metal tray. Rows of pic
- **examine** research-the-1974-pgs-vendor-logs-and-unmarke → resolved (examined): A close reading of "Research Brief: The 1974 PGS Vendor Logs and Unmarked Transports" found nothing beyond what it says.
- [IF] **leak** research-the-1974-pgs-vendor-logs-and-unmarke → skipped (ruling): Held against "Gerald Voss requests "Prairie Geological Services invoices, 1974 (originals)"", which did not come about (the condition was not met). Nothing was done; units returned.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
B
C
Note: The sampling order is unsigned. I need to know who had access to the sub-basement last night to see if this was pulled from the archive or forged.
```
Letters written: 0
- **visit** Dale Harker's office → resolved (visit): Carla Osei went to Dale Harker's Office. The room is a single square space off the main hall of the Tagus Municipal Annex, smelling of old paper and floor wax. A metal filing cabinet stands in the corner, next to a desk cluttered with count
- **request_files** Security Department → resolved (ruling): The clerk could not match "Security Department" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Sampling order, HARVEST Lot 77-B (unsigned) → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
C
ORDER: EXAMINE sayer-letter-with-royce-layout: Focus on the B9 note and the ring-and-bar symbol. Cross-reference with the campus map to see if B9 corresponds to Building 7 or another location.
ORDER: EXAMINE sayer-clipping: Read the text of the 1926/1976 item closely to see if the 'steer' detail matches any known incidents.
```
Letters written: 0
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **examine** sayer-letter-with-royce-layout: Focus on the B9 note and the ring-and-bar symbol → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** sayer-clipping: Read the text of the 1926/1976 item closely to see if the 'steer → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":2,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (1 templated fallbacks). Staff replies: 2 (0 guarded).

## Round 14

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
B
```
Letters written: 0
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **request_files** Terminal Access Logs, Information Systems → resolved (ruling): The clerk could not match "Terminal Access Logs, Information Systems" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: MEET Maya Okafor about the crate logs: I'm in the cafeteria at 1400. I need the sign-out times for the crates that arrived last week, specifically the ones with the missing seals. I'm not looking for trouble, just trying to reconcile the inventory for the night shift.
IF Maya Okafor requests the motor pool log THEN ORDER: PROTECT my desk
```
Letters written: 1
- **request_files** Security Incident Logs for Building 7, October 1977 → resolved (document): Records delivered a copy of "Facilities maintenance ledger, Building 7 (1977)". It is in the Case File.
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **meet** Maya Okafor about the crate logs: I'm in the cafeteria at 1400. I need the sign- → resolved (conversation): Dale Harker sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE the three altered intake forms found in the Royce Report, No. 2
IF anyone requests the motor pool log THEN ORDER: PROTECT my desk
```
Letters written: 2
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **examine** the three altered intake forms found in the Royce Report, No. 2 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE minot-daily-news-r14
HOLD
```
Letters written: 1
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **request_files** Security Department, access code rotation log → resolved (ruling): The clerk could not match "Security Department, access code rotation log" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** minot-daily-news-r14 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
B
ORDER: EXAMINE harvest-lot-77b-sampling-order
ORDER: EXAMINE minot-daily-news-r14
```
Letters written: 0
- **research** HARVEST Lot 77-B sampling authorization and chain of custody → resolved (ruling): The library already gave Carla Osei a brief on "HARVEST Lot 77-B sampling authorization and chain of custody"; it is in the Case File. Units returned.
- **examine** harvest-lot-77b-sampling-order → resolved (examined): A close reading of "Sampling order, HARVEST Lot 77-B (unsigned)" found nothing beyond what it says.
- **examine** minot-daily-news-r14 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
D
ORDER: EXAMINE minot-daily-news-r14: Look for the code rotation details and any mention of Building 9 or the night flights.
```
Letters written: 0
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **meet** M. Sayer → resolved (conversation): Walt Sorensen sat down with Martin Sayer. What was said arrives in Martin Sayer's own words this morning, if they chose to put any of it in writing.
- **examine** minot-daily-news-r14: Look for the code rotation details and any mention of Buil → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- [standing 1] **protect** my desk → resolved (protected): Walt Sorensen spent the night guarding everything on their desk and aerospace systems's files. Anyone who tried the drawer will have found it watched.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, bulletin.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":1,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Model ledger for the run

| tag | calls | ok | minutes | prompt tokens | completion tokens |
|---|---|---|---|---|---|
| bulletin | 2 | 2 | 0.4 | 808 | 686 |
| dispatch | 95 | 95 | 27.7 | 141952 | 38141 |
| extract | 85 | 85 | 14.9 | 28609 | 27487 |
| grow:skeptic | 19 | 14 | 2.9 | 55786 | 74 |
| grow:writer:place | 7 | 7 | 1.5 | 12280 | 1625 |
| neversays:Dorothy Armitage | 1 | 1 | 0.0 | 183 | 2 |
| neversays:Dr. Adrian Vale | 1 | 1 | 0.0 | 169 | 2 |
| neversays:Elmer Bernard | 2 | 2 | 0.0 | 298 | 4 |
| neversays:Maya Okafor | 2 | 2 | 0.0 | 344 | 4 |
| newsletter | 2 | 2 | 0.5 | 1027 | 927 |
| npc:Capt. Thomas Bradley | 2 | 2 | 0.7 | 5070 | 588 |
| npc:Col. (Ret.) Frank Baines | 1 | 1 | 0.3 | 2786 | 300 |
| npc:Dorothy Armitage | 22 | 22 | 7.8 | 85482 | 6347 |
| npc:Dorothy Armitage:retry1 | 4 | 4 | 1.3 | 13875 | 1095 |
| npc:Dorothy Armitage:retry2 | 2 | 2 | 0.6 | 7014 | 540 |
| npc:Dr. Adrian Vale | 3 | 3 | 0.9 | 8469 | 854 |
| npc:Dr. Elias Thorne | 4 | 4 | 1.1 | 8403 | 1131 |
| npc:Dr. Elias Thorne:retry1 | 2 | 2 | 0.5 | 4827 | 562 |
| npc:Dr. Sarah Ely | 3 | 3 | 0.9 | 8126 | 899 |
| npc:Dr. Sarah Ely:retry1 | 1 | 1 | 0.3 | 3304 | 324 |
| npc:Elmer Bernard | 10 | 10 | 3.3 | 33312 | 2946 |
| npc:Elmer Bernard:retry1 | 1 | 1 | 0.4 | 3846 | 311 |
| npc:Elmer Bernard:retry2 | 1 | 1 | 0.4 | 3892 | 303 |
| npc:Gary Vane | 1 | 1 | 0.2 | 1939 | 280 |
| npc:Gary Vane:retry1 | 1 | 1 | 0.2 | 2049 | 212 |
| npc:Gary Vane:retry2 | 1 | 1 | 0.3 | 2081 | 279 |
| npc:Gerald Voss | 9 | 9 | 3.2 | 33789 | 2810 |
| npc:Gerald Voss:retry1 | 3 | 3 | 1.1 | 9779 | 886 |
| npc:Gerald Voss:retry2 | 2 | 2 | 0.6 | 7045 | 529 |
| npc:Harold Sloane | 13 | 13 | 4.3 | 44620 | 3785 |
| npc:Harold Sloane:retry1 | 2 | 2 | 0.7 | 6500 | 595 |
| npc:Martin Sayer | 6 | 6 | 1.8 | 15934 | 1834 |
| npc:Martin Sayer:retry1 | 4 | 4 | 1.2 | 10395 | 1303 |
| npc:Martin Sayer:retry2 | 3 | 3 | 0.9 | 7373 | 940 |
| npc:Martin Sayer:retry3 | 2 | 2 | 0.6 | 4554 | 654 |
| npc:Maya Okafor | 35 | 35 | 11.5 | 117729 | 10393 |
| npc:Maya Okafor:retry1 | 8 | 8 | 2.6 | 28593 | 2276 |
| npc:Maya Okafor:retry2 | 4 | 4 | 1.3 | 14695 | 1175 |
| npc:Maya Okafor:retry3 | 2 | 2 | 0.6 | 7155 | 526 |
| npc:Sheriff Dale Hollis | 13 | 13 | 4.3 | 44826 | 3869 |
| research:skeptic | 16 | 14 | 4.1 | 53472 | 88 |
| research:writer | 21 | 20 | 7.8 | 96281 | 6614 |
| room:continuity | 27 | 22 | 5.5 | 109934 | 64 |
| room:log | 14 | 14 | 5.4 | 46827 | 6009 |
| room:propose | 14 | 14 | 5.5 | 48192 | 5557 |
| room:revise | 4 | 4 | 1.0 | 12801 | 735 |
| room:rules | 25 | 22 | 4.2 | 8866 | 94 |
| room:skeptic | 23 | 22 | 4.7 | 10330 | 63 |
| room:triage:proposal | 1 | 1 | 0.2 | 1771 | 57 |
| sim:player | 84 | 84 | 40.7 | 572636 | 20351 |
| skeptic:Capt. Thomas Bradley | 2 | 2 | 0.1 | 2131 | 4 |
| skeptic:Col. (Ret.) Frank Baines | 1 | 1 | 0.1 | 1309 | 20 |
| skeptic:Dorothy Armitage | 29 | 29 | 2.2 | 30637 | 294 |
| skeptic:Dr. Adrian Vale | 4 | 4 | 0.3 | 4256 | 45 |
| skeptic:Dr. Elias Thorne | 8 | 8 | 0.6 | 7403 | 232 |
| skeptic:Dr. Sarah Ely | 5 | 5 | 0.3 | 4743 | 91 |
| skeptic:Elmer Bernard | 17 | 17 | 1.3 | 17033 | 308 |
| skeptic:Gary Vane | 3 | 3 | 0.2 | 2830 | 56 |
| skeptic:Gerald Voss | 15 | 15 | 1.3 | 16735 | 197 |
| skeptic:Harold Sloane | 13 | 13 | 0.9 | 13020 | 62 |
| skeptic:Martin Sayer | 26 | 26 | 2.0 | 22748 | 1124 |
| skeptic:Maya Okafor | 70 | 70 | 5.2 | 67434 | 1464 |
| skeptic:Sheriff Dale Hollis | 14 | 14 | 0.9 | 13455 | 67 |

## Goals

- Ruth Lindqvist: Explain the future-dated entries in the computer records. (20) → failed
- Dale Harker: Identify who has been passing company material to outsiders. (20) → open
- Marjorie Pell: Explain three altered personnel records. (20) → failed
- Tom Brekke: Determine who approved the Tagus shipments. (15) → failed
- Carla Osei: Establish whether the HARVEST samples were obtained under legitimate authority. (20) → open
- Walt Sorensen: Recover the missing NIGHTJAR test log before the flight review. (15) → failed
