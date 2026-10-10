# Source: ChatGPT brainstorm, "Brainstorm Play By Email Game"

Shared conversation: https://chatgpt.com/share/6acab7db-a410-83e9-a8ab-0d25eec82a4b
Captured 2026-10-10. This is the raw design conversation that the project started from.
It contains three assistant turns: Game Design 03 (daily turn, episodes, seasons),
Game Design 04 (correspondence network, negotiation, voting), and World Bible 01
(The Department). Designs 01 and 02 were not part of the share.

Treat this as a brainstorm, not canon. Canon lives in `canon/`. The audit of this
plan is in `docs/00-plan-audit.md`.

---

This is a copy of a shared ChatGPT chat. It won't be added to memory.

Report conversation
Cobble Correspondence Engine

Game Design 03 — The Daily Turn, Episodes, and Seasons

I think this is the right structure. You're combining the strategic depth of traditional play-by-mail games with the rhythm of serialized television, and that gives the game something most persistent simulations lack: narrative momentum, scheduled turning points, and an actual reason to come back tomorrow.

Fourteen rounds per episode is particularly appealing. It gives each player enough time to develop a strategy, form alliances, make discoveries, and execute a plan, but it also imposes a deadline. The objective cannot remain theoretical forever.

My biggest recommendation is to distinguish the daily deadline for submitting orders from the time when those orders actually resolve.

That distinction solves many of the fairness problems associated with a global multiplayer game.

1. Daily round: Fixed resolution, flexible participation

I would not use a rolling six-hour window as the primary mechanic. That advantages players who can respond immediately, particularly across time zones, and makes it difficult to fairly adjudicate simultaneous actions.

I'd use one shared, predictable daily resolution, with players able to submit or revise their orders at any point before the deadline.

PROPOSED DAILY CYCLE · EASTERN TIME

One round every 24 hours

9:00 AM

Daily dispatch

Players receive yesterday's results, new intelligence, and emerging events.

All day

Open correspondence

Negotiate, investigate available information, revise plans, or submit orders.

8:00 PM

Order cutoff

The submission window closes and final orders are locked.

After cutoff

World adjudication

The engine resolves competing orders and commits the next world state.

Next morning

New dispatch

A new round begins with private results and evolving correspondence.

The times are proposed defaults. We'd choose and test the most suitable schedule for the launch audience.

This gives players an entire day to participate, but it doesn't require them to be available at any particular moment.

The game never becomes a race to send the first email.

What about six-hour or four-hour windows?

I see those as potential features for particular game types, not as the default.

Window | Advantages | Disadvantages

24 hours | Accessible across time zones, supports thoughtful strategy | Slower pace

6 hours | More urgency, allows concentrated narrative events | Conflicts with work, sleep, and schedules

4 hours | High tension and rapid decisions | Most likely to disadvantage casual players

Rolling window | Immediate engagement | Complicated fairness and shared-state problems

Daily fixed deadline | Predictable, coordinated multiplayer resolution | Requires a reliable scheduler

I'd launch with the fixed daily deadline. Players can submit orders early, change their minds, or schedule fallback instructions.

We can later introduce four- or six-hour crisis windows as special events, but I would be careful not to make urgent availability a prerequisite for winning.

2. Not acting should be a legitimate strategy

This is one of your strongest ideas. Inaction should not necessarily mean failure.

In many strategy games, restraint is an advantage. A player might withhold resources while their rivals exhaust themselves. They might avoid revealing their position, conserve political capital, or allow another faction to make a costly mistake.

But I would distinguish three kinds of inaction:

Strategic Hold

The player explicitly declares that they are taking no major action. They may conserve resources, reduce exposure, strengthen defenses, or continue standing projects.

This is a deliberate move and can provide a modest advantage.

Standing Orders

The player doesn't submit anything new, but the engine carries out previously authorized actions such as maintaining surveillance, continuing research, or protecting a location.

Those actions still consume resources and are subject to interruption.

Missed Turn

The player neither submits new orders nor declares an intentional hold. Their character follows an established default behavior, and active threats or world events continue to affect them.

They don't receive the full strategic advantages of an intentional hold.

That distinction is important. Otherwise, the optimal strategy might become doing nothing for the first ten rounds and spending enormous resources at the end.

We need a real economic trade-off between saving and acting.

3. A resource economy built around accumulation and opportunity

I would create two kinds of resources.

Renewable resources are generated through the passage of time, institutional assets, or other conditions. Examples include operating funds, political influence, intelligence capacity, and Action Units.

Persistent assets are accumulated over multiple rounds. These include relationships, recruited informants, evidence, equipment, properties, controlled organizations, and discoveries.

Action Units should primarily represent the player's capacity to initiate activity. They can be partially banked, but only up to a limit.

Here's an illustrative economy.

Resource accumulation simulator
Explore what happens when a player intentionally conserves their Action Units.
Rounds spent conserving

4

AU generated per round

20 AU

Maximum AU stored

60 AU

Available AU
60
AU lost to cap
30
Starting balance: 10 AU. Assumes no actions, upkeep, or additional costs during the selected rounds.

I would add three balancing mechanisms.

First, storage limits prevent infinite accumulation. Second, opportunity costs mean that players who wait risk losing evidence, allies, or territory to more proactive participants. Third, certain resources can decay, such as an informant's willingness to cooperate or a temporary political advantage.

One particularly interesting distinction is that wealth and intelligence should be bankable, while time-sensitive opportunities should not be.

A player could save political capital for a major operation on Round 12, but they cannot recover the chance to question a witness who disappeared on Round 4.

4. The episode: Fourteen rounds, one personal objective

This is where your structure becomes genuinely different from traditional PBM games.

I would design every episode around an Episode Crisis—an event that affects the world and creates conflicting objectives for the participants.

For example, in our fictional espionage setting:

Episode 01: The Disappearance of Dr. Evelyn Marsh

The central event is the disappearance of a scientist involved in a classified research program.

Every player receives a private objective. Their objectives are related to the same underlying mystery, but they may be cooperative, competitive, or directly antagonistic.

Role | Secret episode objective

Investigator | Identify who ordered Marsh's disappearance

Deputy Director | Prevent the Department from discovering his involvement

Archivist | Obtain the original NIGHTJAR research files

Field Agent | Locate Marsh alive

Intelligence Officer | Establish control over the investigation

Double Agent | Introduce a false explanation into the official record

I especially like the possibility that several players can succeed simultaneously, even when their objectives appear contradictory.

The investigator might identify Voss as the responsible party without proving his guilt publicly. The deputy director might preserve his position while knowing that one player has uncovered his secret. The double agent might succeed in introducing misinformation, but fail to stop the archivist from acquiring the real evidence.

This produces layered outcomes rather than a simple binary victory.

The objective shouldn't always be known to the other players

Some players will want to discover what everyone else is trying to accomplish.

That alone could become an important strategy.

A player may spend several rounds investigating another player's motives, only to find that their own objective has become impossible because they neglected it.

