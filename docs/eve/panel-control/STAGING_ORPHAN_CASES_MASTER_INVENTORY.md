# Inventario maestro — casos huérfanos staging (Unidad 2C)

Fecha: 2026-07-15  
Fuente de casos: `public.sesiones_llenado` con `client_company_id` o `client_relationship_id` nulos.  
Artefacto JSON: `reports/staging/unit2/orphan-cases-inventory.json`  
Registro de evidencia: `reports/staging/unit2/orphan-evidence-registry.json`  
Snapshot: `reports/staging/unit2/orphan-cases-snapshot.json`

## Política

- Solo evidencia documental explícita (UUID en artefactos oficiales / auditoría / scripts de validación).
- **Prohibido** como evidencia suficiente aislada: `usuario_id`, `usuarios.empresa_id`, correo, nombre parcial, fecha, similitud, seed local, WorkMap, Runtime.
- Cervecería Amber canónica **preservada** (no reasignar huérfanos por nombre):
  - Empresa `5c08029f-15e9-4bbd-b13e-0ff4765e23b8`
  - Caso ya vinculado `19fc9eff-4219-43f0-854c-e2b3350f23f2`
  - Relación `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043`

## Totales

| Clasificación | Código | Cantidad |
|---|---|---|
| A — Vinculación inequívoca | `unambiguous` | **0** |
| B — Empresa sin relación | `company-without-relationship` | **0** |
| C — Relación ambigua | `ambiguous-relationship` | **0** |
| D — Empresa ambigua | `ambiguous-company` | **1** |
| E — Sin evidencia suficiente | `insufficient-evidence` | **79** |
| F — Inválido / técnico | `invalid-or-technical` | **0** |
| **Total analizado** | | **80** |

## Caso D — empresa ambigua

| Caso | Evidencia | Acción |
|---|---|---|
| `cc983357-dd4a-42e9-b2f7-fa54364184df` | Documentado en `STAGING_AMBER_CANONICAL.md` como par **no canónico** con empresa `e6cdd265-…`; existe duplicado Amber `5c08029f-…`; sin artefacto de validación que declare `case_id` → empresa única | `manual-review` — **no vincular** |

## Pregunta de realidad (D)

El caso `cc983357-…` aparece asociado documentalmente al UUID de empresa duplicado no canónico, mientras el canónico Amber ya tiene caso `19fc9eff-…` vinculado.  
¿Existe evidencia administrativa independiente (contrato, auditoría firmada, UUID declarado) que fije este caso a **una sola** empresa, distinta o igual al canónico? Mientras no exista, permanece sin vínculo.

## Casos E — sin evidencia suficiente (79)

Ninguno de los 79 restantes aparece en:

- `tests/regression/mba-control-plane/mba-control-plane.test.mjs` como `case_id` / `session_id`
- `run-inc16-runtime-validation-v2.ps1`
- matrices de auditoría con declaración explícita caso→empresa→relación

Por tanto: `classification = insufficient-evidence`, `recommendedAction = retain-unlinked`.

Lista completa de UUIDs: ver `orphan-cases-inventory.json` → `assessments[].caseId` donde `classification = insufficient-evidence`.

## Tabla de aprobación (clasificación A)

| Caso | Empresa verificada | Relación verificada | Evidencias | Clasificación | Acción |
|---|---|---|---|---|---|
| — | — | — | — | — | **Ningún caso A** |

**No se solicita aprobación de escritura:** no hay vínculos inequívocos listos.

## Vinculaciones

| Métrica | Valor |
|---|---|
| Propuestas A | 0 |
| Ejecutadas | 0 |
| Dry-run link-case | No requerido (A=0) |
| Huérfanos restantes | 80 |
| Cruces empresa | 0 |

## Reproducibilidad

```bash
node scripts/eve/official-control-panel/classify-orphan-cases.mjs --all --snapshot=reports/staging/unit2/orphan-cases-snapshot.json --output=reports/staging/unit2/orphan-cases-inventory.json
```
