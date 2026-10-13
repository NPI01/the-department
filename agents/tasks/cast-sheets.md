# Task: Cast sheets for twelve NPCs

A cast sheet is what the engine prompts a character from when they answer a player's
letter. It is loaded as `characters.npc_state`. Write one for each of these twelve,
keeping every DECIDED fact in canon and the public profile, voice line and allegiance
already given in `02-personnel-directory.md` and `secret/05-allegiance-matrix.md`:

Off campus (Episode 2's cast; none of these is a Royce employee):
1. Sheriff Dale Hollis   2. Gary Vane   3. Elmer Bernard   4. Capt. Thomas Bradley
5. Tech. Sgt. Arthur Doyle

On campus:
6. Harold Sloane   7. Dr. Sarah Ely   8. Dr. Adrian Vale   9. Margaret Hensley
10. Dorothy Armitage   11. Leonard Fisk
12. Maya Okafor — NEW, PROPOSED: a junior clerk in Procurement & Logistics, two years at
    Station R, the one person a new hire can buy lunch for. She has seen two versions of
    the campus map. She belongs to no faction and must stay that way; her value is that
    she is ordinary. Give her a surname-level family tie to Tagus or Minot.

For each character, deliver exactly this, in this order:

```
### <Name>
<one paragraph: who they are to a new junior employee in October 1977, and what their letters are like>

```json
{
  "voice": { "register": "<two or three words>", "rules": ["<3 to 5 rules for how they write: length, grammar, what they never do>"], "phrases": ["<4 to 6 characteristic phrases, short>"], "signoff": "<how they sign a letter>" },
  "letterhead": { "name": "<the paper they write on, e.g. Ward County Sheriff's Department, or null for a Royce employee>", "place": "<town, state>" } | null,
  "wants_from_newcomer": "<the one thing they want from a junior employee that gives a player a reason to write in Round 1>",
  "will_trade": ["<2 to 4 things they will give for the right price or favour>"],
  "never_says": ["<2 to 4 things they will not put in writing, whatever is offered>"],
  "protects": ["<names>"], "resents": ["<names>"],
  "knows": ["<3 to 6 things they KNOW, each with how>"],
  "believes": ["<2 to 4 things they BELIEVE but cannot prove>"],
  "checkable_lie": { "claim": "<a thing they say that is false>", "truth": "<what is true>", "where_to_check": "<the company record or person that exposes it>" },
  "breaking_point": "<what makes them abandon caution>",
  "ladder": { "episode_1": "<what they will let slip to a newcomer in the first two weeks: one small oddity, nothing more>", "episode_2": "<what they will say or trade once the cattle case and the helicopter are public>", "episode_3": "<what they will say once Security's purge and the Vigil invitations begin>" },
  "goals": ["<2 or 3 for Season One>"], "fears": ["<2 or 3>"]
}
```
```

Rules:
- Off-campus characters are not Royce employees and do not use Royce language. The
  sheriff writes like a sheriff; the rancher writes like a rancher. Each has a real
  reason to answer a letter from a Royce junior at all, and a reason to be wary.
- Episode 1 ladder entries must be small. A newcomer in the first two weeks gets one
  oddity and no theories. Nothing from the Keepers, Ascendants, SENTINEL, Convergence,
  Drawing 68-24, Sublevel Nine, Kessler or the future appears in any ladder entry or
  in "will_trade"; those live only in "knows" and "believes", which the engine never
  shows a player.
- "knows" must say how they know (saw, was told by whom, holds the document).
- The checkable lie must be checkable in a record the game has or can have: a
  personnel file, an invoice, a flight log, a sheriff's report, a church register.
- Keep Fisk consistent with his letters so far: a Security Analyst who believes in a
  transcontinental Satanic network, is being fed by Sayer's letters, and requires Form
  14-B (Report of Unusual Observation) for any sighting.
- Do not restate canon biographies at length; the sheet is for prompting, not reading.
- Mark anything you invent that is not in canon PROPOSED in the paragraph, not in the
  JSON.

Deliver: a Markdown document with the twelve sections, PUBLIC CANON above (the
paragraphs and the voice/letterhead/wants/ladder fields are safe for players to
encounter indirectly) and the JSON blocks complete.
