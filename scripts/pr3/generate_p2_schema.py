#!/usr/bin/env python3
from __future__ import annotations
import json, re, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
A06=ROOT/'pr3/authority/A06_PR3_AUTHORITATIVE_PERSISTENCE_MAPPING_v1_3.json'
A07=ROOT/'pr3/authority/A07_PR3_IDENTITY_REVISION_IDEMPOTENCY_LEDGER_v1_2.json'
SQL_OUT=ROOT/'supabase-pr3/migrations/20261001191500_pr3_clean_state_plane.sql'
MAP_OUT=ROOT/'pr3/P2_PR3_PHYSICAL_PERSISTENCE_MAPPING_v1_0.json'

def snake(name:str)->str:
    return re.sub(r'(?<!^)(?=[A-Z])','_',name).lower()

JSON_FIELDS=set('''ordered_member_refs nodes edges ai_policy provenance raw_value literal_or_value value proposed_value source_refs input_refs restrictions gap_refs evidence_refs context_sources payload qualified_scope criterion_ids interaction_classes risk_classes generator_compatibility criterion_results target_ids target_refs source_package_refs details result_payload_json side_effect_refs metric_or_fact'''.split())
JSON_FIELDS.update({'retry_policy','reentry_policy'})
TIMESTAMP_FIELDS={x for x in '''opened_at created_at completed_at started_at shown_at received_at decided_at recorded_at requested_at valid_from expires_at released_at event_at server_time next_attempt_at resolved_at'''.split()}
INTEGER_FIELDS={x for x in '''member_count run_ordinal execution_ordinal opening_ordinal response_revision revision package_revision attempt_count delta input_package_revision'''.split()}
BOOLEAN_FIELDS={'current'}
HASH_FIELDS={x for x in '''sha256 contract_set_sha256 profile_sha256 mother_contract_sha256 runtime_sha256 promotion_receipt_sha256 definition_sha256 payload_sha256 result_payload_sha256'''.split()}

PK={
'AuthorityArtifact':['artifact_id','revision','sha256'], 'ContractSet':['contract_set_id','contract_set_sha256'],
'ObjectBinding':['object_binding_id'], 'ChainDefinition':['chain_definition_id','revision','definition_sha256'],
'CaseScope':['case_id','scope_revision'], 'Participant':['case_id','participant_id'],
'RoleAssignment':['role_assignment_id'], 'Activity':['role_id','activity_id','workmap_revision'],
'ChainRun':['chain_run_id'], 'ObjectRun':['object_run_id'], 'InteractionInstance':['interaction_key'],
'PresentationEvent':['presentation_event_id'], 'ResponseEvent':['response_key'], 'EvidenceItem':['evidence_id'],
'CanonicalVariableRecord':['variable_record_id'], 'CandidateRecord':['candidate_id'], 'BranchDecision':['branch_decision_id'],
'BudgetLedger':['budget_event_id'], 'GapRecord':['gap_id'], 'ReadinessDecision':['readiness_decision_id'],
'AIOperation':['ai_operation_id'], 'AIProposal':['proposal_id'], 'EvaluatorAuthority':['evaluator_authority_id','revision'],
'EvaluationRecord':['evaluation_record_id'], 'AdmissionDecision':['admission_decision_id'], 'HumanDecision':['human_decision_id'],
'MaterialPackage':['material_package_id'], 'HandoffEvent':['handoff_event_id'], 'AuditEvent':['audit_event_id'],
'CommandReceipt':['command_receipt_id'], 'OutboxEvent':['outbox_event_id'], 'PilotObservation':['pilot_observation_id']}

def pgtype(rec, f):
    name=f['field']
    if name in JSON_FIELDS: return 'jsonb'
    if name in TIMESTAMP_FIELDS: return 'timestamptz'
    if name in BOOLEAN_FIELDS: return 'boolean'
    if name in INTEGER_FIELDS:
        # generic revision is textual on authority records and chain definition; numeric on material revisions.
        if name=='revision' and rec in {'AuthorityArtifact','ChainDefinition','EvaluatorAuthority'}: return 'text'
        return 'bigint'
    if name.endswith('_count') or name.endswith('_ordinal'): return 'bigint'
    return 'text'

