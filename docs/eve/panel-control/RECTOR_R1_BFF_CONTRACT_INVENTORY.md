# R1 — Inventario de contratos BFF (oficial)

**Fecha:** 2026-07-20  
**Autoridad:** `corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`  
**Plan:** `RECTOR_POINTS_18_25_IMPLEMENTATION_PLAN.md` — tramo R1  
**Capa canónica:** **Opción B — adaptador tipado en servicio** (`src/services/eve/official-control-panel/official-control-panel-contract-*.ts`). Los payloads HTTP de éxito conservan shape de dominio; errores normalizan `requestId`.

**Alias de scope:** rector `engagementId` ≡ producto `relationshipId` (documentado en `SCOPE_ALIAS_NOTES`; no se duplican como identidades distintas).

---

## Resumen de decisión

| Tema | Decisión |
|------|----------|
| Contrato canónico | Opción B — normalización en frontera cliente/servicio **en producción** |
| Wire HTTP éxito | Conservado |
| Wire HTTP error | `requestId` en todos los BFF |
| Experiencia | `getCaseExperienceState` → `adaptExperienceStateToEnvelope` |
| Empresa | `composeCompanyControlPanelVM` en `OfficialControlPanelShell` |
| Participantes | `composeParticipantMonitoringList` en `use-case-participants` |
| Freshness | factual timestamps only; never `generatedAt` as source |
| Próximo evento | sin invención; null → No disponible |
| company-state HTTP | No creado |
| Dictamen | **APTO** — consumo canónico VM + compuertas A/B reejecutadas |

---

## Catálogo de rutas

Base: `/api/eve/official-consultant-control-panel`

| Ruta | Método | Selectores recibidos | Scope validado | Effective scope (vía adaptador) | Servicio / repo | Shape éxito | requestId | timestamps | data status | capabilities | errores | Consumidores | Pruebas A/B |
|------|--------|----------------------|----------------|---------------------------------|-----------------|-------------|-----------|------------|-------------|--------------|---------|--------------|-------------|
| `/client-companies` | GET | (auth) | consultor→empresas | N/A lista | context-repository | `ClientCompany[]` | error+logs | — | implícito | — | auth/500+requestId | `use-client-context` | access e2e |
| `/client-companies/:companyId/relationships` | GET | companyId | assert company | companyId | context-repository | relationships[] | sí (error) | — | — | — | 403/500 | context hook | access A/B |
| `/relationships/:relationshipId/cases` | GET | relationshipId | assert rel | relationshipId | context-repository | cases[] | sí | — | — | — | 403/500 | context hook | access A/B |
| `/cases/:caseId/core-milestones` | GET | caseId | case∈rel∈company | case+company+rel | core-milestone service | `CoreMilestoneAxisResponse` | sí | — | item.dataStatus | — | 403/500 | `use-case-core-milestones` | point 8–9 |
| `/cases/:caseId/support-processes` | GET | caseId | idem | idem | support-process service | `SupportProcessAxisResponse` | sí | — | item.dataStatus | — | 403/500 | support UI | point 7 |
| `/cases/:caseId/process-structure` | GET | caseId | idem | idem | process-structure | structure VM | sí | — | — | — | 403/500 | tracking | point 13 |
| `/cases/:caseId/participants` | GET | caseId | monitoring access | case | participants | list | sí | — | — | — | 403/500 | monitoring | point 10 |
| `/cases/:caseId/participants/:participantId/profiles` | GET | case+participant | monitoring | +user | participants | profiles | sí | — | — | — | 403/500 | monitoring | point 10 |
| `/cases/:caseId/monitoring/users` | GET | caseId | monitoring | case | monitoring-service | `MonitoringUsersResponse` | sí | — | counts null≠0 | — | 403/500 | monitoring | point 10 |
| `/cases/:caseId/monitoring/users/:participantId/roles` | GET | case+participant | monitoring | +user | monitoring | roles | sí | — | — | — | 403/500 | monitoring | point 10 |
| `/cases/:caseId/monitoring/roles/:profileId/sessions` | GET | case+profile | monitoring | +role sessions | monitoring | sessions | sí | — | — | — | 403/500 | monitoring | point 10 |
| `/cases/:caseId/monitoring/roles/:profileId/activities` | GET | case+profile(+session) | monitoring | +RRS | monitoring | activities | sí | — | linkStatus | — | 403/500 | monitoring | point 10 |
| `.../activity-selection` | GET | full runtime path | runtime scope | full chain | activity-selection | coverage | sí | — | dataStatus | — | 403/500 | runtime UI | point 11 |
| `.../runtime/base-matrix` | GET | full path | `authorizeRuntimeMatrixScope` | full | runtime-matrix | base matrix | sí | — | dataStatus | — | 403/500 | RuntimeActivityMatrixPanel | point 12 |
| `.../runtime/base/:baseId` | GET | +baseId | idem | idem | runtime | cell | sí | — | — | — | 403/500 | matrix | point 12 |
| `.../runtime/causal-matrix` | GET | full path | idem | idem | runtime | causal | sí | — | dataStatus | — | 403/500 | matrix | point 12 |
| `.../runtime/causal/:causalId` | GET | +causalId | idem | idem | runtime | cell | sí | — | — | — | 403/500 | matrix | point 12 |
| `.../runtime/control-state` | GET | full path | idem | idem | runtime-control | control | sí | — | dataStatus | — | 403/500 | matrix | point 12 |
| `/cases/:caseId/manual-work` | GET | caseId | case access | case | manual-work service | tracking VM | sí + logs | generatedAt | available/partial/empty | — | 403/500 | ManualWorkPanel | point 13 |
| `/cases/:caseId/parallel-production` | GET | caseId | case access | case | PP service | PP VM | sí + logs | generatedAt | available/empty/partial | — | 403/500 | ParallelProductionPanel | point 14 |
| `/cases/:caseId/experience-state` | GET | caseId + query user/role/activity/screen | support-process access | company+rel+case (+filters) | experience service | ExperienceState + companyState | error+logs; envelope vía adapt | generatedAt | empty/available/partial/error → canonical available for empty | experience caps | requestId en errores | ExperienceGovernance + KPI | 15–17 |
| `/cases/:caseId/experience-actions` | POST | caseId + body | access + policy | case | experience repo | ack | sí | — | — | action capability | 4xx/5xx+requestId | experience actions | 15–16 |
| `/cases/:caseId/experience-events` | POST | caseId + body | access | case | experience | ack | sí | — | — | — | 4xx/5xx+requestId | instrumentation | 15 |