The tension between advancing your own mission and interfering with the ambitions of others would be a central feature of the game.

5. The dramatic structure of a 14-round episode

I wouldn't script exactly what happens in every round. That would undercut the emergent nature of the game.

Instead, I'd construct a system of escalating pressures, deadlines, and possible events that move the episode toward a climax.

The fourteen-round episode

The Opening

ROUNDS 01–03

An incident occurs. Private objectives are distributed. Initial intelligence, assets, and opportunities become available.

The Complication

ROUNDS 04–06

The consequences of early decisions emerge. Rival plans intersect. Factions react to discoveries and developing threats.

The Midpoint

ROUNDS 07

A scheduled pressure event or threshold check changes the stakes. Not necessarily the same event in every playthrough.

The Escalation

ROUNDS 08–11

Resources become strained. Alliances are tested. Hidden operations collide, and some objectives become harder or impossible.

The Endgame

ROUNDS 12–13

Players commit major operations, spend reserves, attempt betrayals, and race to secure their final objectives.

The Reckoning

ROUNDS 14

Final orders resolve. Objectives are scored. The world changes permanently, establishing the next episode.

The midpoint and climax aren't predetermined resolutions. They're moments when the world engine evaluates its state and introduces pressure appropriate to what players have actually done.

For example, if players already rescued Marsh by Round 5, the episode should not pretend she's still missing. The crisis would evolve into the consequences of her rescue.

That is the key to letting a game become dramatic without railroading players.

6. The season: Twelve episodes, six months, one overarching mystery
12
Episodes
168
Daily rounds
~6
Months

ACT I — The Discovery

Episodes 1–4

Players enter the world, build positions, discover the first layers of the central mystery.

ACT II — The Conspiracy

Episodes 5–8

Factions consolidate power, secrets become weapons, and individual objectives increasingly collide.

ACT III — The Collapse

Episodes 9–12

Accumulated decisions produce a major confrontation that permanently changes the world.

There is one scheduling detail worth deciding now.

Twelve episodes of fourteen consecutive days equal 168 days, or 24 weeks. That's slightly less than six calendar months, which means we have room for intermissions.

I would make each episode exactly two weeks long, followed by a short intermission after every two episodes.

For example:

Episode 1: Days 1–14

Episode 2: Days 15–28

Intermission: 2–3 days

Episode 3: Begins the next cycle

A monthly intermission gives us room for a public world report, faction standings, player onboarding, recap generation, and extraordinary diplomatic activity.

We could also keep the world alive at a slower pace during intermissions, permitting correspondence and faction planning while pausing major adjudication.

Why episodes should change the world

A personal objective should conclude at the episode boundary, but the player's accomplishments should persist.

An investigator who successfully identifies a traitor might gain influence in the next episode. A player who fails to protect an important character could lose access to an entire intelligence network.

I'd divide scoring into two categories:

Episode Score measures performance against immediate objectives. It resets or is recalculated with each new episode.

Season Standing measures accumulated influence, reputation, assets, institutional control, and perhaps the player's progress toward a larger private ambition.

This allows a player to lose several episodes without being eliminated from the season. In fact, some failures might create very interesting future opportunities.

7. The season finale should be a simulation event, not a scripted ending

The major showdown is an excellent idea, but I would approach it slightly differently from traditional episodic television.

The final confrontation should be a guaranteed convergence of pressures, not a guaranteed outcome.

For example, the season's underlying mystery might concern a device that several factions want to control.

Across eleven episodes, players discover its existence, learn its capabilities, acquire necessary components, cultivate alliances, and compete for access.

In Episode 12, the device becomes operational.

What happens next depends on the actual game state.

One faction might attempt to destroy it. Another might try to activate it. A third might attempt to expose its existence to the public. A fourth may have an entirely unexpected strategy.

The system resolves those actions and permanently changes the world.

Then Cobble generates a season-ending narrative for each player from their own perspective.

One player receives a triumphant letter of promotion. Another learns that their organization has collapsed. A third discovers that someone they believed was an ally has betrayed them.

The cliffhanger shouldn't negate the players' achievements. It should reveal the next consequence of those achievements.

That is how we'd make Season 2 feel like a continuation of a genuine shared history rather than a reset.

8. The action queue: My proposed final architecture

I'd represent each player's round as a single editable Order Packet.

The packet may contain multiple actions, standing directives, conditional instructions, and a declared policy for what to do if some of the proposed orders cannot be completed.

The engine locks each player's packet at the daily deadline, takes a shared snapshot, and resolves the world's actions in phases.

1

Open round

Generate resources, issue reports, open correspondence.

2

Accept and revise orders

Players communicate, negotiate, and assemble their order packets.

3

Lock orders

Deadline passes; missing players receive their default standing-order or missed-turn behavior.

4

Validate and reserve

Check authorization, dependencies, costs, and mutually exclusive commitments.

5

Resolve simultaneous actions

Process scheduled phases, conflicts, reactions, and contested resources.

6

Advance the world

NPCs act, projects progress, economies update, and pressure clocks advance.

7

Commit and report

Write immutable events, update positions and knowledge, and produce personalized emails.

The phases need a fixed rules-defined ordering. For example, a game could resolve defensive preparations before movement, interception after movement, and investigations after access is established. We should define that ordering explicitly rather than allowing whichever AI task finishes first to determine the outcome.

Three player controls I'd make standard

Commit Orders: Finalize the current packet. Players can revise it until the cutoff unless a particular action has already been executed as an immediate conversational interaction.

Hold Position: Intentionally conserve resources while retaining selected standing orders and automatic defenses.

Conditional Orders: Establish priorities and alternatives: "If the source has disappeared, investigate the warehouse instead. Otherwise, spend my resources on contacting the source."

All three should work as text emailed to the game, through AMP controls, or through the companion interface.

9. Three additional mechanics I'd strongly consider
An episode deadline creates desperation

Some objectives should become harder or impossible as time runs out. An agent whose mission is to prevent a public disclosure might be perfectly positioned to succeed on Day 3, but find themselves facing an almost hopeless situation on Day 13.

This makes the last few rounds meaningful without artificially giving everyone bonus points or special powers.

Personal objectives can conflict with faction objectives

A player may need their faction to succeed over the season while secretly pursuing a conflicting short-term objective.

For example, a player might want the Department to maintain power over six months but need to expose corruption within it during a particular episode.

This creates genuine moral and strategic dilemmas.

Players should be able to prepare for future episodes

A player who suspects that the next episode will involve an investigation into a research facility might spend the final rounds of the current episode positioning informants, cultivating relationships, and accumulating relevant resources.

Some of those preparations might become invaluable. Others might turn out to be wasted.

That uncertainty makes the world feel alive.

10. What I would lock into the design now

Decision | Proposed rule

Round duration | 24 hours

Submission cutoff | One fixed daily time

Correspondence | Available throughout the day

Order changes | Allowed until daily lock

Missed orders | Standing instructions and default behavior apply

