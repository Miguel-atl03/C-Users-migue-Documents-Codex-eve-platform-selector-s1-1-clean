-- GOVERNED STAGING DRAFT LOAD RPC CANDIDATE ROLLBACK
-- NOT DEPLOYED BY INSTRUCTION 039-A

revoke all on function public.eve_runtime_40_20_load_catalog_draft(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.eve_runtime_40_20_catalog_draft_counts(text) from public, anon, authenticated, service_role;
drop function if exists public.eve_runtime_40_20_load_catalog_draft(jsonb);
drop function if exists public.eve_runtime_40_20_catalog_draft_counts(text);
