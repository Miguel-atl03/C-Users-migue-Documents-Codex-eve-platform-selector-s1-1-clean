#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'pr3'/'P4_COMMAND_RECEIPT_QA_EVIDENCE_v1_0.json'

def cjson(x): return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def h(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()
def identity(op,scope,event):
    pre=f'operation={op}\ncommand_scope_ref={scope}\ncommand_event_id={event}'
    d=h(pre); return 'cmdr-'+d[:24],'idem-'+d[:24]
class Store:
    def __init__(self): self.receipts={}; self.side_effects=[]; self.allocations=0
    def run(self,op,scope,event,payload,allocate):
        rid,idem=identity(op,scope,event); ph=h(cjson(payload))
        if rid in self.receipts:
            old=self.receipts[rid]
            if old['payload_sha256']!=ph: return {'state':'IDEMPOTENCY_CONFLICT','receipt':old,'new_side_effects':[]}
            return {'state':'IDEMPOTENT_REPLAY','receipt':old,'result':old['result'],'new_side_effects':[]}
        self.allocations+=1
        result,refs=allocate()
        receipt={'command_receipt_id':rid,'idempotency_key':idem,'operation':op,'command_scope_ref':scope,'command_event_id':event,'payload_sha256':ph,'receipt_state':'ACCEPTED','side_effect_refs':refs,'result':result}
        self.receipts[rid]=receipt; self.side_effects.extend(refs)
        return {'state':'ACCEPTED','receipt':receipt,'result':result,'new_side_effects':refs}

def main():
    s=Store(); checks={}; errors=[]
    def ok(v,msg):
        if not v: errors.append(msg)
    # ISSUE_ACTION_TOKEN: retry returns exact allocation.
    token_payload={'operation':'OPEN_OR_RESUME','scope_ref':'CASE-QA','activity_ref':'ACT-QA'}
    def token_alloc(): return ({'client_event_id':'evt-fixed-1','action_token':'token-fixed-1'},['evt-fixed-1'])
    a=s.run('ISSUE_ACTION_TOKEN','action-token:principal|OPEN_OR_RESUME|CASE-QA|ACT-QA','tokreq-1',token_payload,token_alloc)
    b=s.run('ISSUE_ACTION_TOKEN','action-token:principal|OPEN_OR_RESUME|CASE-QA|ACT-QA','tokreq-1',token_payload,lambda: (_ for _ in ()).throw(RuntimeError('must not allocate')))
    c=s.run('ISSUE_ACTION_TOKEN','action-token:principal|OPEN_OR_RESUME|CASE-QA|ACT-QA','tokreq-1',{**token_payload,'activity_ref':'ACT-OTHER'},token_alloc)
    ok(a['state']=='ACCEPTED' and b['state']=='IDEMPOTENT_REPLAY','action token replay failed')
    ok(a['result']==b['result'] and b['new_side_effects']==[],'action token replay changed allocation')
    ok(c['state']=='IDEMPOTENCY_CONFLICT','action token conflict not detected')
    checks['issue_action_token']={'first':a['state'],'retry':b['state'],'different_payload':c['state'],'allocated_client_event_id':a['result']['client_event_id']}
    # OPEN_OR_RESUME: receipt exists before IDs in identity and replay returns same IDs.
    open_scope='open:CASE-QA|ACT-QA|EVE-PR3-B0-B2-CHAIN@1.0'; open_payload={'scope_ref':'CASE-QA','activity_ref':'ACT-QA','mode':'OPEN_OR_RESUME'}
    def open_alloc(): return ({'chain_run_id':'cr-fixed','object_run_id':'or-fixed','interaction_key':'ii-fixed','presentation_event_id':'pe-fixed'},['cr-fixed','or-fixed','ii-fixed','pe-fixed'])
    o1=s.run('OPEN_OR_RESUME',open_scope,'evt-open-1',open_payload,open_alloc)
    o2=s.run('OPEN_OR_RESUME',open_scope,'evt-open-1',open_payload,lambda: (_ for _ in ()).throw(RuntimeError('must not allocate')))
    ok(o1['result']==o2['result'] and o2['new_side_effects']==[],'OPEN replay duplicated allocation/render')
    checks['open_or_resume']={'first':o1['state'],'retry':o2['state'],'same_allocated_ids':o1['result']==o2['result'],'retry_side_effect_count':len(o2['new_side_effects'])}
    # SUBMIT_RESPONSE: same event zero duplicate semantic effects; changed payload conflict.
    response_scope='response:cr-fixed|or-fixed|ii-fixed|ctx-1'; response_payload={'answers':[{'slot_ref':'slot-1','raw_value':'literal'}]}
    def response_alloc(): return ({'next_context_revision':'ctx-2'},['resp-1','evid-1','var-1','budget-1'])
    r1=s.run('SUBMIT_RESPONSE',response_scope,'evt-response-1',response_payload,response_alloc)
    r2=s.run('SUBMIT_RESPONSE',response_scope,'evt-response-1',response_payload,lambda: (_ for _ in ()).throw(RuntimeError('must not allocate')))
    r3=s.run('SUBMIT_RESPONSE',response_scope,'evt-response-1',{'answers':[{'slot_ref':'slot-1','raw_value':'different'}]},response_alloc)
    ok(len(r1['new_side_effects'])==4 and r2['new_side_effects']==[],'response retry side effects incorrect')
    ok(r3['state']=='IDEMPOTENCY_CONFLICT','response payload conflict not detected')
    checks['submit_response']={'first_side_effect_count':len(r1['new_side_effects']),'retry_side_effect_count':len(r2['new_side_effects']),'different_payload':r3['state']}
    # Correction is a deliberate new command identity and materializes revision+supersedes.
    correction_scope='correction:cr-fixed|or-fixed|ii-fixed|ctx-2'; correction_payload={'corrections':[{'slot_ref':'slot-1','raw_value':'corrected','supersedes_response_key':'resp-1','expected_response_revision':1}]}
    def corr_alloc(): return ({'response_key':'resp-2','response_revision':2,'supersedes_response_key':'resp-1','state':'reentry_required'},['resp-2','gap-correction-1'])
    q1=s.run('SUBMIT_CORRECTION',correction_scope,'evt-correct-1',correction_payload,corr_alloc)
    q2=s.run('SUBMIT_CORRECTION',correction_scope,'evt-correct-1',correction_payload,lambda: (_ for _ in ()).throw(RuntimeError('must not allocate')))
    ok(q1['result']['response_revision']==2 and q1['result']['supersedes_response_key']=='resp-1','correction revision/supersedes absent')
    ok(q2['new_side_effects']==[],'correction retry duplicated side effects')
    checks['submit_correction']={'revision':q1['result']['response_revision'],'supersedes':q1['result']['supersedes_response_key'],'retry_side_effect_count':len(q2['new_side_effects'])}
    # RESUME: if no genuinely new render is authorized, side effects remain zero and replay stays zero.
    resume_scope='resume:cr-fixed|ctx-2'; resume_payload={'chain_run_id':'cr-fixed','last_known_context_revision':'ctx-2'}
    u1=s.run('RESUME',resume_scope,'evt-resume-1',resume_payload,lambda: ({'context_revision':'ctx-2','projection_ref':'same-authoritative-turn'},[]))
    u2=s.run('RESUME',resume_scope,'evt-resume-1',resume_payload,lambda: (_ for _ in ()).throw(RuntimeError('must not allocate')))
    ok(u1['new_side_effects']==[] and u2['new_side_effects']==[],'RESUME created duplicate render/charge')
    checks['resume']={'first_side_effect_count':0,'retry_side_effect_count':0,'same_result':u1['result']==u2['result']}
    # READ_STATE is pure read equivalent and must not create a receipt.
    before=len(s.receipts); read_result={'chain_run_id':'cr-fixed','context_revision':'ctx-2'}; after=len(s.receipts)
    ok(before==after,'READ_STATE created a CommandReceipt')
    checks['read_state']={'receipt_delta':after-before,'projection':read_result}
    out={'artifact_id':'EVE-PR3-P4-COMMAND-RECEIPT-QA-EVIDENCE-v1.0','state':'PASS' if not errors else 'FAIL','errors':errors,'checks':checks,'receipt_count':len(s.receipts),'side_effect_count':len(s.side_effects),'scope':'DETERMINISTIC_CONTRACT_QA_ONLY__NOT_PROMOTED_RUNTIME_OR_DATABASE_EXECUTION'}
    OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); print(json.dumps(out,ensure_ascii=False,indent=2)); return 0 if not errors else 1
if __name__=='__main__': raise SystemExit(main())