Intentional hold | Allows resource conservation and possible defensive advantages

Resource accumulation | Renewable, with caps, upkeep, and opportunity costs

Episode duration | 14 rounds

Episode objectives | Private, potentially conflicting, scored on Round 14

Season duration | 12 episodes, approximately six months

Season finale | Major simulation-driven confrontation

Cliffhanger | Emerges from the resulting world state

Carryover | Persistent assets, relationships, knowledge, reputation, consequences

One final consideration: some episodes may be very difficult for new players to join midway through. I would establish onboarding windows at episode boundaries while allowing limited substitute roles, replacements, or guest positions during active episodes.

This also suggests an appealing feature: spectators or free readers could subscribe to edited public intelligence reports from the ongoing campaign without gaining access to private information.

My strongest recommendation is one shared daily world tick, a full-day submission window, intentional holds as valid orders, fourteen-round personal missions, and a persistent twelve-episode season.

The interesting thing is that this structure creates three different rhythms simultaneously: the quick gratification of receiving and replying to correspondence, the daily anticipation of a resolved turn, and the long-term satisfaction of an unfolding serialized story.

That combination is exactly where I think the game could become compelling.

One more thing that I think is important. I want players to be able to interact with other players via email, but all emails go through our core game engine, which acts like a router for correspondence, but also ingests all correspondence and incorporates it into the outcome of the round. I want to encourage voting and negotiations.
The Correspondence Network

Cobble Game Engine — Design 04: Player Communication, Negotiation, Voting & Political Power

I think this may be the most important mechanic we've discussed so far. It transforms the game from a series of individual players interacting with an AI game master into a living political and social simulation.

The Cobble engine wouldn't simply adjudicate actions. It would serve as the central communications infrastructure for an entire fictional world.

Every letter, negotiation, threat, promise, accusation, secret agreement, and vote would pass through the system. The game would understand those exchanges, preserve their history, and use them to determine what happens when the daily round resolves.

And critically, players could change the world through persuasion without spending traditional action points.

Someone with very few resources might still become one of the most powerful people in the game because they are a brilliant negotiator, coalition builder, or manipulator.

That's the feature I'd design around.

1. The engine becomes a communications network

Rather than allowing players to exchange messages directly, each player gets an in-game correspondence address or identity.

For example:

Department Correspondence Network

An illustrative in-game routing system

FROM: agent.fletcher@game.example

TO: director.voss@game.example

CC: agent.moreno@game.example

Director,

I have sufficient evidence to remove you from your position. However, I believe we can reach a mutually beneficial arrangement.

I will suppress my report if you grant my faction access to the NIGHTJAR archives.

I expect your answer before tomorrow's vote.

All correspondence passes through Cobble

Authentication → routing → extraction → knowledge and negotiation updates → delivery → eventual adjudication.

This makes the game engine both a mail server and a referee.

The player sends an email to another player, but instead of delivering it directly, our backend receives and processes it first.

The system identifies who is speaking, who is receiving the message, what is being discussed, whether a proposal has been made, and whether any game-relevant commitments or information exchanges have occurred.

The original correspondence is delivered to the recipient, while the simulation records the appropriate game events.

I would preserve ordinary email threading so the experience feels natural. A player could reply to a message, copy another faction leader, or initiate an entirely new discussion.

2. Communication should be free. Actions should have costs.

This is a major design distinction I'd make.

In traditional strategy games, players are often charged resources to accomplish almost everything. But conversations, negotiations, and political maneuvering should form a parallel game system.

I would generally allow unlimited ordinary player-to-player correspondence, subject to abuse-prevention and rate limits.

A message proposing an alliance doesn't cost Action Units. A reply accepting a meeting doesn't necessarily cost Action Units. A debate about the future of the Department doesn't cost Action Units.

However, the consequences of those conversations may commit resources or authorize actions that do.

For example:

Correspondence | Mechanical consequence

"We should work together." | Records a proposed alliance, but creates no binding agreement

"I formally accept your treaty." | Creates a recognized agreement if acceptance and terms are validated

"I'll give you 20 influence points." | Creates a proposed transfer; actual transfer requires authorization and available resources

"I vote to remove Voss." | Casts a vote in an eligible active ballot

"The warehouse is on Route 9." | Shares a claim with the recipients

"I order my agents to raid the warehouse." | Creates a proposed action that must enter the daily order queue

"I promise to protect you." | Creates a social commitment, with consequences if broken

One crucial rule: the engine must distinguish talking about an action from actually authorizing it.

Otherwise, casual conversation becomes dangerous. A player describing a hypothetical betrayal might inadvertently execute one.

Only clearly expressed, authenticated intentions should become committed game actions, with confirmation for important transfers, votes, and irreversible decisions.

3. Negotiations become real game objects

This is where I'd take things considerably further than simply having an LLM read email threads.

A negotiation should exist as a structured object inside the world state.

A treaty, for example, could contain specific terms, participants, deadlines, conditions, resources, and obligations.

TREATY 77-014

The Nightjar Accords
Pending

Proposed by Agent Fletcher · Round 6 of 14

Terms of agreement

Director Voss grants limited archive access to the Fletcher faction for three rounds.

Fletcher agrees not to publish the evidence against Voss during the current episode.

Both parties contribute 10 Influence to a joint intelligence operation.

A violation of the terms may trigger a formal grievance and reputation consequences.

Agent Fletcher

Accepted

Director Voss

Pending
Simulate Voss's response
Pending
Accept
Reject

Awaiting final response

The agreement is not yet binding. Either participant may attempt to renegotiate the terms.

Interactive rules demonstration; no real game state is changed.

The most interesting feature is that these agreements don't have to be automatically enforced.

We could offer different types of agreements:

Formal contracts are mechanically enforced by the game when valid. If you promise 20 resources in exchange for archive access, the engine carries out the exchange when conditions are met.

Political agreements are recognized but not guaranteed. A player can sign a treaty and then violate it, potentially losing trust, reputation, institutional standing, or access to allies.

Secret agreements exist only between the participants, but the system can still track compliance and violations without disclosing their existence to others.

Informal promises are extracted from correspondence and remembered as claims or commitments, rather than treated as automatically binding contracts.

That last category is especially interesting. A player might make conflicting promises to multiple people, and the system can preserve those promises as evidence that may surface later.

4. Voting should be a central game mechanic

I wouldn't restrict voting to occasional elections. I would make it a general mechanism by which players collectively authorize actions, distribute power, and settle disputes.

An intelligence committee might vote to investigate a colleague. A faction might elect its leader. A governing council might vote to allocate resources. A secret society might vote on whether to admit a new member.

The interesting part is everything that happens before the vote.

Players lobby, negotiate, trade favors, form coalitions, threaten defections, and try to persuade undecided voters.

This produces an enormous amount of meaningful player correspondence.

Example: A vote of no confidence

DEPARTMENT COUNCIL · ROUND 09

Motion 77-006
Voting open

Should Deputy Director Voss be removed from his position?

