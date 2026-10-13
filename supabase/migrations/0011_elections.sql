-- Employee-seat elections (canon/secret/07 §Employee seat election). A ballot
-- is a motion row of kind 'election' on the committee whose seat is at stake;
-- the choice is a candidate, which the votes table cannot hold, so election
-- ballots live here. Plurality of cohort votes cast; ties to the earliest
-- created candidate. Winners are seated by the governance phase.
create table election_votes (
  motion_id uuid not null references motions(id) on delete cascade,
  voter_id uuid not null references characters(id) on delete cascade,
  candidate_id uuid not null references characters(id) on delete cascade,
  cast_round int not null,
  source text not null default 'email_grammar',
  source_ref uuid,
  created_at timestamptz not null default now(),
  primary key (motion_id, voter_id)
);
create index on election_votes (motion_id, candidate_id);
alter table election_votes enable row level security;
