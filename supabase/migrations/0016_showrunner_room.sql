-- The Showrunner's Room (docs/showrunner-room-proposal.md): the agentic layer
-- that decides what waits and moves the story each night, with no human in the
-- loop after season setup. Every verdict and move is logged with its checks,
-- its dissent read (Level 2) and its provenance; in shadow mode nothing commits.

create table room_decisions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  round int not null,
  phase text not null check (phase in ('triage','moves')),
  kind text not null,                  -- triage: world_person | world_place | proposal | goal; moves: the move type
  ref jsonb,                           -- what it is about (ids, slugs)
  level int not null default 1,        -- 1 one pass; 2 with dissent
  verdict text not null,               -- keep | retire | approve | reject | answer | met | not_met | commit | revise | rejected
  reason text,
  params jsonb,                        -- a move's parameters as proposed (after validation)
  checks jsonb,                        -- {continuity: [], skeptic: [], rules: []}
  dissent jsonb,                       -- {agree, reason} for Level 2
  mode text not null check (mode in ('shadow','live')),
  committed boolean not null default false,
  touched jsonb,                       -- what the commit wrote, for reversal
  reversed_at timestamptz,
  provenance jsonb,
  created_at timestamptz not null default now()
);
create index on room_decisions (campaign_id, round);
alter table room_decisions enable row level security;

-- The season log: one page per cohort per night, written by the room for itself.
create table room_log (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  round int not null,
  log text not null,
  notes jsonb,                         -- {heading: what the room is building toward, dropped: [...]}
  mode text not null,
  created_at timestamptz not null default now(),
  primary key (campaign_id, round)
);
alter table room_log enable row level security;

-- Documents the room adds to the index (move new_document), merged into documentsFor().
create table world_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  def jsonb not null,                  -- DocumentDef (src/lib/engine/world/types.ts)
  status text not null default 'live' check (status in ('held','live','retired')),
  origin jsonb not null,
  provenance jsonb not null,
  created_at timestamptz not null default now()
);
alter table world_documents enable row level security;
