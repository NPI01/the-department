# The Department — Rulebook

> **DRAFT v0.1 (2026-10-11), for Nathan.** Not canon yet; promote to `canon/` once
> approved. Everything not marked **[PROPOSED]** restates decisions already in canon:
> `canon/00-player-bible.md`, `canon/01-correspondence-and-rules.md`,
> `canon/03-governance-charter.md`, and the engine as built (`src/lib/email/inbound.ts`,
> `src/lib/engine/`). **[PROPOSED]** marks a new rule written to fill a gap; numbers there
> are starting points to tune with bot seasons. Open decisions and the engine work this
> draft implies are listed at the end. Contains no secret canon: safe to show players.

---

## 1. The game in one page

**The Department** is a play-by-mail game for a cohort of players, run entirely through
email. You are a new employee of **Royce Industries**, a private research company on six
hundred acres of North Dakota prairie, in October 1977. You were hired to do an ordinary
job in one of its eight departments. Within days you will find that the company's records
disagree with each other, that a scientist is missing and a technician is dead, and that
an administrative unit called the **Department of Special Research and Development** has
an interest in you.

What you do about it is up to you. You can investigate, keep your head down, build
alliances, win a committee seat, trade secrets, report colleagues to Security, or accept
an invitation from people who are not on the org chart. Other players are doing the same,
and their goals overlap with yours, compete with them, or contradict them outright.

- **One round a day.** Morning dispatch, a day of correspondence, orders lock at night.
- **Talking is free; committing is not.** Letters cost nothing. Actions that change the
  world cost resources and are written in a short, exact form the game reads literally.
- **No app, no login.** Your mail client is the board.
- **No game master in the loop at night.** The engine resolves everyone's orders at the
  same time under fixed rules and explains every ruling.

## 2. The calendar

**2.1 Rounds.** One round is one real day and one game day. Times are Eastern.

| Time | What happens |
|---|---|
| 9:00 AM | **Dispatch.** Your private report: results of last night's orders, new memos, letters that arrived, votes that opened or closed. |
| All day | **Correspondence.** Write to anyone you can reach. Send, revise or cancel orders. |
| 8:00 PM | **Lock.** Orders and votes received before this moment count. Later ones count toward the next round. |
| Overnight | **Resolution.** The engine resolves every order at once, in a fixed order (§6.6). |

**2.2 Episodes and seasons.** Fourteen rounds make an episode; twelve episodes make a
season. Each episode has its own pressures, at least one collective decision (a vote, an
appointment, an authorization or a sealing order), and its own private objectives.
Round 1 of Season One is Monday, October 10, 1977, and the game calendar advances one day
per round.

**2.3 The pilot.** [PROPOSED] Season One launches as a pilot of Episodes 1–3 with twelve
players. Pilot players keep their characters if the season continues.

## 3. Who's who: kinds of characters

**3.1 Player characters.** Every player runs exactly one employee of Royce Industries.
You are listed in the Personnel Directory with your name, title and department, like any
other employee. Nobody is told which names in the directory belong to players.

**3.2 Staff (non-player characters).** Everyone else in the directory is played by the
game: executives, department heads, scientists, guards, secretaries. They have their own
interests, memories, loyalties and things to lose. They remember what you told them and
what you promised. They answer letters, make offers, vote in committees, lie, and act on
their own schedules. You cannot tell from a letter whether its writer is a player or
staff, and the game will never confirm it.

**3.3 Outsiders.** Some people who matter are not employees: townspeople, a sheriff,
ranchers, a newspaper correspondent, people who write to you first. You can reply to
anyone who has written to you. Reaching an outsider who has not written to you takes an
order (§6.3, `CONTACT`).

**3.4 Organizations.** Royce's governing bodies (the Board, the Research Committee, the
Safety Committee) are described in §8. Other organizations exist that do not appear on
the org chart. Some players will be invited to join one. You may accept, refuse, report
the invitation to Corporate Security, or accept while reporting to someone else. The game
never discloses anyone's membership.