A simple majority of the seven council members is required. The motion closes at the daily round lock.

Votes for removal

2 / 7

Votes against

2 / 7

Abstentions

1

Your simulated vote
Remove Deputy Director Voss
Retain Deputy Director Voss
Abstain
Do not cast a vote yet

Outcome remains undecided

Coalition building and negotiation can still determine the outcome. A majority requires four affirmative votes.

This example uses seven council seats. One seat is controlled by the sample vote, with the other six initialized for demonstration. Actual ballots would derive eligible voters and counted votes from game state.

Now imagine that the player trying to remove Voss has spent the previous three rounds persuading other council members.

Perhaps they've offered future appointments. Perhaps they've presented genuine evidence of corruption. Perhaps another player is secretly threatening to expose a council member's personal objective.

The voting process suddenly becomes the climax of several intertwined stories.

Five types of game votes

Type | Examples | Strategic value

Governance | Elect leaders, remove officials | Control

Resource allocation | Approve funding, assign missions | Economic power

Investigative | Authorize inquiries, release documents | Discovery

Diplomatic | Ratify alliances, declare hostility | Coalition building

Secret ballot | Internal faction elections, covert decisions | Intrigue

Votes would have explicit eligibility rules, quorum requirements, deadlines, and tally methods. Some might require a simple majority, others a supermajority or faction-specific approval.

We should also support proxy voting, delegated authority, and weighted voting in campaigns where those mechanics make sense.

Importantly, I'd keep voting procedures consistent. A player should never have to guess whether a majority means a majority of all seats or a majority of participating voters.

5. The engine should ingest correspondence without treating every statement as truth

This is an essential distinction.

Suppose a player emails another:

I have evidence that Director Voss is an alien.

The engine should not add "Voss is an alien" to canonical world history.

It should record:

Who made the claim.

Who received it.

What evidence was cited or attached.

Whether the claim contradicts known facts.

Whether the recipient subsequently acted on it.

The claim might be false. It might be deliberate disinformation. It might be a sincere mistake. Or the player might be correct.

The system must preserve the distinction between world truth, player knowledge, player beliefs, and player statements.

That means the core engine can use correspondence to update the social world without allowing mere assertions to rewrite objective reality.

6. What does a negotiation actually do to the round?

This is where I'd introduce a separate Social Resolution Phase into the daily adjudication cycle.

The correspondence itself is continuously processed, but the consequential effects become part of the round when appropriate.

01

Correspondence intake

Route messages; extract claims, proposals, commitments, and shared information throughout the day.

02

Diplomatic state update

Track accepted agreements, conditional obligations, new alliances, and active disputes.

03

Order lock

Freeze each player's authorized orders, votes, and standing directives at the cutoff.

04

Governance resolution

Resolve ballots, formal appointments, funding decisions, and other institutions' authority.

05

Strategic adjudication

Resolve resource transfers, investigations, competing plans, and contested actions under the current rules.

06

Social and world consequences

Update reputation, influence, relationships, knowledge, faction standing, and autonomous projects.

07

Personal dispatches

Deliver private turn reports, vote results, treaty updates, discoveries, and consequences.

We'd need carefully specified exceptions for immediate actions, such as accepting a social invitation or acknowledging a message. Even then, all mechanically important actions should pass through a common authorization and event system.

A new resource: Political capital

I would introduce Political Capital as something distinct from basic influence or Action Units.

A player earns political capital by fulfilling obligations, building relationships, gaining institutional standing, uncovering useful intelligence, and delivering on promises.

They can spend it to secure endorsements, call special votes, sponsor motions, or persuade undecided NPCs.

However, political capital should not guarantee votes. Human players always choose their own positions, and NPC votes follow their own legitimate interests and constraints.

There's an important design principle here: a social resource should improve a player's opportunities to influence others, not override another human player's agency.

7. Correspondence as a knowledge and relationship graph

This is where the software architecture becomes especially interesting.

Every routed message becomes a durable record. The game engine extracts structured events and builds a graph of relationships, communications, commitments, information flow, and political associations.

Illustrative correspondence network

The thickness of a connection represents how much correspondence passes between two characters, not necessarily how much they trust one another.

The canonical engine can maintain the complete network, but individual players should only see communications and relationships they are authorized to know about.

This creates all kinds of gameplay possibilities.

A player might notice that two faction leaders are suddenly voting together, without knowing they've been exchanging secret correspondence.

An investigator could acquire a valid surveillance capability and discover that the leaders have been communicating. That might reveal the relationship but not the message contents.

A player might intercept a single message, discover an alliance, and use that evidence to manipulate an upcoming vote.

And later in the season, the contents of a confidential letter could become a major piece of evidence in an investigation.

There is a powerful distinction here between the engine's access to all game messages for adjudication and the fictional Department's access to messages within the world.

I would never automatically make every private message visible to an in-game intelligence agency just because the real backend routes it. Surveillance, interception, and leaks must be governed by explicit fictional mechanics and player permissions.

I'd also make the routing policy clear to players at signup. They should understand that in-game correspondence is processed by AI for gameplay, even when it is private from other players. Out-of-game personal information shouldn't become fictional intelligence.

8. Public channels, private correspondence, and faction councils

I'd build four distinct communication modes into the platform.

Mode | Description

Private correspondence | Direct player-to-player messages

Group correspondence | Multi-party email threads and alliances

Faction councils | Membership-controlled discussions, motions, ballots, announcements

Public dispatches | Broadcast announcements, propaganda, proclamations, world news

All would use the same routing engine, but with different access permissions and game mechanics.

I'd also support pseudonyms, aliases, and faction identities where the scenario permits. A player could operate a secret correspondence identity, but the server must still reliably associate it with the authorized underlying player account.

Group communication creates another opportunity: players could form their own institutions.

A group might establish a council, set membership rules, elect officers, write a charter, and define a voting system. The engine could then recognize that institution as a game entity with its own resources, permissions, and political relationships.

That is much richer than merely placing players into predefined factions.

9. The risk: Communication volume cannot equal political power

We need to avoid turning the game into a contest of who can send the most emails.

The system should reward meaningful relationships, successful negotiations, fulfilled agreements, and demonstrated outcomes—not message count or flowery prose.

I'd avoid mechanically granting influence merely because someone made a persuasive-sounding argument.

For example, if a player convinces three human players to support a motion, the engine records three commitments or votes, not an arbitrary +20 Influence bonus for eloquence.

NPC persuasion can use a rules-based framework informed by character motivations and relevant evidence.

This also helps prevent AI-generated spam. Players should not be able to flood other participants with thousands of automatically generated messages, manufacture hundreds of fake endorsements, or exploit the interpreter with repeated prompts.

Correspondence can be generous, but routing needs per-player limits, opt-out controls for particular senders, moderation, and campaign-level communication policies.

10. How I would implement it

I'd add a Correspondence Intelligence Service alongside the existing turn engine.

The core pipeline would be:

