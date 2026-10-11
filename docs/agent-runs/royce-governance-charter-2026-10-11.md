This document establishes the deterministic governance framework for Royce Industries and the Vigil network. It defines clearance tiers, action economy, committee voting thresholds, motion lifecycles, and inaction penalties. Public canon contains player-facing rules, committee jurisdictions, and diegetic objectives. Secret canon contains engine-only parameters, alignment state mechanics, and precise timing rules. All consequential actions follow fixed grammar and round boundaries.

===== PUBLIC CANON =====
--- 01-governance-rules.md ---
# Royce Industries Governance Rules

Public canon v1 (2026-10-11). Safe for any prompt. Source: `docs/source/governance-charter.md`.

## Clearance & Action Economy
- L1 clearance grants 1 Action Unit baseline.
- L2 clearance grants 2 Action Units baseline.
- L3 clearance grants 3 Action Units baseline.
- L4 clearance grants 2 Action Units baseline.
- L5 clearance grants 1 Action Unit baseline.
- Maximum Action Unit cap is 10.
- L3 and higher holders pay 1 Action Unit upkeep per round.
- Effective round: 1.

## Quorum Definition
- Board quorum equals half the total seats locked at episode start.
- Research Committee quorum equals half the total seats locked at episode start.
- Safety Committee quorum equals half the total seats locked at episode start.
- Round up to the nearest integer.
- Vacant seats count toward the denominator.
- Roster locks at episode start.
- Effective round: 1.

## Voting Thresholds
- Board motions require a majority of votes cast.
- Research Committee motions require a majority of votes cast.
- Safety Committee sealing orders require two-thirds of quorum.
- Tied votes default to status quo.
- Effective round: 1.

## Motion Lifecycle
- Sponsor requires a named signature.
- Debate window lasts exactly three rounds.
- Lock occurs at 8:00 PM Eastern.
- Voting window opens for one round.
- Tally occurs at lock.
- Passes if threshold met. Dies if threshold not met.
- Effective round: 1.

## Appointment & Dismissal
- Board appoints chairs by simple majority.
- Committees propose members to Board.
- Board confirms members by simple majority.
- Board dismisses members by two-thirds of total seats.
- Dismissal triggers immediate clearance downgrade to L1.
- Provisional appointments last two rounds maximum.
- Effective round: 1.

## Inaction Modes
- HOLD preserves standing orders.
- HOLD yields plus one Action Unit next round.
- Missed turn yields zero Action Units.
- Missed turn applies default actions.
- Missed turn does not preserve standing orders.
- Effective round: 1.

## Voting Verification
- Required format is signed carbon copy or teletype confirmation.
- Unverified correspondence cannot vote.
- Timestamps align with 9:00 AM dispatch and 8:00 PM lock.
- Chair abstention counts as vote cast but not for or against.
- Effective round: 1.

## Exploit Prevention
- Bundled motions require separate sponsorship.
- HOLD orders do not count toward quorum calculation.
- Retroactive sponsorship is invalid.
- Sponsor signature must match Personnel Directory entry.
- Effective round: 1.

## Emergency Authority
- Authority lasts exactly two rounds.
- Auto-expungement triggers at round boundary.
- Authority cannot extend beyond two rounds.
- Authority cannot override Board charter.
- Requires written justification in Safety ledger.
- Conflicting orders resolve by earliest timestamp.
- Effective round: 1.

## DSRD Coordination
- DSRD coordinates sensitive projects.
- DSRD manages special clearance requests.
- DSRD reports to Research Committee and Board.
- DSRD holds no voting power.
- Effective round: 1.

## Committee Jurisdictions
- Board controls budget, appointments, policy, and charter.
- Research Committee controls projects, experiments, data classification, and clearance recommendations.
- Safety Committee controls sealing orders, access permissions, investigations, and emergency authority.
- Effective round: 1.

