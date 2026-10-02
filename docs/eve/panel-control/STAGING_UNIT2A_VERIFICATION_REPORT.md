# Verificación integridad Unidad 2A — staging

Fecha: 2026-07-15  
Proyecto: `https://bwflscplkjohdhkiqqoc.supabase.co`

## Ejecución de `verify-unit-2a-integrity.mjs`

| Intento | URL efectiva | Resultado |
|---|---|---|
| Shell con `SUPABASE_URL` local | `127.0.0.1` | `pass` / `orphanCases: 0` — **no es staging** |
| Shell forzando host remoto sin service role staging | `bwflscplkjohdhkiqqoc` | `Invalid API key` vía REST |
| SQL equivalente (MCP, post-migración correctiva) | remoto | Ver abajo |

**Conclusión:** el verificador oficial debe ejecutarse con `NEXT_PUBLIC_SUPABASE_URL` **y** `SUPABASE_SERVICE_ROLE_KEY` del proyecto staging. La clave service role disponible en shell apunta a Supabase local.

## Reporte staging (sin autocorrección)

| Métrica | Valor | Acción |
|---|---|---|
| `orphanCases` | **80** | Reportado; sesiones legacy sin vínculo explícito |
| `crossCompanyCases` | **0** | Sin cruces empresa–relación |
| `invalidAssignments` | **0** | — |
| `duplicateActiveAssignments` | **0** | — |
| `missingPolicies` | **0** | Políticas Unidad 2A presentes |
| `missingConstraints` | **0** | Constraints/index esperados presentes |
| Caso canónico vinculado | `19fc9eff-4219-43f0-854c-e2b3350f23f2` | 1 caso cerrado con evidencia |

Estado verificador formal: **`fail`** por `orphanCases > 0` (esperado en staging legacy). No se ejecutó backfill masivo.

## Aislamiento Consultor A / B (evidencia SQL)

| Actor | `eve_consultant_has_company_access(5c08029f…)` |
|---|---|
| Consultor A (`a4622bce…`, asignado) | **true** |
| Consultor B (UUID sin asignación `20000000…0002`) | **false** |

Staging solo tiene **1** usuario en `auth.users`; aislamiento B completo con segundo login requiere alta controlada adicional.