Inbound email → Verify sender → Resolve fictional identities → Store original → Route recipients → Extract structured events → Validate commitments/votes → Update permitted social state → Queue consequential actions → Adjudicate at daily cutoff

Every message would preserve its exact original text. Model-derived interpretations would be stored separately with confidence and provenance.

The first version of the structured data model would include:

Table | Purpose

correspondence | Original message, thread, sender, recipients, timestamps

correspondence_events | Claims, proposals, offers, threats, information-sharing events

negotiations | Active negotiations and proposals

agreements | Accepted terms, obligations, breaches, expiration

organizations | Player-created and predefined institutions

memberships | Roles, voting power, authority, permissions

motions | Formal issues submitted for a vote

ballots | Eligibility, voting method, deadline

votes | Verified, eligible, auditable ballots

social_relationships | Trust, obligations, affiliation, known hostility

knowledge_transfers | Information shared and its recipients

I would not let the extractor automatically turn every apparent agreement or voting phrase into a binding action. Consequential events must pass through a separate authorization step, with ambiguous messages remaining nonbinding.

The underlying system should support replaying message processing safely without duplicating votes, transfers, or treaty activation.

11. An episode where correspondence becomes the battlefield

Imagine Episode 07 of the first season.

SEASON 01 · EPISODE 07

The Vote of No Confidence

Following a disastrous covert operation, the Department's Director is accused of concealing evidence and endangering field agents.

An emergency council convenes. A leadership vote is scheduled for Round 14.

Every player receives a personal objective. One must remove the Director. Another must preserve his administration. A third must ensure a particular successor is appointed. A fourth must discover who orchestrated the crisis.

Players have fourteen days to accomplish their objectives.

They can investigate, acquire evidence, negotiate, form alliances, offer appointments, establish voting blocs, and undermine opposing coalitions.

Some players may spend most of their Action Units preparing an operation. Others may spend almost nothing, concentrating instead on persuading the council.

On Round 14, votes are locked, pending commitments are evaluated, relevant contested actions resolve, and the council's decision changes the world.

Now consider the possible outcomes.

The Director could survive the vote but lose his legitimacy. He might be removed, only for the winning coalition to fracture over his replacement. A player might discover proof that the accusations were manufactured—but too late to alter the decision.

Or a secret agreement made during Round 3 might be betrayed at the last moment, shifting the entire balance of power.

None of these outcomes needs to be predetermined.

The game provides the setting, institutions, objectives, constraints, and stakes. The players provide the politics.

12. My central recommendation

I would make correspondence a first-class gameplay system, not an accessory to the daily action queue.

That means four separate but interconnected economies:

Action economy: What can you physically, financially, or operationally accomplish?

Information economy: What do you know, what can you prove, and whom can you tell?

Political economy: Whom can you persuade, organize, or influence?

Institutional economy: What can groups formally authorize through treaties, votes, rules, and delegated authority?

Those systems can produce dramatically different styles of play.

One player could win through investigation. Another through diplomacy. Another through strategic resource accumulation. Another by building a voting coalition that controls the institutions governing the world.

And because all fictional correspondence passes through Cobble, the engine can accurately track the negotiations and commitments that make those outcomes possible.

I would make one further design decision now: every episode should contain at least one meaningful collective decision—an election, treaty, council vote, faction referendum, joint operation, or other institutional decision point. It can arise organically rather than always being a scripted vote.

That ensures the multiplayer correspondence system isn't merely available. It's fundamental to how power changes hands.

What we're building starts to look less like a traditional RPG and more like a living political simulation where the primary weapons are information, trust, language, and institutional power.

Let's work on fleshing out the Department
THE DEPARTMENT

World Bible 01 — Setting, Mythology, Institutions & Game Design

A game of secrets, bureaucracy, espionage, and impossible phenomena.

The Department is a six-month, multiplayer correspondence game set in an alternate 1977, in which players are recruited into a clandestine federal agency responsible for investigating, containing, studying, and occasionally exploiting phenomena that conventional science cannot explain.

Every day, a new round resolves. Every two weeks, an episode concludes. Every six months, a season reaches a crisis that permanently alters the world.

Players communicate through official and unofficial correspondence, establish alliances, conduct investigations, make discoveries, manipulate institutions, and compete to complete secret objectives.

But the Department itself is not a unified organization. It is a labyrinth of offices, competing mandates, forgotten projects, political factions, and people who have spent their entire careers hiding things from one another.

And the most dangerous thing about the Department may not be what it investigates.

It may be what the institution has become.

1. The central premise

The Department was created in 1947 through an obscure executive directive known as Continuity Order 7.

Its public identity is the Office of Administrative Survey, a forgettable federal agency responsible for records management, government property inventories, and unusual interagency administrative matters.

Its actual mandate is considerably stranger:

To identify, document, contain, and where possible exploit events, objects, persons, and processes that demonstrate persistent deviation from established physical or historical expectation.

The original mission was investigative. The Department collected anomalous reports, interviewed witnesses, studied unusual materials, and maintained classified archives.

By the 1960s, however, certain officials began to suspect that the anomalies were not isolated events. Patterns appeared across otherwise unrelated incidents. Similar symbols emerged in distant locations. Witnesses with no apparent connection described the same impossible architecture. Classified records began contradicting one another.

Then something changed.

Certain files began referring to incidents before they occurred.

Some officials interpreted this as evidence of precognition. Others suspected an elaborate intelligence operation. A small faction began arguing that the Department wasn't simply recording anomalous reality.

Its records might be participating in the production of that reality.

By October 1977, the Department has become deeply divided over a classified initiative called Project NIGHTJAR.

A senior researcher, Dr. Evelyn Marsh, has disappeared.

Her last known communication contains a single sentence:

Stop correcting the records. The discrepancies are the only things keeping it outside.

Nobody agrees on what she meant.

And that is where the players enter.

2. The aesthetic: Bureaucratic cosmic horror

Institutional realism

Carbon copies, office memoranda, authorization forms, teletypes, and interdepartmental hostility.

Scientific uncertainty

Unreliable instrumentation, disputed findings, classified experiments, and extraordinary claims.

American gothic

Forgotten communities, strange landscapes, missing persons, abandoned facilities, and local folklore.

Weaponized information

Contradictory reports, classified testimony, altered documents, secret correspondence, and contested truth.

The artistic direction should avoid making everything overtly supernatural.

Much of the game should feel like working inside a dysfunctional federal agency. Players contend with budgets, interoffice rivalries, missing documents, political interference, and administrative regulations.

The horror enters through small inconsistencies.

A personnel file lists two different dates of death. A field report describes a building that no longer exists. A telephone call is logged as originating from an office closed in 1959.

The player has to determine which discrepancies matter.

The mundane bureaucracy makes the impossible more convincing.

3. The organizational structure

The Department is divided into six major divisions, each with distinct authority, resources, and institutional incentives.

OFFICE OF THE DIRECTOR

Central authority · Appointments · Strategic priorities

