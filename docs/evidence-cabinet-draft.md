# The Case File: design v0.2

The player's evidence store and casebook. Named **the Case File** and built 2026-10-12
(`/file/[token]/case`; console at `/admin/casting/[id]/case-file`). Original mockup:
https://claude.ai/artifact/WxWc5wjk9SCZtPszppkXUw (sample contents are public canon only).

## What it is for
The cabinet is where a player pieces the story together. It holds everything their
character holds (letters, documents, photographs, maps, diagrams, findings) and lets
them read it, mark it, connect it, and write notes. Email stays the primary interface;
the cabinet is the companion "dossier" the plan audit (§3) calls for.

## Principles
1. **It shows the player's copy, not the truth.** Each item is a snapshot of what the
   character received: a forgery stays forged, a carbon stays a carbon, copy 2 of 4
   says copy 2 of 4. The engine never edits an item after delivery; corrections arrive
   as new items. Nothing from `facts` or secret canon is rendered here.
2. **Provenance is visible.** Every item says how it was obtained, what kind of copy it
   is, and the round it was filed. This is what makes something Evidence (§9) and what
   a committee weighs.
3. **Grade is visible.** Intelligence / Evidence / Established Finding as stamps, with
   the order that moves it up a grade (`EXAMINE`, `FILE … WITH`).
4. **Losing things leaves a trace.** Items handed over, seized, stolen or destroyed stay
   as a dashed "no longer held" folder. The player keeps their notes and what they read,
   and loses the ability to transfer or file the item.
5. **Two dates.** "When I got it" (round) and "when it was written" (document date).
   Sorting by the second is how a 1921 journal lines up with a 1969 survey.

## Layout
- **Drawers:** Everything, Correspondence, Documents, Photographs, Maps & plans,
  Findings, No longer held. Filters by grade; search covers item text and notes.
- **Item view:** the item rendered as paper (typewriter text, photo print, map or
  diagram), grade stamp, provenance block; margin notes beside it. Selecting a passage
  quotes it into a new note. Each item shows its short name for orders
  (`EXAMINE pgs-69-044`, `FILE pgs-69-044 WITH <committee>`).
- **Notebook:** every note, newest first, linked back to its item, plus loose pages
  not tied to one item.
- **Connections:** a note can point at other items; an item shows everything connected
  to it through notes. That is the "string between pins", kept as plain links for v1.

Route: `/file/[token]/cabinet` and `/file/[token]/notebook`, behind the same private
token as the personnel file, with nav between the three.

## Data model (migration 0008, proposed)
- `cabinet_items`: one row per item a character holds.
  `id, campaign_id, character_id, slug` (short name for orders, unique per character),
  `kind` (letter | memo | document | report | photograph | map | diagram | object |
  testimony | finding), `drawer`, `title, from_label, written_label, written_on date`,
  `body_html` or `storage_path` (images and scans in a private Supabase Storage bucket,
  served by signed URL), `asset_id` (nullable → `assets`), `correspondence_id`
  (nullable → letters filed automatically), `round_received`, `how_obtained, copy_note`
  (player-visible provenance; engine-side chain of custody stays in `assets.provenance`),
  `grade`, `status` (held | handed_over | seized | stolen | destroyed),
  `status_note, status_round`, `created_at`.
- `cabinet_notes`: `id, character_id, item_id` (nullable = loose page), `quote`,
  `body, links uuid[]` (other items), `round, created_at, updated_at`.

How items get in: letters in and out are filed automatically when delivered or sent;
enclosures (documents, photos, maps) are filed with the letter that carried them; order
results (`REQUEST_FILES`, `EXAMINE`, `TRANSFER`) file or regrade items in the
resolution job; the showrunner console can file an item by hand. A `TRANSFER` copies
the item to the recipient and marks the giver's row `handed_over`. Notes never travel.

## Decisions (2026-10-12)
1. **Name:** the Case File. Its two views are the Cabinet (drawers) and the Notebook.
2. **Notes are strictly private.** No character, model, job or console page reads
   `case_notes`; the console shows only a count. Nothing in a note is acted on.
3. Defaults taken for v1: notes do not feed the engine; no player uploads; no corkboard
   (connections are plain links between items); the file token is enough to write notes.

## As built
- Tables `case_items` and `case_notes` (migration 0008, applied); private Storage
  bucket `case-file` for uploaded scans, served by hour-long signed URLs. Site images
  (`/images/...`) can be referenced directly.
- Letters are not copied: the Case File reads every letter between characters that
  the character wrote or received from `correspondence`, keyed `letter-<id8>` and dated
  by game day. Game notices (no in-world sender) are left out. When aliases land, a
  letter written under an alias must show the alias (TODO in `src/lib/game/case-file.ts`).
- The showrunner files items by hand from the console (text in canon Markdown, image
  upload or site path, provenance, grade) and changes grade or status there. Engine
  filing from order results (`REQUEST_FILES`, `EXAMINE`, `TRANSFER`) is still to come
  and should insert `case_items` rows the same way.
