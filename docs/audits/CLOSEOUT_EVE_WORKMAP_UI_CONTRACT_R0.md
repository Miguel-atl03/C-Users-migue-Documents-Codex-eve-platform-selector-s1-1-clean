# CLOSEOUT · EVE WorkMap UI Contract R0

## 1. Dictamen ejecutivo

**UI_CONTRACT_READY_WITH_GAPS**

Se creó el contrato visual rector derivado de WorkMap aprobado. La tarea fue audit-only: no se modificó producto, componentes, CSS, tests, APIs, Supabase, Runtime, middleware ni package files.

El contrato queda listo para guiar Significado y Runtime 40/20, con gaps explícitos donde falta confirmación visual o extracción formal de tokens.

## 2. Archivos leídos

| Archivo | Uso | Hallazgo |
|---|---|---|
| `src/components/WorkMapIntake.tsx` | Fuente de anatomía WorkMap | WorkMap usa shell con sidebar, `ClientFlowHeader`, guía lateral, card central y filas de captura. |
| `src/components/work-map-intake.module.css` | Fuente de tokens | Tokens observados: fondo `#f5f5f5`, sidebar `#dedede`, shell `224px minmax(0, 1fr)`, filas `240px minmax(0, 1fr)`, card blanca, radios 6-14px. |
| `src/components/client/ClientShell.tsx` | Fuente de shell Login/Estado A | Confirma familia visual EVE con fondo gris, superficie blanca y sidebar de marca. |
| `src/components/client/ClientTopbar.tsx` | Fuente de topbar | Topbar sobrio, menú/usuario a la derecha, sin carga visual alta. |
| `src/components/client/EmptyAssessmentState.tsx` | Fuente Estado A | Estado A ya usa filas tipo worksheet con columna izquierda y respuesta derecha. |
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | Fuente Significado | Significado reutiliza patrón/clases WorkMap y muestra actividad actual, avisos y filas de preguntas. |
| `src/components/significado/significado-de-tu-trabajo.module.css` | Fuente Significado visual | Confirma ajuste visual de Significado, estados de ayuda, radio options, breakpoints 900/768/640 y necesidad de ocultar badges internos. |
| `src/app/page.tsx` | Fuente de flujo visual | Confirma Login / Estado A / WorkMap / Significado en flujo principal y estados Runtime posteriores. |
| `docs/audits/HANDOFF_R2_3_TO_SIGNIFICADO_VISUAL_UI.md` | Rector no-go Significado | Prohíbe mostrar selector, ranking, score, gates, payload, VSM, MMABP, AHE, runtime y diagnóstico. |
| `docs/audits/CLOSEOUT_VISUAL_BASELINE_RECOVERY_PAGE_WIRING.md` | Rector baseline | Confirma recuperación visual de Login/Estado A/WorkMap y preservación del puente WorkMap a Significado. |
| `docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_HELP_TEXT_FIX_V0_7.md` | Rector ayudas | Confirma ayuda canónica/fallback documentada y reducción de ruido visual. |

Fuentes opcionales `HANDOFF_Bundle_Pantallas_EVE_Login_a_WorkMap` y `HANDOFF_WorkMap_a_Significado_de_tu_trabajo`: no encontradas por `rg --files` en el workspace actual.

## 3. Documento creado

Path:

`docs/eve-workmap-ui-contract.md`

## 4. Principios extraídos

- WorkMap H12 queda como baseline congelado.
- Agregar sobre lo aprobado; no sustituir sin autorización explícita.
- Shell EVE: fondo gris, superficie blanca, sidebar de marca, topbar sobrio.
- Hoja central: pregunta/ayuda a la izquierda y respuesta/opciones a la derecha.
- Captura compacta por filas, no cards pesadas por pregunta.
- Opciones como chips/radio-cards simples con borde suave y wrap.
- Inputs discretos con foco gris y ring suave.
- Avisos humanos, breves y no técnicos.
- Metadata, rankings, gates, scores, payloads y etiquetas epistemológicas permanecen internas.
- Significado y Runtime deben heredar patrón visual, no acoplarse de forma oculta a `WorkMapIntake`.

## 5. Gaps

- No se encontró fuente opcional `HANDOFF_Bundle_Pantallas_EVE_Login_a_WorkMap`.
- No se encontró fuente opcional `HANDOFF_WorkMap_a_Significado_de_tu_trabajo`.
- No se realizó captura visual porque la tarea no pidió browser QA y es documental.
- Algunos valores responsive de WorkMap requieren confirmación visual; Significado sí declara breakpoints propios.
- La extracción formal a tokens compartidos todavía no existe; este R0 solo documenta contrato.