## Vigil Interface
- Internal alignment state tracks player choices.
- External engine effects trigger only when a player crosses a Royce clearance tier.
- External engine effects trigger only when a player submits a binding ORDER.
- State remains hidden until trigger conditions meet.
- Effective round: 1.

## Player Objectives
- Board restructuring: Pass Board motion to restructure departmental reporting lines. Predicate: Board_vote_result equals PASS AND motion_title equals Departmental_Reporting_Reform. Scoring: plus 15 points. Triggers dispatch of new org chart. Unlocks L2 clearance for three players.
- Safety sealing order: Authorize sealing order for restricted annex. Predicate: Safety_vote_result equals PASS AND threshold_met equals 2/3_of_quorum AND order_type equals SEAL. Scoring: plus 20 points. Lowers local anomaly readings by 5 points. Triggers physical lockdown.
- Research data classification: Classify HARVEST project data as Level 4 Restricted. Predicate: Research_vote_result equals PASS AND data_classification equals L4 AND project equals HARVEST. Scoring: plus 10 points. Unlocks procurement logs. Triggers Security audit dispatch.
- Emergency authority expiry: Allow emergency authority to auto-expunge without extension. Predicate: emergency_round equals 2 AND auto_expunge_triggered equals true AND no_extension_order_submitted equals true. Scoring: plus 5 points. Restores committee balance. Prevents executive overreach penalty.
- Clearance alignment threshold: Cross clearance threshold while holding active alignment state. Predicate: player_clearance equals L3 AND alignment_state equals ACTIVE AND binding_ORDER_submitted equals true. Scoring: plus 25 points. Triggers external alignment effect. Unlocks Tagus invoice thread.

===== SECRET CANON (engine only — never to players) =====
--- 02-governance-engine.md ---
# Governance Engine Parameters

Secret canon v1 (2026-10-11). Engine and Game Master only.

## Internal Alignment State
- Tracks player choices across rounds.
- Modifies internal state only.
- External engine effects trigger exclusively when a player crosses a Royce clearance tier.
- External engine effects trigger exclusively when a player submits a binding ORDER.
- State resets if clearance drops below threshold.
- Cross-faction states do not combine across clearance levels.
- State never appears in player dispatches.
- Trigger condition requires explicit player action.

## Action Unit Acquisition
- Starting pool grants 1 AU per player at Round 1.
- Acquisition grants plus 1 AU per round for active participation.
- Upkeep deducts 1 AU per round for L3 and higher holders.
- Cap prevents inflation at 10 AU.
- Deterministic resource drain prevents hoarding.
- Effective round: 1.

## Timestamp Verification
- Dispatch timestamp aligns with 9:00 AM Eastern.
- Lock timestamp aligns with 8:00 PM Eastern.
- Engine server clock synchronizes with dispatch and lock cycle.
- Cross-timezone operations resolve to Eastern time.
- Unverified correspondence excludes player from tally.
- Carbon copy timestamps verify against lock boundary.
- Effective round: 1.

## Emergency Authority Expiry
- Authority activates immediately upon ORDER submission.
- Expires at 8:00 PM Eastern of Round N+2.
- Auto-expungement triggers at lock boundary.
- Cannot override Board charter.
- Cannot extend beyond two rounds.
- Requires written justification in Safety ledger.
- Conflicting orders resolve by earliest timestamp.
- Effective round: 1.

## Convergence Index
- Hidden engine metric ranges from 0 to 100.
- Synchronized observation raises the Index.
- Consistent records raise the Index.
- Contradictory records lower the Index.
- Dispersal of participants lowers the Index.
- Thresholds unlock manifestations.
- April 1978 test outcome depends on Index and apparatus state.
- Effective round: 1.

## Quorum Calculation
- Quorum equals ceil(total_seats_locked_at_episode_start / 2).
- Vacant seats count toward denominator.
- Roster locks at episode start.
- Mid-episode roster changes require engine adjudication.
- Effective round: 1.