---

## Tipos canónicos (servicio)

| Tipo | Archivo |
|------|---------|
| `RequestedControlPanelSelectors` / `EffectiveControlPanelScope` | `official-control-panel-contract.types.ts` |
| `PanelDataAvailability` | idem |
| `OfficialPanelScreenState` | idem |
| `FreshnessVM` | idem |
| `OfficialPanelErrorVM` / `OfficialPanelEnvelope<T>` | idem |
| `CompanyControlPanelVM` | idem + `contract-compose.ts` |
| `ParticipantMonitoringVM` | idem + `contract-compose.ts` |
| `OfficialControlPanelCapability` / `CapabilityVM` | types + `capability-catalog.ts` |

---

## Consumidores productivos (obligatorio R1 corrección)

| Función | Archivo productivo |
|---------|-------------------|
| `adaptExperienceStateToEnvelope` | `src/features/.../data/client-context-api.ts` |
| Envelope → screenState/dataStatus/freshness/capabilities | `src/features/.../hooks/use-case-experience-state.ts` |
| `composeCompanyControlPanelVM` | `src/features/.../components/OfficialControlPanelShell.tsx` |
| `composeParticipantMonitoringList` | `src/features/.../hooks/use-case-participants.ts` |
| `ParticipantMonitoringVM[]` | `src/features/.../components/CaseParticipantsPanel.tsx` |

## sourceObservedAt (experiencia)

Último timestamp válido entre:

- `trajectory[].occurredAt`
- `supportQueue[].createdAt`
- `users[].lastActivityAt`

Ausencia → `null` + freshness `unknown`.


---

## Pruebas de contrato R1

`tests/regression/consultant-control-panel/official-control-panel-r1-bff-contracts.test.mjs` (ejecutar con `npx tsx --test`).

Seguridad A/B real: `tests/e2e/official-consultant-access-login-panel.spec.ts` y specs rector existentes (**sin** `page.route().fulfill()` para seguridad).
