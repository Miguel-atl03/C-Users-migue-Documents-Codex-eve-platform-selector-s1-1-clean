-- FINAL STAGING ROLLBACK - INSTRUCTION 041
-- Rolls back semantic organs final migration 20260805220000.
-- Does not modify B0 / B1 / Gaby / production.

drop policy if exists runtime_variable_map_read_authenticated on public.runtime_variable_map;
revoke all on table public.runtime_variable_map from public, anon, authenticated, service_role;
drop table if exists public.runtime_variable_map;

drop policy if exists runtime_epistemic_rule_read_authenticated on public.runtime_epistemic_rule;
revoke all on table public.runtime_epistemic_rule from public, anon, authenticated, service_role;
drop table if exists public.runtime_epistemic_rule;

drop policy if exists runtime_branching_rule_read_authenticated on public.runtime_branching_rule;
revoke all on table public.runtime_branching_rule from public, anon, authenticated, service_role;
drop table if exists public.runtime_branching_rule;
