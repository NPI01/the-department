-- The Department — initial schema.
-- Principles (see docs/00-plan-audit.md):
--   * Original correspondence is immutable; model interpretations live in separate rows
--     with provenance and confidence.
--   * World truth, player knowledge, player belief and player statements are separate.
--   * Consequential acts (orders, votes, transfers, treaty acceptance) are explicit rows
--     that a deterministic parser or a confirmed web action created — never a bare LLM guess.
--   * Every effect on the world is an append-only event with an idempotency key.

create extension if not exists pgcrypto;

-- ---------- identity ----------
create table players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  display_name text,
  -- secret that must appear in the reply address for inbound mail to be trusted
  mail_token text not null default encode(gen_random_bytes(6), 'hex'),
  consent_ai_processing_at timestamptz,
  created_at timestamptz not null default now()
);

create table applicants (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  note text,
  source text,
  created_at timestamptz not null default now()
);

-- ---------- campaign structure ----------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  timezone text not null default 'America/New_York',
  lock_time time not null default '20:00',
  dispatch_time time not null default '09:00',
  status text not null default 'draft' check (status in ('draft','recruiting','active','intermission','complete')),
  created_at timestamptz not null default now()
);

create table episodes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  number int not null,
  title text not null,
  premise text,
  starts_round int,
  status text not null default 'planned' check (status in ('planned','active','complete')),
  unique (campaign_id, number)
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  episode_id uuid references episodes(id),
  number int not null,                 -- campaign-wide round number
  episode_round int,                   -- 1..14
  opens_at timestamptz not null,
  locks_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','open','locked','resolving','resolved')),
  resolved_at timestamptz,
  unique (campaign_id, number)
);

-- ---------- the institution ----------
create table divisions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  unique (campaign_id, slug)
);

create table factions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  slug text not null,
  name text not null,
  values text,
  public boolean not null default true,
  unique (campaign_id, slug)
);

-- Versioned, player-amendable rules: a closed vocabulary of parameters and permissions.
create table rules (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  key text not null,                   -- e.g. council.quorum, motion.removal.threshold, au.per_round, au.cap
  value jsonb not null,
  effective_from_round int not null default 1,
  effective_to_round int,
  enacted_by text,                     -- 'charter' | motion id | 'admin'
  created_at timestamptz not null default now()
);
create index on rules (campaign_id, key, effective_from_round);

-- ---------- characters (players and NPCs) ----------
create table characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  player_id uuid references players(id),          -- null = NPC
  slug text not null,                              -- also the mailbox local part
  name text not null,
  title text,
  division_id uuid references divisions(id),
  clearance int not null default 1,
  specialization text check (specialization in ('analyst','negotiator','operative','administrator')),
  public_profile text,
  -- NPC-only: structured state the character model is prompted from
  npc_state jsonb,                                  -- {goals, fears, relationships, promises, voice}
  status text not null default 'active' check (status in ('active','missing','dismissed','dead','retired')),
  created_at timestamptz not null default now(),
  unique (campaign_id, slug)
);

create table aliases (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  mailbox text not null,               -- local part of the pseudonymous address
  label text,
  unique (campaign_id, mailbox)
);

create table resources (
  character_id uuid not null references characters(id) on delete cascade,
  kind text not null,                  -- au | funds | influence | political_capital | intel_capacity
  balance numeric not null default 0,
  cap numeric,
  primary key (character_id, kind)
);

-- Persistent things a character holds: evidence, files, informants, equipment, access.
create table assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  holder_id uuid references characters(id),
  kind text not null,                  -- evidence | file | informant | equipment | access | property
  slug text not null,
  name text not null,
  description text,
  provenance jsonb,                    -- where it came from, chain of custody
  tier text check (tier in ('intelligence','evidence','finding')),
  secret boolean not null default true,
  created_at timestamptz not null default now(),
  unique (campaign_id, slug)
);

