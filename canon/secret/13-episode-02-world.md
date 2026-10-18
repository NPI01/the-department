# Episode 02 — world data (engine)

SECRET CANON v1 (2026-10-13). Engine-only; implemented in `src/lib/engine/world/episode-02.ts`
and `episode-02-mail.ts`. PROPOSED throughout: the case ledger, document bodies, places and
their sightings, the pressure bands, the scheduled mail and the four Episode 2 goals are
first drafts for Nathan. Truths they rest on: Lot 77-B was sampled without authority
(07); Greeley died in an unauthorized session he ran himself and Sloane concealed it (03);
the sheriff's "ordnance" is R-1 class material (10); the Research Committee decides whether
to cooperate with the sheriff and disclose HARVEST (10).

## The cattle case ledger (eleven cases, 1975–77)
HARVEST, authorized: 2 (9/75), 4 (4/76), 8 (9/76), 9 (7/77, lot 77-A).
HARVEST, unauthorized: 10 (9/77, lot 77-B: hide, lymph, eye; no signatures), 11 (10/9/77,
the Vane steer in the paper; truck MP-14 out to "PGS" with no driver's name).
Ordinary: 1 (lightning), 3 (scavengers).
Royce cannot explain: 5–7 (Halvorsen, June 1976: drained, cut; metal debris 3 lb, warm,
logged as ordnance, tag E-76-19, never referred). The engine's truth: the debris is an
R-1 fragment, the third of three; Kovic wants it.

## Two people (added 2026-10-18; sheets in 11, fourth pass; seeded by `seed-episode-02.ts`)
**Walter Nygaard**, night custodian, Buildings 2 and 3: the man who handed Security the
page on day 7. He was in room 2-C on 12 July with Greeley and two visitors from Building 3
(Thorne's cell), who ran first and told him to say he found the body on his rounds; he kept a
second folded page. The Building 2 badge reader log for July puts his badge in at 2250 and out
at 2341 on a shift that starts at 0600. `npc_state.place = building-2-lockers`: an interview
there meets him. **Ruth Greeley**, Fargo, Paul's sister: writes on day 5 as herself now (not
through the mail room), answers anyone who signs their name, and holds Paul's May and June
letters home, which name "friends in Building 3", and the midnight telephone call of 10 July
("it answered"). She gives the letters for a page of the notebook.

## The Fisk quotation (truth, added 2026-10-18)
The "Royce spokesman" who gave Haugen Fisk's name telephoned from the PGS yard at 0740 on
24 October, collect, on Voss's instruction: R. Kessel, the field supervisor, logged it
"statement, per G.V." in the yard's telephone log. Voss wanted the denial on Security's book,
not Procurement's. Haugen now says the call came on a Tagus exchange number; the yard's
phone log (a search of the yard; cl. 4 or Security/Procurement) carries the line. Fisk does not
know who used his name.

## Form 22 and the decision versus the disclosure (added 2026-10-18)
A player who is ready to say what the eleven cases were files **Form 22** (06-forms; engine
`ledger.ts`): one letter per case, scored against the truth above; 9 of 11 is a
reconstruction (`ledger.reconstructed`), an ordinary or unexplained case laid on HARVEST is
`ledger.false_accusation`, and question 14 may send the statement to the sheriff, who
answers in his own words. Goal ep2-1 is judged by the form now. R-77-002's finding and the
disclosure it authorizes are two facts: a passed finding is carried out on day 14 (Records
furnishes the authorizations and the PGS logs, `disclosure.harvest_to_county`); a failed one
is announced by Vale. Hollis writes on Episode 3 day 1 on one branch or the other.

## Documents (holder; access)
minot-daily-news-steer (mail room; anyone) · sheriff-case-ledger (Hollis; via him) ·
sheriff-evidence-e76-19 (the locker; sealed; search cl. 5 or Hollis) · vane-sample-jar
(Vane; via him) · pgs-field-log-sep-77 (Procurement cl. 2 / Voss; in the PGS yard) ·
motor-pool-log-oct-77 (Facilities; anyone) · harvest-protocol-1975 (Ely; cl. 3 / Bio Sci)
· greeley-effects-inventory (Armitage; cl. 2 / Personnel) · greeley-lab-entry-12-july
(Kovic; cl. 3 / Applied Physics) · pma-contract-1976 (Baines; cl. 3 / Aerospace) · building-2-badge-log-july-77 (Security; cl. 3 /
Fisk; the custodian's badge on 12 July) · pgs-yard-phone-log-oct-77 (the yard; the call to the
paper). Each
carries a wrong detail EXAMINE can notice; together they let a player sort the ledger,
tie MP-14 to the steer, show 77-B's tissue was outside protocol, and show the notebook was
withheld by H.S.

## Places and night sightings
Sheriff's office (ask: the deputy); the evidence locker (sealed; the sheriff visits it
alone at 2340); the Vane barn (the jar; helicopter over the pasture days 1–6, a Minot car
at the gate after); the Halvorsen parcel (PGS crew lowers a case through a hatch in the
instrument hut); the PGS yard (truck washed at 0300; the field log is there); the Minot
Daily News office (Haugen, the unprinted photograph, the false Fisk quote).

## Pressure (bands by day of the episode)
1–3 the paper names the company (issue_statement) · 4–6 the sheriff asks in writing for
the MP-14 sign-out (submit_manifest) · 7–9 Vane stops hay deliveries (clear_invoices) ·
10–12 the state veterinarian writes; the ballot is scheduled · 13–14 a Bismarck TV crew at
the Vane gate.

## Scheduled mail (day)
1 the clipping to all; Hollis's demand for the sign-out to Security and Personnel · 2 Vane
to the newest hire · 3 Ely's continuation memo to Bio Sci and Applied Physics · 5 Ruth
Greeley's letter, forwarded, to Personnel and Security · 7 the custodian's find: a page of
the notebook, to Security. Branches from Episode 1
(2026-10-18, `when` on scheduled mail): day 2 Hensley with the DSRD project list if B-77-001
carried, else Vale "as before"; day 3 Elias Thorne asking who had the calibration paper if
the operation was stopped, else reporting the sample's weight if it ran.

## Governance
R-77-002 "Cooperation with the County and Disclosure of HARVEST", Research Committee,
opens round 23 (day 9), closes round 27 (day 13), majority of votes. Leans: Vale -0.9,
Ely +0.5 (certain if shown 77-B unsigned), Kovic 0 (for, if told of the fragment in the
locker), E. Thorne -0.4, J. Thorne -0.6, plus the elected employee seat.

## Goals (pool, assigned from the console)
ep2-1 sort the ledger · ep2-2 the notebook before the Committee · ep2-3 the fragment into a
Royce lab · ep2-4 carry R-77-002 as instructed.

CHANGELOG: v1 Episode 02 case ledger, documents, places, pressure, mail, ballot, goals.
