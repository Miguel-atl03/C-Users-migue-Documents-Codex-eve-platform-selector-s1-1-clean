# CORRECCIÓN VISUAL Y DE CONSISTENCIA DE GOBERNANZA DE EXPERIENCIA COMPLETADA

## Alcance

Corrección exclusiva de inconsistencias en  
`/admin/official-consultant-control-panel?mode=user-experience-governance`.

Sin cambios en migraciones, RPC, RLS, Runtime ni §§13–16.

## Criterios cumplidos

### 1. Estado de Empresa Cliente unificado (§17)

- Proyección única `presentCompanyStateSurface` alimenta:
  - KPI **Estado actual**
  - KPI **Próximo paso**
  - Texto **Estado Empresa Cliente** en Trayectorias / Soporte / Salud
  - Drawer contextual **Atención y Gobernanza**
- `deriveExperienceHasValidNextEvent` factual: datos vacíos → sin próximo evento → no **En curso**
- Amber vacío: **No disponible** en todas las superficies (no contradicción con Próximo paso)

### 2. Contexto listo vs datos vacíos

- `resolveOfficialPanelShellSnapshot`: `contextStatus: ready` + `dataStatus: empty`
- Atributos internos `data-shell-context-status` / `data-shell-data-status` (no visibles en UI)

### 3. Barra técnica inferior eliminada

- `OfficialControlPanelStatusBar` retirada del shell productivo
- Sin `READ-ONLY`, `effective_scope`, `ready-empty`, `unit-1-shell`, etc. en pantalla

### 4. Placeholder de subvistas eliminado

- Sin **SUBVISTA** / **Subvistas en el workspace de experiencia** en modo experiencia
- Navegación por `ExperienceTabs` dentro del workspace

### 5. Vacíos factuales Amber

| Vista | Mensaje |
|-------|---------|
| Trayectorias | Sin eventos de experiencia registrados. |
| Soporte | Sin solicitudes de soporte. |
| Salud de pantallas | Sin información disponible. |
| Alertas de experiencia | `0` (consulta completa, sin alertas) |

### 6. Capturas regeneradas

`reports/local/experience-governance-correction/screenshots/`:

- `01-trayectorias-corregida.png`
- `02-soporte-corregido.png`
- `03-salud-pantallas-corregida.png`

### 7. Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `official-control-panel-experience-governance-presentation.test.mjs` | 8/8 OK |
| `official-control-panel-rector-points-15-17.test.mjs` | 9/9 OK |
| `official-consultant-control-panel-experience-governance-correction.spec.ts` | 1/1 OK |
| TypeScript (`tsc --noEmit`) | OK |
| ESLint archivos modificados | OK |
| `npm run build` | OK |

## Archivos tocados

- `src/features/official-consultant-control-panel/presentation/company-state-presentation.ts` (nuevo)
- `src/features/official-consultant-control-panel/state/official-panel-shell-snapshot.ts` (nuevo)
- `src/services/eve/official-control-panel/official-control-panel-company-state-aggregation.ts`
- `src/app/api/eve/official-consultant-control-panel/cases/[caseId]/experience-state/route.ts`
- `src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx`
- `src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx`
- `src/features/official-consultant-control-panel/components/ExperienceGovernanceMode.tsx`
- `src/features/official-consultant-control-panel/components/OfficialControlPanelModeSwitch.tsx`
- `src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx`
- `src/features/official-consultant-control-panel/types/official-control-panel.types.ts`
- `tests/regression/consultant-control-panel/official-control-panel-experience-governance-presentation.test.mjs` (nuevo)
- `tests/e2e/official-consultant-control-panel-experience-governance-correction.spec.ts` (nuevo)
- `tests/regression/consultant-control-panel/official-control-panel-unit1.test.mjs`
