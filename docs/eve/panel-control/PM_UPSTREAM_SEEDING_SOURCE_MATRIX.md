# PM Upstream Seeding Source Matrix

U0-R reemplaza el harness sintetico por una lectura productiva de fuentes Runtime reales.

| Input | Estado | Fuente requerida | Bloqueo |
| --- | --- | --- | --- |
| PM.customer_need_id | SOURCE_NOT_MATERIALIZED | ClientNeed, engagement, or explicit need evidence promoted from governed Runtime evidence. | customer_need_runtime_evidence_missing |
| PM.process_id | SOURCE_NOT_MATERIALIZED | Semantically resolved process candidate backed by Runtime evidence and structural candidate gate. | process_candidate_not_semantically_resolved |
| PM.process_kind | SOURCE_NOT_MATERIALIZED | Derived from structural relation: directly satisfies client need => key; supports another process => support. | process_kind_relation_not_derived |
| PM.trigger_event_id | SOURCE_NOT_MATERIALIZED | B1 evidence for source, signal, precondition, and start event. | b1_trigger_event_evidence_missing |
| PM.dependency_id | SOURCE_NOT_MATERIALIZED | Evidence-backed dependency relation between processes. | process_dependency_relation_missing |
| PM.supported_process_id | SOURCE_NOT_MATERIALIZED | Support process discovered through milestones and a support relation. | supported_process_relation_missing |
| PM.synchronization_id | SOURCE_NOT_MATERIALIZED | Causal synchronization pattern with real events and states. | synchronization_pattern_missing |
