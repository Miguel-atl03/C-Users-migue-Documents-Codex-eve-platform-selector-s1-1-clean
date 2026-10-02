# Dictamen — Rollback controlado §§11–12

Fecha: 2026-07-16  
Autoridad: `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` (v1.0)

## Decisión

**Rollback de §§11–12 completado. §§7–10 restaurados y validados en navegador.**

§11 se reimplementará por separado. §12 solo después de validación visual de §11.

## Checkpoint restaurado

Inmediatamente posterior a:

**§10 — Perfil funcional → Sesión funcional → Actividad**

Fuente de restauración de archivos tocados por §§11–12:

- eliminación de artefactos exclusivos §§11–12;
- remoción quirúrgica del delta §§11–12 sobre el estado §10 con selector de sesión (el zip Ola A era anterior al selector y no se usó como overwrite total).

Conservado:

- §§7–9;
- Ola A / puente §10;
- migración `20260716170000_eve_official_control_panel_point10_profile_runtime_links.sql`;
- BFF/UI/navegación de §10 (incl. `Sesión funcional`);
- Amber local recuperado.

## Eliminado

- migración `20260716180000_..._point11_role_session_activities.sql`
- `ActivitySelectionPanel.tsx`, `RuntimeRunPanel.tsx`
- servicios/tipos de selección y runtime read de panel
- rutas `activity-selection`, `activities/[activityId]/runs`, `runs/[runId]/runtime`
- tests/docs/capturas específicas §§11–12
- scripts auxiliares de empaquetado §§11–12

## Recuperación local

```text
npx supabase db reset
node scripts/eve/official-control-panel/recover-amber-context-from-repository.mjs --apply-local
node scripts/eve/official-control-panel/verify-unit-2a-integrity.mjs  → pass
node scripts/eve/official-control-panel/verify-point10-profile-runtime-links.mjs → pass
```

Última migración aplicada: `20260716170000_..._point10_...` (sin §11).

## Validación navegador (Playwright real)

- Spec: `tests/e2e/official-consultant-control-panel-rollback-points-11-12.spec.ts`
- Resultado: **1/1 pass**
- Captura: `reports/local/rollback-points-11-12/screenshots/01-amber-checkpoint-point10-no-11-12.png`

Observado:

- Cervecería Amber activa;
- Eje X (Procesos de soporte);
- Eje Y (Hitos core);
- matriz X/Y;
- Monitoreo recursivo §10 (`Usuarios del caso`, vacío factual Amber);
- sin paneles de selección de actividades;
- sin Runtime 40+20;
- sin error de sesión del Consultor.

## Próximo paso autorizado

Reimplementar **solo §11**, validar visualmente, y solo entonces iniciar §12.
