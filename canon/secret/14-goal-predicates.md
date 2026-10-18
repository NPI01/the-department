# Personal Goals — judged by the record

SECRET CANON v1 (2026-10-13). Engine-only; implemented in `src/lib/game/goal-predicates.ts`.
PROPOSED: the predicates below are my reading of 07's objectives in terms of the knowledge
keys and Case File items the world files grant. The showrunner's console decision still
overrides any of them.

## How a goal is judged
Every lock, the world phase evaluates each open goal's predicate against the character's
knowledge rows, held Case File items (copies count), motion results, and documents handed
to members of a body. True → met, points awarded (timing rules where the goal has them), an
event the next dispatch mentions. At the last lock of the goal's episode, false → failed,
or a consolation score if the goal has a partial, or, for goals marked `review`, left open
with a `goal.needs_review` event for the showrunner. Goals marked `review` that come true
are not closed by the engine: a `goal.proposed_met` event asks the showrunner to confirm.
"Instructed" motion outcomes read `facts` key `goal.instruction.<goal id>` (default: passed).

## The predicates
| Goal | Predicate | Review |
|---|---|---|
| ep1-1 Tagus shipments | a finding that Voss approved the PGS invoices, or holds the 1974 invoices, or holds the PGS field log and noticed the concrete went to an empty parcel | |
| ep1-2 the leaker | holds Sayer's layout letter and noticed the draughtsman's hand, or knows of Greeley's Congregation letters, or knows J-T's batch authority covers CHR-RECON | yes |
| ep1-3 ORPHEUS sample | holds the county fragment, or holds the ORPHEUS roster and noticed the third fragment is with the sheriff | yes |
| ep1-4 three records | noticed the ghost employee, the postdated transfer form, and either the notebook withheld or the Greeley timeline gap | |
| ep1-5 NIGHTJAR log | holds the 77-ON log; 15 points before day 10, 5 after | |
| ep1-6 HARVEST authority | the Research Committee's finding on HARVEST, either way (R-77-002, Episode 2); judged through Episode 2; partial 10 for holding the 77-B order and noticing it is unsigned | |
| ep1-7 appropriation | holds the 77-S ledger page and noticed the overrun | |
| ep1-8 future-dated entries | holds the job log, noticed the jobs ran unattended, and holds J-T's authorizations or noticed the authorization predates the series or the operator log's wrong hand; partial 10 for log + unattended | |
| ep1-9 the motion | B-77-001 closes as instructed | |
| ep2-1 sort the ledger | filed Form 22 and `ledger.reconstructed` (9 of 11 cases right, scored by ledger.ts); partial 8 for any Form 22 on file | |
| ep2-2 the notebook | filed the notebook or its page with the Research Committee, or handed it to a member | |
| ep2-3 the fragment | holds the county fragment | yes |
| ep2-4 R-77-002 | closes as instructed | |

## Open
- Findings: a motion may carry `finding {claim, on, text, false_text}`; at the close the body's
  decision records `facts finding.<claim>` and tells every player. R-77-002 carries
  harvest_sampling_unauthorized either way. Goals may test `finding`.

CHANGELOG: v1 predicates for ep1-1..9 and ep2-1..4; nightly judging; review flags.