**3.5 Aliases.** A character can operate under a second identity with its own mailbox
(§7.6). An alias is a separate name in the fiction but always belongs to one player.

## 4. Your character

**4.1 What you receive.** When your cohort convenes, you receive a personnel file with:

| Element | What it is |
|---|---|
| Name | chosen by you, period-appropriate [PROPOSED] |
| Department | one of the eight (§4.2); your institutional access |
| Title | a junior position in that department |
| Clearance | level 1, like every new hire (§4.4) |
| Specialization | what you are particularly good at (§4.3) |
| Background | a private paragraph: why Royce hired you, what you bring, what you would rather nobody knew |
| A relationship | one person at Royce or nearby who knows you already |
| Personal Goal | a confidential goal from your supervisor, worth points (§10) |
| Mailbox and address book | how you write to people (§7) |
| Resources | 10 Action Units to start (§5) |

**4.2 Departments.** Your department decides what files you can open, what your
superiors expect of you, and what other players will need from you. No department sees
the whole picture.

| Department | Ordinary work | What it gives you in play |
|---|---|---|
| Advanced Materials | metallurgy and exotic alloys | laboratory access, prototypes, technical analysis |
| Aerospace Systems | aviation and guidance | flight records, field tests, aerial survey |
| Biological Sciences | veterinary and medical research | specimens, field ecology, research-ethics files |
| Applied Physics | energy systems and instrumentation | experiment schedules, power and instrument logs |
| Information Systems | computing and statistics | data correlation, signal records, pattern work |
| Procurement & Logistics | purchasing and transport | invoices, shipping manifests, money trails |
| Corporate Security | security and investigations | access logs, investigations, surveillance authority |
| Personnel & Administration | hiring and internal policy | personnel files, records, governance procedure |

[PROPOSED] Applicants rank their three preferred departments. The game assigns
departments so that each cohort covers all eight before any department gets a second
player; it then honours preferences as far as it can.

**4.3 Specializations.** Your department is your access; your specialization is your
talent. You choose one. [PROPOSED] Each gives one standing edge:

| Specialization | Good at | Edge |
|---|---|---|
| **Analyst** | reading documents, spotting what does not fit | `EXAMINE` costs 1 AU less, and each examination reports one additional observation when the document has more to give. |
| **Negotiator** | people, bargains, coalitions | Staff start one step warmer toward you. One `MEET` per round costs nothing. You can be a party to any number of agreements at once (others: three). |
| **Operative** | fieldwork, discretion, getting in and out | `TRAVEL` and `SURVEIL` cost 2 AU less. When someone surveils you, you learn that you were watched (not by whom). |
| **Administrator** | procedure, paperwork, committees | `REQUEST_FILES` costs 2 AU less. Once per episode you may sponsor a motion without a member's countersignature (§8.3). |

Neither department nor specialization locks you in. Careers change through play: a
transfer, a promotion, a committee seat, a dismissal.

**4.4 Clearance.** Clearance decides which files and places you can reach. Everyone
starts at 1.

| Level | Typical holder | Opens |
|---|---|---|
| 1 | new hires | your own department's working files; the public campus map |
| 2 | confirmed staff | your department's archives; requisition and personnel index lookups in your department |
| 3 | project staff | one named project's restricted files in your department |
| 4 | department heads, DSRD liaisons | other departments' files; DSRD coordination memos; the north installation |
| 5 | executives | OMEGA; Sublevel Nine; SENTINEL correspondence |

Clearance is granted by the Research Committee on a department head's recommendation, or
by the Board. Corporate Security can suspend a clearance for up to two rounds while it
investigates; the Safety Committee then decides. Reaching above your clearance is
possible (a cleared colleague can fetch a file for you, or you can take one), but it is a
breach if discovered.

## 5. Resources

**5.1 Action Units (AU)** are your capacity to act each round.

