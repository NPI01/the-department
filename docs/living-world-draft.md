# The living world: design v0.2

How the engine grows the world overnight when a player reaches for something that
does not exist yet. Designed and built 2026-10-16 (src/lib/engine/grow.ts; console at
/admin/world). The Building 7 order is the worked example throughout: Joe drove there, waited
for someone to come out, and wanted their name. Building 7 has a description and no one
in it, so the engine had nobody to give him.

## The rule
**The world is generated where it is encountered, never where it is not.** A gap is
opened only by a player's order (a place, a person, an office the index does not have),
and only the piece that order needs is written: one person at Building 7, not Building
7's staff list. Generated content adds depth; it never moves the arc. The arc lives in
canon/secret (the truth ledger, the beats, the allegiance matrix) and stays hand-written.

## The night
The window is the lock at 8 PM to the dispatch at 9 AM, Eastern. Today the lock runs
seven phases (validate, governance, diplomatic, strategic, world, narrate, send). One
new phase goes in before strategic:

| Phase | What happens |
|---|---|
| validate | as now; plus: every funded free-form step whose target the index cannot place, or can place but has no one there to meet, is written down as a **world request** (who asked, the clause, the verb, the place, the round) |
| **grow** | for each request, the writers' room runs (below). Each request has a budget (two writer drafts, two Skeptic reads, ~3 minutes). A request that fails stays open for a human and the order is ruled as it would be today ("nobody came out; units returned") |
| strategic | the order resolves against the grown world: Joe meets the person who came out of Building 7, and the morning dispatch says who |
| narrate / send | the dispatch and the new person's first letter (if the order was a conversation) go out as now |

Model time is the only new cost, and it is bounded: the night is eleven hours and a
cohort sends a handful of free-form orders.

## The writers' room (per request)
The same roles as agents/ and the staff-reply pipeline, run from the engine with the
same guards. The pattern the memory notes support: the Character Writer is good at
people; the Skeptic catches contradiction and leakage; neither is trusted with rules.

1. **Brief** (deterministic). The request, the place's existing text, the public canon
   around it (directory entry for the department, the public bible, the rulebook's
   world), the episode's pressure band, and a **constraint block**: the protected facts
   it may not touch, the secret names it may not use (the staff-reply SECRET_TERMS list
   plus the truth ledger's keys), what it must produce (a person: name, job, a public
   directory line, a cast sheet in the existing `CastSheet` shape with voice, wants,
   never_says, a checkable lie that resolves to existing world state; a place: the
   `PlaceDef` shape with visit, ask, sightings by round band).
2. **Character Writer** drafts the person or place as JSON plus a one-paragraph public
   description. The writer sees public canon only; it never sees canon/secret.
3. **Skeptic**, two reads, each with the quote-verification rule from staff replies:
   contradiction with canon (public and secret: the Skeptic is the only role that sees
   the secret side), leakage of secret names or facts, period plausibility (no 1990s
   technology, no impossible geography; the agent-run memory lists the kinds of error
   to look for), and scope (does it add depth without deciding anything the arc
   decides). A flag counts when both reads agree or the quoted phrase is in the draft.
4. **Fix or retry**: a flagged draft is retried fresh (never shown its own rejected
   draft) with the flags added to the constraint block, at most twice.
5. **Archivist** (deterministic code, not a model): writes the row, with provenance
   (request, models, drafts, Skeptic verdicts), status `live`, listed for the cohort
   that met them.

Hard limits that no model can cross, enforced in code after the Skeptic:
- a generated person is never a member of the Board or a committee, never holds a
  document in the index, never has clearance above 2, never knows a protected fact;
- a generated place is never `restricted` unless the request's place already was, never
  `contains` an indexed document, never off campus unless the request was;
- generated names are checked against every existing name (canon, directory, world
  tables) and the real-person list in the bibles;
- nothing generated is secret canon. It is engine data with a PROPOSED flag that the
  showrunner can retire.

## Storage: world level, not campaign level
Today `characters` and `places` are per campaign (characters in the table, places in
`src/lib/engine/world/*.ts`). Generated content has to outlive a cohort, so:

- `world_people` and `world_places`: one row each, `campaign_id` null, with the sheet /
  PlaceDef JSON, the public text, `status` (live | retired), `origin` (which cohort,
  which order, which round), `provenance`, `created_at`.
- When a cohort encounters a world person, a `characters` row is made for that campaign
  from the world row (`world_person_id` on characters), so per-cohort memory, knowledge,
  obligations and letters stay separate. The same person, the same voice, a different
  history with each cohort.
- `placesFor(episode)` merges the hand-written TS data with live `world_places`, so
  resolve.ts, pricing.ts and surveillance need no change.
- The directory (letter and web) lists a world person for a cohort once someone in
  that cohort has met them (`characters.npc_state.listed` set when encountered). The
  directory grows as the world is met, the way Nathan described, and the rest of the
  cohort learns the name from the player who found it, or from the directory.

Hand-written canon keeps precedence: a world row is never created for a name that
exists in canon, and a later hand-written entry for the same person supersedes the row.

## The showrunner side
A console page, **Overnight additions**: every request, what was generated, the
Skeptic's reads, and three buttons: keep (default), edit the sheet, retire. Retiring
makes the person "transferred" (status retired; letters to them bounce in-world) and
re-opens the request. A morning digest line in the cohort monitor: "2 people and 1
place added overnight; 0 requests waiting on you."

## What it looks like for Joe
Round 4, Joe's order: drive to Building 7, wait, introduce himself, get a name.
- Lock, validate: the order is priced (visit 5, conversation 4) and funded. The
  conversation step targets Building 7, which has no `ask` person. World request opened.
- Grow: the writers' room produces, say, a maintenance technician with a reason to be
  at Building 7, a plain public line ("Facilities; nights"), a sheet with a want, a
  never-says, and a checkable lie about what the building holds that resolves to the
  facilities ledger Joe already has. Skeptic passes on the second read after the first
  draft named a project it should not have.
- Strategic: the visit resolves as now; the conversation resolves against the new
  person; a knowledge row says Joe met them; `listed` goes on for The Pilot.
- Morning: the dispatch names them; the directory has a new line; the person's first
  letter (through the staff-reply pipeline, unchanged) arrives when they would write.

## Decisions (2026-10-16)
1. **Gate:** auto-live; a draft the Skeptic still flags on both reads is held for the
   showrunner (Overnight additions: keep or retire).
2. **Depth only.** A generated person knows nothing of the company's secrets and has
   no secret of their own beyond their own life.
3. **Reuse across cohorts is automatic.** A person written for one cohort's place is
   met by every later cohort there (instantiated into that campaign on request).
4. **The Qwen team on Cobble writes.** Writer at temperature 0.8 on the chain (27B
   first), Skeptic at 0.2, think off.
5. Names: model-chosen, with a collision check on surnames against every character and
   world person, and a real-people list. (Not decided by Nathan; default.)
6. From the next lock on. The console can open a request by hand for older gaps such
   as Building 7 in The Pilot. (Not decided by Nathan; default.)

## As built
- Migration 0015: `world_people`, `world_places`, `world_requests`;
  `characters.world_person_id`.
- `validate` ends by opening requests from the round's funded steps (a conversation at
  a place with nobody attached → person_at_place; a place verb the index cannot place,
  with a building-ish noun → place). New phase `grow` runs the room per request.
  `strategic` then resolves: an interview at a place meets the character whose
  `npc_state.place` is that slug, marks them listed, and learns `met.<slug>`.
- Generated places merge into `placesFor()` via `setLivePlaces` (loaded at intake and
  at each lock phase).
- Hard limits in code: two-word name, no surname in use, no real person, no secret
  term anywhere in the JSON, a real department slug or null, never restricted unless
  the request's place was; clearance 1, no memberships, no documents.
- Dry run on Building 7 (not saved): 55 s on the 27B, Skeptic PASS ×2: a grounds
  technician with a want, three mundane true facts about the place, a never-says.
- Not built: re-resolving the triggering order after a held draft is kept (the player
  meets the person next time they go); a digest line in the cohort monitor.
