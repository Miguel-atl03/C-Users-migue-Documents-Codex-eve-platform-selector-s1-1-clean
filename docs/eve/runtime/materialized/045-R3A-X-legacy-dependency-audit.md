# 045-R3A-X — Legacy dependency audit

| Artifact | Classification | Notes |
|---|---|---|
| src/app/page.tsx | still_required_legacy_flow | Current official orchestrator until OfficialCanvasExperience replaces it |
| src/components/client/* | still_required_legacy_flow | Login/EstadoA/Complete UI |
| src/components/WorkMapIntake.tsx | shared_function_extract_first | Extract assist/validation; replace presentation |
| src/components/significado/* | shared_function_extract_first | Keep coach hooks/services; replace shell |
| src/components/LegacySceneQuestionnaireRunner.tsx | still_required_legacy_flow | Only while Runtime FULL not universal |
| src/components/RuntimeFullQuestionnaireRunner.tsx | shared_function_extract_first | BFF wiring reusable; UI becomes block sections |
| src/components/QuestionnaireRunner.tsx | safe_to_delete | Unmounted from page.tsx; extract mission UI only if needed first |
| src/services/work-map-*.ts / domain/work-map.ts | still_required_non_UI |  |
| src/app/api/coach/** | still_required_non_UI |  |
| src/app/api/significado/block0/** | still_required_non_UI |  |
| src/app/api/participant/workmap/finalize/** | still_required_non_UI |  |
| src/app/api/eve/runtime-40-20/client-bff/** | still_required_non_UI |  |
| src/hooks/use-operational-description-*.ts | still_required_non_UI |  |
| src/components/eve-worksheet/presentation-contract.* | still_required_non_UI |  |
| src/app/dev/e2e-block0 | still_required_legacy_flow | Dev harness; later redirect/remove |
| /dev/lienzo-eve | safe_to_delete | Not live in C312; freeze retains history; when reintroduced only as redirect |

Do **not** delete `still_required_non_UI`.
