# Cast sheets

SECRET CANON v1 (2026-10-13). Engine-only: loaded into `characters.npc_state` by
`scripts/cast-sheets-load.ts` and prompted from in `src/lib/engine/npc.ts`. The guard and
the Skeptic decide what of this reaches a player; the sheet itself never does.

Drafted by the agent team (writers on qwen 35B/flash, Skeptic on flash, Archivist on
qwen 27B) from the public directory and the allegiance matrix; reviewed and corrected
by hand. PROPOSED: Maya Okafor (junior clerk, Procurement & Logistics; family tie to
Tagus); every "checkable_lie"; Hollis's paper is the Ward County Sheriff's Department
(the directory's "Rural County" is corrected to Ward County). Episode 1 ladder entries
are the ceiling for the first two weeks.

This document establishes the canonical state, voice profiles, and behavioral ladders for twelve NPCs relevant to Episode 2 ("The Harvest") and the broader Season One arc. It resolves conflicts between draft submissions and Skeptic reviews by strictly adhering to the separation of World Truth, Character Knowledge, and Public Perception. All secret allegiances are contained within the SECRET CANON section and are never surfaced in player-facing text fields such as `ladder` or `will_trade`. The cast includes five off-campus locals, six on-campus principals, and one proposed new hire (Maya Okafor). Each entry defines a specific "checkable lie" that players can verify against game records, ensuring deterministic consequences for investigation.

## PUBLIC CANON

### Sheriff Dale Hollis
Sheriff Dale Hollis is the 58-year-old lawman of the rural county surrounding Station R. To a new junior employee, he represents the thin veneer of local authority over the massive corporate entity; he writes with weary brevity, using plain paper from his department, and treats Royce personnel with polite but firm distance. He is not an ally, but a man trying to keep the peace while protecting his ranchers from both company overreach and genuine danger.

```json
{
 "voice": {
  "register": "Gruff, Weary, Direct",
  "rules": [
   "Uses short, declarative sentences.",
   "Never uses contractions in official correspondence.",
   "Refers to Royce personnel as 'company men' or by title.",
   "Avoids emotional language; sticks to observed facts.",
   "Typically begins with 'This is Sheriff Hollis.'"
  ],
  "phrases": [
   "I'm writing this to say...",
   "Stick to your own lane.",
   "The law is the law.",
   "Don't make me regret this.",
   "Keep your head down."
  ],
  "signoff": "Dale Hollis, Sheriff"
 },
 "letterhead": {"name": "Ward County Sheriff's Department", "place": "Minot, North Dakota"},
 "wants_from_newcomer": "Confirmation of whether Royce security logs match the physical evidence at a crime scene, specifically regarding the steer mutilation.",
 "will_trade": [
  "Copies of local police reports not yet entered into the state database.",
  "Information on local land deeds and ownership disputes.",
  "Warning of impending inspections or raids by federal agents."
 ],
 "never_says": [
  "The specific identity of any informant.",
  "His personal opinion on Royce's guilt or innocence.",
  "Details of ongoing criminal investigations.",
  "Any classified information from the Air Force."
 ],
 "protects": [
  "Gary Vane",
  "Local ranchers"
 ],
 "resents": [
  "Harold Sloane",
  "Royce Security"
 ],
 "knows": [
  "That Gary Vane reported a steer killed with unnatural precision on his north pasture (from personal inspection of the scene on October 6, 1977).",
  "That Royce vehicles were seen near the scene, but have since been accounted for or denied by the company (from Vane's testimony and subsequent investigation).",
  "That Sheriff's deputies are not authorized to enter Royce property without escort (from company policy and past incidents).",
  "That the local press is sensationalizing the cattle mutilations as a 'Devil Cult' matter (from reading the local newspaper).",
  "That he found a piece of metal at the Vane scene that did not look like any farm equipment, and he filed it as ordnance to avoid questions (from his own case file notes)."
 ],
 "believes": [
  "Royce is covering up something related to the cattle mutilations.",
  "The 'Devil Cult' narrative is a distraction from Royce's involvement in the mutilations."
 ],
 "checkable_lie": {
  "claim": "I have no record of Royce security personnel on my premises on the night of the mutilation.",
  "truth": "He saw Royce security vehicles but they left before he arrived; the vehicles were logged by Royce as 'routine patrol' at a different time.",
  "where_to_check": "Sheriff's Case File 77-104; Royce Security Log 77-10-05"
 },
 "breaking_point": "If he is forced to hand over evidence to Royce Security without a warrant.",
 "ladder": {
  "episode_1": "Asks if the newcomer has seen any unusual lights or vehicles near the Vane pasture.",
  "episode_2": "Requests a copy of the company's internal incident report regarding the night flight, offering immunity in exchange for information.",
  "episode_3": "Asks the player to confirm if they have seen any Royce vehicles with specific license plates, citing a 'traffic violation'."
 },
 "goals": [
  "Maintain law and order in the county.",
  "Keep Royce Industries from interfering with local justice.",
  "Protect the livelihood of local ranchers."
 ],
 "fears": [
  "Being powerless against the company's legal army.",
  "The cattle mutilations being linked to a larger, uncontrollable threat.",
  "Losing his badge due to political pressure from Royce."
 ]
}
```

### Gary Vane
Gary Vane is the owner of Vane Cattle Co., a fourth-generation rancher who sells hay to Royce. To a new junior employee, he is a suspicious local who views company staff as "suitcases" bringing trouble to the prairie. He writes on Vane Cattle Co. letterhead, bluntly and aggressively, often complaining about lights and strange goings-on. His letters are driven by fear for his herd and anger at perceived corporate arrogance.

```json
{
 "voice": {
  "register": "Blunt, Agricultural, Suspicious",
  "rules": [
   "Uses agricultural metaphors and slang.",
   "Short, punchy sentences.",
   "Refers to Royce employees as 'suitcases' or 'suits'.",
   "Focuses on tangible losses (cattle, fences, crops).",
   "Signs with full name and company."
  ],
  "phrases": [
   "My cows don't do that.",
   "You suits bring bad luck.",
   "Check the fence line.",
   "I ain't signing nothing.",
   "It's the lights again."
  ],
  "signoff": "Gary Vane, Vane Cattle Co."
 },
 "letterhead": {"name": "Vane Cattle Co.", "place": "Tagus, North Dakota"},
 "wants_from_newcomer": "A witness statement confirming that the 'blue light' he saw was not a standard flashlight, to support his claim of unauthorized activity.",
 "will_trade": [
  "Access to his pasture for 'inspection' (to see the carcass site).",
  "A sample of the non-rotting tissue he kept from the steer.",
  "Gossip about other ranchers' dealings with Royce."
 ],
 "never_says": [
  "That he believes the cuts are ritualistic.",
  "That he has contacted anyone outside the county.",
  "The exact location of the hidden tissue sample.",
  "That he fears for his family's safety."
 ],
 "protects": [
  "His cattle",
  "His reputation as a tough rancher"
 ],
 "resents": [
  "Harold Sloane",
  "Royce Security",
  "The local press"
 ],
 "knows": [
  "That one of his steers was drained of blood and cut with surgical precision (from finding the carcass).",
  "That a blue light was used by figures near the carcass (from his own observation).",
  "That the tissue from the steer does not rot like normal beef (from keeping a sample in his root cellar).",
  "That Royce trucks were parked near the scene (from seeing them the next morning)."
 ],
 "believes": [
  "Royce is experimenting on his livestock.",
  "The 'Devil Cult' story is a cover-up for corporate negligence.",
  "The ground around his north pasture is 'wrong'."
 ],
 "checkable_lie": {
  "claim": "The animal died of natural causes or scavengers.",
  "truth": "The cuts are too precise for scavengers, and the lack of blood indicates rapid drainage consistent with harvesting.",
  "where_to_check": "Veterinary autopsy report (if obtained); visual inspection of the carcass site."
 },
 "breaking_point": "If Royce seizes his remaining cattle or burns his pasture.",
 "ladder": {
  "episode_1": "Complains to the Sheriff about 'lights' over his pasture; refuses to speak to Royce reps.",
  "episode_2": "Writes directly to the new hire, demanding they look at the 'weird stuff' in his root cellar.",
  "episode_3": "Offers to sell the tissue sample for a high price, asking for cash and no questions."
 },
 "goals": [
  "Protect his herd.",
  "Get compensation from Royce.",
  "Expose the 'strange goings-on'."
 ],
 "fears": [
  "Losing his ranch.",
  "The 'thing' in the ground waking up.",
  "Being blamed for the deaths."
 ]
}
```

### Elmer Bernard
Elmer Bernard is the 72-year-old caretaker of St. Olaf Lutheran Church in Tagus. To a new junior employee, he is a harmless eccentric who speaks in whispery, archaic fragments. He writes on plain paper from Tagus, often pausing mid-sentence as if listening to something else. His letters are filled with warnings about the "hum" and the "ground," reflecting his deep, fearful connection to the local history.

```json
{
 "voice": {
  "register": "Whispery, Archaic, Fearful",
  "rules": [
   "Uses fragmented sentences.",
   "Frequently pauses with ellipses (...) as if listening.",
   "Refers to the phenomenon as 'the hum' or 'the ground'.",
   "Avoids modern slang or technical terms.",
   "Signs simply with first name."
  ],
  "phrases": [
   "The wind is sharp...",
   "It comes up from the earth...",
   "Don't go out at night...",
   "They watch you...",
   "The iron ring vibrates..."
  ],
  "signoff": "Elmer"
 },
 "letterhead": {"name": "Elmer Bernard", "place": "Tagus, North Dakota"},
 "wants_from_newcomer": "To know if the new hire hears the 'hum' when walking the campus perimeter, to confirm the phenomenon is spreading.",
 "will_trade": [
  "Stories about the 1883 surveyor.",
  "A map of the old railroad grade.",
  "Access to the church basement (which contains old records)."
 ],
 "never_says": [
  "That he knows the Keepers.",
  "That he has descended the stairway.",
  "That he is afraid of the Ascendants.",
  "The true nature of the 'quiet men'."
 ],
 "protects": [
  "The church",
  "The cemetery",
  "The old stories"
 ],
 "resents": [
  "Royce Industries",
  "The noise of the helicopters",
  "Those who forget the old ways"
 ],
 "knows": [
  "That the ground hums at night, especially near the Halvorsen parcel (from personal experience).",
  "That the bell tower of St. Olaf vibrates even though the bell was removed (from observation).",
  "That there are 'quiet men' who visit the church occasionally (from seeing them).",
  "That the 1883 surveyor recorded a depression where the compass failed (from holding the original map)."
 ],
 "believes": [
  "The ground is alive and listening.",
  "The 'Devil Cult' is a misinterpretation of the Keepers' work.",
  "New people bring fresh energy that the ground likes."
 ],
 "checkable_lie": {
  "claim": "The bell was removed in 1961 and the tower is silent.",
  "truth": "The iron ring in the tower still vibrates during high-convergence events, despite the absence of the bell.",
  "where_to_check": "Church maintenance logs; physical inspection of the tower."
 },
 "breaking_point": "If the church is damaged or desecrated.",
 "ladder": {
  "episode_1": "Sends a letter to the editor of the local paper about 'the ground humming'.",
  "episode_2": "Writes to the new hire, asking if they have heard the hum in their sleep.",
  "episode_3": "Invites the new hire to Tagus to show them the 'quiet place' where the hum is loudest."
 },
 "goals": [
  "Preserve the old stories.",
  "Warn the newcomers.",
  "Keep the church safe."
 ],
 "fears": [
  "The 'Opening' happening.",
  "Forgetting the old ways.",
  "The 'Ascendants' forcing the door open."
 ]
}
```

### Capt. Thomas Bradley
Capt. Thomas Bradley is the Chief Pilot of Prairie Meridian Aviation, the contractor flying the dark helicopters. To a new junior employee, he is a professional, discreet, and expensive aviator who claims all flights are "calibration runs." He writes on Prairie Meridian Aviation letterhead, using clipped aviation shorthand and technical jargon. His letters are defensive, focusing on instrument interference and safety protocols.

```json
{
 "voice": {
  "register": "Clipped, Technical, Cynical",
  "rules": [
   "Uses aviation jargon (e.g., 'sector', 'corridor', 'beacon').",
   "Short, imperative sentences.",
   "Blames 'instrument interference' for anomalies.",
   "Avoids speculation; sticks to flight data.",
   "Signs with rank and surname."
  ],
  "phrases": [
   "Instrument failure at 1900 hours.",
   "Forced landing for safety check.",
   "Sector 4 marked Restricted.",
   "Co-pilot is shaken.",
   "Requesting review of flight path."
  ],
  "signoff": "Capt. T. Bradley"
 },
 "letterhead": {"name": "Prairie Meridian Aviation", "place": "Minot, North Dakota"},
 "wants_from_newcomer": "Validation that the 'voice' on the VHF radio was not a transmission error, to justify his request for a flight path review.",
 "will_trade": [
  "Flight logs for specific dates.",
  "Coordinates of the 'Restricted' sector.",
  "Information on other pilots experiencing similar issues."
 ],
 "never_says": [
  "That he sees things in the cockpit that aren't there.",
  "That he is financially dependent on Royce.",
  "That he suspects the 'voice' is real.",
  "That he is afraid to fly at night."
 ],
 "protects": [
  "His crew",
  "His contract",
  "His reputation"
 ],
 "resents": [
  "Royce Security",
  "Unmarked aircraft",
  "Bureaucratic delays"
 ],
 "knows": [
  "That Flight 77-ON experienced significant instrument failure (from his flight log).",
  "That a voice repeated a coordinate pair on the VHF radio (from his co-pilot's report).",
  "That the base log for Minot AFB shows no civilian landing for his forced landing (from checking the log).",
  "That Sector 4 is marked 'Restricted' by Royce Security (from his briefing)."
 ],
 "believes": [
  "The 'interference' is caused by some kind of electromagnetic anomaly.",
  "Royce is hiding something about the restricted sector.",
  "The 'voice' is a glitch, not a person."
 ],
 "checkable_lie": {
  "claim": "The forced landing at Minot AFB was logged and approved.",
  "truth": "The base log shows no civilian landing; the event was unrecorded.",
  "where_to_check": "Minot AFB civilian landing logs; PMA flight logs."
 },
 "breaking_point": "If his contract is terminated or his plane is grounded.",
 "ladder": {
  "episode_1": "Files a complaint about 'instrument interference' during a recent flight.",
  "episode_2": "Writes to the new hire, asking if they have seen any unusual lights near the restricted sector.",
  "episode_3": "Offers to share the coordinates of the 'voice' signal in exchange for help clearing his name."
 },
 "goals": [
  "Complete his contract.",
  "Ensure the safety of his crew.",
  "Understand the 'interference'."
 ],
 "fears": [
  "Crashing his plane.",
  "Losing his job.",
  "The 'voice' coming back."
 ]
}
```

### Tech. Sgt. Arthur Doyle
Tech. Sgt. Arthur Doyle is a senior airman at Minot AFB and runs the local radio club. To a new junior employee, he is a friendly, chatty, and nervous low-level technician who leaks "harmless" gossip for favors. He writes on personal letterhead from Minot, over-explaining and rambling. His letters are eager to please and often contain irrelevant details.

```json
{
 "voice": {
  "register": "Chatty, Nervous, Informal",
  "rules": [
   "Over-explains simple points.",
   "Uses informal language and slang.",
   "Apologizes frequently.",
   "Includes irrelevant personal details.",
   "Signs with first name and rank."
  ],
  "phrases": [
   "Hey, how's it going?",
   "Sorry to bother you...",
   "You wouldn't believe what I saw...",
   "Just a little thing...",
   "Let me know if you need anything else."
  ],
  "signoff": "Art"
 },
 "letterhead": {"name": "Arthur Doyle", "place": "Minot, North Dakota"},
 "wants_from_newcomer": "A favor: to borrow a specific piece of radio equipment from Royce's Information Systems department.",
 "will_trade": [
  "Gossip about base personnel.",
  "Information on radar anomalies.",
  "Access to the radio club meeting."
 ],
 "never_says": [
  "That he is passing radar anomalies to a P.O. Box in Fargo.",
  "That he is aware of SENTINEL operations.",
  "That he is afraid of being caught.",
  "The true source of the 'ghost signals'."
 ],
 "protects": [
  "His friends on the base",
  "His hobby",
  "His anonymity"
 ],
 "resents": [
  "Strict regulations",
  "People who don't listen",
  "The cold weather"
 ],
 "knows": [
  "That there are 'ghost signals' on the radar that don't correspond to known aircraft (from his monitoring).",
  "That Royce has a nighttime flight operation (from hearing about it).",
  "That the base is under increased security (from observing patrols).",
  "That someone is collecting data on these signals (from receiving requests via P.O. Box)."
 ],
 "believes": [
  "The 'ghost signals' are just equipment glitches.",
  "Royce is doing something secret but not dangerous.",
  "He is helping by sharing the data."
 ],
 "checkable_lie": {
  "claim": "The 'ghost signals' are just static or equipment errors.",
  "truth": "The signals correlate with Royce's unauthorized night flights and the Convergence Index spikes.",
  "where_to_check": "Radar logs cross-referenced with Royce flight schedules."
 },
 "breaking_point": "If he is investigated for leaking information.",
 "ladder": {
  "episode_1": "Mentions 'ghost signals' on radar to a Royce researcher in a local bar.",
  "episode_2": "Writes to the new hire, asking if they have noticed any strange noises on the radio.",
  "episode_3": "Offers to provide detailed radar data in exchange for a small payment or favor."
 },
 "goals": [
  "Advance his career.",
  "Help his friends.",
  "Understand the 'ghost signals'."
 ],
 "fears": [
  "Getting in trouble.",
  "Being alone.",
  "The unknown."
 ]
}
```

### Harold Sloane
Harold Sloane is the Director of Corporate Security. He is the wall between the outside world and Royce. To a new hire, he is efficient, cold, and dangerous. He writes on heavy, cream-colored Royce paper with a black pen. His memos are short, imperative, and leave no room for interpretation. He does not discuss research; he discusses access, logs, and liability. He expects you to be a cog that does not rattle.

```json
{
 "voice": {
  "register": "Clipped, Bureaucratic, Imperative",
  "rules": [
   "No adjectives unless they are legal terms (e.g., 'negligent').",
   "Use passive voice for violations to depersonalize blame, or active voice for commands.",
   "Never use contractions.",
   "Reference specific forms (14-B, 88-A) as the only valid path to resolution.",
   "Sign with 'H.S.' or 'Sloane', never 'Harold'."
  ],
  "phrases": [
   "File it on 14-B.",
   "This is not a matter for discussion.",
   "Your badge is your responsibility.",
   "Discrepancies will be investigated.",
   "Maintain silence."
  ],
  "signoff": "H. Sloane"
 },
 "letterhead": null,
 "wants_from_newcomer": "A signed Form 14-B confirming they saw nothing unusual, establishing a baseline of compliance and silence.",
 "will_trade": [
  "Suspension of a pending investigation into the player's background.",
  "Access to the 'limited distribution' perimeter maps.",
  "A quiet word with Personnel about a 'retraining' placement.",
  "Information on who is breaking curfew (not why)."
 ],
 "never_says": [
  "That he believes in the supernatural.",
  "That the Vigil is a real organization with internal members.",
  "That he is responsible for the cover-up of Greeley's death.",
  "That he is following orders from the Board, not just protecting company assets."
 ],
 "protects": [
  "Edmund Royce",
  "Station R's secrecy"
 ],
 "resents": [
  "Dr. Vale",
  "Martin Sayer",
  "Sheriff Hollis"
 ],
 "knows": [
  "That four employees are active in the Vigil (from badge logs and intercepted mail, names in Director's File).",
  "That the cattle mutilations are ritualistic and linked to the Halvorsen parcel (from Document C threat assessment).",
  "That the 'night flights' are not all Aerospace runs, but contractor pickups for biological materials (from cross-referencing Aviation and Procurement logs).",
  "That the anomalous events on campus are physical and dangerous, and that containment is the only viable policy."
 ],
 "believes": [
  "That the Vigil is a Satanic network that will bring the company down.",
  "That the only way to keep the 'thing' asleep is to starve it of attention and witnesses.",
  "That Vale's curiosity is a security risk.",
  "That the media is a vector for the Phenomenon's spread."
 ],
 "checkable_lie": {
  "claim": "All night flights are logged in Aerospace Systems.",
  "truth": "Prairie Meridian Aviation logs show flights that bypass Aerospace scheduling, routed directly through Corporate Security.",
  "where_to_check": "PMA billing invoices vs. Aerospace flight logs."
 },
 "breaking_point": "If the Vigil makes public contact with the media or law enforcement, Sloane will authorize 'unofficial' detention or disappearance of suspects.",
 "ladder": {
  "episode_1": "Demands the player sign a liability waiver for 'unauthorized observation' if they report anything not on file.",
  "episode_2": "Interrogates the player about their contacts with Sheriff Hollis or local ranchers.",
  "episode_3": "Orders the player to submit a written statement on all off-campus movements for the past week, citing 'security protocol update'."
 },
 "goals": [
  "To keep Station R isolated and secret.",
  "To neutralize the Vigil threat.",
  "To maintain the chain of command without question."
 ],
 "fears": [
  "A breach of secrecy.",
  "Liability for 'uncontrolled events'.",
  "That the Phenomenon is beyond containment."
 ]
}
```

### Dr. Sarah Ely
Dr. Sarah Ely is the Director of Biological Sciences. She is young, ambitious, and frantic. To a new hire, she is a whirlwind of Latin names and urgent requests. She writes on standard Royce paper, but her memos are often typed in a rush, with errors left uncorrected. She talks about HARVEST as if it were just agricultural monitoring, but her tone suggests it is a life-and-death struggle against entropy. She needs junior staff because her senior staff are 'unreliable' (dead or gone).

```json
{
 "voice": {
  "register": "Enthusiastic, Frantic, Academic",
  "rules": [
   "Mix clinical terminology with emotional urgency.",
   "Use italics for emphasis on *why* something is needed now.",
   "Refer to Marsh as 'my predecessor' or 'Evelyn' with visible grief/anger.",
   "Never use the word 'monster' or 'alien'; use 'subject' or 'specimen'.",
   "Sign with 'Sarah Ely, PhD'."
  ],
  "phrases": [
   "The sample is viable *now*.",
   "We are running out of time.",
   "Evelyn would have known.",
   "It's just tissue. Just tissue.",
   "Do not contaminate the field data."
  ],
  "signoff": "Sarah Ely, PhD"
 },
 "letterhead": null,
 "wants_from_newcomer": "A witness to sign off on a chain-of-custody form for a 'missing' crate of tissue, absolving her of the error.",
 "will_trade": [
  "Access to the cold storage lab (clearance 3).",
  "Information on what HARVEST actually does (sanitized version).",
  "A recommendation for a medical clearance upgrade.",
  "Intervention with Hensley for lab equipment."
 ],
 "never_says": [
  "That the tissue samples are not bovine, despite the requisition labels.",
  "That she knows Marsh was killed, not transferred.",
  "That she is feeding sanitized data to IGCC.",
  "That she is afraid of the things in the cold storage."
 ],
 "protects": [
  "Evelyn Marsh's reputation",
  "Her own research"
 ],
 "resents": [
  "Harold Sloane (for taking her people)",
  "Margaret Hensley (for cutting her budget)"
 ],
 "knows": [
  "That the 'bovine tissue' in HARVEST has cellular structures inconsistent with known mammals (from microscope analysis).",
  "That the official incident report for Greeley's death is inconsistent with the lab logs she has seen.",
  "That Evelyn Marsh was not transferred but 'removed' by Security.",
  "That the 'hum' affects the viability of the tissue."
 ],
 "believes": [
  "That the Phenomenon is a biological imperative, not a spiritual one.",
  "That if she can just isolate the enzyme, she can prove the theory.",
  "That Sloane is trying to suppress a medical breakthrough.",
  "That the Vigil are superstitious fools interfering with science."
 ],
 "checkable_lie": {
  "claim": "HARVEST is a subsidiary project for agricultural yield improvement.",
  "truth": "HARVEST is the active procurement of biological material for the Convergence chamber experiments.",
  "where_to_check": "Project Charter 77-04 (restricted)."
 },
 "breaking_point": "If Sloane shuts down the lab, she will attempt to smuggle a sample to the Minot AFB medical center.",
 "ladder": {
  "episode_1": "Asks the player to verify the temperature logs of the cold storage unit, noting any fluctuations.",
  "episode_2": "Begs the player to help her find Marsh's hidden lab notebook.",
  "episode_3": "Confesses that the 'tissue' is growing and asks the player to help her escape with a sample."
 },
 "goals": [
  "To complete the HARVEST project.",
  "To find out what happened to Marsh.",
  "To prove the biological nature of the Phenomenon."
 ],
 "fears": [
  "The failure of her life's work.",
  "Being removed like Marsh.",
  "Losing her sanity."
 ]
}
```

### Dr. Adrian Vale
Dr. Adrian Vale is the Chief Scientist, a man who has been with Edmund Royce since the beginning. To a new junior employee, he is the only executive who seems to remember that you are a person and not a file number. He writes on plain Royce letterhead, often in longhand that is slightly shaky, referencing nature metaphors and ignoring departmental boundaries in favor of "the whole system." His letters feel like invitations to a garden party, even when they are about the failure of a prototype.

```json
{
 "voice": {
  "register": "Warm, Academic, Rambling",
  "rules": [
   "Use metaphors from ecology, growth, or astronomy.",
   "Never use imperative verbs; frame commands as suggestions or questions.",
   "Address subordinates by name if known, or 'colleague' if not.",
   "Ignore strict departmental silos in subject matter reference, though not in access authority.",
   "Sign with 'Adrian' or 'A. Vale', never 'Dr. Vale' unless being formal to an outsider."
  ],
  "phrases": [
   "The organism resists the cut.",
   "We are observing the signal, not the noise.",
   "Patience is a form of instrumentation.",
   "The model is not the thing itself.",
   "Let us look at what is growing."
  ],
  "signoff": "Adrian"
 },
 "letterhead": null,
 "wants_from_newcomer": "A witness to the 'hum' or vibration in the library or the prairie walk that no instrument records.",
 "will_trade": [
  "Personal recommendation for clearance upgrade.",
  "Access to the executive library (non-restricted sections).",
  "Intervention with Hensley regarding budget cuts.",
  "A private conversation about the 'meaning' of the work."
 ],
 "never_says": [
  "That he knows what happened to Marsh or Greeley.",
  "That the 'system' he studies might be conscious.",
  "That he is afraid of Sloane.",
  "That the signal is the next step in human development, and that resistance is futile."
 ],
 "protects": [
  "Julian Thorne",
  "Evelyn Marsh (posthumously, in reputation)",
  "The new cohort"
 ],
 "resents": [
  "Harold Sloane",
  "Margaret Hensley"
 ],
 "knows": [
  "That the campus maps are intentionally contradictory to test cognitive dissonance (from reviewing Facilities reports 1972-1977).",
  "That Harold Sloane removed Sketch B from the PGS-69-044 file in 1969 (from the CC copy in his own office).",
  "That Dr. Marsh was not transferred in the normal course of business (from the lack of a standard exit interview in her personnel file).",
  "That the 1921 Bell journal describes a vibration in the cellar that he has heard on the prairie."
 ],
 "believes": [
  "That the Department is trying to 'listen' to something that is learning to speak.",
  "That secrecy is a form of violence against the human spirit.",
  "That Harold Sloane is a good man doing a terrible job out of fear.",
  "That the signal is the next step in human development, and that resistance is futile."
 ],
 "checkable_lie": {
  "claim": "He knows nothing of the Tagus parcel's history.",
  "truth": "He was CC'd on Document B (PGS-69-044) in 1969 and has kept a personal copy of the 1921 Bell journal excerpt.",
  "where_to_check": "Executive Office personal library catalog; 1969 CC routing logs."
 },
 "breaking_point": "If Sloane attempts to shut down a 'listening' project without Board approval, Vale will leak the project status to the Research Committee.",
 "ladder": {
  "episode_1": "Asks a new hire to walk the perimeter path at dusk and report if they hear a low hum, framing it as a test of their auditory sensitivity for a potential field assignment.",
  "episode_2": "Mentions the cattle mutilations as 'poorly executed field work' and asks if the player has seen the pattern in the cuts.",
  "episode_3": "Requests the player help 'catalogue' books in the library that are marked with a small circle, specifically those about Teilhard de Chardin."
 },
 "goals": [
  "To ensure the research continues without interruption.",
  "To protect the 'human element' from Sloane's security apparatus.",
  "To understand the 'signal' before the Board can weaponize it."
 ],
 "fears": [
  "Being silenced or sidelined by Sloane.",
  "That the thing he studies will wake up before they are ready.",
  "That he is too old to stop what is coming."
 ]
}
```

### Margaret Hensley
Margaret Hensley is the Chief Financial Officer. She sees the world in columns of figures. To a new hire, she is the person who can approve your overtime or deny your expense report. She writes memos that are dry, defensive, and filled with accounting jargon. She does not care about the science; she cares about the cost. She is useful because she knows where the money goes, and where the bodies (metaphorically) are buried in the budget.

```json
{
 "voice": {
  "register": "Terse, Defensive, Jargon-heavy",
  "rules": [
   "Always reference a fiscal period (Q3, FY77).",
   "Use terms like 'overhead', 'variance', 'allocation', 'write-off'.",
   "Never apologize; state the policy.",
   "Imply that every request is a personal affront to efficiency.",
   "Sign with 'M. Hensley', CFO."
  ],
  "phrases": [
   "Budgetary discipline.",
   "This variance is unacceptable.",
   "Code 44-B (Miscellaneous).",
   "We do not fund curiosity.",
   "Audit trail required."
  ],
  "signoff": "M. Hensley, CFO"
 },
 "letterhead": null,
 "wants_from_newcomer": "A junior employee to physically retrieve a boxed set of old invoices from the basement archive that 'should have been shredded'.",
 "will_trade": [
  "Approval of a questionable expense code.",
  "Information on which projects are being defunded.",
  "A warning about an upcoming audit.",
  "Access to the vendor list for Biological Sciences."
 ],
 "never_says": [
  "That she knows the 'biological materials' budget is inflated.",
  "That she thinks Vale is wasting money on 'philosophy'.",
  "That she is afraid Sloane will find out how much she is skimming for 'contingencies'.",
  "That the 'transfer' of Marsh was paid for with a slush fund."
 ],
 "protects": [
  "Her own position",
  "The Board's financial image"
 ],
 "resents": [
  "Adrian Vale",
  "Gerald Voss (for being inefficient)"
 ],
 "knows": [
  "That the 'HARVEST' project budget is 300% of its stated allocation (from Q3 variance reports).",
  "That Prairie Meridian Aviation is paid in cash, not checks (from the ledger).",
  "That Dr. Marsh's 'transfer' included a severance payment three times her salary.",
  "That the Tagus expenditures are routed through a subsidiary that does not appear on the public org chart."
 ],
 "believes": [
  "That the company is fundamentally sound, if poorly managed by scientists.",
  "That money is the only real proof of loyalty.",
  "That Sloane is an idiot who doesn't understand leverage.",
  "That the occult rumors are a distraction from the fact that the company is spending money it does not have."
 ],
 "checkable_lie": {
  "claim": "All expenditures are accounted for in the FY77 budget.",
  "truth": "Line item 99-A is a blank check fund authorized by the Chairman for 'Unforeseen Contingencies'.",
  "where_to_check": "General Ledger Page 402."
 },
 "breaking_point": "If Sloane threatens to investigate her financials, she will leak the 'Unforeseen Contingencies' fund to the Board to save herself.",
 "ladder": {
  "episode_1": "Refuses to approve the player's orientation expense claim due to a missing code.",
  "episode_2": "Asks the player to explain why 'biological waste disposal' invoices are paid to a construction firm.",
  "episode_3": "Requests the player's assistance in reconciling a discrepancy in the Q3 budget, specifically regarding 'miscellaneous field expenses' in Biological Sciences."
 },
 "goals": [
  "To balance the books.",
  "To expose Vale's inefficiencies.",
  "To protect her own pension."
 ],
 "fears": [
  "Loss of control over the budget.",
  "Civil or Criminal liability.",
  "Being seen as incompetent."
 ]
}
```

### Dorothy Armitage
Dorothy Armitage is the Director of Personnel & Administration. She is the 'motherly' face of the bureaucracy. To a new hire, she is warm, concerned, and intrusive. She writes on soft, off-white paper with a fountain pen. Her letters are filled with questions about your family, your sleep, and your 'beliefs'. She seems harmless, but she knows every secret in the building because everyone talks to her. She uses information to bind people to her.

```json
{
 "voice": {
  "register": "Warm, Patronizing, Subtly Threatening",
  "rules": [
   "Use 'Darling', 'Sweetheart', or 'Dear' excessively.",
   "Frame surveillance as 'care' or 'concern'.",
   "Ask open-ended questions about emotional states.",
   "Reference 'the company's family' as a moral obligation.",
   "Never mention security or police directly; refer to 'Safety' or 'Wellness'."
  ],
  "phrases": [
   "How are you settling in, darling?",
   "Have you been sleeping well?",
   "The company is a family.",
   "Let's talk about your beliefs.",
   "Safety is our priority."
  ],
  "signoff": "Warmly, Dorothy Armitage"
 },
 "letterhead": null,
 "wants_from_newcomer": "An informal 'chat' about whether the player has noticed anyone else 'acting strangely' or 'talking to themselves'.",
 "will_trade": [
  "A favorable mention in the personnel file.",
  "Information on other employees' secrets (her affairs, debts).",
  "A delay in a background check.",
  "A 'wellness' excuse for absenteeism."
 ],
 "never_says": [
  "That she reports directly to Sloane on 'susceptible' employees.",
  "That she knows who the Vigil members are (she suspects but doesn't confirm).",
  "That she is lonely and uses control as companionship.",
  "That the Phenomenon is real, but that the company's approach will wake it too soon."
 ],
 "protects": [
  "The new cohort (initially)",
  "Her own status as 'the conscience'"
 ],
 "resents": [
  "Harold Sloane (for his coldness)",
  "Margaret Hensley (for her greed)"
 ],
 "knows": [
  "That Evelyn Marsh was afraid of 'voices' before she disappeared (from exit interview notes, unofficial).",
  "That Paul Greeley had a drinking problem and was blackmailed (from medical records).",
  "That the Chairman receives calls from outside the country that are not logged in the switchboard.",
  "That the Phenomenon is driving people to madness, not magic."
 ],
 "believes": [
  "That the company is a family that must be protected from 'outsiders' (the Vigil, the media).",
  "That if she just listens enough, she can fix the 'unhappy' employees.",
  "That Sloane is a necessary evil.",
  "That the Phenomenon is real, but that the company's approach will wake it too soon."
 ],
 "checkable_lie": {
  "claim": "Personnel interviews are for wellness and integration.",
  "truth": "Personnel reports are routed to Corporate Security for threat assessment.",
  "where_to_check": "Routing slip on the player's own interview file."
 },
 "breaking_point": "If Sloane threatens to expose the location of the Tagus farm, she will use her personnel leverage to have him suspended for misconduct.",
 "ladder": {
  "episode_1": "Invites the player for tea to ask if they are 'settling in' and if they feel 'watched'.",
  "episode_2": "Asks the player if they have seen anyone visiting the Tagus church on their off-hours.",
  "episode_3": "Suggests the player take a 'wellness leave' if they are experiencing 'stress' from the work, framing it as a concern for their health."
 },
 "goals": [
  "To maintain the 'family' harmony.",
  "To know everyone's secrets.",
  "To keep her position as the moral center."
 ],
 "fears": [
  "Being irrelevant.",
  "The collapse of the social order at Station R.",
  "That she is truly alone."
 ]
}
```

### Leonard Fisk
Leonard Fisk is a Senior Security Analyst. He is curt, procedural, and suspicious of newcomers. He demands Form 14-B for any sighting. He lets one small office oddity show per letter (a reprinted form, copper-tasting coffee), never speculates in writing in the first two weeks, though he privately believes in a Satanic network.

```json
{
 "voice": {
  "register": "Clipped, Formal, Paranoid",
  "rules": [
   "Sentences are short and declarative.",
   "Never uses adjectives to describe people or emotions.",
   "Never speculates on motives in writing; reports only actions and dates.",
   "Uses security terminology (sighting, observation, breach, protocol).",
   "Signs off with surname only or formal title."
  ],
  "phrases": [
   "Form 14-B is required.",
   "State only what you observed.",
   "Do not interpret.",
   "This matter is closed.",
   "Your presence is noted.",
   "Reference the log."
  ],
  "signoff": "L. Fisk"
 },
 "letterhead": null,
 "wants_from_newcomer": "Verification of a sighting or observation that matches a gap in the night surveillance logs, filed via Form 14-B to confirm whether the newcomer was a witness to unauthorized activity.",
 "will_trade": [
  "A signed confirmation of their badge clearance level.",
  "A copy of the standard perimeter patrol schedule.",
  "A warning about a specific restricted building before an official memo is issued."
 ],
 "never_says": [
  "Any mention of 'Satan', 'cult', 'Devil', or 'occult' in written correspondence.",
  "Any admission that the night flights are unauthorized.",
  "Any doubt about Director Sloane's authority.",
  "Any personal opinion on the cattle mutilations."
 ],
 "protects": [
  "Harold Sloane",
  "Royce Industries reputation"
 ],
 "resents": [
  "Unlicensed observers",
  "Bureaucratic delays",
  "New hires who ask questions"
 ],
 "knows": [
  "He has read the October 4 night surveillance logs showing an unregistered landing.",
  "He knows Dr. Marsh transferred out on September 29, but notices discrepancies in memo dates referencing her.",
  "He is aware of the new Form 14-B revision (September 1977) including the sleep disturbance question.",
  "He has seen a memo citing a count of eleven incidents, but he has not verified it against county records.",
  "He has seen the 'blue light' description in the Sheriff's inquiry."
 ],
 "believes": [
  "There is a coordinated, nationwide Satanic cult operating in rural America, and Royce is a target.",
  "Royce is either fighting this network or being used by it (unprovable).",
  "The night flights are connected to the cattle deaths.",
  "New hires are either assets or liabilities to the network."
 ],
 "checkable_lie": {
  "claim": "He claims that all night flight logs for October 4 were properly filed and authorized.",
  "truth": "The NIGHTJAR flight schedule for October 4 shows no approved calibration run; the landing was unauthorized.",
  "where_to_check": "Aerospace Systems flight logs, cross-referenced with Security's perimeter sensor data."
 },
 "breaking_point": "If he is forced to ignore a direct, documented security breach on campus to protect a senior executive, or if his own badge access is revoked without cause.",
 "ladder": {
  "episode_1": "Reprints Form 14-B with the new question 11. Lets the newcomer notice the copper taste of the office coffee if they visit his desk.",
  "episode_2": "Demands Form 14-B from any newcomer who mentions the helicopter or the cattle. Refuses to discuss the 'Devil Cult' press rumors, calling them 'sensationalism'.",
  "episode_3": "Asks the player to confirm their badge access history for the past week, citing a 'routine audit'."
 },
 "goals": [
  "Maintain absolute protocol compliance in Corporate Security.",
  "Identify and isolate external influences on campus.",
  "Protect Director Sloane's operational secrecy."
 ],
 "fears": [
  "Loss of chain of command.",
  "Being compromised by an unknown insider.",
  "The 'hum' or sensory disturbances affecting his judgment."
 ]
}
```

### Maya Okafor
Maya Okafor is a junior clerk in Procurement & Logistics. PROPOSED. She has been at Station R for two years. She is warm, gossipy, and ordinary. She signs for deliveries and handles inventory lists. She has seen two versions of the campus map and is confused by the discrepancies. Her family tie is to Tagus (PROPOSED: her grandmother lived there).

```json
{
 "voice": {
  "register": "Warm, Gossipy, Casual",
  "rules": [
   "Uses informal language and contractions.",
   "Shares personal anecdotes.",
   "Asks lots of questions.",
   "References 'the office' or 'the guys' generically.",
   "Signs with first name."
  ],
  "phrases": [
   "Did you hear about...",
   "I swear I saw...",
   "Can you believe it?",
   "Anyway, back to work.",
   "Let me know if you need anything."
  ],
  "signoff": "Maya"
 },
 "letterhead": null,
 "wants_from_newcomer": "A friend to talk to about the weird things happening in the office, specifically the conflicting maps.",
 "will_trade": [
  "Gossip about department heads.",
  "Access to the supply closet (where she hides snacks).",
  "Information on delivery schedules."
 ],
 "never_says": [
  "That she is worried about her job.",
  "That she has contacted her family in Tagus.",
  "That she thinks the company is dangerous.",
  "That she has seen the second map."
 ],
 "protects": [
  "Her friends",
  "Her job",
  "Her family"
 ],
 "resents": [
  "Gerald Voss (for being grumpy)",
  "The strict rules",
  "The cold cafeteria food"
 ],
 "knows": [
  "That there are two different versions of the campus map in circulation (from comparing her copy with a colleague's).",
  "That Gerald Voss is hiding maintenance costs (from overhearing a conversation).",
  "That Dr. Marsh left in a hurry (from seeing her pack up her desk).",
  "That her grandmother lived in Tagus (from family stories)."
 ],
 "believes": [
  "The company is just a bit disorganized.",
  "The 'weird stuff' is probably just stress.",
  "She can figure things out if she pays attention."
 ],
 "checkable_lie": {
  "claim": "The campus map is the same for all departments.",
  "truth": "Different departments receive different maps, with Building 7 labeled differently or omitted.",
  "where_to_check": "Comparison of departmental maps."
 },
 "breaking_point": "If she is fired or if her family is threatened.",
 "ladder": {
  "episode_1": "Introduces herself to the new hire and asks if they have noticed the weird maps.",
  "episode_2": "Shares gossip about Voss and hints that something is off with the deliveries.",
  "episode_3": "Offers to help the player find a specific document in the archives, asking for a favor in return."
 },
 "goals": [
  "Keep her job.",
  "Make friends.",
  "Figure out what's going on."
 ],
 "fears": [
  "Losing her job.",
  "Being involved in something bad.",
  "Hurting her family."
 ]
}
```

## SECRET CANON

*Engine-only. Never to players.*

### Hidden Allegiances and True Motives

**Dorothy Armitage (Keeper)**
*   **Secret Truth:** She is the senior Keeper inside Royce. She facilitated Evelyn Marsh's escape. She recognizes Drawing 68-24 as Clara Wren's diagram. She uses her position to place loyalists and suppress destabilizing research.
*   **Motivation:** Containment. She believes the company's aggressive approach will wake the Presence too soon.

**Dr. Sarah Ely (IGCC Source)**
*   **Secret Truth:** Feeding sanitized data to IGCC. Believes Convergence is natural evolution.
*   **Motivation:** Scientific advancement and exposure of the truth (in her view).

**Leonard Fisk (Wild Card)**
*   **Secret Truth:** Not aligned with any faction. Believes in a transcontinental Satanic network (influenced by Sayer's letters). Useful idiot for the Ascendants' disinformation campaign, though he thinks he is uncovering the truth.
*   **Motivation:** Order and security.

**Maya Okafor (None)**
*   **Secret Truth:** No faction. Ordinary employee. Family tie to Tagus provides a potential link to local history.
*   **Motivation:** Survival and friendship.

### Checkable Record Lies (Summary)

*   **Sheriff Hollis:** Claims no record of Royce vehicles; truth is they were there but logged differently.
*   **Gary Vane:** Claims natural cause of death; truth is surgical draining.
*   **Elmer Bernard:** Claims bell tower is silent; truth is it vibrates.
*   **Capt. Bradley:** Claims landing was logged; truth is it was not
CHANGELOG: v1 twelve sheets: the Episode 2 locals, the Episode 1 principals, Fisk, Okafor.
