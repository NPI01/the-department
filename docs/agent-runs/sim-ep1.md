# Simulated season sim-ep1

Campaign 185a6425-5f04-4d54-83b0-5b12c7b790fd. 6 synthetic players: Ruth Lindqvist (analyst), Dale Harker (operative), Marjorie Pell (negotiator), Tom Brekke (administrator), Carla Osei (analyst), Walt Sorensen (negotiator). Started 2026-10-17T05:59:48.364Z.

## Findings (read 2026-10-17)

1. **The economy never binds.** Every player reached the 60 AU cap by Round 3 to 5 and stayed there; about a third of orders were refunded.
2. **Records holds too little.** 25 of 29 REQUEST_FILES were refused: players asked for plausible records the index does not have (colleagues' personnel files, security and maintenance logs).
3. **EXAMINE refusals, 40 of 101.** Short names with hyphens (confidentiality-clause, campus-map, sayer-clipping) still miss in heldItem; and players retried things they never held ("the jar", seven nights) because the dispatch does not state last night's refusals plainly.
4. **Menu prices are the model's, not the rules'.** Round 14 offered RESEARCH at 3 AU (rule 10), EXAMINE at 4 (3), a visit at 8 (5).
5. **Colleagues named in INTERVIEW or RECRUIT** get "could not tell whom … names", which is misleading.
6. **Unused mechanics.** No agreements, declarations, standing orders, proxies, leaks or thefts; nine IF lines, none fired; two contact sightings.
7. **Story.** 154 staff replies, 3 guarded, 0 dispatch fallbacks; Maya Okafor was written to 48 times. Sheriff Hollis contradicted canon (no record of Royce vehicles at the Vane pasture) and the Skeptic passed it. The paper printed internal pressure symptoms (access codes rotating, night flights grounded) as county news, and the dispatch gave a different reason.
8. **Goals:** Lindqvist met 10 of 20, Sorensen 5 of 15 (both late), Pell and Brekke failed, Harker and Osei open for review. Pressure tiers reached 5, mitigated 1. Elections: Osei (Research), Harker (Safety). B-77-001 failed.
9. **Cost (Rounds 5.5–14):** about 21k prompt and 2k completion tokens, 2.4 model-minutes per player-day for the engine; staff replies 36% of model time, the Room 19%, extraction on every order reply 13%. The 80 order replies are also logged as unrouted mail.

## Round 1

### Ruth Lindqvist (analyst) · 27 AU · orders
Reply:
```
D
ORDER: EXAMINE the computer records log for October 1977
IF Julian Thorne requests the computer records log THEN ORDER: PROTECT my desk
```
Letters written: 0
- **submit_manifest** Non-Disclosure and Non-Compete Agreement → resolved (mitigated): Ruth Lindqvist's paperwork (submit manifest) went through. The matter of "Security flags vehicle entries that were never logged" is, for now, handled.
- **examine** the computer records log for October 1977 → resolved (ruling): Ruth Lindqvist does not hold "Information Systems job log, October 1977". Units returned; request it first.
- [IF] **protect** my desk → skipped (ruling): Held against "Julian Thorne requests "Information Systems job log, October 1977"", which did not come about (the condition was not met). Nothing was done; units returned.
### Dale Harker (operative) · 30 AU · orders
Reply:
```
A
B
Note: New here. Watching the gatehouse logs and the map discrepancies. Keep it quiet.
```
Letters written: 1
- **examine** the two conflicting department maps → resolved (ruling): Dale Harker does not hold "Campus plat, Station R (Facilities issue)". Units returned; request it first.
- **request_files** the gatehouse vehicle log from last night → resolved (ruling): The clerk could not match "the gatehouse vehicle log from last night" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Marjorie Pell (negotiator) · 25 AU · orders
Reply:
```
B
VOTE E-77-001: Pell
VOTE E-77-002: Pell
IF Security Division requests the campus plat THEN HOLD
Note to clerk: Focused on the first assignment. Keeping the plat secure.
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
### Tom Brekke (administrator) · 30 AU · orders
Reply:
```
D
VOTE E-77-001: Osei
VOTE E-77-002: Harker
```
Letters written: 1
- **examine** what arrived in the mail → resolved (ruling): Nothing in the Case File matches "what arrived in the mail". Units returned.
### Carla Osei (analyst) · 30 AU · orders
Reply:
```
A
H
VOTE E-77-001: Osei
VOTE E-77-002: Osei
Note to the clerk: I am holding the second map and the urgent letter from Dr. Ely. I will not share the map comparison until I know who is watching.
```
Letters written: 0
- **examine** Campus plat, Station R → resolved (ruling): Carla Osei does not hold "Campus plat, Station R (Facilities issue)". Units returned; request it first.
### Walt Sorensen (negotiator) · 35 AU · hold
Reply:
```
HOLD
VOTE E-77-001: Sorensen
VOTE E-77-002: Sorensen
```
Letters written: 2

Engine: absence.ticked×1, standing.queued×1, world.grown×1, agreements.enforced×1, room.triage×1, contacts.reported×1, informants.reported×1, room.moves×1
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- world.grown: {"done":0,"held":0,"failed":0}
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- room.triage: {"decided":5}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- informants.reported: {"notes":0,"lapsed":0}
- room.moves: {"proposed":1,"committed":1}
Dispatches: 6 (0 templated fallbacks). Staff replies: 2 (0 guarded).

## Round 2

### Ruth Lindqvist (analyst) · 41 AU · orders
Reply:
```
C
VOTE E-77-001: Lindqvist
VOTE E-77-002: Lindqvist
```
Letters written: 1
- **request_files** Information Systems job log, October 1977 → resolved (document): Records delivered a copy of "Information Systems job log, October 1977". It is in the Case File.
### Dale Harker (operative) · 45 AU · orders
Reply:
```
A
B
ORDER: VISIT Fisk, review the gatehouse log for the 2:00 AM window on October 9
VOTE E-77-001: Harker
VOTE E-77-002: Harker
FORM 14-B
```
Letters written: 1
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (ruling): Nothing in the Case File matches "Non-Disclosure and Non-Compete Agreement". Units returned.
- **examine** Campus plat, Station R (department issue) → resolved (ruling): Dale Harker does not hold "Campus plat, Station R (Facilities issue)". Units returned; request it first.
- **visit** Fisk, review the gatehouse log for the 2:00 AM window on October 9 → resolved (visit): Dale Harker went to Gate 2. A booth, a barrier, a log on a clipboard. The night guard signs for anything that arrives after midnight.
### Marjorie Pell (negotiator) · 40 AU · orders
Reply:
```
A
C
VOTE E-77-001: Marjorie Pell
VOTE E-77-002: Marjorie Pell
Note to clerk: The Sheriff's letter regarding the Vane pasture is copied to my file. I am aware of the unlogged vehicles.
```
Letters written: 2
- **request_files** Security incident logs for unlogged vehicle entries → resolved (ruling): The clerk could not match "Security incident logs for unlogged vehicle entries" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
### Tom Brekke (administrator) · 34 AU · orders
Reply:
```
A
B
ORDER: RESEARCH the 1921 Halvorsen deed and the Tagus siding
IF Dr. Sarah Ely requests the HARVEST sampling order THEN ORDER: PROTECT my desk
IF Gerald Voss is seen at Building 7 THEN ORDER: REPORT Voss to Security on Form 14-B
VOTE E-77-001: Osei
VOTE E-77-002: Harker
VOTE B-77-001: ABSTAIN

Note to clerk: I am following Voss's instruction to check fuel vouchers, not the motor pool logs. I am also following the Facilities memo to not compare map copies.
```
Letters written: 2
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (ruling): Nothing in the Case File matches "Non-Disclosure and Non-Compete Agreement". Units returned.
- **interview** Gerald Voss → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
- **research** the 1921 Halvorsen deed and the Tagus siding → resolved (research): The company library took Tom Brekke's request on "the 1921 Halvorsen deed and the Tagus siding"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- [IF] **protect** my desk → skipped (ruling): Held against "Dr. Sarah Ely requests "Sampling order, HARVEST Lot 77-B (unsigned)"", which did not come about (the condition was not met). Nothing was done; units returned.
- [IF] **report** Voss to Security on Form 14-B → skipped (ruling): Held against "Gerald Voss is seen at Building 7", which did not come about (the condition was not met). Nothing was done; units returned.
### Carla Osei (analyst) · 40 AU · orders
Reply:
```
C
ORDER: RESEARCH the HARVEST Project and Dr. Martha Marsh
VOTE E-77-001: Osei
VOTE E-77-002: Osei
```
Letters written: 1
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (ruling): Nothing in the Case File matches "Non-Disclosure and Non-Compete Agreement". Units returned.
- **research** the HARVEST Project and Dr. Martha Marsh → resolved (research): The company library took Carla Osei's request on "the HARVEST Project and Dr. Martha Marsh"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Walt Sorensen (negotiator) · 55 AU · orders
Reply:
```
C
ORDER: EXAMINE sayer-clipping
ORDER: EXAMINE confidentiality-clause
```
Letters written: 1
- **examine** Campus plat, Station R → resolved (ruling): Walt Sorensen does not hold "Campus plat, Station R (Facilities issue)". Units returned; request it first.
- **examine** sayer-clipping → resolved (ruling): Nothing in the Case File matches "sayer-clipping". Units returned.
- **examine** confidentiality-clause → resolved (ruling): Nothing in the Case File matches "confidentiality-clause". Units returned.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":5}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 3

### Ruth Lindqvist (analyst) · 48 AU · orders
Reply:
```
A
ORDER: EXAMINE is-job-log-oct-77
ORDER: RESEARCH Julian Thorne Information Systems Director 1977
```
Letters written: 1
- **examine** the letter from Julian Thorne → resolved (ruling): Nothing in the Case File matches "the letter from Julian Thorne". Units returned.
- **examine** is-job-log-oct-77 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **research** Julian Thorne Information Systems Director 1977 → resolved (research): The company library took Ruth Lindqvist's request on "Julian Thorne Information Systems Director 1977"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Dale Harker (operative) · 60 AU · missed
No turn (the agent failed or had no dispatch).
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
VOTE E-77-001: Osei
VOTE E-77-002: Brekke
ORDER: REQUEST_FILES Personnel & Administration index for E-77-001 and E-77-002
ORDER: REQUEST_FILES cafeteria maintenance request log, week of October 3
```
Letters written: 2
- **request_files** Personnel & Administration index for E-77-001 and E-77-002 → resolved (ruling): The clerk could not match "Personnel & Administration index for E-77-001 and E-77-002" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **request_files** Personnel & Administration index for E-77-001 and E-77-002 → resolved (ruling): The clerk could not match "Personnel & Administration index for E-77-001 and E-77-002" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **request_files** cafeteria maintenance request log, week of October 3 → resolved (ruling): The clerk could not match "cafeteria maintenance request log, week of October 3" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Tom Brekke (administrator) · 38 AU · orders
Reply:
```
A
B
C
ORDER: RESEARCH Q3 reconciliation and Tagus shipping logs
ORDER: RECRUIT Maya Okafor
```
Letters written: 1
- **interview** Gerald Voss regarding his unsanctioned visit → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
- **submit_manifest** the audit trails requested by Finance → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- **visit** the company library to retrieve the Research Brief → resolved (ruling): The clerk could not place "the company library to retrieve the Research Brief". Units returned. Name a building, a gate, a road, or a property.
- **research** Q3 reconciliation and Tagus shipping logs → resolved (research): The company library took Tom Brekke's request on "Q3 reconciliation and Tagus shipping logs"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
- **recruit** Maya Okafor → resolved (ruling): Maya Okafor would not take the question from a stranger: one letter is not an acquaintance; write again, or go and see them. Units returned.
### Carla Osei (analyst) · 50 AU · orders
Reply:
```
B
ORDER: EXAMINE the research-the-harvest-project-and-dr-martha-ma
ORDER: RESEARCH the legal authority for biological sampling in North Dakota, 1975-1977
```
Letters written: 1
- **examine** The Research Brief on the HARVEST Project → resolved (ruling): Carla Osei does not hold "HARVEST sampling authorizations, 1976". Units returned; request it first.
- **examine** the research-the-harvest-project-and-dr-martha-ma → resolved (ruling): Carla Osei does not hold "HARVEST sampling authorizations, 1976". Units returned; request it first.
- **research** the legal authority for biological sampling in North Dakota, 1975-1977 → resolved (research): The company library took Carla Osei's request on "the legal authority for biological sampling in North Dakota, 1975-1977"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File b
### Walt Sorensen (negotiator) · 60 AU · missed
No turn (the agent failed or had no dispatch).

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×3
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":5}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":0,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 2 (1 guarded).

## Round 4

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
ORDER: EXAMINE the research-julian-thorne-information-systems-di
ORDER: REQUEST_FILES the is-job-log-oct-77 for cross-reference
ORDER: REQUEST_FILES the confidentiality-clause
IF anyone accesses the is-job-log-oct-77 THEN ORDER: PROTECT my desk
```
Letters written: 2
- **examine** the research-julian-thorne-information-systems-di → resolved (ruling): Nothing in the Case File matches "the research-julian-thorne-information-systems-di". Units returned.
- **request_files** the is-job-log-oct-77 for cross-reference → resolved (document): Records delivered a copy of "Information Systems job log, October 1977". It is in the Case File.
- **request_files** the confidentiality-clause → resolved (ruling): The clerk could not match "the confidentiality-clause" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
C
ORDER: VISIT Fisk, review the gatehouse log for the 2:00 AM window on October 9
```
Letters written: 1
- **examine** Royce Report No. 1 → resolved (ruling): Nothing in the Case File matches "Royce Report No. 1". Units returned.
- **visit** Security Office → resolved (ruling): The clerk could not place "Security Office". Units returned. Name a building, a gate, a road, or a property.
- **visit** Fisk, review the gatehouse log for the 2:00 AM window on October 9 → resolved (visit): Dale Harker went to Gate 2. A booth, a barrier, a log on a clipboard. The night guard signs for anything that arrives after midnight.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
C
ORDER: RECRUIT Tom Brekke
VOTE E-77-001: Osei
VOTE E-77-002: Brekke
```
Letters written: 1
- **examine** *The Royce Report*, No. 1 → resolved (ruling): Nothing in the Case File matches "*The Royce Report*, No. 1". Units returned.
- **recruit** Tom Brekke → resolved (ruling): The clerk could not tell whom "Tom Brekke" names. Units returned. Use a surname from the directory.
### Tom Brekke (administrator) · 42 AU · orders
Reply:
```
ORDER: EXAMINE research-q3-reconciliation-and-tagus-shipping (3 AU)
B
A
ORDER: RESEARCH Q3 reconciliation and Tagus shipping logs
ORDER: RECRUIT Maya Okafor
```
Letters written: 1
- **examine** research-q3-reconciliation-and-tagus-shipping (3 AU) → resolved (ruling): Nothing in the Case File matches "research-q3-reconciliation-and-tagus-shipping (3 AU)". Units returned.
- **examine** The Research Brief → resolved (ruling): Nothing in the Case File matches "The Research Brief". Units returned.
- **interview** Gerald Voss → resolved (conversation): Tom Brekke sat down with Gerald Voss. What was said arrives in Gerald Voss's own words this morning, if they chose to put any of it in writing.
- **research** Q3 reconciliation and Tagus shipping logs → resolved (ruling): The library already gave Tom Brekke a brief on "Q3 reconciliation and Tagus shipping logs"; it is in the Case File. Units returned.
- **recruit** Maya Okafor → resolved (recruited): Tom Brekke put the question to Maya Okafor, who agreed, for 2 AU a round. They are under Holdings on the personnel file; their first note comes with tomorrow's mail.
### Carla Osei (analyst) · 60 AU · missed
No turn (the agent failed or had no dispatch).
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
C
ORDER: EXAMINE sayer-clipping
TO: Capt. Thomas Bradley
I read your letter, and I want to get my head around what you're saying. A voice on a frequency we don't use, repeating a coordinate pair, and the compasses spinning? That's not just interference, Captain, that's a signature. I'm an engineer, I don't fly, but I've seen enough data to know when something is deliberate. I'd like to sit down with you and the co-pilot for a moment. I'm not asking for the log, just the raw feel of it. Where in Sector 4 did you lose the signal? Was it near the Restricted boundary you mentioned? I owe you a cof
```
Letters written: 1
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (ruling): Nothing in the Case File matches "The Royce Report, No. 1, Thursday, October 13, 1977". Units returned.
- **examine** sayer-clipping → resolved (ruling): Nothing in the Case File matches "sayer-clipping". Units returned.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, newsletter.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":5}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":1,"lapsed":0}
Dispatches: 7 (0 templated fallbacks). Staff replies: 4 (0 guarded).