## 6. Contaminación

Comandos ejecutados para verificación:

```text
git status --short
git diff --name-only
```

Salida `git status --short`:

```text
 M src/app/admin/runtime-vsm/page.tsx
 M src/app/page.tsx
 M src/domain/export.ts
 M src/lib/types.ts
 M src/services/export/activity-collection-xlsx.ts
 M src/services/export/activity-export-template-map.ts
 M src/services/export/session-export-consolidator.ts
 M src/services/export/xlsx-template.ts
?? docs/audits/
?? docs/eve-workmap-ui-contract.md
?? docs/policies/
?? docs/runtime/
?? docs/significado/
?? public/eve-logo.png
?? scripts/extract-docx-text.mjs
?? scripts/extract-docx.ps1
?? src/app/admin/significado-trace/
?? src/app/api/coach/
?? src/app/api/significado/
?? src/app/dev/
?? src/components/EveLogo.tsx
?? src/components/GuideCardBody.tsx
?? src/components/WorkMapIntake.tsx
?? src/components/client/
?? src/components/consultant/
?? src/components/eve-logo.module.css
?? src/components/guide-card-body.module.css
?? src/components/significado/
?? src/components/work-map-intake.module.css
?? src/config/
?? src/domain/primary-activity-selection-policy.ts
?? src/domain/significado-de-trabajo.ts
?? src/domain/start-position-context.ts
?? src/domain/work-map.ts
?? src/features/
?? src/hooks/
?? src/lib/get-first-name-for-greeting.ts
?? src/services/export/significado-export-mappers.ts
?? src/services/operational-description-coach/
?? src/services/primary-activity-selector.ts
?? src/services/significado-activity-anchor-adapter.ts
?? src/services/significado-block0-repository.ts
?? src/services/significado-consultant-trace.ts
?? src/services/significado-draft.ts
?? src/services/work-map-activity-validation.ts
?? src/services/work-map-draft.ts
?? src/services/work-map-flatten.ts
?? src/services/work-map-operational-readiness.ts
?? src/services/work-map-responsibility-validation.ts
?? src/services/work-map-save-validation.ts
?? tests/regression/activity-boundary-confirmation.test.ts
?? tests/regression/operational-description-canon.test.ts
?? tests/regression/operational-description-coach-llm.test.ts
?? tests/regression/operational-description-coach-trace.test.ts
?? tests/regression/operational-description-coach.test.ts
?? tests/regression/operational-description-intro-example.test.ts
?? tests/regression/operational-description-intro-guide.test.ts
?? tests/regression/operational-description-path-progress.test.ts
?? tests/regression/primary-activity-selection-policy.test.ts
?? tests/regression/significado-activity-anchor-adapter.test.ts
?? tests/regression/significado-consultant-trace.test.ts
?? tests/regression/significado-de-trabajo-slice.test.ts
?? tests/regression/significado-export-mappers.test.ts
?? tests/regression/significado-flow-wiring.test.ts
?? tests/regression/significado-mba-alignment.test.ts
?? tests/regression/work-map-operational-readiness.test.ts
?? tests/regression/work-map-save-validation.test.ts
?? tests/regression/workmap-h12-page-wiring.test.ts
?? tmp-cerebro-ai.zip
?? tmp-cerebro-ai/
```

Salida `git diff --name-only`:

```text
external-consumers/eve-platform/src/app/admin/runtime-vsm/page.tsx
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/domain/export.ts
external-consumers/eve-platform/src/lib/types.ts
external-consumers/eve-platform/src/services/export/activity-collection-xlsx.ts
external-consumers/eve-platform/src/services/export/activity-export-template-map.ts
external-consumers/eve-platform/src/services/export/session-export-consolidator.ts
external-consumers/eve-platform/src/services/export/xlsx-template.ts
```

Archivos creados por esta tarea:

- Creados: `docs/eve-workmap-ui-contract.md`
- Creados: `docs/audits/CLOSEOUT_EVE_WORKMAP_UI_CONTRACT_R0.md`

El working tree ya contenía cambios y archivos untracked previos a esta tarea. Esta tarea solo agrega los dos documentos permitidos. `git diff --name-only` no lista los documentos nuevos porque son untracked.

## 7. Recomendación

**A. Pasar a Runtime Block0 Catalog Adapter R0**

El contrato visual R0 queda listo para que las siguientes pantallas hereden la familia visual WorkMap sin tocar WorkMap H12 ni exponer cableado interno al usuario.
