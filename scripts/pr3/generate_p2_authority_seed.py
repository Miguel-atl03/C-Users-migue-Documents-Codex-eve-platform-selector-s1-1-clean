#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, pathlib

ROOT=pathlib.Path(__file__).resolve().parents[2]
AUTH=ROOT/'pr3'/'authority'
A02=json.loads((AUTH/'A02_PR3_PRODUCTION_OBJECT_REGISTRY_v1_0.json').read_text(encoding='utf-8'))
A02A=json.loads((AUTH/'A02A_PR3_CONTRACT_SET_HASH_PROFILE_v1_0.json').read_text(encoding='utf-8'))
A03=json.loads((AUTH/'A03_PR3_CHAIN_DEFINITION_B0_B2_v1_0.json').read_text(encoding='utf-8'))
A07=json.loads((AUTH/'A07_PR3_IDENTITY_REVISION_IDEMPOTENCY_LEDGER_v1_2.json').read_text(encoding='utf-8'))
OUT=ROOT/'supabase-pr3'/'migrations'/'20261001191600_pr3_authority_seed.sql'
MANIFEST=ROOT/'pr3'/'P2_PR3_AUTHORITY_SEED_MANIFEST_v1_0.json'

def sha_file(p:pathlib.Path)->str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def sql_string(v):
    if v is None: return 'null'
    s=str(v).replace("'","''")
    return "'"+s+"'"

def sql_json(v):
    s=json.dumps(v,ensure_ascii=False,separators=(',',':')).replace("'","''")
    return "'"+s+"'::jsonb"

def canonical_value(value):
    if value is None: return 'null'
    if isinstance(value,bool): return 'true' if value else 'false'
    if isinstance(value,(int,float)): return json.dumps(value,separators=(',',':'))
    if isinstance(value,str): return value
    if isinstance(value,list): return '['+','.join(canonical_json(x) for x in value)+']'
    return canonical_json(value)

def canonical_json(value):
    if value is None:return 'null'
    if isinstance(value,bool):return 'true' if value else 'false'
    if isinstance(value,(int,float)):return json.dumps(value,separators=(',',':'))
    if isinstance(value,str):return json.dumps(value,ensure_ascii=False,separators=(',',':'))
    if isinstance(value,list):return '['+','.join(canonical_json(x) for x in value)+']'
    if isinstance(value,dict):return '{'+','.join(json.dumps(str(k),ensure_ascii=False)+':'+canonical_json(value[k]) for k in sorted(value))+'}'
    raise TypeError(value)

def identity(prefix, fields, values):
    pre='\n'.join(f'{f}={canonical_value(values.get(f))}' for f in fields)
    h=hashlib.sha256(pre.encode('utf-8')).hexdigest()
    return f'{prefix}-{h[:24]}',h,pre

# Reproduce 4/4 contract sets before emitting seed.
verify={x['object_key']:x for x in A02A['verification']}
for obj in A02['objects']:
    members=obj['contract_members']
    pre='\n'.join(f"{m['id']}|{m['revision']}|{m['sha256']}" for m in members)
    h=hashlib.sha256(pre.encode('utf-8')).hexdigest()
    assert h==obj['contract_set_sha256']==verify[obj['object_key']]['declared_sha256']

lines=[
    '-- EVE PR3 P2 immutable authority seed v1.0',
    '-- GENERATED from A02/A02A/A03/A07. No legacy Supabase data is read or reused.',
    '-- Inserts are immutable/on-conflict-do-nothing. They do not mutate promoted B0-B2 bytes.',
    'begin;',
]
seed_counts={'authority_artifact':0,'contract_set':0,'object_binding':0,'chain_definition':0}
seed_rows=[]

def emit_authority(artifact_id, artifact_class, revision, sha256, authority_domain, state, source_locator):
    global lines
    vals=[artifact_id,artifact_class,revision,sha256,authority_domain,state,source_locator]
    lines.append('insert into eve_pr3.authority_artifact (artifact_id,artifact_class,revision,sha256,authority_domain,state,source_locator) values ('+','.join(sql_string(v) for v in vals)+') on conflict do nothing;')
    seed_counts['authority_artifact']+=1
    seed_rows.append({'table':'authority_artifact','artifact_id':artifact_id,'revision':revision,'sha256':sha256})

# Transversal authority references from A02.
for slot, a in A02['transversal_authorities'].items():
    emit_authority(a['id'],f'transversal_{slot}',a['revision'],a['sha256'],slot,'GOVERNED_REFERENCE','A02.transversal_authorities.'+slot)

# Object-local promoted source refs.
for obj in A02['objects']:
    key=obj['object_key']
    emit_authority(obj['profile_id'],'promoted_profile',obj['profile_revision'],obj['profile_sha256'],f'{key}_profile','PROMOTED',f'A02.objects[{key}].profile')
    emit_authority(obj['mother_contract_id'],'mother_contract',obj['mother_contract_revision'],obj['mother_contract_sha256'],f'{key}_contract','PROMOTED',f'A02.objects[{key}].mother_contract')
    emit_authority(obj['runtime_artifact'],'runtime_bundle','promoted_exact',obj['runtime_sha256'],f'{key}_runtime','PROMOTED_EXACT_BYTES',f'A02.objects[{key}].runtime_artifact')
    emit_authority(obj['promotion_receipt'],'promotion_receipt','promoted',obj['promotion_receipt_sha256'],f'{key}_promotion','PROMOTED_CLOSURE_RECEIPT',f'A02.objects[{key}].promotion_receipt')