_Resumed 2026-10-17T12:10:11.952Z after an interruption._


## Round 5

### Ruth Lindqvist (analyst) · 60 AU · orders
No turn (the agent failed or had no dispatch).
- **examine** Information Systems job log, October 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **examine** the is-job-log-oct-77 for cross-reference → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **research** the Royce Report editorial guidelines → resolved (research): The company library took Ruth Lindqvist's request on "the Royce Report editorial guidelines"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Dale Harker (operative) · 60 AU · missed
No turn (the agent failed or had no dispatch).
### Marjorie Pell (negotiator) · 60 AU · orders
No turn (the agent failed or had no dispatch).
- **request_files** The personnel files for the two new hires requesting stress leave → resolved (ruling): The clerk could not match "The personnel files for the two new hires requesting stress leave" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** The Royce Report, No. 1 → resolved (ruling): Nothing in the Case File matches "The Royce Report, No. 1". Units returned.
- **recruit** Dorothy Armitage TO: Dorothy Armitage From: Marjorie Pell Subject: A word on the → resolved (recruited): Marjorie Pell put the question to Dorothy Armitage, who agreed, for 2 AU a round. They are under Holdings on the personnel file; their first note comes with tomorrow's mail.
### Tom Brekke (administrator) · 60 AU · orders
No turn (the agent failed or had no dispatch).
- **interview** Marjorie Pell → resolved (ruling): The clerk could not tell who "Marjorie Pell" names. Units returned. Use a surname from the directory, or name a place to ask around.
- **examine** Royce Report No. 1 → resolved (ruling): Nothing in the Case File matches "Royce Report No. 1". Units returned.
- **request_files** Q3 Reconciliation Logs, lines 40-45 → resolved (ruling): The clerk could not match "Q3 Reconciliation Logs, lines 40-45" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Carla Osei (analyst) · 60 AU · orders
No turn (the agent failed or had no dispatch).
- **interview** Dr. Aris Thorne → resolved (conversation): Carla Osei sat down with Julian Thorne. What was said arrives in Julian Thorne's own words this morning, if they chose to put any of it in writing.
- **request_files** Biological Sciences files touching last night's matter → resolved (ruling): The clerk could not match "Biological Sciences files touching last night's matter" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** the royce-report-r4 → resolved (ruling): Nothing in the Case File matches "the royce-report-r4". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
No turn (the agent failed or had no dispatch).
- **interview** Capt. Thomas Bradley → resolved (conversation): Walt Sorensen sat down with Capt. Thomas Bradley. What was said arrives in Capt. Thomas Bradley's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (ruling): Nothing in the Case File matches "The Royce Report, No. 1, Thursday, October 13, 1977". Units returned.
- **examine** sayer-clipping → resolved (ruling): Nothing in the Case File matches "sayer-clipping". Units returned.
- **research** the 1921 Halvorsen property records and the Tagus siding history → resolved (research): The company library took Walt Sorensen's request on "the 1921 Halvorsen property records and the Tagus siding history"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by m

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1, research.briefed×2
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":5}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":2,"lapsed":0}
Dispatches: 7 (0 templated fallbacks). Staff replies: 6 (0 guarded).