FIELD OPERATIONS

Investigations & containment

RESEARCH & ANALYSIS

Experiments & interpretation

RECORDS & ARCHIVES

Evidence & classification

INTERNAL COMPLIANCE

Security & discipline

SPECIAL PROGRAMS

Restricted projects

ADMINISTRATION

Budgets & logistics

Each division has its own leaders, employees, access privileges, voting representation, budget, and internal objectives.

Players can belong to a division without necessarily being loyal to it. Some may secretly report to competing groups.

Field Operations

The public-facing investigative arm of the Department's secret mission. Field agents interview witnesses, recover unusual artifacts, visit anomalous locations, and conduct surveillance.

Field Operations possesses the greatest access to physical evidence and eyewitness testimony but frequently lacks the authority to examine material once it is classified by another division.

Its institutional goal is to retain operational independence.

Research & Analysis

Scientists, historians, linguists, statisticians, and specialists who attempt to explain the phenomena.

Research possesses laboratory equipment and intellectual expertise but relies on Field Operations for evidence and Records for historical files.

Its internal disagreement concerns whether the Department should observe anomalous phenomena or attempt to reproduce them.

Records & Archives

The institutional memory of the Department.

Archivists decide how evidence is cataloged, cross-referenced, preserved, restricted, and destroyed.

They appear administratively powerless, but in practice they control access to the Department's most important asset: its accumulated knowledge.

Some files have been intentionally misclassified. Others have simply vanished.

A handful of archivists suspect the archives are changing without human intervention.

Internal Compliance

Officially responsible for security, personnel investigations, and organizational discipline.

In practice, Internal Compliance investigates suspected leaks, monitors unauthorized projects, and maintains files on senior officials.

Its agents can suspend clearances, interrogate employees, and recommend disciplinary action, but their powers are subject to procedural restrictions and political review.

Special Programs

A loosely coordinated collection of compartmentalized research initiatives.

Project NIGHTJAR is believed to operate somewhere within this division, although its exact chain of command is disputed.

Special Programs receives substantial funding and maintains separate facilities. Even senior Department personnel may be unaware of its complete operations.

Administration

The least glamorous and potentially most powerful division.

Administration controls salaries, procurement, transportation, facilities, contracts, and resource allocation.

Without its cooperation, other divisions cannot reliably conduct field operations or sustain large research projects.

A clever administrative player could quietly cripple an opponent without ever issuing a threatening message.

4. The Department is not one faction

The six divisions represent institutional structure. Beneath them are competing political factions, many of which cross divisional boundaries.

A player might officially work for Research & Analysis while secretly supporting a faction dominated by Internal Compliance officers.

I would begin with five major ideological factions.

The Continuity Committee

The institutional establishment. Its members believe that secrecy, hierarchy, and centralized control are essential to preventing catastrophe. They want the Department to survive regardless of who must be sacrificed.

Values: Stability, secrecy, institutional authority

The Instrumentalists

Scientists and strategists who believe anomalous phenomena can be understood, replicated, and harnessed. They support aggressive experimentation and the expansion of Special Programs.

Values: Discovery, technology, operational advantage

The Witnesses

A loose internal movement that believes the Department's experiments have begun to damage the integrity of its observations. They favor preserving unaltered records, limiting interventions, and documenting contradictions rather than eliminating them.

Values: Evidence, preservation, restraint

The Disclosure Circle

A clandestine network that believes the public deserves to know what the Department has concealed. Its membership includes reformers, whistleblowers, and people motivated by personal revenge.

Values: Disclosure, accountability, decentralization

The Quiet Office

An unofficial faction whose membership and objectives are uncertain. Some employees suspect it is an internal intelligence apparatus. Others believe it predates the Department itself.

Values: Unknown; possibly preservation of a hidden arrangement

I wouldn't assign players to these factions permanently.

Instead, factions would recruit, infiltrate, bargain with, and sometimes expel players. A faction could fracture during an episode. Rival factions could merge. Players could even create entirely new political movements.

The interesting dynamic is the tension between three identities: your official job, your political allegiance, and your private objective.

Those three things should often conflict.

5. Characters: People with agendas, not quest dispensers

The Department needs a relatively small initial cast of memorable NPCs with extensive internal histories.

I'd prefer 15 deeply modeled characters over 150 shallow ones.

Here are eight foundational characters.

Character | Official role | Public personality | Hidden tension

Director Arthur Vale | Department Director | Restrained, paternal, politically cautious | Knows more about the founding mandate than he admits

Deputy Director Conrad Voss | Operations executive | Aggressive, pragmatic, ambitious | Closely associated with NIGHTJAR funding

Dr. Evelyn Marsh | Senior researcher | Brilliant, meticulous, skeptical | Disappeared after identifying discrepancies in experimental records

Miriam Bell | Chief Archivist | Formal, unsentimental, obsessive | Possesses an uncataloged collection of original records

Thomas Rusk | Internal Compliance chief | Calm, suspicious, procedural | Maintains investigations against multiple senior officials

Dr. Elias Wren | Research director | Charismatic, intellectually reckless | Wants authorization for a disputed experimental procedure

Helen Price | Deputy Administrator | Competent, discreet, understated | Controls financial relationships that senior leadership relies upon

Samuel Pike | Senior field investigator | Experienced, cynical, loyal to colleagues | Investigated an incident resembling Marsh's disappearance in 1963

Each character should have more than biography and dialogue style.

They need independent goals, resources, relationships, fears, political preferences, and a private understanding of events.

For example, Miriam Bell may distrust Voss, admire Marsh, and resent the Director for allowing classified files to be removed from her custody.

If a player asks Bell to expose Voss, she might agree in principle but demand a formal preservation order first.

If another player has already persuaded her to support a rival investigation, her response might change.

And if someone produces evidence that her own actions contributed to the crisis, she may attempt to conceal it.

The models must play characters who have something to lose.

6. The setting: A geographically distributed agency

I'd anchor the fictional agency in Washington, D.C., but spread its facilities across the eastern United States.

A central design principle should be that geography matters: investigations require travel, communications experience delays, field offices compete for resources, and certain events can only be witnessed at particular locations.

The initial map could include:

Location | Purpose

Washington, D.C. | Headquarters, governing council, political authority

Blue Ridge Station, Virginia | Communications monitoring and signal analysis

Blackwater Annex, Kentucky | Restricted research facility linked to NIGHTJAR

Ravenwood Repository, Pennsylvania | Classified archives and confiscated materials

Grayling Field Office, Ohio | Regional investigations and witness interviews

Facility 12, Nevada | Remote experimental installation with uncertain jurisdiction

The Kentucky facility gives us an opportunity to incorporate the rich folklore and strange geography of Appalachia without making the entire game depend on paranormal tropes.

It could also be especially suited to a world where landscape, geology, infrastructure, and seemingly unrelated historical incidents turn out to share meaningful patterns.

Every location would contain persistent assets, NPCs, hidden information, security levels, operational costs, and potential discoveries.