| Rule | Value |
|---|---|
| Income | 20 AU at each dispatch |
| Cap | 60 AU; income above the cap is lost |
| Starting balance | 10 AU |
| Hold bonus | +5 AU at the next dispatch (§6.2) |
| Standing order upkeep | 2 AU per standing order per round |
| Rank upkeep [PROPOSED] | clearance 4 and 5 pay 3 AU per round |

Voting, correspondence, accepting agreements and transfers cost nothing. Orders cost AU
(§6.3). Your balance is printed in every dispatch.

**5.2 Holdings.** What you accumulate and keep: files and documents, evidence (§9),
informants and contacts you have recruited, equipment, access you have been granted, and
aliases. Holdings appear in your dispatch. Some can be handed to another character
(`TRANSFER`, §6.5); some can be lost (seized, stolen, revoked, or simply gone).

**5.3 Standing.** Relationships matter more than AU. Staff remember whether you kept
your word, whom you reported, and whom you protected. There is no number for this on
your dispatch; you learn where you stand from how people treat you.

## 6. Your turn

**6.1 The shape of a round.** Each round your character does one of three things:

- **Orders.** You send one or more orders before the lock. They cost AU and resolve
  overnight.
- **Hold.** You send `HOLD`. You take no new actions, your standing orders and defenses
  stay in force, and you get +5 AU at the next dispatch.
- **Missed turn.** You send nothing. You get no hold bonus, your standing orders are
  suspended for the round, your character follows default behaviour, and the world still
  happens to you.

You can still write letters, vote and accept agreements in any of the three.

**6.2 How to send orders.** Orders go in any email you send to the game, one per line,
each line starting exactly as shown. Put them at the top or bottom of a letter, or send
them on their own to your own mailbox. The game reads these lines without interpretation:

```
ORDER: INVESTIGATE the September 28 HARVEST shipment
ORDER: REQUEST_FILES Procurement manifests, Sept 1977
HOLD
```

Everything that is not a command line is ordinary correspondence. If something you wrote
looks like you meant to commit to an act but you did not use a command line, the game
asks you to confirm before anything happens. Nothing is ever committed on a guess.

[PROPOSED] **Revising.** Your latest message containing orders replaces all earlier
orders for that round. To cancel everything, send `CANCEL ORDERS`. The dispatch confirms
what was locked.

[PROPOSED] **Limit.** At most three orders per round, plus any standing orders already
running.

**6.3 The orders.** [PROPOSED: list and costs.] Write the verb, then plain-language
details. Be specific: who, what, where.

| Order | Cost | What it does |
|---|---|---|
| `INVESTIGATE <subject>` | 6 | Look into a person, place, event or rumour. Returns intelligence: what people say, what is on file, what does not add up. |
| `REQUEST_FILES <records>` | 4 | Pull records you are cleared for. Above your clearance, the request goes to whoever can approve it, and they may ask why. |
| `EXAMINE <item>` | 3 | Study a document or object you hold. Can turn intelligence into evidence (§9). |
| `TRAVEL <place>` | 5 | Go somewhere off campus (Minot, Tagus, Split Rock Basin, a ranch). Other orders that round take place there. |
| `MEET <person>` | 3 | Talk in person. Nothing said at a meeting is on paper, so it cannot be intercepted, but it also cannot be quoted as evidence. |
| `CONTACT <person or organization>` | 4 | Reach someone outside the company who has not written to you. They may not answer. |
| `SURVEIL <person or place>` | 8 | Watch who comes and goes and who writes to whom. Shows connections, never letter contents. Can be standing. |
| `PROTECT <person, place or item>` | 4 | Guard against surveillance, theft and interference. Can be standing. |
| `OBTAIN <item>` | 8 | Take or copy a document or object you are not entitled to. Risky; it may be noticed. |
| `RECRUIT <person>` | 10 | Turn a contact into an informant who reports to you each round. Needs an existing relationship. |
| `FILE <evidence> WITH <body>` | 2 | Submit evidence to a committee so it can rule on it (§9). |
| `SPONSOR_MOTION <body> "<title>" CLOSES <round>` | 5 | Put a motion before a committee (§8.3). |
| `ESTABLISH_ALIAS "<name>"` | 10 | Open a second identity with its own mailbox (§7.6). |
| `EMERGENCY_DIRECTIVE "<text>"` | — | Only for officers who hold emergency authority (§8.5). |

