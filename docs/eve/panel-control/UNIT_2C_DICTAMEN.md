# Dictamen — Unidad 2C (clasificación y remediación controlada de huérfanos)

Fecha: 2026-07-15  
Alcance: deuda de 80 casos legacy en staging. **No inicia Unidad 3.**  
UI: **no modificada.** Producción: **intacta.**

## Decisión

| Resultado | Valor |
|---|---|
| Inventario 80/80 | **Completo** |
| Clasificación explícita | **Completa** |
| Vínculos inequívocos (A) | **0** |
| Vínculos ejecutados | **0** (sin aprobación requerida) |
| Cruces empresa | **0** |
| Inferencias prohibidas | **Ninguna aplicada** |
| Unidad 2B | **Intacta** |
| Cierre UI staging | **Sigue bloqueado** (insumos externos; fuera de 2C) |

## Totales

| Métrica | Valor |
|---|---|
| Casos analizados | 80 |
| A inequívocos | 0 |
| B empresa sin relación | 0 |
| C relación ambigua | 0 |
| D empresa ambigua | 1 (`cc983357-…`) |
| E sin evidencia | 79 |
| F técnicos | 0 |
| Vínculos propuestos | 0 |
| Vínculos ejecutados | 0 |
| Huérfanos restantes | 80 |
| Cruces detectados | 0 |

## Documentos / scripts / pruebas

| Artefacto | Ruta |
|---|---|
| Inventario MD | `docs/eve/panel-control/STAGING_ORPHAN_CASES_MASTER_INVENTORY.md` |
| Plan remediación | `docs/eve/panel-control/STAGING_ORPHAN_CASES_REMEDIATION_PLAN.md` |
| Inventario JSON | `reports/staging/unit2/orphan-cases-inventory.json` |
| Snapshot | `reports/staging/unit2/orphan-cases-snapshot.json` |
| Evidence registry | `reports/staging/unit2/orphan-evidence-registry.json` |
| Linking plan | `reports/staging/unit2/orphan-linking-plan.json` |
| Linking result | `reports/staging/unit2/orphan-linking-result.json` |
| Lib clasificación | `scripts/eve/official-control-panel/orphan-case-classification-lib.mjs` |
| CLI | `scripts/eve/official-control-panel/classify-orphan-cases.mjs` |
| Tests 2C | `tests/regression/consultant-control-panel/official-control-panel-unit2c.test.mjs` |

## Riesgos

- 79 casos seguirán fuera del panel consultor hasta evidencia documental.
- Caso D Amber no canónico requiere decisión humana; no mezclar con canónico.
- Verificador remoto seguirá en `fail` por `orphanCases` hasta remediación futura caso a caso.

## Preguntas de realidad pendientes

1. ¿Existe evidencia administrativa para fijar `cc983357-…` a una sola empresa (canónica o no)?
2. ¿Hay contratos/auditorías externas con UUID de caso no presentes en el repo que deban incorporarse al `orphan-evidence-registry.json`?

## Aprobación humana de escritura

**No solicitada:** tabla A vacía. Ningún `link-case` se ejecutó.
