# EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_PREFLIGHT_INVENTORY_V1

## Dictamen

COMPOSITION_ROOT_SHADOW_PREFLIGHT_BLOCKED_RECTORS_MISSING

## Preflight

- generated_at: 2026-06-24T17:07:24.962Z
- platform_root: C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone\external-consumers\eve-platform
- git_top_level: C:/Users/migue/Documents/Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone
- node_version: v24.15.0
- npm_version: unavailable
- package_manager_detected: npm/package-lock.json
- package_json_exists: true
- tsconfig_json_exists: true
- framework_detected: Next.js 16.2.5

## Rectores

- activation_contract_files_found: 0
- wiring_map_files_found: 0
- audit_found: false
- zip_found: false

La ruta esperada de instalacion es `docs/organism/activation-and-wiring/EVE_ORGANISM_ACTIVATION_AND_WIRING_V1`. El inventario detallado con path, size, hash y parse_status esta en el JSON principal.

## Contamination

- src_changed: true
- tests_changed: true
- chips_changed: true
- runtime_changed: true
- package_changed: false
- unrelated_dirty_tree_present: true

## Safe Locations

- recommended_new_service: src/services/eve-organism-composition-root-shadow.ts
- recommended_new_types: src/types/eve-organism-composition-root.ts
- recommended_new_test: tests/regression/eve-organism-composition-root-shadow.test.ts
- recommended_audit_files: docs/audits/AUDIT_EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_V1.md; docs/audits/_eve_organism_composition_root_shadow_v1.json

## Inventory Counts

- service_adapter_files: 304
- type_contracts: 743
- ui_routes: 16
- tests: 118
- feature_flags: 575
- gaps: 24

## Critical Gaps

- GAP-001 / RECTORS_NOT_INSTALLED / critical
- GAP-RECTOR-002 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-003 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-004 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-005 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-006 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-007 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-008 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-009 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-010 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-011 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-012 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-013 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-014 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-015 / RECTOR_FILE_MISSING / critical
- GAP-RECTOR-016 / RECTOR_FILE_MISSING / critical
- GAP-ZIP-001 / RECTOR_ZIP_MISSING / critical
- GAP-CONTAMINATION-001 / INSTALLATION_CONTAMINATION_RISK / critical
- GAP-TENANT-001 / TENANT_CONTEXT_TYPE_UNKNOWN / high
- GAP-REGISTRY-EXPORT-001 / REGISTRY_EXPORT_RISK / high
- GAP-SUPABASE-001 / SUPABASE_ENV_REQUIRED_RISK / high
- GAP-DIRTY-TREE-001 / DIRTY_TREE_RISK / high

## Future Allowlist

### future_allowed_files
- src/services/eve-organism-composition-root-shadow.ts
- src/domain/eve-organism-composition-root-shadow.ts
- src/types/eve-organism-composition-root.ts
- tests/regression/eve-organism-composition-root-shadow.test.ts
- docs/audits/AUDIT_EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_V1.md
- docs/audits/_eve_organism_composition_root_shadow_v1.json
- docs/audits/_eve_organism_composition_root_shadow_gap_index_v1.json
- docs/audits/_eve_organism_composition_root_shadow_allowed_files_v1.json

### future_forbidden_files
- app/**
- src/app/**
- src/components/**
- components/**
- docs/chips/**
- docs/runtime/**
- package.json
- package-lock.json
- pnpm-lock.yaml
- yarn.lock
- sql/**
- supabase/**
- migrations/**
- database migrations
- Supabase SQL
- production registry/export services
- src/services/*registry*
- src/services/*export*

## No Modification Attestation

- src_modified: false
- tests_modified: false
- chips_modified: false
- runtime_modified: false
- package_json_modified: false
- db_modified: false
- runtime_connected: false
- shadow_activated: false
- registry_written: false
- commit_created: false

Nota: esta atestacion corresponde a la corrida de inventario. El repositorio ya tenia dirty tree antes de crear estos archivos.

## Siguiente Paso

FIX_PREFLIGHT_BLOCKERS
