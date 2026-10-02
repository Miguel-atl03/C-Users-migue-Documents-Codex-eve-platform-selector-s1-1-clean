# Dictamen R2 — Acciones manuales gobernadas y aceptación auditada

## Veredicto

**R2 — ACCIONES MANUALES GOBERNADAS Y ACEPTACIÓN AUDITADA APTA PARA PROMOCIÓN A PRODUCCIÓN**

No se inicia R3. No se pobla Amber con eventos de experiencia ni trabajo manual de producto.

## Causa exacta de la regresión §§15–17 (cerrada)

**Caso A — migración existente pendiente de aplicación en la DB local**, no defecto de cadena incompleta ni DDL manual.

1. La tabla `public.experience_screen_event` ya estaba definida en  
   `supabase/migrations/20260718100000_eve_point15_17_experience_governance.sql`.
2. El historial local se había detenido en `20260718030000`; esa migración **no** estaba aplicada.
3. Había colisión de versión: dos archivos con `20260718030000`. El aplicado era  
   `eve_point13_transition_event_strict`; el pendiente  
   `eve_point14_parallel_production_qa_observation` no podía avanzar.
4. Corrección de cadena: renombrar solo el archivo **aún no aplicado** a  
   `20260718030100_eve_point14_parallel_production_qa_observation.sql`  
   (sin editar migraciones históricas ya aplicadas).
5. Aplicar pendientes con `npx supabase migration up --local`.
6. Seeds test-only oficiales (identidades A/B, §§15–17, Unit2B Amber vacío, FX-08).
7. Reinicio del `next dev` con `SUPABASE_SERVICE_ROLE_KEY` alineada al stack local  
   (requerida por BFF de experiencia / acciones gobernadas; sin JWT demo ni bypass).

No se usa “fuera de R2” como justificación de regresión abierta.

## Alcance R2 (sin cambio funcional de producto en esta corrección)

1. Helpers privilegiados sin EXECUTE público indebido.
2. RPC `eve_list_valid_manual_input_packages_as_consultant`.
3. `p_case_id` obligatorio; denegación cross-path.
4. Idempotencia server-side; advisory lock.
5. Política de adjuntos server-side.
6. Verifier R2 `ok: true` + métricas críticas en 0.
7. FX-08 Playwright UI → BFF → RPC + negativos A/B/C + capturas 01–09.

## Migraciones incrementales R2 (previas; vigentes)

- `20260720130000_eve_r2_manual_actions_security_scope.sql`
- `20260720130100_eve_r2_manual_actions_digest_search_path.sql`
- `20260720130200_eve_r2_manual_actions_accept_handoff.sql`

## Compuertas (post-restauración §§15–17)

| Compuerta | Resultado |
|-----------|-----------|
| `experience_screen_event` + `experience_support_action` presentes | PASS |
| Verifier §§15–17 `ok: true`; `eventHistoryMutations: 0`; `serviceRoleDirectDmlGrants: 0`; Amber product events/actions: 0 | PASS |
| Playwright §§15–17 (completo, no saltado) | PASS |
| Verifier R2 `ok: true` + métricas críticas = 0 | PASS |
| FX-08 Playwright happy path + A/B/C + capturas 01–09 | PASS |
| Regresión R2 / R1 / legacy / tsc / lint / build (vigentes; sin cambio de lógica R2 en esta pasada) | Conservadas; reconfirmados verifier R2 + FX-08 + §§15–17 |

## Happy path R2 evidenciado

descarga binaria → registrar inicio → adjuntar salida → enviar a revisión → aceptar versión exacta

## Evidencia local (sanitizada)

- `reports/local/rector-points-15-17/results/migration-list-final.txt`
- `reports/local/rector-points-15-17/results/verifier-15-17-final.txt`
- `reports/local/rector-points-15-17/results/playwright-15-17.txt`
- `reports/local/rector-r2-manual-actions/results/verifier-r2-after-1517.txt`
- `reports/local/rector-r2-manual-actions/results/playwright-fx08-after-1517.txt`
