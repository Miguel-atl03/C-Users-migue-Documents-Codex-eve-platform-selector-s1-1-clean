import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";

const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,"../../..");
const cache=new Map();

function loadTs(file){
 if(cache.has(file)) return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const source=fs.readFileSync(file,"utf8");
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 function localRequire(id){
  if(id==="server-only") return {};
  if(id==="pg") return {Pool:class {constructor(){throw new Error("pg pool must not be created in memory adapter tests");}}};
  if(id.startsWith("@/")) return loadTs(path.join(root,"src",`${id.slice(2)}.ts`));
  if(id.startsWith(".")){
   const resolved=path.resolve(path.dirname(file),id);
   if(fs.existsSync(resolved)&&resolved.endsWith(".json")) return JSON.parse(fs.readFileSync(resolved,"utf8"));
   if(fs.existsSync(`${resolved}.json`)) return JSON.parse(fs.readFileSync(`${resolved}.json`,"utf8"));
   const tsFile=resolved.endsWith(".ts")?resolved:`${resolved}.ts`;
   return loadTs(tsFile);
  }
  return require(id);
 }
 vm.runInThisContext(`(function(require,module,exports){${output}\n})`,{filename:file})(localRequire,mod,mod.exports);
 return mod.exports;
}
function svc(rel){return loadTs(path.join(root,"src/services/eve/pr3",rel));}

const forbidden=[
 "change_question_code","change_canonical_options","change_canonical_variable","decide_branch","publish_readiness",
 "declare_ai_candidate_as_user_evidence","invent_missing_facts","diagnose_vsm","diagnose_ahe","create_mmabp_fact"
];

test("A08 provider retry/replay boundary creates one proposal identity and never evidence",async()=>{
 const {MemoryPr3AiStore}=svc("ai/store.ts");
 const {B0ProductionAiAdapter}=svc("ai/b0-adapter.ts");
 const store=new MemoryPr3AiStore();
 let calls=0;
 const provider={async propose(req){
  calls++;
  return {
   provider_ref:"openai.responses.v1",provider_request_id:"resp-unit-b0",model_id:"gpt-6-luna",model_version:"gpt-6-luna",usage:{input_tokens:10,output_tokens:20},
   proposal:{
    context_revision:req.observation_context_revision,action:"propose",
    questions:[{target_id:"0.1",text:"Esto es lo que entendimos de esta actividad. ¿Está correcto?",supports:[{evidence_id:"E-B0-1",start:0,end:null}],neutral:true}],
    candidates:[],issues:[],
    reflexive_receipt:{evidence_used_refs:["E-B0-1"],assumptions_added:[],material_alternatives:[],intent_alignment:"aligned",observer_scope_check:"within_actor_activity_scope",presupposition_confirmation_risks:[],specificity_action:"contextualize",remaining_gaps:[]}
   }
  };
 }};
 const adapter=new B0ProductionAiAdapter(store,provider);
 const input={
  object_run_id:"or-b0-unit",interaction_key:"ii-b0-unit",server_command_event_id:"srv-b0-unit",requested_at:"2026-10-03T03:10:00.000000Z",
  b0_request:{
   request_id:"req-b0-unit",profile_ref:"EVE-B0-PR1-OPERATIONAL-PROFILE",operation:"render",observation_context_revision:"ctx-b0-r1",
   target_ids:["0.1"],
   systemic_intent_envelopes:[{ref:"B0-SIE::0.1",canonical_intent:"Confirmar/corregir el ancla B0.",risk_if_wrong:"candidate_as_evidence",forbidden_projection:forbidden}],
   role_observation_envelope:{ref:"B0-ROE-v0.1",activity_id:"ACT-B0-UNIT",entry_mode:"fixture",narrative_revision:"ctx-b0-r1",knowledge_limits:"preserve unconfirmed",source_refs:["E-B0-1"]},
   context_sources:[{evidence_id:"E-B0-1",literal:"Reviso solicitudes y preparo una propuesta."}],
   operation_limits:{may_change_canon:false,may_decide_branch:false,may_create_evidence:false,may_diagnose:false},
   fallback_policy:"SAFE_CANONICAL_FALLBACK_OR_HOLD",human_review_policy:"HUMAN_GATE_MVP"
  }
 };
 const first=await adapter.execute(input);
 const replay=await adapter.execute(input);
 assert.equal(first.status,"waiting_review");
 assert.equal(replay.status,"waiting_review");
 assert.equal(replay.idempotent_replay,true);
 assert.equal(calls,1);
 assert.equal(store.operations.size,1);
 assert.equal(store.proposals.size,1);
 const proposal=[...store.proposals.values()][0];
 assert.equal(proposal.review_state,"pending");
 assert.ok(!JSON.stringify(proposal).includes("captured_user_evidence"));
});

