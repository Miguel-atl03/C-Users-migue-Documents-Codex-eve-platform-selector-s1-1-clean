-- GOVERNED STAGING DRAFT LOAD RPC CANDIDATE 040-C
-- NOT DEPLOYED BY INSTRUCTION 040-C
-- ALIGNED TO public.runtime_interaction_mapping REAL CONTRACT (8 COLUMNS)
-- REQUIRES PRIOR load_runtime_catalog_draft AUTHORIZATION IN SERVER-SIDE BOUNDARY
-- DOES NOT MODIFY HISTORICAL 039-A CANDIDATE

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
  v_section_diff integer;
  v_mapping_diff integer;
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

    with expected_sections as (
      select section_name, sheet_name, sheet_index, source_file, source_checksum, headers, payload_json, fingerprint, validation_status
      from jsonb_to_recordset(v_records->'artifactSections') as x(section_name text, sheet_name text, sheet_index int, source_file text, source_checksum text, headers jsonb, payload_json jsonb, fingerprint text, validation_status text)
    ), persisted_sections as (
      select section_name, sheet_name, sheet_index, source_file, source_checksum, headers, payload_json, fingerprint, validation_status
      from public.runtime_catalog_artifact_section
      where catalog_version_id = v_catalog_version_id
    ), diffs as (
      select count(*) c from ((select * from expected_sections) except all (select * from persisted_sections)) d
      union all
      select count(*) c from ((select * from persisted_sections) except all (select * from expected_sections)) d
    )
    select coalesce(sum(c),0) into v_section_diff from diffs;

    if v_section_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: artifact section payload differs';
    end if;

    with expected_mappings as (
      select catalog_version_id, runtime_interaction_id, source_node_id, source_code, mapping_role, output_variable_name, route_id
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
    ), mapping_diffs as (
      select count(*) c from ((select * from expected_mappings) except all (select * from persisted_mappings)) d
      union all
      select count(*) c from ((select * from persisted_mappings) except all (select * from expected_mappings)) d
    )
    select coalesce(sum(c),0) into v_mapping_diff from mapping_diffs;

    if v_mapping_diff <> 0 then
      raise exception 'blocked_catalog_identity_content_conflict: interaction mapping content differs';
    end if;

    return jsonb_build_object(
      'status','idempotent_replay',
      'transaction_result','no_write_idempotent',
      'counts',v_counts
    );
  end if;

  insert into public.runtime_catalog_version (
    catalog_version_id, version_label, spec_version_label, status,
    source_xlsx_filename, source_xlsx_checksum, source_docx_filename, source_docx_checksum,
    mother_catalog_version, runtime_rule_mother, notes
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
    v_catalog_version->>'notes'
  );

  insert into public.runtime_catalog_artifact_section (
    catalog_version_id, section_name, sheet_name, sheet_index, source_file, source_checksum,
    headers, payload_json, fingerprint, validation_status
  )
  select catalog_version_id, section_name, sheet_name, sheet_index, source_file, source_checksum,
    headers, payload_json, fingerprint, validation_status
  from jsonb_to_recordset(v_records->'artifactSections') as x(
    catalog_version_id text, section_name text, sheet_name text, sheet_index int, source_file text,
    source_checksum text, headers jsonb, payload_json jsonb, fingerprint text, validation_status text
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
    catalog_version_id, runtime_interaction_id, interaction_group, group_normalized, block_id,
    runtime_order, function_name, visible_text, ui_component, runtime_role, trigger_condition,
    raw_payload, source_row, trace_id, opens_nodes, closes_nodes, mutual_exclusion_policy,
    free_text_weight, fatigue_policy, must_not_infer, confirmation_weight, canonical_variables,
    required_variables, derived_variables, optional_variables, can_be_inferred_from
  )
  select catalog_version_id, runtime_interaction_id, interaction_group::eve_runtime_group_source,
    group_normalized::eve_runtime_group_normalized, block_id, runtime_order, function_name,
    visible_text, ui_component, runtime_role, trigger_condition, raw_payload, source_row, trace_id,
    opens_nodes, closes_nodes, mutual_exclusion_policy, free_text_weight, fatigue_policy,
    must_not_infer, confirmation_weight, canonical_variables, required_variables,
    derived_variables, optional_variables, can_be_inferred_from
  from jsonb_to_recordset(v_records->'interactionDefinitions') as x(
    catalog_version_id text, runtime_interaction_id text, interaction_group text, group_normalized text,
    block_id text, runtime_order int, function_name text, visible_text text, ui_component text,
    runtime_role text, trigger_condition text, raw_payload jsonb, source_row int, trace_id text,
    opens_nodes text, closes_nodes text, mutual_exclusion_policy text, free_text_weight text,
    fatigue_policy text, must_not_infer text, confirmation_weight text, canonical_variables text,
    required_variables text, derived_variables text, optional_variables text, can_be_inferred_from text
  );

  -- TR-028 / CATID-R1 / staging contract 040-A: eight real columns only.
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
    catalog_version_id, runtime_interaction_id, subfield_ordinal, subfield_name,
    source_file, source_sheet, source_row, raw_payload, trace_id
  )
  select catalog_version_id, runtime_interaction_id, subfield_ordinal, subfield_name,
    source_file, source_sheet, source_row, raw_payload, trace_id
  from jsonb_to_recordset(v_records->'subfields') as x(
    catalog_version_id text, runtime_interaction_id text, subfield_ordinal int, subfield_name text,
    source_file text, source_sheet text, source_row int, raw_payload jsonb, trace_id text
  );

  insert into public.runtime_branching_rule (
    catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  )
  select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  from jsonb_to_recordset(v_records->'branchingRules') as x(
    catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
    source_file text, source_sheet text, source_row int, source_column text, trace_id text, source_checksum text
  );

  insert into public.runtime_epistemic_rule (
    catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  )
  select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  from jsonb_to_recordset(v_records->'epistemicRules') as x(
    catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
    source_file text, source_sheet text, source_row int, source_column text, trace_id text, source_checksum text
  );

  insert into public.runtime_variable_map (
    catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  )
  select catalog_version_id, runtime_interaction_id, field_name, raw_literal,
    source_file, source_sheet, source_row, source_column, trace_id, source_checksum
  from jsonb_to_recordset(v_records->'variableMaps') as x(
    catalog_version_id text, runtime_interaction_id text, field_name text, raw_literal text,
    source_file text, source_sheet text, source_row int, source_column text, trace_id text, source_checksum text
  );

  v_counts := public.eve_runtime_40_20_catalog_draft_counts(v_catalog_version_id);
  if v_counts is distinct from v_expected then
    raise exception 'blocked_remote_transaction_contract_incomplete: post-load count mismatch %, expected %', v_counts, v_expected;
  end if;

  return jsonb_build_object('status','draft_loaded','transaction_result','committed','counts',v_counts);
end;
$$;

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

revoke all on function public.eve_runtime_40_20_load_catalog_draft(jsonb) from public, anon, authenticated;
revoke all on function public.eve_runtime_40_20_catalog_draft_counts(text) from public, anon, authenticated;
grant execute on function public.eve_runtime_40_20_load_catalog_draft(jsonb) to service_role;
grant execute on function public.eve_runtime_40_20_catalog_draft_counts(text) to service_role;
