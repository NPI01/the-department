-- Cohorts. A campaign is one cohort of players sharing a story and a schedule.
-- Applicants join the recruiting cohort with open seats; a cohort starts at its
-- scheduled start (Round 1 opens at that morning's dispatch) or when the
-- showrunner starts it. New cohorts are cloned from a template campaign.
alter table campaigns add column cohort_size int not null default 12;
alter table campaigns add column scheduled_start timestamptz;
alter table campaigns add column template_campaign_id uuid references campaigns(id);
alter table campaigns add column late_join_days int not null default 7;   -- an active cohort still takes applicants this many days of its first episode
