# CLOSEOUT — WORKMAP-TO-BLOCK0-PREFILL-CONTRACT-VERIFY-V1

## 1. Dictamen

**WORKMAP_BLOCK0_CONTRACT_MATCHES_WITH_GAPS**

El contrato operativo **negativo** está implementado: WorkMap **no cierra** Bloque 0 ni convierte inferencia en evidencia capturada sin acción del usuario. El contrato operativo **positivo** (prefill/inferencia productiva WorkMap → Bloque 0) **no está cableado en el flujo principal**; solo existe como fixture manual en `/dev/significado` y como infraestructura epistemológica lista para recibir `initialVisualDraft`.

---

## 2. Clasificación de prefill productivo

| Ámbito | Clasificación | Evidencia |
|---|---|---|
| Flujo principal (`page.tsx` → `intake_significado`) | **PREFILL_NOT_IMPLEMENTED** | `SignificadoDeTuTrabajo` se monta sin `initialVisualDraft`; `visualDraft` arranca en `createEmptyBlock0Answers()`. |
| Ruta dev (`/dev/significado`) | **PREFILL_DEV_ONLY** | `DEV_VISUAL_DRAFT` es un objeto estático en `src/app/dev/significado/page.tsx`, anotado a mano con comentarios epistemológicos; no lo genera un parser de WorkMap. |
| Hidratación desde WorkMap | **PREFILL_NOT_IMPLEMENTED** | `hydrateDraftFromWorkMap()` es no-op (`void workMap;` devuelve draft sin cambios). |
| Motor semántico WorkMap → B0-Q01 | **PREFILL_NOT_IMPLEMENTED** | No existe función que descomponga `verbo + objeto + procedimiento + salida` desde el texto de actividad. |
| **Clasificación global de la tarea** | **PREFILL_DEV_ONLY** | Hay UI/contrato epistemológico y fixture dev; no hay prefill automático en producción. |

---

## 3. Flujo real verificado

### 3.1 Producción

```
WorkMapIntake
  → continueFromWorkMapToSignificado(draft)
      → selectPrimaryActivitiesFromWorkMap(draft)
      → setWorkMap(draft)
      → setPrimaryActivitySelectionResult(selectionResult)
      → setFlowState("intake_significado")
  → SignificadoDeTuTrabajo
      props: workMap, primaryActivitySelectionResult, sessionId
      props ausentes: initialVisualDraft
  → visualDraft = createEmptyBlock0Answers() (+ spread de initialVisualDraft undefined)
  → block0Answers en submit = lo que el usuario escribió/confirmó en pantalla
```

**Archivos inspeccionados:**

- `src/app/page.tsx` — `continueFromWorkMapToSignificado` (L1236–1254); montaje de Significado sin `initialVisualDraft` (L1687–1696).
- `src/components/significado/SignificadoDeTuTrabajo.tsx` — estado `visualDraft` desde `createEmptyBlock0Answers()` + `initialVisualDraft` opcional (L796–807).
- `src/features/significado/significado-draft-state.ts` — `hydrateDraftFromWorkMap` no deriva Block 0 (L235–245).

### 3.2 Dev

```
/dev/significado/page.tsx
  → createSignificadoBlock0DevWorkMap()  (WorkMap fixture)
  → DEV_VISUAL_DRAFT                      (Block 0 prefilled manualmente)
  → SignificadoDeTuTrabajo(initialVisualDraft={DEV_VISUAL_DRAFT}, ...)
```

El texto de actividad Oracle y los subcampos B0-Q01/B0-Q03 del fixture **coinciden semánticamente**, pero la correspondencia fue **redactada a mano** en `DEV_VISUAL_DRAFT`, no calculada en runtime desde `workMap.responsibilities[].activities[].text`.

### 3.3 Qué sí llega desde WorkMap en producción

| Dato | Destino | ¿Prefill Block 0? |
|---|---|---|
| Snapshot `workMap` completo | Payload submit / trazabilidad | No en campos visibles |
| `primaryActivitySelectionResult` | Actividad primaria interna (governance EVE) | No |
| `currentActivity.title` (texto de actividad seleccionada) | Banner «Actividad N de M» + `activityTitle` del coach B0-Q02 | Solo contexto de coach; no escribe B0-Q01 |
| `declaredContext` (área, responsabilidad) | `extractTraceableWorkMapActivities` → payload con `area_status: declared_unconfirmed` | No en B0-Q03 |

