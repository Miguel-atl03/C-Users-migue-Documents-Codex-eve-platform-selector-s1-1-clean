-- 045-R2G ROLLBACK SMOKE ONLY
-- Deletes only rows tagged with smoke_id 045R2G-f6-integration-membrane-smoke.
begin;
delete from public.control_plane_projection_job where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.rls_probe_result where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.no_go_status_snapshot where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.review_control_event where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.handoff_patch_record where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.export_boundary_check where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.no_go_evaluation_result where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.runtime_state_snapshot where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
delete from public.runtime_event_outbox where metadata_json->>'smoke_id'='045R2G-f6-integration-membrane-smoke';
commit;
