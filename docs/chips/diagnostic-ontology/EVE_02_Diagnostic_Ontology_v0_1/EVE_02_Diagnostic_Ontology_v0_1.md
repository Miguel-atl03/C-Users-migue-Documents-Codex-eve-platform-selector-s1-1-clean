# EVE_02_Diagnostic_Ontology_v0_1

**Chip:** `EVE-02-DIAGNOSTIC-ONTOLOGY`  
**Versión:** `0.1.0`  
**Etapa:** `02_diagnostic_ontology`  
**Estado:** draft_ready_for_review

## Propósito
Convertir la Tabla de Diagnóstico de Inconsistencias Estructurales EVE en una ontología ejecutable que traduzca inconsistencias MMABP validadas en candidatos de preclasificación patológica EVE.

## Separación de autoridad

| Autoridad | Uso en este chip |
|---|---|
| D2 Tabla EVE | Fuente primaria de compartimentos y patologías. |
| D1 Fundamentals | Guardia metodológica: sin inconsistencia MMABP validada no hay patología candidata. |
| D4 Especificación Técnica | Frontera técnica: no diagnóstico final, no IR/export desde texto libre. |
| D5 Catálogo Runtime DOCX | Frontera runtime: B7/C20 no diagnóstico, SEM/PST gates y readiness. |
| Instrucciones internas GPT | Excluidas como fuente compilada de plataforma. |

## Compartimentos diagnósticos

| ID | Tipo | Modelos | Patología candidata |
|---|---|---|---|
| EVE02-CMP-001 | Factual | PM ↔ MoC | Esquizofrenia Ontológica |
| EVE02-CMP-002 | Factual | PM ↔ PF | Brecha Intencional |
| EVE02-CMP-003 | Factual | MoC ↔ PF | Anarquía Operacional |
| EVE02-CMP-004 | Factual | PF ↔ OLC | Violación Causal |
| EVE02-CMP-005 | Factual | OLC ↔ MoC | Amnesia Estructural |
| EVE02-CMP-006 | Temporal | PF ↔ OLC | Tortura Causal |
| EVE02-CMP-007 | StructuralAlternatives | PF ↔ OLC | Falsa Elección |
| EVE02-CMP-008 | StructuralIterations | OLC ↔ MoC | Incapacidad de Gestión de Conjuntos |
| EVE02-CMP-009 | CompositeFactual | PM ↔ MoC ↔ PF | Arquitectura Fantasma |
| EVE02-CMP-010 | TemporalIntentional | PM ↔ PF ↔ OLC | Promesa Imposible |
| EVE02-CMP-011 | StructuralOntological | PM ↔ MoC ↔ OLC | Identidad Disociada |
| EVE02-CMP-012 | CausalOperational | MoC ↔ PF ↔ OLC | Competencia Causal |
| EVE02-CMP-013 | SystemicTotal | PM ↔ MoC ↔ PF ↔ OLC | Incoherencia Sistémica Total |

## Input contract expl?cito

El chip requiere un `input_contract` expl?cito antes de emitir cualquier `diagnostic_preclassification_candidate` o estado de bloqueo/manual review. Este contrato no agrega reglas nuevas ni cambia la sem?ntica: hace expl?citos los campos ya protegidos por las reglas `EVE02-R019` a `EVE02-R024`.

| Campo | Required | Meaning | blocked_if_missing | source_support |
|---|---:|---|---|---|
| `inconsistency_compartment` | true | Identifica el compartimento EVE02-CMP-001..EVE02-CMP-013 que se eval?a. | `blocked_by_missing_evidence` | D2, EVE02-R019, EVE02-R020, EVE02-R023 |
| `involved_models` | true | Lista los modelos implicados: PM, MoC, PF, OLC o combinaci?n v?lida. | `blocked_by_missing_evidence` | D2, EVE02-R019 |
| `conformance_status` | true | Estado de conformance de los modelos implicados; si falta, bloquear con `blocked_by_conformance_unchecked`. | `blocked_by_conformance_unchecked` | D1, EVE-00, EVE02-R022 |
| `consistency_status` | true | Estado de consistency del compartimento; si falta, bloquear con `blocked_by_consistency_unchecked`. | `blocked_by_consistency_unchecked` | D1, D2, EVE-00, EVE02-R023 |
| `evidence_refs` | true | Referencias a evidencia, model element, gate output o candidate estructural; si faltan, bloquear con `blocked_by_missing_evidence`. | `blocked_by_missing_evidence` | D4, D5, EVE02-R005, EVE02-R021 |
| `source_trace` | true | Trazabilidad a D2/D1/D4/D5 y/o dependency guard EVE-00/EVE-01; si falta, bloquear con `blocked_by_missing_evidence` o `manual_review_required` seg?n caso. | `blocked_by_missing_evidence_or_manual_review_required` | D1, D2, D4, D5, EVE-00, EVE-01, EVE02-R021, EVE02-R024 |