test("A09 deterministic target causes zero provider calls and zero AI records",async()=>{
 const {MemoryPr3AiStore}=svc("ai/store.ts");
 const {B2ProductionAiAdapter}=svc("ai/b2-adapter.ts");
 const store=new MemoryPr3AiStore();
 let calls=0;
 const provider={async propose(){calls++;throw new Error("provider must not be called");}};
 const adapter=new B2ProductionAiAdapter(store,provider);
 const input={
  object_run_id:"or-b2-det",interaction_key:"ii-b2-det",server_command_event_id:"srv-b2-det",requested_at:"2026-10-03T03:11:00.000000Z",
  b2_request:{
   request_id:"req-b2-det",profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",
   scope:{case_id:"CASE-DET",activity_id:"ACT-DET"},target_ids:["transformation_iterations"],canonical_anchor_ref:"B2-Q16",context_revision:"ctx-det-r1",
   context_sources:[],gaps:[],operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},
   fallback_ref:"Resolve per-subfield fallback policy; activation != fallback_eligibility != presentation.",review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",
   normative_context_ref:"B2-SIE-K3-v0.8C::2.3 · normativo; nunca evidence_context.",observational_context_ref:"K3"
  }
 };
 const result=await adapter.execute(input);
 assert.equal(result.status,"safe_fallback");
 assert.match(result.reason,/DETERMINISTIC_ONLY_NO_MODEL_CALL/);
 assert.equal(calls,0);
 assert.equal(store.operations.size,0);
 assert.equal(store.proposals.size,0);
});

test("A09 live AI target enforces exact runtime anchor/context and replays one pending proposal",async()=>{
 const {MemoryPr3AiStore}=svc("ai/store.ts");
 const {B2ProductionAiAdapter}=svc("ai/b2-adapter.ts");
 const store=new MemoryPr3AiStore();
 let calls=0;
 const literal="Recibo la necesidad del cliente y preparo una propuesta.";
 const quote="preparo una propuesta";
 const start=Array.from(literal.slice(0,literal.indexOf(quote))).length;
 const end=start+Array.from(quote).length;
 const provider={async propose(req){
  calls++;
  return {
   provider_ref:"openai.responses.v1",provider_request_id:"resp-unit-b2",model_id:"gpt-6-luna",model_version:"gpt-6-luna",usage:null,
   proposal:{
    request_id:req.request_id,context_revision:req.context_revision,systemic_intent_ref:req.normative_context_ref,observation_context_ref:req.observational_context_ref,action:"propose",
    questions:[{target_id:"transformation_primary_dimensions",text:"¿Qué es lo principal que creas, cambias o afectas con esta actividad?",supports:[{evidence_id:"E-B2-1",revision:1,start,end,quote}],neutral:true}],
    candidates:[],issues:[],
    reflexive_receipt:{evidence_used_refs:["E-B2-1"],assumptions_added:[],material_alternatives:[],presupposition_confirmation_risks:[],observer_scope_control:"within_role_scope",specificity_action:"contextualize",remaining_gaps:[]}
   }
  };
 }};
 const adapter=new B2ProductionAiAdapter(store,provider);
 const input={
  object_run_id:"or-b2-live",interaction_key:"ii-b2-live",server_command_event_id:"srv-b2-live",requested_at:"2026-10-03T03:12:00.000000Z",
  b2_request:{
   request_id:"req-b2-live",profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",
   scope:{case_id:"CASE-B2",activity_id:"ACT-B2"},target_ids:["transformation_primary_dimensions"],canonical_anchor_ref:"B2-Q12",context_revision:"ctx-b2-r1",
   context_sources:[{evidence_id:"E-B2-1",revision:1,literal,epistemic_class:"synthetic_reference_literal"}],gaps:[],
   operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},fallback_ref:"Resolve per-subfield fallback policy; activation != fallback_eligibility != presentation.",
   review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",normative_context_ref:"B2-SIE-K1-v0.8C::2.1 · normativo; nunca evidence_context.",observational_context_ref:"K1"
  }
 };
 const first=await adapter.execute(input);
 const replay=await adapter.execute(input);
 assert.equal(first.status,"waiting_review");
 assert.equal(replay.status,"waiting_review");
 assert.equal(replay.idempotent_replay,true);
 assert.equal(calls,1);
 assert.equal(store.operations.size,1);
 assert.equal(store.proposals.size,1);
});