## Round 6

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
C
ORDER: EXAMINE is-job-log-oct-77 for entries dated after October 15, 1977
IF Julian Thorne is seen at the sub-basement THEN ORDER: REPORT to Security that Julian Thorne is moving the crate without proper handling protocols
```
Letters written: 1
- **visit** Information Systems server room → resolved (visit): Ruth Lindqvist went to Information Systems Server Room. The room is cool and smells of ozone and hot dust. Rows of grey cabinets stand on a raised floor, connected by thick black cables. A single green light blinks on the central console, s
- **examine** is-job-log-oct-77 for entries dated after October 15, 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
C
ORDER: TRAVEL Tagus
ORDER: SURVEIL the St. Olaf Lutheran Church grounds after dark
VOTE E-77-001: Harker
VOTE E-77-002: Harker
```
Letters written: 1
- **visit** The main vestibule and gate area → resolved (ruling): The clerk could not place "The main vestibule and gate area". Units returned. Name a building, a gate, a road, or a property.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **travel** Tagus → resolved (travelled): Dale Harker signed out at Gate 2 and drove to Tagus. Forty minutes west on the county road, the last ten on gravel. A grain elevator, a church, a store that is also the post office, nine houses with lights in four of them. The wind does not
- **surveil** the St. Olaf Lutheran Church grounds after dark → resolved (sighting): A night watching St. Olaf Lutheran, Tagus: at 0200 the tower hummed, a low note you felt in your teeth, for eleven minutes; the caretaker stood in the door and did not look up.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
C
Note to the clerk: I am confirming my current votes on the employee seats as listed in the dispatch.
```
Letters written: 2
- **request_files** Personnel files for John Doe and Jane Smith → resolved (ruling): The clerk could not match "Personnel files for John Doe and Jane Smith" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **visit** Motor pool loading dock → resolved (ruling): The clerk could not place "Motor pool loading dock". Units returned. Name a building, a gate, a road, or a property.
- **interview** Security Office shift lead → resolved (ruling): The clerk could not tell who "Security Office shift lead" names. Units returned. Use a surname from the directory, or name a place to ask around.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
HOLD EXCEPT Okafor
IF anyone requests the fuel voucher log THEN ORDER: REPORT to Voss that I saw a colleague asking for the log at the records desk
VOTE E-77-001: Osei
VOTE E-77-002: Harker
```
Letters written: 2
- **examine** Research Brief: Q3 Reconciliation and Tagus Shipping Logs → resolved (examined): A close reading of "Research Brief: Q3 Reconciliation and Tagus Shipping Logs" found nothing beyond what it says.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
B
C
ORDER: EXAMINE the jar
VOTE E-77-001: Osei
VOTE E-77-002: Osei
```
Letters written: 2
- **research** The legal authority for biological sampling in North Dakota, 1975-1977 → resolved (ruling): The library already gave Carla Osei a brief on "The legal authority for biological sampling in North Dakota, 1975-1977"; it is in the Case File. Units returned.
- **interview** Maya Okafor → resolved (conversation): Carla Osei sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
B
D
IF Gary Vane is seen at the St. Olaf church THEN ORDER: report Gary Vane to Security
```
Letters written: 2
- **interview** Martin Sayer → resolved (conversation): Walt Sorensen sat down with Martin Sayer. What was said arrives in Martin Sayer's own words this morning, if they chose to put any of it in writing.
- **submit_manifest** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- [IF] **freeform** report Gary Vane to Security → skipped (ruling): Held against "Gary Vane is seen at St. Olaf Lutheran, Tagus", which did not come about (the condition was not met). Nothing was done; units returned.

