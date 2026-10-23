# Verb rules — how orders become outcomes

SECRET CANON v1 (2026-10-13). Engine-only. Implemented in `src/lib/engine/resolve.ts`
against the world data in `src/lib/engine/world/episode-01.ts`. Deterministic: the model
narrates the outcome in the morning dispatch and never decides it. PROPOSED throughout;
the document bodies in the world file are first drafts for Nathan to revise.

## The night, in order
At the lock: `validate` funds orders in the order given (the first that does not fit,
and the rest, are skipped); `strategic` resolves each funded order by the rules below and
writes an outcome; `world` closes the ballots due that night (after the orders, so a LOBBY on
the closing round counts; moved from `governance` 2026-10-23), advances the pressure clock and
pays the round's 20 AU to the cap of 20, so nothing carries over (2026-10-21). In the morning
the dispatch narrates the outcomes.

## Costs (menu options carry their own; free-form orders are costed by step)
request_files 6 · interview 4 · surveil 10 · visit 5 · examine 3 · search 8 · lobby 5 ·
attend 4 · submit_manifest 4 · approve_overtime 4 · reconcile_maps 6 · approve_corridors 6 ·
clear_invoices 6 · issue_statement 6. A ruling that nothing could be done returns the units.

A free-form order (src/lib/engine/pricing.ts) is read a clause at a time; clauses that
set a scene, a condition or a reason ("on my lunch break", "if I can find it", "so I
can...") are skipped. Each distinct verb found is charged once at its price above, up to
four; going beyond the fence (a place marked `offCampus`, or Tagus, Minot, a ranch) adds
TRAVEL 5. An order with no readable action is held at 5 and ruled in the morning. The
price is set at intake and named in the receipt; each priced step is resolved in turn,
on its own clause first and then on the whole order, and refunded if it could not be
done; the trip is refunded if nothing could be. An ORDER: line runs on over the lines
after it until a blank line, another command or a sign-off (mail clients wrap).

## Verbs
- **request_files <file>.** Matched against the document index by alias. Delivered (a
  copy in the Case File; its knowledge keys granted) if the character's clearance meets
  the file's, or their department is listed. Referred if an NPC keeps it personally
  (write to them). Refused otherwise, with the clearance named. Files marked `notice`
  put a line in Corporate Security's memory: who asked, for what, which night.
- **surveil <place>.** A night watching a place. The place's sighting for this band of
  rounds is seen three nights in four (hash of round, character and place); otherwise
  nothing. Sightings grant a `witnessed` knowledge key. Restricted places and restricted
  sightings are noticed by Security.
- **visit <place>.** Daylight. The place's description; `visited.<place>` knowledge;
  noticed if restricted.
- **search <place>.** Access by the place's search rule; failure is noticed. Success
  takes the first document located there (a copy in the Case File).
- **examine <file>.** Must be held. Grants the file's wrong-detail knowledge if it has
  one ("the notice is typed on a form revised after its own date").
- **interview <person> / lobby <person>.** The conversation happened. An in-person
  correspondence row is written in the player's name and the NPC answers through the
  normal staff-reply pipeline (sheet, pacing, Skeptic) with a clerk's note that this was
  face to face: they send the note they would send the next morning, or decline in a
  line. Obligation +0.1 toward the player.
- **submit_manifest / approve_overtime / reconcile_maps / approve_corridors /
  clear_invoices / issue_statement.** Mitigate the pressure tier whose band contains
  this round (07 §Pressure clock); some require a department. Mitigation refunds 1 to
  the Convergence Index; a tier reached adds 2.
- **attend.** Stub: no calendar yet; ruled, units returned.
- **free-form ORDER: text.** The clerk infers the verb from keywords (ask/talk/lunch →
  interview; watch/follow/after dark → surveil; search/drawer/locker → search; examine/
  compare → examine; file/ledger/log/report → request_files; go to/visit → visit;
  lobby/persuade → lobby; manifest/overtime/reconcile → the mitigation verbs) and the
  target from the document, place and roster indexes. Unmatched: ruled, units returned,
  and the morning says what the clerk needs.

## What the world holds in Episode 01
Documents (holder; access): facilities-ledger-b7 (Facilities; cl. 1, noticed),
harvest-auth-1976 (Ely; cl. 3 or Bio Sci), campus-plat-a (Facilities; cl. 1),
marsh-transfer-notice (Armitage; cl. 2 or Personnel), greeley-incident-report (Sloane;
cl. 3 or Security, sealed), pgs-invoice-1974-original (Procurement; cl. 2 or Procurement
/ Voss), sheriff-letter-steer (Sloane; cl. 3 or Security), nightjar-test-log-77-on
(Bradley; cl. 4 or Aerospace), harvest-lot-77b-sampling-order (Ely; cl. 3 or Bio Sci),
sentinel-contract-ledger-page (Hensley; cl. 4), greeley-notebook (Building 2 locker;
search, cl. 3 or Security), marsh-report-copy (Hensley; cl. 4), vetch-page (Marsh's old
office; search, cl. 1). Each has a wrong detail EXAMINE can notice.

Places with night sightings by round band: perimeter road (unlogged flatbed rounds 1–2;
dark helicopter at 0200 rounds 3–4; a lantern walker after), Gate 2 (unlisted crate,
rounds 1–3), Building 7 (lights 0115–0150, air moving like heat), Building 2 lockers
(the sealed locker opened and resealed), the Building 9 site (a night delivery through a
hatch), Vane north pasture (lights, no sound), St. Olaf's (the tower hums eleven minutes
at 0200), the cemetery (no frost on the 1921 row), the Prairie Meridian strip (a run
without lights), cold storage (Ely counting at 2300).

