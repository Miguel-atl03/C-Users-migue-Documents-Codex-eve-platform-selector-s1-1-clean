-- FINAL STAGING ROLLBACK - INSTRUCTION 041
-- Rolls back governed draft-load RPC final migration 20260805221000.
-- Logic mirrors candidate 040-D rollback; does not modify B0 / B1 / Gaby / production.

revoke all on function public.eve_runtime_40_20_load_catalog_draft(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.eve_runtime_40_20_catalog_draft_counts(text) from public, anon, authenticated, service_role;
drop function if exists public.eve_runtime_40_20_load_catalog_draft(jsonb);
drop function if exists public.eve_runtime_40_20_catalog_draft_counts(text);
