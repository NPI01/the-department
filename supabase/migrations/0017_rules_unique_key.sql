-- Every writer upserts rules on (campaign_id, key) (the Convergence Index in
-- resolve.ts, beat shifts and room.mode in room.ts, the console's switch); the
-- table never had the constraint, so each of those upserts failed. Keep the
-- latest row where duplicates exist, then add it.
delete from rules a using rules b where a.campaign_id = b.campaign_id and a.key = b.key and a.created_at < b.created_at;
create unique index rules_campaign_key on rules (campaign_id, key);
