# Episode 04 — The Church at Tagus (engine)

SECRET CANON v1 (2026-10-18). Engine-only; implemented in `src/lib/engine/world/episode-04.ts`,
`episode-04-mail.ts`, the Episode 4 rows in `goal-predicates.ts`, `creation.ts` and
`goal-briefs.ts`, the Episode 4 triggers in `societies.ts`, and `scripts/seed-episode-04.ts`
(the six new people and ballot S-77-004). PROPOSED throughout. Truths it rests on: the upper
flight is 1920s concrete ending at a wall near the twentieth step, two measurements of one
descent differ by design, nobody is lost for a round unless they choose to stay (02); the 1969
SENTINEL contracts already carry the stairway's depths and the company was built around the
hole (16 §Episode 04); Voss's 1974 lie and Baines as SENTINEL's officer inside the fence (05).

Episode 4 is rounds 43–56. Day 1 is Thursday 24 November 1977, Thanksgiving; the campus is
at half strength when the surveyor fails to report.

## The crisis
Prairie Geological Services' field surveyor **Lyle Brandvold** sent three depth readings for
one void under the utility cellar by St. Olaf at 1640 on the 23rd (11 ft, 40 ft, no bottom at
300 ft, all from one bolt), went down to check the tape, and did not report. PGS told Voss and
nobody else. The truth the engine holds: Brandvold came up the same night (rule 3), after what
he experienced as three days, found the door locked from outside, and walked to the Rud farm,
where he stays. **Ole Sandvik**, the PGS man who refuses to talk, was on the stairs with him
and is the ghost employee on the 1976 payroll audit (PROPOSED, closes 05's open question 1).
The company's land purchase, its subsidiary and its federal contract come into the open in
that order, and the Safety Committee votes on pouring the door shut.

## The people (new; sheets in 11, third pass; seeded by `seed-episode-04.ts`)
| Slug | Name | Public | Hidden | Reached |
|---|---|---|---|---|
| brandvold | Lyle Brandvold, 34, PGS field surveyor | overdue since the 23rd | alive at the Rud farm; disturbed (his page is dated three days in one night) | by letter from day 9 (Rud's note to the goal holder), in person at the farm; writes day 13 |
| rud | Agnes Rud, 67, the farm west of Tagus | a widow who has complained about surveyors | senior Keeper; Clara Wren's niece; keeps the account book; drove Marsh to the second property | `npc_state.place = keepers-farm`: an interview at the farm meets her; letters |
| sandvik | Ole Sandvik, PGS 1969–, trailer behind the elevator | will not talk to the company | Keeper; paid since 1969 against badge 0000; drew Sketch B; went down ahead of Brandvold | letters (monosyllables); a visitor who does not mention the company |
| mahlum | Curtis Mahlum, PGS technician to 1976 | "they were looking for a tunnel" | none; reached the wall and tells it as the bottom | coffee |
| pfeifer | Dennis Pfeifer, PGS driver to August | "there was no digging" | paid $80 a month by Voss to say so; drove the 1974 concrete; poured the shaft collar | the 1974 invoice with his signature breaks him |
| ashby | Conrad Ashby, contracting officer, Defense Supply | a federal letter on the 12th | SENTINEL's contracting officer; Baines's contact; knows the April date | writes to the Chairman only; appears at the cellar on the 13th |

## Documents (holder; access)
brandvold-last-message (mail room, day 1; anyone) · pgs-overdue-report (Voss; cl. 2 /
Procurement) · brandvold-field-book (the PGS yard truck; cl. 4 or Security/Procurement search)
· pgs-payroll-1977 (Procurement; cl. 2 / Voss) · royce-geological-survey-1969, Document B with
Sketch B (Vale's CC copy; cl. 4 / Vale) · sentinel-contract-index (Hensley's cabinet; cl. 4 /
Hensley) · pgs-monitoring-log (the installation; cl. 4 / Security search) ·
stanley-land-records-tagus (the courthouse at Stanley; public) · cellar-tapes (the lower
landing; anyone who gets down) · ashby-inspection-notice (day 12 mail) · brandvold-page (day 13
mail to the holder of ep4-1).

Each carries a wrong detail: the three readings are timed to one minute; the overdue memo
goes to Voss as "Director, PGS" with no copy to Security; the field book's last line is in a
second hand, O.S.; Sandvik draws pay against badge 0000; the survey cites Dwg. 68-24 a year
before its own date; **the 1969 contract index lists the three depths** the surveyor took last
week; the monitoring log's only visitor by name is E. Marsh, D.A. sign-out, 14 August; the
deed is signed by Voss as agent and witnessed by F. Baines, Col., USAF, in 1969; both tapes
are taut; Ashby calls the parcel Verification Site T; Brandvold's page is dated three days in
one ink.

Laboratory work: Applied Physics on the field book (the plumb line was deflected; all three
readings are correct measurements of a space with no one depth) and on the monitoring log
(the baseline climbs every year, fastest this October); Information Systems on the field book
and the log (survey dates and the magnetometer rise fall on the nights of the unattended batch
jobs); Advanced Materials on the tapes (the 40-foot tape is stretched three per cent below the
20-foot mark); Procurement on the index (the DSA-69 drawdowns foot to appropriation 77-S).

## Places and sightings
The utility cellar (restricted; a visit reaches the landing, the wall and the tapes; days 1–7
a man comes up at 0110 and walks west; days 8–14 an unmarked truck and a man in a suit at
0200) · the installation under the Halvorsen hut (restricted; the hatch opens at 2330 and the
pen recorder stops for eleven minutes at 0016; contains the log) · the Mountrail County
courthouse at Stanley (public; the clerk says a company man in a good coat copied the Tagus
pages on Friday) · the farm west of Tagus gains an Episode 4 sighting: a man in a PGS jacket
splitting wood at first light, badly · the PGS yard now also holds the field book.

## Pressure (bands by day)
1–3 the sheriff asks in writing who PGS answers to (issue_statement: Security or Procurement)
· 4–6 the wife is in the paper; Finance asks for PGS's papers (clear_invoices: Procurement) ·
7–9 the ballot closes; a Dakota Concrete truck is on the Tagus road either way · 10–12 the
federal letter to the Chairman; Aerospace lit past midnight · 13–14 the door poured or
guarded; the tower hums from the road; the sheriff wants a statement (issue_statement:
Security).

## Scheduled mail (day; the pulls)
1 PGS to Voss, overdue, with the teletype (Procurement, Security) · 1 Bernard: a man came up
(all) · 2 Hollis: missing person, "a telephone that rings in your building" (Security,
Personnel) · 2 Armitage: call on Mrs. Rud, take her nothing (Personnel) · 3 Sloane sponsors
S-77-004 (Security, Personnel) · 4 Vale: one honest witness on the landing (Applied Physics,
Materials) · 5 Kovic: the magnetometer, and a place on JANUS for the numbers (Applied Physics)
· 6 Baines: objection; "apply to the CFO for the contract and explain yourself to the
Chairman" (Aerospace, Security) · 6 Rud to members of the Vigil: the company's man is with us ·
8 Voss: PGS is mine (Procurement) · **9 Rud to whoever holds ep4-1: he is not lost; come alone,
in daylight, without a form** · 10 Sayer to members of the Congregation: the shaft under the
windbreak plate; come down with us in April · 12 Ashby to the Chairman: inspection on the 6th
(Procurement, Personnel, Aerospace) · **13 Brandvold to whoever holds ep4-1: the torn page.**

## Governance
S-77-004 "Closure of the Tagus Utility Structure", Safety Committee, sponsored by Sloane,
opens round 45 (day 3), closes round 49 (day 7), majority of votes. Finding either way:
`tagus_structure_sealed`. Leans: Sloane 1, Armitage 0.8, Voss 0.6 (certain once his name is
on a PGS paper in someone else's hand: the overdue memo, the deed, the payroll), Baines −1,
Hensley −0.2 (−0.9 once told the three depths are real, by a laboratory or the index), plus the
employee seat. Control of the site carries forward as the finding plus what Episode 5 reads
from it: sealed → Security; open with Ashby's inspection held → SENTINEL; open otherwise →
PGS, which is Voss.

## Goals (pool, handed out from the console or by the room)
ep4-1 find Brandvold (20 before day 13, 5 after; the day 13 letter completes it late) · ep4-2
what PGS is and who runs it · ep4-3 the contract index before the Board (judged through
Episode 7; 25 now, 10 later; partial for holding it and noticing 1969) · ep4-4 carry S-77-004
as instructed · ep4-5 stand on the stairs and bring back a measurement · ep4-6 the monitoring
log (review; partial for the eleven minutes).

## Societies
The Vigil's interest now counts a visit to the cellar, the man seen coming up, writing to
Rud, and the man seen at the farm. The Congregation's counts the cellar, the field book, the
eleven minutes under the hut, and the IS reading of the log.

## Carries forward
`finding.tagus_structure_sealed`; who holds the contract index (ep4-3 keeps judging); which
players have `visited.tagus-cellar` (Episode 5's expectation profiles start here); whether
Brandvold was met and by whom; `member.vigil` / `member.congregation` as before; Sandvik named
or not (`pgs.sandvik_paid_no_badge_noticed`).

CHANGELOG: v1 Episode 04 crisis, six new people, documents with wrong details and laboratory work, places and sightings, pressure, the scheduled pulls, S-77-004 with leans and finding, six goals, society triggers, carry-forward.
