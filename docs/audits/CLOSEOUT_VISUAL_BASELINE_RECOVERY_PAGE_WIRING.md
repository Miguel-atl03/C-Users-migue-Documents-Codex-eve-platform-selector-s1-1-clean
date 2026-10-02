# CLOSEOUT · Visual Baseline Recovery Page Wiring

## 1. Dictamen ejecutivo

**VISUAL_BASELINE_RECOVERED_WITH_DEVIATIONS**

El front-door aprobado quedó cableado en `src/app/page.tsx` preservando R2.3 (WorkMap → Significado → questionnaire_main). La validación manual en host local confirma `ClientAuthScreen` y preview Estado B con `ActiveAssessmentState`. No se pudo recorrer el flujo completo con auth/demo por Supabase no disponible en el entorno (`MANUAL_AUTH_LIMITED`).

## 2. Cambios aplicados

| Archivo | Cambio | Motivo |
|---|---|---|
| `src/app/page.tsx` | Imports de componentes client aprobados (`ClientAuthScreen`, `ClientShell`, `EmptyAssessmentState`, `ActiveAssessmentState`, `ClientAssessmentComplete`, `ClientTopbar`) y helpers de start-position/work-map draft | Recuperar baseline visual del repo original |
| `src/app/page.tsx` | Estados y handlers front-door: `authMode`, `authDisplayName`, `registeredUserNombre`, `startPositionContext`, `runWorkMapIntroTutorial`, refs de restore, `displayName`, `handleStartAssessment`, `handleContinueLevantamiento`, `handleStartPositionContextChange` | Maquinaria de Login / Estado A / restore aprobada |
| `src/app/page.tsx` | Render por `viewState` con componentes aprobados; eliminación de bloques inline viejos | Sustituir UI parcial por bundle visual congelado |
| `src/app/page.tsx` | `capture_workspace` en `ClientShell`; WorkMap con props aprobadas; `onContinue={continueFromWorkMapToSignificado}` | Mantener H12 + puente R2.3 a Significado |
| `src/app/page.tsx` | Conservación de `intake_significado`, `submitSignificadoIntake`, `runPostWorkMapQuestionnairePipeline`, `selectPrimaryActivitiesFromWorkMap` | No perder wiring R2.3 |
| `docs/audits/CLOSEOUT_VISUAL_BASELINE_RECOVERY_PAGE_WIRING.md` | Closeout de auditoría | Entregable obligatorio de la tarea |

## 3. Baseline visual recuperado

- [x] `ClientAuthScreen` usado en `access_screen`.
- [x] `EmptyAssessmentState` usado en `create_session` (fuente del componente contiene “Comienza tu levantamiento”).
- [x] `ClientShell` usado como shell principal.
- [x] WorkMap sigue en `ClientShell` con variant `landing`.
- [x] Significado sigue después de WorkMap (`flowState === "intake_significado"`).
- [x] R2.3 SelectionPolicy preservada.

## 4. Reglas protegidas

- [x] No se tocó `WorkMapIntake`.
- [x] No se tocaron componentes `client/**`.
- [x] No se tocó Significado visual (`src/components/significado/**`).
- [x] No se tocaron APIs / Supabase / Runtime / package files.
- [x] No se eliminó `intake_significado`.
- [x] No se eliminó `selectPrimaryActivitiesFromWorkMap`.
- [x] `onContinue` de WorkMap va a `continueFromWorkMapToSignificado`.

## 5. Tests

| Comando | Exit code | Resultado |
|---|---|---|
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | 0 | PASS (10/10) |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | PASS (7/7) — requiere `GIT_CONFIG safe.directory` en este entorno |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 0 | PASS (4/4) — requiere `GIT_CONFIG safe.directory` en este entorno |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 0 | PASS (6/6) — requiere `GIT_CONFIG safe.directory` en este entorno |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | PASS (12/12) |

Nota: la primera corrida sin `safe.directory` devolvió exit code 1 en tests con `git diff` por ownership dudoso del repo; re-ejecución con `GIT_CONFIG_COUNT/KEY/VALUE` resolvió a 0.

## 6. Host local / prueba manual

- **URL probada:** `http://localhost:3000/` y `http://localhost:3000/?preview=estado-b`
- **Pantalla inicial:** `ClientAuthScreen` con heading “Acceso a la plataforma”, campos Email/Password, botones Iniciar sesión / Crear cuenta / Demo controlada. Ya no aparece el bloque inline “Bienvenidos a EVE™ - Strategic & Operational Architecture”.
- **“Comienza tu levantamiento”:** confirmado en fuente de `EmptyAssessmentState`; no alcanzable en runtime por `MANUAL_AUTH_LIMITED` (Supabase ausente, botones auth/demo deshabilitados o sin bootstrap).
- **WorkMap:** título “Construye el mapa de tu trabajo” permanece en `WorkMapIntake` (no modificado); wiring en `page.tsx` intacto.
- **Significado conectado:** confirmado por tests de wiring y presencia de `SignificadoDeTuTrabajo` + `primaryActivitySelectionResult` en `page.tsx`.
- **Limitación auth:** `MANUAL_AUTH_LIMITED` — mensaje “El acceso no esta disponible en este entorno.”; no fue posible validar Estado A ni WorkMap en runtime sin sesión.
- **Preview Estado B:** `ActiveAssessmentState` renderiza “Continúa tu levantamiento” correctamente.
- **Observación:** overlay de hydration error visible en dev tools al interactuar; no bloquea la verificación visual del login recuperado.

## 7. git diff --name-only

Salida de diff trackeado relevante a esta tarea (repo padre):

```
external-consumers/eve-platform/src/app/page.tsx
```

`src/lib/types.ts` aparece modificado en el working tree del sandbox previo a esta tarea; no fue editado en este closeout.

Archivos permitidos tocados en esta tarea:

- `src/app/page.tsx`
- `docs/audits/CLOSEOUT_VISUAL_BASELINE_RECOVERY_PAGE_WIRING.md`

Sin contaminación de paths prohibidos por esta tarea.

## 8. Riesgos restantes

- UI visual de Significado todavía pendiente de pass dedicado.
- Login puede conservar Demo controlada vía `ClientAuthScreen`; no se intervino en el componente.
- `tsc --noEmit` falla por errores preexistentes fuera de `page.tsx` (`domain/work-map.ts`, tests con `.ts` imports, `work-map-operational-readiness.ts`); `page.tsx` quedó sin error TS tras corrección de `restoring={false}` en rama fallback.
- No branch / no commit en esta tarea.
- `primaryActivitySelectionResult` sigue in-memory hasta persistencia posterior.
- Validación manual completa del flujo requiere Supabase operativo.

## 9. Recomendación

**A. Pasar a R2.3-SIGNIFICADO-VISUAL-UI-PASS**

El cableado visual del front-door ya está recuperado sin romper la política de selección ni el puente WorkMap → Significado. El siguiente paso natural es el pass visual de Significado, no más ajustes de front-door salvo habilitar Supabase para QA end-to-end.
