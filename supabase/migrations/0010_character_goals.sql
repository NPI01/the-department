-- Personal Goals and points. A character starts with one goal (handed out at
-- hiring, characters.goal_key) and may be given more during the season. Each
-- goal is worth published points; the showrunner marks it met or failed, and
-- the season standings are the sum of points on met goals. The condition that
-- decides a goal stays in secret canon (canon/secret/07); only the text and
-- the points are player-facing.

create table character_goals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  goal_key text,                       -- from the pool in src/lib/game/creation.ts; null for a one-off goal
  text text not null,                  -- as the player reads it
  deadline text,                       -- as the player reads it, e.g. "the end of the month"
  points int not null,                 -- what meeting it is worth
  status text not null default 'open' check (status in ('open','met','failed','withdrawn')),
  awarded int,                         -- points actually given (partial credit allowed); null until met
  note text,                           -- the showrunner's ruling, player-facing
  assigned_round int,
  decided_round int,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (character_id, goal_key)
);
create index on character_goals (campaign_id, status);
alter table character_goals enable row level security;
