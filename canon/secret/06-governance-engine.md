# Governance Engine — seats, parameters, loyalties

SECRET CANON v1 (2026-10-11). Engine and GM only. Companion to `canon/03`. PROPOSED
throughout until Nathan confirms.

## Seat holders at season start
| Body | Seat | Holder | Hidden loyalty (from 05-allegiance-matrix) |
|---|---|---|---|
| Board | Chairman | Edmund H. Royce | Corporate |
| Board | Chief Scientist | Dr. Adrian Vale | Scientific conspiracy |
| Board | CFO | Margaret Hensley | Corporate, leaning exposure |
| Board | Security | Harold Sloane | Security conspiracy |
| Board | Defense liaison | Col. (Ret.) Frank Baines | SENTINEL |
| Board | Personnel | Dorothy Armitage | Keeper |
| Board | Outside director | Walter Crane (PROPOSED new NPC: the 1969 investor; Instrumentalist by temperament; receives Vale's reports before the Board does) | Corporate / Scientific |
| Research | Chair | Dr. Adrian Vale | Scientific |
| Research | Biological | Dr. Sarah Ely | IGCC source |
| Research | Applied Physics | Dr. Aris Kovic | self |
| Research | Materials | Dr. Elias Thorne | self |
| Research | Information Systems | Julian Thorne | Ascendant cell leader |
| Research | Employee representative | elected Round 3 | player |
| Safety | Chair | Harold Sloane | Security |
| Safety | Personnel | Dorothy Armitage | Keeper |
| Safety | Aerospace | Col. Frank Baines | SENTINEL |
| Safety | Finance | Margaret Hensley | Corporate |
| Safety | Procurement | Gerald Voss | self (record lie) |
| Safety | Employee representative | elected Round 3 | player |

Design consequence: the Board starts 4–3 for continuing OMEGA (Royce, Vale, Baines,
Crane vs Hensley, Sloane, Armitage on any given day), so a single persuaded or
dismissed director flips it. The Research Committee is Vale's; the Safety Committee is
Sloane's. Both employee seats are the players' first lever.

## Rules table rows (engine keys, effective round 1)
```
board.seats=7  board.quorum=ceil(seats/2)  board.threshold.default=majority_of_votes
board.threshold.dismissal=2/3_of_seats  board.threshold.amendment=2/3_of_seats
research.seats=6  research.threshold.default=majority_of_votes
safety.seats=6  safety.threshold.default=majority_of_votes  safety.threshold.seal=2/3_of_votes
motion.close.min_offset=2  motion.close.max_offset=5  motion.tie=status_quo
emergency.duration_rounds=2  emergency.extend_by=safety
clearance.suspend.max_rounds=2
au.per_round=20  au.cap=60  au.start=10  au.hold_bonus=5  au.standing_order_upkeep=2  au.rank_upkeep.4=3  au.rank_upkeep.5=3
amendable=[committee.seats, quorum.fraction, threshold.*, clearance.per_archive_class, budget.shares, emergency.duration_rounds, sponsor.eligibility, vote.secrecy]
vigil.keepers.council=5  vigil.keepers.threshold.admit=2/3  vigil.keepers.threshold.break_silence=2/3
vigil.ascendants.decision=leader  vigil.ascendants.threshold.admit=majority
```

## Grammar additions needed in `src/lib/email/inbound.ts`
`PROXY <motion> TO <member>`; `ORDER: SPONSOR_MOTION <body> "<title>" CLOSES <round>`;
`ORDER: EMERGENCY_DIRECTIVE "<text>"` (authorized holders only). The governance phase in
`src/lib/engine/jobs.ts` must honour proxies, the close-round window, 2/3-of-seats
thresholds, and the employee-seat election.

## Why the agent charter's economy was rejected
It granted 1–3 AU by level (decreasing above 3), capped at 10, started at 1: a
hoarding-proof economy with nothing to hoard. The seeded placeholders (20/60/10) match
the brainstorm's simulator and give real trade-offs; tune by bot seasons.

## Open questions carried from the run
Mid-episode roster changes and quorum (rule: quorum uses the roster locked at episode
start; a dismissed member's seat stays in the denominator until the boundary); chair
succession mid-vote (rule: the body's senior remaining member chairs); cross-body
conflicts in one round (rule: Board > Safety > Research when directives conflict).

CHANGELOG: v1 names every seat holder, writes the engine rule rows, lists grammar additions, records why the agent economy was rejected, answers the run's open questions.
