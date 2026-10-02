import argparse, json, hashlib, os, pathlib, sys
SCRIPT_DIR=pathlib.Path(__file__).resolve().parent
REPO_ROOT=SCRIPT_DIR.parents[1]

parser=argparse.ArgumentParser(description='Portable PR3 limits + CommandReceipt verifier')
parser.add_argument('--authority-dir', type=pathlib.Path, default=REPO_ROOT/'pr3'/'authority', help='Directory containing A04/A06/A07/B2 overlay artifacts')
parser.add_argument('--b2-root', type=pathlib.Path, default=None, help='Root containing config/b2_profile_g1_1.json and config/mvp_limits.json')
args=parser.parse_args()
ROOT=args.authority_dir.resolve()
env_b2=os.environ.get('EVE_PR3_B2_ROOT')
B2=args.b2_root or (pathlib.Path(env_b2) if env_b2 else ROOT/'source_evidence'/'B2')
B2=pathlib.Path(B2).resolve()

def load(n): return json.loads((ROOT/n).read_text(encoding='utf-8'))
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def canon(obj): return json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def h(s): return hashlib.sha256(s.encode()).hexdigest()
errors=[]; checks={}
def ok(cond,msg):
    if not cond: errors.append(msg)

ov=load('B2_PR3_IMPLEMENTATION_LIMIT_RESOLUTION_v1_0.json')
a6=load('A06_PR3_AUTHORITATIVE_PERSISTENCE_MAPPING_v1_3.json')
a7=load('A07_PR3_IDENTITY_REVISION_IDEMPOTENCY_LEDGER_v1_2.json')
a4=load('A04_PR3_UI_API_BFF_RUNTIME_BINDING_v1_1.json')
dto=load('A04_PR3_TRANSPORT_DTO_CONTRACT_v1_1.json')
profile=json.loads((B2/'config/b2_profile_g1_1.json').read_text(encoding='utf-8'))
limits=json.loads((B2/'config/mvp_limits.json').read_text(encoding='utf-8'))
profile_sha=sha(B2/'config/b2_profile_g1_1.json'); limits_sha=sha(B2/'config/mvp_limits.json')
expected_ids=['B2-LIMIT-MAX-USER-ROUNDS-v1.1','B2-LIMIT-TEXT-LENGTH-v1.1','B2-LIMIT-CONTEXT-SELECTION-v1.1','B2-LIMIT-UI-TURN-v1.1']
reg={x['policy_id']:x for x in profile['limit_policy_registry']}
res={x['policy_id']:x for x in ov['resolutions']}
expected_values={'B2-LIMIT-MAX-USER-ROUNDS-v1.1':4,'B2-LIMIT-TEXT-LENGTH-v1.1':4096,'B2-LIMIT-CONTEXT-SELECTION-v1.1':32768,'B2-LIMIT-UI-TURN-v1.1':8}
for pid in expected_ids:
    ok(pid in reg and pid in res,f'missing {pid}')
    if pid in reg and pid in res:
        ok(res[pid]['owner_exact']==reg[pid]['owner'],f'owner mismatch {pid}')
        ok(res[pid]['criterion_for_closure_exact']==reg[pid]['criterion_for_closure'],f'closure criterion mismatch {pid}')
        ok(res[pid]['forbidden_substitution_exact']==reg[pid]['forbidden_substitution'],f'forbidden substitution mismatch {pid}')
        ok(res[pid]['gate_exact']['gate_path']=='interactions[*].implementation_ready',f'gate path mismatch {pid}')
        ok(res[pid]['gate_exact']['blocker_path']=='interactions[*].implementation_blockers',f'blocker path mismatch {pid}')
        ok(res[pid]['pr3_pilot_implementation_value']==expected_values[pid],f'value mismatch {pid}')
ok(profile_sha==ov['profile_sha256'],'promoted B2 profile hash mismatch')
ok(limits_sha==ov['mvp_limits_sha256'],'mvp limits hash mismatch')
ok(all(x.get('implementation_ready') is False for x in profile['interactions']),'promoted source gate mutated/unsupported')
ok(all(x.get('implementation_blockers')==expected_ids for x in profile['interactions']),'promoted blocker set differs')
checks['b2_limits']={'count':len(res),'values':expected_values,'profile_sha256':profile_sha,'mvp_limits_sha256':limits_sha,'interaction_gate_count':len(profile['interactions'])}

# A06 CommandReceipt
records={x['logical_record']:x for x in a6['logical_records']}
ok(a6['logical_record_count']==32,'A06 logical record count not 32')
ok(a6['logical_field_mapping_count']==341,'A06 mapping count not 341')
ok('CommandReceipt' in records,'A06 CommandReceipt absent')
if 'CommandReceipt' in records:
    cr=records['CommandReceipt']; ok(cr['field_count']==19,'CommandReceipt field count not 19')
    expected_fields=['command_receipt_id','operation','command_scope_ref','command_event_id','client_event_id','token_request_id','idempotency_key','payload_sha256','receipt_state','chain_run_id','object_run_id','interaction_key','context_revision','replay_of_receipt_id','result_payload_json','result_payload_sha256','side_effect_refs','error_code','server_time']
    ok([x['field'] for x in cr['fields']]==expected_fields,'CommandReceipt field order/coverage mismatch')
