# CLOSEOUT · Significado WorkMap Row Layout V0.9

## 1. Dictamen

**SIGNIFICADO_WORKMAP_ROW_LAYOUT_V0_9_IMPLEMENTED**

La hoja central de Significado adopta el patrón visual de WorkMap: pregunta a la izquierda, respuesta a la derecha. Las etiquetas epistemológicas visibles (Prellenado, Requiere confirmación, Obligatoria, Opcional) se retiraron de la UI. La metadata interna (`helpTextKind`, `canonicalHelpStatus`, `epistemicState`, `sourceRuntimeInteractionId`) se preserva sin exponerse al usuario.

## 2. Archivos tocados (solo paths permitidos)

| Archivo | Cambio |
|---|---|
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | Layout fila WorkMap; secciones con separadores; eliminación de badges visibles; agrupación `BLOCK0_WORKSHEET_SECTIONS` |
| `src/components/significado/significado-de-tu-trabajo.module.css` | Grid dos columnas (260–300px / flexible); borde vertical entre prompt y respuesta; apilado mobile; limpieza de estilos de badges |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Aserciones V0.9: grid WorkMap, secciones, sin badges visibles, metadata interna en runtime |
| `tests/regression/significado-mba-alignment.test.ts` | `ALLOWED_DIFFS` + aserciones de layout sin badges |
| `docs/audits/CLOSEOUT_SIGNIFICADO_WORKMAP_ROW_LAYOUT_V0_9.md` | Este documento |

## 3. Confirmación de layout pregunta izquierda / respuesta derecha

- [x] Desktop: `grid-template-columns: minmax(260px, 300px) minmax(0, 1fr)` en `.questionRow`
- [x] Columna izquierda (`.questionPrompt`): número `[N]`, texto de pregunta, help text, ayuda suplementaria
- [x] Columna derecha (`.questionAnswer`): inputs, textareas, subcampos compuestos, opciones radio-card
- [x] Borde derecho en prompt (estilo WorkMap `sectionCell`)
- [x] Mobile (`max-width: 640px`): apilado pregunta arriba, respuesta abajo
- [x] Secciones full-width: «Actividad y descripción», «Frecuencia, contexto y actor», «Inicio y cierre»
- [x] B0-Q01 compuesto: subcampos en columna derecha con etiquetas locales

## 4. Confirmación: sin etiquetas epistemológicas visibles

Retirado de la UI (no renderizado):

- Prellenado desde WorkMap
- Requiere confirmación
- Obligatoria / Opcional
- Sugerencia desde el contexto (hint contextual)
- Badges `prefillBadge`, `confirmationBadge`, `requiredBadge`, `optionalBadge`

Mantenido sin mostrar al usuario:

- `data-help-kind` en ayuda (atributo DOM, no texto visible)
- `resolveFieldInputClass` + `prefilledInput` (estilo sutil en campos prellenados, sin etiqueta)
- `SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE` (aviso de confirmación al continuar, no badge por pregunta)

## 5. Confirmación: metadata interna preservada

| Campo / mecanismo | Estado |
|---|---|
| `helpTextKind` | Preservado; pasado a `QuestionRow` y expuesto como `data-help-kind` |
| `canonicalHelpStatus` | Preservado en `runtime-block0-canonical.ts` (no tocado) |
| `technicalLabel` | Preservado en runtime (no visible en UI) |
| `sourceRuntimeInteractionId` | Preservado en runtime |
| `epistemicState` | Preservado; usado en `resolveFieldInputClass` para estilo de prefill |
| `showPrefillBadge` / `showRequiresConfirmationBadge` | Preservados en runtime; ya no condicionan UI |

## 6. Qué NO se tocó

- WorkMap (`WorkMapIntake.tsx`, `work-map-*`)
- `src/app/page.tsx`
- APIs, Supabase, Runtime engine, SQL, middleware
- `package.json`, `package-lock.json`
- Metodología, SelectionPolicy, contratos de submit

## 7. Tests

| Comando | Exit code | Resultado |
|---|---:|---|
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | **0** | 16/16 pass |
| `node --test tests/regression/significado-mba-alignment.test.ts` | **0** | 4/4 pass |
| `node --test tests/regression/significado-flow-wiring.test.ts` | **0** | 7/7 pass |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | **0** | 10/10 pass |

## 8. Verificación git

**Comando:** `git -c safe.directory="*" status --short` y `git diff --name-only` (repo padre)

**Tracked diff (pre-existente, no modificado por V0.9):**

```text
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

**Archivos V0.9 (working tree / untracked en repo padre):**

```text
src/components/significado/SignificadoDeTuTrabajo.tsx
src/components/significado/significado-de-tu-trabajo.module.css
tests/regression/significado-de-trabajo-slice.test.ts
tests/regression/significado-mba-alignment.test.ts
docs/audits/CLOSEOUT_SIGNIFICADO_WORKMAP_ROW_LAYOUT_V0_9.md
```

**Confirmación:** ningún path prohibido aparece en el diff de esta tarea.

## 9. Prueba manual `/dev/significado`

- **URL:** `http://localhost:3000/dev/significado`
- **Esperado:** hoja central con filas WorkMap; pregunta izquierda / respuesta derecha; secciones con separadores; sin badges epistemológicos; ayudas bajo la pregunta en columna izquierda.

## 10. Recomendación A/B/C

| Opción | Descripción | Recomendación |
|---|---|---|
| **A** | Integrar slice Significado al flujo principal con este layout | **Recomendada** — layout alineado con WorkMap reduce carga cognitiva y unifica experiencia de captura |
| **B** | Mantener en `/dev/significado` hasta validación visual con usuarios reales | Válida si se requiere UAT antes de merge |
| **C** | Revertir a badges epistemológicos visibles | No recomendada — contradice regla V0.9 y aumenta ruido visual |

**Dictamen:** **A** — el layout WorkMap row está listo para integración; metadata interna intacta; tests en verde; alcance UI cumplido sin tocar runtime ni metodología.
