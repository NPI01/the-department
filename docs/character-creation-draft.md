# Character creation — the Employment Application

> **DRAFT v0.1 (2026-10-12), PROPOSED until Nathan confirms.** The content of the
> Employment Application a subscriber fills in: the Identity Matrix, skills, knowledge,
> positions, supervisors and first goals. Mechanics Nathan fixed on 2026-10-12 are stated
> as decided; everything with a number or a name in it is my proposal. The code that
> enforces this is `src/lib/game/creation.ts`; keep the two in step.

## Decided
- A subscription ($2.99 a month) comes first; the application follows.
- The application asks for: name; a short bio; an **Identity Matrix** choice that sets
  how many points there are to spend; a specialization (Analyst, Negotiator, Operative,
  Administrator, alongside the identity); three ranked department preferences; five
  interview questions; and skills and knowledge bought with the points.
- The interview: *Which of your traits is your favorite? Which do you hate the most?*
  (free text). *Have you ever had an encounter or experience you couldn't explain?*
  (yes/no, describe). *Have you ever had a near-death experience?* (yes/no, describe).
  *How often do you experience déjà vu?* (never / occasionally / about once a day / more
  than once a day).
- On submission the applicant is told they will hear within 24 hours. Two hours later
  the engine approves the application, assigns a department to balance the cohort
  across all eight, creates the character and mails the employment file: a summary of
  the character, the daily action-point pool, department and position, the
  supervisor's name and how to write to them, and the link to the Personnel Directory.
- Six hours after that (never between 10 PM and 8 AM in the player's time zone) the
  supervisor sends the first work memo with a Personal Goal, drawn from the private
  objectives already written for the episode. No two players in a season share one.
- All in-game mail goes through one mailbox. The in-game From and To are in the letter
  itself; players reply to a letter to answer its writer, or start a new message to the
  game with `TO: <name>` as the first line.

## The Identity Matrix [PROPOSED]
Each identity trades setup points against standing. Points buy skills and knowledge.

| Identity | Points | What it means | Engine effect |
|---|---|---|---|
| Credentialed | 8 | You arrive with a degree, a reference and a file that checks out. | starts at clearance 2 |
| Transfer | 10 | You came from another company or another Royce site; somebody here knows you. | supervisor starts warmly disposed |
| Walk-in | 13 | You answered an advertisement. Nobody vouched for you; nobody is watching you. | starts with 5 AU instead of 10 |
| Referred | 10 | Someone at Royce put your name forward and has not said what they want for it. | begins owing a favour to the referring director |

## Skills [PROPOSED]
| Skill | Cost | Requires |
|---|---|---|
| Procedure | 1 | |
| Shorthand | 1 | |
| Driving | 1 | |
| Interviewing | 2 | |
| Persuasion | 2 | |
| Surveillance | 2 | |
| Fieldcraft | 2 | |
| Accounting | 2 | |
| Instrumentation | 2 | |
| Forgery | 3 | Procedure |
| Lockwork | 3 | Fieldcraft |
| Codes & Ciphers | 3 | Instrumentation |

## Knowledge [PROPOSED]
| Area | Cost |
|---|---|
| Purchasing & Logistics | 1 |
| Personnel & Company Policy | 1 |
| Local History & the Prairie | 1 |
| Press & Publicity | 1 |
| Metallurgy & Materials | 2 |
| Aviation | 2 |
| Veterinary & Biological Science | 2 |
| Physics & Energy Systems | 2 |
| Computing & Statistics | 2 |
| Industrial Security | 2 |
| Federal Procurement & the Services | 2 |
| The Occult, as 1977 understands it | 2 |

How skills and knowledge act in play is not yet written into the rules: the proposal is
that each gives an edge on the orders it plainly covers (Surveillance on `SURVEIL`,
Accounting on financial `EXAMINE`, a knowledge area on `INVESTIGATE` in its field),
the same way specializations do in the rulebook draft §4.3.

## Positions and supervisors [PROPOSED]
| Department | Position(s) for new hires | Supervisor |
|---|---|---|
| Advanced Materials | Junior Research Scientist | Dr. Elias Thorne |
| Aerospace Systems | Junior Aerospace Engineer | Col. (Ret.) Frank Baines |
| Biological Sciences | Junior Biological Researcher | Dr. Sarah Ely |
| Applied Physics | Junior Instrumentation Technician | Dr. Aris Kovic |
| Information Systems | Junior Systems Programmer | Julian Thorne |
| Procurement & Logistics | Junior Procurement Analyst, Junior Financial Analyst (alternating) | Gerald Voss |
| Corporate Security | Junior Security Investigator | Harold Sloane |
| Personnel & Administration | Junior Personnel Administrator, Executive Assistant (alternating) | Dorothy Armitage |

Position titles follow the starting positions in `canon/secret/07`. Applied Physics
had none there; "Junior Instrumentation Technician" is new.

## First goals
From the Objective column of `canon/secret/07-episode-01-engine.md`, phrased as a
supervisor would put it in a memo. Objectives 10–12 (Cult Recruit, Federal Informant,
Independent Investigator) come from outside the company and are not in this pool.

| Key | Department | Goal as the memo states it |
|---|---|---|
| ep1-1 | Procurement & Logistics | Determine who approved the Tagus shipments. |
| ep1-2 | Corporate Security | Identify who has been passing company material to outsiders. |
| ep1-3 | Advanced Materials | Obtain access to an ORPHEUS sample. |
| ep1-4 | Personnel & Administration | Explain three altered personnel records. |
| ep1-5 | Aerospace Systems | Recover the missing NIGHTJAR test log before the flight review. |
| ep1-6 | Biological Sciences | Establish whether the HARVEST samples were obtained under legitimate authority. |
| ep1-7 | Procurement & Logistics | Trace a classified appropriation through the company accounts. |
| ep1-8 | Information Systems | Explain the future-dated entries in the computer records. |
| ep1-9 | Personnel & Administration | Secure enough Board support to carry the departmental reporting motion the way this office requires. |

## Gaps for Nathan
- Applied Physics has no Episode 1 goal in canon 07; its new hires draw from whatever is
  left in the common pool until one is written.
- When a department's goals are all taken (a second Security hire, for instance), the
  engine hands out the least-used goal from the whole pool. Alternative: write two or
  three goals per department.
- The Referred identity needs a referring director per department, or one for the
  whole cohort.
- Whether the interview answers feed the engine (the model that writes staff letters
  can see them) or stay in the file for the showrunner only.

CHANGELOG: v0.1 first draft of the Employment Application content.
