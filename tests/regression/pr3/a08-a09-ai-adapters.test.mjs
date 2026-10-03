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
 assert.match(result.reason,/a09_deterministic_target_forbids_model/);
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
