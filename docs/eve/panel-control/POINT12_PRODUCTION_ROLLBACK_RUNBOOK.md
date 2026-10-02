# POINT12 — Runbook de rollback de producción

**Alcance:** revertir artefactos Point 12 de forma ordenada y verificable  
**Raíz:** `external-consumers/eve-platform`  
**Script:** `scripts/eve/official-control-panel/rollback-point12-production.sql`  
**Local de referencia:** `127.0.0.1:54321`  
**Preservar:** caso Amber `19fc9eff`  
**Prohibido:** identity trick (`usuarios.auth_user_id` = consultor); iniciar Punto 13  
**Nota:** este runbook no afirma que un rollback remoto se haya ejecutado.

---

## Principios

1. Preferir **rollback policy-only** (políticas SELECT consultor de 190300). Es reversible reaplicando migraciones `190300` + `190400`.
2. No DROP de tablas Point 12 por defecto: es destructivo y requiere ledger vacío + flag explícito.
3. No tocar datos de Amber; no seeds; no `db reset` en producción.
4. Procedimiento canónico de ensayo: **up → verify → rollback → verify rollback → reapply → verify**.

---

## Artefactos involucrados

| Capa | Artefacto |
|------|-----------|
| Políticas 190300 | `activity_runtime_run_consultant_select`, `role_runtime_session_consultant_select`, `readiness_gap_record_consultant_select`, `process_state_timer_event_consultant_select`, `readiness_decision_record_consultant_select` |
| Función publish | `publish_runtime_causal_evaluation` (endurecida 190000 / 190300; lint-safe `run_id` en 190400) |
| Tablas ledger/catálogo/snapshots | creadas/ampliadas en 180000–190200 (solo rollback destructivo opcional) |
| App | BFF/FE Point 12 (rollback de código = redeploy commit anterior) |

Migraciones de referencia:

- `supabase/migrations/20260717190300_eve_point12_consultant_runtime_p3_rls.sql`
- `supabase/migrations/20260717190400_eve_point12_publish_branching_decision_run_id_fix.sql`
- (cadena completa 180000–190200 si se contempla DROP de tablas)

---

## Procedimiento de ensayo / operación

### A. Up

Aplicar cadena Point 12 hasta `190400` en el entorno de ensayo (local: `127.0.0.1:54321`).

### B. Verify (post-up)

```bash
node scripts/eve/official-control-panel/verify-runtime-causal-evaluation-ledger.mjs
node scripts/eve/official-control-panel/verify-runtime-control-snapshots.mjs
```

SQL de presencia de políticas 190300 (ver sección Verify).  
RLS A/B con JWT reales (A ve / B no ve). Sin identity trick.

### C. Rollback (policy-only — ruta segura)

```bash
# Ejemplo portable: psql vía connection string de entorno (no hardcodear paths de Downloads)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/eve/official-control-panel/rollback-point12-production.sql
```

El script por defecto:

1. `DROP POLICY` de las cinco políticas consultor SELECT de 190300.
2. **No** reemplaza el cuerpo de `publish_runtime_causal_evaluation` (ver nota abajo).
3. **No** DROP de tablas.

#### Publish / branching_decision

- Tras rollback policy-only, la función publish **puede seguir** en semántica 190400 (`branching_decision.run_id`).
- Eso es aceptable: las políticas consultor son el cambio de superficie RLS; el publish sigue siendo service_role.
- Si se requiere semántica previa exacta de publish:
  - **Opción 1 (recomendada):** dejar 190400; reaplicar solo políticas vía `190300` (+ confirmar `190400` ya aplicada).
  - **Opción 2:** restaurar el cuerpo desde la migración previa acordada (`190000` endurecida o `190300` pre-lint-fix) ejecutando el `CREATE OR REPLACE` de ese archivo, luego documentar; al reentrar, reaplicar `190300`+`190400`.
- No inventar un restore ad-hoc distinto de esos archivos.

### D. Verify rollback

