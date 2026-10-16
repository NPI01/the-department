# The Showrunner's Room: design v0.3

An agentic layer that runs the story every night without a human. Proposed and built
2026-10-16 (src/lib/engine/room.ts; console /admin/room). Nathan is Executive Producer in one sense only: he sets up a season (the
setting, the arc, the cast, the charter) with Claude before it starts, and after that
**no human is in the loop**. Nothing waits on him. The room decides everything the
season frame leaves open, for every cohort, and he finds out what happened the way the
players do. v0.1 had a "the EP decides" level; v0.2 removes it.

## What the room is for
Today five kinds of thing wait for a human, and the pile grows with every cohort:

| Queue | Where it waits today |
|---|---|
| World drafts the Skeptic flagged (grow phase) | /admin/world, status held |
| PROPOSED blocks and open questions in canon docs | /admin/review (`proposals`) |
| Goals marked `review: true` in the predicates (engine proposes, human decides) | /admin/casting |
| Staff replies that fell to the in-character deferral after four drafts | nowhere; the player got a brush-off |
| Beats and pressure that the engine runs blind (what fires, when, for whom) | the beat sheet, fixed at season start |

The room takes all five and adds the thing none of them do: it **moves the story each
night**, within the season, by small deliberate acts, so that the season is lived rather
than played back. The EP's frame is the walls; the room furnishes the rooms.

## The night, with the room in it
```
8:00 PM  lock
         validate      fund orders; open world requests            (engine)
         grow          write people and places for the gaps        (writers' room)
         TRIAGE        decide everything waiting: held drafts,     (the room)
                       proposals, goal reviews, deferred replies
         governance, diplomatic, strategic, world                  (engine, deterministic)
         MOVES         read the night; propose, check and commit    (the room)
                       the story's next small steps; write letters
         narrate       dispatches                                   (model, templated fallback)
9:00 AM  send          mail out; the season log written
```
Triage runs before the deterministic phases so a kept draft is in the world when the
orders resolve. Moves run after them so the room acts on what happened, never instead of
it. Nothing consequential waits on the room: if it is late or fails, the night goes out
as it does today.

## Authority: three levels, no human
The design rests on a written **charter** per show that says what the room may do, what
it may do only with its own dissent process, and what is fixed at season setup. Code
enforces the lines; no model is asked to respect them on its honour.

| Level | Who decides | Examples |
|---|---|---|
| 0. Engine | deterministic rules | order outcomes, votes, funding, pressure tiers, goal scoring by predicate |
| 1. The room, one pass | the Showrunner decides; Continuity, Skeptic and Rules Lawyer must each return nothing | keep or retire a held world draft; rule a `review` goal; approve a PROPOSED item that only arranges existing canon; an NPC initiative from their cast sheet; a beat moved by up to two rounds; which pool goal a new hire gets; a depth-only side thread |
| 2. The room, with dissent | as Level 1, plus a **second Showrunner read from a fresh context** must agree; disagreement means revise once, then reject; never a human | a new named character who carries a secret; a new document in the index; a new `facts` row; a beat moved more than two rounds; an NPC-sponsored motion; anything touching a player's goal; anything the Skeptic flagged on both reads |
| 3. Fixed at season setup | written with the EP before Round 1; the room reads it and cannot write it | the truth ledger, the season arc and its episode endings, the allegiance matrix, episode structure and length, the real-world setting, the charter itself, the pool of goals, the cast of principals |

Level 3 is what makes autonomy safe: the room cannot move the walls, so however it
furnishes the rooms the season still ends where the arc says. Everything in Level 3 is
data the engine reads (`facts` marked `fixed`, the arc document, the charter JSON), and
a move that would write any of it is refused in code before any model sees it.

Hard invariants above all levels, in code: no secret term in player-facing text; a
canon character keeps their canon role, status and location; no real person acts; the
amendable list in the governance charter is the only thing governance can change; every
move is reversible by the room itself for one round, and the room reviews its own last
night before it acts again.

