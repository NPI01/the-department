# Royce Industries Charter — rules as players know them

Public canon v1 (2026-10-11). Composed by Claude from the agent team's charter run
(`docs/agent-runs/royce-governance-charter-2026-10-11.md`: motion lifecycle, quorum
math, dismissal, emergency authority, exploit list kept) and the seeded economy. Items
marked PROPOSED await Nathan. Engine parameters and seat holders' hidden loyalties are
in `canon/secret/06-governance-engine.md`.

## Governing bodies
| Body | Seats | Jurisdiction | Default threshold |
|---|---|---|---|
| Board of Directors | 7 | budget, appointments, policy, the charter itself | majority of votes cast; dismissal and charter amendments: two-thirds of all seats |
| Research Committee | 5 + 1 employee representative | projects, experiments, chamber operation, data classification, clearance recommendations | majority of votes cast |
| Safety Committee | 5 + 1 employee representative | sealing orders, access permissions, internal investigations, emergency authority | majority of votes cast; sealing orders: two-thirds of votes cast |
| DSRD | — | coordinates sensitive projects and special clearance requests; reports to the Research Committee and Board | no vote |

PROPOSED: the two employee-representative seats are elected by the new cohort in
Round 3 of Episode 01 (simple plurality of cohort votes cast). They are full voting
seats. That is the first collective decision of the game.

**Quorum** is half the seats locked at episode start, rounded up; vacant seats count in
the denominator. **Ties** default to the status quo. The chair may abstain; an
abstention is a vote cast.

## Motions
1. **Sponsor.** Any member of the body may sponsor. Any employee may sponsor with one
   member's countersignature. `ORDER: SPONSOR_MOTION <body> "<title>" CLOSES <round>`.
2. **Notice.** The motion appears in the next morning's dispatch with its number
   (e.g. B-77-003). Retroactive sponsorship is invalid.
3. **Debate.** The close round must be at least two and at most five rounds after
   sponsorship. Correspondence is free; amendments are new motions.
4. **Vote.** `VOTE <number>: FOR|AGAINST|ABSTAIN` any time before the lock of the close
   round. Votes may be changed until lock. A member may delegate one motion:
   `PROXY <number> TO <member>` (PROPOSED grammar).
5. **Tally** at lock. Passed motions take effect at the next dispatch. Bundled motions
   are split into separate entries. The sponsor's signature must match the Personnel
   Directory; unverified correspondence cannot vote.

## Appointments and dismissal
- The Board appoints committee chairs and confirms members by simple majority;
  committees propose their own members.
- The Board dismisses any officer by two-thirds of all seats. Dismissal downgrades the
  officer to clearance 1 at once.
- Provisional appointments by the Chairman last at most two rounds.

## Emergency authority
The Chairman, or the Director of Corporate Security for security matters, may issue an
emergency directive by `ORDER: EMERGENCY_DIRECTIVE "<text>"` with a written
justification entered in the Safety ledger. It takes effect at once and expires at
the lock of Round N+2 unless the Safety Committee extends it. It cannot override the
charter. Conflicting directives resolve by earliest timestamp.

## Clearance
| Level | Who | Unlocks |
|---|---|---|
| 1 | new hires | own department's working files; the public campus map |
| 2 | confirmed staff | department archives; requisition and personnel index lookups in own department |
| 3 | project staff | one named project's restricted files in own department (ORPHEUS, NIGHTJAR, HARVEST, JANUS, CHOIR) |
| 4 | department heads, DSRD liaisons | cross-department files; DSRD coordination memos; the north installation |
| 5 | executives | OMEGA; Sublevel Nine; SENTINEL correspondence |
Clearance is granted by the Research Committee on recommendation of a department head,
or by the Board. Security may suspend a clearance for up to two rounds pending
investigation (then the Safety Committee decides).

## Action Units (AU)
20 AU per round, a hard cap of 20, nothing carried over: every morning is 20, for everyone
(2026-10-21; previously income 20 to a cap of 60 with a +5 hold bonus). **Hold** (`HOLD`)
keeps standing orders and defenses and makes you watchful. **Standing orders** cost
2 AU per round each while active. A **missed turn** (nothing sent) yields no bonus,
suspends standing orders, and applies default behaviour. Voting and correspondence cost
nothing. PROPOSED upkeep: clearance 4 and 5 pay 3 AU per round for the staff and
facilities that come with rank.

## What the Board may amend (closed list)
Committee seat counts and employee seats; quorum fractions; thresholds per motion type;
clearance required per archive class; department budget shares; emergency-authority
duration (one to three rounds); who may sponsor; whether committee votes are secret.
Amendments pass by two-thirds of Board seats and take effect at the next episode
boundary, or at the next dispatch if the motion says "immediate" and passes by
two-thirds of all seats.

**Not amendable by anyone in the fiction:** round timing, AU income and cap, the
consequential-act grammar, the Board's own seat count, and the engine's fairness rules.

## The Vigil's own governance (as a member learns it)
PROPOSED. The Keepers are governed by a council of five; new members are admitted by
two-thirds of the council, and any act that "breaks silence" (contacting Royce
leadership, publishing, entering the Descent) requires two-thirds. The Ascendant
congregation has a leader who decides; members vote only on admitting new members
(simple majority). Both keep their own correspondence channel. Membership is never
disclosed by the engine.

CHANGELOG: v1 establishes bodies, seats, quorum, motion lifecycle, appointments, emergency authority, clearance table, AU economy, the closed amendable list, Vigil governance.
