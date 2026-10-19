# Episode 01 — engine side

SECRET CANON v1 (2026-10-11). Engine and GM only. PROPOSED until Nathan confirms.
Rewritten by Claude from the agent run: the run's objectives were "send these three
commands"; these are predicates over world state, keeping the run's dependency pairs.
The run's invented secret truths (Vale as an Ascendant "Architect", Ely "infected",
Fisk "immune") are rejected; `05-allegiance-matrix.md` is the authority on loyalties.

## Crisis statement (engine)
Royce needs the cohort for the April test, and three things are loose at once: Marsh's
report (Hensley has a copy; Vale wants it; Armitage knows where Marsh is), Greeley's
notebook (sealed in his locker, Building 2; Fisk has the key), and the Tagus invoices
(Voss's record lie). The Board motion in Round 7 decides whether DSRD answers to the
Chairman alone or to the Board through Finance. Whoever controls DSRD's reporting line
controls what the Research Committee is allowed to see before April.

## The Round 7 motion
**B-77-001 "Departmental Reporting Reform"**, sponsored by Hensley (Board), closes
Round 7. Terms: DSRD reports to the Board through the CFO; all DSRD requisitions over
$5,000 need Finance countersignature; the Research Committee receives DSRD's project
list. Starting positions: FOR Hensley, Sloane, Armitage; AGAINST Royce, Vale, Baines;
UNDECIDED Crane. Crane can be moved by evidence of financial exposure (the Tagus
invoices or the SENTINEL contract overrun) or by a promise of a seat on the Research
Committee for his nominee. Baines can be flipped by proof that NIGHTJAR flights are
being used for HARVEST sampling without his sign-off. Vale will offer any player who
lobbies against the motion a clearance-3 recommendation. Passage: majority of votes
cast, seven seats, quorum four.

## Employee seat election (Round 3)
`VOTE E-77-001: <cohort member slug>` for the Research seat, `VOTE E-77-002: <slug>`
for the Safety seat. Plurality of cohort votes cast; ties broken by earliest nomination.
Winners get clearance 2 at once and a seat vote on every motion in their committee.

## Pressure clock mechanics
Tier advances at the lock of the last round of its band unless a mitigating order
resolved that band: tier 1 any player `ORDER: SUBMIT_MANIFEST`; tier 2 Aerospace
approves corridors or Finance clears invoices; tier 3 a department head grants coverage
(`ORDER: APPROVE_OVERTIME`); tier 4 the motion closes (either way); tier 5 Information
Systems reconciles coordinates (`ORDER: RECONCILE_MAPS`); tier 6 Security issues a
statement to the county; tier 7 is not mitigable in Episode 01. Each tier reached adds
+2 to the Convergence Index; each mitigation refunds 1.

## Private objectives (one per starting position)
Each is a predicate over world state checked at the Round 14 lock, with the player it
depends on. Scoring is episode points; partial credit where noted.

| # | Position | Objective | Predicate | Depends on | Points |
|---|---|---|---|---|---|
| 1 | Procurement Analyst | Determine who approved the Tagus shipments | `finding_established(body=safety OR research, claim="voss_approved_pgs_invoices") OR evidence_held(self, asset=pgs_invoice_1974_original)` | Financial Analyst (ledger access) | 15; +5 if finding |
| 2 | Security Investigator | Identify the leaker | `evidence_held(self, asset=sayer_letter_with_royce_layout) AND knowledge(self, "layout_sender", value=<true sender>)` | Systems Programmer (mail log) | 20 |
| 3 | Research Scientist | Obtain access to an ORPHEUS sample | `access_granted(self, project=ORPHEUS) OR asset_held(self, asset=r1_fragment_any)` | Biological Researcher (Ely's countersignature) | 15 |
| 4 | Personnel Administrator | Explain three altered personnel records | `knowledge(self, "ghost_employee_exists", true) AND knowledge(self, "marsh_transfer_false", true) AND knowledge(self, "greeley_locker_sealed_by", value=sloane)` | Executive Assistant (routing slips) | 20 |
| 5 | Aerospace Engineer | Recover the missing test log before the review | `asset_held(self, asset=nightjar_test_log_77_on) BEFORE round 10` | Security Investigator (perimeter logs) | 15; 5 if after round 10 |
| 6 | Biological Researcher | Establish whether HARVEST samples were obtained under legitimate authority | `finding_established(body=research, claim="harvest_sampling_unauthorized") OR finding_established(body=research, claim="harvest_sampling_authorized")` | Research Scientist (material logs) | 20 either way; the truth is "unauthorized for Lot 77-B" |
| 7 | Financial Analyst | Trace a classified appropriation through company accounts | `evidence_held(self, asset=sentinel_contract_ledger_page) AND knowledge(self, "omega_overrun", true)` | Procurement Analyst (vendor invoices) | 15 |
| 8 | Systems Programmer | Explain the future-dated computer records | `knowledge(self, "future_dated_entries_source", value=choir_backdoor) OR knowledge(self, "future_dated_entries_source", value=unknown_verified)` | Financial Analyst (budget reallocation) | 20; the true source is Thorne's backdoor, but "unknown, verified anomalous" also scores if the engine logged a genuine anomaly |
| 9 | Executive Assistant | Secure enough Board support to block (or pass) B-77-001 as instructed in the sealed memo | `motion_result(B-77-001) == <instructed outcome>` | Personnel Administrator (who is lobbying whom) | 25 |
| 10 | Cult Recruit | Prevent the Round 9 ORPHEUS field calibration | `experiment_status(orpheus_calibration_r9) IN (cancelled, failed, postponed_past_14)` | Independent Investigator (publicity) | 15; +5 if nobody knows why |
| 11 | Federal Informant | Identify which executive controls the most restricted program | `knowledge(self, "omega_controller", value=vale) AND report_sent(self, to=mercer)` | Security Investigator (clearance audit) | 20 |
| 12 | Independent Investigator | Prove Royce misled local authorities | `evidence_held(self, asset=harvest_lot_77b_sampling_order) AND correspondence_sent(self, to=hollis, attaching=that asset)` | Cult Recruit (what the Vigil knows about the steer) | 15 |

Objectives 1/7, 2/5/11, 3/6, 4/9, 8/7, 10/12 are pairs that need each other; none can
be completed by one player alone without an NPC's cooperation, and every NPC who can
help wants something (see 05).

## Assets seeded for Episode 01
pgs_invoice_1974_original (vendor: Dakota Concrete, Minot) · sayer_letter_with_royce_layout
(arrives Round 6 to the Cult Recruit) · r1_fragment_any (three exist: Elias Thorne's
lab, Kovic's lab, the sheriff's evidence locker) · nightjar_test_log_77_on (Bradley has
it) · sentinel_contract_ledger_page (Hensley's office) · harvest_lot_77b_sampling_order
(Ely's file; unsigned) · greeley_notebook (locker, Building 2) · marsh_report_copy
(Hensley) · vetch_page (Marsh's old office, in a drawer Armitage emptied).

## The index, enlarged from what players asked for (2026-10-18)
Across four simulated episodes Records could not match 114 requests (104 distinct). Nineteen
files were written for them (`src/lib/engine/world/episode-01-more.ts`), each with one wrong
detail that ties to something already true: the Gate 4 vehicle log (MP-14 waved in from the
west at 0300, four nights), the Board minutes of 11 October (Crane marked present while his
flight landed two hours after adjournment), the personnel file index (77-P-042 is O. Sandvik,
badge 0000, the ghost employee), Julian Thorne's personnel file (he audited himself in 1976),
the Security incident log (backfilled), the access-code rotation log (29 September, no
reason, Sloane alone), the IS terminal log (the 0300 jobs sign on from the Director's own
terminal on nights his badge never entered Building 3), the Facilities coordinate memo (61
feet; the "correct" sensor is inside Building 7's wall), the prototype calibration log (every
failure at 0.4, "per daybook p. 212"), the loading dock manifest of 28 September (three
chilled cases out to MP-14, never received), the Q3 reconciliation (lines 40–45 are a number,
not a stock), the insurer's letter (the claim opened the day before the accident), the
sheriff's complaint log (nine helicopter complaints on PGS's run nights), the cold-storage
temperature log (the door held forty minutes at 0210 on 29 September), the 1974 Tagus
directory (PGS's number is the Procurement switchboard), the perimeter sensor log (drift at
0300 on the unattended-job nights), the PMA invoices (three calibration nights coded to
HARVEST, countersigned S.E.), the 14-B register (every non-NONE question 11 referred to
D-SRD), and the maintenance log (a ring burnt into the Building 7 corridor, three Mondays
running). With these, 69 of the 104 past requests match a file. For the rest the clerk now
names the nearest files on the index (`nearestDocuments`, world/index.ts) and the miss is
recorded as an event (`records.unmatched`) so the next round of writing can start from it.
Baines's price on B-77-001 now also moves on the PMA invoices and the Gate 4 log.

## Carried forward
Who holds Marsh's report; who saw the second map; motion outcome, recorded as the finding
`dsrd_reports_through_finance` either way (added 2026-10-18); the calibration's result,
`operation.orpheus_calibration_r9` { ran | stopped } (operations.ts, added 2026-10-18);
employee seat holders; Index movement; which NPC promises were made in writing.

CHANGELOG: v1 sets the crisis, the Round 7 motion with starting Board positions, the Round 3 election, clock mechanics, twelve predicate objectives with dependency pairs, seeded assets.
