-- Simulated cohorts (campaign slug sim-*) run on a local driver (scripts/simulate.ts),
-- never on the production worker: every job that belongs to one is parked far in the
-- future at insert, so claimNext (run_after <= now) never takes it, and the driver
-- claims it directly. The job's campaign is found from whichever id its payload carries.
create or replace function sim_job_campaign(p jsonb) returns uuid language sql stable as $$
  select coalesce(
    (p->>'campaign_id')::uuid,
    (select campaign_id from rounds where id = (p->>'round_id')::uuid),
    (select campaign_id from correspondence where id = (p->>'correspondence_id')::uuid),
    (select campaign_id from characters where id = (p->>'character_id')::uuid),
    (select campaign_id from applications where id = (p->>'application_id')::uuid)
  )
$$;

create or replace function park_sim_jobs() returns trigger language plpgsql as $$
begin
  if exists (select 1 from campaigns c where c.id = sim_job_campaign(new.payload) and c.slug like 'sim-%') then
    new.run_after := '2999-01-01T00:00:00Z';
  end if;
  return new;
end $$;

drop trigger if exists jobs_park_sim on jobs;
create trigger jobs_park_sim before insert on jobs for each row execute function park_sim_jobs();

-- Jobs already waiting.
update jobs set run_after = '2999-01-01T00:00:00Z'
where done_at is null and exists (select 1 from campaigns c where c.id = sim_job_campaign(jobs.payload) and c.slug like 'sim-%');
