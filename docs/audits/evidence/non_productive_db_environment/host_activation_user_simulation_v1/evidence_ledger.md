# Evidence Ledger

| evidence_id | file | source | status | supports_which_confirmation_field | remaining_gap |
| --- | --- | --- | --- | --- | --- |
| HAU-001 | README.md | generated evidence package | blocked | evidence_ledger_path | runtime not confirmed |
| HAU-002 | test_plan.md | generated plan | prepared_not_executed | access_boundary | runtime not confirmed |
| HAU-003 | environment_observation.md | repo inspection | blocked | environment_name, environment_type | values pending |
| HAU-004 | simulated_user.md | generated plan | prepared_not_executed | reviewer, approver_name_or_role | user not executed |
| HAU-005 | screen_observation.md | repo inspection | blocked | environment_reference_without_secret | screen not confirmed |
| HAU-006 | host_activation_observation.md | no execution | blocked | non_productive_db_identifier_masked | no host activation observed |
| HAU-007 | sanitized_logs.md | repo inspection | sanitized | evidence_ledger_path | no runtime logs |
| HAU-008 | no_production_access_attestation.md | execution boundary | attested_no_execution | no_production_access_attestation | does not confirm environment |
