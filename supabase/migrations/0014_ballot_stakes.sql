-- What a ballot puts at stake, in words a player reads in the ballot notice,
-- the dispatch and the Ballots page (src/lib/game/ballots.ts). Player-facing:
-- never put engine-side truth here (leans, prices, hidden loyalties).
alter table motions add column stakes text;