test("A09 wrong Runtime anchor is rejected before provider or persistence",async()=>{
 const {MemoryPr3AiStore}=svc("ai/store.ts");
 const {B2ProductionAiAdapter}=svc("ai/b2-adapter.ts");
 const store=new MemoryPr3AiStore();
 let calls=0;
 const adapter=new B2ProductionAiAdapter(store,{async propose(){calls++;throw new Error("must not call");}});
 const input={
  object_run_id:"or-b2-anchor",interaction_key:"ii-b2-anchor",server_command_event_id:"srv-b2-anchor",requested_at:"2026-10-03T03:13:00.000000Z",
  b2_request:{
   request_id:"req-b2-anchor",profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",
   scope:{case_id:"CASE",activity_id:"ACT"},target_ids:["transformation_primary_dimensions"],canonical_anchor_ref:"C04",context_revision:"ctx-r1",
   context_sources:[],gaps:[],operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},
   fallback_ref:null,review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",
   normative_context_ref:"B2-SIE-K1-v0.8C::2.1 · normativo; nunca evidence_context.",observational_context_ref:"K1"
  }
 };
 await assert.rejects(adapter.execute(input),/a09_canonical_anchor_mismatch/);
 assert.equal(calls,0);
 assert.equal(store.operations.size,0);
 assert.equal(store.proposals.size,0);
});


test("A08 genericity routing rejects unauthorized support references",()=>{
 const {validateB0RoutingRequest,validateB0RoutingResult}=svc("ai/b0-routing.ts");
 const request={
  request_id:"req-genericity",operation:"classify_genericity",run_id:"run-genericity",
  observation_context_revision:"ctx-g-r1",context_revision:"ctx-g-r1",
  authorized_evidence:{activity_name_user_confirmed:"Gestionar"},
  decision_contract:{purpose:"routing_control_only_not_business_evidence",decision_rule:"If materially ambiguous, return GENERICITY_UNKNOWN."},
  output_schema:{status:["SPECIFIC_ACTIVITY","GENERIC_ACTIVITY","GENERICITY_UNKNOWN"],evidence_refs:"list",brief_reason:"string"},
  authority:"ai_semantic_routing_control_not_business_evidence"
 };
 validateB0RoutingRequest(request);
 assert.throws(()=>validateB0RoutingResult(request,{genericity_status:"SPECIFIC_ACTIVITY",evidence_refs:["not_authorized"],brief_reason:"specific"}),/B0_ROUTING_EVIDENCE_REF_INVALID/);
 assert.equal(validateB0RoutingResult(request,{genericity_status:"GENERICITY_UNKNOWN",evidence_refs:[],brief_reason:"insufficient material"}),"GENERICITY_UNKNOWN");
});

