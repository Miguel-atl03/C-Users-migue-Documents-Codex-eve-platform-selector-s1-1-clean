-- LOCAL RECTOR-CONFORMANCE SCHEMA
-- NOT APPROVED FOR STAGING OR PRODUCTION

drop policy if exists runtime_variable_map_read_authenticated on public.runtime_variable_map;
drop policy if exists runtime_epistemic_rule_read_authenticated on public.runtime_epistemic_rule;
drop policy if exists runtime_branching_rule_read_authenticated on public.runtime_branching_rule;
drop table if exists public.runtime_variable_map;
drop table if exists public.runtime_epistemic_rule;
drop table if exists public.runtime_branching_rule;