a06=json.load(open(A06,encoding='utf-8')); a07=json.load(open(A07,encoding='utf-8'))
key_profiles={x['logical_record']:x for x in a07['key_profiles']}
lines=[]
lines += ["-- EVE PR3 P2 clean state plane v1.0", "-- GENERATED from A06 v1.3 + A07 v1.2. Legacy Supabase is NOT a baseline.", "-- Physical policy for the pilot: one logical record family per table to preserve authority/reentry boundaries.", "create schema if not exists eve_pr3;", "create extension if not exists pgcrypto;", ""]
physical=[]
for rec in a06['logical_records']:
    rn=rec['logical_record']; tn=snake(rn)
    cols=[]; fmap=[]
    for f in rec['fields']:
        t=pgtype(rn,f); null='' if f['nullable'] else ' not null'
        check=''
        if f['field'] in HASH_FIELDS:
            check=f" check ({f['field']} ~ '^[0-9a-f]{{64}}$')"
        cols.append(f"  {f['field']} {t}{null}{check}")
        fmap.append({**f,'physical_target':f'eve_pr3.{tn}.{f["field"]}','pg_type':t})
    pk=PK[rn]
    cols.append(f"  primary key ({', '.join(pk)})")
    # A07 exact key fields are also unique when all are physical fields.
    kp=key_profiles.get(rn)
    if kp and all(k in {f['field'] for f in rec['fields']} for k in kp['key_fields']):
        ks=kp['key_fields']
        if ks!=pk:
            cols.append(f"  unique ({', '.join(ks)})")
    if rn=='CommandReceipt':
        # COMMAND_RECEIPT_KEY is already emitted above from A07 when all key fields
        # are physical. Do not duplicate the same UNIQUE constraint here.
        cols.append("  unique (idempotency_key)")
        cols.append("  check (receipt_state in ('ACCEPTED','REJECTED_PRECONDITION'))")
    if rn=='HandoffEvent': cols.append("  check (event_type in ('RELEASE','RECEIPT','CONSUMPTION'))")
    lines.append(f"create table if not exists eve_pr3.{tn} (\n"+',\n'.join(cols)+"\n);")
    lines.append(f"alter table eve_pr3.{tn} enable row level security;")
    lines.append(f"alter table eve_pr3.{tn} force row level security;")
    lines.append("")
    physical.append({'logical_record':rn,'physical_table':f'eve_pr3.{tn}','primary_key':pk,'field_count':len(fmap),'fields':fmap})

# Safe, unambiguous relational constraints.
fks=[
('object_run','chain_run_id','chain_run','chain_run_id'),('interaction_instance','object_run_id','object_run','object_run_id'),
('presentation_event','object_run_id','object_run','object_run_id'),('presentation_event','interaction_key','interaction_instance','interaction_key'),
('response_event','object_run_id','object_run','object_run_id'),('response_event','interaction_key','interaction_instance','interaction_key'),
('evidence_item','object_run_id','object_run','object_run_id'),('evidence_item','response_key','response_event','response_key'),
('canonical_variable_record','object_run_id','object_run','object_run_id'),('candidate_record','object_run_id','object_run','object_run_id'),
('branch_decision','object_run_id','object_run','object_run_id'),('budget_ledger','object_run_id','object_run','object_run_id'),
('gap_record','object_run_id','object_run','object_run_id'),('readiness_decision','object_run_id','object_run','object_run_id'),
('ai_operation','object_run_id','object_run','object_run_id'),('ai_proposal','ai_operation_id','ai_operation','ai_operation_id'),
('evaluation_record','object_run_id','object_run','object_run_id'),('evaluation_record','proposal_id','ai_proposal','proposal_id'),
('admission_decision','object_run_id','object_run','object_run_id'),('admission_decision','proposal_id','ai_proposal','proposal_id'),
('admission_decision','evaluation_record_id','evaluation_record','evaluation_record_id'),('human_decision','object_run_id','object_run','object_run_id'),
('material_package','producer_object_run_id','object_run','object_run_id'),('handoff_event','material_package_id','material_package','material_package_id'),
('handoff_event','producer_object_run_id','object_run','object_run_id'),('audit_event','chain_run_id','chain_run','chain_run_id'),
('command_receipt','chain_run_id','chain_run','chain_run_id'),('outbox_event','chain_run_id','chain_run','chain_run_id'),
('pilot_observation','chain_run_id','chain_run','chain_run_id')]
for a,ac,b,bc in fks:
    # nullable refs remain valid; postgres FK permits null.
    cname=f'fk_{a}_{ac}'
    lines.append(f"alter table eve_pr3.{a} drop constraint if exists {cname};")
    lines.append(f"alter table eve_pr3.{a} add constraint {cname} foreign key ({ac}) references eve_pr3.{b}({bc}) deferrable initially deferred;")
