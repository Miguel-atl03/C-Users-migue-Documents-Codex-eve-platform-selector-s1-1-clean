# MBA Control Plane Incremento 1.6 (Runtime Shadow)

## Alcance

Incremento 1.6 agrega la cadena runtime lateral de Produccion Paralela:

1. `POST /api/parallel-production/inventory/resolve`
2. `POST /api/parallel-production/mmabp-ir/project`
3. `POST /api/parallel-production/assessment/run`
4. `POST /api/parallel-production/candidate-export/generate`

Todo opera en `shadow_mode` y no bloquea el core diagnostico.

## Fronteras obligatorias

- No activa `soft_governance_mode`.
- No activa `enforcement_mode`.
- No modifica `EvidenceBundle [ReadyForTransduction]`.
- No usa `session_ready_for_transduction` como target state.
- No modifica readiness hacia Capa 2.0 desde Produccion Paralela.
- `candidate_export_package` no equivale a `ExportCodePackage [Generated]`.
- `allow_export_promotion=false` por defecto.

## Persistencia

### 1) Persistencia operativa lateral (no `mba_*`)

Tabla propuesta:

- `parallel_production_runtime_artifacts`

SQL:

- `schemas/parallel-production/runtime-persistence-v01.sql`

Esta tabla guarda artefactos runtime con trazabilidad e idempotencia:

- `case_id`
- `session_id`
- `source_artifact_id`
- `correlation_id`
- `run_id`
- `created_at`
- `source_step`
- `source_adapter`

`mba_*` se mantiene como ledger/compliance/auditoria.

### 2) Persistencia MBA observacional (sin cambios de rol)

Cada endpoint sigue registrando en `mba_*` via observer shadow:

- `mba_event_ledger`
- `mba_timer_ledger`
- `mba_object_state_snapshots`
- `mba_domain_state_observations`
- `mba_transition_findings`
- `mba_compliance_reports`

## Estados canónicos MBA

Los estados MBA registrados en Control Plane siguen canónicos:

- `PaqueteProduccionParalelaMMABP`: `FactsConsolidated`, `IRProjected`, etc.
- `ArchitectureConsistencyAssessment`: `Satisfied|WithFindings|Blocked`

Estados técnicos (`ResolvedWithWarnings`, `ProjectedWithWarnings`, `ready_with_warnings`, `candidate_ready`) quedan como `artifact_status` o `payload.status`, no como OLC canónico inventado.

## Reglas de assessment y export

- `ArchitectureConsistencyAssessment [Satisfied]` solo se emite con evidencia explícita (sin warnings/gaps incompletos).
- Si hay warnings/gaps: `WithFindings` (o `Blocked` si gap bloqueante).
- `candidate_export_package` nunca promueve a `ExportCodePackage [Generated]` en 1.6.
- `ExportCodePackage [Generated]` queda reservado para incremento posterior con:
  - assessment satisfecho,
  - validación sintáctica pasada,
  - promoción explícita habilitada.

