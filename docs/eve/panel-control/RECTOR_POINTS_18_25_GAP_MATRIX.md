# Matriz de gaps — Rector §§18–25 (corregida)

**Autoridad única:** `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` (v1.0)  
**Manifiesto:** `docs/eve/panel-control/corpus/CORPUS_MANIFEST.md`  
**Ruta oficial:** `/admin/official-consultant-control-panel`  
**Legacy congelado:** `/admin/consultant-control-panel`  
**Excluido:** `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx`  
**Fecha:** 2026-07-21 (R3: partial aislado + drawer `attentionComplete` canónico; §§15–17 residual bloquea promoción)

### Escala

IMPLEMENTADO LITERALMENTE · IMPLEMENTADO POR COMPONENTE EQUIVALENTE · ABSORBIDO SIN PÉRDIDA DE RESPONSABILIDAD · PARCIAL · AUSENTE · INCONSISTENTE · TEST-ONLY REAL Y EVIDENCIADO · CUBIERTO POR ESCENARIO EQUIVALENTE · MOCK — NO CUMPLE · AUSENTE — PENDIENTE · NO APLICA POR REGLA EXPLÍCITA DEL RECTOR · PASS EVIDENCIADO · FAIL · PENDIENTE · IMPLEMENTADA SIN BRECHA · IMPLEMENTADA CON BRECHAS RESIDUALES

---

## R0 — Resoluciones de conformance (requisitos no opcionales)

### ExperienceSummary

| Columna | Contenido |
|---------|-----------|
| **Requisito rector** | Nodo `ExperienceSummary` bajo `ExperienceGovernanceMode` (§18) — resumen factual del modo Experiencia |
| **Responsabilidad arquitectónica** | Presentar lectura agregada de experiencia (estado/alertas/cobertura) sin diagnóstico |
| **Implementación real equivalente** | `ClientCompanyKpiStrip` KPI «Alertas de experiencia»; texto «Estado Empresa Cliente» en `ExperienceGovernanceMode`; agregación §17 en `experience-state` |
| **Archivos** | `ClientCompanyKpiStrip.tsx`, `ExperienceGovernanceMode.tsx`, `company-state-presentation.ts`, `official-control-panel-company-state-aggregation.ts` |
| **BFF o fuente factual** | `GET .../experience-state` → `companyState` + `experienceAlertCount` |
| **Prueba** | `official-consultant-control-panel-rector-points-15-17.spec.ts`; `experience-governance-correction.spec.ts` |
| **Evidencia** | Capturas 15–17; Amber KPI `0` / `—` |
| **Dictamen de conformance** | **ABSORBIDO SIN PÉRDIDA DE RESPONSABILIDAD** (sin componente con nombre literal) |
| **Acción residual** | Ninguna funcional obligatoria; si se exige superficie dedicada con título «Resumen», tramo R2 solo por pérdida demostrada (hoy no) |

### ControlPanelStatusBar

| Columna | Contenido |
|---------|-----------|
| **Requisito rector** | Pie `ControlPanelStatusBar` (§18) — metadatos de autoridad/operación del panel |
| **Responsabilidad arquitectónica** | Exponer degradación, freshness, autoridad, capabilities, errores y request reference cuando aplique — **sin** códigos técnicos productivos |
| **Implementación real equivalente** | Degradación: snapshots `data-shell-*` + paneles empty/partial/error; freshness parcial vía `refreshing` en hitos; autoridad: SSR/middleware/BFF; capabilities: payload experiencia (no pie); errores: `OfficialControlPanelErrorState`; request_id: logs server (`logOfficialPanelEvent`), no UI |
| **Archivos** | `OfficialControlPanelStatusBar.tsx` (huérfano); `OfficialControlPanelShell.tsx`; `OfficialControlPanelErrorState.tsx`; hooks ejes; observability service |
| **BFF o fuente factual** | Headers/errores BFF; logs `requestId` |
| **Prueba** | unit1 error/retry; access SSR; **no** hay e2e que exija pie técnico |
| **Evidencia** | Corrección visual retiró barra técnica del shell |
| **Dictamen de conformance** | **PARCIAL** |
| **Acción residual** | R1/R3: superficie no técnica para freshness + request reference en fatal; **no** restaurar `effective_scope` / `ready-empty` / `unit-1-shell` |

