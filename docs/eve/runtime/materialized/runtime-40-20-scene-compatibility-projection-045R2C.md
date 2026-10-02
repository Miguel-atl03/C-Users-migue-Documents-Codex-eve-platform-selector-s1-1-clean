# Scene Compatibility Projection 045-R2C

Status: not materialized

The legacy scene path remains present. /api/scenes/answers calls saveSceneQuestionAnswers, which writes scene_question_answers and scene_answer_provenance. That path can remain for non-Runtime sessions only after an explicit transition, but it cannot be a parallel authority for Runtime sessions.

Because the Runtime commit does not yet emit a governed outbox event and current Runtime rows use scene_id null, the scene projection is blocked.