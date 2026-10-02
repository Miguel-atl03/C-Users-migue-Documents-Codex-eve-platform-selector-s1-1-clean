# R1 — Production readiness checklist (SupportActionDrawer)

**Fecha:** 2026-07-20  
**Dictamen:** APTO (`RECTOR_R1_DICTAMEN.md`)

| Compuerta | Estado |
|-----------|--------|
| Consumo canónico `CompanyControlPanelVM` | PASS |
| Consumo visual `ParticipantMonitoringVM` | PASS |
| SupportActionDrawer submit → cierre → refresh | **PASS** |
| Playwright acceso A/B | PASS (evidencia vigente) |
| Playwright smoke panel | **PASS** |
| Playwright §§15–17 | **PASS** |
| BFF/RLS A/B | PASS (evidencia vigente; sin re-run) |
| Regresión §§1–17 (node) | **PASS** 189/189 |
| R1 behavioral + support-action | **PASS** |
| TypeScript | **PASS** |
| Lint archivos tocados | **PASS** |
| Build limpio | **PASS** |

### Nota operativa local

El BFF `experience-actions` requiere `SUPABASE_SERVICE_ROLE_KEY` o `EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY` en el **proceso** del servidor Next (RPC gobernada). No persistir la clave en el repo; suministrarla solo al proceso de desarrollo/compuerta.

**No iniciar R2.**
