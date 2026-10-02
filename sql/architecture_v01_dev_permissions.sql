grant select, insert, update, delete on activity_structural_scores to anon, authenticated;
grant select, insert, update, delete on activity_canonical_profiles to anon, authenticated;
grant select, insert, update, delete on triangulation_results to anon, authenticated;
grant select, insert, update, delete on closure_results to anon, authenticated;
grant select, insert, update, delete on support_activity_requests to anon, authenticated;

alter table activity_structural_scores disable row level security;
alter table activity_canonical_profiles disable row level security;
alter table triangulation_results disable row level security;
alter table closure_results disable row level security;
alter table support_activity_requests disable row level security;