### company-state

| Columna | Contenido |
|---------|-----------|
| **Requisito rector** | `GET .../company-state` — cabecera, KPIs, participación y atención (§19.1) |
| **Responsabilidad arquitectónica** | Vista agregada de empresa/caso para lectura superior |
| **Implementación real equivalente** | Composición BFF: `client-companies` + `relationships` + `cases` + `core-milestones` + `support-processes` + `experience-state` (`companyState`) + KPI strip + Attention drawer |
| **Archivos** | rutas bajo `src/app/api/eve/official-consultant-control-panel/`; `ClientCompanyKpiStrip.tsx`; `AttentionGovernancePanel.tsx` |
| **BFF o fuente factual** | Múltiples GET autenticados; agregación §17 en experience-state |
| **Prueba** | unit2b; 7; 8–9; 15–17; access A/B |
| **Evidencia** | Capturas cabecera + KPI + Atención |
| Dictamen de conformance | **ABSORBIDO SIN PÉRDIDA DE RESPONSABILIDAD** — R1: `CompanyControlPanelVM` canónico en shell vía `presentCompanyStateFromVm`; **sin** facade HTTP nueva |
| **Acción residual** | Ninguna en R1; UI de degradación residual → R3 |

### manual-actions

| Columna | Contenido |
|---------|-----------|
| **Requisito rector** | `POST .../manual-actions` — acciones manuales auditadas (§19.1); capabilities `manage_manual_work`, `accept_manual_output` (§20.1); FX-08 |
| **Responsabilidad arquitectónica** | Mutar tracking P-SUP-03/04/05 con auditoría gobernada |
| **Implementación real equivalente** | Ver estratificación §13 abajo |
| **Archivos** | point13 + R2 (`20260720100000`, `20260720110000`); BFF `manual-actions/route.ts`; `official-control-panel-manual-actions.ts`; verifier/seed/rollback R2 |
| **BFF o fuente factual** | Lectura BFF sí; mutación producto vía POST → RPC autenticado `eve_apply_manual_work_product_action_as_consultant` |
| **Prueba** | point-13 e2e; regresión `official-control-panel-rector-r2-manual-actions.test.mjs`; FX-08 seed (starting state) |
| **Evidencia** | reports/local/rector-r2-manual-actions; reports/local/rector-r2-fx08 |
| **Dictamen de conformance** | **PARCIAL → R2 código cerrado; compuertas E2E/capturas pendientes** — BFF/UI/RPC/grants implementados; verifier local `ok: true`; FX-08 seed starting-state |
| **Acción residual** | Completar Playwright FX-08 + capturas 01–09 + regresión plena para dictamen APTO |

---

## §13 — Procesos manuales P-SUP-03 / 04 / 05 (estratificación)

| Estrato | Estado | Evidencia factual | Brecha exacta |
|---------|--------|-------------------|---------------|
| Persistencia | **Implementado** | `manual_process_work_item`, `_event`, reglas, write_control (migraciones 010000–030000) | — |
| RPC y transición | **Implementado** | `eve_apply_manual_work_transition`; reglas `not_ready→…→accepted`; terminal `accepted` | EXECUTE solo `service_role` |
| BFF de lectura | **Implementado** | `GET .../cases/[caseId]/manual-work` | — |
| BFF de acción | **Implementado (R2)** | `POST .../manual-actions` JWT → wrapper autenticado | Capturas/Playwright FX-08 pendientes |
| UI de seguimiento | **Implementado** | `ManualWorkPanel` (tracking): estados, timeline, overdue, badge MANUAL | — |
| UI de acción | **Implementado (R2)** | Botones/`drawer` desde `availableActions` server-side | Degradación visual stale → R3 |
| Capabilities | **Implementado (R2)** | Grants `eve_consultant_panel_capability_grant` + matriz BFF | — |
| Auditoría | **Implementado** | Eventos append-only + idempotency + request_id | — |
| Pruebas | **Parcial** | Regresión R2 estática PASS; verifier `ok:true`; FX-08 seed | Happy-path E2E UI→BFF→RPC pendiente |

