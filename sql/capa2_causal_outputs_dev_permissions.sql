grant select, insert, update, delete on session_causal_outputs to anon, authenticated;
grant select, insert, update, delete on scene_causal_activations to anon, authenticated;
grant select, insert, update, delete on causal_rule_executions to anon, authenticated;

alter table session_causal_outputs disable row level security;
alter table scene_causal_activations disable row level security;
alter table causal_rule_executions disable row level security;