The game may recognise other sensible verbs; if it cannot, the dispatch says so and
refunds the AU. Your department, clearance and specialization decide how much an order
can achieve, so the same order works differently for different people.

**6.4 Standing and fallback orders.** [PROPOSED syntax.]

```
STANDING ORDER: SURVEIL the Tagus road
CANCEL STANDING 2
ORDER: MEET Dr. Ely
FALLBACK: INVESTIGATE Dr. Ely's laboratory schedule
```

A standing order repeats every round until cancelled and costs 2 AU per round in upkeep
after the first. The dispatch numbers your standing orders so you can cancel them. A
`FALLBACK:` line directly under an order replaces it if it cannot be carried out (the
person is gone, the place is sealed, you lack the AU).

**6.5 Free acts.** These cost no AU and also take effect at the lock:

```
VOTE B-77-003: FOR              (or AGAINST, ABSTAIN)
PROXY B-77-003 TO <member>      [PROPOSED]
ACCEPT AGREEMENT A-77-002       (or REJECT AGREEMENT A-77-002)
TRANSFER 10 AU TO <name>
TRANSFER <holding> TO <name>    [PROPOSED for holdings]
```

**6.6 How the night resolves.** All orders resolve together, in this fixed order:

1. **Validate.** Check authority, clearance and cost; reserve AU; reject what cannot be
   done and say why.
2. **Governance.** Close votes, make appointments, apply rule changes.
3. **Agreements.** Carry out formal agreements whose conditions are met; mark breaches.
4. **Actions.** Defend, then move, then intercept, then investigate. Protection laid
   tonight works against surveillance attempted tonight; a traveller reaches a place
   before investigating it.
5. **The world.** Staff act, projects advance, pressures build, holdings decay.
6. **Dispatch.** Your report is written and sent for 9:00 AM.

Who submitted first never matters. When orders collide (two people after the same file,
one watching a road the other is driving), the result depends on clearance, department,
specialization, AU committed, defenses and standing, and [PROPOSED] a measure of chance
drawn from a recorded seed. Every ruling in your dispatch says what happened and why.

## 7. Correspondence: how to reach people

**7.1 One mailbox.** All in-game mail passes through the company mail room at a single
address, `thedepartment@weird.delivery`. Every letter you receive comes from that
address; who wrote it, and to whom, is printed in the letter itself.

**7.2 Your seal.** Letters the game sends you are addressed so that a reply carries your
personal seal, a short code after a `+` in the reply address. Always write from the
email account you registered with. A letter with your seal is trusted and can carry
orders and votes; one without it is delivered as correspondence, but cannot commit you
to anything until you confirm it. Never share a reply address: anyone holding it could
write as you.

**7.3 Whom you can write to.** To answer a letter, reply to it. To write to anyone in the
Personnel Directory, or anyone who has written to you, send a new message to the mail
room with their name on the first line:

```
TO: Dr. Sarah Ely
```

A name the directory does not know comes back with a note from the mail room. Reaching
an outsider who has not written to you takes `CONTACT` (§6.3). [PROPOSED] Player letters
are delivered within minutes. Staff and outsiders answer when they would: often the same
day, sometimes in the next dispatch, sometimes never.

**7.4 Groups.** Address or copy several people on one letter and everyone on it receives
it, with the full list of recipients visible, as in 1977. Replies follow the thread.

**7.5 Kinds of correspondence.** Mark the kind in the first word of the subject line
[PROPOSED]; unmarked letters are private correspondence.

