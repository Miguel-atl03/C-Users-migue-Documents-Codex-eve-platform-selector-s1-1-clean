-- ROLLBACK FOR INSTRUCTION 042-A RPC CORRECTION
-- Restores exactly the governed 040-D function logic deployed by instruction 041.
-- Does not alter any table, default, B0, B1, Gaby, or catalog data.

create or replace function public.eve_runtime_40_20_catalog_draft_counts(p_catalog_version_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'catalog_versions', (select count(*) from public.runtime_catalog_version where catalog_version_id = p_catalog_version_id),
    'artifact_sections', (select count(*) from public.runtime_catalog_artifact_section where catalog_version_id = p_catalog_version_id),
    'source_nodes', (select count(*) from public.source_node_ref where catalog_version_id = p_catalog_version_id),
    'interaction_definitions', (select count(*) from public.runtime_interaction_def where catalog_version_id = p_catalog_version_id),
    'interaction_mappings', (select count(*) from public.runtime_interaction_mapping where catalog_version_id = p_catalog_version_id),
    'subfields', (select count(*) from public.runtime_subfield_schema where catalog_version_id = p_catalog_version_id),
    'branching_rules', (select count(*) from public.runtime_branching_rule where catalog_version_id = p_catalog_version_id),
    'epistemic_rules', (select count(*) from public.runtime_epistemic_rule where catalog_version_id = p_catalog_version_id),
    'variable_maps', (select count(*) from public.runtime_variable_map where catalog_version_id = p_catalog_version_id),
    'semantic_total',
      (select count(*) from public.runtime_branching_rule where catalog_version_id = p_catalog_version_id) +
      (select count(*) from public.runtime_epistemic_rule where catalog_version_id = p_catalog_version_id) +
      (select count(*) from public.runtime_variable_map where catalog_version_id = p_catalog_version_id)
  );
$$;

