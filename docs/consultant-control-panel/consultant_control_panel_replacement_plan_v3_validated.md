# Plan de reemplazo v3 validado — Panel de Control Consultor EVE

**Fecha:** 2026-07-12  
**Estado:** pendiente de aprobación (sin implementación)  
**Base validada:** `consultant_control_panel_replacement_plan_v2.md`  
**Ruta estable:** `/admin/consultant-control-panel`  
**Alias repo (no rector):** `/consultant/control-panel` → redirect únicamente  

## 1. Confirmación de lectura de ambos DOCX

| Documento | Ruta en repo | Lectura |
|-----------|--------------|---------|
| Diseño operativo v2 RolFuncional | `docs/consultant-control-panel/architecture/Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx` | Confirmada (texto completo extraído: ~65k chars / 1422 párrafos). Incluye cuerpo + Adenda 21 (alcance Capa 1.0/PP vs 2.0/2.5/3.0 manual) + Adenda 22 (user_id ≠ role_runtime_session). |
| Especificación UI Front-end v1.1 Ajustada | `docs/consultant-control-panel/architecture/Especificacion_UI_FrontEnd_Panel_Control_Consultor_EVE_v1_1_Ajustada.docx` | Confirmada (texto completo extraído: ~60k chars / 1368 párrafos). Incluye cuerpo v1.0 + Adenda v1.1 (descargas insumo/plantilla, ManualActionDrawer no ejecutable, ROLE_ASSIGNMENT_GAP, vista inicial exacta, criterios DL/ROLE/ACTION/INIT). |

**Cadena de autoridad aplicada (UI §1.1):**  
Diseño v2 RolFuncional → Especificación UI v1.1 → contrato BFF/API → fixture → implementación en `/admin/consultant-control-panel`.

**Regla de lectura ante tensión:** la UI Spec es el contrato implementable de pantalla; el Diseño es la autoridad operativa/MBA. Donde el Diseño describe intervención plena y la UI fija modo inicial read-only, el plan v3 adopta **read-only inicial** (UI) sin negar acciones futuras gobernadas (Diseño §13 / UI §7.3 / F5).

---

## 2. Tabla de trazabilidad