## Contrato de salida

Salidas permitidas: `diagnostic_preclassification_candidate`, bloqueos por conformance/consistency/evidence/semantic ambiguity, `manual_review_required` y `reentry_required`.

Salidas prohibidas: `final_diagnosis`, `IR`, `registry_write`, `export_payload`, `monetization_decision`, `transduction`, `production_real`.

## Reglas ejecutables

### EVE02-R001 — D2 is primary pathology map
- Módulo: `diagnostic_authority_rules`
- Severidad: `blocking`
- Regla: The chip may map a technical inconsistency to an EVE pathology only when the mapping exists in D2 or in a later approved diagnostic ontology source.
- Fuentes: D2

### EVE02-R002 — D1 validates inconsistency before diagnosis
- Módulo: `diagnostic_authority_rules`
- Severidad: `blocking`
- Regla: A pathology candidate must not be emitted until the relevant MMABP inconsistency has been established by conformance/consistency logic governed by D1 and Stage 00.
- Fuentes: D1, EVE-00

### EVE02-R003 — No final diagnosis in Capa 1
- Módulo: `diagnostic_authority_rules`
- Severidad: `blocking`
- Regla: The chip emits diagnostic preclassification candidates only; it does not produce final diagnosis, IR, registry, export, monetization or transduction.
- Fuentes: D4, D5, EVE-01

### EVE02-R004 — No cosmetic alignment
- Módulo: `diagnostic_authority_rules`
- Severidad: `blocking`
- Regla: If models contradict each other, the chip must require return to factual evidence and must not recommend cosmetic alignment of models.
- Fuentes: D1, D2

### EVE02-R005 — No pathology from text alone
- Módulo: `diagnostic_authority_rules`
- Severidad: `blocking`
- Regla: Textual narrative without model evidence, source trace and inconsistency compartment is insufficient for pathology mapping.
- Fuentes: D4, D5

### EVE02-R006 — Compartment EVE02-CMP-001 maps to Esquizofrenia Ontológica
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pm_moc_factual_inconsistency_detected is present and not blocked, emit pathology_candidate=Esquizofrenia Ontológica for PM ↔ MoC.
- Fuentes: D2

### EVE02-R007 — Compartment EVE02-CMP-002 maps to Brecha Intencional
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pm_pf_factual_inconsistency_detected is present and not blocked, emit pathology_candidate=Brecha Intencional for PM ↔ PF.
- Fuentes: D2

### EVE02-R008 — Compartment EVE02-CMP-003 maps to Anarquía Operacional
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When moc_pf_factual_inconsistency_detected is present and not blocked, emit pathology_candidate=Anarquía Operacional for MoC ↔ PF.
- Fuentes: D2

### EVE02-R009 — Compartment EVE02-CMP-004 maps to Violación Causal
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pf_olc_factual_inconsistency_detected is present and not blocked, emit pathology_candidate=Violación Causal for PF ↔ OLC.
- Fuentes: D2

### EVE02-R010 — Compartment EVE02-CMP-005 maps to Amnesia Estructural
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When olc_moc_factual_inconsistency_detected is present and not blocked, emit pathology_candidate=Amnesia Estructural for OLC ↔ MoC.
- Fuentes: D2

### EVE02-R011 — Compartment EVE02-CMP-006 maps to Tortura Causal
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pf_olc_temporal_inconsistency_detected is present and not blocked, emit pathology_candidate=Tortura Causal for PF ↔ OLC.
- Fuentes: D2

### EVE02-R012 — Compartment EVE02-CMP-007 maps to Falsa Elección
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pf_olc_structural_alternatives_inconsistency_detected is present and not blocked, emit pathology_candidate=Falsa Elección for PF ↔ OLC.
- Fuentes: D2

### EVE02-R013 — Compartment EVE02-CMP-008 maps to Incapacidad de Gestión de Conjuntos
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When olc_moc_structural_iteration_inconsistency_detected is present and not blocked, emit pathology_candidate=Incapacidad de Gestión de Conjuntos for OLC ↔ MoC.
- Fuentes: D2