test("A08 scale routing enforces exact response binding before routing authority",()=>{
 const {validateB0RoutingRequest,validateB0RoutingResult}=svc("ai/b0-routing.ts");
 const request={
  request_id:"req-scale",operation:"classify_scale",run_id:"run-scale",
  observation_context_revision:"ctx-s-r1",context_revision:"ctx-s-r1",
  authorized_evidence:{activity_name_user_confirmed:"Validar datos fiscales",semantic_structure:{action_verb:"validar",input_object:"datos fiscales",product_output:"solicitud liberada"}},
  decision_contract:{rule_id:"C6",purpose:"routing_control_only_not_business_evidence"},
  output_schema:{status:["TRAVERSABLE_ACTIVITY","MACROPROCESS_TOO_BROAD","MICROACTION_TOO_NARROW","SCALE_UNKNOWN"],evidence_refs:"list",brief_reason:"string"},
  authority:"ai_semantic_routing_control_not_business_evidence",
  target_id:"C6_scale_assessment",anchor_fingerprint:"anchor-scale-1"
 };
 validateB0RoutingRequest(request);
 const mismatch={action:"propose",scale_status:"TRAVERSABLE_ACTIVITY",evidence_refs:["activity_name_user_confirmed"],brief_reason:"bounded",request_id:"other",context_revision:"ctx-s-r1",anchor_fingerprint:"anchor-scale-1",target_id:"C6_scale_assessment"};
 assert.throws(()=>validateB0RoutingResult(request,mismatch),/B0_SCALE_RESPONSE_BINDING_MISMATCH/);
});

test("A08 scale positive closure requires support and abstention always degrades to SCALE_UNKNOWN",()=>{
 const {validateB0RoutingResult}=svc("ai/b0-routing.ts");
 const request={
  request_id:"req-scale-2",operation:"classify_scale",run_id:"run-scale-2",
  observation_context_revision:"ctx-s2-r1",context_revision:"ctx-s2-r1",
  authorized_evidence:{activity_name_user_confirmed:"Validar datos fiscales"},
  decision_contract:{rule_id:"C6",purpose:"routing_control_only_not_business_evidence"},
  output_schema:{status:["TRAVERSABLE_ACTIVITY","MACROPROCESS_TOO_BROAD","MICROACTION_TOO_NARROW","SCALE_UNKNOWN"],evidence_refs:"list",brief_reason:"string"},
  authority:"ai_semantic_routing_control_not_business_evidence",
  target_id:"C6_scale_assessment",anchor_fingerprint:"anchor-scale-2"
 };
 const positive={action:"propose",scale_status:"TRAVERSABLE_ACTIVITY",evidence_refs:[],brief_reason:"bounded",request_id:"req-scale-2",context_revision:"ctx-s2-r1",anchor_fingerprint:"anchor-scale-2",target_id:"C6_scale_assessment"};
 assert.throws(()=>validateB0RoutingResult(request,positive),/B0_SCALE_POSITIVE_WITHOUT_SUPPORT/);
 const abstain={action:"abstain",scale_status:"TRAVERSABLE_ACTIVITY",evidence_refs:["activity_name_user_confirmed"],brief_reason:"cannot establish scale safely",request_id:"req-scale-2",context_revision:"ctx-s2-r1",anchor_fingerprint:"anchor-scale-2",target_id:"C6_scale_assessment"};
 assert.equal(validateB0RoutingResult(request,abstain),"SCALE_UNKNOWN");
});

test("A08 routing rejects observation/context mismatch before any provider authority",()=>{
 const {validateB0RoutingRequest}=svc("ai/b0-routing.ts");
 assert.throws(()=>validateB0RoutingRequest({
  request_id:"req-mismatch",operation:"classify_genericity",run_id:"run-mismatch",
  observation_context_revision:"ctx-old",context_revision:"ctx-new",
  authorized_evidence:{activity_name_user_confirmed:"Gestionar"},
  decision_contract:{purpose:"routing_control_only_not_business_evidence"},
  output_schema:{status:["SPECIFIC_ACTIVITY","GENERIC_ACTIVITY","GENERICITY_UNKNOWN"],evidence_refs:"list",brief_reason:"string"},
  authority:"ai_semantic_routing_control_not_business_evidence"
 }),/B0_ROUTING_REQUEST_CONTEXT_MISMATCH/);
});