| # | Requisito del plan v2 / v3 | Documento rector | Sección / fragmento encontrado | Decisión |
|---|----------------------------|------------------|--------------------------------|----------|
| R01 | Reemplazo total en la misma ruta; no `/v2` permanente | UI | §3 “Sustitución en la misma ruta. No crear …-v2 como solución permanente”; §15.3 “No duplicar rutas productivas permanentes”; MIG-001 | **Conservar** |
| R02 | Ruta estable `/admin/consultant-control-panel` | UI | Portada “Ruta”; §3; UI-001 | **Conservar** |
| R03 | Alias `/consultant/control-panel` → redirect | — | No aparece en Diseño ni UI | **Ajustar** (marcar como compatibilidad repo; no requisito rector) |
| R04 | Cabina de observación; no diagnostica; no reescribe evidencia | Diseño + UI | Diseño §1 Dictamen; frontera portada; UI §1.2 | **Conservar** |
| R05 | Modo inicial solo lectura; manual/downloads visibles disabled | UI | Portada “Modo inicial”; §3; §7.2 capabilities; UI-003/UI-004; Adenda §18 ACTION-001 | **Conservar** |
| R06 | Capabilities exactas (`AUDITED_ENDPOINT_NOT_AVAILABLE`, `AUTHORIZED_GENERATOR_NOT_AVAILABLE`) | UI | §7.2; envelope §9.5 / Anexo A | **Conservar** |
| R07 | Shell: CaseHeader + Sidebar + Workspace + drawers | UI | §4.1 zonas; §6 / §6.1 jerarquía de componentes; UI-002 | **Conservar** (añadir status bar explícita) |
| R08 | Vistas sidebar: cases / functional-help / monitoring / runtime / trace / gates / downloads / audit | UI | §4.2 Navegación principal | **Conservar** |
| R09 | Componentes nuevos listados (CaseReadinessSummary, CompanyUserRoleMatrix, Runtime40/20 grids, GateReadinessPanel, etc.) | UI | §6 tabla de componentes; §6.1 | **Conservar** |
| R10 | Unidad de seguimiento empresa→caso→user→role→actividad→run→interacción→evidence/gap | UI + Diseño | UI §8; Diseño Adenda 22.1–22.2 | **Conservar** |
| R11 | `user_id` ≠ `role_runtime_session` (matriz expandible 1..*) | Diseño + UI | Diseño §22; UI §1.2; DATA-005; ROLE-001 | **Conservar** |
| R12 | Runtime 40 y 20 en grids separados keyed por `activity_runtime_run` | Diseño + UI | Diseño §5 Vistas 3–4; regla madre 40+20; UI §1.2; DATA-002/003 | **Conservar** |
| R13 | Gates B0/B2/B3/B7 + SEM + PST | UI + Diseño | UI §6 GateReadinessPanel; GATE-001; Diseño Vistas 3/4/8 + matrices B0–B7 / C01–C20 | **Conservar** |
| R14 | Capa 2.0/2.5/3.0 solo como descargas manuales disabled; no módulos vivos | Diseño + UI | Diseño Adenda 21.1–21.5 / SCOPE-01..07; UI §1.2; §7.4; DL-001; Adenda §17 | **Ajustar** (añadir taxonomía insumo/plantilla/resultado + etiquetas UI) |
| R15 | BPMN/Camunda gated por ACA Satisfied; aún disabled sin generador | Diseño + UI | Diseño excepción operativa + §21.3/21.7; UI PP-002; FX-09 | **Conservar** |
| R16 | Producción Paralela como línea operativa de plataforma (inventario/QA/export) | Diseño + UI | Diseño portada + §21; UI §1.2; PP-001 | **Ajustar** (hacer explícitos estados PP distintos en Downloads/trace; no solo filas “capa”) |
| R17 | Endpoints GET state / client-company-progress / user-functional-help / operational-trace / downloads | UI | §9.2 | **Conservar** |
| R18 | Envelope `{request_id, generated_at, contract_version, data, meta, errors}` + `X-EVE-Contract-Version: 1.0` | UI | §9.1; §9.5 | **Conservar** |
| R19 | Query params `case_id`, `user_id`, `role_runtime_session_id`, `activity_id`, `run_id`, `view` | UI | §9.4 (snake_case BFF). Nota: §3.2 usa camelCase URL sketch | **Ajustar** (BFF snake_case autoritativo; URL puede mapear) |
| R20 | POST manual-action / download-request stubs disabled | UI | §9.3 reserva `manual-actions` y `downloads/{artifactKey}/generate` + `.../file` | **Ajustar** (alinear nombres futuros a UI; stubs actuales pueden mapear sin habilitar) |
| R21 | No Supabase desde frontend; no service_role | UI | §1.3; §9 frontera; SEC-001/002 | **Conservar** |
| R22 | Conservar `consultant-control-panel-access.ts` y rutas BFF | UI | §3 compatibilidad guardas; §11.1; REPO-TBD §15.1 | **Conservar** (hecho de repo alineado a UI) |
| R23 | Eliminar UI legacy de 4 áreas en cutover; un solo swap | UI | §15.2 pasos 5–6; §15.3 | **Ajustar** (swap controlado; eliminar legacy **después** de ventana de estabilidad, no en el mismo instante del swap) |
| R24 | No feature-flag permanente de dos paneles | UI | §3 no `-v2` permanente; §15.2 sí permite flag temporal de cutover | **Ajustar** (permitir flag temporal de cutover; prohibir dual permanente) |
| R25 | Stack visual: no introducir `@mui/*`; usar admin existente | UI | §3 “Preservar … tema MUI”; §5.1 mapeo MUI; §15.1 Theme MUI = REPO-TBD | **Ajustar** (resolver REPO-TBD: si no hay MUI en repo, adaptar tokens del theme/admin existente; no inventar dependencia MUI sin aprobación) |
| R26 | Archivar SUP Final Objects Backbone | Diseño + UI | Diseño Vista 6 Objetos/Estados + Vista 7 PP; UI no lista SUP backbone como componente; absorbe en Downloads/Gates/trace | **Ajustar** (archivar componente legacy OK; **conservar** cobertura semántica Object[State]/PP vía Downloads + GateReadiness + trace, no “desaparecer” el concepto) |
| R27 | Fixture Ámbar + ledgers 40/20 | UI | §14 escenarios FX-01..FX-12; fixture separado | **Ajustar** (Ámbar = fixture repo; debe cubrir escenarios FX, no solo marca local) |
| R28 | Tests de aceptación listados en v2 | UI + Diseño | UI §16 + Adenda §21; Diseño §19 + §21.8 + §22.7 | **Ajustar** (ampliar checklist a IDs formales UI/DATA/GATE/PP/DL/SEC/ROLE/INIT/SCOPE) |
| R29 | Secuencia F1–F5 shell→models→observación→cutover→tests | UI | §3.1 F0–F5; §15.2 | **Ajustar** (añadir F0 baseline/REPO-TBD explícito; alinear F4/F5 con rollback) |
| R30 | Vista inicial = runtime u otra vista técnica | UI Adenda | §20 / INIT-001: Centro de casos + CaseReadinessSummary + CompanyUserRoleMatrix + alertas críticas | **Ajustar** (faltaba en v2; obligatorio en v3) |
| R31 | Alerta ROLE_ASSIGNMENT_GAP | Diseño + UI | Diseño §22.3 mixed_unresolved; UI Adenda §19 / ROLE-002 | **Ajustar** (faltaba en v2; obligatorio en v3) |
| R32 | StatusLegend + banda de estado (request_id, freshness, READ-ONLY) | UI | §4.1 banda; §4.3 STATUS BAR; UI-002; StatusLegend §6 | **Ajustar** (v2 nombró StatusLegend; faltaba status bar operativa) |
| R33 | loading.tsx / error.tsx con request_id | UI | §7.1 loading/fatal; §12 | **Conservar** |
| R34 | Intervención manual gobernada (reentry, aclaración, etc.) | Diseño | §13 permitidas; §14 prohibidas; §21.4 | **Conservar como contrato futuro** (UI las deja disabled en v1; Diseño las autoriza cuando exista endpoint auditado) |
| R35 | Vistas obligatorias Diseño 1–10 (Experiencia, Runtime, Base, Causal, Pre-runtime, Objetos, PP, B3/B7, Intervención, Auditoría) | Diseño | §5 | **Conservar como cobertura semántica** mapeada a vistas UI §4.2 (no 10 pantallas separadas obligatorias en nav) |
| R36 | Checkpoint git / tag / working tree | — | No está en DOCX | **Conservar como meta operativa de repo** (no requisito rector) |

