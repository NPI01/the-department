-- Showrunner edits to the game's email templates. Defaults live in code
-- (src/lib/email/templates.ts); a row here overrides the editable fields of one
-- template, and deleting it restores the default.
create table mail_templates (
  key text primary key,
  fields jsonb not null,
  updated_by uuid references admins(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table mail_templates enable row level security;