---

## 4. Mapeo WorkMap → B0-Q01

### 4.1 Contrato esperado

La fórmula WorkMap (verbo operativo + objeto/insumo + procedimiento/regla + producto/salida) debería alimentar:

| Subcampo B0-Q01 | Clave |
|---|---|
| qué haces | `B0-Q01.action_verb` |
| sobre qué trabajas | `B0-Q01.input_or_object` |
| cómo o bajo qué regla | `B0-Q01.procedure_or_standard` |
| qué queda listo | `B0-Q01.output_or_result` |

### 4.2 Estado real

| Aspecto | Estado |
|---|---|
| Parser semántico desde texto de actividad | **No implementado** |
| Prefill en producción | **No** — usuario completa los cuatro subcampos |
| Metadatos epistemológicos en catálogo | **Sí** — subcampos B0-Q01 marcados `inferred_from_workmap` en `runtime-block0-canonical.ts` cuando tengan valor |
| Estilo visual de prefill | **Sí** — `prefilledInput` si hay valor + `epistemicState` inferido/contextual |
| Fixture dev | **Sí** — valores manuales que ilustran el mapeo deseado |

### 4.3 Estados epistemológicos internos (submit)

Implementados en `src/services/runtime-block0-response-model.ts` y cubiertos por tests (12/12 pass):

| Escenario | `epistemicStatus` resultante |
|---|---|
| Valor prellenado sin cambios al Continuar (`confirmPrefillsOnSubmit: true`) | `user_confirmed_suggestion` |
| Valor prellenado modificado | `user_corrected_evidence` |
| Campo vacío, usuario escribe | `captured_user_evidence` |
| Prefill no confirmado (`confirmPrefillsOnSubmit: false`) | Conserva `inferred_from_workmap` / `context_from_workmap` — **nunca** `captured_user_evidence` |

En producción, al no haber `initialVisualDraft`, los campos completados por el usuario salen como `captured_user_evidence` (comportamiento correcto: no hay sugerencia previa que confirmar).

**Regla respetada:** nunca `captured_user_evidence` para un valor que solo existía como inferencia WorkMap sin pasar por confirmación explícita en submit.

---

## 5. Responsabilidad / área / rol

| Fuente WorkMap | Uso actual | Clasificación |
|---|---|---|
| `selectedAreas` / `customAreas` | `buildDeclaredAreaContext` → `declared_area_context` en trazabilidad | **context_only** (`area_status: declared_unconfirmed`) |
| `responsibility.text` | `declared_responsibility_context` en trazabilidad | **context_only** (`responsibility_status: declared_unconfirmed`) |
| Rol en B0-Q03 (`primary_actor_scope`) | Solo prellenado en fixture dev como sugerencia contextual | **context_from_workmap** en metadata; no en producción |

No se encontró código que promueva área/responsabilidad/rol a evidencia factual cerrada sin confirmación del usuario. En dev, `B0-Q03.typical_context` y `B0-Q03.primary_actor_scope` están documentados como `context_from_workmap`.

---

## 6. Frecuencia y variación (B0-Q03)

| Campo | ¿Se infiere desde WorkMap en producción? | Estado |
|---|---|---|
| `B0-Q03.frequency_base` | **No** | Metadata permite `inferred_from_workmap` solo si hay valor explícito en fuente; sin parser, queda vacío |
| `B0-Q03.typical_context` | **No** en producción | Fixture dev: valor manual contextual |
| `B0-Q03.primary_actor_scope` | **No** en producción | Fixture dev: ejemplo de rol, no evidencia |
| Variación / excepción (C01) | **No se inventa** | No aparece como subcampo renderizado en catálogo Block 0 actual |

**B0-Q03 prellenado en dev:** proviene de **`DEV_VISUAL_DRAFT` manual** en `src/app/dev/significado/page.tsx` (L22–27), no de lectura automática del objeto `workMap` en runtime. El comentario «explícito en actividad (proyección mensual)» documenta la intención del fixture, no un motor de extracción.

---

## 7. B0-Q04 inicio/cierre

