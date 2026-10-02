# CLOSEOUT — CONTROLLED-E2E-DEMO-LOGIN-BUTTON-FIX-V1

## 1. Dictamen

**CONTROLLED_E2E_DEMO_LOGIN_FIXED**

El botón **Demo controlada** en `/dev/e2e-block0` avanza inmediatamente a Estado A (`Comienza tu levantamiento`) sin Supabase, email ni password. Verificación manual en host completada.

## 2. Causa raíz

Dos factores combinados bloqueaban la experiencia percibida:

1. **Acoplamiento a `ClientAuthScreen` productivo** — el botón demo compartía la misma superficie que login real. Aunque en código solo dependía de `sessionCreating`, la pantalla mezclaba inputs editables de email/password con el flujo demo y podía confundir o quedar afectada por hidratación SSR del árbol compartido.

2. **Hidratación SSR en fase login** — la página montaba estado interactivo (incluido `createEmptyWorkMap()` con IDs `Date.now()`) durante SSR. Eso generaba mismatch de hidratación en dev y, en algunos casos, impedía que React reconciliara correctamente el click hasta recargar — sensación de “botón que no responde”.

No había un `<form>` envolviendo el botón ni un `preventDefault` externo bloqueando el handler; el handler `enterDemo` existía pero la UX fallaba por la combinación anterior.

## 3. Cambios realizados

### `src/app/dev/e2e-block0/page.tsx`
- Reemplazado `ClientAuthScreen` por **`E2eBlock0DemoLoginPanel`** dedicado a la demo.
- Botón **Demo controlada**:
  - `type="button"`
  - siempre habilitado (sin depender de Supabase)
  - `onClick` con `preventDefault` / `stopPropagation`
  - `data-e2e-demo-login-button="true"`
- Email/password visibles pero **disabled/readOnly** (decorativos, no requeridos).
- **Iniciar sesión** y **Crear cuenta** permanecen disabled.
- Gate **`isClientReady`**: la UI interactiva solo monta tras `useEffect` en cliente (evita mismatch SSR).
- `workMap` se inicializa al entrar a WorkMap (no en login), evitando IDs volátiles en fase login.
- `enterDemo` usa `advanceE2eDemoToEstadoA()`.

### `src/features/dev/e2e-block0-demo-state.ts`
- `E2E_BLOCK0_DEMO_LOGIN_COPY` — copy canónico del login demo.
- `advanceE2eDemoToEstadoA()` — transición pura login → `estado_a`.
- `isE2eDemoLoginPhase()` — helper de fase.

### `tests/regression/e2e-block0-demo-contract.test.ts`
- Valida panel demo dedicado, botón habilitado, transición a `estado_a`, sin Supabase/API.

## 4. Verificación host

**URL:** http://localhost:3000/dev/e2e-block0

**Pasos ejecutados manualmente:**

| Paso | Resultado |
|---|---|
| Abrir ruta | Pantalla “Acceso a la plataforma” con botón Demo controlada habilitado |
| Click **Demo controlada** | Login desaparece; aparece **Comienza tu levantamiento** / Hola, Usuario Demo |
| Click **Empezar levantamiento** | Avanza a WorkMap (“Construye el mapa de tu trabajo”) |
| Consola | Sin overlay de error de hidratación tras el fix; solo HMR dev normal |

## 5. Tests con exit codes

| Suite | Resultado |
|---|---|
| `e2e-block0-demo-contract.test.ts` | **pass 11/11**, exit 0 |
| `workmap-to-block0-prefill.test.ts` | **pass 15/15**, exit 0 |
| `significado-de-trabajo-slice.test.ts` | **pass 20/20**, exit 0 |
| `primary-activity-selection-policy.test.ts` | **pass 10/10**, exit 0 |

## 6. Git status / diff

No ejecutado en este entorno (repositorio con restricciones de ownership / no git en sandbox).

Archivos tocados:
- `src/app/dev/e2e-block0/page.tsx`
- `src/features/dev/e2e-block0-demo-state.ts`
- `tests/regression/e2e-block0-demo-contract.test.ts`
- `docs/audits/CLOSEOUT_CONTROLLED_E2E_DEMO_LOGIN_BUTTON_FIX_V1.md`

## 7. Recomendación

**A. Repetir demo E2E completa desde Login hasta Significado Block0**

El login demo ya desbloquea el recorrido. Siguiente paso natural: validar WorkMap → Significado → prefill B0-Q01 → gate 4/4 en la misma ruta `/dev/e2e-block0`.

FIN — CONTROLLED-E2E-DEMO-LOGIN-BUTTON-FIX-V1