test("A09 mixed Runtime interaction filters deterministic target out of provider payload",async()=>{
 const {MemoryPr3AiStore}=svc("ai/store.ts");
 const {B2ProductionAiAdapter}=svc("ai/b2-adapter.ts");
 const store=new MemoryPr3AiStore();
 let calls=0, seenTargets=null;
 const literal="El ajuste cambia bastante el resultado, pero no tengo una medida exacta.";
 const quote="cambia bastante";
 const start=Array.from(literal.slice(0,literal.indexOf(quote))).length;
 const end=start+Array.from(quote).length;
 const provider={async propose(req){
  calls++;seenTargets=[...req.target_ids];
  assert.deepEqual(req.target_ids,["transformation_magnitude"]);
  return {
   provider_ref:"openai.responses.v1",provider_request_id:"resp-mixed",model_id:"gpt-6-luna",model_version:"gpt-6-luna",usage:null,
   proposal:{
    request_id:req.request_id,context_revision:req.context_revision,systemic_intent_ref:req.normative_context_ref,observation_context_ref:req.observational_context_ref,action:"propose",
    questions:[{target_id:"transformation_magnitude",text:"Cuando haces esta actividad, ¿qué tanto cambia lo principal con respecto a cómo llegó?",supports:[{evidence_id:"E-MIX-1",revision:1,start,end,quote}],neutral:true}],
    candidates:[],issues:[],
    reflexive_receipt:{evidence_used_refs:["E-MIX-1"],assumptions_added:[],material_alternatives:[],presupposition_confirmation_risks:[],observer_scope_control:"within_role_scope",specificity_action:"contextualize",remaining_gaps:[]}
   }
  };
 }};
 const adapter=new B2ProductionAiAdapter(store,provider);
 const input={
  object_run_id:"or-b2-mixed",interaction_key:"ii-b2-mixed",server_command_event_id:"srv-b2-mixed",requested_at:"2026-10-03T03:14:00.000000Z",
  b2_request:{
   request_id:"req-b2-mixed",profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",
   scope:{case_id:"CASE-MIX",activity_id:"ACT-MIX"},target_ids:["transformation_magnitude","transformation_iterations"],canonical_anchor_ref:"B2-Q16",context_revision:"ctx-mix-r1",
   context_sources:[{evidence_id:"E-MIX-1",revision:1,literal,epistemic_class:"synthetic_reference_literal"}],gaps:[],
   operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},fallback_ref:"Resolve per-subfield fallback policy; activation != fallback_eligibility != presentation.",
   review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",normative_context_ref:"B2-SIE-K3-v0.8C::2.3 · normativo; nunca evidence_context.",observational_context_ref:"K3"
  }
 };
 const result=await adapter.execute(input);
 assert.equal(result.status,"waiting_review");
 assert.equal(calls,1);
 assert.deepEqual(seenTargets,["transformation_magnitude"]);
 assert.equal(store.operations.size,1);
 assert.equal(store.proposals.size,1);
 const proposal=[...store.proposals.values()][0];
 assert.ok(!JSON.stringify(proposal.payload).includes("transformation_iterations"));
});