lines.append("")
# Useful indexes for runtime access/reentry without changing semantics.
indexes=[
('chain_run','case_id, participant_id, role_id, activity_id, state'),('object_run','chain_run_id, object_key, state'),
('interaction_instance','object_run_id, state, opening_ordinal'),('response_event','object_run_id, interaction_key, subfield_id, response_revision'),
('canonical_variable_record','object_run_id, variable_id, revision'),('gap_record','object_run_id, state, gap_type'),
('readiness_decision','object_run_id, consumer_id, decided_at'),('handoff_event','material_package_id, event_type, event_at'),
('audit_event','chain_run_id, event_at'),('command_receipt','command_event_id, operation'),('outbox_event','delivery_state, next_attempt_at')]
for t,cols in indexes:
    nm='idx_'+t+'_'+re.sub('[^a-z0-9]+','_',cols.lower()).strip('_')[:45]
    lines.append(f"create index if not exists {nm} on eve_pr3.{t} ({cols});")
lines.append("")
# No direct browser/table access. BFF/ExecutionService is the only product write/read boundary.
lines += [
"revoke all on schema eve_pr3 from public;",
"do $$ begin if exists (select 1 from pg_roles where rolname='anon') then revoke all on all tables in schema eve_pr3 from anon; end if; end $$;",
"do $$ begin if exists (select 1 from pg_roles where rolname='authenticated') then revoke all on all tables in schema eve_pr3 from authenticated; end if; end $$;",
"do $$ begin if exists (select 1 from pg_roles where rolname='service_role') then grant usage on schema eve_pr3 to service_role; grant select,insert,update,delete on all tables in schema eve_pr3 to service_role; end if; end $$;",
""]

SQL_OUT.write_text('\n'.join(lines),encoding='utf-8')
physical_map={
'artifact_id':'EVE-PR3-P2-PHYSICAL-PERSISTENCE-MAPPING-v1.0','state':'IMPLEMENTED_NOT_DEPLOYED','authority':'A06 v1.3 + A07 v1.2 + PR3 v1.2.1',
'physical_strategy':'ONE_LOGICAL_RECORD_FAMILY_PER_TABLE_FOR_PILOT_AUDITABILITY','rationale':'Avoid semantic blending during first real pilot; table consolidation is a later optimization and cannot change logical identity or authority.',
'legacy_policy':'LEGACY_EVIDENCE_NOT_BASELINE__ZERO_REUSE','schema':'eve_pr3','logical_record_count':len(physical),'logical_field_mapping_count':sum(x['field_count'] for x in physical),
'physical_table_count':len(physical),'records':physical,
'rls_policy':'RLS enabled+forced on every table; anon/authenticated direct table privileges revoked; product traffic only through trusted BFF/ExecutionService.',
'sql_migration':str(SQL_OUT.relative_to(ROOT)),
}
MAP_OUT.write_text(json.dumps(physical_map,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')
print(SQL_OUT)
print(MAP_OUT)
print('tables',len(physical),'fields',physical_map['logical_field_mapping_count'])