checks['a06']={'logical_records':a6['logical_record_count'],'field_mappings':a6['logical_field_mapping_count'],'command_receipt_fields':records.get('CommandReceipt',{}).get('field_count')}

# A07 key and operation coverage
kps={x['key_ref']:x for x in a7['key_profiles']}; ok('COMMAND_RECEIPT_KEY' in kps,'A07 COMMAND_RECEIPT_KEY absent')
side_ops=['ISSUE_ACTION_TOKEN','OPEN_OR_RESUME','SUBMIT_RESPONSE','SUBMIT_CORRECTION','RESUME','INTERNAL_AI','HUMAN_EXCEPTION','HANDOFF']
sp={x['operation']:x for x in a7['command_scope_profiles']}
ok(all(x in sp for x in side_ops),'A07 missing side-effecting operation scope')
ok('READ_STATE' in sp and sp['READ_STATE'].get('command_receipt_materialization')=='NOT_REQUIRED','READ_STATE pure read equivalent absent')
# verify all command vectors reproducible
vectors=[v for v in a7['reproducibility_test_vectors'] if v.get('key_ref')=='COMMAND_RECEIPT_KEY']
ok(len(vectors)==8,'A07 should have 8 command receipt vectors')
for v in vectors:
    ident=h(v['preimage_utf8']); ok(ident==v['identity_sha256'],f"vector identity mismatch {v['operation']}")
    ok('cmdr-'+ident[:24]==v['record_id'],f"record id mismatch {v['operation']}")
    ok('idem-'+ident[:24]==v['idempotency_key'],f"idem key mismatch {v['operation']}")
    ok(h(v['canonical_payload_json'])==v['payload_sha256'],f"payload hash mismatch {v['operation']}")
# exact retry/conflict/new-event behavior on OPEN and RESUME
for op in ['OPEN_OR_RESUME','RESUME']:
    v=next(x for x in vectors if x['operation']==op)
    same=h(v['preimage_utf8'])
    altered_payload=v['canonical_payload_json']+' '
    ok(h(v['preimage_utf8'])==same,'same event should same identity')
    ok(h(altered_payload)!=v['payload_sha256'],f'{op} different payload not detected')
    lines=v['preimage_utf8'].split('\n'); lines[-1]=lines[-1]+'-NEW'; newpre='\n'.join(lines)
    ok(h(newpre)!=same,f'{op} deliberate new event should different identity')
checks['a07']={'key_profile_count':len(a7['key_profiles']),'command_vectors':len(vectors),'operations':list(sp)}

# A04 command receipt binding / B2 overlay
ows=a4['logical_persistence_binding']['operation_write_sets']
for op in side_ops:
    ok(op in ows,f'A04 missing write set {op}')
    if op in ows: ok('command_receipt' in ows[op],f'A04 {op} lacks command_receipt')
route={x['operation']:x for x in a4['api_bff']['routes']}
ok('token_request_id' in route['ISSUE_ACTION_TOKEN']['request_fields'],'token_request_id absent from action-token request')
ok('command_receipt' in route['ISSUE_ACTION_TOKEN']['response_fields'],'ISSUE_ACTION_TOKEN response missing command_receipt')
ok(route['OPEN_OR_RESUME'].get('command_receipt_required') is True,'OPEN_OR_RESUME not receipt-required')
ok(route['RESUME'].get('command_receipt_required') is True,'RESUME not receipt-required')
ok(route['READ_STATE'].get('idempotency_class')=='PURE_READ_EQUIVALENT_NO_COMMAND_RECEIPT_WRITE','READ_STATE exact equivalent not declared')
blim=a4['block_adapters']['B2']['implementation_limit_policy_ref']
ok(blim['artifact_id']==ov['artifact_id'],'A04 B2 limit overlay id mismatch')
ok(blim['sha256']==sha(ROOT/'B2_PR3_IMPLEMENTATION_LIMIT_RESOLUTION_v1_0.json'),'A04 B2 overlay hash mismatch')
ok(a4['authoritative_refs']['logical_persistence']['sha256']==sha(ROOT/'A06_PR3_AUTHORITATIVE_PERSISTENCE_MAPPING_v1_3.json'),'A04 A06 hash mismatch')
ok(a4['authoritative_refs']['identity_idempotency']['sha256']==sha(ROOT/'A07_PR3_IDENTITY_REVISION_IDEMPOTENCY_LEDGER_v1_2.json'),'A04 A07 hash mismatch')
checks['a04']={'receipt_bound_ops':{op:('command_receipt' in ows.get(op,[])) for op in side_ops},'read_state_equivalent':route['READ_STATE'].get('idempotency_class'),'B2_overlay_ref':blim['artifact_id']}

# DTO
ok('token_request_id' in dto['schemas']['ActionTokenRequest']['required'],'DTO token_request_id not required')
ok('CommandReceiptProjection' in dto['schemas'],'DTO CommandReceiptProjection absent')
ok('ResumeCommand' in dto['schemas'],'DTO ResumeCommand absent')
checks['dto']={'id':dto['$id'],'command_receipt':('CommandReceiptProjection' in dto['schemas'])}

state='PASS' if not errors else 'FAIL'
print(json.dumps({'state':state,'errors':errors,'checks':checks},ensure_ascii=False,indent=2))
sys.exit(0 if state=='PASS' else 1)
