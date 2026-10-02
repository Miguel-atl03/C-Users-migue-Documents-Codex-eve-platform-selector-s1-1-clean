# R3AS connection map

| A | Gaby -> next interaction | participant/workmap/finalize creates/returns activityRuntimeRunId and catalogVersionId | backend_full_run_creation_conformant |  |
| B | interaction -> UI | SceneQuestionnaireRunner visual component | legacy_manifest_sequence_authority_present | blocked_gaby_renderer_frontdoor |
| C | UI answer -> BFF | client-bff answer route listed in git delta but not safely writable/readable via long path during this run | not safely materializable from live checkout | blocked_client_bff_security |
| D | BFF -> ResponseIngest | runtime-40-20-response-ingest-service.ts | implemented_not_connected_to_live_gaby_bff | blocked_gaby_runtime_answer_adapter |
| E | ingest -> engine advance | execution-connected service exists in git delta | synthetic_harness_materiality_only_not_proven_real_app_boundary | blocked_gaby_real_roundtrip |
| F | advance -> next Renderer interaction | synthetic render/ingest evidence in 044A6 bundle | synthetic_evidence_not_real_gaby_roundtrip | blocked_gaby_real_roundtrip |
| G | app -> staging deployment | staging DB/RPC scripts and evidence only; no app hosting config found | deployment_boundary_absent_for_app_hosting | blocked_staging_app_deployment_architecture_absent |