And importantly, the player needn't always visit a location personally. They might dispatch an agent, authorize a survey, request files, recruit a local contact, or manipulate another player into doing the work.

Part II — How The Department Actually Plays
7. Player roles and character creation

I would not let players begin as all-powerful department directors.

The game should start with a career position, a small amount of authority, a useful specialization, and an opportunity to acquire additional power through play.

Each character receives four fundamental elements.

Illustrative player dossier
Assigned division
Records & Archives
Primary specialization
Analyst
Negotiator
Operative
Administrator
PERSONNEL PROFILE / DEMONSTRATION
Analyst

Records & Archives · Clearance 2

Starting advantage

Privileged access to archival indexes and classification records.

Specialization advantage

Improved ability to interpret ambiguous evidence and recognize relationships.
Every player also receives a private background, a relationship, and an episode objective.

I would avoid fixed fantasy-style classes. Your division defines your institutional access; your specialization defines what you're particularly good at.

And neither prevents you from changing your career.

An archivist could become a field investigator. An administrator might eventually become director. A disgraced research scientist could defect to another faction.

Three levels of objectives

Every player should be managing three separate ambitions.

Daily intentions are immediate actions and negotiations. The player may wish to find a document, recruit an ally, or influence an upcoming vote.

Episode objectives are private missions with an exact 14-round deadline. Completing these awards rewards, reputation, privileges, and possibly discoveries.

Season ambitions are larger goals requiring sustained effort across twelve episodes. One player might seek control of Special Programs. Another might hope to dismantle the Department. Another might be trying to prevent a catastrophic event that few other players understand.

I would make at least some season ambitions incompatible. Not every player should be able to win through cooperation alone.

8. Voting, bureaucracy, and institutional control

This setting provides an excellent fictional justification for voting.

The Department should have a governing body called the Continuity Council, responsible for major policy and institutional decisions.

I'd begin with nine voting seats distributed among senior officials and divisional representatives. A seat could be occupied by an NPC or a player, with the balance changing over time.

The council has jurisdiction over clearance policy, appointments, large expenditure approvals, investigations of senior officers, special operational authority, and changes to departmental directives.

But the council should not control everything. Certain older founding directives, compartmentalized mandates, and emergency authorities can restrict its actions.

That creates fertile ground for constitutional arguments inside the fiction.

A sample constitutional crisis

Suppose the Director issues an emergency order suspending all NIGHTJAR investigations.

The council challenges his authority. A player serving as chief archivist refuses to surrender records. Internal Compliance opens a formal inquiry into the archivist.

Suddenly several players have conflicting interests.

One wants to protect the Director. Another wants the council to reclaim authority. Another wants to use the confusion to steal records. A fourth wants to negotiate a compromise.

All of this unfolds through correspondence, voting, and operations over several rounds.

And the engine has enough formal institutional rules to decide what various participants can legally do, while still permitting illegal or clandestine acts within the fiction.

9. The great mechanic: A bureaucracy that players can rewrite

Here's an idea I think could distinguish The Department.

Allow players to create and amend the organization's actual operating rules through in-game procedures.

The Department would begin with a charter, hierarchy, budget system, classification rules, and governing council.

But those rules wouldn't be completely static.

Players could propose resolutions, negotiate amendments, create new offices, establish committees, authorize investigations, or transfer authority between divisions.

A faction might successfully pass a rule requiring all new discoveries to be deposited with Records.

Another faction might create an exemption for Special Programs.

A third could attempt to repeal both policies.

The game engine would represent these changes as versioned institutional rules with defined scope, validity dates, permissions, and precedence.

Not every change could be automatic. The engine's fundamental fairness and security rules would remain protected. But within the fictional world, the players could alter how power is distributed.

This creates a remarkable possibility: the organization at the end of Season One might operate under substantially different laws than the organization at the beginning.

And those differences would be caused by players, not prewritten story events.

10. How information becomes power

I would treat every meaningful discovery as a persistent information asset.

Some assets are physical: a photograph, laboratory sample, recovered object, or signed letter.

Others are informational: testimony, an intercepted message, an identity, an access code, or a discovered relationship.

Players can communicate these discoveries to one another, conceal them, trade them, or use them as evidence in a formal investigation.

For The Department, I'd introduce three distinct levels of evidence:

Type | Meaning | Gameplay

Intelligence | Information believed relevant but not fully established | Generates leads, negotiations, suspicion

Evidence | A specific artifact, testimony, or observation with provenance | Supports investigations, claims, and formal action

Established Finding | A conclusion accepted by a particular authority under its procedures | Can unlock institutional decisions and consequences

An established finding is not necessarily objective truth. The council can accept a false conclusion if its evidence was manipulated.

That means a player might succeed in legally establishing something that the world engine knows to be false.

This is a powerful mechanic for an investigative and political simulation.

11. An internal communications culture

I'd make email itself part of the fictional institution.

The Department could use multiple classes of correspondence, each with its own status and mechanical significance.

Memoranda are formal messages between employees. They create an official record and can be cited in proceedings.

Private correspondence is less formal and may involve secret alliances, personal appeals, threats, or confidential exchanges.

Directives are actionable instructions issued by someone with recognized authority.

Petitions and motions formally request institutional decisions.

Interrogatories require another participant to answer questions under a particular procedure. They may refuse, lie, or contest the authority of the request, but those choices can have consequences.

Sealed dispatches are private messages with restricted visibility and special handling rules.

We could even introduce deliberately unreliable communication channels later in the season. A supposedly secure system might be compromised, or a character might receive a message apparently sent by someone who has been missing for weeks.

Those anomalies must be actual game events, not unexplained random behavior from an LLM.

Part III — Season One: The NIGHTJAR Affair

The first season should have a definite underlying mystery, but it should not have a predetermined resolution.

I would write a canonical hidden history that explains the original NIGHTJAR experiments, Marsh's disappearance, the motives of the key NPCs, and the nature of the central phenomenon.

That history provides the game's foundation. Players may discover some of it, misunderstand it, or prevent parts of it from becoming public.

The subsequent events remain open.

12. The secret at the center of the Department

Here's the mythology I'd propose.

Project NIGHTJAR began as a relatively conventional attempt to identify patterns in anomalous incident reports.

Researchers discovered that certain events shared statistical and linguistic similarities that exceeded their expectations. The connections appeared not only in eyewitness accounts but in bureaucratic records generated years or decades apart.

The project eventually developed a system for correlating incident descriptions, geographical locations, dates, witness testimony, and other archival information.

Then an experiment produced a deeply unsettling result.

When researchers systematically reconciled contradictory accounts of certain incidents, subsequent records began reflecting the revised version of events—even records created before the reconciliation.

The researchers initially suspected fraud, clerical contamination, or defects in their experimental procedures.

But controlled experiments appeared to produce the same phenomenon.

The Department named it Administrative Convergence.

The working hypothesis was that certain anomalous events exist in unstable informational states, and that sufficiently coordinated institutional observation can influence which account becomes stable.

