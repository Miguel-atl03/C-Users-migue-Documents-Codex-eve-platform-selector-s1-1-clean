alter table eve_pr3.a_i_operation
  add constraint a_i_operation_instructions_sha256_check
  check (instructions_sha256 is null or instructions_sha256 ~ '^[0-9a-f]{64}$');
alter table eve_pr3.a_i_operation
  add constraint a_i_operation_input_payload_sha256_check
  check (input_payload_sha256 is null or input_payload_sha256 ~ '^[0-9a-f]{64}$');
alter table eve_pr3.a_i_operation alter column provider_ref set not null;
alter table eve_pr3.a_i_operation alter column model_id set not null;
alter table eve_pr3.a_i_operation alter column model_version set not null;
alter table eve_pr3.a_i_operation alter column prompt_profile_ref set not null;
alter table eve_pr3.a_i_operation alter column prompt_profile_revision set not null;
alter table eve_pr3.a_i_operation alter column response_schema_ref set not null;
alter table eve_pr3.a_i_operation alter column instructions_sha256 set not null;
alter table eve_pr3.a_i_operation alter column input_payload_sha256 set not null;
