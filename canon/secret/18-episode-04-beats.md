# Episode 04 — beat sheet

SECRET CANON v1 (2026-10-18). Engine and GM only. PROPOSED until Nathan confirms. Compiled
from `17-episode-04-world.md` (engine), `16-season-one-chronology.md` §Episode 04 and
`10-episode-arcs.md` §Episode 04 into one round-by-round order. The showrunner console
renders this table as the episode timeline (`/admin/plans/4`).

Round 1 is Thursday 24 November 1977 (Thanksgiving); Round 14 is Wednesday 7 December.

## Beats
Kinds: `dispatch`, `letter`, `decision`, `pressure`, `staff`, `deadline`, `check`, as in 09.

| Round | Kind | Beat | Seen by | Source |
|---|---|---|---|---|
| 1 | letter | PGS reports Brandvold overdue to Voss, with his last message (three depths from one bolt, all at 1640) | Procurement, Security | 17 §Scheduled mail |
| 1 | letter | Bernard: a man came up out of the ground Thursday night and walked west | every player | 17 §Scheduled mail |
| 1–3 | pressure | Tier 1: the sheriff asks in writing who PGS answers to. Mitigated by `ORDER: ISSUE_STATEMENT` (Security or Procurement) | everyone notices | 17 §Pressure |
| 2 | letter | Hollis: missing person; "a telephone that rings in your building" | Security, Personnel | 17 §Scheduled mail |
| 2 | letter | Armitage sends Personnel to call on Mrs. Rud; take her nothing, do not ask for the book | Personnel | 17 §Scheduled mail |
| 3 | staff | Sloane sponsors S-77-004, Closure of the Tagus Utility Structure; opens at the lock | Safety Committee; next dispatch | 17 §Governance |
| 3–7 | staff | Lobbying on S-77-004: Voss turns certain once his own name is on a PGS paper; Hensley turns against once told the depths are real; Baines does not move | the players who engage | 17 §Governance |
| 4 | letter | Vale: one honest witness on the landing; the church clock against your watch | Applied Physics, Materials | 17 §Scheduled mail |
| 4–6 | pressure | Tier 2: the wife is in the paper; Finance asks for PGS's incorporation papers. Mitigated by `ORDER: CLEAR_INVOICES` (Procurement) | everyone notices | 17 §Pressure |
| 5 | letter | Kovic: the hand magnetometer, the twelfth step and the wall, a place on JANUS | Applied Physics | 17 §Scheduled mail |
| 6 | letter | Baines: objection on contractual grounds; apply to the CFO for the contract and explain yourself to the Chairman | Aerospace, Security | 17 §Scheduled mail |
| 6 | letter | Rud to members of the Vigil: the company's man is with us; do not tell them | Vigil members | 17 §Scheduled mail |
| 7 | decision | S-77-004 closes at the lock: majority of votes, five seats plus the employee seat; finding `tagus_structure_sealed` either way | Safety Committee; result in the next dispatch | 17 §Governance |
| 7–9 | pressure | Tier 3: the ballot closes; a Dakota Concrete truck on the Tagus road either way. Not mitigable | everyone notices | 17 §Pressure |
| 8 | letter | Voss: PGS is mine; nobody writes to the sheriff | Procurement | 17 §Scheduled mail |
| 8–10 | staff | Whoever goes down reaches the wall at about twenty steps; two tapes on one bolt read 11 and 40 ft; the first stairway rule, learned by standing on it | the players who go | 16 §Episode 04 |
| 9 | letter | Rud to the holder of ep4-1: he is not lost; come alone, in daylight, without a form | ep4-1 holder | 17 §Scheduled mail |
| 10 | letter | Sayer to members of the Congregation: the ventilation shaft under the windbreak plate; come down with us in April | Congregation members | 17 §Scheduled mail |
| 10 | check | Twist: the contract index's 1969 line already lists the three depths; the land was bought because of the hole. Known to whoever examines the index | that player | 16 §Episode 04 |
| 10–12 | pressure | Tier 4: the federal letter to the Chairman; Aerospace lit past midnight. Not mitigable | everyone notices | 17 §Pressure |
| 12 | letter | Ashby to the Chairman: inspection of Verification Site T on the 6th; report any alteration since the 23rd with the officer's name | Procurement, Personnel, Aerospace | 17 §Scheduled mail |
| 13 | letter | Brandvold to the holder of ep4-1: three days, one night; the torn page; don't let them pour with anyone inside | ep4-1 holder | 17 §Scheduled mail |
| 13 | deadline | Last round to find Brandvold for full points on ep4-1 (the letter completes it late at 5) | ep4-1 holder | 17 §Goals |
| 13 | staff | If sealed: the pour. If open: Ashby at the cellar in a good coat with two trucks (the day 8–14 sighting) | whoever watches the cellar | 17 §Places |
| 13–14 | pressure | Tier 5: the door poured or guarded; the tower hums from the road; the sheriff wants a statement. Mitigated by `ORDER: ISSUE_STATEMENT` (Security) | everyone notices | 17 §Pressure |
| 14 | check | Goals ep4-1, 2, 4, 5, 6 judged at the lock; ep4-3 keeps judging through Episode 7 | each player, privately | 17 §Goals |
| 14 | check | Carried forward: `finding.tagus_structure_sealed`; who holds the index; who has `visited.tagus-cellar`; whether Brandvold was met; Sandvik named or not | engine | 17 §Carries forward |

Each pressure tier reached adds +2 to the Convergence Index; each mitigation refunds 1, as in
Episode 01. A visit to the cellar adds the `visited.tagus-cellar` row that Episode 5 reads as
the start of an expectation profile.

## Gaps
- The "man in a suit" at the cellar on day 13 is Ashby; the engine has no way to put a named
  NPC in a sighting, so the text does not name him. Fine for now; a player who has his letter
  will know the coat.
- Brandvold is met at the farm only by letter and sighting: an interview at the farm meets Rud
  (`npc_state.place`). If both should be meetable there, resolve.ts needs to pick by name
  before falling back to the place's one occupant.
- The sealing itself (concrete on day 12 or 13) is narrated by the pressure band and the
  sighting, not enacted: nothing in the engine closes `tagus-cellar` after a passed motion. If
  Episode 5 needs the cellar unreachable when sealed, a `closedBy: { finding }` field on
  PlaceDef is the smallest change.
- Control of the site beyond sealed/open is read by Episode 5 from the finding and whether
  Ashby's inspection was held; no separate facts row is written.

CHANGELOG: v1 compiles Episode 04's engine plan into a round-by-round beat sheet with sources and open gaps.
