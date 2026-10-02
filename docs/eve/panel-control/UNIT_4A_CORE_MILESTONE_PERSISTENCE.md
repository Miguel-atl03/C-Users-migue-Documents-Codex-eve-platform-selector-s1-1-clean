# Unidad 4A — Persistencia Hitos core H0–H6 y evidencia de logro

Fecha: 2026-07-15  
Alcance: base factual para KPI «Hitos core alcanzados».  
**KPI visual: no activado.**

## Definición de hito core

Fuente: `Diseno_Panel_Control_EVE_Empresa_Cliente…v1_0.docx` §6.2 / §8.

Hitos core = **H0–H6 de PF-CORE-01** (`CasoDiagnosticoEVE`), no hitos operativos genéricos de Unit 3A ni líneas paralelas (P).

| Code | Seq | Label | Object | State |
|------|-----|-------|--------|-------|
| H0 | 0 | Caso abierto | CasoDiagnosticoEVE | InDiagnosticProduction |
| H1 | 1 | Escena operativa consolidada | CasoDiagnosticoEVE | WithSceneCanonicalRecord |
| H2 | 2 | Listo para transducción | CasoDiagnosticoEVE | ReadyForTransduction |
| H3 | 3 | Escenas evidenciales validadas | CasoDiagnosticoEVE | WithValidatedEvidentialScenes |
| H4 | 4 | Película causal agregada | CasoDiagnosticoEVE | WithAggregatedCausalMovie |
| H5 | 5 | Diagnóstico experto recibido | CasoDiagnosticoEVE | WithDeliveredExpertDiagnosis |
| H6 | 6 | Caso entregado y cerrado | CasoDiagnosticoEVE | Delivered |

Archivo máquina: `scripts/eve/official-control-panel/core-milestone-h0-h6-catalog.json`.

## Relación con PF-CORE-01

`case_main_processes.core_process_code` debe ser `PF-CORE-01` (explícito).  
Sin ese código → progreso `unavailable`. No se infiere por nombre/INC16/BPMN.

## Definición de reached

§8.1 corpus: **Object[State] registrado por el core**.

Operacionalizado:

```
definición activa
∧ vínculo caso activo aplicable
∧ evidencia vigente (revoked_at IS NULL)
∧ object_name = expected_object_name
∧ object_state = expected_object_state
```

**No** usar `case_milestones.status = completed`.

## Modelo

1. `core_milestone_definitions` — catálogo  
2. `case_core_milestones` — vínculo caso/proceso/definición (+ `operational_milestone_id` nullable)  
3. `core_milestone_achievements` — evidencia; revocación auditada  

## Cálculo

`eve_calculate_core_milestone_progress(case_id)` →  

- `available`: H0–H6 + 7 vínculos aplicables + evidencia evaluable  
- `partial`: catálogo/vínculos incompletos o evidencia contradictoria  
- `unavailable`: sin proceso PF-CORE-01  

BFF expone solo `{ achieved, total, status }` dentro de `process-structure`.

El cálculo core es **degradable**: si la RPC falla, la estructura Unit 3B
sigue respondiendo y `coreMilestoneProgress` cae a `unavailable`
(`total: 0`). La UI KPI no se activa en esta unidad.

## Amber

Sin proceso / sin vínculos / sin logros → `status=unavailable`, `total=0`.  
No se insertan H0–H6 ni evidencias para Amber en seed.

## Admin

`manage-core-milestones.mjs` (`--dry-run`, `--confirm=UNIT4A_ADMIN`)

Incluye `seed-canonical-definitions` desde el JSON corpus.

## Verificador / rollback

- `verify-unit-4a-integrity.mjs`  
- `UNIT_4A_ROLLBACK.md` / `rollback-unit-4a.sql`

## Limitaciones

- KPI UI no lee aún `coreMilestoneProgress`.  
- Object[State] debe registrarse administrativamente (no Runtime auto).  
- Alternativas `ClosedWithoutSufficiency` / `Cancelled` no cuentan como H0–H6 alcanzados.
