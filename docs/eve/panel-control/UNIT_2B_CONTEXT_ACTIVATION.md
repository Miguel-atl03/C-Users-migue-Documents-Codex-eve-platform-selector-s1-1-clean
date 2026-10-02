# Unidad 2B — Activación visual del contexto operativo

## Alcance

Unidad 2B conecta el shell oficial con la jerarquía persistente de Unidad 2A:

`Empresa cliente → Relación activa → Caso en curso`

No agrega KPIs calculados, procesos, hitos, usuarios, roles funcionales,
actividades, alertas, Runtime ni Gobernanza de Experiencia.

## Endpoints reutilizados

- `GET /api/eve/official-consultant-control-panel/client-companies`
- `GET /api/eve/official-consultant-control-panel/client-companies/:companyId/relationships`
- `GET /api/eve/official-consultant-control-panel/relationships/:relationshipId/cases`

El navegador obtiene el access token de la sesión Supabase existente y lo envía
como bearer. Los componentes no consultan tablas Supabase. Los endpoints
mantienen RLS, autorización acumulativa y `Cache-Control: private, no-store`.

## Contratos reutilizados

- `ClientCompanyOption`
- `ClientRelationshipOption`
- `ClientCaseOption`

Origen:

`src/services/eve/official-control-panel/official-control-panel-context.types.ts`

Unidad 2B solo agrega estado y presentación de UI; no redefine contratos de
persistencia.

## Mapeo explícito

| Fuente | Destino UI | Transformación |
|---|---|---|
| `ClientCompanyOption.label` | Empresa cliente | Ninguna |
| `ClientRelationshipOption.label` | Relación activa | Ninguna |
| `ClientCaseOption.label` | Caso en curso | Ninguna |
| `ClientCaseOption.statusLabel` | Estado actual | Traducción autorizada de Unidad 2A |
| Sin fuente autorizada | Próximo paso | `No disponible` |
| Sin fuente autorizada | Participación | `Sin datos` |
| Sin fuente autorizada | Atención requerida | `No disponible` |

No se inventan valores ni se muestran estados técnicos crudos.

## Estado y navegación

Estados:

- `no-company`
- `loading-relationships`
- `no-relationship`
- `loading-cases`
- `no-case`
- `active`
- `error`

Query params:

- `mode`
- `view`
- `company`
- `relationship`
- `case`

Cambios realizados por el usuario usan `router.push`. Autoselección y
normalización usan `router.replace`.

Reglas:

- cambiar empresa elimina relación, caso y dependencias futuras;
- cambiar relación elimina caso y dependencias futuras;
- cambiar caso elimina proceso, hito, usuario, rol, actividad, alerta y
  trazabilidad futuras;
- empresa inválida elimina empresa, relación y caso;
- relación inválida elimina relación y caso;
- caso inválido elimina caso.

La URL nunca concede acceso. Cada lista se resuelve mediante el BFF autorizado.

## Autoselección

- Una relación se autoselecciona solo si el BFF devuelve exactamente una.
- Un caso se autoselecciona solo si el BFF devuelve exactamente uno.
- Con varias opciones no existe selección implícita.
- No se usan usuario, fecha, Runtime, WorkMap, nombre parecido ni fixtures de
  producción.

## Accesibilidad

- labels HTML asociados;
- búsqueda de empresa por nombre;
- selects operables por teclado;
- foco visible;
- foco transferido a relación/caso después de una selección válida;
- estados de carga con `aria-live`;
- errores con `role="alert"`;
- controles dependientes deshabilitados con explicación asociada;
- IDs ausentes de nombres accesibles.

## Datos faltantes

Unidad 2A no expone próximo paso, participación ni atención requerida. Unidad 2B
mantiene marcadores conservadores en vez de inferirlos. La banda core, los KPIs,
el eje X y el rail Y permanecen vacíos.

## Prioridad de estados

Orden causal obligatorio:

`error → loading → no-company → no-relationship → no-case → active`

En `error`, la cabecera muestra solo el mensaje de error y **Reintentar**; la banda
y el workspace usan copy sincronizado vía `presentClientContextShellCopy`.

## Pruebas y capturas

Pruebas:

- regresión de navegación/presentación Unidad 2B;
- regresión Unidad 1;
- regresión Unidad 2A;
- compuerta staging (`official-control-panel-staging-gate.test.mjs`);
- congelamiento legacy;
- TypeScript y ESLint;
- Playwright contra Supabase local con un usuario realmente autenticado y RLS.

Datos E2E locales están aislados en
`tests/eve/e2e/setup/prepare-official-control-panel-unit2b.mjs`; no forman parte de
producción ni staging.

Capturas finales locales (8):

`reports/unit2b/screenshots/`

| Archivo | Estado |
|---|---|
| `01-error.png` | Error de carga dominante |
| `02-sin-empresa.png` | Sin empresa seleccionada |
| `03-cerveceria-amber-seleccionada.png` | Cervecería Amber seleccionada |
| `04-relacion-seleccionada.png` | Relación activa seleccionada |
| `05-caso-activo.png` | Caso en curso activo |
| `06-desktop.png` | Desktop (1440px) |
| `07-tablet.png` | Tablet (820px) |
| `08-mobile.png` | Mobile (390px) |

Capturas de staging (pendientes de despliegue autorizado):

`reports/staging/unit2/screenshots/` — ver `STAGING_GATE_DICTAMEN.md`.

## Supuestos

- El Consultor debe tener una sesión Supabase válida en el navegador (staging y
  producción). El bootstrap `local-session` solo opera en desarrollo local estricto.
- El gate privado del panel no acepta `eve_consultant_role` como sustituto de JWT
  fuera de desarrollo local.
- Si falta sesión Supabase, la UI falla cerrada con un error genérico.

## Fuera de alcance

- Unidad 3;
- cálculo de KPIs;
- contenido de eje X o rail Y;
- selección de usuarios, roles o actividades;
- Runtime 40+20;
- Gobernanza de Experiencia.
