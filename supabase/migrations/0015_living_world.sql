-- The living world (docs/living-world-draft.md): people and places the engine
-- writes overnight where a player's order reached for something the index did
-- not have. World level, not campaign level: a person is written once and met
-- by every cohort, each cohort getting its own characters row (and so its own
-- memory and letters). Hand-written canon keeps precedence; nothing here is
-- secret canon.

create table world_people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  title text,
  department_slug text,                -- divisions.slug; null = off campus
  public_profile text not null,        -- the directory line, player-safe
  sheet jsonb not null,                -- CastSheet (src/lib/engine/npc.ts)
  place_slug text,                     -- where they are met (PlaceDef slug)
  status text not null default 'live' check (status in ('held','live','retired')),
  origin jsonb not null,               -- {campaign_id, round, order_id, request_id}
  provenance jsonb not null,           -- {models, drafts, skeptic}
  created_at timestamptz not null default now(),
  decided_by uuid references admins(id) on delete set null,
  decided_at timestamptz
);
alter table world_people enable row level security;

create table world_places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  def jsonb not null,                  -- PlaceDef (src/lib/engine/world/types.ts)
  status text not null default 'live' check (status in ('held','live','retired')),
  origin jsonb not null,
  provenance jsonb not null,
  created_at timestamptz not null default now(),
  decided_by uuid references admins(id) on delete set null,
  decided_at timestamptz
);
alter table world_places enable row level security;

-- One row per gap an order opened. Written at the lock (validate), worked in
-- the grow phase, read by the console's Overnight additions page.
create table world_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  round_id uuid references rounds(id) on delete set null,
  round int not null,
  order_id uuid references orders(id) on delete set null,
  character_id uuid references characters(id) on delete set null,
  kind text not null check (kind in ('person_at_place','place')),
  place_slug text,                     -- person_at_place: where
  clause text not null,                -- the words of the order
  verb text not null,
  status text not null default 'open' check (status in ('open','done','held','failed','retired')),
  result jsonb,                        -- {world_person_id | world_place_id, reused, flags, note}
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index on world_requests (campaign_id, status);
alter table world_requests enable row level security;

alter table characters add column world_person_id uuid references world_people(id) on delete set null;
create index on characters (world_person_id);
