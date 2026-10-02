# EVE ORGANISM REPO TECHNICAL INVENTORY V1

## 1. Dictamen

INVENTORY_READY_WITH_GAPS_FOR_ACTIVATION_CONTRACT_AND_AUTHORITY_MAP

Este inventario es factual y observado desde el repositorio. No declara que el organismo EVE pueda activarse productivamente. Su funcion es dejar listo el material para disenar:

- EVE-ORGANISM-CONTROLLED-ACTIVATION-CONTRACT-V1
- EVE-ORGANISM-WIRING-AND-AUTHORITY-MAP-V1

## 2. Roots

- repo_root: `C:/Users/migue/Documents/Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone`
- platform_root: `C:/Users/migue/Documents/Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone/external-consumers/eve-platform`

## 3. Stack observado

- framework: Next.js 16.2.5 / React 19.2.4
- package_manager: npm
- lockfile: package-lock.json
- db_client: @supabase/supabase-js 2.105.3
- auth_client: Supabase Auth
- language: TypeScript, JavaScript y MJS
- node_version_observed: v24.15.0

## 4. Conteos

- ui_routes: 15
- api_services: 33
- src_app_files: 59
- scripts: 30
- tests: 120
- chips_found: 9
- nervous_signals: 16
- governance_mechanisms: 12
- data_entities: 16
- feature_flags: 9
- wiring_edges: 28
- authority_rows: 16
- gaps: 14

## 5. UI routes observadas

Rutas productivas/admin:

- `/` -> `src/app/page.tsx`
- `/admin/runtime-vsm` -> `src/app/admin/runtime-vsm/page.tsx`
- `/admin/significado-trace` -> `src/app/admin/significado-trace/page.tsx`
- `/admin/significado-trace/[sessionId]` -> `src/app/admin/significado-trace/[sessionId]/page.tsx`

Rutas dev/shadow:

- `/dev/method-kernel-shadow`
- `/dev/agent-constitution-shadow`
- `/dev/diagnostic-ontology-shadow`
- `/dev/canonical-catalog-shadow`
- `/dev/runtime-catalog-shadow`
- `/dev/eve-05-gate-engine-shadow`
- `/dev/eve-06-execution-engine-shadow`
- `/dev/eve-07-parallel-production-interface-shadow`
- `/dev/eve-08-audit-and-governance-shadow`
- `/dev/e2e-block0`
- `/dev/significado`

## 6. API surfaces observadas

Se observaron 33 rutas bajo `src/app/api`, incluyendo:

- session: bootstrap, restore, intermediate-output
- questionnaire: catalog, submit
- rank-activities
- significado/block0
- diagnostics/session
- runtime: observability, vsm
- scenes: answers, bootstrap, canonicalize, consistency, derive, preclassify, runtime-contract-verify
- parallel-production: assessment/run, candidate-export/generate, design-source-bundle, inventory/resolve, mmabp-ir/project
- mba-control-plane: observe, report
- coach operational-description
- causal diagnostic/client aggregation
- structural confirm
- audit question-db-counts
- health

## 7. Chips encontrados

- EVE-00 Method Kernel: `docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/`
- EVE-01 Agent Constitution: `docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/`
- EVE-02 Diagnostic Ontology: `docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/`
- EVE-03 Canonical Catalog: `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/`
- EVE-04 Runtime Catalog: `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/`
- EVE-05 Gate Engine: `docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/`
- EVE-06 Execution Engine: `docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/`
- EVE-07 Parallel Production Interface: `docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/`
- EVE-08 Audit and Governance: `docs/chips/audit-and-governance/EVE_08_Audit_And_Governance_v0_1_1_candidate/`

La presencia de estos paquetes no implica cableado productivo.

## 8. Nervous signals observadas

- auth_user_id
- empresa_id
- sessionId
- activityId
- flowState
- workmap draft
- questionnaire answers
- primary activity selection
- support activity selection
- Significado Block0 answers
- diagnostic session state
- scene bootstrap/canonicalize/preclassify/consistency
- runtime observability events
- MBA shadow observations
- parallel production runtime artifacts
- candidate export payloads

## 9. Governance mechanisms observados

- session-boundary auth and owner resolution
- rector docs registry runtimeAuthority declarations
- document transduction QA policy
- primary activity selection policy v1.3
- runtime Block0 catalog adapter and response model
- WorkMap save/operational readiness validation
- Significado source and block0 persistence boundary
- MBA transition guard and shadow observer
- parallel production warning/readiness services
- shadow harness safety flags for EVE00-EVE08
- regression tests for candidate-only/not-wired claims
- runtime observability and VSM admin read surfaces

## 10. Authority surfaces observadas

Ver matriz completa:

- `docs/audits/_eve_organism_authority_matrix_observed_v1.json`

Resumen:

- authority_rows: 16
- write_capable_rows: 6
- shadow_only_rows: 2
- candidate_not_wired_rows: 1
- requires_activation_contract: true

## 11. Connection graph

Ver grafo:

- `docs/audits/_eve_organism_repo_connection_graph_v1.json`

Resumen:

- wiring_edges: 28
- principales zonas: UI productiva, admin observability, dev shadow harnesses, API routes, Supabase clients, session boundary, WorkMap, Significado, MBA shadow observer, parallel production runtime services, rector docs registry.

## 12. Critical gaps

- GAP-001 / activation_contract_missing / critical
- GAP-002 / authority_map_missing / critical
- GAP-003 / rls_and_db_policy_unverified / critical
- GAP-004 / service_role_boundary_high_risk / critical
- GAP-005 / shadow_to_productive_promotion_path_missing / critical
- GAP-006 / registry_write_policy_ambiguous / high
- GAP-007 / event_bus_or_outbox_missing / high
- GAP-008 / kill_switch_and_rollback_missing / high
- GAP-009 / productive_ui_entrypoint_approval_missing / high
- GAP-010 / tenant_scope_not_fully_proven / high
- GAP-011 / qa_coverage_for_activation_missing / high
- GAP-012 / runtime_catalog_state_dirty / high
- GAP-013 / manual_visual_approvals_not_runtime_authority / medium
- GAP-014 / external_ai_or_llm_boundary_unconfirmed / medium

Ver indice completo:

- `docs/audits/_eve_organism_activation_gap_index_v1.json`

## 13. No modification attestation

- src_modified: false
- tests_modified: false
- package_json_modified: false
- db_modified: false
- chips_modified: false
- runtime_connected: false
- shadow_activated: false
- registry_written: false
- commit_created: false

## 14. Archivos creados

- `docs/audits/EVE_ORGANISM_REPO_TECHNICAL_INVENTORY_V1.md`
- `docs/audits/_eve_organism_repo_technical_inventory_v1.json`
- `docs/audits/_eve_organism_repo_connection_graph_v1.json`
- `docs/audits/_eve_organism_authority_matrix_observed_v1.json`
- `docs/audits/_eve_organism_activation_gap_index_v1.json`

## 15. Siguiente paso

UPLOAD_INVENTORY_TO_CHATGPT_FOR_CONTRACT_AND_MAP
