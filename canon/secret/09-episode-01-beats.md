# Episode 01 — beat sheet

SECRET CANON v1 (2026-10-11). Engine and GM only. PROPOSED until Nathan confirms.
Compiled by Claude from `canon/04-episode-01-orientation.md` (public) and
`canon/secret/07-episode-01-engine.md` (engine) into one round-by-round order. No new
beats: every row cites its source, and anything canon leaves open says TBD. Rounds with
no row have nothing scheduled beyond the pressure band they sit in. The showrunner
console renders this table as the episode timeline (`/admin/plans/1`).

Round 1 is Monday, October 10, 1977; Round 14 is Sunday, October 23, 1977.

## Beats
Kinds: `dispatch` (goes out in the morning mail), `letter` (in-world correspondence
arriving), `decision` (a vote or election closes), `pressure` (the clock band; advances at
the lock of its last round unless mitigated), `staff` (an NPC acts or makes an offer),
`deadline` (an objective's timing), `check` (the engine evaluates something).

| Round | Kind | Beat | Seen by | Source |
|---|---|---|---|---|
| 1 | dispatch | Round 1 document pack: offer letter, Vale's orientation memo, the confidentiality clause, and department maps that disagree about Building 7 (and an unlabelled Building 9) | every player | 04 §Round 1 Document Pack |
| 1 | letter | Irregularity 1: Ely's HARVEST requisition to Voss (Lot 77-B never logged; she writes as if Marsh were still expected) | TBD: which players are routed each irregularity | 04 §Irregularity 1 |
| 1 | letter | Irregularity 2: Sloane's perimeter-breach memo to Fisk naming NIGHTJAR | TBD | 04 §Irregularity 2 |
| 1 | letter | Irregularity 3: Sheriff Hollis's letter to Sloane about Royce trucks beside a drained steer | TBD | 04 §Irregularity 3 |
| 1 | letter | Elmer Bernard writes from Tagus about the hum and the bell (St. Olaf's bell was removed in 1961) | TBD: one new hire or all | 04 §NPC Letter 1 |
| 1 | letter | Martin Sayer writes from Yonkers about the pattern and the symbol, claiming knowledge of Royce building layouts | TBD: one new hire or all | 04 §NPC Letter 2 |
| 2 | letter | The sealed instruction on B-77-001 reaches whoever holds ep1-9, from the Office of the Chairman, saying CARRY or FAIL (facts `goal.instruction.ep1-9`); typed on the CFO's machine, which EXAMINE can notice | ep1-9 holder only | 16 §Episode 01; episode-01-mail.ts |
| 2 | letter | Okafor to the ep1-1 holder: the 1974 PGS payables are in the basement, lunch Thursday. Sloane to the ep1-2 holder: find who writes back to Sayer | goal holders | episode-01-mail.ts |
| 1–2 | pressure | Tier 1: Security flags vehicle entries that were never logged. Mitigated by any player's `ORDER: SUBMIT_MANIFEST` | everyone notices | 04 §World pressure; 07 §Pressure clock |
| 2–7 | staff | Lobbying on B-77-001: Vale offers a clearance-3 recommendation to any player who lobbies against it; Crane moves on evidence of financial exposure (Tagus invoices, SENTINEL overrun) or a Research Committee seat for his nominee; Baines flips on proof NIGHTJAR flights serve HARVEST sampling without his sign-off | the players who engage | 07 §The Round 7 motion |
| 2–5 | staff | Hensley sponsors B-77-001 "Departmental Reporting Reform". TBD: exact round (the charter requires sponsorship 2–5 rounds before the close) | Board; announced in the next dispatch | 07 §The Round 7 motion; 03 §Motions |
| 3 | decision | Employee seat election closes: E-77-001 (Research) and E-77-002 (Safety), plurality of cohort votes, ties to the earliest nomination; winners get clearance 2 at once. TBD: when nominations open | every player | 04 §The episode; 07 §Employee seat election |
| 4 | letter | Elias Thorne to ep1-3: the roster, the prototypes, and the calibration authorization that has not come back. Armitage to ep1-4: the roster has one name more than badges. Hensley to ep1-7: come and foot 77-S | goal holders | episode-01-mail.ts |
| 5 | letter | Baines to ep1-6: has Bio asked for night support? Julian Thorne to ep1-8: noise in the job log, report to nobody in Building 1 | goal holders | episode-01-mail.ts |
| 3 | letter | Capt. Bradley's memo to Col. Baines (dated October 12) on Flight 77-ON: compasses spun, a voice on VHF repeating a coordinate pair (four miles south of Tagus), a forced landing at Minot AFB the base log does not show | TBD: whoever reaches Aerospace files or Bradley | 04 §NPC Letter 3 |
| 3–4 | pressure | Tier 2: night flights move to 0200; Finance asks Procurement for audit trails. Mitigated by Aerospace approving corridors or Finance clearing invoices | everyone notices | 04 §World pressure; 07 §Pressure clock |
| 5–6 | pressure | Tier 3: two new hires request stress leave; lab access requests back up. Mitigated by a department head granting coverage (`ORDER: APPROVE_OVERTIME`) | everyone notices | 04 §World pressure; 07 §Pressure clock |
| 6 | letter | Sayer's letter with a Royce building layout reaches the Cult Recruit (asset `sayer_letter_with_royce_layout`) | Cult Recruit | 07 §Assets seeded |
| 7 | decision | B-77-001 closes at the lock: majority of votes cast, seven seats, quorum four. Starting positions FOR Hensley, Sloane, Armitage; AGAINST Royce, Vale, Baines; Crane undecided | Board; result in the next dispatch | 04 §The episode; 07 §The Round 7 motion |
| 7–8 | pressure | Tier 4: perimeter sensors log magnetic drift; the Board vote is scheduled. Mitigated when the motion closes, either way | everyone notices | 04 §World pressure; 07 §Pressure clock |
| 8 | letter | Crane to ep1-7: "I have not read a return"; a memorandum with a page behind it before the 16th moves his vote | ep1-7 holder | episode-01-mail.ts |
| 9 | check | The ORPHEUS field calibration runs at the lock unless Building 7 is sealed by directive tonight or the countersigned authorization (held by Elias Thorne, cl. 4) is in a player's hands by any route but Records; the result is `facts operation.orpheus_calibration_r9` { status }, a line in every dispatch, and a knowledge row on every player; who stopped it is never told | every player | operations.ts; 07 §Private objectives (10) |
| 10 | letter | Hollis to Security: a written statement on the Vane trucks by Friday or the county attorney writes next (tier 6's mitigation) | Security, Personnel | episode-01-mail.ts |
| 12 | letter | Vale to ep1-3: walk the perimeter path at dusk and say whether, not what | ep1-3 holder | episode-01-mail.ts |
| 13 | letter | Armitage to all: access codes rotate Monday; night flights suspended; do not ask the window why | every player | episode-01-mail.ts |
| 9 | deadline | Last round for the Aerospace Engineer to recover the NIGHTJAR test log for full points (objective: before round 10) | Aerospace Engineer | 07 §Private objectives (5) |
| 9–10 | pressure | Tier 5: prototype calibrations fail; memos cite conflicting map coordinates. Mitigated by Information Systems reconciling coordinates (`ORDER: RECONCILE_MAPS`) | everyone notices | 04 §World pressure; 07 §Pressure clock |
| 11–12 | pressure | Tier 6: the sheriff requests an official statement; the insurer writes. Mitigated by Security issuing a statement to the county | everyone notices | 04 §World pressure; 07 §Pressure clock |
| 13–14 | pressure | Tier 7: access codes rotate; night flights are grounded; something is decided. Not mitigable in Episode 01 | everyone notices | 04 §World pressure; 07 §Pressure clock |
| 14 | check | Twelve private objectives evaluated as predicates at the lock; points awarded | each player, privately | 07 §Private objectives |
| 14 | check | Carried forward: who holds Marsh's report, who saw the second map, the motion's outcome as `finding.dsrd_reports_through_finance`, the calibration's result as `operation.orpheus_calibration_r9`, the employee seat holders, Index movement, which NPC promises were made in writing | engine | 07 §Carried forward |

Each pressure tier reached adds +2 to the Convergence Index; each mitigation refunds 1
(07 §Pressure clock).

## What Episode 2 reads from this episode (branches, 2026-10-18)
- `finding.dsrd_reports_through_finance` established true: Hensley writes to Procurement on
  Episode 2 day 2 with the DSRD project list that B-77-001 made the Research Committee's;
  established false: Vale writes to Applied Physics and Materials that the Department is as
  it was and his recommendations have gone in.
- `operation.orpheus_calibration_r9` stopped: Elias Thorne writes on day 3 asking who had the
  paper; ran: he writes that the sample weighed 1.4 kg more at the end and wants the badge log.
- The cellar at Tagus closes on `finding.tagus_structure_sealed` (Episode 4), the same
  mechanism (`PlaceDef.closedBy`).

## Gaps for Nathan
- Rounds 2, 4, 5, 8, 10, 12 and 13 now carry a letter from the NPC who wants that round's
  goal met (the pulls above). Round 11 is still only its pressure band.
- The Cult Recruit (objective 10) is not in the supervisor pool, so unless the console deals
  it nobody is trying to stop the calibration; the operation still resolves either way.
- Routing of the three irregularities and the Bernard and Sayer letters: everyone, or
  one recipient per department with the expectation that they will share.
- When nominations for the employee seats open, and how a player is nominated.
- The round Hensley sponsors B-77-001.

CHANGELOG: v1 compiles Episode 01's public pack and engine plan into one round-by-round beat sheet with sources and open gaps.
