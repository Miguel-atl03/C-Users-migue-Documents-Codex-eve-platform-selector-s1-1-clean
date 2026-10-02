# RECTOR R4 - Fixture Registry

Registro ejecutado desde una base creada solo por migraciones oficiales. Manifest canónico: `reports/local/rector-r4-acceptance/manifest.json`.

| ID | Precondición test-only | Actor/acción productiva | Negativo y aislamiento | Evidencia |
|---|---|---|---|---|
| FX-01 | empresa/caso y 10 usuarios | consultor lee proyecciones factuales | empresa ajena no filtra datos | `01-fx01-empresa-saludable.png` |
| FX-02 | un usuario y dos perfiles/sesiones | usuario crea dos sesiones oficiales; consultor navega ambas | IDs de sesión/actividad distintos | `02-fx02-usuario-multirrol.png` |
| FX-03 | snapshot <=8 | consultor POST selección | misma key/payload concurrente produce una versión | `03-fx03-seleccion-hasta-ocho.png` |
| FX-04 | snapshot >8 elegibles | consultor POST selección competitiva | >8 seleccionadas y payload conflictivo rechazados | `04-fx04-seleccion-mayor-ocho.png` |
| FX-05 | gap factual | consultor lee Atención | Consultor B recibe 403 | `05-fx05-workmap-coverage-gap.png` |
| FX-06 | flag/ruta factual | consultor lee control-state | no se infiere por texto libre | `06-fx06-ruta-b2-faltante.png` |
| FX-07 | usuario operativo y Runtime | usuario POST answer/feedback | feedback no se presenta como satisfacción | `07-fx07-feedback-b3.png` |
| FX-08 | trabajo P-SUP-03 | consultor descarga y ejecuta transiciones completas | A/B/C, stale, capability e idempotencia | `08-fx08-trabajo-manual.png` |
| FX-09 | paquete ACA WithFindings | consultor ejecuta seis transiciones | resolución prematura denegada | `09-fx09-rework-p-sup-06.png` |
| FX-10 | paquete ACA no satisfecho | consultor intenta exportar | 409 y cero cambio de producto | `10-fx10-exportacion-bloqueada.png` |
| FX-11 | dos casos Runtime aislados | usuarios A/B y consultores A/B completan soporte | cruces A/B 403/404; actionId no cruza | `11-fx11-experiencia-soporte.png` |
| FX-12 | caso/PF-CORE-01 sin cierre | consultor emite evento final alternativo | no usa DML de fixture ni crea final nuevo | `12-fx12-final-alternativo.png` |

Todos los fixtures tienen transición productiva registrada en `e2e-r4.json`; `seedOnlyPass=false`. Los hashes de las doce capturas están en `diagnostics/verify-summary.json`.