---

## 3. Puntos del plan v2 bien sustentados

1. Reemplazo total en la misma ruta oficial; prohibición de cabina paralela `/v2`.
2. Frontera: observación/gobierno; no diagnóstico automático; no reescritura de evidencia; no service_role; no Supabase desde browser.
3. Modo inicial read-only con capabilities hard-disabled y reason codes exactos de la UI Spec.
4. Descomposición de componentes y nombres del shell (CaseHeader, SidebarNavigation, ControlPanelWorkspace, grids 40/20, GateReadinessPanel, DownloadsPanel, ManualActionDrawer, EvidenceDetailDrawer, AuditTrailPanel).
5. Jerarquía visible `user_id` ≠ `role_runtime_session` y tracking por `activity_runtime_run`.
6. Grids separados Base 40 / Causal 20; no cierre cosmético por conteo agregado empresa/caso.
7. Gates B0/B2/B3/B7 + SEM + PST en panel de readiness.
8. Capa 2.0/2.5/3.0 fuera de ejecución automática de plataforma.
9. Endpoints GET BFF existentes como superficie read-only v1.
10. Envelope versionado y header `X-EVE-Contract-Version: 1.0`.
11. Conservación de guardas de acceso y de stubs POST deshabilitados.
12. Criterio de no mezclar fixture simulado con producción.
13. Fuera de alcance: migraciones Supabase, generadores reales, automatización Capa 2/2.5/3.

---

## 4. Puntos del plan v2 que deben ajustarse

