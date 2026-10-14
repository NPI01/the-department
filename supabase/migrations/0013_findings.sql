-- Findings. A motion may carry a finding: what the body is held to have
-- established if the motion passes (or fails). On close the engine records it
-- in facts (finding.<claim>), tells every player character, and the goal judge
-- can test for it. A finding can be formally established and still be wrong.
alter table motions add column finding jsonb;   -- {claim, on: 'passed'|'failed'|'either', text, false_text?}
