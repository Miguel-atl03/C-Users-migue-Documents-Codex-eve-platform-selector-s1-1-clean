# MMABP Rule Implementation Sequence

Generado: 2026-07-24T07:54:23.232Z

No implementa productor. Secuencia derivada desde contrato tecnico, tablas normalizadas, cobertura total por elementos aplicables, relaciones y linaje.

## LOTE C - faltan campos, relaciones o linaje estructurados

- `CONF-MOC-REALITY-COMPLETE`: missing_structured_field:MoC.class_id; missing_structured_field:MoC.relationship_id; algorithm_not_materialized
- `CONF-OLC-REALITY-COMPLETE`: missing_structured_field:OLC.state_id; missing_structured_field:OLC.constructor; missing_structured_field:OLC.destructor; algorithm_not_materialized
- `FACT-PM-MOC-OBJECT-REFS`: missing_structured_field:MoC.class_id; missing_explicit_reference:PM.target_state_id->MoC.class_id; algorithm_not_materialized
- `FACT-PM-PF-TRIGGERS`: missing_structured_field:PM.trigger_event_id; missing_structured_field:PF.trigger_event_id; missing_explicit_reference:PM.trigger_event_id->PF.trigger_event_id; algorithm_not_materialized
- `FACT-PM-PF-TARGET-STATE`: missing_structured_field:PF.produced_object_state_id; missing_explicit_reference:PM.target_state_id->PF.produced_object_state_id; algorithm_not_materialized
- `FACT-PM-PF-SUPPORT-SYNC`: missing_structured_field:PM.supported_process_id; missing_structured_field:PM.synchronization_id; missing_explicit_reference:PM.supported_process_id->PF.process_id; algorithm_not_materialized
- `FACT-PM-PF-SYNC-EVENT`: missing_structured_field:PF.expected_event_id; missing_structured_field:PF.produced_object_state_id; missing_explicit_reference:PF.expected_event_id->PM.synchronization_id; algorithm_not_materialized
- `FACT-MOC-PF-OBJECT-REFS`: missing_structured_field:MoC.class_id; missing_structured_field:PF.produced_object_state_id; missing_explicit_reference:MoC.class_id->PF.produced_object_state_id; algorithm_not_materialized
- `FACT-PF-PF-SUPPORT-TRIGGER`: missing_structured_field:PF.trigger_event_id; missing_structured_field:PF.produced_object_state_id; missing_explicit_reference:PF.trigger_event_id->PF.produced_object_state_id; algorithm_not_materialized
- `FACT-PF-PF-SUPPORTED-WAIT-EVENTS`: missing_structured_field:PF.expected_event_id; missing_structured_field:PF.timer_event_id; missing_explicit_reference:PF.expected_event_id->PF.timer_event_id; algorithm_not_materialized
- `FACT-PF-OLC-EVENT-REASON`: missing_structured_field:PF.expected_event_id; missing_structured_field:OLC.transition_reason_id; missing_explicit_reference:PF.expected_event_id->OLC.transition_reason_id; algorithm_not_materialized
- `FACT-PF-OLC-SPLIT-STATES`: missing_structured_field:PF.gateway_id; missing_structured_field:OLC.state_id; missing_explicit_reference:PF.gateway_id->OLC.state_id; algorithm_not_materialized
- `FACT-PF-OLC-TASK-STATES`: missing_structured_field:PF.task_id; missing_structured_field:PF.produced_object_state_id; missing_structured_field:OLC.state_id; missing_explicit_reference:PF.produced_object_state_id->OLC.state_id; algorithm_not_materialized
- `FACT-OLC-MOC-OPERATIONS`: missing_structured_field:OLC.operation_id; missing_structured_field:MoC.operation_id; missing_explicit_reference:OLC.operation_id->MoC.operation_id; algorithm_not_materialized
- `FACT-OLC-MOC-ATTR-REL-REASONS`: missing_structured_field:OLC.transition_reason_id; missing_structured_field:MoC.attribute_id; missing_structured_field:MoC.relationship_id; missing_explicit_reference:OLC.transition_reason_id->MoC.attribute_id; missing_explicit_reference:OLC.transition_reason_id->MoC.relationship_id; algorithm_not_materialized
- `FACT-OLC-OLC-CROSS-STATE`: missing_structured_field:OLC.related_object_state_id; missing_explicit_reference:OLC.related_object_state_id->OLC.state_id; algorithm_not_materialized
- `TEMP-PF-OLC-SEQUENCE`: missing_structured_field:PF.sequence_index; missing_structured_field:OLC.transition_id; missing_explicit_reference:PF.sequence_index->OLC.transition_id; algorithm_not_materialized
- `TEMP-PF-OLC-CONSISTENCY-TABLE`: missing_structured_field:PF.expected_event_id; missing_structured_field:OLC.transition_reason_id; missing_structured_field:OLC.operation_id; missing_explicit_reference:PF.expected_event_id->OLC.transition_reason_id; missing_explicit_reference:OLC.transition_reason_id->OLC.operation_id; algorithm_not_materialized
- `STRUCT-PF-OLC-ALTERNATIVES`: missing_structured_field:PF.gateway_id; missing_structured_field:PF.alternative_group_id; missing_structured_field:OLC.state_id; missing_explicit_reference:PF.gateway_id->OLC.state_id; algorithm_not_materialized
- `STRUCT-MOC-OLC-ATTR-REL-OPERATIONS`: missing_structured_field:MoC.operation_id; missing_structured_field:OLC.transition_id; missing_explicit_reference:MoC.operation_id->OLC.operation_id; algorithm_not_materialized
- `STRUCT-MOC-OLC-ONE-TO-MANY-ITERATION`: missing_structured_field:MoC.cardinality_source; missing_structured_field:MoC.cardinality_target; missing_structured_field:OLC.self_loop; missing_explicit_reference:MoC.cardinality_source->MoC.cardinality_target; algorithm_not_materialized

## LOTE E - requiere evidencia operacional adicional

- `CONF-PM-REALITY-COMPLETE`: missing_structured_field:PM.process_id; missing_structured_field:PM.trigger_event_id; algorithm_not_materialized; requires_additional_operational_evidence
- `CONF-PM-REALITY-CORRECT`: missing_structured_field:PM.dependency_id; algorithm_not_materialized; requires_additional_operational_evidence
- `CONF-PF-REALITY-COMPLETE`: missing_structured_field:PF.task_id; missing_structured_field:PF.process_state_id; missing_structured_field:PF.gateway_id; algorithm_not_materialized; requires_additional_operational_evidence
- `CONF-PF-REALITY-CORRECT`: missing_structured_field:PF.sequence_index; missing_structured_field:PF.gateway_id; missing_structured_field:PF.iteration_group_id; algorithm_not_materialized; requires_additional_operational_evidence
- `CONF-MOC-REALITY-CORRECT`: missing_structured_field:MoC.class_id; missing_structured_field:MoC.relationship_id; algorithm_not_materialized; requires_additional_operational_evidence
- `CONF-OLC-REALITY-CORRECT`: missing_structured_field:OLC.state_id; missing_structured_field:OLC.transition_id; algorithm_not_materialized; requires_additional_operational_evidence

PRODUCTOR - NO INICIADO
CP-012 - BLOQUEADO
R4 - BLOQUEADO
R5 - PROVISIONAL
