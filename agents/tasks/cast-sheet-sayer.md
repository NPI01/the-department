# Task: Cast sheet for Martin Sayer

One character. Same shape as the sheets in canon/secret/11-cast-sheets.md (the JSON
keys below, in this order). Keep every DECIDED fact listed here; mark anything you
invent PROPOSED in the paragraph, not in the JSON.

## Who he is (canon)

Public (canon/02-personnel-directory.md): Martin Sayer, private correspondent, Yonkers,
New York. Freelance investigative journalist who writes for niche paranormal magazines.
Polite, persistent. No known connection to Royce operations. Voice: passionate,
detailed, slightly paranoid; quotes sources. He is not a Royce employee and writes on
his own paper.

Secret (canon/secret/00-truth-ledger.md, 05-allegiance-matrix.md, 03-factions-and-people.md),
DECIDED:
- He is a genuine correspondent of a rogue Ascendant inside Royce. The Ascendant's
  identity is undecided (PROPOSED in canon: a young Information Systems researcher on
  CHOIR). Sayer never names them, in any letter, at any price.
- He copies Son of Sam newspaper imagery into his letters to make a link between "the
  cult" and the murders. He has no connection to David Berkowitz or the murders.
- His link to the Ascendants' interest in the stairway is genuine.
- Leonard Fisk (Royce Security) is a "useful idiot" for Sayer's letters: they feed
  Fisk's belief in a transcontinental Satanic network.
- The symbol he circles was copied from a newspaper photo of a fence post that Royce
  Security's own contractor painted (canon/secret/08-tagus-documents-engine.md, Exhibit 2).
  Sayer believes the symbol is old and real; he does not know Security painted it.
- In Episode 3 he holds the Congregation of the Last Light's pamphlet "The Seven
  Descents" and gives it only to a society member.

## His letters so far (canon/04 and the engine's scripted mail; the sheet must fit them)

Round 1, to the newest hire, "Pattern Recognition":
> Dear Colleague, I am a freelance researcher of unusual phenomena. I noticed your
> transfer to Station R coincides with a spike in local activity reports. I've been
> tracking a pattern in the cattle mutilations around Minot since 1975. They aren't
> random. I'm enclosing a clipping from a local paper. Look at the symbol circled in
> red. It appears in the margins of old survey maps from 1883. It appears in the layouts
> of the new buildings Royce is putting up north of the road. It is a warning. Or a door.
> You are walking into a story that started before you were born. Do not trust the maps
> they give you. They change the shapes of the rooms. Sincerely, Martin Sayer

Round 6, same recipient, "The shapes of the rooms":
> Dear Colleague, You did not write back. That is sensible. I am enclosing something you
> should not have, so that you understand I am not guessing. It is a layout of one of the
> new buildings north of the road, drawn by someone who has stood in it. Count the rooms.
> Then count them again tomorrow. If you want to know who drew it, you will have to ask
> me in person, and I do not travel. Martin Sayer

The enclosure: a pencil plan on tracing paper, nine rooms around a central shaft marked
with the ring-and-bar symbol, a draughtsman's hand, and in the corner "B9 — after the
second pour". Identifying who sent it is a player goal; Sayer must never answer it in a
letter.

## Deliver exactly this

```
### Martin Sayer
<one paragraph: who he is to a new junior Royce employee in October 1977 and what his letters are like>

```json
{
  "voice": { "register": "<two or three words>", "rules": ["<3 to 5>"], "phrases": ["<4 to 6, short, fitting the two letters above>"], "signoff": "Martin Sayer" },
  "letterhead": { "name": "<his own paper>", "place": "Yonkers, New York" },
  "wants_from_newcomer": "<one thing>",
  "will_trade": ["<2 to 4>"],
  "never_says": ["<2 to 4; must include never naming his source inside Royce>"],
  "protects": ["<names>"], "resents": ["<names>"],
  "knows": ["<3 to 6, each with how he knows>"],
  "believes": ["<2 to 4>"],
  "checkable_lie": { "claim": "", "truth": "", "where_to_check": "<a record the game has or can have: a postmark, a magazine back issue, a mail log>" },
  "breaking_point": "",
  "ladder": { "episode_1": "<small: one oddity, no theories>", "episode_2": "", "episode_3": "" },
  "goals": ["<2 or 3>"], "fears": ["<2 or 3>"]
}
```
```

Rules:
- Check every never_says item against the two letters above: nothing he has already
  written may be on that list.
- Nothing from the Keepers, Ascendants, SENTINEL, Convergence, Drawing 68-24, Sublevel
  Nine, Kessler, Son of Sam, Berkowitz or the future appears in "voice", "ladder",
  "will_trade" or "wants_from_newcomer"; those may appear only in "knows" and "believes".
- He does not travel (his second letter says so). He writes; he does not visit.
- Period: 1977. Typewriter, carbon copies, newspaper clippings, post office boxes.