## The roles
Same team as agents/ and grow.ts; the memory notes say where each is strong, so each
gets one narrow job per call with a checklist in code, never a multi-part brief.

- **Showrunner.** Reads the night's brief (what players did, what fired, what is
  waiting, the episode's arc paragraph and this week's beats, the pressure band, each
  cohort's standings) and produces *decisions*, one per item, each a verdict with a
  reason and a consequence list. For moves, proposes at most N per cohort per night.
  This role needs to follow constraints and weigh trade-offs; see decision 4.
- **Continuity (the Archivist).** For each decision: does it contradict canon, the
  ledger, a cast sheet, a thing a character already said (the `knowledge` table)?
  Returns contradictions with citations or nothing.
- **Skeptic.** Adversarial, two reads, quote-verified, as in grow.ts and staff replies:
  leaks, period, scope, "too much too fast" (the pacing rule by round).
- **Rules Lawyer.** Does the move break a rule, cost something, need an AU, a clearance,
  a vote? Answers from the rulebook and the verb rules; never invents numbers.
- **Correspondent.** Writes the letters a move needs, through the existing staff-reply
  pipeline (sheet, pacing, guard, Skeptic), so an NPC initiative sounds like the NPC.

A decision commits only when Continuity and Skeptic return nothing and the Rules Lawyer
returns no cost the move cannot pay. A decision any of them blocks goes back to the
Showrunner once with the objections; if still blocked it is rejected and logged, and the
room's next brief says so. Nothing is ever parked for a person.

## What a move is
A move is one of a closed set of *move types*, each with its own code path and
consequence ledger, so a model chooses and parameterizes but never free-writes an
effect:

| Move | What it does | Level |
|---|---|---|
| `npc_initiative` | an NPC writes first, offers, warns, asks, or stops answering; from their sheet's ladder and wants | 1 |
| `beat_shift` | a scheduled beat fires early or late (±2 rounds) or goes to a different player | 1 |
| `side_thread` | a depth-only thread for one cohort: a rumour, a document that exists only as a copy, a local with a grievance; spun from what players are already chasing | 1 |
| `consequence` | a result the rules did not cover: Security notices a pattern, a department head hears a name, a rancher stops talking to company men | 1 |
| `goal_offer` | a new Personal Goal from the pool to a player whose first is met or stale | 1 |
| `new_document` | a document enters the index (holder, access, grants); its text written by the Correspondent, its wrong detail (if any) chosen from a closed list of canon-consistent discrepancies | 2 |
| `new_secret_character` | a named character who carries a secret | 2 |
| `fact` | a `facts` row (world truth) | 2 |
| `motion` | an NPC sponsors a motion before a body | 2 |

Each move records: cohort, round, type, parameters, the brief it answered, the three
checks' outputs, the model provenance, what it touched (characters, facts, beats, mail),
and how to reverse it. A move touching another cohort's shared world (a world person) is
reviewed against both.

## The record (what Nathan sees, if he looks)
No digest that asks for anything. A **season log**, one page per night per show, written
by the room for itself and readable by anyone with console access: what players did,
what the room decided and why, what it moved, what it rejected and why, and its own
notes on where each cohort is heading. The console shows it; nobody has to read it.
Signals (Skeptic flag rate, rejections, replies per dispatch, quiet players, a cohort
drifting from its arc) are on the cohort monitor. The one human-facing alarm is a hard
invariant tripping (a secret term reaching a player, a canon role changed): the room
stops that move, logs it, and the monitor shows red. Even then the night goes out.

If the EP wants to intervene he can, through the console, the same way he can today;
the design does not need him to, and the room treats his intervention as a Level 3
change (it reads it; it does not argue).

## Memory and learning
- `room_decisions`: every verdict and move, with provenance, outcome and any later
  reversal (by the room's own review, or by hand). The room's brief each night includes
  the last week's reversals and rejections for that show, so corrections stick.
- `room_notes`: the room's own running notes per cohort (what it is building toward,
  what it dropped), kept short and rewritten each night. The EP can read them.
