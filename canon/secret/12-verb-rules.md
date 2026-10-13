# Verb rules — how orders become outcomes

SECRET CANON v1 (2026-10-13). Engine-only. Implemented in `src/lib/engine/resolve.ts`
against the world data in `src/lib/engine/world/episode-01.ts`. Deterministic: the model
narrates the outcome in the morning dispatch and never decides it. PROPOSED throughout;
the document bodies in the world file are first drafts for Nathan to revise.

## The night, in order
At the lock: `validate` funds orders in the order given (the first that does not fit,
and the rest, are skipped; a hold pays +5 AU); `strategic` resolves each funded order by
the rules below and writes an outcome; `world` advances the pressure clock and pays the
round's 20 AU to the cap of 60. In the morning the dispatch narrates the outcomes.

## Costs (menu options carry their own; free-form orders are costed by verb)
request_files 6 · interview 4 · surveil 10 · visit 5 · examine 3 · search 8 · lobby 5 ·
attend 4 · submit_manifest 4 · approve_overtime 4 · reconcile_maps 6 · approve_corridors 6 ·
clear_invoices 6 · issue_statement 6. A ruling that nothing could be done returns the units.

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

## Open
- NPC seat votes on B-77-001 are not yet cast from the sheets at close; lobbying records
  obligation and the NPC's note but does not yet move a vote.
- attend has no calendar; approve_corridors / clear_invoices / issue_statement are
  mitigation stubs with no further effect.
- Asset originals are not yet tracked in `assets`; the objectives' `asset_held`
  predicates read the Case File for now.

CHANGELOG: v1 verb rules, costs, the Episode 01 document and place index, pressure mitigation.
