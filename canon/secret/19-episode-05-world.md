# Episode 05 — The Unfinished Descent (engine)

SECRET CANON v1 (2026-10-23). Engine-only; implemented in `src/lib/engine/stairway.ts` (the
descent, the Index, the accounts), `world/episode-05.ts`, `episode-05-mail.ts`, Form 23 in
`forms.ts`, the magnetometer in `equipment.ts`, the Episode 5 rows in the goal files, the
society triggers, and `scripts/seed-episode-05.ts` (Kessel and R-77-005). PROPOSED throughout.
Truths it rests on: the stairway rules 1–7 (02); the fifth descent, collective consciousness,
is planted disinformation and single descents work (00); Marsh is alive and has descended once
(00); threshold 7 is OPEN and is Episode 10's.

Episode 5 is rounds 57–70, 11 to 24 December 1977. The ballot closes on Christmas Eve's eve
and the episode on Christmas Eve.

## The mechanic
**DESCEND** (10 AU) from Tagus. The way down is the cellar door, or, once the Safety Committee
has sealed it, the ventilation shaft under the plate in the Halvorsen windbreak, which a
Congregation member knows and anyone who has visited the plate knows. The engine scores a
threshold 1–4 (rule 1: depth follows expectation): `1 + floor(specific beliefs / 2)`, plus one
when the Convergence Index is 40 or more, never above 4. Specific beliefs are knowledge keys:
the wall, the tapes, the laboratory's word on the depths, the pamphlet, Brandvold's page, Sketch
B, the monitoring log's August visitor, the protocol, the orange light, and earlier thresholds
reached. A mind holding both the Keepers' reading and the Congregation's stops at 1
(contradictory belief). Company on the stairs caps at 2 (the planted lie, enacted). A site
under active practice caps everyone at 1 (rule 7). Episode 4 reaches the wall only.

What each threshold is: 1 the wall, two instruments disagree; 2 the lower flight and the
memory pool (one of the descender's own noticed details, wrong by one); 3 nothing, which is its
own answer; 4 the absent, in order: Marsh (first in the campaign; she says "You are early. Find
the original date." and leaves a card on the twelfth step), then Greeley at page 212, then Wren
counting to twenty. Instruments disagree by design (rule 2): with the magnetometer, two readings
a minute apart on the same step differ by 10% plus the Index over 200, and both become a
document. Costs (rule 6): beyond the second threshold one date on one held document changes and
the Index rises by 1 (2 at the fourth). Time is bounded (rule 3): the watch and the church clock
disagree in the narration and nobody is lost for a round.

**The Convergence Index** is the rule `convergence.index` the pressure clock already raises by 2
a tier. Descents raise it; consistent accounts raise it; the practice lowers it.

**Form 23, Report of Descent** (Applied Physics, Rev. 12/77): steps down, steps up, light,
sound, watch against the church clock, the lowest point, others present, readings. Kovic wants
the counts; Rud wants them to differ. Filed, the account is a fact; two or more in a round that
agree on the count raise the Index by 2; three or more in a round that disagree are
containment: the Index falls by 3, every descent that round and the next stops at the wall, and
the filers learn `vigil.containment_achieved`.

## The people
**Reinhold Kessel** (new; sheet in 11, fifth pass), PGS field supervisor at the yard: signed the
field log, telephoned the paper with Fisk's name on Voss's say-so, locked the door on Brandvold
from outside on 23 November, and has never been below the landing. `npc_state.place =
pgs-yard`. **Dr. Evelyn Marsh** gets her sheet now (fifth pass) for the stairs and for Episode 9;
she is met, not written to, until then. Rud, Brandvold, Sandvik, Pfeifer, Kovic, Vale, Thorne,
Bradley carry the episode from their Episode 4 sheets and the rungs added here.

## Documents (holder; access)
kovic-descent-protocol (Applied Physics; anyone) · vale-brief-r77005 (Vale; cl. 3) ·
keepers-practice-page (Rud; members) · congregation-descent-card (Sayer; members) ·
bradley-orange-light-note (Bradley; cl. 4) · sloane-guard-roster-tagus (Security; cl. 2 / Fisk)
· marsh-card-twelfth-step (found at the fourth threshold; never through Records). Wrong
details: the protocol's pencilled 19; the brief drawn on 77-S; the practice page's hand in the
1961 bell entry; the card's blank seventh line; Bradley's eleven minutes against the hut's
recorder; the guard roster's empty hour from 0200 to 0300; the card's hand against the Vetch
instruction in Marsh's office.

## Places
The windbreak plate (the shaft): a visit finds the ladder and the door nobody mentioned; days
3–5 six lamps go down and five come up; days 6–14 an old man alone lifts the plate and listens.

## Pressure (bands by day)
1–3 the magnetometer signed out to nobody; a guard and a protocol · 4–6 lamps in the windbreak;
the estate's lawyer complains of trespass (issue_statement: Security) · 7–9 the ballot
scheduled; Vale asks Personnel who has been to Tagus · 10–12 two employees report lost hours
(approve_overtime: Personnel) · 13–14 Christmas Eve; a date on a document is not the date
remembered.

## Scheduled mail (day; the pulls)
1 Vale's notice of R-77-005 (Applied Physics, Materials, IS) · 1 Rud to members: the practice,
on the company's form · 1 Sloane: a guard posted (door open) or the matter closed (door sealed)
· 2 Sayer to members: the plate (sealed) or the hour between (open); the fourth night at 0200 ·
**3 Kovic to the holder of ep5-3: the magnetometer, Form 23, a place on JANUS** · 4 Thorne to
members: tonight; do not count · 5 Pfeifer unsigned to ep5-1 (sealed): somebody has been at the
plate · **6 Bradley to ep5-1: the orange light, eleven minutes, his note for what it looks like
from underneath** · **8 Brandvold to ep5-5: go alone** · **9 Rud to ep5-6: I have two that agree;
I need a third that does not** · 11 Vale: show me the readings before the vote · 13 Armitage:
Christmas Eve · 14 Kovic to ep5-3: authorized (phase one in the new year) or refused (New
Year's Eve, with or without the Committee).

## Governance
R-77-005 "Experiments on the Tagus Passage", Research Committee, sponsored by Vale, opens round
63 (day 7), closes round 69 (day 13). Finding either way: `tagus_experiments_authorized`. Leans:
Vale 1, Kovic 0.8, J. Thorne 0.9, E. Thorne 0.3 (0.9 once shown a reading from below the
landing), Ely −0.2 (−0.8 once shown the brief is drawn on 77-S), plus the employee seat.

## Goals (pool)
ep5-1 past the wall (threshold 2+; partial for any descent) · ep5-2 descend and file Form 23 ·
ep5-3 readings from below (instrument + threshold 2, or readings before the Committee) · ep5-4
carry R-77-005 · ep5-5 who else is on the stairs (an encounter) · ep5-6 three accounts that
disagree (containment achieved; partial for filing).

## Societies
The Vigil's interest adds a filed account and a descent; the Congregation's adds a visit to the
plate and the second threshold.

## Carries forward
Every descender's `descent.threshold.<n>` and `disturbance.r<n>` rows; the Index; who met whom on
the stairs (`encounter.marsh`, the card); `finding.tagus_experiments_authorized`; whether the
practice held (`containment.tagus`); Kovic's observers, by whoever holds readings.

CHANGELOG: v1 the descent as a verb with thresholds, costs and encounters; the Index; Form 23 and the practice; Kessel and Marsh's sheets; documents, the plate, pressure, the pulls, R-77-005, six goals, triggers.
