# Runtime 40/20 F6 Staging Schema 045-R2G

Project ref: shrpiwkxcdgvbqymjecx

All nine F6 staging tables are present with RLS enabled. The schema JSON contains columns, indexes, policies, and pre-smoke counts.

| Table | RLS | Pre-count | Post smoke count |
| --- | --- | ---: | ---: |
| control_plane_projection_job | enabled | 0 | 4 |
| export_boundary_check | enabled | 0 | 4 |
| handoff_patch_record | enabled | 0 | 4 |
| no_go_evaluation_result | enabled | 0 | 4 |
| no_go_status_snapshot | enabled | 0 | 4 |
| review_control_event | enabled | 0 | 4 |
| rls_probe_result | enabled | 0 | 2 |
| runtime_event_outbox | enabled | 0 | 4 |
| runtime_state_snapshot | enabled | 0 | 4 |