-- ---------- truth vs knowledge vs belief ----------
-- World truth lives in canon tables (facts) that only the engine writes.
create table facts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  key text not null,                   -- marsh.location, voss.ordered_disappearance
  value jsonb not null,
  established_round int,
  secret boolean not null default true,
  unique (campaign_id, key)
);

-- What a character knows or believes, with how they came to it.
create table knowledge (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  fact_key text not null,
  value jsonb not null,                -- what they think the value is (may be wrong)
  confidence numeric not null default 0.5,
  source_kind text not null,           -- witnessed | told | document | inferred | dispatch
  source_ref uuid,                     -- correspondence id, asset id, event id
  learned_round int,
  created_at timestamptz not null default now()
);
create index on knowledge (character_id, fact_key);

-- ---------- orders ----------
create table order_packets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  mode text not null default 'orders' check (mode in ('orders','hold','standing_only','missed')),
  fallback_policy text,                -- what to do if an action cannot complete
  locked_at timestamptz,
  source text not null default 'web' check (source in ('web','email','default')),
  unique (round_id, character_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references order_packets(id) on delete cascade,
  seq int not null,
  verb text not null,                  -- investigate | travel | request_files | recruit | surveil | transfer | sponsor_motion | ...
  args jsonb not null default '{}',
  condition jsonb,                     -- optional {if: ..., else_seq: n}
  cost jsonb,                          -- reserved resources
  standing boolean not null default false,
  status text not null default 'pending' check (status in ('pending','reserved','rejected','resolved','skipped')),
  ruling text,                         -- rules-lawyer explanation for the player
  unique (packet_id, seq)
);

-- ---------- correspondence ----------
create table threads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  subject text,
  kind text not null default 'private' check (kind in ('private','group','council','public','memo','directive','interrogatory','sealed','system')),
  created_at timestamptz not null default now()
);

create table correspondence (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,  -- nullable: inbound mail is stored before it is routed to a campaign
  thread_id uuid references threads(id),
  round_id uuid references rounds(id),
  direction text not null check (direction in ('inbound','outbound')),
  message_id text unique,              -- RFC 5322 Message-ID; ours on outbound, theirs on inbound
  in_reply_to text,
  from_character uuid references characters(id),
  from_address text,
  to_characters uuid[] not null default '{}',
  cc_characters uuid[] not null default '{}',
  to_addresses text[] not null default '{}',
  subject text,
  body_text text not null,             -- immutable original (plain text part, quoted parts stripped separately)
  body_html text,
  raw jsonb,                           -- full provider payload
  auth jsonb,                          -- {dkim, spf, token_matched, trusted}
  trusted boolean not null default false,
  received_at timestamptz not null default now()
);
create index on correspondence (campaign_id, received_at desc);
create index on correspondence (thread_id);

-- Model-derived interpretations of a message. Never authoritative on their own.
create table correspondence_events (
  id uuid primary key default gen_random_uuid(),
  correspondence_id uuid not null references correspondence(id) on delete cascade,
  kind text not null,                  -- claim | proposal | offer | threat | promise | info_share | vote_intent | order_intent
  payload jsonb not null,
  confidence numeric not null,
  span text,                           -- the quoted text the model pointed at
  provenance jsonb not null,           -- {model, prompt_hash, run_id}
  requires_confirmation boolean not null default false,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- negotiation and institutions ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  slug text not null,
  name text not null,
  kind text not null,                  -- council | committee | faction | society | custom
  charter jsonb,                       -- voting method, quorum, officers
  created_by uuid references characters(id),
  unique (campaign_id, slug)
);

create table memberships (
  organization_id uuid not null references organizations(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  role text,
  voting_weight numeric not null default 1,
  since_round int,
  until_round int,
  primary key (organization_id, character_id)
);

create table agreements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  kind text not null check (kind in ('formal','political','secret','informal')),
  title text,
  terms jsonb not null,                -- structured obligations
  parties uuid[] not null,
  accepted_by uuid[] not null default '{}',
  status text not null default 'proposed' check (status in ('proposed','active','fulfilled','breached','expired','withdrawn')),
  proposed_round int,
  expires_round int,
  source_correspondence uuid references correspondence(id),
  created_at timestamptz not null default now()
);

