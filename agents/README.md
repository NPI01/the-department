# The agent team

Qwen 27B-class agents on Cobble Network, run from this folder. They help write the
story and the rules now; the same role prompts are mounted in the engine later
(NPC voice, order validation, dispatch narration, pre-send review).

```bash
pnpm agents nightjar-hidden-history        # run a task
pnpm agents continuity-charter --think     # force reasoning on for every role
pnpm agents episode-01 --model qwen/qwen3.6-35b-a3b   # pin a model
```

Roles live in `roles.ts`. Task briefs are Markdown in `tasks/`. Output goes to
`out/<task>/<timestamp>/` with a `provenance.json` (models, tokens, failures), and the
Archivist's result is copied to `out/<task>/latest.md`.

**Nothing writes into `canon/` automatically.** A human reads `latest.md`, edits, and
moves it into `canon/` (public) or `canon/secret/` (engine-only). The Archivist
separates the two sections so the split is mechanical.

Model chain and retry policy are in `src/lib/cobble.ts`. If the 27B has no replica,
the run continues on the 35B-A3B or flash model and `provenance.json` says so.