# P1 binding artifacts physically carried in this source cut, with file hashes.
for filename,cls,revision in [
 ('A02A_PR3_CONTRACT_SET_HASH_PROFILE_v1_0.json','binding_hash_profile','1.0'),
 ('A02_PR3_PRODUCTION_OBJECT_REGISTRY_v1_0.json','object_registry','1.0'),
 ('A03_PR3_CHAIN_DEFINITION_B0_B2_v1_0.json','chain_definition_artifact','1.0'),
 ('A04_PR3_UI_API_BFF_RUNTIME_BINDING_v1_1.json','transport_binding','1.1'),
 ('A05_PR3_HANDOFF_BINDING_MANIFEST_v1_2.json','handoff_binding','1.2'),
 ('A06_PR3_AUTHORITATIVE_PERSISTENCE_MAPPING_v1_3.json','logical_persistence_mapping','1.3'),
 ('A07_PR3_IDENTITY_REVISION_IDEMPOTENCY_LEDGER_v1_2.json','identity_idempotency_ledger','1.2'),
 ('B2_PR3_IMPLEMENTATION_LIMIT_RESOLUTION_v1_0.json','implementation_overlay','1.0'),
]:
    p=AUTH/filename
    data=json.loads(p.read_text(encoding='utf-8'))
    emit_authority(str(data.get('artifact_id') or data.get('profile_id') or filename),cls,revision,sha_file(p),'PR3_BINDING','SOURCE_CUT_IMMUTABLE_COPY',str(p.relative_to(ROOT)))

for obj in A02['objects']:
    vals=[obj['contract_set_id'],obj['object_key'],A02A['artifact_id'],obj['contract_set_sha256'],obj['contract_members'],len(obj['contract_members']),A02['state']]
    lines.append('insert into eve_pr3.contract_set (contract_set_id,object_key,hash_profile_ref,contract_set_sha256,ordered_member_refs,member_count,state) values ('+','.join(sql_json(v) if i==4 else sql_string(v) for i,v in enumerate(vals))+') on conflict do nothing;')
    seed_counts['contract_set']+=1
    seed_rows.append({'table':'contract_set','contract_set_id':obj['contract_set_id'],'sha256':obj['contract_set_sha256']})
    fields=['object_key','profile_id','profile_revision','profile_sha256','runtime_sha256','contract_set_id']
    ob_id, ob_hash, _ = identity('ob',fields,obj)
    vals=[ob_id,obj['object_key'],obj['profile_id'],obj['profile_revision'],obj['profile_sha256'],obj['mother_contract_id'],obj['mother_contract_revision'],obj['mother_contract_sha256'],obj['runtime_artifact'],obj['runtime_sha256'],obj['promotion_receipt'],obj['promotion_receipt_sha256'],obj['contract_set_id'],obj['current_state'],obj['ai_policy']]
    lines.append('insert into eve_pr3.object_binding (object_binding_id,object_key,profile_id,profile_revision,profile_sha256,mother_contract_id,mother_contract_revision,mother_contract_sha256,runtime_artifact,runtime_sha256,promotion_receipt,promotion_receipt_sha256,contract_set_id,current_state,ai_policy) values ('+','.join(sql_json(v) if i==14 else sql_string(v) for i,v in enumerate(vals))+') on conflict do nothing;')
    seed_counts['object_binding']+=1
    seed_rows.append({'table':'object_binding','object_key':obj['object_key'],'object_binding_id':ob_id,'identity_sha256':ob_hash})

vals=[A03['chain_definition_id'],A03['revision'],A03['scope'],A03['nodes'],A03['edges'],A03['next_resolution'],A03['retry_policy'],A03['reentry_policy'],A03['persistence_ref'],A03['sha256']]
json_idx={3,4}
lines.append('insert into eve_pr3.chain_definition (chain_definition_id,revision,scope,nodes,edges,next_resolution,retry_policy,reentry_policy,persistence_ref,definition_sha256) values ('+','.join(sql_json(v) if i in json_idx else sql_string(v) for i,v in enumerate(vals))+') on conflict do nothing;')
seed_counts['chain_definition']=1
seed_rows.append({'table':'chain_definition','chain_definition_id':A03['chain_definition_id'],'revision':A03['revision'],'definition_sha256':A03['sha256']})
lines += ['commit;','']
OUT.write_text('\n'.join(lines),encoding='utf-8')
manifest={
 'artifact_id':'EVE-PR3-P2-AUTHORITY-SEED-MANIFEST-v1.0',
 'state':'GENERATED_NOT_DEPLOYED',
 'legacy_dependency':'NONE',
 'source_refs':['A02_PR3_PRODUCTION_OBJECT_REGISTRY_v1_0.json','A02A_PR3_CONTRACT_SET_HASH_PROFILE_v1_0.json','A03_PR3_CHAIN_DEFINITION_B0_B2_v1_0.json','A07_PR3_IDENTITY_REVISION_IDEMPOTENCY_LEDGER_v1_2.json'],
 'contract_set_reproduction':'4/4_MATCH',
 'seed_counts':seed_counts,
 'seed_rows':seed_rows,
 'migration':str(OUT.relative_to(ROOT)),
 'migration_sha256':sha_file(OUT),
 'physical_target':'NEW_CLEAN_PR3_SUPABASE_ONLY__NOT_LEGACY',
}
MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(OUT)
print(MANIFEST)
print(json.dumps(seed_counts))
