-- Capa 1 v2.1 consumer migration: preserve answer history and avoid silent overwrite by question_code.
-- Run only after confirming no downstream process depends on one-row-per-question storage.

alter table if exists scene_question_answers
  drop constraint if exists scene_question_answers_scene_id_instrument_version_question_code_subquestion_code_key;

create index if not exists idx_scene_question_answers_scene_question_history
  on scene_question_answers(scene_id, instrument_version, question_code, subquestion_code, created_at);
