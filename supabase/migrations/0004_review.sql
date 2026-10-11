-- Canon review in the showrunner console.
--   canon_docs  a copy of canon/** and draft docs, pushed by scripts/canon-sync.ts so the
--               deployed console can read them (canon itself stays in git)
--   proposals   every PROPOSED block, whole-document approval and open question found
--               in those docs, with the showrunner's decision
-- Service role only: secret canon lives here too.

create table canon_docs (
  path text primary key,                 -- repo-relative, e.g. canon/secret/07-episode-01-engine.md
  title text not null,
  tier text not null check (tier in ('public','secret','draft')),
  content text not null,
  sha text not null,                     -- content hash
  git_sha text,                          -- commit the sync ran from
  synced_at timestamptz not null default now()
);

create table proposals (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,              -- hash of doc path + kind + normalized text
  doc_path text not null,
  kind text not null check (kind in ('document','item','question')),
  heading text,                          -- heading path, e.g. "Appointments and dismissal"
  text text not null,                    -- the block as written
  line int,
  present boolean not null default true, -- still in the doc at last sync
  status text not null default 'open' check (status in ('open','approved','rejected','revise','answered')),
  note text,                             -- revision note or answer
  decided_by uuid references admins(id) on delete set null,
  decided_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index on proposals (status, present);
create index on proposals (doc_path);

alter table canon_docs enable row level security;
alter table proposals enable row level security;
