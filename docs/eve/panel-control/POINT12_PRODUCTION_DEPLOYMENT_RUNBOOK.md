# POINT12 — Runbook de despliegue a producción

**Alcance:** aplicar y verificar Point 12 (migraciones 180000–190400 + app BFF/FE)  
**Raíz:** `external-consumers/eve-platform`  
**Local de referencia:** Supabase en `127.0.0.1:54321`  
**Prohibido en este tramo:** iniciar Punto 13; inventar que el deploy remoto ya se ejecutó.  
**Este documento es procedimiento:** no implica que el deploy se haya corrido.

Comandos portables (Unix-like / PowerShell con `npx`). No depender de rutas fijas tipo `Downloads`.

---

## 0. Precondiciones

1. Checklist `docs/eve/panel-control/POINT12_PRODUCTION_READINESS_CHECKLIST.md` sin FAIL bloqueantes.
2. Owner de deploy identificado; ventana de cambio acordada.
3. Acceso a:
   - repo en commit/tag de release Point 12
   - proyecto Supabase de destino (CLI autenticada o connection string de **servicio**, no en git)
   - entorno de app (hosting) con secrets inyectados
4. Amber case `19fc9eff` identificado como no tocado por migraciones de datos.
5. Punto 13 ausente del release.

---

## 1. Preflight

Desde la raíz del paquete `eve-platform`:

```bash
git status
git rev-parse HEAD
```

Verificar presencia de migraciones:

```bash
ls supabase/migrations/20260717180000_eve_point12_causal_required_variable_rules.sql
ls supabase/migrations/20260717180100_eve_point12_runtime_causal_evaluation_ledger.sql
ls supabase/migrations/20260717180200_eve_point12_runtime_control_snapshots.sql
ls supabase/migrations/20260717190000_eve_point12_runtime_ledger_security_integrity_fix.sql
ls supabase/migrations/20260717190100_eve_point12_causal_catalog_completion.sql
ls supabase/migrations/20260717190200_eve_point12_runtime_control_snapshot_integrity_fix.sql
ls supabase/migrations/20260717190300_eve_point12_consultant_runtime_p3_rls.sql
ls supabase/migrations/20260717190400_eve_point12_publish_branching_decision_run_id_fix.sql
```

Ensayo local (recomendado antes de remoto):

```bash
# API local esperada: http://127.0.0.1:54321
npx supabase status
```

Confirmar variables de app **sin** habilitar local panel en prod:

- `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED` debe estar ausente o distinto de `true` en prod.
- Service role / anon keys solo en secret store.

---

## 2. Backup

Antes de migrar producción:

1. Snapshot / backup lógico del proyecto Supabase (dashboard o procedimiento del proveedor).
2. Export opcional de conteos Point 12 (si ya hubo parciales):

```sql
select 'runtime_causal_evaluations' as t, count(*) from public.runtime_causal_evaluations
union all select 'runtime_run_control_snapshots', count(*) from public.runtime_run_control_snapshots
union all select 'runtime_causal_required_variable_rules', count(*) from public.runtime_causal_required_variable_rules;
```

3. Registrar `schema_migrations` actuales (o equivalente CLI) en el ticket de cambio.
4. Confirmar que Amber `19fc9eff` existe y no será mutado por scripts de seed.

---

## 3. Migraciones

Orden estricto 180000 → 190400. Preferir CLI del proyecto:

```bash
# Apuntar al proyecto remoto configurado en supabase/config + link
npx supabase db push
# o el flujo canónico del equipo (migration up / CI migrate job)
```

Si se aplica SQL manualmente, ejecutar **solo** los ocho archivos en orden, en una sesión supervisada.

Post-apply smoke SQL mínimo:

```sql
select to_regclass('public.runtime_causal_evaluations');
select to_regclass('public.runtime_run_control_snapshots');
select to_regclass('public.runtime_causal_rule_catalog_versions');
select proname from pg_proc
where proname in (
  'publish_runtime_causal_evaluation',
  'publish_runtime_run_control_snapshot',
  'compute_and_publish_runtime_control_snapshot',
  'eve_consultant_can_access_runtime_run'
);
select polname, rel.relname
from pg_policy pol
join pg_class rel on rel.oid = pol.polrelid
where pol.polname like '%consultant_select%'
  and rel.relname in (
    'activity_runtime_run',
    'role_runtime_session',
    'readiness_gap_record',
    'process_state_timer_event',
    'readiness_decision_record'
  );
```

Catálogo:

