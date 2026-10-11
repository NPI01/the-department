-- The showrunner's console.
--   admins          who may sign in to /admin (allowlist by email; user_id filled on first sign-in)
--   subscriptions   a player's billing state, provider-agnostic until a provider is chosen
--   cron_runs       a heartbeat per cron invocation, so the console can tell a quiet engine from a dead one
--   player_briefs   model-written showrunner notes on what a player has done and seems to be doing
--   admin_* views   aggregates the console reads; service role only
-- All tables are RLS-on with no admin policies: the console reads through the
-- service-role client after checking the allowlist server-side.

create table admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  user_id uuid references auth.users(id) on delete set null,
  role text not null default 'showrunner' check (role in ('showrunner','staff')),
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  provider text not null default 'manual',          -- manual | stripe | ...
  provider_customer_id text,
  provider_subscription_id text unique,
  plan text not null,                                -- e.g. season-pass, monthly, comp
  status text not null check (status in ('trialing','active','past_due','canceled','comp','incomplete')),
  amount_cents int,
  currency text default 'usd',
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  notes text,
  updated_at timestamptz not null default now()
);
create index on subscriptions (player_id, started_at desc);

create table cron_runs (
  id bigserial primary key,
  route text not null,                               -- tick | work
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  detail jsonb
);
create index on cron_runs (route, started_at desc);

create table player_briefs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','done','failed')),
  body text,
  model text,
  through_round int,
  inputs jsonb,                                      -- counts the brief was written from
  error text,
  requested_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on player_briefs (player_id, created_at desc);

alter table admins enable row level security;
alter table subscriptions enable row level security;
alter table cron_runs enable row level security;
alter table player_briefs enable row level security;

create policy "own subscription" on subscriptions for select
  using (player_id in (select id from players where user_id = auth.uid()));

-- ---------- console aggregates ----------
create view admin_job_stats with (security_invoker = true) as
select
  kind,
  count(*) filter (where done_at is null and locked_at is null) as queued,
  count(*) filter (where done_at is null and locked_at is not null) as running,
  count(*) filter (where done_at is null and run_after <= now() and locked_at is null) as due,
  count(*) filter (where done_at is not null and error is not null and attempts >= max_attempts) as failed,
  count(*) filter (where done_at is null and error is not null) as retrying,
  count(*) filter (where done_at > now() - interval '24 hours' and (error is null or attempts < max_attempts)) as done_24h,
  min(run_after) filter (where done_at is null) as oldest_pending
from jobs group by kind;

create view admin_model_stats with (security_invoker = true) as
select
  model,
  count(*) as calls_24h,
  count(*) filter (where ok) as ok_24h,
  percentile_cont(0.5) within group (order by ms) filter (where ok) as p50_ms,
  percentile_cont(0.95) within group (order by ms) filter (where ok) as p95_ms,
  coalesce(sum(prompt_tokens), 0) as prompt_tokens_24h,
  coalesce(sum(completion_tokens), 0) as completion_tokens_24h,
  max(created_at) filter (where ok) as last_ok_at,
  max(created_at) filter (where not ok) as last_error_at
from model_ledger where created_at > now() - interval '24 hours'
group by model;

create view admin_cron_latest with (security_invoker = true) as
select distinct on (route) route, started_at, finished_at, ok, detail
from cron_runs order by route, started_at desc;

revoke all on admin_job_stats, admin_model_stats, admin_cron_latest from anon, authenticated;
