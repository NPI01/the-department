-- RESEARCH <subject> files a Research Brief in a drawer of its own
-- (src/lib/engine/research.ts). The drawer check from 0008 gains 'research'.
alter table case_items drop constraint if exists case_items_drawer_check;
alter table case_items add constraint case_items_drawer_check check (drawer in ('correspondence','documents','photographs','maps','research','findings'));
