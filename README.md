# The Department

A six-month multiplayer correspondence game set in October 1977, north-central North
Dakota. Players are new hires at Royce Industries, a private R&D company whose secret
unit is the Department of Special Research and Development. They play by email: one round a day, fourteen rounds an episode,
twelve episodes a season. All correspondence routes through the engine, which is both
mail server and referee.

Stack: Next.js 16 on Vercel · Supabase (Postgres, auth, RLS, jobs) · Resend (outbound
and inbound mail) · Cobble Network inference (Qwen 27B-class agents).

## Read first
- `docs/00-plan-audit.md` — the audit of the design brainstorm and the decisions it forces.
- `docs/source/world-bible-02-04-royce.md` — Nathan's World Bibles 02–04 (the setting).
- `docs/source/chatgpt-brainstorm.md` — the earlier design conversation (mechanics; its federal-agency setting is superseded).
- `canon/` — what is true in the world. `canon/secret/` is engine-only.
- `agents/README.md` — the Qwen agent team that helps write story and rules.

## Layout
```
agents/            agent team: roles.ts, run.ts, tasks/*.md, out/ (gitignored)
canon/             public canon · canon/secret/ engine-only canon
docs/              audit, source material
supabase/          migrations/0001_init.sql — the schema
src/lib/cobble.ts  the one model client (model chain, retry_after, JSON, ledger)
src/lib/email/     resend.ts (outbound, Message-IDs) · inbound.ts (Svix verify, grammar, address parsing)
src/lib/engine/    phases.ts — fixed resolution order
src/lib/supabase/  browser, server (RLS) and admin (service role) clients
src/app/           landing page + api/enlist, api/email/inbound, api/cron/tick
src/app/admin/     the showrunner console (login + (console)/ pages); data layer in src/lib/admin/
src/proxy.ts       keeps the Supabase session fresh on /admin; redirects signed-out visits
vercel.json        daily cron → /api/cron/tick
```

## Run
```bash
cp .env.example .env.local   # fill COBBLE_API_KEY at minimum
pnpm dev                     # http://localhost:3000
pnpm agents nightjar-hidden-history
pnpm typecheck && pnpm lint
```

## Showrunner console
`/admin` — Overview, Season Schedule (today, tomorrow, and a timeline of every day with
each vote cast), Seasons & Episodes, Casting Call, Players (subscription, activity and a
model-written brief), Engine Health (model chain with live probe, job queue, cron
heartbeats). Sign-in is a Supabase magic link, sent only to addresses on the `admins`
allowlist:
```bash
pnpm admin:add you@example.com     # allowlist an address
pnpm seed:sandbox                  # fake season to look around in; --drop removes it
```
**Review** lists everything marked PROPOSED in `canon/` and `docs/*-draft.md`, plus
the questions those docs ask; approve, reject, request a revision or answer. **Episode
Plans** shows the season arc and, where a beat sheet exists, a round-by-round timeline.
Both read a copy of canon that `pnpm canon:sync` pushes to Supabase (production builds
sync automatically). To apply decisions: `pnpm canon:decisions` writes
`docs/review-decisions.md`, edit canon accordingly, commit; applied items drop off.

In Supabase Auth → URL Configuration, the deployed site's `/auth/confirm` must be an
allowed redirect URL. The built-in mailer sends only a few links an hour; set custom SMTP
before staff other than the project owner sign in.

## Joining the game
`/subscribe` → Stripe Checkout ($2.99/month) → `/apply/<token>`, the Employment
Application (name, bio, Identity Matrix, specialization, ranked departments, interview,
skills and knowledge bought with points; content in `src/lib/game/creation.ts` and
`docs/character-creation-draft.md`). Filing queues `approve_application` for two hours
later: it balances departments across the cohort, creates the character under the
department head, hands out an Episode 1 goal, mails the employment file and queues
`first_memo` for six hours on (never 10 PM–8 AM local), which the supervisor sends as a
memo with the Personal Goal. Delays are `APPROVAL_DELAY_MINUTES` and
`FIRST_MEMO_DELAY_MINUTES`. Stripe needs `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and a
webhook at `/api/stripe/webhook` with `STRIPE_WEBHOOK_SECRET`.

All in-game mail uses one mailbox (`EMAIL_FROM`). The in-game From/To are in the
letter; a reply routes by thread, a new message by `TO: <name>` on its first line; the
player's seal rides in the reply address's plus-part.

## Principles the code enforces
1. Original correspondence is immutable. Model interpretations are separate rows with
   confidence and provenance.
2. Consequential acts (orders, votes, transfers, treaty acceptance) come from the
   deterministic grammar or a confirmed web action. A model may propose; it never decides.
3. Truth, knowledge, belief and statement are four tables, not one.
4. The daily tick enqueues phases; a worker drains them idempotently. Nothing
   consequential waits on a model, and the game runs if Cobble is down.
5. Every effect is an append-only event with an idempotency key.

## Deployment
- **Site**: https://weird.delivery (Vercel project `weird-delivery`, team Strange Farm Media Labs, auto-deploys from `main`).
- **Mail**: Resend domain `weird.delivery`, sending and receiving verified; sender `The Department <thedepartment@weird.delivery>`; inbound webhook → `/api/email/inbound`.
- **Database**: Supabase `edyhveglvnnunfbiebdr`.
- **Crons** (vercel.json): daily tick, per-minute worker. Both need `CRON_SECRET`.

## Status
2026-10-11: canon drafted (public + secret), agent team run on four tasks, landing page
live at weird.delivery, mail domain verified. The service and engine are called
**Weird.Delivery**; The Department is its first game.
