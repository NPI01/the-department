-- Enable RLS on every table the engine owns. No policies = no access through
-- the publishable key; the engine's service-role client bypasses RLS.
-- Player-facing reads get explicit policies as features need them.
alter table applicants enable row level security;
alter table campaigns enable row level security;
alter table episodes enable row level security;
alter table rounds enable row level security;
alter table divisions enable row level security;
alter table factions enable row level security;
alter table rules enable row level security;
alter table aliases enable row level security;
alter table resources enable row level security;
alter table assets enable row level security;
alter table facts enable row level security;
alter table threads enable row level security;
alter table correspondence_events enable row level security;
alter table organizations enable row level security;
alter table memberships enable row level security;
alter table agreements enable row level security;
alter table motions enable row level security;
alter table votes enable row level security;
alter table relationships enable row level security;
alter table events enable row level security;
alter table jobs enable row level security;
alter table model_ledger enable row level security;

-- Public structure a signed-in player may read.
create policy "campaign structure readable" on campaigns for select using (auth.uid() is not null);
create policy "episodes readable" on episodes for select using (auth.uid() is not null);
create policy "rounds readable" on rounds for select using (auth.uid() is not null);
create policy "divisions readable" on divisions for select using (auth.uid() is not null);
create policy "public factions readable" on factions for select using (auth.uid() is not null and public);
create policy "rules readable" on rules for select using (auth.uid() is not null);