| Kind | Subject starts | Effect |
|---|---|---|
| Private correspondence | (nothing) | off the record, between the people on it |
| Memorandum | `MEMO:` | official and on the record; can be cited in committee proceedings |
| Directive | `DIRECTIVE:` | an instruction; binding only if you have authority over the recipient |
| Petition or motion | `PETITION:` | a formal request to a committee |
| Interrogatory | `INTERROGATORY:` | a formal question the recipient must answer, refuse or contest on the record |
| Sealed dispatch | `SEALED:` | restricted handling; harder to intercept, and conspicuous for that reason |

**7.6 Aliases.** With `ESTABLISH_ALIAS` you gain a second mailbox under another name. You
write from it by addressing your letter to it [PROPOSED mechanics in the engine notes];
recipients see only the alias. Surveillance can link an alias to its owner.

**7.7 What stays private.** Nobody in the fiction reads your letters unless they get
them by play: a recipient forwards one, a document is stolen with `OBTAIN`, someone is
watching with `SURVEIL` (who wrote to whom, not what), or a committee compels it.
Anything you send to a person is theirs to show, quote or forward. Once given, a letter
can become evidence.

**7.8 Deals and agreements.** Most deals are just words in letters: a promise, a trade
of favours, a threat. The game remembers them, and so do the people you made them with,
but nothing enforces them. A **formal agreement** is different: it is numbered, its terms
are recorded, and the game carries out the parts it can (transfers on a date, a vote
pledged on a motion) and marks a breach when a party fails. [PROPOSED] To propose one,
write a letter copied to every party:

```
AGREEMENT: "Files for a vote" WITH <colleague A>, <colleague B>
TERMS: <colleague A> transfers the Procurement manifests to <colleague B> by round 6
TERMS: <colleague B> votes FOR R-77-004
```

The game numbers it (e.g. `A-77-002`) in the next dispatch. It takes effect when every
party has sent `ACCEPT AGREEMENT A-77-002`, and lapses if anyone sends `REJECT`. Kinds:
*formal* (enforced where possible), *political* (public, not enforced), *secret* (known
only to the parties, not enforced). Breaking any of them has consequences with the people
involved.

**7.9 Out of character.** [PROPOSED] Questions about the rules, bugs and real-life
matters go to `showrunner@weird.delivery`. That mailbox is outside the fiction and never
counts as play.

## 8. Committees, motions and votes

**8.1 The bodies.** Royce is governed by the **Board of Directors** (seven seats: budget,
appointments, policy, the charter), the **Research Committee** (five seats and one
employee representative: projects, experiments, data classification, clearance), and the
**Safety Committee** (five seats and one employee representative: sealing orders, access,
internal investigations, emergency authority). The full charter is a separate document.

**8.2 The employee seats.** [PROPOSED] In Round 3 of Episode 1 your cohort elects two of
its own to the employee seats, one per committee, by plurality of votes cast. They are
full voting seats and the first real power a new hire can hold.

**8.3 Motions.** Any member may sponsor a motion; any employee may, with one member's
countersignature. A motion is announced in the next dispatch with its number
(e.g. `B-77-003`), stays open for two to five rounds, and is tallied at the lock of its
closing round. You may change your vote until then. Passed motions take effect at the
next dispatch. Quorum is half the seats, rounded up; ties keep things as they were;
abstaining counts as voting.

**8.4 Rules players can change.** The Board can amend a closed list of rules: committee
seats, quorum, thresholds, which clearance opens which archives, department budgets,
the length of emergency authority, who may sponsor motions, and whether committee votes
are secret. It cannot change the daily rhythm, AU income and cap, the command lines, or
the fairness rules in §12.

**8.5 Emergency authority.** The Chairman, and the Director of Corporate Security for
security matters, can issue an emergency directive that takes effect at once and expires
two rounds later unless the Safety Committee extends it.

