# Dictamen — Corrección factual §8 Eje Y + §9 Matriz X/Y

Fecha: 2026-07-16 (cierre de sincronización)  
Entorno: **solo local**  
Staging/producción: **sin cambios**  
Autoridad: `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` §8 / §9

## Decisión

| Punto | Estado |
|-------|--------|
| **§8 Eje Y** | **Cerrado estructuralmente y parcial operacionalmente** |
| **§9 Matriz X/Y** | **Cerrada estructuralmente.** La ejecución factual de intersecciones permanece **no disponible** |

## Cierre de sincronización (brechas corregidas)

### A — Selección y detalle sincronizados
- Fuente de verdad: `validatedSelectedMilestone = selectedItem?.code ?? null`.
- URL `milestone=Hn` solo es selección efectiva tras validar H0–H6 ∈ `axis.items` y contexto activo.
- Rail `aria-pressed`, detalle `Detalle del hito Hn` y URL coinciden; no hay estado intermedio persistente.

### B — Loading vs intersección
- `initialLoading = loading && !itemsLoaded` → solo “Cargando hitos core…”.
- `refreshing = loading && itemsLoaded` → “Actualizando hitos…” sin vaciar detalle/matriz.
- Matriz e intersección reciben `effectiveMilestoneCode` solo si `status ∈ {ready, partial}`.

### C — Columna completa
- Cada `<td>` de la columna seleccionada lleva `xyMatrixColSelected` + `data-selected-column`.
- Celda de intersección: `data-selected-cell`; fila: `data-selected-row`.
- Incluye las 8 filas P-SUP y la frontera P-CLIENT-01.

### D — E2E sin falsos positivos
- Exige región `Detalle del hito Hn`, heading `/^Hn —/`, ausencia del mensaje de selección.
- Back/forward, teclado (Enter/Space/Home/End), inválidos, matriz 9×7, capturas estables.

## Amber

Sin evidencia inventada. Todos los hitos: **No disponible**. KPI: **—**.

## Pruebas (obligatorias en este cierre)

| Suite | Resultado |
|-------|-----------|
| `test:official-control-panel-rector-points-8-9` | pass |
| `test:official-control-panel-rector-point-7` | pass |
| unit1, unit2b, unit3b, unit4a | pass |
| tramo R2A / R2B | pass (R2B orden workspace alineado a §§8–9) |
| Playwright Amber §§8–9 (5 specs) | pass — capturas 01–14 regeneradas |
| TypeScript (`tsc --noEmit`) | pass |
| ESLint (archivos §§8–9 tocados) | pass |
| `check:no-legacy-runtime-catalog` | **fallo preexistente** (`src/rules/question-catalog-v2-1.json`) — fuera del alcance §§8–9; no ocultado |

## Migraciones

Ninguna nueva.

## Fronteras respetadas

Sin mover Eje X, franja KPI estructural, Atención, selectores, Personas, R2, staging/prod, Runtime ni puntos posteriores al §9.
