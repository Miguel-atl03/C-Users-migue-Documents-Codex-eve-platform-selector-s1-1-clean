# Respaldo pre-migración Unidad 2A — staging

Fecha: 2026-07-15  
Proyecto: `https://bwflscplkjohdhkiqqoc.supabase.co`  
Autorización: migraciones `20260715072000` + `20260715073000` (staging únicamente).

## Estado previo confirmado

| Elemento | Estado |
|---|---|
| `consultant_company_assignments` | No existía |
| `client_relationships` | No existía |
| `sesiones_llenado.client_company_id` | No existía |
| Rollback disponible | `scripts/eve/official-control-panel/rollback-unit-2a.sql` |

## Empresas Amber candidatas (pre-migración)

| empresa_id | sesion_id documentada | Evidencia documental |
|---|---|---|
| `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | `tests/regression/mba-control-plane/mba-control-plane.test.mjs`, `run-inc16-runtime-validation-v2.ps1`, `docs/audits/_eve_organism_real_signal_field_occurrence_matrix_v1.json` |
| `e6cdd265-b0a7-441d-a3b0-e0d7fdc842cf` | `cc983357-dd4a-42e9-b2f7-fa54364184df` | Sin referencia en artefactos de validación del repo |

**Registro canónico (por evidencia documental, no por nombre ni fecha):**  
`5c08029f-15e9-4bbd-b13e-0ff4765e23b8`  
**Caso canónico:** `19fc9eff-4219-43f0-854c-e2b3350f23f2`