create or replace function public.eve_runtime_40_20_load_catalog_draft(p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_catalog_version_id text := p_payload->>'catalog_version_id';
  v_records jsonb := p_payload->'records';
  v_expected jsonb := p_payload->'expected_counts';
  v_counts jsonb;
  v_existing integer;
  v_diff integer;
  v_catalog_version jsonb := p_payload #> '{records,catalogVersion}';
begin
  if v_catalog_version_id is null or v_catalog_version_id = '' then
    raise exception 'blocked_remote_transaction_contract_incomplete: catalog_version_id required';
  end if;
  if v_catalog_version->>'catalog_version_id' is distinct from v_catalog_version_id then
    raise exception 'blocked_remote_transaction_contract_incomplete: catalog_version_id mismatch';
  end if;
  if v_catalog_version->>'status' is distinct from 'draft' then
    raise exception 'blocked_non_draft_status';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_catalog_version_id, 4020));

  select count(*) into v_existing
  from public.runtime_catalog_version
  where catalog_version_id = v_catalog_version_id;

  v_counts := public.eve_runtime_40_20_catalog_draft_counts(v_catalog_version_id);

  if v_existing > 0 then
    if v_counts is distinct from v_expected then
      raise exception 'blocked_catalog_identity_content_conflict: count mismatch existing %, expected %', v_counts, v_expected;
    end if;

    -- Nine-collection bidirectional EXCEPT ALL (semantic fields only; exclude generated UUID/timestamps).
    with expected_version as (
      select
        v_catalog_version->>'catalog_version_id' as catalog_version_id,
        v_catalog_version->>'version_label' as version_label,
        v_catalog_version->>'spec_version_label' as spec_version_label,
        v_catalog_version->>'status' as status,
        v_catalog_version->>'source_xlsx_filename' as source_xlsx_filename,
        v_catalog_version->>'source_xlsx_checksum' as source_xlsx_checksum,
        v_catalog_version->>'source_docx_filename' as source_docx_filename,
        v_catalog_version->>'source_docx_checksum' as source_docx_checksum,
        v_catalog_version->>'mother_catalog_version' as mother_catalog_version,
        v_catalog_version->>'runtime_rule_mother' as runtime_rule_mother,
        v_catalog_version->>'notes' as notes,
        null::timestamptz as activated_at,
        null::text as superseded_by_catalog_version_id
    ), persisted_version as (
      select catalog_version_id, version_label, spec_version_label, status::text as status,
        source_xlsx_filename, source_xlsx_checksum, source_docx_filename, source_docx_checksum,
        mother_catalog_version, runtime_rule_mother, notes, activated_at, superseded_by_catalog_version_id
      from public.runtime_catalog_version
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_version) except all (select * from persisted_version)) d
      union all
      select count(*) c from ((select * from persisted_version) except all (select * from expected_version)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: catalog version content differs';
    end if;

    with expected_sections as (
      select catalog_version_id, section_name, sheet_name, section_kind, row_count, source_checksum,
        payload_json, validation_status, blocking_errors, warnings, metadata_json
      from jsonb_to_recordset(v_records->'artifactSections') as x(
        catalog_version_id text, section_name text, sheet_name text, section_kind text, row_count int,
        source_checksum text, payload_json jsonb, validation_status text, blocking_errors jsonb,
        warnings jsonb, metadata_json jsonb
      )
    ), persisted_sections as (
      select catalog_version_id, section_name, sheet_name, section_kind, row_count, source_checksum,
        payload_json, validation_status, blocking_errors, warnings, metadata_json
      from public.runtime_catalog_artifact_section
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_sections) except all (select * from persisted_sections)) d
      union all
      select count(*) c from ((select * from persisted_sections) except all (select * from expected_sections)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: artifact section payload differs';
    end if;

    with expected_nodes as (
      select catalog_version_id, source_node_id, source_code, block_id, source_block_label,
        source_question_text, mother_catalog_payload
      from jsonb_to_recordset(v_records->'sourceNodes') as x(
        catalog_version_id text, source_node_id text, source_code text, block_id text,
        source_block_label text, source_question_text text, mother_catalog_payload jsonb
      )
    ), persisted_nodes as (
      select catalog_version_id, source_node_id, source_code, block_id, source_block_label,
        source_question_text, mother_catalog_payload
      from public.source_node_ref
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_nodes) except all (select * from persisted_nodes)) d
      union all
      select count(*) c from ((select * from persisted_nodes) except all (select * from expected_nodes)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: source node content differs';
    end if;

    with expected_defs as (
      select catalog_version_id, runtime_interaction_id, interaction_group_source, interaction_group_normalized,
        block_id, runtime_order, function_label, visible_text, source_nodes, source_codes, ui_component,
        subfield_structure, runtime_role, trigger_condition, opens_nodes, closes_nodes, mutual_exclusion_policy,
        burden_score, estimated_time_seconds, free_text_weight, fatigue_policy, epistemic_status_default,
        provenance_rule, confirmation_policy, must_not_infer, canonical_variables, required_variables,
        derived_variables, optional_variables, pm_output, moc_output, pf_output, olc_output,
        conformance_checkpoint, consistency_checkpoint, activation_signal, blocking_gap, reentry_target,
        max_retries, structural_candidate_type, registry_target, mmabp_ir_target, readiness_effect,
        acceptance_test, failure_mode, manual_review_condition, raw_row_json, active, confirmation_weight,
        priority_under_budget_pressure, can_be_inferred_from, audit_requirement, source_status, correction_notes
      from jsonb_to_recordset(v_records->'interactionDefinitions') as x(
        catalog_version_id text, runtime_interaction_id text, interaction_group_source text,
        interaction_group_normalized text, block_id text, runtime_order int, function_label text,
        visible_text text, source_nodes text[], source_codes text[], ui_component text,
        subfield_structure jsonb, runtime_role text, trigger_condition text, opens_nodes text[],
        closes_nodes text[], mutual_exclusion_policy jsonb, burden_score numeric,
        estimated_time_seconds int, free_text_weight numeric, fatigue_policy jsonb,
        epistemic_status_default text, provenance_rule text, confirmation_policy text,
        must_not_infer boolean, canonical_variables text[], required_variables text[],
        derived_variables text[], optional_variables text[], pm_output text, moc_output text,
        pf_output text, olc_output text, conformance_checkpoint text, consistency_checkpoint text,
        activation_signal text, blocking_gap text, reentry_target text, max_retries int,
        structural_candidate_type text, registry_target text, mmabp_ir_target text,
        readiness_effect text, acceptance_test text, failure_mode text, manual_review_condition text,
        raw_row_json jsonb, active boolean, confirmation_weight numeric,
        priority_under_budget_pressure text, can_be_inferred_from text[], audit_requirement text,
        source_status text, correction_notes text
      )
    ), persisted_defs as (
      select catalog_version_id, runtime_interaction_id, interaction_group_source::text,
        interaction_group_normalized::text, block_id, runtime_order, function_label, visible_text,
        source_nodes, source_codes, ui_component, subfield_structure, runtime_role, trigger_condition,
        opens_nodes, closes_nodes, mutual_exclusion_policy, burden_score, estimated_time_seconds,
        free_text_weight, fatigue_policy, epistemic_status_default::text, provenance_rule,
        confirmation_policy, must_not_infer, canonical_variables, required_variables, derived_variables,
        optional_variables, pm_output, moc_output, pf_output, olc_output, conformance_checkpoint,
        consistency_checkpoint, activation_signal, blocking_gap, reentry_target, max_retries,
        structural_candidate_type, registry_target, mmabp_ir_target, readiness_effect, acceptance_test,
        failure_mode, manual_review_condition, raw_row_json, active, confirmation_weight,
        priority_under_budget_pressure, can_be_inferred_from, audit_requirement, source_status,
        correction_notes
      from public.runtime_interaction_def
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_defs) except all (select * from persisted_defs)) d
      union all
      select count(*) c from ((select * from persisted_defs) except all (select * from expected_defs)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: interaction definition content differs';
    end if;

    with expected_mappings as (
      select catalog_version_id, runtime_interaction_id, source_node_id, source_code,
        mapping_role, output_variable_name, route_id
      from jsonb_to_recordset(v_records->'interactionMappings') as x(
        catalog_version_id text, runtime_interaction_id text, source_node_id text, source_code text,
        mapping_role text, output_variable_name text, route_id text
      )
    ), persisted_mappings as (
      select m.catalog_version_id, m.runtime_interaction_id, s.source_node_id, s.source_code,
        m.mapping_role, m.output_variable_name, m.route_id
      from public.runtime_interaction_mapping m
      join public.source_node_ref s on s.source_node_ref_id = m.source_node_ref_id
      where m.catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_mappings) except all (select * from persisted_mappings)) d
      union all
      select count(*) c from ((select * from persisted_mappings) except all (select * from expected_mappings)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: interaction mapping content differs';
    end if;

    with expected_subfields as (
      select catalog_version_id, runtime_interaction_id, subfield_name, subfield_label, subfield_type,
        canonical_variable_name, required, required_if_condition, ordinal, validation_rule, help_text,
        ui_component, display_rule, storage_rule, risk_if_single_textbox, raw_row_json
      from jsonb_to_recordset(v_records->'subfields') as x(
        catalog_version_id text, runtime_interaction_id text, subfield_name text, subfield_label text,
        subfield_type text, canonical_variable_name text, required boolean, required_if_condition text,
        ordinal int, validation_rule text, help_text text, ui_component text, display_rule text,
        storage_rule text, risk_if_single_textbox text, raw_row_json jsonb
      )
    ), persisted_subfields as (
      select catalog_version_id, runtime_interaction_id, subfield_name, subfield_label, subfield_type,
        canonical_variable_name, required, required_if_condition, ordinal, validation_rule, help_text,
        ui_component, display_rule, storage_rule, risk_if_single_textbox, raw_row_json
      from public.runtime_subfield_schema
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_subfields) except all (select * from persisted_subfields)) d
      union all
      select count(*) c from ((select * from persisted_subfields) except all (select * from expected_subfields)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: subfield schema content differs';
    end if;

    with expected_branching as (
      select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
        source_file, source_sheet, source_row, source_column, trace_id, source_checksum
      from jsonb_to_recordset(v_records->'branchingRules') as x(
        catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
        source_file text, source_sheet text, source_row int, source_column text, trace_id text,
        source_checksum text
      )
    ), persisted_branching as (
      select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
        source_file, source_sheet, source_row, source_column, trace_id, source_checksum
      from public.runtime_branching_rule
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_branching) except all (select * from persisted_branching)) d
      union all
      select count(*) c from ((select * from persisted_branching) except all (select * from expected_branching)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: branching rule content differs';
    end if;

    with expected_epistemic as (
      select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
        source_file, source_sheet, source_row, source_column, trace_id, source_checksum
      from jsonb_to_recordset(v_records->'epistemicRules') as x(
        catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
        source_file text, source_sheet text, source_row int, source_column text, trace_id text,
        source_checksum text
      )
    ), persisted_epistemic as (
      select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
        source_file, source_sheet, source_row, source_column, trace_id, source_checksum
      from public.runtime_epistemic_rule
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_epistemic) except all (select * from persisted_epistemic)) d
      union all
      select count(*) c from ((select * from persisted_epistemic) except all (select * from expected_epistemic)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: epistemic rule content differs';
    end if;

    with expected_variable as (
      select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
        source_file, source_sheet, source_row, source_column, trace_id, source_checksum
      from jsonb_to_recordset(v_records->'variableMaps') as x(
        catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
        source_file text, source_sheet text, source_row int, source_column text, trace_id text,
        source_checksum text
      )
    ), persisted_variable as (
      select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
        source_file, source_sheet, source_row, source_column, trace_id, source_checksum
      from public.runtime_variable_map
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_variable) except all (select * from persisted_variable)) d
      union all
      select count(*) c from ((select * from persisted_variable) except all (select * from expected_variable)) d
    )
    select coalesce(sum(c), 0) into v_diff from diffs;
    if v_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: variable map content differs';
    end if;

    return jsonb_build_object(
      'status', 'idempotent_replay',
      'transaction_result', 'no_write_idempotent',
      'counts', v_counts
    );
  end if;

  -- New draft insert (single transaction body of this function).
  insert into public.runtime_catalog_version (
    catalog_version_id, version_label, spec_version_label, status,
    source_xlsx_filename, source_xlsx_checksum, source_docx_filename, source_docx_checksum,
    mother_catalog_version, runtime_rule_mother, notes,
    activated_at, superseded_by_catalog_version_id
  ) values (
    v_catalog_version_id,
    v_catalog_version->>'version_label',
    v_catalog_version->>'spec_version_label',
    (v_catalog_version->>'status')::eve_runtime_catalog_status,
    v_catalog_version->>'source_xlsx_filename',
    v_catalog_version->>'source_xlsx_checksum',
    v_catalog_version->>'source_docx_filename',
    v_catalog_version->>'source_docx_checksum',
    v_catalog_version->>'mother_catalog_version',
    v_catalog_version->>'runtime_rule_mother',
    v_catalog_version->>'notes',
    null,
    null
  );

  insert into public.runtime_catalog_artifact_section (
    catalog_version_id, section_name, sheet_name, section_kind, row_count, source_checksum,
    payload_json, validation_status, blocking_errors, warnings, metadata_json
  )
  select catalog_version_id, section_name, sheet_name, section_kind, row_count, source_checksum,
    payload_json, validation_status, blocking_errors, warnings, metadata_json
  from jsonb_to_recordset(v_records->'artifactSections') as x(
    catalog_version_id text, section_name text, sheet_name text, section_kind text, row_count int,
    source_checksum text, payload_json jsonb, validation_status text, blocking_errors jsonb,
    warnings jsonb, metadata_json jsonb
  );

  insert into public.source_node_ref (
    catalog_version_id, source_node_id, source_code, block_id, source_block_label,
    source_question_text, mother_catalog_payload
  )
  select catalog_version_id, source_node_id, source_code, block_id, source_block_label,
    source_question_text, mother_catalog_payload
  from jsonb_to_recordset(v_records->'sourceNodes') as x(
    catalog_version_id text, source_node_id text, source_code text, block_id text,
    source_block_label text, source_question_text text, mother_catalog_payload jsonb
  );

  insert into public.runtime_interaction_def (
    catalog_version_id, runtime_interaction_id, interaction_group_source, interaction_group_normalized,
    block_id, runtime_order, function_label, visible_text, source_nodes, source_codes, ui_component,
    subfield_structure, runtime_role, trigger_condition, opens_nodes, closes_nodes, mutual_exclusion_policy,
    burden_score, estimated_time_seconds, free_text_weight, fatigue_policy, epistemic_status_default,
    provenance_rule, confirmation_policy, must_not_infer, canonical_variables, required_variables,
    derived_variables, optional_variables, pm_output, moc_output, pf_output, olc_output,
    conformance_checkpoint, consistency_checkpoint, activation_signal, blocking_gap, reentry_target,
    max_retries, structural_candidate_type, registry_target, mmabp_ir_target, readiness_effect,
    acceptance_test, failure_mode, manual_review_condition, raw_row_json, active, confirmation_weight,
    priority_under_budget_pressure, can_be_inferred_from, audit_requirement, source_status, correction_notes
  )
  select catalog_version_id, runtime_interaction_id,
    interaction_group_source::eve_runtime_group_source,
    interaction_group_normalized::eve_runtime_group_normalized,
    block_id, runtime_order, function_label, visible_text, source_nodes, source_codes, ui_component,
    subfield_structure, runtime_role, trigger_condition, opens_nodes, closes_nodes, mutual_exclusion_policy,
    burden_score, estimated_time_seconds, free_text_weight, fatigue_policy,
    epistemic_status_default::eve_runtime_epistemic_status,
    provenance_rule, confirmation_policy, must_not_infer, canonical_variables, required_variables,
    derived_variables, optional_variables, pm_output, moc_output, pf_output, olc_output,
    conformance_checkpoint, consistency_checkpoint, activation_signal, blocking_gap, reentry_target,
    max_retries, structural_candidate_type, registry_target, mmabp_ir_target, readiness_effect,
    acceptance_test, failure_mode, manual_review_condition, raw_row_json, active, confirmation_weight,
    priority_under_budget_pressure, can_be_inferred_from, audit_requirement, source_status, correction_notes
  from jsonb_to_recordset(v_records->'interactionDefinitions') as x(
    catalog_version_id text, runtime_interaction_id text, interaction_group_source text,
    interaction_group_normalized text, block_id text, runtime_order int, function_label text,
    visible_text text, source_nodes text[], source_codes text[], ui_component text,
    subfield_structure jsonb, runtime_role text, trigger_condition text, opens_nodes text[],
    closes_nodes text[], mutual_exclusion_policy jsonb, burden_score numeric,
    estimated_time_seconds int, free_text_weight numeric, fatigue_policy jsonb,
    epistemic_status_default text, provenance_rule text, confirmation_policy text,
    must_not_infer boolean, canonical_variables text[], required_variables text[],
    derived_variables text[], optional_variables text[], pm_output text, moc_output text,
    pf_output text, olc_output text, conformance_checkpoint text, consistency_checkpoint text,
    activation_signal text, blocking_gap text, reentry_target text, max_retries int,
    structural_candidate_type text, registry_target text, mmabp_ir_target text,
    readiness_effect text, acceptance_test text, failure_mode text, manual_review_condition text,
    raw_row_json jsonb, active boolean, confirmation_weight numeric,
    priority_under_budget_pressure text, can_be_inferred_from text[], audit_requirement text,
    source_status text, correction_notes text
  );

  -- mapping_id and created_at are generated by PostgreSQL.
  -- source_node_ref_id is resolved from (catalog_version_id, source_node_id, source_code).
  insert into public.runtime_interaction_mapping (
    catalog_version_id, runtime_interaction_id, source_node_ref_id, mapping_role,
    output_variable_name, route_id
  )
  select r.catalog_version_id, r.runtime_interaction_id, s.source_node_ref_id, r.mapping_role,
    r.output_variable_name, r.route_id
  from jsonb_to_recordset(v_records->'interactionMappings') as r(
    catalog_version_id text, runtime_interaction_id text, source_node_id text, source_code text,
    mapping_role text, output_variable_name text, route_id text
  )
  join public.source_node_ref s
    on s.catalog_version_id = r.catalog_version_id
   and s.source_node_id = r.source_node_id
   and s.source_code = r.source_code;

  insert into public.runtime_subfield_schema (
    catalog_version_id, runtime_interaction_id, subfield_name, subfield_label, subfield_type,
    canonical_variable_name, required, required_if_condition, ordinal, validation_rule, help_text,
    ui_component, display_rule, storage_rule, risk_if_single_textbox, raw_row_json
  )
  select catalog_version_id, runtime_interaction_id, subfield_name, subfield_label, subfield_type,
    canonical_variable_name, required, required_if_condition, ordinal, validation_rule, help_text,
    ui_component, display_rule, storage_rule, risk_if_single_textbox, raw_row_json
  from jsonb_to_recordset(v_records->'subfields') as x(
    catalog_version_id text, runtime_interaction_id text, subfield_name text, subfield_label text,
    subfield_type text, canonical_variable_name text, required boolean, required_if_condition text,
    ordinal int, validation_rule text, help_text text, ui_component text, display_rule text,
    storage_rule text, risk_if_single_textbox text, raw_row_json jsonb
  );

  insert into public.runtime_branching_rule (
    catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  )
  select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  from jsonb_to_recordset(v_records->'branchingRules') as x(
    catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
    source_file text, source_sheet text, source_row int, source_column text, trace_id text,
    source_checksum text
  );

  insert into public.runtime_epistemic_rule (
    catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  )
  select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  from jsonb_to_recordset(v_records->'epistemicRules') as x(
    catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
    source_file text, source_sheet text, source_row int, source_column text, trace_id text,
    source_checksum text
  );

  insert into public.runtime_variable_map (
    catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  )
  select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  from jsonb_to_recordset(v_records->'variableMaps') as x(
    catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
    source_file text, source_sheet text, source_row int, source_column text, trace_id text,
    source_checksum text
  );

  v_counts := public.eve_runtime_40_20_catalog_draft_counts(v_catalog_version_id);
  if v_counts is distinct from v_expected then
    raise exception 'blocked_remote_transaction_contract_incomplete: post-load count mismatch %, expected %', v_counts, v_expected;
  end if;

  return jsonb_build_object(
    'status', 'draft_loaded',
    'transaction_result', 'committed',
    'counts', v_counts
  );
end;
$$;

revoke all on function public.eve_runtime_40_20_load_catalog_draft(jsonb) from public, anon, authenticated;
revoke all on function public.eve_runtime_40_20_catalog_draft_counts(text) from public, anon, authenticated;
grant execute on function public.eve_runtime_40_20_load_catalog_draft(jsonb) to service_role;
grant execute on function public.eve_runtime_40_20_catalog_draft_counts(text) to service_role;
