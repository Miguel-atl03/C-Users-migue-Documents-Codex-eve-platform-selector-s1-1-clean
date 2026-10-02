-- 045-R2G VERIFY ONLY
-- No secrets. Run only against eve-staging-onboarding.
select 'runtime_event_outbox' as table_name, count(*) from public.runtime_event_outbox where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'runtime_state_snapshot', count(*) from public.runtime_state_snapshot where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'control_plane_projection_job', count(*) from public.control_plane_projection_job where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'no_go_evaluation_result', count(*) from public.no_go_evaluation_result where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'export_boundary_check', count(*) from public.export_boundary_check where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'handoff_patch_record', count(*) from public.handoff_patch_record where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'review_control_event', count(*) from public.review_control_event where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'rls_probe_result', count(*) from public.rls_probe_result where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke' union all
select 'no_go_status_snapshot', count(*) from public.no_go_status_snapshot where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