**8.6 Your own organizations.** [PROPOSED] Players can found their own groups. Write a
charter (membership rules, how decisions are made) and send it to the showrunner; once
recognised, the group gets a group mailbox and its votes run like any committee's.

## 9. Evidence and findings

What you learn comes in three grades:

1. **Intelligence.** Something you believe is relevant: a rumour, a remark, a hunch, a
   line in a ledger.
2. **Evidence.** A document, object or testimony with provenance: where it came from,
   who held it, how you got it. `EXAMINE` turns intelligence into evidence when there is
   something to examine.
3. **Established finding.** Evidence a committee has formally accepted under its
   procedures (`FILE ... WITH`, then a vote). Findings justify motions, dismissals and
   sealing orders.

A finding can be properly established and still be wrong. Documents can be authentic and
contradict each other. People lie. The game keeps track of what is true; nobody else
does.

## 10. Personal Goals and points: what you are playing for

[Scoring decided by Nathan 2026-10-12: points and a season standings board with a
winner. Point values below are the published figures; the rest is PROPOSED.]

**10.1 Your first goal.** Every new hire starts with one **Personal Goal**, set by your
supervisor in the first work memo you receive: for example, *Determine who approved the
Tagus shipments*. It is confidential, it has a deadline, and it is worth a stated number
of points. It is also on your personnel file, with your running score.

**10.2 More goals.** As the season goes on you may be given further goals: by your
supervisor, by people you make deals with, or by the episode itself. Each one is worth
points. You can hold several at once. Some players' goals depend on each other; some
conflict outright.

**10.3 What counts as done.** A goal's text says what you are after, not what proof the
company will accept. Working that out is part of the game. When a goal is judged, your
personnel file shows it as **Met** (with the points given, which may be less than the
full value for a partial result) or **Not met**, sometimes with a short ruling. Failing
a goal costs you nothing but the points.

**10.4 Standings and winning.** Your score is the sum of points from goals you have met.
The season standings, posted on your personnel file, list everyone in your cohort by
score; goals themselves stay confidential, only totals are posted. The employee who
stands first when the season ends wins it. Ties share a place. Every character also gets
an epilogue, written from what they actually did.

**10.5 Daily intentions** are still yours alone: find this file, win that vote, keep that
secret. They score nothing by themselves, but they are usually how goals get met.

## 11. Absence, leave and leaving

[PROPOSED.]

- **One missed turn** follows §6.1: default behaviour, no bonus, standing orders paused.
- **Three missed turns in a row:** your character is placed on leave. Staff stop
  expecting replies, your committee seat (if any) votes as an abstention, and your
  holdings are safe. Any order or `RETURN` brings you back the next round.
- **Seven missed turns in a row:** your character is reassigned out of Station R, and
  their story ends in the fiction. You can join a later cohort with a new character.
- **Going on leave on purpose:** send `LEAVE <rounds>` (up to five) to step away without
  penalty to your standing.

## 12. Fair play and the engine

- **Software runs the game.** The game is run by software, including AI models that
  write staff letters and dispatches and read your letters for meaning. Mail you send to
  the game is processed this way and stored. It is never shown to other players except as
  these rules allow.
- **A model never decides a consequential act.** Votes, orders, transfers and
  agreements come only from command lines or your explicit confirmation. A model may
  suggest that you meant to commit; you decide.
- **Rulings are explained.** Every result says which rule applied and why. [PROPOSED]
  To dispute a ruling, write to the showrunner with `APPEAL` and the round number before
  the next lock.
- **Keep real life out.** Do not use real personal information about other players in
  play. The game never turns out-of-game information into fiction.
- **Threats stay in the fiction.** Characters can threaten, betray and lie to each
  other. Players do not harass players. The showrunner may remove anyone who does.
- **One player, one character, one registered email address.**

## 13. Quick reference

