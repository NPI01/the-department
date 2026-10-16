-- Standing orders (rulebook §6.4): an order that repeats every round until
-- cancelled. Filed at intake; copied into the night's packet at the validate
-- phase (orders.standing = true), priced in full the first night and at the
-- upkeep after; suspended on a missed turn; numbered per character so that
-- CANCEL STANDING <n> can name one. src/lib/engine/standing.ts.
create table standing_orders (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  seq int not null,                    -- the number the player sees
  verb text not null,
  args jsonb not null default '{}',    -- text, steps, travel, cost (the first night's price), label
  label text not null,
  created_round int not null,
  last_run_round int,
  status text not null default 'active' check (status in ('active','cancelled')),
  cancelled_round int,
  created_at timestamptz not null default now(),
  unique (character_id, seq)
);
create index on standing_orders (campaign_id, status);
alter table standing_orders enable row level security;