Engine: absence.ticked×1, standing.queued×1, world.grown×1, room.triage×1, election.closed×2, contacts.reported×1, pressure.tier_reached×1, agreements.enforced×1, informants.reported×1, room.moves×1
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- world.grown: {"done":1,"held":0,"failed":0}
- room.triage: {"decided":5}
- election.closed: {"cast":6,"title":"Employee seat, Safety Committee","votes":{"0d60390c-39d6-4f4f-a9fb-bb3b98adf8a9":1,"4a6a1792-cbba-4042-b7a3-86ad52f957ef":1,"9fe9686c-81b1-4227-b99a-c1d79ef0838d":1,"dc279153-7654-4
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- election.closed: {"cast":6,"title":"Employee seat, Research Committee","votes":{"4a6a1792-cbba-4042-b7a3-86ad52f957ef":1,"9fe9686c-81b1-4227-b99a-c1d79ef0838d":1,"dc279153-7654-4b5d-8b87-c1a3ab4b7d96":3,"e74a8d03-7c9c
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- informants.reported: {"notes":2,"lapsed":0}
- room.moves: {"proposed":2,"committed":1}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Round 7

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE is-job-log-oct-77 for entries dated after October 15, 1977
```
Letters written: 1
- **examine** Information Systems job log, October 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **examine** is-job-log-oct-77 for entries dated after October 15, 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
ORDER: EXAMINE minot-daily-news-r7
ORDER: RESEARCH the Tagus siding and the 1921 Halvorsen place
TO: Elmer Bernard
TO: Harold Sloane
```
Letters written: 2
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **research** the Tagus siding and the 1921 Halvorsen place → resolved (research): The company library took Dale Harker's request on "the Tagus siding and the 1921 Halvorsen place"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
B
C
ORDER: REQUEST_FILES Personnel file for Dale Harker

Note: Clarifying that C and the ORDER line are the same request; please do not charge twice.
```
Letters written: 1
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **request_files** Personnel file for Dale Harker → resolved (ruling): The clerk could not match "Personnel file for Dale Harker" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **request_files** Personnel file for Dale Harker → resolved (ruling): The clerk could not match "Personnel file for Dale Harker" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **request_files** Personnel file for Dale Harker → resolved (ruling): The clerk could not match "Personnel file for Dale Harker" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
HOLD
VOTE B-77-001: ABSTAIN
ORDER: EXAMINE the Minot Daily News, Sunday, October 16, 1977
ORDER: RESEARCH the 1974 PGS invoices and administrative clerk records
```
Letters written: 2
- **examine** the Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **research** the 1974 PGS invoices and administrative clerk records → resolved (research): The company library took Tom Brekke's request on "the 1974 PGS invoices and administrative clerk records"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE the campus map
ORDER: RESEARCH the cold storage lab temperature log breach, October 1977
```
Letters written: 2
- **examine** Minot Daily News, Sunday, October 16, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
- **examine** the campus map → resolved (ruling): Carla Osei does not hold "Campus plat, Station R (Facilities issue)". Units returned; request it first, or EXAMINE something in the Case File.
- **research** the cold storage lab temperature log breach, October 1977 → resolved (research): The company library took Carla Osei's request on "the cold storage lab temperature log breach, October 1977"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE sayer-letter-with-royce-layout
ORDER: EXAMINE sayer-clipping
IF B-77-001 passes THEN ORDER: TRAVEL Tagus
Note: Keeping a close eye on the perimeter drift and the new reps. The layout Sayer sent is consistent with the restricted zone; will verify against the official plat when I get a chance.
```
Letters written: 1
- **examine** Newspaper clipping with a symbol circled in red → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **examine** sayer-letter-with-royce-layout → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- [IF] **travel** Tagus Note: Keeping a close eye on the perimeter drift and the new reps. The lay → skipped (ruling): Held against "B-77-001 passes", which did not come about (B-77-001 failed). Nothing was done; units returned.

Engine: bulletin.published×1, room.triage×1, agreements.enforced×1, world.grown×1, contacts.reported×1, absence.ticked×1, standing.queued×1, motion.closed×1, informants.reported×1, room.moves×1, research.briefed×3
- room.triage: {"decided":5}
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- motion.closed: {"for":3,"seats":7,"title":"Departmental Reporting Reform","number":"B-77-001","passed":false,"quorum":true,"abstain":1,"against":3,"finding":null,"motion_id":"d75764fd-b21f-4b37-9c7c-0e8f6b731632"}
- informants.reported: {"notes":2,"lapsed":0}
- room.moves: {"proposed":2,"committed":2}
Dispatches: 6 (0 templated fallbacks). Staff replies: 3 (0 guarded).

## Round 8

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
B
ORDER: EXAMINE is-job-log-oct-77 for future-dated entries and batch authority anomalies
VOTE B-77-001: AGAINST
```
Letters written: 0
- **examine** Information Systems job log, October 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **examine** is-job-log-oct-77 for future-dated entries and batch authority anomalies → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
C
ORDER: REQUISITION a camera
```
Letters written: 2
- **examine** Research Brief: The Tagus Siding and the 1921 Halvorsen Place → resolved (examined): A close reading of "Research Brief: The Tagus Siding and the 1921 Halvorsen Place" found nothing beyond what it says.
- **search** The perimeter sensor log cabinet, Building C → resolved (nothing): A search of the perimeter road turned up nothing that could be carried away. Gravel, three miles round, the fence on one side and prairie on the other. Tire tracks at the south-east corner that do not belong to the patrol truck.
- **requisition** a camera → resolved (requisitioned): Procurement stores signed a 35mm camera (procurement stock) out to Dale Harker. It is on the personnel file under Holdings, and in the requisitions log.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE minot-daily-news-r7
```
Letters written: 2
- **request_files** Dale Harker's assignment record in the Security Office → resolved (ruling): The clerk could not match "Dale Harker's assignment record in the Security Office" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **examine** minot-daily-news-r7 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
HOLD EXCEPT Okafor
Note to clerk: Proceeding with the examination of the 1974 PGS brief and a sit-down with Okafor to clarify the gate log discrepancies. Holding the rest of the night to monitor desk activity, specifically watching for any unauthorized requests to the perimeter sensor logs or my own personnel file.
```
Letters written: 0
- **examine** Research Brief: 1974 PGS Invoices and Administrative Clerk Records → resolved (examined): A close reading of "Research Brief: 1974 PGS Invoices and Administrative Clerk Records" found nothing beyond what it says.
- **interview** Maya Okafor → resolved (conversation): Tom Brekke sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
B
D
ORDER: VISIT cold storage lab at 0600
ORDER: EXAMINE the cold storage lab temperature log for Unit 4, 0300 hours
IF anyone requests the cold storage log THEN ORDER: REPORT to Corporate Security
```
Letters written: 2
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **requisition** A cassette recorder → resolved (requisitioned): Procurement stores signed a portable cassette recorder out to Carla Osei. It is on the personnel file under Holdings, and in the requisitions log.
- **visit** cold storage lab at 0600 → resolved (visit): Carla Osei went to cold storage, Building 4. A walk-in freezer with a temperature log on the door. The log for September 28 is a fresh page, the only fresh page in the book.
- **examine** the cold storage lab temperature log for Unit 4, 0300 hours → resolved (examined): A close reading of "Research Brief: Cold Storage Lab Temperature Log Breach, October 1977" found nothing beyond what it says.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: TRAVEL Tagus
ORDER: VISIT Elmer Bernard at St. Olaf Lutheran Church
IF anyone requests the motor pool log THEN ORDER: REPORT them to Security
```
Letters written: 1
- **examine** Building layout, hand-drawn (enclosed by M. Sayer) → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **request_files** Sheriff Dale Hollis's letter → resolved (ruling): The clerk could not match "Sheriff Dale Hollis's letter" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **travel** Tagus → resolved (travelled): Walt Sorensen signed out at Gate 2 and drove to Tagus. Forty minutes west on the county road, the last ten on gravel. A grain elevator, a church, a store that is also the post office, nine houses with lights in four of them. The wind does n
- **visit** Elmer Bernard at St. Olaf Lutheran Church → resolved (visit): Walt Sorensen went to St. Olaf Lutheran, Tagus. A white frame church, bell tower without a bell, the caretaker's truck outside. The cemetery behind it is better kept than the town.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":5}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":2,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (1 guarded).

## Round 9

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
B
ORDER: EXAMINE is-job-log-oct-77 for entries dated after October 17, 1977, and verify the batch authority 'J-T' against Julian Thorne's personnel records
```
Letters written: 0
- **examine** Information Systems job log, October 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **examine** is-job-log-oct-77 for entries dated after October 17, 1977, and verify the batch → resolved (examined): A close reading of "Research Brief: Julian Thorne Information Systems Director 1977" found nothing beyond what it says.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
C
ORDER: INTERVIEW Sheriff Dale Hollis
ORDER: LEAVE 1
```
Letters written: 1
- **request_files** the conflicting map coordinates cited in Engineering memos → resolved (ruling): The clerk could not match "the conflicting map coordinates cited in Engineering memos" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** The Royce Report, No. 1, Thursday, October 13, 1977 → resolved (examined): A close reading of "The Royce Report, No. 1, Thursday, October 13, 1977" found nothing beyond what it says.
- **interview** Sheriff Dale Hollis → resolved (conversation): Dale Harker sat down with Sheriff Dale Hollis. What was said arrives in Sheriff Dale Hollis's own words this morning, if they chose to put any of it in writing.
- **leave** 1 → resolved (ruling): The clerk could not make an order of "1". Units returned. Say what you want to request, watch, search, examine, or whom you want to see.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE minot-daily-news-r7
Note to clerk: I have three letters from Dorothy in my tray. I will address them in my correspondence.
```
Letters written: 2
- **interview** Maya Okafor, in the break room → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** minot-daily-news-r7 Note to clerk: I have three letters from Dorothy in my tray. → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · missed
Reply:
```
A / C / HOLD
```
Letters written: 1
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: ANALYZE the jar
```
Letters written: 2
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **visit** Building 4 Cold Storage Lab → resolved (visit): Carla Osei went to cold storage, Building 4. A walk-in freezer with a temperature log on the door. The log for September 28 is a fresh page, the only fresh page in the book.
- **analyze** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
C
ORDER: EXAMINE sayer-letter-with-royce-layout
ORDER: EXAMINE sayer-clipping
IF anyone requests the NIGHTJAR test log THEN ORDER: REPORT Sayer to Security
```
Letters written: 2
- **visit** Sheriff Dale Hollis at Tagus County Courthouse → resolved (ruling): The clerk could not place "Sheriff Dale Hollis at Tagus County Courthouse". Units returned. Name a building, a gate, a road, or a property.
- **examine** sayer-letter-with-royce-layout → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- **examine** sayer-clipping → resolved (examined): A close reading of "Newspaper clipping with a symbol circled in red (from M. Sayer)" found nothing beyond what it says.
- [IF] **report** Sayer to Security → skipped (ruling): Held against "anyone requests "Flight test log 77-ON (Prairie Meridian)"", which did not come about (the condition was not met). Nothing was done; units returned.

Engine: informants.reported×1, contacts.reported×1, absence.ticked×1, standing.queued×1, world.grown×1, room.triage×1, agreements.enforced×1, room.moves×1
- informants.reported: {"notes":2,"lapsed":0}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.triage: {"decided":5}
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- room.moves: {"proposed":2,"committed":1}
Dispatches: 6 (0 templated fallbacks). Staff replies: 6 (0 guarded).

## Round 10

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
C
ORDER: EXAMINE is-job-log-oct-77
ORDER: EXAMINE campus-map
```
Letters written: 0
- **examine** Information Systems job log, October 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **examine** is-job-log-oct-77 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **examine** campus-map → resolved (ruling): Ruth Lindqvist does not hold "Campus plat, Station R (Facilities issue)". Units returned; request it first, or EXAMINE something in the Case File.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
B
C
ORDER: RESEARCH Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records
IF Sheriff Hollis requests a warrant for company vehicles THEN ORDER: PROTECT myself
```
Letters written: 2
- **interview** Margaret Hensley → resolved (conversation): Dale Harker sat down with Margaret Hensley. What was said arrives in Margaret Hensley's own words this morning, if they chose to put any of it in writing.
- **request_files** Engineering Map Coordinate Discrepancy Memo → resolved (ruling): The clerk could not match "Engineering Map Coordinate Discrepancy Memo" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **research** Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records → resolved (research): The company library took Dale Harker's request on "Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Ca
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE minot-daily-news-r7
Note to clerk: Focusing on Okafor's records discrepancies and the NDA anomalies this round. Will address Dorothy's 'family' commentary in correspondence.
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Marjorie Pell sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **examine** minot-daily-news-r7 Note to clerk: Focusing on Okafor's records discrepancies an → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · hold
Reply:
```
HOLD EXCEPT Okafor
PROTECT my desk
IF Maya Okafor requests the campus plat THEN ORDER: OBTAIN the campus plat FROM Okafor
IF Gerald Voss is seen at Building 7 THEN ORDER: REPORT Voss to Security
VOTE E-77-001: Okafor
```
Letters written: 1
- [IF] **obtain** the campus plat FROM Okafor → skipped (ruling): Held against "Maya Okafor requests "Campus plat, Station R (Facilities issue)"", which did not come about (the condition was not met). Nothing was done; units returned.
- [IF] **report** Voss to Security → skipped (ruling): Held against "Gerald Voss is seen at Building 7", which did not come about (the condition was not met). Nothing was done; units returned.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the jar
```
Letters written: 1
- **interview** Dr. Sarah Ely → resolved (conversation): Carla Osei sat down with Dr. Sarah Ely. What was said arrives in Dr. Sarah Ely's own words this morning, if they chose to put any of it in writing.
- **examine** Campus plat, Station R → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **examine** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
C
B
ORDER: Talk to Sheriff Dale Hollis at the Halvorsen fence line: verify the tire tracks and sign off on the retrieval of E-76-19 with the county warrant
IF anyone requests "Flight test log 77-ON (Prairie Meridian)" THEN ORDER: REPORT Sayer to Security
Note to the clerk: I am bringing the coffee Okafor asked for. The Sheriff is out on the fence line, so I am meeting him there rather than at the courthouse entrance.
```
Letters written: 2
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
- **interview** Maya Okafor, Procurement → resolved (conversation): Walt Sorensen sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **freeform** Talk to Sheriff Dale Hollis at the Halvorsen fence line: verify the tire tracks  → resolved (conversation): Walt Sorensen sat down with Sheriff Dale Hollis. What was said arrives in Sheriff Dale Hollis's own words this morning, if they chose to put any of it in writing.
- [IF] **report** Sayer to Security Note to the clerk: I am bringing the coffee Okafor asked for.  → skipped (ruling): Held against "anyone requests "Flight test log 77-ON (Prairie Meridian)"", which did not come about (the condition was not met). Nothing was done; units returned.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contact.seen×2, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1, research.briefed×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":2,"watched":0,"passed_to_security":0}
- room.triage: {"decided":5}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":2,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 7 (0 guarded).

## Round 11

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE insurer-letter-urgent
```
Letters written: 0
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** Information Systems job log, October 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
- **examine** insurer-letter-urgent → resolved (ruling): Nothing in the Case File matches "insurer-letter-urgent". Units returned.
### Dale Harker (operative) · 58 AU · orders
Reply:
```
A
ORDER: EXAMINE research-sheriff-holliss-warrant-criteria-and
ORDER: TRAVEL Tagus
ORDER: VISIT St. Olaf Lutheran Church
ORDER: TRAVEL Station R
```
Letters written: 2
- **examine** Research Brief: Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed tr → resolved (examined): A close reading of "Research Brief: Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records" found nothing beyond what it says.
- **examine** research-sheriff-holliss-warrant-criteria-and → resolved (examined): A close reading of "Research Brief: Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records" found nothing beyond what it says.
- **travel** Tagus → resolved (travelled): Dale Harker signed out at Gate 2 and drove to Tagus. Forty minutes west on the county road, the last ten on gravel. A grain elevator, a church, a store that is also the post office, nine houses with lights in four of them. The wind does not
- **visit** St. Olaf Lutheran Church → resolved (visit): Dale Harker went to St. Olaf Lutheran, Tagus. A white frame church, bell tower without a bell, the caretaker's truck outside. The cemetery behind it is better kept than the town.
- **travel** Station R → resolved (travelled): Dale Harker drove back from Tagus and signed in at Gate 2.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE confidentiality-clause
Note to clerk: Pulling Sorensen's file for the record and filing the sheriff's statement to keep the channel open. Examining the NDA again with the new Report in hand.
```
Letters written: 2
- **request_files** Personnel file of Walt Sorensen → resolved (ruling): The clerk could not match "Personnel file of Walt Sorensen" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **submit_manifest** Official statement to Sheriff → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- **examine** confidentiality-clause Note to clerk: Pulling Sorensen's file for the record and → resolved (ruling): Nothing in the Case File matches "confidentiality-clause Note to clerk: Pulling Sorensen's file for the record and filing the sheriff's statement to keep the channel open. Examining the NDA again with the new Report in hand.". Units returne
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
C
HOLD EXCEPT Okafor
VOTE B-77-001: FOR

Note: The election E-77-001 referenced in the last receipt appears to be closed as per Royce Report No. 2. The vote for B-77-001 is cast as a procedural formality to maintain a visible record of participation.
```
Letters written: 1
- **request_files** Sheriff’s Office Statement Log → resolved (ruling): The clerk could not match "Sheriff’s Office Statement Log" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** Campus plat, Station R (department issue) → resolved (examined): A close reading of "Campus plat, Station R (department issue)" found nothing beyond what it says.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the jar
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Carla Osei sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 2 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
B
Note to clerk: Bringing the coffee to Okafor's desk before I head out. Sheriff wants the actual warrant document and a pen, so I am taking the physical file from my cabinet, not a copy. Also checking the gate locks with him as requested.
```
Letters written: 1
- **interview** Sheriff Dale Hollis → resolved (conversation): Walt Sorensen sat down with Sheriff Dale Hollis. What was said arrives in Sheriff Dale Hollis's own words this morning, if they chose to put any of it in writing.
- **request_files** Flight test log 77-ON (Prairie Meridian) → resolved (document): Records delivered a copy of "Flight test log 77-ON (Prairie Meridian)". It is in the Case File.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, newsletter.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":1}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":5}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":2,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Round 12

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE is-job-log-oct-77
```
Letters written: 1
- **interview** Julian Thorne, Information Systems Director → resolved (conversation): Ruth Lindqvist sat down with Julian Thorne. What was said arrives in Julian Thorne's own words this morning, if they chose to put any of it in writing.
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** is-job-log-oct-77 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
ORDER: EXAMINE the unmarked envelope
ORDER: INTERVIEW the night guard at Gate 2
```
Letters written: 0
- **request_files** The Halvorsen estate access logs for October 1977 → resolved (ruling): The clerk could not match "The Halvorsen estate access logs for October 1977" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** the unmarked envelope → resolved (ruling): Nothing in the Case File matches "the unmarked envelope". Units returned.
- **interview** the night guard at Gate 2 → resolved (conversation): Dale Harker asked around at Gate 2. The night guard, Pike, says he signs for whatever comes with a Prairie Meridian slip, and that the slips arrive already signed. He would rather not say by whom, and asks that his name stay out of it.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
C
ORDER: EXAMINE confidentiality-clause
```
Letters written: 2
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **visit** Personnel & Administration records room → resolved (visit): Marjorie Pell went to the Records room. Rows of grey cabinets, a clerk, a requisition pad. Some drawers have two labels, one over the other.
- **request_files** Dorothy Armitage's weekly observation reports → resolved (ruling): The clerk could not match "Dorothy Armitage's weekly observation reports" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** confidentiality-clause → resolved (ruling): Nothing in the Case File matches "confidentiality-clause". Units returned.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
B
C
ORDER: EXAMINE the insurer's correspondence flagged for Legal
IF Maya Okafor requests the Tagus shipping log THEN HOLD
```
Letters written: 1
- **request_files** Legal Department, Insurance Correspondence → resolved (ruling): The clerk could not match "Legal Department, Insurance Correspondence" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **examine** the insurer's correspondence flagged for Legal → resolved (ruling): Nothing in the Case File matches "the insurer's correspondence flagged for Legal". Units returned.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the jar
IF anyone requests the Cold Storage Lab Temperature Log THEN ORDER: PROTECT my desk
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Carla Osei sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **request_files** The Cold Storage Lab Temperature Log Breach → resolved (ruling): The clerk could not match "The Cold Storage Lab Temperature Log Breach" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 55 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the hand-drawn building layout
ORDER: RESEARCH the E-76-19 warrant and Prairie Meridian registration records
```
Letters written: 2
- **examine** Flight test log 77-ON (Prairie Meridian) → resolved (examined): A close reading of "Flight test log 77-ON (Prairie Meridian)": the log records a forced landing at Minot AFB that the base's own log, quoted on the facing page, does not show.
- **interview** Sheriff Dale Hollis → resolved (conversation): Walt Sorensen sat down with Sheriff Dale Hollis. What was said arrives in Sheriff Dale Hollis's own words this morning, if they chose to put any of it in writing.
- **examine** the hand-drawn building layout → resolved (examined): A close reading of "Building layout, hand-drawn (enclosed by M. Sayer)": the hand is draughtsman-trained and the note 'B9 — after the second pour' uses the company's own pour numbering, which no outsider would know.
- **research** the E-76-19 warrant and Prairie Meridian registration records → resolved (research): The company library took Walt Sorensen's request on "the E-76-19 warrant and Prairie Meridian registration records"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morn

Engine: absence.ticked×1, standing.queued×1, world.grown×1, room.triage×1, agreements.enforced×1, contacts.reported×1, room.moves×1, pressure.tier_reached×1, informants.reported×1, research.briefed×1
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- world.grown: {"done":0,"held":0,"failed":1}
- room.triage: {"decided":5}
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.moves: {"proposed":2,"committed":1}
- informants.reported: {"notes":2,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 6 (0 guarded).

## Round 13

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
B
EXAMINE is-job-log-oct-77
ANALYZE is-job-log-oct-77
```
Letters written: 1
- **examine** Information Systems job log, October 1977 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A / C / B
Note: Walt, Sheriff is at the courthouse today. No Security seen yet. I am watching the perimeter and Gate 2 for any movement related to the warrant or the Prairie Meridian slips. Will keep you posted.
```
Letters written: 1
- **research** Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records → resolved (ruling): The library already gave Dale Harker a brief on "Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records"; it is in the Case File. Units returned.
- **request_files** The Halvorsen estate access logs for October 1977, custodian: Records Division → resolved (ruling): The clerk could not match "The Halvorsen estate access logs for October 1977, custodian: Records Division" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **visit** Gate 2 security office → resolved (visit): Dale Harker went to Gate 2. A booth, a barrier, a log on a clipboard. The night guard signs for anything that arrives after midnight.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the drawer key from the Records room
IF Dorothy Armitage requests the confidentiality-clause THEN ORDER: LEAK confidentiality-clause
Note: The drawer key on the blotter is likely the key to the altered records. I will examine it and keep my distance from the records room tonight, as Okafor and Armitage are both moving through the building.
```
Letters written: 2
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** Non-Disclosure and Non-Compete Agreement → resolved (examined): A close reading of "Non-Disclosure and Non-Compete Agreement" found nothing beyond what it says.
- **examine** the drawer key from the Records room → resolved (ruling): Nothing in the Case File matches "the drawer key from the Records room". Units returned.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
C
IF Maya Okafor requests the shipping log THEN HOLD
IF Maya Okafor requests the motor pool log THEN HOLD
```
Letters written: 1
- **examine** The Royce Report, No. 2, Thursday, October 20, 1977 → resolved (examined): A close reading of "The Royce Report, No. 2, Thursday, October 20, 1977" found nothing beyond what it says.
- **research** 1974 PGS Invoices and Administrative Clerk Records → resolved (research): The company library took Tom Brekke's request on "1974 PGS Invoices and Administrative Clerk Records"; the librarian pulls the county records and the newspaper morgue overnight, and a Research Brief is in the Case File by morning.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
C
ORDER: EXAMINE the jar
```
Letters written: 2
- **interview** Maya Okafor → resolved (conversation): Carla Osei sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **examine** Transcript: Maya Okafor, Friday, October 21, 1977 → resolved (examined): A close reading of "Transcript: Maya Okafor, Friday, October 21, 1977" found nothing beyond what it says.
- **examine** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
D
IF anyone requests the flight test log THEN PROTECT myself

Clerk: Hollis is pressing for a statement on the forced landing and the missing security logs. I am filing the request to get the paperwork moving before he goes to the County Attorney. I am also examining the new research brief to see if the 'E-76-19' identifier is actually a typo for something else or a red herring, as the county records show nothing. Keeping a watch on my own movements tonight given the tension.
```
Letters written: 1
- **examine** Research Brief: The E-76-19 Warrant and Prairie Meridian Registration Records → resolved (examined): A close reading of "Research Brief: The E-76-19 Warrant and Prairie Meridian Registration Records" found nothing beyond what it says.
- **submit_manifest** Request for written statement on forced landing → resolved (ruling): There is nothing for submit manifest to act on this week. Units returned.
- [IF] **protect** myself → skipped (ruling): Held against "anyone requests "Flight test log 77-ON (Prairie Meridian)"", which did not come about (the condition was not met). Nothing was done; units returned.

Engine: agreements.enforced×1, world.grown×1, room.moves×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, research.briefed×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":0,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":2}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":2,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Round 14

### Ruth Lindqvist (analyst) · 60 AU · orders
Reply:
```
C
B
ORDER: EXAMINE is-job-log-oct-77
```
Letters written: 1
- **interview** Maya Okafor → resolved (conversation): Ruth Lindqvist sat down with Maya Okafor. What was said arrives in Maya Okafor's own words this morning, if they chose to put any of it in writing.
- **request_files** Security access code rotation log → resolved (ruling): The clerk could not match "Security access code rotation log" to any file on the company's index. Units returned. Name the file, the office, or the person who keeps it.
- **examine** is-job-log-oct-77 → resolved (examined): A close reading of "Information Systems job log, October 1977": every future-dated job was run from terminal 00 (the console) at 0300 under batch authority J-T, while the operator shift log for those nights lists nobody on duty.
### Dale Harker (operative) · 60 AU · orders
Reply:
```
A
B
ORDER: SURVEIL Gate 2 and the Prairie Meridian access road from 2000 to 0400
ORDER: REQUISITION a camera
```
Letters written: 0
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **examine** Research Brief: Sheriff Hollis's warrant criteria → resolved (examined): A close reading of "Research Brief: Sheriff Hollis's warrant criteria and the 1921 Halvorsen deed transfer records" found nothing beyond what it says.
- **surveil** Gate 2 and the Prairie Meridian access road from 2000 to 0400 → resolved (sighting): A night watching the Prairie Meridian strip: the helicopter went out at 0105 without lights and came back at 0220; the pilot sat in the cockpit for twenty minutes before he climbed down. The camera has it; the print is in the Case File.
- **requisition** a camera → resolved (ruling): Dale Harker already holds a 35mm camera (procurement stock). Units returned.
### Marjorie Pell (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE minot-daily-news-r14
IF Dorothy Armitage requests the confidentiality-clause THEN C
```
Letters written: 2
- **examine** Minot Daily News, Sunday, October 23, 1977 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 23, 1977" found nothing beyond what it says.
- **interview** Dorothy Armitage → resolved (conversation): Marjorie Pell sat down with Dorothy Armitage. What was said arrives in Dorothy Armitage's own words this morning, if they chose to put any of it in writing.
- **examine** minot-daily-news-r14 → resolved (examined): A close reading of "Minot Daily News, Sunday, October 16, 1977" found nothing beyond what it says.
### Tom Brekke (administrator) · 60 AU · orders
Reply:
```
A
B
VOTE B-77-001: ABSTAIN
```
Letters written: 1
- **examine** Research Brief: 1974 PGS Invoices and Administrative Clerk Records → resolved (examined): A close reading of "Research Brief: 1974 PGS Invoices and Administrative Clerk Records" found nothing beyond what it says.
- **request_files** Procurement & Logistics → resolved (document): Records delivered a copy of "Equipment requisition log, Procurement stores (October 1977)". It is in the Case File.
### Carla Osei (analyst) · 60 AU · orders
Reply:
```
A
B
ORDER: EXAMINE the jar
```
Letters written: 2
- **examine** Transcript: Maya Okafor, Saturday, October 22, 1977 → resolved (examined): A close reading of "Transcript: Maya Okafor, Saturday, October 22, 1977" found nothing beyond what it says.
- **visit** Dr. Sarah Ely’s office → resolved (visit): Carla Osei went to Dr. Sarah Ely’s office. A single desk sits beneath a north-facing window, holding a stack of unopened memos and a brass ashtray with two unsmoked cigarettes. The chair is leather, worn smooth on the armrests, and a potted
- **examine** the jar → resolved (ruling): Nothing in the Case File matches "the jar". Units returned.
### Walt Sorensen (negotiator) · 60 AU · orders
Reply:
```
A
B
ORDER: TRAVEL Minot
IF Sheriff Dale Hollis is seen at the courthouse THEN ORDER: VISIT the courthouse steps and speak with him in person
```
Letters written: 2
- **examine** Flight test log 77-ON (Prairie Meridian) → resolved (examined): A close reading of "Flight test log 77-ON (Prairie Meridian)": the log records a forced landing at Minot AFB that the base's own log, quoted on the facing page, does not show.
- **interview** Dale Harker → resolved (ruling): The clerk could not tell who "Dale Harker" names. Units returned. Use a surname from the directory, or name a place to ask around.
- **travel** Minot → resolved (travelled): Walt Sorensen signed out at Gate 2 and drove to Minot. Fifty miles east: the courthouse, the sheriff's office behind it, the Daily News on Main, two motels, the base traffic on the bypass. The only place in the county where nobody looks up 

Engine: agreements.enforced×1, world.grown×1, room.moves×1, bulletin.published×1, contacts.reported×1, room.triage×1, absence.ticked×1, standing.queued×1, pressure.tier_reached×1, informants.reported×1
- agreements.enforced: {"done":0,"breached":0,"fulfilled":0}
- world.grown: {"done":1,"held":0,"failed":0}
- room.moves: {"proposed":2,"committed":2}
- contacts.reported: {"seen":0,"watched":0,"passed_to_security":0}
- room.triage: {"decided":0}
- absence.ticked: {"placed":[],"returned":[],"reassigned":[]}
- standing.queued: {"queued":0,"suspended":0}
- informants.reported: {"notes":2,"lapsed":0}
Dispatches: 6 (0 templated fallbacks). Staff replies: 5 (0 guarded).

## Model ledger for the run

| tag | calls | ok | minutes | prompt tokens | completion tokens |
|---|---|---|---|---|---|
| bulletin | 2 | 2 | 0.3 | 706 | 473 |
| dispatch | 60 | 60 | 18.1 | 90286 | 24392 |
| extract | 130 | 128 | 19.0 | 39283 | 34208 |
| grow:skeptic | 4 | 4 | 1.4 | 15880 | 8 |
| grow:writer:person_at_place | 3 | 3 | 1.4 | 8168 | 1878 |
| grow:writer:place | 2 | 2 | 0.4 | 2391 | 435 |
| neversays:Dr. Adrian Vale | 2 | 2 | 0.0 | 329 | 4 |
| neversays:Dr. Sarah Ely | 4 | 4 | 0.1 | 696 | 8 |
| neversays:Margaret Hensley | 1 | 1 | 0.0 | 173 | 2 |
| neversays:Maya Okafor | 2 | 2 | 0.0 | 314 | 4 |
| neversays:Sheriff Dale Hollis | 1 | 1 | 0.0 | 177 | 2 |
| newsletter | 1 | 1 | 0.2 | 592 | 398 |
| npc:Capt. Thomas Bradley | 1 | 1 | 0.3 | 3471 | 303 |
| npc:Dorothy Armitage | 20 | 20 | 6.8 | 77273 | 5321 |
| npc:Dr. Adrian Vale | 1 | 1 | 0.2 | 2270 | 265 |
| npc:Dr. Aris Kovic | 1 | 1 | 0.3 | 2031 | 345 |
| npc:Dr. Aris Kovic:retry1 | 1 | 1 | 0.3 | 2127 | 249 |
| npc:Dr. Sarah Ely | 11 | 11 | 4.2 | 42540 | 3626 |
| npc:Dr. Sarah Ely:retry1 | 6 | 6 | 2.1 | 24506 | 1757 |
| npc:Dr. Sarah Ely:retry2 | 2 | 2 | 0.7 | 8432 | 616 |
| npc:Dr. Sarah Ely:retry3 | 1 | 1 | 0.3 | 3989 | 272 |
| npc:Elmer Bernard | 3 | 3 | 1.1 | 10509 | 1113 |
| npc:Elmer Bernard:retry1 | 1 | 1 | 0.4 | 4119 | 304 |
| npc:Gerald Voss | 2 | 2 | 0.7 | 8469 | 595 |
| npc:Harold Sloane | 2 | 2 | 0.7 | 6718 | 589 |
| npc:Julian Thorne | 2 | 2 | 0.8 | 8268 | 704 |
| npc:Margaret Hensley | 6 | 6 | 2.1 | 18678 | 2107 |
| npc:Margaret Hensley:retry1 | 1 | 1 | 0.4 | 3737 | 319 |
| npc:Martin Sayer | 1 | 1 | 0.3 | 2132 | 311 |
| npc:Maya Okafor | 48 | 48 | 15.3 | 166641 | 12787 |
| npc:Maya Okafor:retry1 | 9 | 9 | 3.1 | 31382 | 2749 |
| npc:Maya Okafor:retry2 | 3 | 3 | 1.1 | 10224 | 870 |
| npc:Maya Okafor:retry3 | 2 | 2 | 0.6 | 6373 | 536 |
| npc:Sheriff Dale Hollis | 19 | 19 | 6.9 | 73055 | 5979 |
| npc:Sheriff Dale Hollis:retry1 | 1 | 1 | 0.3 | 3471 | 330 |
| research:skeptic | 14 | 14 | 4.4 | 54052 | 28 |
| research:writer | 9 | 9 | 4.0 | 43606 | 3220 |
| room:continuity | 15 | 14 | 3.4 | 70083 | 42 |
| room:log | 9 | 9 | 3.9 | 37764 | 4147 |
| room:propose | 9 | 9 | 4.2 | 36614 | 4201 |
| room:revise | 2 | 2 | 0.6 | 7166 | 350 |
| room:rules | 14 | 14 | 3.6 | 5767 | 28 |
| room:skeptic | 14 | 14 | 3.5 | 6707 | 46 |
| room:triage:proposal | 37 | 37 | 6.7 | 104500 | 1741 |
| sim:player | 57 | 54 | 27.4 | 354138 | 17299 |
| skeptic:Capt. Thomas Bradley | 1 | 1 | 0.1 | 998 | 2 |
| skeptic:Dorothy Armitage | 20 | 20 | 1.2 | 18174 | 40 |
| skeptic:Dr. Adrian Vale | 2 | 2 | 0.1 | 1906 | 41 |
| skeptic:Dr. Aris Kovic | 3 | 3 | 0.2 | 2967 | 55 |
| skeptic:Dr. Sarah Ely | 34 | 34 | 2.6 | 32869 | 866 |
| skeptic:Elmer Bernard | 5 | 5 | 0.4 | 5668 | 78 |
| skeptic:Gerald Voss | 2 | 2 | 0.1 | 1954 | 4 |
| skeptic:Harold Sloane | 2 | 2 | 0.1 | 2163 | 4 |
| skeptic:Julian Thorne | 2 | 2 | 0.1 | 1867 | 4 |
| skeptic:Margaret Hensley | 9 | 9 | 0.7 | 8930 | 214 |
| skeptic:Martin Sayer | 1 | 1 | 0.1 | 756 | 2 |
| skeptic:Maya Okafor | 81 | 81 | 5.6 | 76035 | 1380 |
| skeptic:Sheriff Dale Hollis | 23 | 23 | 1.5 | 22370 | 157 |

## Goals

- Ruth Lindqvist: Explain the future-dated entries in the computer records. (20) → met (10 awarded)
- Dale Harker: Identify who has been passing company material to outsiders. (20) → open
- Marjorie Pell: Explain three altered personnel records. (20) → failed
- Tom Brekke: Determine who approved the Tagus shipments. (15) → failed
- Carla Osei: Establish whether the HARVEST samples were obtained under legitimate authority. (20) → open
- Walt Sorensen: Recover the missing NIGHTJAR test log before the flight review. (15) → met (5 awarded)