- Nothing the room writes becomes canon. Promotion to canon stays a human act
  (scripts/canon-sync, the review page).

## Beyond The Department
The room reads a **show package**, not The Department's files: canon tiers and paths,
the secret-term list, the real-people list, the cast-sheet shape, the move types
allowed, the charter (levels and defaults), the pacing rule, the period rules, the
letterhead. The Department is show one; a second show is a second package and its own
Supabase schema (the Tell No One pattern). The roles' prompts are the same; the HOUSE
block comes from the package.

## Rollout: trusted only after it has shown its work
1. **Triage, shadow.** The room decides the five queues on The Pilot every night and
   logs its verdicts and reasons; nothing commits. Claude reads the log with Nathan
   once at the end of the week and the charter is tuned.
2. **Triage, live.** Everything commits. Nothing waits.
3. **Moves, shadow.** The room proposes moves each night and the three checks and the
   dissent read run; the log shows what it would have done.
4. **Moves, live**, one cohort first, then all.
5. **Season setup as a procedure.** The setup Nathan does with Claude (setting, arc,
   cast, charter, goals) becomes a checklist and a show package, so Season 2 and the
   next show start the same way, and the room reads the package rather than this
   show's files.

Success looks like: zero human actions per night by design; rejection rate steady;
replies per dispatch not falling; cohorts ending their episodes where the arc says;
no secret term ever reaching a player (that one is zero or the room stops that move).

## Decisions (2026-10-16)
1. The Showrunner role runs on the Qwen team on Cobble: 27B first, 35B behind it
   (`MODELS` in room.ts). Nathan may swap in a stronger model later (DeepSeek, Qwen
   Next Flash, GLM): one list to change.
2. Two moves a night per cohort, at most one an `npc_initiative`, three side threads
   open at once.
3. The room may create characters who carry a secret of their own (`new_secret_character`,
   Level 2: dissent read required; the writers' room's hard limits apply).
4. Shadow first: every cohort starts in shadow (`rules` key `room.mode`, default
   shadow); the console's Season log page has the one switch to live.

## As built
- Migration 0016: `room_decisions` (every verdict and move: checks, dissent, mode,
  committed, touched, provenance), `room_log` (the season log and the room's notes for
  tomorrow), `world_documents` (move `new_document`, merged into `documentsFor()`).
- Phases: `triage` after `grow`; `moves` after `world`. Both wrapped so an error is an
  event, never a blocked night.
- Triage decides: held world people and places (keep/retire); goals the predicates
  proposed as met or could not judge (met / partly met / not met, with a player-facing
  note); up to five open PROPOSED items in canon a night (approve / reject / answer).
  Deferred staff replies are not yet in the queue.
- Moves: the brief (arc paragraph for the episode, pressure band, tomorrow's beats,
  scheduled mail, players, listed staff, tonight's orders and outcomes, open ballots,
  standings, the week's own decisions, last night's notes) → the Showrunner proposes
  ≤2 typed moves → code validates parameters → Continuity, Skeptic (quote-verified,
  plus a hard secret-term check) and Rules Lawyer → one revision with the objections,
  else rejected → Level 2 dissent read from a fresh context → commit (live) or log
  (shadow). Move code paths: `npc_initiative` (a showrunner's note in the player's
  thread, letter_kind `initiative`, answered by the staff-reply pipeline as a first
  letter; hidden from the Case File and from later thread context), `beat_shift`
  (`rules` beat.shift.<key>, read by scheduled mail), `side_thread` (a world request run
  through grow.ts, then an initiative from the new person), `consequence` (Security's
  memory or an NPC's obligation), `goal_offer`, `new_document`, `new_secret_character`
  (the secret becomes a never-says), `fact` (engine-owned and fixed prefixes refused),
  `motion` (sponsor must hold a seat; ballot notices follow automatically).
- The season log is written after moves and shown on /admin/room with every decision.