1. **Vista inicial (INIT-001):** al entrar sin `run` efectivo, abrir `cases` con CaseReadinessSummary + CompanyUserRoleMatrix + alertas críticas; no abrir Runtime 40/20 por defecto.
2. **ROLE_ASSIGNMENT_GAP:** mostrar en matrix/help/gates/audit según UI §19; estados `single_confirmed` / `multi_confirmed` / `mixed_unresolved` / etc.
3. **Taxonomía de descargas v1.1:** distinguir *insumo manual generado por plataforma*, *plantilla manual downstream* y *resultado manual externo* (este último no disponible sin módulo de carga). Etiquetas obligatorias del Diseño §21.5 (“Capa 2.0 — Excel manual”, etc.) y flag `non_automatic_execution_flag = true`.
4. **Producción Paralela:** explicitar secuencia fuente→candidato→inventario→IR→QA→export (PP-001), no solo filas “Capa X” en Downloads.
5. **Cutover:** permitir feature flag **temporal** o swap controlado con rollback (UI §3.1 F4 / §15.2); eliminar UI legacy solo tras ventana de estabilidad; no dual permanente.
6. **Status bar operativa:** además de StatusLegend, banda con READ-ONLY, freshness, warnings, `request_id`, capabilities.
7. **Nombres de endpoints futuros:** alinear contrato a `POST .../manual-actions` y `POST .../downloads/{artifactKey}/generate` + `GET .../file`; los stubs actuales `manual-action` / `download-request` se documentan como deuda de naming a resolver en implementación sin habilitar ejecución.
8. **Query params:** BFF usa snake_case (§9.4); el sketch camelCase de §3.2 se trata como alias de URL, no como contrato BFF.
9. **Theme/MUI:** resolver REPO-TBD: preservar theme admin existente; no introducir `@mui/*` salvo aprobación explícita si la inspección confirma ausencia de MUI. El “mapeo MUI” de §5.1 es guía de patrón, no mandato de dependencia nueva.
10. **Criterios de aceptación:** ampliar a IDs formales UI/DATA/GATE/PP/DL/SEC/AUD/A11Y/PERF/MIG + DL-002..004, ROLE-001/002, ACTION-001, INIT-001, SCOPE-01..07.
11. **Secuencia:** insertar **F0 Baseline/REPO-TBD** antes de F1; en F4 no borrar legacy hasta estabilidad.
12. **Cobertura Objetos/Estados MBA y Experiencia usuario:** no como componentes legacy; sí como datos/alertas dentro de cases/monitoring/gates/trace/downloads (mapeo Diseño §5 → UI §4.2).

---

## 5. Puntos inferidos o no sustentados por los DOCX

| Punto | Origen | Tratamiento en v3 |
|-------|--------|-------------------|
| Alias `/consultant/control-panel` | Repo actual | Conservar por compatibilidad; no citarlo como requisito rector |
| Lista exacta de archivos a conservar/reemplazar/eliminar | Inspección repo (UI marca REPO-TBD) | Conservar como plan de repo; validar de nuevo en F0 |
| Nombres legacy (`CaseCenterPanel`, `PanelChrome`, etc.) | Repo | Conservar como inventario técnico; no están en DOCX |
| Fixture “Cervecería Ámbar” | Repo | Conservar como fixture local; debe satisfacer FX-* |
| Colores `#f7f7f2` / CSS modules | Repo | Conservar lenguaje visual existente tras REPO-TBD |
| Checkpoint git / tag `checkpoint/ccp-replace-plan-2026-07-12` | Operativa conversación | Meta de rollback; no rector |
| “15 zonas/componentes” como número de test | Inferencia v2 | Sustituir por checklist de componentes UI §6 + UI-002 |
| Eliminación inmediata de legacy en el mismo commit del swap | Inferencia v2 más agresiva que UI §15.2 | Ajustada: estabilidad → luego eliminar |
| Absorción total de SUP backbone sin superficie Object[State] | Inferencia | Ajustada: archivar UI legacy, preservar semántica vía vistas/datos |

---

## 6. Plan v3 final (listo para aprobación)

### 6.1 Objetivo

Reemplazar por completo la pantalla activa en `/admin/consultant-control-panel` por el shell y view models de la Especificación UI v1.1, sustentados en el Diseño v2 RolFuncional, en modo **read-only** inicial, sin activar acciones manuales ni generadores reales, sin tocar Supabase ni `package.json`, y sin crear ruta paralela permanente.

### 6.2 Autoridad y frontera

- Plataforma operativa mostrada: **Capa 1.0 + Runtime 40+20 + Producción Paralela**.
- Downstream: **Capa 2.0 / 2.5 / 3.0** solo como insumos/plantillas descargables (disabled hasta generador autorizado).
- No diagnóstico final automático, no monetización, no reescritura de evidencia, no Ring 5 / reopen activation.
- Gate > acción manual; evidencia inmutable en UI.

### 6.3 Rutas e integración

| Elemento | Contrato v3 |
|----------|-------------|
| Ruta productiva | `/admin/consultant-control-panel` |
| Alias repo | `/consultant/control-panel` → redirect (compatibilidad; no rector) |
| Dual permanente / `-v2` | Prohibido |
| Cutover | Flag temporal **o** swap controlado con rollback probado |
| Eliminación legacy | Tras ventana de estabilidad (UI §15.2 paso 6) |

### 6.4 Archivos (inventario repo — validar en F0)