### EVE02-R014 — Compartment EVE02-CMP-009 maps to Arquitectura Fantasma
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pm_moc_pf_composite_factual_inconsistency_detected is present and not blocked, emit pathology_candidate=Arquitectura Fantasma for PM ↔ MoC ↔ PF.
- Fuentes: D2

### EVE02-R015 — Compartment EVE02-CMP-010 maps to Promesa Imposible
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pm_pf_olc_temporal_intentional_inconsistency_detected is present and not blocked, emit pathology_candidate=Promesa Imposible for PM ↔ PF ↔ OLC.
- Fuentes: D2

### EVE02-R016 — Compartment EVE02-CMP-011 maps to Identidad Disociada
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When pm_moc_olc_structural_ontological_inconsistency_detected is present and not blocked, emit pathology_candidate=Identidad Disociada for PM ↔ MoC ↔ OLC.
- Fuentes: D2

### EVE02-R017 — Compartment EVE02-CMP-012 maps to Competencia Causal
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When moc_pf_olc_causal_operational_inconsistency_detected is present and not blocked, emit pathology_candidate=Competencia Causal for MoC ↔ PF ↔ OLC.
- Fuentes: D2

### EVE02-R018 — Compartment EVE02-CMP-013 maps to Incoherencia Sistémica Total
- Módulo: `inconsistency_compartment_catalog`
- Severidad: `blocking`
- Regla: When systemic_total_inconsistency_detected is present and not blocked, emit pathology_candidate=Incoherencia Sistémica Total for PM ↔ MoC ↔ PF ↔ OLC.
- Fuentes: D2

### EVE02-R019 — Evidence must identify models
- Módulo: `evidence_input_contract`
- Severidad: `blocking`
- Regla: Every diagnostic input must declare the model set involved: PM, MoC, PF, OLC or a cross-model combination.
- Fuentes: D2

### EVE02-R020 — Evidence must identify inconsistency class
- Módulo: `evidence_input_contract`
- Severidad: `blocking`
- Regla: Every diagnostic input must declare inconsistency class: factual, temporal, structural alternatives, structural iterations, composite factual, temporal-intentional, structural-ontological, causal-operational or systemic total.
- Fuentes: D2

### EVE02-R021 — Evidence must include source_trace
- Módulo: `evidence_input_contract`
- Severidad: `blocking`
- Regla: Every diagnostic candidate must preserve source_trace to the evidence item, model element, gate output or structural candidate that triggered it.
- Fuentes: D4, D5

### EVE02-R022 — Conformance status required
- Módulo: `evidence_input_contract`
- Severidad: `blocking`
- Regla: If any involved model lacks conformance status, the candidate must be blocked_by_conformance_unchecked.
- Fuentes: D1

### EVE02-R023 — Consistency status required
- Módulo: `evidence_input_contract`
- Severidad: `blocking`
- Regla: If the cross-model inconsistency has not been evaluated by the corresponding consistency compartment, the candidate must be blocked_by_consistency_unchecked.
- Fuentes: D1, D2

### EVE02-R024 — Ambiguity routes to manual review
- Módulo: `evidence_input_contract`
- Severidad: `blocking`
- Regla: If evidence is semantically ambiguous, route to manual_review_required instead of forcing a pathology mapping.
- Fuentes: D4, D5

### EVE02-R025 — Single strongest compartment
- Módulo: `classification_rules`
- Severidad: `advisory`
- Regla: When multiple compartments fire, preserve all candidates but identify a primary_candidate only if one has higher evidence_strength and broader model coverage.
- Fuentes: D2

### EVE02-R026 — Systemic total requires cascade evidence
- Módulo: `classification_rules`
- Severidad: `blocking`
- Regla: Incoherencia Sistémica Total requires contradiction evidence across all four views, not merely two isolated inconsistencies.
- Fuentes: D2

### EVE02-R027 — Temporal PF-OLC distinction
- Módulo: `classification_rules`
- Severidad: `blocking`
- Regla: Tortura Causal requires sequence/order violation; Violación Causal requires forcing an invalid state or transition. Do not collapse them.
- Fuentes: D2, D1

### EVE02-R028 — Structural PF-OLC distinction
- Módulo: `classification_rules`
- Severidad: `blocking`
- Regla: Falsa Elección requires mismatch between PF alternatives/gateways and OLC causal alternatives. Do not classify every PF/OLC issue as Falsa Elección.
- Fuentes: D2, D1

### EVE02-R029 — MoC-PF-OLC causal operational distinction
- Módulo: `classification_rules`
- Severidad: `blocking`
- Regla: Competencia Causal requires the object operation to be structurally allowed by MoC but causally unauthorized by OLC at that state while PF executes it.
- Fuentes: D2

