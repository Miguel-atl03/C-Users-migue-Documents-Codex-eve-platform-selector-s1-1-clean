# 045-R3 Rector Connection Register

Classification: blocked_gaby_runtime_reentry

| Connection | Status | Evidence |
| --- | --- | --- |
| gaby_frontdoor_to_runtime_renderer | blocked | legacy catalog import and client canonicalVariable present |
| gaby_answer_to_runtime_ingest | blocked | direct Supabase import, local adapter, Object.entries semantic mapping |
| gaby_b0_reentry_to_full_runtime | blocked | controlled Gaby run remains B0; FULL runs are synthetic |
| runtime_to_scene_authority | blocked | scene_registry=0; no run has scene_id |
| panel_same_run_observability | blocked_downstream | same-run test cannot run without real Gaby FULL run |
