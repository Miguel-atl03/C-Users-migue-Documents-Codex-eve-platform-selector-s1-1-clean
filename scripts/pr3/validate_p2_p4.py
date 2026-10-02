#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, pathlib, re, subprocess, sys

ROOT=pathlib.Path(__file__).resolve().parents[2]
AUTH=ROOT/'pr3'/'authority'
SQL=ROOT/'supabase-pr3'/'migrations'/'20261001191500_pr3_clean_state_plane.sql'
SEED=ROOT/'supabase-pr3'/'migrations'/'20261001191600_pr3_authority_seed.sql'
PHYS=ROOT/'pr3'/'P2_PR3_PHYSICAL_PERSISTENCE_MAPPING_v1_0.json'
SEED_MAN=ROOT/'pr3'/'P2_PR3_AUTHORITY_SEED_MANIFEST_v1_0.json'
EVID=ROOT/'pr3'/'P2_P4_FALSIFICATION_EVIDENCE_v1_0.json'

errors=[]; checks={}
def ok(cond,msg):
    if not cond: errors.append(msg)
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def load(p): return json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
def snake(name): return re.sub(r'(?<!^)(?=[A-Z])','_',name).lower()

# Regenerate derivable P2 artifacts from authority before validation.
for script in ['generate_p2_schema.py','generate_p2_authority_seed.py']:
    cp=subprocess.run([sys.executable,str(ROOT/'scripts'/'pr3'/script)],cwd=ROOT,text=True,capture_output=True)
    ok(cp.returncode==0,f'{script} failed: {cp.stderr or cp.stdout}')

# Portable prior verifier: must work only with packaged relative evidence.
portable=ROOT/'scripts'/'pr3'/'verify_limits_command_receipt.py'
ok(portable.exists(),'portable limits verifier missing')
if portable.exists():
    text=portable.read_text(encoding='utf-8')
    ok('/mnt/data/' not in text,'portable verifier still contains an absolute local /mnt/data path')
    cp=subprocess.run([sys.executable,str(portable)],cwd=ROOT,text=True,capture_output=True)
    ok(cp.returncode==0,'portable limits verifier did not PASS')
    try: checks['portable_limits_verifier']=json.loads(cp.stdout)
    except Exception: checks['portable_limits_verifier']={'returncode':cp.returncode,'stdout':cp.stdout[-2000:],'stderr':cp.stderr[-2000:]}

# P2 logical→physical exact coverage.
a06=load(AUTH/'A06_PR3_AUTHORITATIVE_PERSISTENCE_MAPPING_v1_3.json')
a07=load(AUTH/'A07_PR3_IDENTITY_REVISION_IDEMPOTENCY_LEDGER_v1_2.json')
phys=load(PHYS)
sql=SQL.read_text(encoding='utf-8')
expected_tables={snake(r['logical_record']):r for r in a06['logical_records']}
created_tables=re.findall(r'create table if not exists eve_pr3\.([a-z0-9_]+)\s*\(',sql,re.I)
ok(len(expected_tables)==32,'A06 logical record count expected 32')
ok(set(created_tables)==set(expected_tables),f'physical tables differ from A06: missing={sorted(set(expected_tables)-set(created_tables))} extra={sorted(set(created_tables)-set(expected_tables))}')
ok(phys.get('logical_record_count')==32 and phys.get('physical_table_count')==32,'physical mapping table counts not 32/32')
ok(phys.get('logical_field_mapping_count')==341,'physical mapping field count not 341')
# Exact field targets from physical mapping.
pfields={(r['logical_record'],f['field']) for r in phys['records'] for f in r['fields']}
afields={(r['logical_record'],f['field']) for r in a06['logical_records'] for f in r['fields']}
ok(pfields==afields,f'A06→P2 field coverage mismatch: missing={len(afields-pfields)} extra={len(pfields-afields)}')
# Every physical table has RLS + FORCE RLS.
for t in expected_tables:
    ok(f'alter table eve_pr3.{t} enable row level security;' in sql,f'RLS enable missing for {t}')
    ok(f'alter table eve_pr3.{t} force row level security;' in sql,f'FORCE RLS missing for {t}')
for forbidden in ['shrpiwkxcdgvbqymjecx','bwflscplkjohdhkiqqoc','sqlite','public.runtime_catalog_version','eve_capture_mvp']:
    ok(forbidden.lower() not in sql.lower(),f'legacy/forbidden dependency in clean P2 SQL: {forbidden}')
ok(sql.count("unique (operation, command_scope_ref, command_event_id)")==1,'CommandReceipt exact command identity uniqueness must appear exactly once')
ok("unique (idempotency_key)" in sql,'CommandReceipt idempotency uniqueness missing')
ok("check (receipt_state in ('ACCEPTED','REJECTED_PRECONDITION'))" in sql,'CommandReceipt persisted state boundary missing')
checks['p2_schema']={'tables':len(created_tables),'fields':len(pfields),'sql_sha256':sha(SQL),'mapping_sha256':sha(PHYS),'legacy_reuse':'NONE'}