### EVE02-R030 — Aliases are not new pathologies
- Módulo: `classification_rules`
- Severidad: `blocking`
- Regla: Aliases such as Esquizofrenia Organizacional must be stored as aliases of an approved pathology label, not as independent ontology entries unless a source explicitly authorizes it.
- Fuentes: D2

### EVE02-R031 — Output type is diagnostic_preclassification_candidate
- Módulo: `output_contract_rules`
- Severidad: `blocking`
- Regla: The only runtime output of this chip is diagnostic_preclassification_candidate or blocked/manual_review state.
- Fuentes: D4, D5

### EVE02-R032 — Output must include method trace
- Módulo: `output_contract_rules`
- Severidad: `blocking`
- Regla: Each output must include method_trace with involved models, inconsistency_type, compartment_id, evidence_refs and source_refs.
- Fuentes: D1, D2, D4

### EVE02-R033 — Output must include pathology trace
- Módulo: `output_contract_rules`
- Severidad: `blocking`
- Regla: Each output must include pathology_trace with pathology label, diagnostic question, pathology statement and source D2 row.
- Fuentes: D2

### EVE02-R034 — Output must include correction boundary
- Módulo: `output_contract_rules`
- Severidad: `blocking`
- Regla: The chip may recommend that the architecture return to factual evidence; it must not directly rewrite models or align them cosmetically.
- Fuentes: D1, D2

### EVE02-R035 — Output must include readiness boundary
- Módulo: `output_contract_rules`
- Severidad: `blocking`
- Regla: Output must expose whether it is ready_for_parallel_production_prep, ready_with_flags, blocked, reentry_required or manual_review_required.
- Fuentes: D4, D5

### EVE02-R036 — B7/C20 non-diagnostic boundary
- Módulo: `runtime_boundary_rules`
- Severidad: `blocking`
- Regla: B7/C20 signals may prepare low-confidence preclassification but must not generate IR, registry, export or final diagnosis.
- Fuentes: D5, D4

### EVE02-R037 — SEM gate before MoC/OLC pathology
- Módulo: `runtime_boundary_rules`
- Severidad: `blocking`
- Regla: If the inconsistency depends on object/state/class/attribute ambiguity, the Semantic Resolution Gate must close before mapping a pathology candidate.
- Fuentes: D5

### EVE02-R038 — PST gate before PF/OLC pathology
- Módulo: `runtime_boundary_rules`
- Severidad: `blocking`
- Regla: If the inconsistency depends on waits, blocking or timers, the Process State/Timer Gate must close before mapping PF/OLC temporal or causal pathology.
- Fuentes: D5

### EVE02-R039 — No exposure of internal diagnosis to UI
- Módulo: `runtime_boundary_rules`
- Severidad: `blocking`
- Regla: The UI may show sober user-facing continuity language; it must not expose pathology labels unless a later explicit diagnostic surface authorizes it.
- Fuentes: D4, D5

### EVE02-R040 — Production Paralela consumes governed candidates only
- Módulo: `runtime_boundary_rules`
- Severidad: `blocking`
- Regla: Downstream consumers must receive governed evidence/candidate payloads, not raw text or unvalidated pathology labels.
- Fuentes: D4, D5

### EVE02-R041 — Manifest must count compartments
- Módulo: `audit_qa_rules`
- Severidad: `blocking`
- Regla: Manifest must report exactly 13 diagnostic compartments for v0.1 unless a later approved source changes the ontology.
- Fuentes: D2

### EVE02-R042 — Manifest must count pathologies
- Módulo: `audit_qa_rules`
- Severidad: `blocking`
- Regla: Manifest must report 13 canonical pathology mappings for v0.1; aliases do not increase canonical count.
- Fuentes: D2

### EVE02-R043 — No internal GPT instructions compiled
- Módulo: `audit_qa_rules`
- Severidad: `blocking`
- Regla: Instrucciones Maestras and Instrucciones Actualizadas are not compiled as platform sources in this chip; they remain assistant-internal context only.
- Fuentes: project_decision

### EVE02-R044 — No generated rules without source
- Módulo: `audit_qa_rules`
- Severidad: `blocking`
- Regla: Every rule must carry at least one source_ref or explicitly mark project_decision for governance decisions made in this conversation.
- Fuentes: D1, D2, D4, D5

### EVE02-R045 — Source checksums recorded
- Módulo: `audit_qa_rules`
- Severidad: `blocking`
- Regla: All source documents used by the chip must have existence, size and sha256 recorded in manifest.
- Fuentes: D4