```sql
-- Políticas 190300 deben estar ausentes
select pol.polname, c.relname
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and pol.polname in (
    'activity_runtime_run_consultant_select',
    'role_runtime_session_consultant_select',
    'readiness_gap_record_consultant_select',
    'process_state_timer_event_consultant_select',
    'readiness_decision_record_consultant_select'
  );
-- Esperado: 0 filas
```

- Consultor A autenticado: ya no debe SELECT vía políticas 190300 en run/P3 (el ledger puede seguir con políticas 190000 — eso es independiente).
- Amber `19fc9eff`: filas de caso intactas; sin deletes.
- Verifiers de ledger/snapshots: deben seguir pasando si no se tocó data.

### E. Reapply

Reaplicar migraciones (o sus statements idempotentes):

1. `20260717190300_eve_point12_consultant_runtime_p3_rls.sql`
2. `20260717190400_eve_point12_publish_branching_decision_run_id_fix.sql`

```bash
npx supabase db push
# o re-ejecutar esos dos archivos con ON_ERROR_STOP si el historial de migraciones ya las marca applied:
# en ese caso usar el SQL de las migraciones directamente (DROP POLICY IF EXISTS + CREATE)
```

### F. Verify (post-reapply)

- Políticas 190300 presentes de nuevo.
- Publish con check `branching_decision.run_id` (190400).
- RLS A/B OK.
- Amber intacto.
- Verifiers OK.

---

## Rollback destructivo de tablas (opcional, no default)

Documentado también como sección gated en `rollback-point12-production.sql`.

**Solo si:**

1. Se acepta pérdida de datos Point 12 en ese entorno, **o**
2. Conteos de ledger/snapshots/resolutions/evidence/evaluations/catálogo Point 12 están en 0 (o solo filas de catálogo `point12-catalog-v1` explícitamente aprobadas para borrar), **y**
3. Se activa:

```sql
select set_config('eve.point12_allow_destructive_rollback', 'on', true);
```

**Orden sugerido de DROP (si el gate pasa):**

1. `runtime_causal_evaluation_evidence_links`
2. `runtime_causal_catalog_causal_defs` (filas / tabla según empty checks)
3. `runtime_causal_rule_catalog_versions` (versión `point12-catalog-v1`)
4. `runtime_causal_variable_resolutions`
5. `runtime_causal_evaluations`
6. `runtime_run_control_snapshots`
7. `runtime_causal_required_variable_rules` (filas `point12-catalog-v1` / tabla si vacío)

El script conservador puede limitarse a borrar filas/tablas Point 12 **solo** cuando los empty checks pasen.  
**No** dropear `activity_runtime_run` ni tablas P3 de runtime previas al Point 12.

Tras DROP destructivo, reapply completo requiere volver a correr 180000→190400 (y seeds de catálogo según proceso).

---

## Abort / producción

Si el deploy falló tras 190300/190400:

1. Ejecutar **solo** policy-only rollback si el síntoma es RLS incorrecto.
2. Si el síntoma es publish/lint: corregir con `190400` o restaurar cuerpo documentado; no DROP tablas.
3. Redeploy app al commit previo si el FE asume políticas consultor.
4. Abrir incidente; no iniciar Punto 13.

---

## Checklist rápido Amber / identidad

| Check | Esperado |
|-------|----------|
| Caso `19fc9eff` | sin DELETE/UPDATE de rollback |
| RLS A/B | JWT + `eve_consultant_can_access_*`; sin `auth_user_id` trick |
| Punto 13 | no iniciado |

---

## Referencias

- Script: `scripts/eve/official-control-panel/rollback-point12-production.sql`
- Deploy: `docs/eve/panel-control/POINT12_PRODUCTION_DEPLOYMENT_RUNBOOK.md`
- Checklist: `docs/eve/panel-control/POINT12_PRODUCTION_READINESS_CHECKLIST.md`
- Rollback histórico ledger (local): `docs/eve/panel-control/POINT12_RUNTIME_LEDGER_CORRECTION_ROLLBACK.md`