| Requisito contrato | Estado |
|---|---|
| Sugerencias desde B0-Q02 | **Implementado** — `inferActivityBoundaryReview` + `enhanceSignificadoActivityBoundaryReview` |
| Salida WorkMap solo como tentativa | **Parcial** — no hay prefill directo desde texto WorkMap a B0-Q04; la tentativa sale de B0-Q02 una vez escrita |
| Requiere confirmación/corrección por sección | **Implementado** — `ActivityBoundaryConfirmationPanel` (Inicio / Cierre) |
| No habilita Continue sin 4/4 | **Implementado** — `canContinue` exige `isBlock0ReviewComplete` (L820–823) |
| `epistemicState` B0-Q04 | `requires_confirmation` en catálogo |
| Claves internas | `B0-Q04.input_transduction`, `B0-Q04.output_transduction`, statuses, `B0-Q04.boundary_source_draft` |

Si B0-Q02 está vacío, B0-Q04 muestra espera; no se cierra solo.

---

## 8. Verificación UI — términos prohibidos

Regresión `significado-de-trabajo-slice.test.ts` (19/19 pass) verifica que el componente **no renderiza**:

- `inferred_from_workmap`, `context_from_workmap`, `captured_user_evidence` (en copy visible)
- `SIGNIFICADO_PREFILL_BADGE`, badges epistemológicos, chips de contexto
- `runtime`, `payload`, `bundle`, `MMABP`, `VSM`, `transducción`, etc.

Los metadatos epistemológicos viven en `runtime-block0-canonical.ts` y en el bundle in-memory al submit; **no se exponen al usuario**. El estilo `prefilledInput` solo aparece si el campo tiene valor (en dev con fixture; en producción solo si el usuario escribe).

Alineado con `docs/significado/SIGNIFICADO_UI_OPERATIONAL_FREEZE_V1.md` §6: sin badges `inferred_from_workmap` visibles.

---

## 9. Matriz resumen contrato

| Pieza | ¿Viene de WorkMap en prod? | ¿Viene de B0-Q02? | ¿Contexto only? | ¿Requiere confirmación? | ¿Nunca inferir? |
|---|---|---|---|---|---|
| B0-Q01 subcampos | No (vacío) | No | No | Sí (completitud 4 subcampos) | N/A sin parser |
| B0-Q02 descripción operativa | No (coach usa `activityTitle`) | Usuario escribe | `activityTitle` es contexto | Sí (coach + completitud) | — |
| B0-Q03 frecuencia | No | No | — | Sí si prellenado | **Sí** — solo si explícita en fuente |
| B0-Q03 contexto/actor | No en prod | No | Sí en diseño (`context_from_workmap`) | Sí | No inventar variación |
| B0-Q04 inicio/cierre | No directo | Sí (inferencia tentativa) | — | **Sí** por sección | No cerrar sin revisión |
| Área / responsabilidad | Trazabilidad payload | No | **Sí** (`declared_unconfirmed`) | No promovidos a evidencia | — |
| Continue / cierre Block 0 | No auto-cierra | — | — | **4/4 + mapa guardado** | WorkMap no cierra B0 |

---

## 10. Tests ejecutados

| Suite | Exit code | Resultado |
|---|---:|---|
| `significado-de-trabajo-slice.test.ts` | **0** | 19/19 pass |
| `runtime-block0-catalog-adapter.test.ts` | **0** | 9/9 pass |
| `primary-activity-selection-policy.test.ts` | **0** | 10/10 pass |
| `runtime-block0-response-model.test.ts` | **0** | 12/12 pass |
| `significado-flow-wiring.test.ts` | **1** | 5/7 pass — fallos ambientales/preexistentes (`git diff` sin repo; `intake_significado` en tipos globales) |

Las aserciones funcionales relevantes al contrato epistemológico y al slice Block 0 **pasan**.

---

## 11. Riesgos

1. **Expectativa UX vs realidad:** El freeze V0.6 y comentarios dev pueden sugerir prefill WorkMap activo; en producción el usuario enfrenta Block 0 vacío salvo el título en banner.
2. **Doble fuente de verdad:** `activityTitle` en coach puede divergir de B0-Q01 hasta que el usuario complete o exista parser.
3. **Infra sin cablear:** `initialVisualDraft`, metadatos epistemológicos y response model R1 están listos, pero `hydrateDraftFromWorkMap` y `page.tsx` no los alimentan — riesgo de implementación parcial si se asume «ya hecho».
4. **Frecuencia:** Sin guardrail de parser, cualquier futuro prefill debe respetar «solo si explícita»; hoy el riesgo es bajo porque no hay prefill.
5. **Gate 4/4:** Correcto para no cerrar sin revisión; en producción el usuario debe llenar todo manualmente (más carga que el diseño asistido).

