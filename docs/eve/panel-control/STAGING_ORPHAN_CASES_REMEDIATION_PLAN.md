# Plan de remediación — casos huérfanos staging (Unidad 2C)

Fecha: 2026-07-15  
Inventario: `STAGING_ORPHAN_CASES_MASTER_INVENTORY.md`  
JSON: `reports/staging/unit2/orphan-cases-inventory.json`

## Totales por clasificación

| Clase | Cantidad | Acción inmediata |
|---|---|---|
| A `unambiguous` | 0 | N/A |
| B `company-without-relationship` | 0 | N/A — no proponer creación masiva |
| C `ambiguous-relationship` | 0 | N/A |
| D `ambiguous-company` | 1 | Revisión humana; mantener huérfano |
| E `insufficient-evidence` | 79 | Mantener huérfanos |
| F `invalid-or-technical` | 0 | N/A |

## Casos vinculables (A)

Ninguno. No hay lote de vinculación controlada en esta unidad.

## Relaciones que deberían crearse (B)

Ninguna propuesta automática. Crear relación solo tras evidencia documental futura + aprobación humana explícita.

## Ambiguos / sin evidencia / técnicos

| Tipo | Casos | Tratamiento |
|---|---|---|
| D | `cc983357-dd4a-42e9-b2f7-fa54364184df` | Pregunta de realidad sobre empresa duplicada Amber |
| E | 79 UUIDs | Retener sin vínculo; capturar evidencia administrativa caso a caso |
| F | 0 | — |

## Riesgos

1. Inferir empresa desde `usuarios.empresa_id` contaminaría el panel (prohibido).
2. Asignar huérfanos a Amber por nombre crearía cruces semánticos con el canónico.
3. Crear una relación “default” por empresa absorbería casos ajenos.
4. Batch heurístico reabriría deuda estructural.

## Orden de ejecución (futuro)

1. Recibir evidencia documental firmada por caso (UUID empresa + UUID relación o mandato de crear relación).
2. Re-correr `classify-orphan-cases.mjs --all`.
3. Si aparecen A: emitir tabla de aprobación → **detener** → aprobación humana.
4. Por cada A aprobado: `manage-client-context.mjs link-case --dry-run` → validar → `link-case --confirm=UNIT2A_ADMIN`.
5. Re-ejecutar `verify-unit-2a-integrity.mjs` (esperado: huérfanos ↓, cruces = 0).
6. Actualizar inventario y este plan.

## Responsable humano requerido

- Aprobación de cualquier vínculo A.
- Confirmación de empresa para el caso D Amber no canónico.
- Decisión independiente si en el futuro algún caso pasa a F (archivo/exclusión).

## Reversión

- Vínculos futuros: auditar en `official_control_panel_context_audit` (`case_linked`).
- Rollback estructural 2A: `scripts/eve/official-control-panel/rollback-unit-2a.sql` (destruye columnas/tablas; usar solo si se revierte la unidad completa).
- Para desvincular un caso puntual: operación administrativa futura (fuera de 2C); no ejecutada aquí.

## Verificador post-2C (sin escrituras)

```json
{
  "orphanCasesBefore": 80,
  "linkedCases": 0,
  "orphanCasesAfter": 80,
  "crossCompanyCases": 0,
  "invalidAssignments": 0,
  "status": "fail"
}
```

`fail` por huérfanos documentados; **no** por cruces. Aceptable como cierre de 2C mientras la deuda E/D permanezca explícita.
