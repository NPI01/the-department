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
vercel.json        daily cron → /api/cron/tick
```

## Run
```bash
cp .env.example .env.local   # fill COBBLE_API_KEY at minimum
pnpm dev                     # http://localhost:3000
pnpm agents nightjar-hidden-history
pnpm typecheck && pnpm lint
```

## Principles the code enforces
1. Original correspondence is immutable. Model interpretations are separate rows with
   confidence and provenance.
2. Consequential acts (orders, votes, transfers, treaty acceptance) come from the
   deterministic grammar or a confirmed web action. A model may propose; it never decides.
3. Truth, knowledge, belief and statement are four tables, not one.
4. The daily tick enqueues phases; a worker drains them idempotently. Nothing
   consequential waits on a model, and the game runs if Cobble is down.
5. Every effect is an append-only event with an idempotency key.

## Status
Scaffold session, 2026-10-10. Supabase project `edyhveglvnnunfbiebdr` ("The Department",
us-west-2) exists and has migration `0001_init` applied. No Vercel project or game mail
domain yet; see the audit §5.