**Conservar (adaptar payload/contrato donde aplique):**
- `src/app/consultant/control-panel/page.tsx` (redirect)
- `src/services/eve/consultant-control-panel/consultant-control-panel-access.ts`
- Rutas BFF GET existentes bajo `src/app/api/eve/consultant/control-panel/{state,client-company-progress,user-functional-help,operational-trace,downloads}/`
- Stubs POST actuales (disabled) hasta realinear naming a UI §9.3 sin habilitar ejecución
- Policies JSON + boundary ledger
- Fixture Ámbar / ledgers (reshape a envelope + FX)

**Reemplazar:**
- `src/app/admin/consultant-control-panel/{page,loading,error}.tsx`
- `ConsultantControlPanel.tsx` + types/service + data contract + UI mapping + tests

**Eliminar del árbol activo tras estabilidad (archivar si aporta semántica):**
- Paneles legacy de 4 áreas (`CaseCenterPanel`, `ClientCompanyProgressPanel`, `FunctionalUserHelpPanel`, `EveOperationalTracePanel`, `ConsultantDownloadsPanel`, `ControlPanelFilters`, `AuditJustificationModal`, `PanelChrome` si queda huérfano)
- `SupFinalObjectsBackbonePanel` → archivar; cobertura Object[State]/PP vía Downloads + gates + trace

### 6.5 Componentes objetivo

```text
ConsultantControlPanel.tsx
  CaseHeader.tsx
  SidebarNavigation.tsx
  StatusLegend.tsx
  StatusBar.tsx                    # NEW explícito vs v2
  ControlPanelWorkspace.tsx
    CaseReadinessSummary.tsx       # vista inicial
    CompanyUserRoleMatrix.tsx      # vista inicial + ROLE_ASSIGNMENT_GAP
    CriticalAlertsStrip.tsx        # NEW: alertas críticas INIT-001
    FunctionalHelpPanel.tsx
    RuntimeRunTable.tsx
    Runtime40BaseGrid.tsx
    Runtime20CausalGrid.tsx
    GateReadinessPanel.tsx
    OperationalTraceTimeline.tsx
    DownloadsPanel.tsx             # taxonomía insumo/plantilla + PP states
    AuditTrailPanel.tsx
  EvidenceDetailDrawer.tsx         # read-only
  ManualActionDrawer.tsx           # visible; preview contractual; no submit prod
```

**Vista inicial (INIT-001):** `cases` = header + readiness + matrix + alertas críticas + status bar.  
**Nav keys:** `cases` | `functional-help` | `monitoring` | `runtime` | `trace` | `gates` | `downloads` | `audit`.

**Theme:** tokens del layout admin existente. No añadir `@mui/*` sin aprobación tras F0.

### 6.6 Capacidades iniciales

```ts
capabilities: {
  read: true,
  manual_actions: {
    enabled: false,
    reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE",
    allowed_actions: []
  },
  downloads: {
    enabled: false,
    reason_code: "AUTHORIZED_GENERATOR_NOT_AVAILABLE"
  }
}
```

ManualActionDrawer: preview contractual; **ACTION-001** — sin submit real ni handlers mock en producción.

### 6.7 BFF

| Endpoint | Uso v3 |
|----------|--------|
| `GET .../state` | Header, readiness, selected_context, runs, base_items[40], causal_items[20], gates, open_gaps, capabilities |
| `GET .../client-company-progress` | Árbol company/case/user/role_session/activity/run + assignment_status |
| `GET .../user-functional-help` | Separación funcional + recommended_next_step |
| `GET .../operational-trace` | Timeline paginada + audit cursor |
| `GET .../downloads` | Catálogo artefacts + eligibility + generator_status + labels de alcance |

Envelope común UI §9.5. Scope BFF snake_case. `include=summary|run-detail` (PERF-001: summary no carga 60 ítems de todos los runs).

**Futuros (disabled):** `POST .../manual-actions`; `POST .../downloads/{artifactKey}/generate`; `GET .../downloads/{artifactId}/file`.

### 6.8 Descargas y alcance

| Artefacto | Lectura v3 | UI inicial |
|-----------|------------|------------|
| Runtime audit XLSX/CSV | Insumo Capa 1.0 / Runtime | Visible disabled |
| EvidenceBundle Capa 2.0 | Insumo manual (no transduce) | Visible disabled |
| Workbook Capa 2.0/2.5/3.0 | Plantilla manual | Visible disabled / pending_manual |
| MDSB / candidates / facts / registries / IR | Producción Paralela operativa | Visible según estado; disabled sin generador |
| Camunda BPMN | PP export; ACA Satisfied | Visible disabled; eligibility blocked si ACA no Satisfied |
| Paquete de gaps | Insumo de reentry | Visible disabled |

