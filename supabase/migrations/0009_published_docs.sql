-- Player-facing documents edited in the showrunner console (the rulebook first).
-- A row here is what players see; with no row, the page falls back to the draft
-- synced from the repo (canon_docs). Every save keeps a revision.

create table published_docs (
  key text primary key,                -- rules | guide
  banner text,                         -- the notice above the document
  content text not null,               -- player-facing canon Markdown
  updated_by uuid references admins(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table published_docs enable row level security;

create table published_doc_revisions (
  id bigint generated always as identity primary key,
  key text not null,
  banner text,
  content text not null,
  note text,                           -- "saved", "restored from #12", "reset to repo draft"
  saved_by uuid references admins(id) on delete set null,
  saved_at timestamptz not null default now()
);
create index on published_doc_revisions (key, saved_at desc);
alter table published_doc_revisions enable row level security;