**Formulación de brecha residual R2:** Código de producto cerrado; falta evidencia E2E/capturas para dictamen APTO.

**No se afirma** APTO a producción hasta compuertas §17 R2.

---

## §18 — Componentes (resto)

| Componente rector | Equivalente | Dictamen | Brecha / tramo |
|-------------------|-------------|----------|----------------|
| ConsultantControlPanelPage | page + OfficialControlPanelShell | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| ControlPanelGlobalHeader | ClientCompanyHeader | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| CompanyCaseHeader | ClientContextSelector | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| ObservationModeSwitch | OfficialControlPanelModeSwitch | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| CompanySubviewTabs | WorkspaceSubnav | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | Alias `tracking`≡follow_up (R0 doc) |
| ProcessAxisBar | SupportProcessAxis | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| CoreMilestoneRail | CoreMilestoneRail | IMPLEMENTADO LITERALMENTE | — |
| CompanyOverview | KPI + workspace | ABSORBIDO SIN PÉRDIDA + VM tipado (R1) | R3 visual si aplica |
| ParticipantMonitoringTable | CaseParticipantsPanel desde `ParticipantMonitoringVM[]` | IMPLEMENTADO POR COMPONENTE EQUIVALENTE + consumo canónico R1 | — |
| RoleMonitoringAccordion | FunctionalProfileList | ABSORBIDO SIN PÉRDIDA DE RESPONSABILIDAD | R3 a11y pattern |
| ActivityRuntimePanel | ActivityRuntimePanel + matrices | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| ManualWorkPanel | ManualWorkPanel | IMPLEMENTADO LITERALMENTE (seguimiento) | R2 acciones |
| ParallelProductionPanel | ParallelProductionPanel | IMPLEMENTADO LITERALMENTE | — |
| AttentionDrawer | AttentionGovernancePanel | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | Consume `attentionComplete` canónico (sin derivación paralela desde sourceStates) |
| ExperienceGovernanceMode + Tabs/Matrix/Health/Queue/ActionDrawer | mismos nombres | IMPLEMENTADO LITERALMENTE / EQUIVALENTE | — |
| ExperienceSummary | ver R0 | ABSORBIDO SIN PÉRDIDA | — |
| ControlPanelStatusBar | ver R0 | PARCIAL (contrato freshness/requestId listo; UI no técnica → R3) | R3 |
| Material UI cosmética | CSS propio | NO APLICA POR REGLA EXPLÍCITA DEL RECTOR §18 (MUI es sugerido; brecha solo por comportamiento faltante — §18.1 tabla «MUI sugerido», no mandato de librería) | — |

### URL (§18.2)

Parámetros oficiales ABSORBIDOS respecto al ejemplo rector (`company`/`case`/`mode`/`view`/`process`/`milestone`/depth). Refresh/back/normalización: IMPLEMENTADO POR COMPONENTE EQUIVALENTE (pruebas unit1, 8–9).

---

## §19 — BFF / VMs / datos

