# Registry Real Minimal Migration Application Rollback Plan

automatic_rollback_not_authorized

manual_rollback_required

## Manual Rollback Scope
Rollback must be separately authorized before execution and must cover:
- eve_pm_registry
- eve_pf_registry
- eve_moc_registry
- eve_olc_registry
- eve_registry_audit_log
- eve_registry_authorization_log

## Guardrails
Do not execute rollback SQL from this plan.

Do not use service_role directly.

Do not touch Supabase without explicit operator authorization.

Do not remove or alter unrelated schema objects.

## Review Required
Before rollback, confirm whether any registry rows, audit log rows, or authorization log rows were created after migration application.
