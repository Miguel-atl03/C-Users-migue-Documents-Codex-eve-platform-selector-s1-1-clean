-- GOVERNED STAGING DRAFT LOAD RPC CANDIDATE 040-D ROLLBACK
-- NOT DEPLOYED BY INSTRUCTION 040-D
-- Does not modify B0 / B1 / Gaby and does not touch historical 039-A or 040-C SQL files.

revoke all on function public.eve_runtime_40_20_load_catalog_draft(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.eve_runtime_40_20_catalog_draft_counts(text) from public, anon, authenticated, service_role;
drop function if exists public.eve_runtime_40_20_load_catalog_draft(jsonb);
drop function if exists public.eve_runtime_40_20_catalog_draft_counts(text);
