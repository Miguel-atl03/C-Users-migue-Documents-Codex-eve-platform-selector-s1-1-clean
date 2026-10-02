# MMABP Rule Input Readiness Matrix

Generado: 2026-07-24T07:54:23.232Z

Dictamen: READINESS FISICO MMABP VERIFICADO - CONTROLES NEGATIVOS SCHEMA-VALIDOS, TRAZABLES Y REPRODUCIBLES

Contrato: `scripts/eve/official-control-panel/mmabp-rule-readiness-requirements.v1.json` (3298d62531672ff516188ecf7b444283bbd37726e90eb14e4b488b69e909add2)

| ruleId | dataReady | algorithmExisting | algorithmReady | lote derivado | missingInputs | missingRelations | evidencia |
|---|---:|---:|---:|---|---|---|---|
| `CONF-PM-REALITY-COMPLETE` | false | false | false | LOTE E - requiere evidencia operacional adicional | PM.process_id<br>PM.trigger_event_id | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-PM-REALITY-COMPLETE.json` |
| `CONF-PM-REALITY-CORRECT` | false | false | false | LOTE E - requiere evidencia operacional adicional | PM.dependency_id | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-PM-REALITY-CORRECT.json` |
| `CONF-PF-REALITY-COMPLETE` | false | false | false | LOTE E - requiere evidencia operacional adicional | PF.task_id<br>PF.process_state_id<br>PF.gateway_id | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-PF-REALITY-COMPLETE.json` |
| `CONF-PF-REALITY-CORRECT` | false | false | false | LOTE E - requiere evidencia operacional adicional | PF.sequence_index<br>PF.gateway_id<br>PF.iteration_group_id | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-PF-REALITY-CORRECT.json` |
| `CONF-MOC-REALITY-COMPLETE` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | MoC.class_id<br>MoC.relationship_id | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-MOC-REALITY-COMPLETE.json` |
| `CONF-MOC-REALITY-CORRECT` | false | false | false | LOTE E - requiere evidencia operacional adicional | MoC.class_id<br>MoC.relationship_id | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-MOC-REALITY-CORRECT.json` |
| `CONF-OLC-REALITY-COMPLETE` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | OLC.state_id<br>OLC.constructor<br>OLC.destructor | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-OLC-REALITY-COMPLETE.json` |
| `CONF-OLC-REALITY-CORRECT` | false | false | false | LOTE E - requiere evidencia operacional adicional | OLC.state_id<br>OLC.transition_id | ninguno | `reports/local/mmabp-rule-readiness/rules/CONF-OLC-REALITY-CORRECT.json` |
| `FACT-PM-MOC-OBJECT-REFS` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | MoC.class_id | PM.target_state_id->MoC.class_id | `reports/local/mmabp-rule-readiness/rules/FACT-PM-MOC-OBJECT-REFS.json` |
| `FACT-PM-PF-TRIGGERS` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PM.trigger_event_id<br>PF.trigger_event_id | PM.trigger_event_id->PF.trigger_event_id | `reports/local/mmabp-rule-readiness/rules/FACT-PM-PF-TRIGGERS.json` |
| `FACT-PM-PF-TARGET-STATE` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.produced_object_state_id | PM.target_state_id->PF.produced_object_state_id | `reports/local/mmabp-rule-readiness/rules/FACT-PM-PF-TARGET-STATE.json` |
| `FACT-PM-PF-SUPPORT-SYNC` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PM.supported_process_id<br>PM.synchronization_id | PM.supported_process_id->PF.process_id | `reports/local/mmabp-rule-readiness/rules/FACT-PM-PF-SUPPORT-SYNC.json` |
| `FACT-PM-PF-SYNC-EVENT` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.expected_event_id<br>PF.produced_object_state_id | PF.expected_event_id->PM.synchronization_id | `reports/local/mmabp-rule-readiness/rules/FACT-PM-PF-SYNC-EVENT.json` |
| `FACT-MOC-PF-OBJECT-REFS` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | MoC.class_id<br>PF.produced_object_state_id | MoC.class_id->PF.produced_object_state_id | `reports/local/mmabp-rule-readiness/rules/FACT-MOC-PF-OBJECT-REFS.json` |
| `FACT-PF-PF-SUPPORT-TRIGGER` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.trigger_event_id<br>PF.produced_object_state_id | PF.trigger_event_id->PF.produced_object_state_id | `reports/local/mmabp-rule-readiness/rules/FACT-PF-PF-SUPPORT-TRIGGER.json` |
| `FACT-PF-PF-SUPPORTED-WAIT-EVENTS` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.expected_event_id<br>PF.timer_event_id | PF.expected_event_id->PF.timer_event_id | `reports/local/mmabp-rule-readiness/rules/FACT-PF-PF-SUPPORTED-WAIT-EVENTS.json` |
| `FACT-PF-OLC-EVENT-REASON` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.expected_event_id<br>OLC.transition_reason_id | PF.expected_event_id->OLC.transition_reason_id | `reports/local/mmabp-rule-readiness/rules/FACT-PF-OLC-EVENT-REASON.json` |
| `FACT-PF-OLC-SPLIT-STATES` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.gateway_id<br>OLC.state_id | PF.gateway_id->OLC.state_id | `reports/local/mmabp-rule-readiness/rules/FACT-PF-OLC-SPLIT-STATES.json` |
| `FACT-PF-OLC-TASK-STATES` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.task_id<br>PF.produced_object_state_id<br>OLC.state_id | PF.produced_object_state_id->OLC.state_id | `reports/local/mmabp-rule-readiness/rules/FACT-PF-OLC-TASK-STATES.json` |
| `FACT-OLC-MOC-OPERATIONS` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | OLC.operation_id<br>MoC.operation_id | OLC.operation_id->MoC.operation_id | `reports/local/mmabp-rule-readiness/rules/FACT-OLC-MOC-OPERATIONS.json` |
| `FACT-OLC-MOC-ATTR-REL-REASONS` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | OLC.transition_reason_id<br>MoC.attribute_id<br>MoC.relationship_id | OLC.transition_reason_id->MoC.attribute_id<br>OLC.transition_reason_id->MoC.relationship_id | `reports/local/mmabp-rule-readiness/rules/FACT-OLC-MOC-ATTR-REL-REASONS.json` |
| `FACT-OLC-OLC-CROSS-STATE` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | OLC.related_object_state_id | OLC.related_object_state_id->OLC.state_id | `reports/local/mmabp-rule-readiness/rules/FACT-OLC-OLC-CROSS-STATE.json` |
| `TEMP-PF-OLC-SEQUENCE` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.sequence_index<br>OLC.transition_id | PF.sequence_index->OLC.transition_id | `reports/local/mmabp-rule-readiness/rules/TEMP-PF-OLC-SEQUENCE.json` |
| `TEMP-PF-OLC-CONSISTENCY-TABLE` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.expected_event_id<br>OLC.transition_reason_id<br>OLC.operation_id | PF.expected_event_id->OLC.transition_reason_id<br>OLC.transition_reason_id->OLC.operation_id | `reports/local/mmabp-rule-readiness/rules/TEMP-PF-OLC-CONSISTENCY-TABLE.json` |
| `STRUCT-PF-OLC-ALTERNATIVES` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | PF.gateway_id<br>PF.alternative_group_id<br>OLC.state_id | PF.gateway_id->OLC.state_id | `reports/local/mmabp-rule-readiness/rules/STRUCT-PF-OLC-ALTERNATIVES.json` |
| `STRUCT-MOC-OLC-ATTR-REL-OPERATIONS` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | MoC.operation_id<br>OLC.transition_id | MoC.operation_id->OLC.operation_id | `reports/local/mmabp-rule-readiness/rules/STRUCT-MOC-OLC-ATTR-REL-OPERATIONS.json` |
| `STRUCT-MOC-OLC-ONE-TO-MANY-ITERATION` | false | false | false | LOTE C - faltan campos, relaciones o linaje estructurados | MoC.cardinality_source<br>MoC.cardinality_target<br>OLC.self_loop | MoC.cardinality_source->MoC.cardinality_target | `reports/local/mmabp-rule-readiness/rules/STRUCT-MOC-OLC-ONE-TO-MANY-ITERATION.json` |

PRODUCTOR - NO INICIADO
CP-012 - BLOQUEADO
R4 - BLOQUEADO
R5 - PROVISIONAL
