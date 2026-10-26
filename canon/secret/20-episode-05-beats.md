# Episode 05 — beat sheet

SECRET CANON v1 (2026-10-23). Engine and GM only. PROPOSED until Nathan confirms. Compiled
from `19-episode-05-world.md` (engine) and `16-season-one-chronology.md` §Episode 05 into one
round-by-round order. The console renders this table at `/admin/plans/5`.

Round 1 is Sunday 11 December 1977; Round 14 is Saturday 24 December, Christmas Eve.

## Beats
| Round | Kind | Beat | Seen by | Source |
|---|---|---|---|---|
| 1 | letter | Vale gives notice of R-77-005; Rud sends members the practice; Sloane posts a guard (door open) or closes the matter (door sealed) | by route | 19 §Scheduled mail |
| 1–3 | pressure | Tier 1: the magnetometer signed out to nobody; a guard and a protocol. Not mitigable | everyone notices | 19 §Pressure |
| 2 | letter | Sayer to members: the plate in the windbreak (sealed) or the guard's empty hour (open); the fourth night at 0200, all together | Congregation members | 19 §Scheduled mail |
| 3 | letter | Kovic to ep5-3: the magnetometer from the bench 4 cabinet, Form 23 before you speak to anyone, a place on JANUS | ep5-3 holder | 19 §Scheduled mail |
| 3–5 | staff | The plate watched: six lamps go down at 0200, five come up at 0340 | whoever watches | 19 §Places |
| 4 | letter | Thorne to members: tonight; do not count | Congregation members | 19 §Scheduled mail |
| 4 | check | The Congregation's group descent: any member who DESCENDs tonight with another on the stairs stops at threshold 2, whatever they believe | the descenders | stairway.ts |
| 4–6 | pressure | Tier 2: lamps in the windbreak; the estate's lawyer complains of trespass. Mitigated by `ORDER: ISSUE_STATEMENT` (Security) | everyone notices | 19 §Pressure |
| 5 | letter | Pfeifer, unsigned, to ep5-1 (sealed): somebody has been at the plate; go alone, in daylight | ep5-1 holder | 19 §Scheduled mail |
| 6 | letter | Bradley to ep5-1: the orange light for eleven minutes; his unfiled note for what it looks like from underneath | ep5-1 holder | 19 §Scheduled mail |
| 7 | decision | R-77-005 opens at the lock | Research Committee; next dispatch | 19 §Governance |
| 7–9 | pressure | Tier 3: the ballot scheduled; Vale asks Personnel who has been to Tagus. Not mitigable | everyone notices | 19 §Pressure |
| 8 | letter | Brandvold to ep5-5: go alone; two beliefs stop the stairs where they meet | ep5-5 holder | 19 §Scheduled mail |
| 9 | letter | Rud to ep5-6: two accounts that agree are no good; a third that does not | ep5-6 holder | 19 §Scheduled mail |
| any | check | A lone descender with enough specific belief reaches the fourth threshold and meets Marsh, who says "You are early. Find the original date." and leaves a card on the twelfth step; the first to do so in the campaign fixes `encounter.marsh.first` | that descender | stairway.ts |
| any | check | Three Reports of Descent in one round that disagree on the count: containment (Index −3, descents capped at 1 that round and the next); two that agree: Index +2 | the filers | stairway.ts |
| 10–12 | pressure | Tier 4: two employees report lost hours; the company doctor. Mitigated by `ORDER: APPROVE_OVERTIME` (Personnel) | everyone notices | 19 §Pressure |
| 11 | letter | Vale: show me the readings before the vote, from your own hands | Applied Physics, Materials | 19 §Scheduled mail |
| 13 | decision | R-77-005 closes at the lock, after the night's orders; finding `tagus_experiments_authorized` either way | Research Committee; next dispatch | 19 §Governance |
| 13 | letter | Armitage to all: offices close at noon on the 24th; lost hours go on a 14-B and nowhere else | every player | 19 §Scheduled mail |
| 13–14 | pressure | Tier 5: Christmas Eve; a date on a document is not the date remembered. Not mitigable | everyone notices | 19 §Pressure |
| 14 | letter | Kovic to ep5-3: authorized (phase one in the new year, with observers he chooses) or refused (New Year's Eve, with or without the Committee) | ep5-3 holder | 19 §Scheduled mail |
| 14 | check | Goals ep5-1 to 6 judged at the lock | each player, privately | 19 §Goals |
| 14 | check | Carried forward: every descender's thresholds and disturbances; the Index; who met whom; the finding; whether the practice held | engine | 19 §Carries forward |

## From the first run (sim-ep3to5-au20, 2026-10-24)
The cohort had sealed the door in Episode 4, and nobody got down in Episode 5: seventeen
DESCEND orders, eleven ruled "knows no other way down", six beyond balance. The one player told
of the plate researched it and never stood at it. Fixed: the ruling now says where the other
way is; Sayer's and Pfeifer's letters leave a page in the Case File that counts as knowing it;
"VISIT Tagus" is read as TRAVEL; a Form 23 from someone who never went below is filed but is not
an account. The magnetometer refused outside Applied Physics, as designed; nobody wrote to
Kovic for it.

## Gaps
- The group descent on the fourth night is enacted only through the cap: members who DESCEND
  the same night stop at 2. Nothing makes them go; the card, Sayer's and Thorne's letters pull.
- The encounter pool beyond Marsh (Greeley, Wren) is narration only; nothing carries forward
  from meeting them but the knowledge row.
- The seventh threshold is not reachable; it is Episode 10's.
- The magnetometer is Applied Physics' to sign for; a colleague elsewhere asks Kovic by letter,
  and since 2026-10-26 the handover (GIVES) covers equipment a department signs for, so his yes
  puts the instrument in the writer's hands. Episode 5's goals are also dealt first to whoever
  has stood at the cellar or the plate (GOAL_PREFERS, goals.ts), after a run in which the
  descents and the descent goals were held by different people.

CHANGELOG: v1 compiles Episode 05's engine plan into a round-by-round beat sheet with sources and open gaps.