# P2 immutable authority seed / hash reproducibility.
seedman=load(SEED_MAN); seed_sql=SEED.read_text(encoding='utf-8')
ok(seedman.get('contract_set_reproduction')=='4/4_MATCH','authority seed did not reproduce 4/4 contract sets')
ok(seedman.get('seed_counts')=={'authority_artifact':28,'contract_set':4,'object_binding':4,'chain_definition':1},'authority seed counts differ')
ok(seedman.get('migration_sha256')==sha(SEED),'seed manifest migration hash mismatch')
for forbidden in ['shrpiwkxcdgvbqymjecx','bwflscplkjohdhkiqqoc','sqlite']:
    ok(forbidden.lower() not in seed_sql.lower(),f'legacy dependency in authority seed: {forbidden}')
checks['p2_authority_seed']={'seed_counts':seedman.get('seed_counts'),'migration_sha256':sha(SEED)}

# A07 exact key test vectors remain reproducible after physical materialization.
def canon_value(v):
    if v is None:return 'null'
    if isinstance(v,bool):return 'true' if v else 'false'
    if isinstance(v,(int,float)):return json.dumps(v,separators=(',',':'))
    if isinstance(v,str):return v
    return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def h(s):return hashlib.sha256(s.encode('utf-8')).hexdigest()
vecs=a07['reproducibility_test_vectors']
failvec=[]
for v in vecs:
    if 'preimage_utf8' in v:
        digest=h(v['preimage_utf8'])
        if digest!=v['identity_sha256']: failvec.append(v.get('key_ref','?'))
ok(not failvec,f'A07 vector mismatch: {failvec}')
checks['a07_vectors']={'count':len(vecs),'all_identity_hashes_match':not failvec}

# P4 files/routes + boundaries.
route_names=['action-token','open-or-resume','respond','correct','resume','state']
for name in route_names:
    ok((ROOT/f'src/app/api/eve/pr3/pilot/runtime/{name}/route.ts').exists(),f'P4 route missing: {name}')
page=(ROOT/'src/app/pr3-pilot/page.tsx').read_text(encoding='utf-8') + (ROOT/'src/components/Pr3CleanAuthGate.tsx').read_text(encoding='utf-8')
runner=(ROOT/'src/components/Pr3PilotRuntimeRunner.tsx').read_text(encoding='utf-8')
contracts=(ROOT/'src/services/eve/pr3/contracts.ts').read_text(encoding='utf-8')
repo=(ROOT/'src/services/eve/pr3/repository.ts').read_text(encoding='utf-8')
service=(ROOT/'src/services/eve/pr3/execution-service.ts').read_text(encoding='utf-8')
auth=(ROOT/'src/services/eve/pr3/auth.ts').read_text(encoding='utf-8')
env=(ROOT/'.env.pr3.example').read_text(encoding='utf-8')
ok('Pr3PilotRuntimeRunner' in page and 'NEXT_PUBLIC_EVE_PR3_PILOT_ENABLED' in page,'PR3 runner not mounted behind explicit feature gate')
ok(all(name not in page for name in ['participantContext', 'runtimeFullFrontdoor', 'authSession.access_token']), 'standalone PR3 frontdoor depends on legacy state')
ok('authSession.access_token' not in runner,'PR3 runner reuses legacy Supabase access token')
ok('NEXT_PUBLIC_SUPABASE' not in runner and 'NEXT_PUBLIC_SUPABASE' not in repo and 'STAGING_SUPABASE' not in repo,'PR3 clean path has legacy Supabase environment dependency')
ok('EVE_PR3_DATABASE_URL' in repo,'clean database URL missing')
ok('pr3_promoted_runtime_state_projection_adapter_not_deployed' in repo,'Postgres projection path should fail closed until promoted adapter persists authoritative P2 records')
ok('PR3_STATE_PROJECTION' not in repo,'PilotObservation is being misused as hidden state store')
ok('pr3_clean_auth_not_configured' in auth and 'pr3_local_test_auth_forbidden_in_production' in auth,'clean auth does not fail closed')
ok('SYNTHETIC_RUNTIME_FORBIDDEN_IN_PRODUCTION' in service and 'PROMOTED_RUNTIME_ADAPTER_NOT_DEPLOYED' in service,'runtime adapter production boundary missing')
ok('ACTION_TOKEN_BINDING_MISMATCH' in service and 'Object.entries(expected)' in service,'action-token full request binding check missing')
ok('slot_ref' in runner and 'raw_value' in runner,'UI does not return opaque slot_ref/raw value')
sheet=(ROOT/'src/components/eve-worksheet/RuntimeInteractionSheet.tsx').read_text(encoding='utf-8')
legacy_runner=(ROOT/'src/components/RuntimeFullQuestionnaireRunner.tsx').read_text(encoding='utf-8')
ok('preferSlotOptions = false' in sheet,'shared RuntimeInteractionSheet does not preserve legacy option behavior by default')
ok('preferSlotOptions' in runner,'PR3 runner does not opt into exact per-slot option domains')
ok('preferSlotOptions' not in legacy_runner,'legacy questionnaire was unintentionally opted into PR3 slot-option behavior')
# UI must not own branching/readiness/AI/next. Searching for direct calculation patterns, not server result property names.
for forbidden in ['contract_set_id =','object_key =','runtime_definition_id =','branching_rule =','readiness_state =','ai_mode =']:
    ok(forbidden not in runner,f'UI appears to assign authoritative field: {forbidden}')
