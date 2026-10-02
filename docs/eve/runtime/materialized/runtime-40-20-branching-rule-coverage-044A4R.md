# 044-A.4R — Coverage table

| causal | classification | reason |
|---|---|---|
| C01 | exact_executable_now | B0-Q03/0.3 activity_frequency_base has explicit Irregular/Estacional options; Runtime branching activates densification on variable frequency. |
| C02 | exact_executable_now | B05-Q05 enums close beneficiario≠afectado and low clarity without free-text inference of 'solo la tarea'. |
| C03 | exact_executable_now | trigger_clarity Ambiguo/Muy ambiguo and trigger_exception_exists affirmative options are rector enums. |
| C04 | exact_executable_now | B2-Q12/2.1 multi_choice: open when more than one dimension selected (Runtime branching). |
| C05 | exact_executable_now | Uses transformation_exception_type affirmative option literals from 2.9 — not generic truthiness. |
| C06 | exact_executable_now | transformation_hidden_changes affirmative options from 2.11. |
| C07 | exact_executable_now | transformation_iterations enum closes multiple cycles: Pocas veces / Muchas veces / Continuo. |
| C08 | exact_executable_now | delivery_exception_exists uses 3.10 affirmative option literals. |
| C09 | exact_executable_now | Open on delivery failure / satisfaction adjustment enums. receiver_feedback_exists NLP derivation remains score/route pending_A5 — satisfaction ≠ feedback not inferred from free text. |
| C10 | exact_executable_now | primary_receiver / receiver_type enums for multiple/lateral impact — not string non-empty. |
| C11 | exact_executable_now | deadlock_risk affirmative options exclude explicit negative timeout option. |
| C12 | exact_executable_now | iteration_pattern repetition options; excludes 'No, se hace una sola vez'. |
| C13 | exact_executable_now | route_alternatives multi_choice: any affirmative option; exclusive negative 'No, siempre es el mismo camino'. |
| C14 | exact_executable_now | hidden_subprocess / real_vs_official_sequence / parallelism_type use rector enums — no free-text 'paralelismo confuso'. |
| C15 | exact_executable_now | variedad_residual_5_12 and resource_bargain_5_14 enums close residual/bargain. brecha_capacidad_5_3 calculation is pending_A5 signal (not required to open). |
| C16 | exact_executable_now | rework_present exact option 'Sí' — not boolean truthiness. |
| C17 | exact_executable_now | missing_information excludes 'No me falta información'; informal_rule excludes manual-only option. |
| C18 | exact_executable_now | human_sacrifice / wear_accumulated exclusive negatives; effort_cost scale >= 7 rector threshold. |
| C19 | exact_executable_now | repetitive_failure_pattern equals 'Sí'; residual_variety_absorption / compensation_primary_mechanism option membership. |
| C20 | exact_executable_now | 044-A.5B-R/044-A.6: confidence_level material via B7ConfidenceService |
