# Dictamen — Corrección regresión Unit 4A → Unit 3B

Fecha: 2026-07-15  
Alcance: desacoplar estructura del caso vs progreso H0–H6  
KPI visual: **no activado**  
Staging/producción: **sin cambios**  
Unidad 5: **no iniciada**

## Veredicto

**Unit 3B recuperada.** Unit 4A permanece aceptable con KPI degradable.  
Amber muestra vacío factual (no error estructural). KPI core sigue en **—**.

## Causa exacta del acoplamiento

En `buildCaseProcessStructureResponse`, el BFF invocaba **primero** `calculateCoreMilestoneProgress`.  
Si la RPC fallaba, la excepción subía al `try/catch` del route y respondía:

`No fue posible abrir la estructura del caso.`

Eso colapsaba Unit 3B aunque `mainProcess`/`milestones` fueran legibles.

## Archivo corregido (principal)

`src/services/eve/official-control-panel/official-control-panel-process-structure-service.ts`

- carga estructura primero;
- KPI en `try/catch` degradable;
- `logSanitizedCoreProgressFailure` / `sanitizeCoreProgressErrorCode`.

Adjunto E2E (captura):

`tests/e2e/helpers/authenticate-local-consultant.ts` — `headerValue("authorization")`  
(Playwright redacta `Authorization` en `request.headers()`).

## Fallback

`unavailableCoreMilestoneProgress()` → `{ achieved: 0, total: 0, status: "unavailable" }`  
No inventa `0 de 7`. No usa `null`.

## RPC

Sin cambio semántico: ausencia factual → `unavailable`/`partial`; no excepción por vacío.  
Fallo técnico de RPC → BFF degrada a `unavailable` y conserva estructura.

## Pruebas

- Unit 3A / 3B / 4 / 4A: pass (incluye casos RPC fallando)
- Playwright Amber: pass
- TypeScript / ESLint (archivos tocados): ok
- Legacy freeze: fallo preexistente (`question-catalog-v2-1.json`), no introducido aquí

## Captura

`reports/local/unit4/screenshots/02-amber-structure-recovered.png`

Muestra Amber activa, proceso no disponible, rail vacío factual, sin error estructural, KPI **—**.

## Confirmaciones

- Unit 3B recuperada  
- Unit 4A aceptable con extensión degradable  
- Cero staging / producción / Unit 5  
- KPI visual no activado  