```
Command lines (start of a line, any email to the game):
  ORDER: <VERB> <details>                 one action; costs AU
  STANDING ORDER: <VERB> <details>        repeats each round       [PROPOSED]
  FALLBACK: <VERB> <details>              if the order above fails [PROPOSED]
  CANCEL STANDING <n> / CANCEL ORDERS                              [PROPOSED]
  HOLD                                    no new actions; +5 AU next round
  VOTE <motion>: FOR | AGAINST | ABSTAIN
  PROXY <motion> TO <member>                                       [PROPOSED]
  AGREEMENT: "<title>" WITH <names>  + TERMS: lines                [PROPOSED]
  ACCEPT AGREEMENT <id> / REJECT AGREEMENT <id>
  TRANSFER <n> AU TO <name>
  LEAVE <rounds> / RETURN                                          [PROPOSED]

Clock: dispatch 9:00 AM ET · lock 8:00 PM ET · 14 rounds an episode
AU:    +20 a round · cap 60 · start 10 · hold +5 · standing order 2/round
Write: reply to a letter, or TO: <name> on the first line of a new message to the mail room
Help:  showrunner@weird.delivery (out of character)                [PROPOSED]
```

---

## For Nathan: decisions this draft needs

1. **The order list and costs (§6.3).** The verbs and numbers are my proposal. They are
   consistent with the 20/60/10 economy: a full round is two or three meaningful acts.
   Bot seasons should tune them.
2. **Specialization edges (§4.3).** Small, permanent, one per specialization. Too much
   or too little?
3. **Agreements (§7.8).** How a formal agreement is proposed and what the game enforces.
4. **Character creation (§4.1–4.2).** Players choosing names and specialization and
   ranking departments, with the game balancing the cohort; versus the game assigning
   everything.
5. **Chance (§6.6).** A recorded seeded draw in contested actions, or fully
   deterministic resolution where ties go to the defender.
6. **Delivery timing (§7.3).** Player-to-player letters delivered immediately, or held
   and delivered in batches.
7. **Objectives and winning (§10).** DECIDED 2026-10-12: points for met Personal Goals,
   a posted standings board, and a season winner. Point values public; conditions secret.
8. **Absence (§11).** The 3- and 7-round thresholds.
9. **Player-founded organizations (§8.6)** and **aliases (§7.6)** in the pilot, or later.
10. **Political capital.** The schema and the brainstorm have it; canon does not. This
   draft leaves it out and lets standing (§5.3) carry it unless you want a number.
11. **One document or two.** This draft absorbs `canon/01-correspondence-and-rules.md`.
    On promotion, retire 01 or keep it as the short version.

## Engine work this draft implies

Already built: `ORDER:`, `HOLD`, `VOTE` (including REMOVE/RETAIN), `ACCEPT`/`REJECT
AGREEMENT`, `TRANSFER <n> <resource> TO`, the seal in the plus-address, phase order,
missed-turn defaults, motion tallying. Not built yet:

- The parser: `STANDING ORDER:`, `FALLBACK:`, `CANCEL ORDERS`, `CANCEL STANDING`,
  `PROXY`, `LEAVE`/`RETURN`, transfers of holdings.
- Replace-on-resend: orders are currently appended for a round; §6.2 says the latest
  message replaces them.
- The three-order limit, AU costs per verb, refunds for unknown verbs, specialization
  edges.
- Pending confirmation when the model reads intent without a command line. The site
  promises "no login", so confirmation needs to be by reply (e.g. `CONFIRM <code>`), not
  a web page.
- Relaying player-to-player mail through character mailboxes; the address book with
  sealed addresses in each dispatch.
- Alias sending; group mailboxes; subject-line correspondence kinds; the `showrunner@`
  out-of-character mailbox; `APPEAL`.
- Agreements: a way to *create* one. The grammar can accept or reject an agreement but
  nothing proposes it. Suggested: `AGREEMENT: "<title>" WITH <names>` followed by
  `TERMS:` lines, in a letter copied to every party, which the game numbers `A-77-nnn`.