---

## 12. Recomendación

### **B. Implementar/ajustar prefill WorkMap → B0 antes de Bloque 0.5**

**Justificación:**

- El lado **prohibición** del contrato (no cerrar sin confirmación; no `captured_user_evidence` sin confirmación; B0-Q04 por sección; gate 4/4) está sólido.
- El lado **capacidad** del contrato («WorkMap puede prellenar o inferir Bloque 0») **no está en producción**.
- `SIGNIFICADO_UI_OPERATIONAL_FREEZE_V1.md` §5 lista explícitamente: *«Prefill automático WorkMap → Block0 en producción — NO — pendiente»* y §7 item 2: *«Motor de prefill semántico WorkMap → initialVisualDraft en producción»*.

**Alcance sugerido (fuera de esta tarea):**

1. Implementar builder `WorkMap activity text → Partial<SignificadoVisualDraft>` (B0-Q01; B0-Q03 frecuencia solo si explícita; contexto/actor como `context_from_workmap`).
2. Pasar `initialVisualDraft` desde `page.tsx` al montar Significado (o hidratar en `hydrateDraftFromWorkMap` / efecto controlado).
3. Mantener confirmación epistemológica vía `buildRuntimeBlock0ResponseBundle` existente.
4. No tocar gate 4/4 ni exponer metadata interna en UI.

**No recomendado ahora:**

- **A (aprobar y pasar a 0.5 sin prefill):** dejaría incumplido el contrato positivo y la carga cognitiva prevista.
- **C (detener):** el slice Block 0 es funcional y auditable; los gaps son de integración WorkMap, no de bloqueo crítico de seguridad epistemológica.

---

## 13. Archivos inspeccionados (solo lectura)

| Archivo | Rol en verificación |
|---|---|
| `src/components/WorkMapIntake.tsx` | Origen de datos WorkMap (no modificado) |
| `src/app/page.tsx` | Flujo producción sin `initialVisualDraft` |
| `src/app/dev/significado/page.tsx` | Fixture `DEV_VISUAL_DRAFT` |
| `src/domain/work-map.ts` | Modelo actividad (`getActivityText`) |
| `src/services/work-map-flatten.ts` | Contexto declarado `declared_unconfirmed` |
| `src/services/significado-activity-anchor-adapter.ts` | Trazabilidad área/responsabilidad |
| `src/features/significado/runtime-block0-canonical.ts` | Metadatos epistemológicos por pregunta/subcampo |
| `src/features/significado/significado-draft-state.ts` | `hydrateDraftFromWorkMap` no-op |
| `src/services/significado-draft.ts` | Draft legacy anchor |
| `src/domain/significado-de-trabajo.ts` | Tipos payload / block0Answers |
| `src/domain/runtime-block0-response.ts` | Estados epistémicos formales |
| `src/services/runtime-block0-response-model.ts` | Reglas confirmación vs captura |
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | Estado visual, gate, submit bundle |
| `docs/significado/SIGNIFICADO_UI_OPERATIONAL_FREEZE_V1.md` | Freeze: prefill prod pendiente |
| `docs/audits/CLOSEOUT_RUNTIME_BLOCK0_HOST_REVIEW_AND_ADJUST_V1_1.md` | Gate 4/4 y B0-Q04 |
| `docs/audits/CLOSEOUT_RUNTIME_BLOCK0_RESPONSE_MODEL_R1.md` | Modelo epistemológico R1 |

**Archivo creado por esta tarea:** `docs/audits/CLOSEOUT_WORKMAP_TO_BLOCK0_PREFILL_CONTRACT_VERIFY_V1.md`

**Sin cambios de código, APIs, Supabase, Runtime engine, WorkMap ni `page.tsx`.**

---

FIN — WORKMAP-TO-BLOCK0-PREFILL-CONTRACT-VERIFY-V1