| Endpoint rector | Real | Dictamen | Tramo |
|-----------------|------|----------|-------|
| company-state | composición multi-GET + §17 + `composeCompanyControlPanelVM` | ABSORBIDO SIN PÉRDIDA (R1 tipado) | — |
| process-axis | support-processes | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| core-milestones | core-milestones | IMPLEMENTADO LITERALMENTE (path oficial) | — |
| participants | participants + monitoring/* | IMPLEMENTADO POR COMPONENTE EQUIVALENTE | — |
| manual-work GET | manual-work | IMPLEMENTADO LITERALMENTE | — |
| parallel-production | parallel-production | IMPLEMENTADO LITERALMENTE | — |
| experience-state | experience-state | IMPLEMENTADO LITERALMENTE | — |
| experience-actions POST | experience-actions | IMPLEMENTADO LITERALMENTE | — |
| manual-actions POST | `manual-actions/route.ts` | IMPLEMENTADO (R2); compuertas pendientes | R4 FX-08 assert |
| control_panel_projection | composición on-read | ABSORBIDO SIN PÉRDIDA DE RESPONSABILIDAD (R1 documentado) | — |

Scope común: R1 tipó `RequestedControlPanelSelectors` / `EffectiveControlPanelScope` (alias `engagementId`≡`relationshipId`).  
Registros `experience_*` / `manual_process_work_item`: IMPLEMENTADO LITERALMENTE.

---

## §20 — Seguridad / auditoría / a11y

| Control | Dictamen | Tramo |
|---------|----------|-------|
| Acceso consultor SSR/middleware/BFF | IMPLEMENTADO LITERALMENTE | — |
| Sin service_role browser / sin DB directa | IMPLEMENTADO LITERALMENTE (SEC-001) | — |
| Scope BFF | IMPLEMENTADO LITERALMENTE | — |
| Auditoría experience-actions | IMPLEMENTADO LITERALMENTE | — |
| Auditoría manual mutación producto | PARCIAL (DB sí; BFF/UI no) | R2 |
| Capabilities mapa §20.1 | R1 tipado + deny-by-default; mutaciones manuales denied hasta R2 | R2 habilitar circuito |
| Adjuntos checksum/version | AUSENTE — PENDIENTE (si H0/R2 confirma alcance adjuntos) | R2 |
| Teclado / color+texto / focus return | PARCIAL (focus drawer evidenciado) | R3/R4 A11Y-001 |

---

## §21 — Carga / error / degradación

| Estado | Dictamen | Tramo |
|--------|----------|-------|
| loading | **R3 IMPLEMENTADO** (skeleton + aria-busy) | R3 cerrado |
| refreshing | **R3 IMPLEMENTADO** (notice + snapshot) | R3 cerrado |
| ready | IMPLEMENTADO LITERALMENTE | — |
| partial | **R3 IMPLEMENTADO** (única secundaria: experience 503; precondiciones `ready` estrictas; E2E `03-partial`) | R3 cerrado (promoción bloqueada por residual §§15–17) |
| stale (UI + disable mutaciones) | **R3 IMPLEMENTADO** (manual + soporte) | R3 cerrado |
| forbidden | **R3 IMPLEMENTADO** (Consultor B real → caso A; UI final sin loading; sin fulfill) | R3 cerrado |
| not_found / vacíos 21.1 | **R3 IMPLEMENTADO** (hijo inexistente en caso A autorizado → 404 real) | R3 cerrado |
| fatal + request reference UI | **R3 IMPLEMENTADO** (`requestId` BFF) | R3 cerrado |
| aggregationComplete | **R3 IMPLEMENTADO** como `PanelAggregationCompleteness` por superficie; drawer usa `attentionComplete` | R3 cerrado |
| partial ≠ available | **R3 IMPLEMENTADO** (solo `available` completa) | R3 cerrado |
| independencia subvista | **R3 IMPLEMENTADO** (completitud ≠ tab Monitoreo/Seguimiento/Gobernanza) | R3 cerrado |
| mobile sin overflow global | **R3 IMPLEMENTADO** (390×844 + geometría Playwright) | R3 cerrado |

---

## §22 — Fixtures FX-01…FX-12

| ID | Precondición | Datos test-only | Acción | Resultado esperado | Prueba existente | Evidencia | Clasificación | Brecha | Tramo |
|----|--------------|-----------------|--------|--------------------|------------------|-----------|---------------|--------|-------|
| FX-01 | Empresa saludable 1 caso, 10 usuarios, H0–H2, sin blockers | No hay seed canónico con esa cardinalidad | Abrir panel | Lectura agregada estable | Amber/OpVal parcial | capturas Amber vacío / OpVal | **PARCIAL** | Falta seed+assert 10 usuarios H0–H2 | R4 |
| FX-02 | 1 user, 2 role_runtime_session | Seeds OpVal / participantes parciales | Drill user→roles | Roles separados | tramo-r2b parcial | capturas R2 | **PARCIAL** | Fixture dedicado + assert 2 sesiones | R4 |
| FX-03 | Selección ≤8 | No seed FX panel | Ver no-primarias/contexto | non_competitive_inclusion | Docs point-11; sin e2e FX | addendum | **AUSENTE — PENDIENTE** | Fuente factual + seed + e2e | R4 (deps R2 si falta BFF) |
| FX-04 | Selección >8 | Idem | Máx 8 slots + reasons | competitive_selection | Idem | addendum | **AUSENTE — PENDIENTE** | Idem | R4 |
| FX-05 | WorkMap coverage gap | No seed | Usuario detenido pre-Significado | Alerta/gap visible | — | — | **AUSENTE — PENDIENTE** | Seed + assert | R4 |
| FX-06 | Ruta B2 faltante | Matrices parciales | Ver bloqueo ruta | blocked_by_missing_canonical_route | point-12 parcial | parcial | **PARCIAL** | Seed dedicado + assert literal | R4 |
| FX-07 | Feedback B3 | — | C09 abierta / receiver_feedback | Separación visible | — | — | **AUSENTE — PENDIENTE** | Seed + assert | R4 |
| FX-08 | P-SUP-03 ready→submitted→accepted | `seed-fx08-manual-actions-test.mjs` (starting state) | Transiciones vía UI→BFF→RPC | Ciclo completo | regresión R2 estática; e2e producto pendiente | reports/local/rector-r2-fx08 | **PARCIAL** | Falta e2e Playwright ciclo producto + verifier ok | R2/R4 |
| FX-09 | P-SUP-06 rework ACA WithFindings | seed-point14 | Ver rework | Vuelve a PP | point-14 parcial | reports 14 | **PARCIAL** | Assert FX-09 explícito | R4 |
| FX-10 | Export bloqueado ACA≠Satisfied | seed-point14 | Intentar export | Bloqueado | point-14 parcial | docs 14 | **PARCIAL** | Assert FX-10 explícito | R4 |
| FX-11 | Experiencia blocked + mensaje/resume | seed-point15-17 | Acción gobernada | Soporte auditado | 15–17 e2e | reports 15–17 | **TEST-ONLY REAL Y EVIDENCIADO** | — | — |
| FX-12 | Final alternativo ClosedWithoutSufficiency/Cancelled | — | Ver estado final | Alternativo visible | — | — | **AUSENTE — PENDIENTE** | Seed + assert | R4 |

Ningún FX se clasifica MOCK como cierre. Amber no se pobla para cumplir FX.

---

## §22.1 — Criterios de aceptación (matriz)

| ID | Texto rector | Implementación | Prueba + | Prueba − | Captura | Estado | Brecha | Tramo |
|----|--------------|----------------|----------|----------|---------|--------|--------|-------|
| CP-001 | Abre en Empresa Cliente | mode default client-company | unit1 | — | sí | PASS EVIDENCIADO | — | — |
| CP-002 | X sin Y; Y sin X | ejes independientes | 7, 8–9 | — | sí | PASS EVIDENCIADO | — | — |
| CP-003 | Intersección no inventa dependencia | Xy panels | 8–9 | — | sí | PASS EVIDENCIADO | — | — |
| CP-004 | P-SUP-01 visible | SupportProcessAxis | point-7 | — | sí | PASS EVIDENCIADO | — | — |
| CP-005 | P-SUP-03/04/05 badge MANUAL | ManualWorkPanel | point-13 | — | sí | PASS EVIDENCIADO | Assert e2e por código proceso | R4 |
| CP-006 | Sin alcanzado sin aceptación auditada | UI no marca alcanzado; RPC auditada | point-13 | — | sí | PASS EVIDENCIADO (vía ausencia UI mutación + regla DB) | Si R2 expone UI, revalidar | R2/R4 |
| CP-007 | Jerarquía user→rol→actividad | monitoring | r2b / 10–11 | B deny | sí | PASS EVIDENCIADO | — | — |
| CP-008 | No fusionar usuarios y roles | listas separadas | r2b | — | sí | PASS EVIDENCIADO | — | — |
| CP-009 | No primarias visibles como contexto | selection coverage | point-11 parcial | — | parcial | PARCIAL | FX-03/04 | R4 |
| CP-010 | B0.5 y B1..B7 individuales | runtime matrices | point-12 | — | sí | PARCIAL | Assert cobertura bloques | R4 |
| CP-011 | Readiness prevalece sobre % | control-state / PP | 12/14 | — | parcial | PARCIAL | Assert formal | R4 |
| CP-012 | Conformance antes consistency | PP | point-14 | — | parcial | PARCIAL | FX-09 | R4 |
| CP-013 | P-SUP-09 bloqueado si ACA no Satisfied | PP | point-14 | — | parcial | PARCIAL | FX-10 | R4 |
| UX-001 | Trayectoria pantallas visibles/checkpoints | UserJourneyMatrix | 15–17 | — | sí | PASS EVIDENCIADO | — | — |
| UX-002 | Soporte sin editar respuestas | SupportActionDrawer | 15–17 | — | sí | PASS EVIDENCIADO | Assert no leak respuestas | R4 |
| UX-003 | Intervención exige capability + audit_ref | experience-actions | 15–17 | deny cap | sí | PASS EVIDENCIADO | — | — |
| UX-004 | Tiempo/abandono ≠ diagnóstico | copy + reglas | 15–17 | — | sí | PASS EVIDENCIADO | — | — |
| SEC-001 | Frontend sin service_role ni DB directa | browser client + BFF | staging-gate, ssr | — | — | PASS EVIDENCIADO | — | — |
| A11Y-001 | Estados con texto e icono | labels textuales; iconos parciales | unit1 foco | — | parcial | PARCIAL | Checklist formal | R3/R4 |

---

## §23 — Fases

| Fase rectora | Implementación realizada | Evidencia | Brecha residual | Tramo que la cierra |
|--------------|--------------------------|-----------|-----------------|---------------------|
| 0 Inspección | Inventarios + esta matriz | docs | Mantener actualizada | R0/R5 |
| 1 Shell y lectura | Units 1–4, modos, X/Y | e2e/regresión | StatusBar PARCIAL; tipografía no bloqueante | R1/R3 |
| 2 Recursión | §§10–12 | point-10–12 | FX-03…07; CP-009…011 | R4 |
| 3 Manualidad | Persistencia+RPC+GET+UI seguimiento | point-13 | BFF/UI acción + caps | R2/R4 |
| 4 Producción Paralela | Panel+BFF | point-14 | FX-09/10 asserts | R4 |
| 5 Experiencia RO | Instrumentación+modo | 15–17 | — | — |
| 6 Intervenciones | experience-actions | 15–17 | — | — |
| 7 Hardening | parcial (SSR, logs, a11y drawer) | access, unit1 | stale/fatal/a11y formal/contratos | R1→R3→R4→R5 |

**Conclusión §23:** Las fases 0–6 están **mayoritariamente implementadas, con brechas residuales identificadas**. El trabajo dominante corresponde a **Fase 7 — Hardening**, **sin ocultar** brechas funcionales previas (manual-actions producto, fixtures, capabilities tipadas, StatusBar freshness/request reference) que aún deben cerrarse.

---

## §24 / §25

| Ítem | Estado | Tramo |
|------|--------|-------|
| Trazabilidad decisión→impl→prueba→evidencia | PARCIAL | R5 |
| Pregunta 1 Empresa | PARCIAL | R1/R5 |
| Pregunta 2 Usuario/rol | PASS operativo | R4 FX-02 |
| Pregunta 3 Actividad/proceso | PASS operativo | R4 |
| Pregunta 4 Evento/acción | PARCIAL | R2/R3/R5 |

---

## Inventario de brechas → tramos

| Brecha | Tramo |
|--------|-------|
| Conformance StatusBar / company-state tipado / manual-actions estratificado / ExperienceSummary | R0 |
| Contratos BFF, VMs, dataStatus stale/unavailable, capabilities naming, freshness, errores | R1 |
| POST manual-actions + UI acción + caps; adjuntos si aplica; proyección si pérdida demostrada | R2 |
| loading/refreshing/partial/stale/forbidden/not_found/fatal/vacíos/retry/request reference | R3 |
| FX-01…12 + CP/UX/SEC/A11Y residuales | **R4 INICIADO — BLOQUEADO** (baseline+provision 12/12; e2e/capturas/gaps 03–06 pendientes) |
| §24 + §25 + dictamen cierre | R5 |