test("A07 INTERNAL_AI receipt atomically binds B0 operation/proposal and replays without second provider call",async()=>{
 const {MemoryPr3Repository}=svc("repository.ts");
 const {executeB0InternalAiCommand}=svc("ai/command-service.ts");
 const repo=new MemoryPr3Repository();
 let calls=0;
 const provider={async propose(req){
  calls++;
  return {
   provider_ref:"openai.responses.v1",provider_request_id:"resp-cmd-b0",model_id:"gpt-6-luna",model_version:"gpt-6-luna",usage:{input_tokens:4,output_tokens:7},
   proposal:{context_revision:req.observation_context_revision,action:"propose",
    questions:[{target_id:"0.1",text:"Esto es lo que entendimos de esta actividad. ¿Está correcto?",supports:[{evidence_id:"E-CMD-B0",start:0,end:null}],neutral:true}],
    candidates:[],issues:[],
    reflexive_receipt:{evidence_used_refs:["E-CMD-B0"],assumptions_added:[],material_alternatives:[],intent_alignment:"aligned",observer_scope_check:"within_scope",presupposition_confirmation_risks:[],specificity_action:"contextualize",remaining_gaps:[]}}
  };
 }};
 const input={
  object_run_id:"or-cmd-b0",interaction_key:"ii-cmd-b0",server_command_event_id:"srv-cmd-b0",requested_at:"2026-10-03T04:00:00.000000Z",
  b0_request:{request_id:"req-cmd-b0",profile_ref:"EVE-B0-PR1-OPERATIONAL-PROFILE",operation:"render",observation_context_revision:"ctx-cmd-b0-r1",
   target_ids:["0.1"],systemic_intent_envelopes:[{ref:"B0-SIE::0.1",canonical_intent:"confirmar ancla",risk_if_wrong:"candidate_as_evidence",forbidden_projection:forbidden}],
   role_observation_envelope:{ref:"B0-ROE-v0.1",activity_id:"ACT",entry_mode:"fixture",narrative_revision:"ctx-cmd-b0-r1",knowledge_limits:"preserve unknown",source_refs:["E-CMD-B0"]},
   context_sources:[{evidence_id:"E-CMD-B0",literal:"Reviso solicitudes y preparo una propuesta."}],
   operation_limits:{may_change_canon:false,may_decide_branch:false,may_create_evidence:false,may_diagnose:false},
   fallback_policy:"SAFE_CANONICAL_FALLBACK_OR_HOLD",human_review_policy:"HUMAN_GATE_MVP"}
 };
 const first=await executeB0InternalAiCommand({repo,input,provider});
 const replay=await executeB0InternalAiCommand({repo,input,provider});
 assert.equal(first.receipt.receipt_state,"ACCEPTED");
 assert.equal(replay.receipt.receipt_state,"IDEMPOTENT_REPLAY");
 assert.equal(calls,1);
 const state=repo.debug();
 assert.equal(state.receipts.size,1);
 assert.equal(state.aiOperations.size,1);
 assert.equal(state.aiProposals.size,1);
 assert.deepEqual(new Set(first.receipt.side_effect_refs),new Set([...state.aiOperations.keys(),...state.aiProposals.keys()]));
});

test("A07 INTERNAL_AI same command identity plus changed payload conflicts before new AI side effects",async()=>{
 const {MemoryPr3Repository}=svc("repository.ts");
 const {executeB0InternalAiCommand}=svc("ai/command-service.ts");
 const {isPr3CommandConflict}=svc("execution-service.ts");
 const repo=new MemoryPr3Repository();
 let calls=0;
 const provider={async propose(req){
  calls++;
  return {provider_ref:"openai.responses.v1",provider_request_id:"resp-conflict",model_id:"gpt-6-luna",model_version:"gpt-6-luna",usage:null,
   proposal:{context_revision:req.observation_context_revision,action:"abstain",questions:[],candidates:[],issues:["insufficient"],
    reflexive_receipt:{evidence_used_refs:[],assumptions_added:[],material_alternatives:[],intent_alignment:"hold",observer_scope_check:"within_scope",presupposition_confirmation_risks:[],specificity_action:"abstain",remaining_gaps:["insufficient"]}}};
 }};
 const base={
  object_run_id:"or-conflict",interaction_key:"ii-conflict",server_command_event_id:"srv-conflict",requested_at:"2026-10-03T04:01:00.000000Z",
  b0_request:{request_id:"req-conflict",profile_ref:"EVE-B0-PR1-OPERATIONAL-PROFILE",operation:"render",observation_context_revision:"ctx-conflict-r1",
   target_ids:["0.1"],systemic_intent_envelopes:[{ref:"B0-SIE::0.1",canonical_intent:"confirm",risk_if_wrong:"wrong",forbidden_projection:forbidden}],
   role_observation_envelope:{ref:"B0-ROE-v0.1"},context_sources:[{evidence_id:"E-CONFLICT",literal:"Actividad A"}],
   operation_limits:{may_change_canon:false,may_decide_branch:false,may_create_evidence:false,may_diagnose:false},
   fallback_policy:"SAFE_CANONICAL_FALLBACK_OR_HOLD",human_review_policy:"HUMAN_GATE_MVP"}
 };
 await executeB0InternalAiCommand({repo,input:base,provider});
 const changed=structuredClone(base);
 changed.b0_request.context_sources=[{evidence_id:"E-CONFLICT",literal:"Actividad B"}];
 await assert.rejects(executeB0InternalAiCommand({repo,input:changed,provider}),isPr3CommandConflict);
 assert.equal(calls,1);
 const state=repo.debug();
 assert.equal(state.receipts.size,1);
 assert.equal(state.aiOperations.size,1);
 assert.equal(state.aiProposals.size,1);
});