This is not simply a machine that changes reality whenever someone edits a document. That would be almost impossible to balance.

Instead, the effect occurs only under particular, poorly understood conditions involving specific locations, artifacts, people, and experimental processes.

Its limitations are themselves an investigative mystery.

Three competing explanations

I would design three plausible interpretations of NIGHTJAR, none universally accepted inside the fictional world.

One group believes the Department discovered a natural phenomenon involving information and physical reality.

Another believes an external intelligence is manipulating the records to influence human decisions.

A third suspects the Department itself has been compromised by a phenomenon that depends on institutional consensus and coordinated belief.

For our initial development bible, I would establish a deeper canonical mechanism privately, even if the characters' explanations remain incomplete or partly mistaken. That lets us plant meaningful clues and fairly adjudicate experiments without forcing a final philosophical explanation on players.

There is a thematic opportunity here that I especially like:

The Department is an institution that categorizes the inexplicable, and its act of categorization may be one of the forces producing the inexplicable.

That's a compelling reason for correspondence, records, votes, classified findings, and bureaucratic procedures to matter to the central mystery.

13. Twelve episodes

These are proposed episode frameworks, not mandatory plot outcomes. Their crises should adapt to the state left by previous episodes.

01

The Missing Scientist

Dr. Evelyn Marsh disappears. Players receive their appointments, uncover the first evidence of NIGHTJAR, and compete to control the investigation.

02

The Blackwater Incident

An incident at the Kentucky annex introduces contradictory physical evidence and a dispute over which division controls it.

03

The Closed File

Archival records contradict official Department history. Players compete to recover, suppress, authenticate, or reinterpret the documents.

04

Emergency Authority

An institutional crisis challenges the Director's powers. The Continuity Council faces a major decision over security and disclosure.

05

The Second Witness

A person connected to NIGHTJAR reappears with testimony that may undermine established findings.

06

Administrative Convergence

Experimental evidence suggests certain records and events are causally entangled. Factions race to obtain control of the procedures.

07

A Vote of No Confidence

The leadership struggle reaches a constitutional confrontation, potentially restructuring the Department.

08

The Quiet Office

Evidence of a clandestine internal network surfaces. Players try to identify its members and determine its objectives.

09

The Contamination

Disputed records, compromised correspondence, and competing interpretations destabilize the Department's operations.

10

Continuity Order 7

The Department's founding authority is challenged as evidence emerges concerning its true mandate.

11

The Threshold

Several competing projects approach completion. Coalitions make final preparations for a major institutional and experimental crisis.

12

The Reckoning

The season's accumulated power struggles converge. Players determine what the Department becomes and what happens to NIGHTJAR.

Because fourteen rounds per episode yields 168 active rounds, we have 24 weeks of daily gameplay. To make this span a full six calendar months, I'd use approximately two weeks of intermissions distributed across the season.

14. How to keep the season emergent

This is extremely important.

We cannot promise the disappearance of a scientist in Episode 1 and then keep forcing everyone to investigate her after she's already been rescued, killed, or discovered to be a collaborator.

The season should therefore be organized around crisis generators, not rigidly scripted chapters.

Each episode has a thematic premise, a set of active tensions, and a collection of possible events. The engine selects or constructs the immediate crisis based on the current state of the world.

A successful investigation might transform the next episode from a search for a missing person into a trial over what she discovered.

A failed investigation might allow another faction to gain control of the evidence.

An unexpected alliance could prevent a planned confrontation entirely, causing the engine to introduce a different source of pressure consistent with established facts.

The model can help propose these developments, but major changes to canon must go through world-state validation.

I would give each episode four explicit design elements:

A world-level pressure or threat that requires attention.

A set of private player objectives with defined success conditions.

At least one opportunity for a meaningful collective decision.

Several potential consequences that carry into later episodes.

The first three create structure. The fourth preserves continuity.

15. A concrete opening: The first email

Here's how I'd introduce the game.

OFFICE OF ADMINISTRATIVE SURVEY

PERSONNEL DIVISION · WASHINGTON, D.C.

Subject: Appointment and Reporting Instructions

Classification: INTERNAL

To the newly appointed employee:

Your transfer to the Office of Administrative Survey has been approved, effective immediately.

You are instructed to familiarize yourself with the attached personnel regulations, the current divisional structure, and the procedures governing official correspondence.

You may receive communications from individuals whose names do not appear on the current staff directory. This is not necessarily an administrative error.

You may also encounter references to facilities, programs, or personnel whose existence cannot be confirmed through standard departmental channels.

Do not assume that an absence of documentation constitutes proof that something does not exist.

Your first assignment concerns the disappearance of a senior researcher from a restricted facility.

Further instructions will follow.

OFFICE OF PERSONNEL ASSIGNMENTS

Episode 01

Round 01 / 14

Response deadline

Next daily lock

Available actions

3 initial directives

The player should also receive a private sealed memorandum containing their true mission.

For example, an archivist might be instructed to preserve all NIGHTJAR records regardless of orders from the Director.

Another player might receive secret instructions to remove certain documents before the investigation reaches the archive.

Both players would receive different private incentives within the same shared world.

And the game begins.

Part IV — Design Decisions I'd Make Before Implementation

There are four choices I think we should make early.

First: Start with 12–24 human players in one Department. That's large enough to support factions, council votes, alliances, rivalries, and meaningful political activity without overwhelming the game with correspondence. We can later test much larger populations or multiple autonomous Departments.

Second: Make player identities persistent across the season. A character's reputation, relationships, institutional record, discoveries, and political alliances should survive individual episodes. Defeat should not necessarily mean elimination; demotion, disgrace, reassignment, or defection can all be compelling outcomes.

Third: Give every player a real institutional function. Nobody should exist merely to receive missions. Even a junior analyst should possess a capability, access privilege, or relationship other players might need. This creates a reason to negotiate.

Fourth: Let the Department itself evolve. The institution should be both the setting and a major object of play. Elections, appointments, investigations, amendments, faction politics, and bureaucratic struggles should change how the organization functions.

That last decision is the one I find most promising.

In a conventional mystery game, players investigate a mystery within a fixed world. In The Department, players investigate mysteries while simultaneously competing to control the institution that decides what those mysteries mean.

A discovered fact can become evidence. Evidence can become a formal finding. A finding can justify a motion. A motion can change departmental policy. That policy can alter an entire faction's ability to investigate, suppress, or exploit future discoveries.

Knowledge becomes authority. Authority becomes action. Action changes the world.

And all of it unfolds through the players' daily correspondence.

The next design task I'd prioritize is the Department's constitutional charter and power structure—the actual rules for the Director, Continuity Council, division chiefs, security clearances, proposals, voting, appointments, and removal from office. That's where we can turn the political intrigue into a genuinely playable system rather than leaving it to improvisation.

If you want, I can:

Outline player faction interaction mechanics
Detail voting and decision-making rounds
Expand on communication system anomalies
