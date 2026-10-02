# CLOSEOUT · Significado Runtime Block 0 Canonical Form V0.5

## 1. Dictamen

**SIGNIFICADO_RUNTIME_BLOCK0_CANONICAL_FORM_V0_5_IMPLEMENTED**

`/dev/significado` renderiza las **4 preguntas canónicas reales** extraídas del catálogo Runtime XLSX (B0-Q01 a B0-Q04), con ayudas canónicas visibles bajo cada pregunta y campos/subcampos debajo de la ayuda. La actividad fixture de erogaciones contra Oracle queda prellenada solo en respuestas abiertas. Se eliminaron las 9 preguntas inventadas de V0.4.

## 2. Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/features/significado/runtime-block0-canonical.ts` | **Nuevo** — fuente canónica local desde XLSX |
| `src/features/significado/significado-copy.ts` | Eliminadas preguntas/secciones inventadas; conservado copy de layout |
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | Render dinámico desde `RUNTIME_BLOCK0_CANONICAL_QUESTIONS` + ayuda visible |
| `src/components/significado/significado-de-tu-trabajo.module.css` | Estilos `questionHelp`, `compoundFields`, `textareaInput` |
| `src/app/dev/significado/page.tsx` | Fixture Oracle alineado a claves B0-Q01…B0-Q04 |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Validación de fuente canónica y ausencia de preguntas inventadas |
| `tests/regression/significado-mba-alignment.test.ts` | `ALLOWED_DIFFS` ampliado a artefactos V0.5 |
| `docs/audits/AUDIT_RUNTIME_BLOCK0_CANONICAL_EXTRACTION.md` | **Nuevo** — reporte de extracción |
| `docs/audits/CLOSEOUT_SIGNIFICADO_RUNTIME_BLOCK0_CANONICAL_FORM_V0_5.md` | Este documento |

## 3. XLSX y hojas usadas

**Archivo:** `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx`

**Hojas leídas:**
- `Runtime_Interactions_Base_40`
- `UX_Subfield_Structure`
- `Canonical_Variables`
- `Branching_Budget_Rules`
- `Critical_Routes`
- `Readiness_Gaps_Reentry`
- `Runtime_Interactions_Causal_20`

## 4. Preguntas Bloque 0 extraídas y renderizadas

| # | ID | Pregunta visible | Tipo UI |
|---|---|---|---|
| 1 | B0-Q01 | Esto es lo que entendimos de esta actividad. ¿Está correcto? Si no, corrígelo para que diga qué haces, sobre qué trabajas y qué queda listo. | compound (5 subcampos) |
| 2 | B0-Q02 | En tus palabras, ¿qué ocurre cuando haces esta actividad? | textarea |
| 3 | B0-Q03 | ¿Con qué frecuencia aparece, en qué situación suele ocurrir y sobre quién recae directamente? | compound (3 subcampos) |
| 4 | B0-Q04 | ¿Qué recibes, ves o necesitas para empezar, y qué queda listo para darla por terminada? | textarea |

**Causal asociada documentada, no renderizada:** C01 (variación de frecuencia/caso especial; trigger condicional desde B0-Q03/B0-Q02/B0-Q04).

## 5. Fuente exacta de ayudas

| ID | helpText en UI | Fuente canónica |
|---|---|---|
| B0-Q01 | qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo y corrección libre. | `UX_Subfield_Structure.display_rule` |
| B0-Q02 | Descripción operativa mínima | `Runtime_Interactions_Base_40.function` |
| B0-Q03 | Frecuencia, contexto y actor inmediato | `Runtime_Interactions_Base_40.function` |
| B0-Q04 | Inicio y cierre de la actividad | `Runtime_Interactions_Base_40.function` |

## 6. Actividad fixture usada

**Tarjeta de actividad:**
Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.

**Prellenado de ejemplo (solo respuestas abiertas):**
- B0-Q01 subcampos: Analizo / proyección Oracle / comparación / reporte de desviaciones
- B0-Q02: descripción operativa de comparación y reporte
- B0-Q03: Mensual / cierre mensual / analista financiero
- B0-Q04: inicio y cierre de la actividad

## 7. Confirmación de formato formulario

- [x] `[n]` Pregunta visible + badge Obligatoria/Opcional
- [x] Ayuda canónica **siempre** entre pregunta y campo
- [x] Campo/opciones debajo de la ayuda
- [x] `compound` con subcampos en la misma fila de pregunta
- [x] Layout visual v0.1/v0.2 conservado (sidebar, paso 5, topbar, tarjeta actividad, franja contexto, botones)
- [x] Badge «Preguntas iniciales» (no «Bloque 0»)
- [x] Sin términos prohibidos visibles (runtime, payload, MMABP, etc.)

## 8. Verificación manual `/dev/significado`

**URL:** `http://localhost:3000/dev/significado`  
**Estado:** **200 OK** tras hot reload.

**Observado en snapshot:**
- Actividad Oracle/erogaciones visible
- 4 preguntas canónicas del XLSX
- Ayudas bajo cada pregunta
- Subcampos B0-Q01 (5) y B0-Q03 (3) con valores fixture
- Textareas B0-Q02 y B0-Q04 con valores fixture

## 9. Tests

| Comando | Exit code | Resultado |
|---|---:|---|
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | **0** | 13/13 pass |
| `node --test tests/regression/significado-mba-alignment.test.ts` | **1*** | 3/4 pass |
| `node --test tests/regression/significado-flow-wiring.test.ts` | **1*** | 6/7 pass |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | **0** | 10/10 pass |

\* Falla residual ambiental: `git diff --name-only` no puede ejecutarse en este entorno (`dubious ownership` / not a git repository en subcarpeta). Las aserciones funcionales de copy, payload y wiring pasan.

## 10. git diff

**Comando solicitado:** `git status --short` / `git diff --name-only`

**Resultado en este entorno:** no disponible por ownership del repositorio padre.

**Archivos esperados en diff (solo paths permitidos):**

```text
src/features/significado/runtime-block0-canonical.ts
src/features/significado/significado-copy.ts
src/components/significado/SignificadoDeTuTrabajo.tsx
src/components/significado/significado-de-tu-trabajo.module.css
src/app/dev/significado/page.tsx
tests/regression/significado-de-trabajo-slice.test.ts
tests/regression/significado-mba-alignment.test.ts
docs/audits/AUDIT_RUNTIME_BLOCK0_CANONICAL_EXTRACTION.md
docs/audits/CLOSEOUT_SIGNIFICADO_RUNTIME_BLOCK0_CANONICAL_FORM_V0_5.md
```

**Paths prohibidos:** sin cambios en WorkMap, `src/app/page.tsx`, APIs, Supabase, Runtime engine, `package.json`, `package-lock.json`, middleware ni SQL.

## 11. Recomendación

**A. Aprobar V0.5 y validar visualmente en `http://localhost:3000/dev/significado`**

La pantalla ya consume el catálogo Runtime real para Bloque 0. El siguiente paso natural (fuera de alcance) sería cablear respuestas al motor Runtime persistente y activar C01 solo cuando el trigger canónico lo exija.

## 12. Confirmación de alcance

- [x] Lectura real del XLSX Runtime (no narrativa ni intuición)
- [x] No Runtime completo persistente
- [x] Sin tocar WorkMap / `page.tsx` / APIs / Supabase / Runtime engine / package files
- [x] Preguntas inventadas V0.4 retiradas del componente