test("A09 deterministic-only command bypass creates no INTERNAL_AI receipt and no AI rows",async()=>{
 const {MemoryPr3Repository}=svc("repository.ts");
 const {executeB2InternalAiCommand}=svc("ai/command-service.ts");
 const repo=new MemoryPr3Repository();
 let calls=0;
 const input={object_run_id:"or-det-cmd",interaction_key:"ii-det-cmd",server_command_event_id:"srv-det-cmd",requested_at:"2026-10-03T04:02:00.000000Z",
  b2_request:{request_id:"req-det-cmd",profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",scope:{case_id:"CASE",activity_id:"ACT"},
   target_ids:["transformation_iterations"],canonical_anchor_ref:"B2-Q16",context_revision:"ctx-det-cmd-r1",context_sources:[],gaps:[],
   operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},fallback_ref:null,review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",
   normative_context_ref:"B2-SIE-K5-v0.8C::2.7 · normativo; nunca evidence_context.",observational_context_ref:"K5"}};
 const result=await executeB2InternalAiCommand({repo,input,provider:{async propose(){calls++;throw new Error("must not call");}}});
 assert.equal(result.kind,"DETERMINISTIC_ONLY_NO_AI");
 assert.equal(calls,0);
 const state=repo.debug();
 assert.equal(state.receipts.size,0);
 assert.equal(state.aiOperations.size,0);
 assert.equal(state.aiProposals.size,0);
});

test("A09 mixed interaction creates one INTERNAL_AI receipt for AI target only",async()=>{
 const {MemoryPr3Repository}=svc("repository.ts");
 const {executeB2InternalAiCommand}=svc("ai/command-service.ts");
 const repo=new MemoryPr3Repository();
 let calls=0,seenTargets=[];
 const literal="El ajuste cambia bastante, pero no tengo una medida exacta.";
 const quote="cambia bastante";
 const start=Array.from(literal.slice(0,literal.indexOf(quote))).length,end=start+Array.from(quote).length;
 const input={object_run_id:"or-mixed-cmd",interaction_key:"ii-mixed-cmd",server_command_event_id:"srv-mixed-cmd",requested_at:"2026-10-03T04:03:00.000000Z",
  b2_request:{request_id:"req-mixed-cmd",profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",scope:{case_id:"CASE",activity_id:"ACT"},
   target_ids:["transformation_magnitude","transformation_iterations"],canonical_anchor_ref:"B2-Q16",context_revision:"ctx-mixed-cmd-r1",
   context_sources:[{evidence_id:"E-MIX-CMD",revision:1,literal,epistemic_class:"synthetic_reference_literal"}],gaps:[],
   operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},fallback_ref:null,review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",
   normative_context_ref:"B2-SIE-K3-v0.8C::2.3 · normativo; nunca evidence_context.",observational_context_ref:"K3"}};
 const provider={async propose(req){calls++;seenTargets=[...req.target_ids];return {provider_ref:"openai.responses.v1",provider_request_id:"resp-mixed-cmd",model_id:"gpt-6-luna",model_version:"gpt-6-luna",usage:null,
  proposal:{request_id:req.request_id,context_revision:req.context_revision,systemic_intent_ref:req.normative_context_ref,observation_context_ref:req.observational_context_ref,action:"propose",
   questions:[{target_id:"transformation_magnitude",text:"¿Qué tanto cambia?",supports:[{evidence_id:"E-MIX-CMD",revision:1,start,end,quote}],neutral:true}],candidates:[],issues:[],
   reflexive_receipt:{evidence_used_refs:["E-MIX-CMD"],assumptions_added:[],material_alternatives:[],presupposition_confirmation_risks:[],observer_scope_control:"within_scope",specificity_action:"contextualize",remaining_gaps:[]}}};}};
 const first=await executeB2InternalAiCommand({repo,input,provider});
 const replay=await executeB2InternalAiCommand({repo,input,provider});
 assert.equal(first.kind,"AI_COMMAND");
 assert.equal(replay.kind,"AI_COMMAND");
 assert.equal(replay.receipt.receipt_state,"IDEMPOTENT_REPLAY");
 assert.equal(calls,1);
 assert.deepEqual(seenTargets,["transformation_magnitude"]);
 const state=repo.debug();
 assert.equal(state.receipts.size,1);
 assert.equal(state.aiOperations.size,1);
 assert.equal(state.aiProposals.size,1);
 assert.ok(!JSON.stringify([...state.aiProposals.values()][0].payload).includes("transformation_iterations"));
});

