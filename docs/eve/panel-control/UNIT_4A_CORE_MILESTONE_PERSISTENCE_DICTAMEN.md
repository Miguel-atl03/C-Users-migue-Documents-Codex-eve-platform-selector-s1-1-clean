# Dictamen de entrega — Unidad 4A

Fecha: 2026-07-15  
Entorno: **solo local**  
KPI visual: **no activado**  
Unidad 5: **no iniciada**  
Staging/producción: **sin cambios**

## Veredicto

**Unidad 4A aceptada** como base factual de Hitos core H0–H6 + evidencia Object[State] + progreso agregado server-side.

Amber: `coreMilestoneProgress.status = unavailable` (`total: 0`). Sin vínculos ni logros inventados.

## Fuentes H0–H6

Corpus: `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` §8.

| Code | Seq | Nombre operativo | Object | State |
|------|-----|------------------|--------|-------|
| H0 | 0 | Caso abierto | CasoDiagnosticoEVE | InDiagnosticProduction |
| H1 | 1 | Escena operativa consolidada | CasoDiagnosticoEVE | WithSceneCanonicalRecord |
| H2 | 2 | Listo para transducción | CasoDiagnosticoEVE | ReadyForTransduction |
| H3 | 3 | Escenas evidenciales validadas | CasoDiagnosticoEVE | WithValidatedEvidentialScenes |
| H4 | 4 | Película causal agregada | CasoDiagnosticoEVE | WithAggregatedCausalMovie |
| H5 | 5 | Diagnóstico experto recibido | CasoDiagnosticoEVE | WithDeliveredExpertDiagnosis |
| H6 | 6 | Caso entregado y cerrado | CasoDiagnosticoEVE | Delivered |

Catálogo máquina: `scripts/eve/official-control-panel/core-milestone-h0-h6-catalog.json` (sembrado local vía admin; no Amber).

## Estructuras creadas

1. `core_milestone_definitions`
2. `case_core_milestones` (+ `operational_milestone_id` nullable)
3. `core_milestone_achievements` (revocación auditada)
4. `case_main_processes.core_process_code` (`null | PF-CORE-01`)

## Migraciones (local)

- `20260715190000_eve_official_control_panel_unit4a_core_milestones.sql`
- `20260715190100_eve_official_control_panel_unit4a_fix_code_ambiguity.sql`

## Constraints / integridad

- codes H0–H6; sequences 0–6  
- una definición activa por code/sequence  
- un vínculo activo caso–definición  
- una evidencia activa por vínculo  
- revocación exige `revoked_by` + `revocation_reason`  
- trigger: proceso = mismo caso + `PF-CORE-01`; operativo = mismo proceso  

## RLS

- Consultor: lectura de definiciones + vínculos de casos autorizados  
- Sin lectura PostgREST de `core_milestone_achievements` para `authenticated`  
- Escritura solo service_role / RPCs admin  

## Regla de logro

`isCoreMilestoneReached` + registro admin: definición activa ∧ vínculo aplicable ∧ evidencia vigente ∧ Object+State coincidentes.  
**No** usa `case_milestones.status = completed`.

## Cálculo / BFF

`eve_calculate_core_milestone_progress` → BFF `process-structure.coreMilestoneProgress: { achieved, total, status }`  
`available | partial | unavailable` — sin evidencia sensible.

## Admin / verificador

- `manage-core-milestones.mjs` (`--dry-run`, `--confirm=UNIT4A_ADMIN`)  
- `verify-unit-4a-integrity.mjs` → **pass** tras seed canónico  
- `inspect-unit4-core-milestone-kpi.mjs` → persistencia presente, UI off  

## Estado Amber

| Campo | Valor |
|-------|-------|
| Caso | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |
| Procesos principales enabled | 0 |
| Vínculos core | 0 |
| Logros activos | 0 |
| Progress | `unavailable` / total 0 |

## Pruebas

Regression Unit 4A + 4-blocked + 3A + 3B: **24 pass**.

## Confirmaciones

- Cero cambios visuales del KPI strip (sigue **—**)  
- Cero inserts de logro en Amber  
- Cero staging/producción  
- Unit 5 no iniciada  

## Riesgos

- Catálogo sembrado solo en DB local; reset requiere re-seed.  
- Rolloback exige vaciar definiciones/vínculos/evidencias/auditoría 4A.  
- KPI visual aún bloqueado hasta aprobación explícita post-4A.

## Archivos principales

Ver bundle `unidad_4a_core_milestone_persistence_bundle.zip`.
