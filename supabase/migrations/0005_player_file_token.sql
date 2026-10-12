-- A private, unguessable token for each player's personnel-file page
-- (/file/<token>), linked from every letter the game sends them. Separate from
-- mail_token on purpose: mail_token is the seal that makes a letter trusted, and
-- a link can be forwarded.
alter table players add column file_token text not null default encode(gen_random_bytes(16), 'hex');
create unique index players_file_token_key on players (file_token);
