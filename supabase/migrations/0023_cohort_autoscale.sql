-- Cohorts that open themselves.
--   cohort_policy    one row: the template to copy, cohort size, the player cap, how few free
--                    seats trigger a new cohort, the working-title series, the waitlist mail
--                    switch (off until the letter is approved) and a short lease so two
--                    requests cannot open two cohorts at once.
--   cohort_waitlist  entitled players who reached the application while no seat was free.
-- A template campaign sits at status 'draft' (never recruited, never dispatched).

create table if not exists public.cohort_policy (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default true,
  template_campaign_id uuid references public.campaigns(id) on delete set null,
  cohort_size int not null default 12 check (cohort_size between 2 and 40),
  player_cap int not null default 36 check (player_cap >= 0),
  min_free_seats int not null default 4 check (min_free_seats >= 0),
  title_prefix text not null default 'Patron Cohort',
  slug_prefix text not null default 'patrons',
  start_weekday int not null default 1 check (start_weekday between 0 and 6),   -- 1 = Monday
  start_hour_utc int not null default 13 check (start_hour_utc between 0 and 23),
  min_lead_days int not null default 3 check (min_lead_days >= 0),
  notify_waitlist boolean not null default false,
  lease_until timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.cohort_policy (id) values (1) on conflict (id) do nothing;
alter table public.cohort_policy enable row level security;

create table if not exists public.cohort_waitlist (
  player_id uuid primary key references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  notified_campaign_id uuid references public.campaigns(id) on delete set null
);
alter table public.cohort_waitlist enable row level security;

revoke all on public.cohort_policy, public.cohort_waitlist from anon, authenticated;
grant all on public.cohort_policy, public.cohort_waitlist to service_role;

-- Take the lease for up to five minutes; true if this caller holds it.
create or replace function public.cohort_take_lease() returns boolean
language sql security definer set search_path = public, pg_temp as $$
  update public.cohort_policy set lease_until = now() + interval '5 minutes'
  where id = 1 and (lease_until is null or lease_until < now())
  returning true
$$;
create or replace function public.cohort_release_lease() returns void
language sql security definer set search_path = public, pg_temp as $$
  update public.cohort_policy set lease_until = null where id = 1
$$;
revoke all on function public.cohort_take_lease(), public.cohort_release_lease() from public, anon, authenticated;
grant execute on function public.cohort_take_lease(), public.cohort_release_lease() to service_role;