## Motion Lifecycle Engine Logic
- Sponsor submits ORDER with named signature.
- Engine logs motion.
- Debate window opens for three rounds.
- Lock occurs at 8:00 PM Eastern.
- Voting window opens for one round.
- Tally applies threshold predicate.
- Passes if predicate true. Dies if predicate false.
- Effective round: 1.

## Committee Jurisdiction Engine Logic
- Board processes budget, appointments, policy, charter.
- Research Committee processes projects, experiments, data classification, clearance recommendations.
- Safety Committee processes sealing orders, access permissions, investigations, emergency authority.
- DSRD processes special clearance requests.
- DSRD holds no voting power.
- Effective round: 1.

## Inaction Mode Engine Logic
- HOLD preserves standing orders.
- HOLD yields plus 1 AU next round.
- Missed turn yields 0 AU.
- Missed turn applies default actions.
- Missed turn does not preserve standing orders.
- Effective round: 1.

## Exploit Prevention Engine Logic
- Bundled motions split into separate entries.
- HOLD orders exclude from quorum math.
- Retroactive sponsorship rejects motion.
- Sponsor signature verifies against Personnel Directory.
- Effective round: 1.

## Appointment & Dismissal Engine Logic
- Board appoints chairs by simple majority.
- Committees propose members to Board.
- Board confirms members by simple majority.
- Board dismisses members by two-thirds of total seats.
- Dismissal triggers immediate clearance downgrade to L1.
- Provisional appointments last two rounds maximum.
- Chair vacancy triggers interim appointment by remaining Board members.
- Effective round: 1.

## Vigil Interface Engine Logic
- Internal alignment state tracks player choices.
- External engine effects trigger only when player crosses Royce clearance tier.
- External engine effects trigger only when player submits binding ORDER.
- State remains hidden until trigger conditions meet.
- Cross-faction states do not combine across clearance levels.
- State resets if clearance drops below threshold.
- Effective round: 1.

## Objective Engine Logic
- Board restructuring: Pass Board motion to restructure departmental reporting lines. Predicate: Board_vote_result equals PASS AND motion_title equals Departmental_Reporting_Reform. Scoring: plus 15 points. Triggers dispatch of new org chart. Unlocks L2 clearance for three players.
- Safety sealing order: Authorize sealing order for restricted annex. Predicate: Safety_vote_result equals PASS AND threshold_met equals 2/3_of_quorum AND order_type equals SEAL. Scoring: plus 20 points. Lowers local anomaly readings by 5 points. Triggers physical lockdown.
- Research data classification: Classify HARVEST project data as Level 4 Restricted. Predicate: Research_vote_result equals PASS AND data_classification equals L4 AND project equals HARVEST. Scoring: plus 10 points. Unlocks procurement logs. Triggers Security audit dispatch.
- Emergency authority expiry: Allow emergency authority to auto-expunge without extension. Predicate: emergency_round equals 2 AND auto_expunge_triggered equals true AND no_extension_order_submitted equals true. Scoring: plus 5 points. Restores committee balance. Prevents executive overreach penalty.
- Clearance alignment threshold: Cross clearance threshold while holding active alignment state. Predicate: player_clearance equals L3 AND alignment_state equals ACTIVE AND binding_ORDER_submitted equals true. Scoring: plus 25 points. Triggers external alignment effect. Unlocks Tagus invoice thread.

===== OPEN QUESTIONS =====
1. How is quorum calculated when roster changes mid-episode due to dismissal or transfer?
2. What is the exact AU cost for a VOTE action? (Currently 0, requires explicit rule)
3. How does the engine handle conflicting orders from different committees in the same round?
4. What is the succession protocol if a committee chair is dismissed mid-vote?
5. How are carbon copy timestamps verified against the 8:00 PM lock when players operate across time zones?

CHANGELOG: v1 establishes deterministic governance rules, applies Skeptic corrections for quorum math, diegetic scoring, and alignment state abstraction. Separates public player-facing procedures from secret engine parameters.