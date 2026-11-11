# Patron cohorts for The Department (draft)

*Drafted 2026-11-11 for Nathan. Nothing here has been run: no cohort exists, no patron has been invited.*

## Where things stand

- **151 active patrons**, all with an email on Patreon: 86 Lodge Researcher, 37 Lodge Theoretician, 21 Lodge Observer, 5 on the Free tier, 1 with no tier. 124 of them have supported for over a year.
- **No Department cohort is taking applications.** The Pilot is the only live campaign: 3 seated players, Round 26, day 12 of its episode, past its 7-day late-join window. A patron who clicks **Begin** today is told intake is closed and that their place is held.
- **The tooling exists and is tested.** `scripts/new-cohort.ts` copies The Pilot's institution (divisions, staff with their sheets and seats, rules, motions, episodes 1–5) into a new campaign with no players, mail or memory. All eight simulated seasons were made this way. The Pilot's extra staff (Kowalski, Nygaard, Greeley, Mahlum, Pfeifer, Brandvold, Ashby, Rud, Sandvik, Kessel) came from the episode seed scripts, not from play, so they belong in a fresh cohort.
- **How a cohort starts:** it is created *recruiting* with a start date. Applicants fill seats in start-date order (seats = seated players + waiting applications). At the first 13:00 UTC dispatch after its start date, if at least one application is approved, it goes active and opens Round 1. Approval lands 2 hours after filing and the supervisor's first memo 6 hours after that. Late joiners are accepted up to day 7 of the episode.

## Recommendation

**Start with two cohorts of 12, invite about 30 patrons, and add cohorts as they fill.**

Why two and not ten:

- **Capacity.** The simulations cost about 2 model-minutes of Cobble time per player per day (16–21k prompt tokens). 24 players is about 50 model-minutes a night; all 151 would be about 300, and double that whenever the 27B is down and the 35B takes over. The engine has never carried more than one live cohort. Start small, watch `/admin/cohorts` for a week, then grow.
- **Feedback.** These are beta players. Two cohorts give two independent readings of the same opening without flooding you with reports.
- **Nobody is turned away.** Seats fill in start-date order and the next recruiting cohort takes the overflow. If every cohort is full, the application page holds the player's place, and opening a new cohort lets them in through the same link.

## Proposed timeline

| When | What | Who |
|---|---|---|
| Thu 12 Nov | Create cohort A and cohort B, both starting **Mon 16 Nov 13:00 UTC** (8 am New York). | I run the script once you approve the names |
| Thu 12 Nov | Switch on the invitation letter in the Patreon tab. Invite the first ~30 patrons. | You, or me on your word |
| Thu–Sun | Patrons claim their accounts and file Form RI-2. Approvals arrive 2 hours after filing. | Automatic |
| Mon 16 Nov | Both cohorts go active at the morning dispatch; Round 1 opens. | Automatic |
| Mon 16 – Sun 22 Nov | Watch load and replies. Late joiners still welcome until day 7. | You and me |
| ~Mon 23 Nov | If the fleet held up, create the next two cohorts and invite the next batch. Repeat weekly. | You decide |

The commands, for when you approve (slugs and titles are placeholders until you name them):

```bash
pnpm tsx scripts/new-cohort.ts patrons-a "<title A>" --start 2026-11-16T13:00:00Z --size 12
pnpm tsx scripts/new-cohort.ts patrons-b "<title B>" --start 2026-11-16T13:00:00Z --size 12
```

## Who goes first

Three ways to pick the first ~30. Your call:

1. **Longest-standing supporters first** (by pledge start; the earliest date back to September 2020).
2. **Highest tier first** (37 Theoreticians, then Researchers).
3. **First come, first served:** invite everyone at once and let the first 24 to apply take the seats. Everyone else is held until the next cohort opens. This is the simplest, but up to 127 people will see "intake closed" on day one.

My suggestion is (1). It rewards loyalty, and the letter already promises they can play whenever they claim.

## What a patron experiences

1. The Liminal Lodge invitation arrives (approved copy).
2. They choose a password; the account is confirmed at once, with no confirmation email.
3. "Your package has arrived": The Department and Tell No One, both with **Begin**. *(A "Your package has arrived" email also goes out here; its wording is not reviewed yet.)*
4. **Begin** on The Department leads to Form RI-2. They file it and are approved 2 hours later; the supervisor's memo follows 6 hours after that, outside quiet hours.
5. Round 1 opens at the cohort's start, then the daily cycle: orders by reply, 00:00 UTC lock, 13:00 UTC dispatch.
6. Tell No One is open to them immediately, and needs no cohort.

## Decisions only you can make

1. **Names.** Cohort titles (and slugs if you want them to match). I have left placeholders.
2. **Size.** 12 (the default, as tested) or up to 16 (your business-model range).
3. **Start date.** Mon 16 Nov as above, or another day.
4. **Who goes first.** One of the three options above.
5. **The Showrunner's Room.** New cohorts start with the Room in *shadow* (it proposes, nothing changes). Keep it in shadow for the first week, or let it run live?
6. **The Pilot.** It keeps its 3 players and stays paused, unless you want them moved into a patron cohort or the Pilot restarted.
7. **Lapsed patrons mid-season.** Today a patron who lapses keeps receiving Department letters until the season ends; only the Avalon grant ends. Remove them at the month-end sweep instead?
8. **The 6 active patrons on the Free tier or no tier.** Patreon calls them active patrons, so they are eligible for an Avalon account today. Include them, or require a paid tier?
9. **The "Your package has arrived" email** sent when a patron claims their account: rewrite it, or skip it for patrons.

## Not covered here

- Supabase still sends password-reset and sign-in links through its built-in mailer (about 2 an hour). Pointing it at Resend (Supabase dashboard → Authentication → Emails → SMTP) should happen before the first batch.
- Capacity numbers come from simulated players. Real players write longer and less predictably, so treat the first week as the measurement.
