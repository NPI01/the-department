# Canon

What is true in The Department. Two tiers:

- `canon/*.md` — **public canon**. Safe to include in any prompt, including ones whose
  output a player will read. World structure, institutions, public histories of
  characters, rules as players know them.
- `canon/secret/*.md` — **secret canon**. Engine-only. The true mechanism of
  Administrative Convergence, what happened to Marsh, who the Quiet Office is, NPC
  hidden agendas. Never passed to a prompt that writes player-facing text.

Files are numbered to control load order. The agent harness (`agents/run.ts`) reads
all of them. Promote agent output here by hand after review; see `agents/README.md`.
Each file ends with a `CHANGELOG` line.