## Directors' votes and lobbying (v1.1)
Each director holds a lean on each open motion (-1..1) in `facts` under
`motion.<number>.stance.<slug>`, seeded from 07 (B-77-001: Hensley 1, Sloane 0.6,
Armitage 0.5, Royce -1, Vale -0.8, Baines -0.5, Crane 0). `lobby <director>` in person:
the direction is read from the order (against / oppose / block → against; else for). If
the director has a price and the lobbyist holds any of the knowledge keys it names, the
lean is set outright (Crane: evidence of money leaving without return; Baines: proof the
night flights serve sampling he never signed). Otherwise the lean moves 0.25 toward the
lobbyist's side. The director's note the next morning carries the engine's verdict. At
the close, every member without a cast vote votes by lean (> 0.15 for, < -0.15 against,
else abstain); only members' votes count; quorum is half the seats. Players vote with
`VOTE B-77-001: FOR` only if they hold a seat.

## Filing with a committee
`FILE <item> WITH <committee>` in any reply, or "File with a committee" in the Case File.
Free: paperwork, not an order. The document goes before the body as evidence: a copy to
each player member's Case File, a memory row for each staff member, a `facts` key
`filed.<body>.<item>` for the goal judge, the filer's copy marked filed, and a row for the
chair, who answers through the staff pipeline. Any staff member whose price on the body's
open ballot the document meets (its knowledge keys, plus its wrong detail if the filer has
noticed it) moves to that price's lean, as if lobbied with the evidence in hand.

## Handing documents on
`SEND <item> TO <name>` in any reply, or "Hand a copy on" in the Case File: a copy of the
item goes into the other cabinet with a cover letter on the sender's paper; the original
stays. Staff who are handed a document remember it.

## Scheduled mail and the Round 3 election (v1.2)
`src/lib/engine/world/episode-01-mail.ts` lists what the beat sheet says arrives, by day
of the episode; `deliverScheduledMail` sends it at the morning before the dispatch is
written, once per recipient, and files documents in the Case File. Routing (PROPOSED):
the orientation memo, confidentiality clause, department map and Bernard's letter go to
everyone; each irregularity is copied to one or two departments' players (falling back to
the newest hire if nobody is in them); Sayer's first letter goes to the newest hire and
his Round 6 layout letter to the same person; Bradley's Round 3 memo goes to whoever holds
the Aerospace goal. A late joiner receives everything due so far.

Elections E-77-001 (Research seat) and E-77-002 (Safety seat) open Round 1 and close at
the Round 3 lock. Every active cohort member is a candidate; `VOTE E-77-001: <surname>`
casts or replaces a vote; plurality, ties to the earliest hire; the winner is seated as
Employee representative with clearance 2 and the result goes to everyone's dispatch.

## Findings
A motion may carry a finding (`motions.finding`: claim, on passed/failed/either, text,
false_text). At the close the body's decision is recorded as `facts finding.<claim>`,
public, and every player character learns it; the dispatch states it. A filing establishes
knowledge keys; a sponsor's motion turns them into a finding. A finding can be formally
established and still be wrong (01 §Evidence).

## Open
- attend has no calendar; approve_corridors / clear_invoices / issue_statement are
  mitigation stubs with no further effect.
- Asset originals are not yet tracked in `assets`; the objectives' `asset_held`
  predicates read the Case File for now.

CHANGELOG: v1 verb rules, costs, the Episode 01 document and place index, pressure mitigation. v1.1 directors' leans and lobbying, document transfer, goal-context documents (IS job and operator logs, batch authorizations, personnel roster, ORPHEUS roster). v1.2 scheduled mail and the seat elections.
