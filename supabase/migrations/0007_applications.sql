-- Employment applications and what they produce.
--   players.timezone            for quiet hours (no mail 10 PM–8 AM local)
--   players.stripe_customer_id  the subscription's customer
--   applications                one per player per season; approved by a job two hours in
--   characters.sheet            the application's identity, skills, knowledge, interview
--   characters.supervisor_id    the department head who writes the first memo
--   characters.goal_key         the Episode 1 goal handed out (unique per season in practice)

alter table players add column timezone text not null default 'America/New_York';
alter table players add column stripe_customer_id text;
create unique index players_stripe_customer_key on players (stripe_customer_id) where stripe_customer_id is not null;

alter table characters add column sheet jsonb;
alter table characters add column supervisor_id uuid references characters(id) on delete set null;
alter table characters add column goal_key text;

create table applications (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  name text not null,
  bio text,
  identity text not null,
  specialization text not null,
  dept_prefs text[] not null,
  trait_favorite text,
  trait_hated text,
  unexplained boolean not null default false,
  unexplained_text text,
  near_death boolean not null default false,
  near_death_text text,
  deja_vu text,
  skills text[] not null default '{}',
  knowledge text[] not null default '{}',
  points_total int not null,
  points_spent int not null,
  timezone text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_note text,
  character_id uuid references characters(id) on delete set null,
  unique (player_id, campaign_id)
);
alter table applications enable row level security;
create policy "own application" on applications for select using (player_id in (select id from players where user_id = auth.uid()));
