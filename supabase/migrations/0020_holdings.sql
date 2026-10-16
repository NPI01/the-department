-- Holdings (rulebook §5.2): equipment a character requisitions, listed on the
-- personnel file, used by orders (src/lib/engine/equipment.ts), and seizable.
-- assets gains a status: held while in hand; returned when a loan comes back;
-- seized when Security or a colleague takes it; lost otherwise.
alter table assets add column if not exists status text not null default 'held' check (status in ('held','returned','seized','lost'));
alter table assets add column if not exists status_round int;
alter table assets add column if not exists status_note text;
create index if not exists assets_holder_status on assets (holder_id, status);
