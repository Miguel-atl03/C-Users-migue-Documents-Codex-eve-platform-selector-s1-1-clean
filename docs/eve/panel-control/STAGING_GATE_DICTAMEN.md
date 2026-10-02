# Dictamen final — Unidad 2 (compuerta staging)

Fecha: 2026-07-15  
Alcance: Unidad 1 + 2A + 2B. **Unidad 3 no iniciada.**  
Producción: **no tocada.**

## Decisión

| Capa | Estado |
|---|---|
| **Datos staging (2A + Amber canónico)** | **Parcial — cerrado con deuda explícita** |
| **UI staging (2B desplegada + capturas)** | **Bloqueada** — faltan 3 insumos externos |
| **Aprobación formal de compuerta completa** | **No** |
| **Unidad 3** | **No iniciada** |

---

## Lo cerrado en datos staging

1. Migraciones Unidad 2A aplicadas en `bwflscplkjohdhkiqqoc.supabase.co` (bridge + contexto; correctiva por stub vacío).
2. Registro canónico Amber documentado (no por nombre/fecha):  
   empresa `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` · caso `19fc9eff-4219-43f0-854c-e2b3350f23f2`.
3. Asignación, relación y vínculo de caso creados solo con evidencia.
4. Cruces empresa–relación: **0**.
5. Aislamiento SQL: Consultor A con acceso `true`; actor sin asignación `false`.
6. `local-session` y bypass local endurecidos (tests gate 5/5).
7. Rollback documentado.

## Deuda explícita (no corregir por inferencia)

| Ítem | Valor | Política |
|---|---|---|
| Casos huérfanos (`orphanCases`) | **80** | Permanecen. Sin backfill inferido. Plan administrativo futuro. |
| Empresa Amber duplicada no canónica | `e6cdd265-…` | No consolidar automáticamente. |
| Segundo consultor real en `auth.users` | Ausente (solo 1 usuario) | Requerido para aislamiento A/B con dos logins. |

---

## Bloqueo UI staging — insumos externos faltantes

Confirmado en entorno Cursor (2026-07-15): **los tres faltan**.

| Insumo | Uso | Entrega |
|---|---|---|
| `EVE_STAGING_BASE_URL` | Despliegue + Playwright | Variable de entorno / CI |
| Credenciales reales Consultor A (y B para aislamiento) | Auth real + Playwright | Secreto seguro; nunca en repo/bundle |
| `EVE_STAGING_SUPABASE_SERVICE_ROLE_KEY` | Verificador remoto + admin scripts | **Solo secreto seguro**; nunca archivo ni zip |

Sin estos, **no** se ejecuta el resto de la secuencia.

---

## Secuencia obligatoria al recibir los insumos

Orden fijo (ver `STAGING_UI_CLOSEOUT_RUNBOOK.md`):

1. Desplegar Unidad 2B **sin** flags locales (`.env.local`, `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED`, `EVE_UNIT2B_TEST_PASSWORD`).
2. Validar autenticación real (JWT Supabase; cookie sola no basta).
3. Ejecutar `verify-unit-2a-integrity.mjs` contra remoto con service role staging.
4. Probar aislamiento con **dos usuarios reales** (A asignado a Amber; B sin asignación o a otra empresa).
5. Playwright staging con Cervecería Amber.
6. Generar capturas en `reports/staging/unit2/screenshots/`.
7. Emitir dictamen de cierre UI + actualizar este archivo a **Aprobado staging completo** o mantener bloqueado.

---

## Criterios de aceptación (estado)

| Criterio | Cumple |
|---|---|
| Migración 2A en staging | Sí |
| Amber canónico vinculado | Sí |
| Verificador remoto formal con service role staging | **No** (clave remota ausente) |
| 80 huérfanos sin autocorrección | Sí (deuda) |
| Despliegue 2B sin flags locales | **No** |
| Auth real en UI staging | **No** |
| Aislamiento A/B con dos usuarios reales | **No** (parcial SQL; falta 2º usuario + UI) |
| Playwright + capturas staging Amber | **No** |
| Sin secretos en archivos/bundle | Sí |
| Sin producción / sin Unidad 3 | Sí |

---

## Fuentes

- `STAGING_AMBER_CANONICAL.md`
- `STAGING_UNIT2A_VERIFICATION_REPORT.md`
- `STAGING_ADMIN_DRY_RUN.md`
- `STAGING_UI_CLOSEOUT_RUNBOOK.md`
- `reports/staging/unit2/STAGING_SCREENSHOTS_BLOCKER.md`
- `STAGING_ROLLBACK_UNIT2.md`