create table motions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  number text,                         -- e.g. 77-006
  title text not null,
  text text,
  kind text not null,                  -- governance | allocation | investigative | diplomatic | secret
  sponsor_id uuid references characters(id),
  threshold jsonb not null,            -- {method: 'majority_of_seats' | 'majority_of_votes' | 'supermajority', fraction}
  opens_round int not null,
  closes_round int not null,
  status text not null default 'open' check (status in ('open','passed','failed','withdrawn')),
  created_at timestamptz not null default now()
);

create table votes (
  motion_id uuid not null references motions(id) on delete cascade,
  character_id uuid not null references characters(id),
  choice text not null check (choice in ('for','against','abstain')),
  weight numeric not null default 1,
  cast_round int not null,
  source text not null,                -- web | email_grammar | proxy
  source_ref uuid,
  secret boolean not null default false,
  primary key (motion_id, character_id)
);

create table relationships (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  from_character uuid not null references characters(id) on delete cascade,
  to_character uuid not null references characters(id) on delete cascade,
  trust numeric not null default 0,    -- -1..1
  obligation numeric not null default 0,
  hostility boolean not null default false,
  notes jsonb,
  updated_at timestamptz not null default now(),
  primary key (from_character, to_character)
);

-- ---------- the event log ----------
create table events (
  id bigserial primary key,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  round_id uuid references rounds(id),
  phase text,                          -- lock | validate | governance | strategic | world | narrate | send
  kind text not null,
  payload jsonb not null,
  idempotency_key text not null unique,
  visible_to uuid[],                   -- characters allowed to know this happened; null = engine only
  created_at timestamptz not null default now()
);
create index on events (campaign_id, round_id, phase);

-- ---------- jobs and model ledger ----------
create table jobs (
  id bigserial primary key,
  kind text not null,                  -- extract | narrate | npc_reply | tick_phase | send
  payload jsonb not null,
  run_after timestamptz not null default now(),
  attempts int not null default 0,
  max_attempts int not null default 5,
  locked_at timestamptz,
  done_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index on jobs (done_at, run_after) where done_at is null;

create table model_ledger (
  id bigserial primary key,
  tag text not null,
  model text not null,
  ok boolean not null,
  status int,
  ms int,
  prompt_tokens int,
  completion_tokens int,
  error text,
  created_at timestamptz not null default now()
);

-- ---------- RLS: players read only what their character is allowed to ----------
alter table players enable row level security;
alter table correspondence enable row level security;
alter table order_packets enable row level security;
alter table orders enable row level security;
alter table knowledge enable row level security;
alter table characters enable row level security;

create policy "players see themselves" on players for select using (auth.uid() = user_id);
create policy "characters are visible to campaign members" on characters for select using (true);
create policy "own knowledge" on knowledge for select
  using (character_id in (select c.id from characters c join players p on p.id = c.player_id where p.user_id = auth.uid()));
create policy "own packets" on order_packets for all
  using (character_id in (select c.id from characters c join players p on p.id = c.player_id where p.user_id = auth.uid()));
create policy "own orders" on orders for all
  using (packet_id in (select op.id from order_packets op join characters c on c.id = op.character_id join players p on p.id = c.player_id where p.user_id = auth.uid()));
create policy "mail I sent or received" on correspondence for select
  using (
    from_character in (select c.id from characters c join players p on p.id = c.player_id where p.user_id = auth.uid())
    or exists (select 1 from characters c join players p on p.id = c.player_id where p.user_id = auth.uid() and (c.id = any(to_characters) or c.id = any(cc_characters)))
  );
-- Everything else is service-role only (the engine).
