# Cervecería Amber — registro canónico (staging)

Fecha: 2026-07-15  
Criterio: **evidencia documental en el repo**, no nombre ni fecha de creación.

## Empresas duplicadas detectadas

| empresa_id | sesión asociada (vía `usuarios.empresa_id`) | Referencia documental en repo |
|---|---|---|
| `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | **Sí** — ver fuentes abajo |
| `e6cdd265-b0a7-441d-a3b0-e0d7fdc842cf` | `cc983357-dd4a-42e9-b2f7-fa54364184df` | No |

## Fuentes documentales (canonizan `5c08029f…` + `19fc9eff…`)

1. `tests/regression/mba-control-plane/mba-control-plane.test.mjs` — `case_id` / `session_id` = `19fc9eff-4219-43f0-854c-e2b3350f23f2`
2. `run-inc16-runtime-validation-v2.ps1` — `$caseId = "19fc9eff-4219-43f0-854c-e2b3350f23f2"`
3. `docs/audits/_eve_organism_real_signal_field_occurrence_matrix_v1.json` — ocurrencia de `session_id`

## Correlación operativa verificada (staging)

La sesión canónica `19fc9eff-4219-43f0-854c-e2b3350f23f2` enlaza al participante cuya `empresa_id` es `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` (no al duplicado `e6cdd265…`).

## Registro canónico adoptado

| Rol | UUID |
|---|---|
| Empresa cliente | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` |
| Caso en curso | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |
| Consultor A (único `auth.users` staging) | `a4622bce-ab0d-44b7-945f-ed525184e98b` |

## Consultor B

Staging remoto reporta **1** fila en `auth.users`. No existe segundo consultor real para aislamiento A/B completo sin alta adicional controlada.
