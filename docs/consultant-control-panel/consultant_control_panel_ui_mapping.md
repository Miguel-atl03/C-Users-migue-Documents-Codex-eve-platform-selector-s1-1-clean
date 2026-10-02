# Consultant Control Panel — UI mapping (Diseño UI v1.0)

**Fuente visual:** `Diseno_UI_FrontEnd_Panel_Control_Consultor_EVE_v1_0.docx`  
**Ruta activa:** `/admin/consultant-control-panel`  
**Alias:** `/consultant/control-panel` → redirect  
**Estado UI:** read-only · `manual_actions.enabled=false` · `downloads.enabled=false`

## Shell (layout §5)

| Zona | Componente | Notas |
|------|------------|-------|
| Header fijo | `CaseHeader` | Empresa · Caso · Estado · Consultor · Última actualización · capabilities |
| Sidebar fija | `SidebarNavigation` | Labels §4 / §7.2 + Acciones manuales (Disabled) |
| Workspace | `ControlPanelWorkspace` | Router de vistas |
| Status | `StatusBar` | request_id + capabilities |
| Drawer evidencia | `EvidenceDetailDrawer` | §7.11 read-only |
| Drawer acciones | `ManualActionDrawer` | §7.14 preview no ejecutable |

## INIT-001 (`cases`)

- `StatusLegend` (§7.15: ready / flags / blocked / reentry / manual_review / disabled)
- `CaseReadinessSummary` (8 KPIs §7.3)
- `CompanyUserRoleMatrix` (Usuario × Rol × Área × Actividades × Runs × Estado × Alertas)
- `CriticalAlertsStrip` / CriticalAlertsPanel (incl. `ROLE_ASSIGNMENT_GAP`)

## Vistas §4

| View | Componentes alineados al DOCX |
|------|-------------------------------|
| `monitoring` | matrix + `FunctionalHelpPanel` (§7.5 señales) |
| `runtime` | `RuntimeRunTable` §7.6 + `Runtime40BaseGrid` §7.7 + `Runtime20CausalGrid` §7.8 |
| `gates` | `GateReadinessPanel` §7.9 (B0/B2/B3/B7, SEM-001…007, PST-001…006, gaps, decision) |
| `trace` | `OperationalTraceTimeline` §7.10 |
| `downloads` | `DownloadsPanel` §7.12 (taxonomía insumo/plantilla/resultado/exportable técnico) |
| `audit` | `AuditTrailPanel` §7.13 (Fecha · Actor · Acción · Objeto · Resultado) |

## Criterios UI §13

UI-001…UI-010 cubiertos por shell activo + tests `tests/regression/consultant-control-panel/`.

## Legacy (disco, fuera del árbol activo)

No importados: `CaseCenterPanel`, `ClientCompanyProgressPanel`, `FunctionalUserHelpPanel`, `EveOperationalTracePanel`, `ConsultantDownloadsPanel`, `SupFinalObjectsBackbonePanel`, `ControlPanelFilters`, `AuditJustificationModal`, `PanelChrome`.
