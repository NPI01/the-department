-- The Case File: what each character holds, as their own copy, and the
-- player's private notes on it. Design: docs/evidence-cabinet-draft.md.
--
-- case_items is the player's copy, not the truth: a row is a snapshot of what
-- the character received and is never rewritten to match facts. Letters are
-- not copied here; the Case File reads them from correspondence.
-- case_notes are private to the player. No character, model or job reads them.

create table case_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  slug text not null,                  -- the item's short name in orders: EXAMINE <slug>
  kind text not null check (kind in ('letter','memo','document','report','photograph','map','diagram','object','testimony','finding')),
  drawer text not null check (drawer in ('correspondence','documents','photographs','maps','findings')),
  title text not null,
  from_label text,                     -- who wrote or made it, as the copy shows
  written_label text,                  -- the date as written on it ("13–14 Oct 1921", "Undated print")
  written_on date,                     -- for ordering by when it was written
  body text,                           -- the text, in canon Markdown
  image_path text,                     -- "/images/..." (site) or a path in the case-file storage bucket
  caption text,
  asset_id uuid references assets(id) on delete set null,
  round_received int,
  how_obtained text,                   -- player-visible provenance
  copy_note text,                      -- what kind of copy this is
  grade text not null default 'intelligence' check (grade in ('intelligence','evidence','finding')),
  status text not null default 'held' check (status in ('held','handed_over','seized','stolen','destroyed')),
  status_note text,
  status_round int,
  created_at timestamptz not null default now(),
  unique (character_id, slug)
);
create index on case_items (character_id, created_at);
alter table case_items enable row level security;

create table case_notes (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  item_key text,                       -- case_items.slug or letter-<id8>; null = a loose notebook page
  quote text,                          -- the passage the note is about
  body text not null,
  links text[] not null default '{}',  -- other item keys this note connects to
  round int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on case_notes (character_id, created_at desc);
alter table case_notes enable row level security;

-- Scans and photographs filed from the console. Private: pages serve signed URLs.
insert into storage.buckets (id, name, public) values ('case-file', 'case-file', false)
on conflict (id) do nothing;