ok('The next question' not in runner,'sanity')
ok('LEGACY_EVIDENCE_NOT_BASELINE' in env,'PR3 environment file does not preserve legacy exclusion')
checks['p4_surface']={'routes':route_names,'feature_gate':True,'legacy_auth_reuse':False,'production_runtime_adapter':'BLOCKED_UNTIL_PROMOTED_ADAPTER'}

# P4 operation coverage from closed A04 remains exact in implementation-facing types/routes.
a04=load(AUTH/'A04_PR3_UI_API_BFF_RUNTIME_BINDING_v1_1.json')
route_ops=[x['operation'] for x in a04['api_bff']['routes']]
for op in ['ISSUE_ACTION_TOKEN','OPEN_OR_RESUME','SUBMIT_RESPONSE','SUBMIT_CORRECTION','RESUME','READ_STATE']:
    ok(op in route_ops,f'A04 operation missing {op}')
external_ops=['ISSUE_ACTION_TOKEN','OPEN_OR_RESUME','SUBMIT_RESPONSE','SUBMIT_CORRECTION','RESUME']
internal_ops=['INTERNAL_AI','HUMAN_EXCEPTION','HANDOFF']
for op in external_ops:
    ok(op in contracts and f'operation:"{op}"' in service.replace(' ',''),f'P4 CommandReceipt implementation coverage missing {op}')
for op in internal_ops:
    ok(op in contracts and op in {x['operation'] for x in a07['command_scope_profiles']},f'A07 internal CommandReceipt scope missing {op}')
ok('export async function executePr3ReceiptBound' in service,'generic receipt-bound execution primitive is not exported for deferred P3/A09/A10 handlers')
checks['command_receipt_implementation']={'covered_now':external_ops,'deferred_owner_operations':internal_ops,'deferred_state':'IDENTITY_SCOPE_AND_GENERIC_RECEIPT_PRIMITIVE_ALREADY_DEFINED__HANDLERS_BELONG_TO_P3_A09_A10','pure_read':'READ_STATE'}

# P4 QA fixture source should expose help + fallback + reentry/resume paths without pretending production semantics.
ok('QA_SYNTHETIC_NON_SEMANTIC_NON_PRODUCTION' in service,'QA adapter not explicitly non-semantic/non-production')
ok('help_text' in service and 'fallback_textarea' in runner,'help/fallback QA path missing')
ok('reentry_descriptor' in runner and 'RESUME' in runner,'reentry/resume UI path missing')
ok('SUBMIT_CORRECTION' in service and '/correct' in contracts,'correction API path missing')
checks['p4_qa_paths']={'render':True,'response':True,'correction_api':True,'retry':True,'help':True,'fallback':True,'reentry':True,'resume':True}
# Deterministic receipt/retry/correction/resume harness (contract-level, not promoted Runtime execution).
qa=subprocess.run([sys.executable,str(ROOT/'scripts'/'pr3'/'p4_command_receipt_qa.py')],cwd=ROOT,text=True,capture_output=True)
ok(qa.returncode==0,'P4 CommandReceipt QA harness failed')
try: checks['p4_command_receipt_qa']=json.loads(qa.stdout)
except Exception: checks['p4_command_receipt_qa']={'returncode':qa.returncode,'stdout':qa.stdout[-2000:],'stderr':qa.stderr[-2000:]}

state='PASS' if not errors else 'FAIL'
out={'artifact_id':'EVE-PR3-P2-P4-FALSIFICATION-EVIDENCE-v1.0','state':state,'errors':errors,'checks':checks,
     'limits':{'does_not_certify':'PostgreSQL deployment, promoted Runtime adapter, clean browser auth, real B0→B2 execution or pilot readiness.'}}
EVID.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
sys.exit(0 if state=='PASS' else 1)
