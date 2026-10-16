# Correspondence and rules as players know them

Public canon v1 (2026-10-11).

## How you play
Everything is email. Each morning you receive a dispatch: results of yesterday's
orders, new memos, letters from colleagues. During the day you write to anyone in the
company directory (and some people who are not in it), negotiate, and prepare your
orders. At 8:00 PM Eastern orders lock and the world resolves overnight.

## Classes of correspondence
- **Memoranda** — official, on the record, citable in proceedings.
- **Private correspondence** — off the record, between individuals.
- **Directives** — instructions from someone with recognized authority.
- **Petitions and motions** — formal requests for a committee decision.
- **Interrogatories** — formal questions you must answer, refuse, or contest.
- **Sealed dispatches** — restricted visibility, special handling.

## Consequential acts
Talking is free. Committing is not. The following lines, at the start of a line in
any email to the game, are read literally and are binding:

```
ORDER: <verb> <details>          e.g. ORDER: REQUEST_FILES HARVEST sampling authorizations 1976
IF <condition> THEN <order>      a trip-wire: carried out only if the condition comes about tonight
FALLBACK: <order>                carried out only if the order above it fails
HOLD                             strategic hold this round; watchful at your desk
HOLD EXCEPT <name>, <name>       hold, letting these colleagues pass your watch
AUTHORIZE <name> / REVOKE <name> they may (not) pull your department's files; they are not told
ATTITUDE <name>: FRIENDLY | NEUTRAL | HOSTILE
ORDER: LEAK <item>               a copy to the Minot Daily News for its next issue
VOTE <motion-number>: FOR|AGAINST|ABSTAIN
ACCEPT AGREEMENT <id>  /  REJECT AGREEMENT <id>
TRANSFER <n> <resource> TO <person>
SEND <item> TO <person>          a copy of a Case File item into their cabinet
FILE <item> WITH <committee>     a Case File item before a body, as evidence, on the record
ACCEPT INVITATION / DECLINE INVITATION
```
Anything else is conversation. If the game is unsure whether you meant to commit, it
will ask you to confirm before anything happens.

## Three ways to spend a round
- **Orders** — actions that cost Action Units, access, or favours.
- **Hold** — conserve; keep standing orders and defenses; modest advantage; learn who
  pulled your department's files and who reported you.
- **Missed turn** — you sent nothing; your character follows defaults and events still
  happen to you.

## Evidence
Intelligence (believed relevant) → Evidence (an artifact, document or testimony with
provenance) → Established Finding (accepted by a committee under its procedures). A
finding can be formally established and still be wrong.

## Forms
Some matters are handled on paper. A staff member may require a company form before
acting on, or discussing, what you have raised. Reply `FORM 14-B` to receive a blank;
reply with the form number and numbered answers to file it. A filed form is on the
record under your name, costs nothing, is not an order, and is remembered by the office
that owns it. See `06-forms.md`.

## Committees
Royce is governed by its Board, the Research Committee, and the Safety Committee, each
with members, quorum and thresholds (charter in progress: `agents/tasks/royce-governance-charter.md`).
Every episode contains at least one collective decision: a vote, an authorization, an
appointment, a sealing order.

## Contact reports, declarations and the paper
Two people who touch the same place, file or person in one night each learn the other
was there (a watcher sees and is not seen; an Operative is never listed). Declarations
(`AUTHORIZE`, `REVOKE`, `ATTITUDE`) are free, standing, and never disclosed to the person
named. The *Minot Daily News* comes out on the mornings of days 7 and 14 and prints what
the committees decided and whatever was leaked to it. The rulebook has the detail.

CHANGELOG: v1 sets the player-facing rules of correspondence, the deterministic grammar, round modes, evidence tiers, committee outline. v1.1 (2026-10-12) adds forms. v1.2 (2026-10-16) adds conditional orders, the watchful hold, contact reports, declarations and the paper.