test("A08 B0 routing is receipt-bound, provenance-only, and creates no AIProposal/business evidence",async()=>{
 const {MemoryPr3Repository}=svc("repository.ts");
 const {executeB0RoutingAiCommand}=svc("ai/command-service.ts");
 const repo=new MemoryPr3Repository();
 let calls=0;
 const routing_request={request_id:"req-route",operation:"classify_scale",run_id:"run-route",
  observation_context_revision:"ctx-route-r1",context_revision:"ctx-route-r1",
  authorized_evidence:{activity_name_user_confirmed:"Validar datos fiscales",semantic_structure:{action_verb:"validar",input_object:"datos fiscales",product_output:"solicitud liberada"}},
  decision_contract:{rule_id:"C6",purpose:"routing_control_only_not_business_evidence"},
  output_schema:{status:["TRAVERSABLE_ACTIVITY","MACROPROCESS_TOO_BROAD","MICROACTION_TOO_NARROW","SCALE_UNKNOWN"],evidence_refs:"list",brief_reason:"string"},
  authority:"ai_semantic_routing_control_not_business_evidence",target_id:"C6_scale_assessment",anchor_fingerprint:"route-anchor"};
 const runner=async(req)=>{calls++;return {provider_ref:"openai.responses.v1",provider_request_id:"resp-route",model_id:"gpt-6-luna",model_version:"gpt-6-luna",usage:null,operation:"classify_scale",
  result:{action:"propose",scale_status:"TRAVERSABLE_ACTIVITY",evidence_refs:["activity_name_user_confirmed"],brief_reason:"bounded",request_id:req.request_id,context_revision:req.context_revision,anchor_fingerprint:req.anchor_fingerprint,target_id:req.target_id},
  effective_status:"TRAVERSABLE_ACTIVITY"};};
 const input={object_run_id:"or-route",interaction_key:"ii-route",server_command_event_id:"srv-route",requested_at:"2026-10-03T04:04:00.000000Z",routing_request};
 const first=await executeB0RoutingAiCommand({repo,input,runner});
 const replay=await executeB0RoutingAiCommand({repo,input,runner});
 assert.equal(first.receipt.receipt_state,"ACCEPTED");
 assert.equal(replay.receipt.receipt_state,"IDEMPOTENT_REPLAY");
 assert.equal(calls,1);
 assert.equal(first.result.classification,"internal_routing_assessment_not_business_evidence");
 const state=repo.debug();
 assert.equal(state.receipts.size,1);
 assert.equal(state.aiOperations.size,1);
 assert.equal(state.aiProposals.size,0);
 assert.equal(state.observations.length,0);
 assert.equal(state.audits.length,0);
});
