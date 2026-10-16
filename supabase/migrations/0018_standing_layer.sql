-- The standing layer (docs/rulebook-draft.md §6.4, §6.7, §7.10, §9.4; after
-- Starweb's conditional fire, ambush and ally/loader declarations and Quest's
-- attitudes). Three things a player sets once that shape how the night resolves:
--   presence      who touched what on a given night, written as orders resolve;
--                 contact reports, the watchful hold and conditional triggers read it
--   declarations  AUTHORIZE / REVOKE (file access as if in my department) and
--                 ATTITUDE (friendly | hostile) toward a named colleague; the
--                 named colleague is never told
--   watch_except  HOLD EXCEPT <names>: whom a holder's watch lets pass
-- Conditional orders use orders.condition (0001) and need no new column.

create table presence (
  id bigserial primary key,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  verb text not null,                  -- visit | search | surveil | attend | interview | request_files | leak
  target_kind text not null check (target_kind in ('place','document','person')),
  target_slug text not null,
  target_name text not null,
  covert boolean not null default false,   -- not listed in other players' contact reports
  created_at timestamptz not null default now(),
  unique (round_id, character_id, verb, target_kind, target_slug)
);
create index on presence (round_id, target_kind, target_slug);
alter table presence enable row level security;

create table declarations (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  from_character uuid not null references characters(id) on delete cascade,
  to_character uuid not null references characters(id) on delete cascade,
  authorized boolean not null default false,
  attitude text not null default 'neutral' check (attitude in ('friendly','neutral','hostile')),
  updated_round int,
  updated_at timestamptz not null default now(),
  primary key (from_character, to_character)
);
create index on declarations (campaign_id, to_character);
alter table declarations enable row level security;

alter table order_packets add column if not exists watch_except uuid[];
