# Runtime 40/20 Gaby Answer Boundary 045R2B

/api/scenes/answers remains required by the current Gaby flow. It writes scene_question_answers and scene_answer_provenance; those records feed derivation, preclassification, consistency and canonicalization.

Runtime ingest writes through a different persistence path. No material boundary was found that performs both writes as one all-or-nothing operation.

Per Gate 10, closure stops as $classification.
