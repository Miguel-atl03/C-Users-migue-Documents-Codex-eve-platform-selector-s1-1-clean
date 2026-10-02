grant select, insert, update, delete on client_causal_aggregation_runs to anon, authenticated;
grant select, insert, update, delete on client_causal_outputs to anon, authenticated;
grant select, insert, update, delete on client_node_aggregation to anon, authenticated;
grant select, insert, update, delete on client_contradiction_map to anon, authenticated;

alter table client_causal_aggregation_runs disable row level security;
alter table client_causal_outputs disable row level security;
alter table client_node_aggregation disable row level security;
alter table client_contradiction_map disable row level security;
