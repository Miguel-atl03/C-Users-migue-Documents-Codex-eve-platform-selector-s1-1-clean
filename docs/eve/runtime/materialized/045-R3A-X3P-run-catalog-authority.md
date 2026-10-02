# 045-R3A-X3-P — Run catalog authority

## Rule

- **Creation:** single active catalog → pin to `role_runtime_session` → pin to `activity_runtime_run`.
- **Execution:** `activity_runtime_run.catalog_version_id` is the sole catalog authority for that run.

## Demonstrated

| Flag | Value |
|---|---|
| catalog_at_creation | single_active |
| catalog_during_execution | activity_runtime_run.catalog_version_id |
| current_active_relookup_during_execution | false |
| superseded_pinned_run_supported | true |
| mid_run_catalog_upgrade | false |

## readRun

Validates: pin exists, catalog identity exists, session/run consistency, status ∈ {active, superseded}.