```sql
select catalog_version_code, lifecycle_state
from public.runtime_causal_rule_catalog_versions
where catalog_version_code = 'point12-catalog-v1';
```

---

## 4. Verifiers

Contra el entorno bajo prueba (local primero: `127.0.0.1:54321`):

```bash
node scripts/eve/official-control-panel/verify-runtime-causal-evaluation-ledger.mjs
node scripts/eve/official-control-panel/verify-runtime-control-snapshots.mjs
```

Ajustar env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) según el script y el entorno. No commitear keys.

Opcional integridad de catálogo / manage en dry-run si el script lo soporta:

```bash
node scripts/eve/official-control-panel/manage-runtime-causal-evaluations.mjs --help
```

---

## 5. Build / deploy de aplicación

```bash
npm ci
npm run build
```

Desplegar el artefacto con el pipeline o hosting habitual del repo (Vercel/otro).  
**No** documentar aquí una ejecución ya hecha; registrar en el ticket el commit y la URL de deploy cuando ocurra.

Checklist de env en runtime de app:

| Variable / secreto | Prod |
|--------------------|------|
| Supabase URL + anon | requeridos |
| Service role (solo server) | requerido para BFF que lo use |
| `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED` | off / ausente |

---

## 6. Smoke test post-deploy

1. Health de la app (ruta de health o home admin autenticado).
2. Abrir panel consultor oficial con usuario real autorizado.
3. Navegar hasta un run en scope y llamar BFF:
   - `.../runtime/base-matrix`
   - `.../runtime/causal-matrix`
   - `.../runtime/control-state`
4. Confirmar 403 en:
   - `/api/eve/official-consultant-control-panel/local-session`
   - UI fixtures local si se intenta en host no-local
5. Confirmar que Amber `19fc9eff` sigue visible solo para consultores con assignment válido (sin identity trick).

---

## 7. RLS A/B

Usar dos consultores reales (JWT), **sin** mapear `usuarios.auth_user_id` al consultor:

| Actor | Expectativa |
|-------|-------------|
| Consultor A (assignment al caso/run) | SELECT permitido en run/P3/ledger en scope |
| Consultor B (sin assignment) | vacío / denied en los mismos IDs |

Validar vía cliente authenticated (PostgREST) o harness e2e operacional, no vía service_role fingiendo usuario.

---

## 8. Observabilidad

1. Módulo: `src/services/eve/official-control-panel/official-control-panel-observability.ts`
2. Durante smoke, provocar un 401/403 controlado y un 200 de matrix; verificar logs estructurados en el sink del entorno.
3. No loguear service role, JWT completos ni PII innecesaria.
4. Dejar enlace/ticket a la consulta de logs en el registro del cambio.

---

## 9. Criterios de abort

Abortar o revertir inmediatamente si:

- falla cualquier migración 180000–190400
- verifiers fallan en prod tras migrate
- RLS A/B: B ve datos de A, o A no ve datos autorizados tras 190300
- smoke BFF 5xx sostenido
- local-session o fixtures accesibles en prod
- evidencia de mutación/borrado de Amber `19fc9eff`
- se detecta activación accidental de trabajo Punto 13

Procedimiento de abort → `docs/eve/panel-control/POINT12_PRODUCTION_ROLLBACK_RUNBOOK.md`  
Script policy-only → `scripts/eve/official-control-panel/rollback-point12-production.sql`

---

## 10. Rollback (resumen)

1. Detener tráfico / feature flag de panel runtime si existe.
2. Ejecutar rollback **policy-only** (seguro) del script.
3. Si hace falta revertir publish 190400: reaplicar semántica previa documentada en runbook de rollback, o re-apply 190300+190400 tras corrección.
4. DROP de tablas Point 12: solo con ledger vacío + flag destructivo; ver runbook de rollback.
5. Redeploy de app al commit pre-Point12 si el FE/BFF es incompatible.

---

## 11. Cierre

Registrar en el ticket:

- commit/tag desplegado
- hora de migrate / deploy
- resultado verifiers + smoke + RLS A/B
- decisión GO / ABORT
- confirmación explícita: Punto 13 **no** iniciado

---

## Referencias

- Checklist: `docs/eve/panel-control/POINT12_PRODUCTION_READINESS_CHECKLIST.md`
- Inventario: `docs/eve/panel-control/POINT12_PRODUCTION_READINESS_INVENTORY.md`
- Rollback: `docs/eve/panel-control/POINT12_PRODUCTION_ROLLBACK_RUNBOOK.md`