Prohibido: botones “Ejecutar Capa 2.0/2.5” o “Generar diagnóstico Capa 3.0”. Badges: Operativo | Descargable manual | No implementado (SCOPE-05).

### 6.9 Multirrol

- Matrix expandible `user_id` → `role_runtime_session[]`.
- No fusionar runs entre roles.
- `ROLE_ASSIGNMENT_GAP` cuando haya `mixed_unresolved` o actividad/responsabilidad sin asignación estable.

### 6.10 Secuencia post-aprobación

1. **F0 Baseline:** screenshot/smoke actual, matriz REPO-TBD (theme, files, hooks, tests), tag/rollback.
2. **F1 Shell:** header, sidebar, status bar, legend, workspace vacío, capabilities, vista inicial.
3. **F2 Read model:** types/service/fixture → envelope + view models.
4. **F3 Observación:** matrix, help, runs, 40/20, gates, trace, downloads (taxonomía), audit, drawers, alerts.
5. **F4 Cutover:** flag temporal o swap; una sola pantalla activa; rollback probado.
6. **F5 Estabilización + tests:** regresión CCP + criterios formales; eliminar legacy del árbol activo; **no** habilitar F5 acciones/generadores reales.

### 6.11 Criterios de aceptación (verificación)

**Migración / ruta**
- [ ] UI-001 ruta bajo admin guard
- [ ] MIG-001 reemplazo misma ruta con rollback
- [ ] MIG-002 REPO-TBD completada antes de código productivo
- [ ] Alias repo = redirect (si se conserva)
- [ ] Sin UI legacy accesible tras estabilidad

**UI / modo**
- [ ] UI-002 header + sidebar + centro + drawer + status bar
- [ ] UI-003/004 read-only explícito; acciones/descargas disabled con reason_code
- [ ] INIT-001 vista inicial cases + readiness + matrix + alertas
- [ ] ACTION-001 ManualActionDrawer sin submit/mock prod

**Datos / runtime**
- [ ] DATA-001 effective_scope autoritativo
- [ ] DATA-002/003 exactamente 40 bases y 20 causales por run seleccionado (o error integridad)
- [ ] DATA-005 / ROLE-001 user ≠ role session
- [ ] ROLE-002 ROLE_ASSIGNMENT_GAP cuando aplique

**Gates / PP / downloads**
- [ ] GATE-001 B0/B2/B3/B7 + SEM + PST
- [ ] PP-001/PP-002 estados PP distintos; BPMN solo con ACA Satisfied
- [ ] DL-001..004 + SCOPE-01..07 taxonomía y etiquetas manuales
- [ ] Downloads capability false; sin stream real

**Seguridad**
- [ ] SEC-001/002 no Supabase browser / no service_role
- [ ] SEC-003 selector fuera de scope → 403
- [ ] Cliente bloqueado (`x-eve-surface: client` / access assert)

### 6.12 Riesgos (actualizados)

| Riesgo | Mitigación |
|--------|------------|
| Debilitar guardas anti-cliente | Reusar access.ts sin cambios de frontera |
| Reactivar manual/downloads | Capabilities false + ACTION-001 + tests |
| Confundir Capa 2/2.5/3 con ejecución | Etiquetas Diseño §21.5 + taxonomía UI §17 |
| Fusionar user y role | Matrix + ROLE_* + tests DATA-005 |
| 40/20 cosmético | Grids por run; DATA-002/003 |
| Introducir MUI no existente | F0 confirma theme; no nueva dependencia sin aprobación |
| Borrar legacy antes de rollback | F4 swap; F5 elimina tras estabilidad |
| Inferir requisitos solo de repo | Esta v3 ancla cada requisito a DOCX o lo marca REPO |

---

## 7. Confirmaciones

- **Dictamen:** el plan de reemplazo total en la misma ruta queda **revalidado contra ambos DOCX** y listo para aprobación. Los ajustes de la §4 deben incorporarse en la implementación; no son opcionales de alcance.
- **No se ejecuta implementación** hasta nueva aprobación explícita.
- **No se modificó código.**
- **No se eliminaron archivos de producto.**
- **No se cambiaron rutas, `package.json`, dependencias ni Supabase.**
- Único entregable de esta pasada: este documento `consultant_control_panel_replacement_plan_v3_validated.md` (el plan v2 permanece intacto como base histórica).
