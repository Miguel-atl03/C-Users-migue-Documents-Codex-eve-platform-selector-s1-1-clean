grant select, insert, update, delete on scene_registry to anon, authenticated;
grant select, insert, update, delete on scene_question_answers to anon, authenticated;
grant select, insert, update, delete on scene_answer_provenance to anon, authenticated;
grant select, insert, update, delete on scene_block_derivations to anon, authenticated;
grant select, insert, update, delete on scene_consistency_flags to anon, authenticated;
grant select, insert, update, delete on scene_clarifications to anon, authenticated;
grant select, insert, update, delete on scene_light_inferences to anon, authenticated;
grant select, insert, update, delete on scene_canonical_records to anon, authenticated;
grant select, insert, update, delete on session_intermediate_output to anon, authenticated;

alter table scene_registry disable row level security;
alter table scene_question_answers disable row level security;
alter table scene_answer_provenance disable row level security;
alter table scene_block_derivations disable row level security;
alter table scene_consistency_flags disable row level security;
alter table scene_clarifications disable row level security;
alter table scene_light_inferences disable row level security;
alter table scene_canonical_records disable row level security;
alter table session_intermediate_output disable row level security;
