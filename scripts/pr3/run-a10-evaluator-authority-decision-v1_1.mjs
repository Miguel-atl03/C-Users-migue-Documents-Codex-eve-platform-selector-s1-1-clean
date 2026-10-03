import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const evidencePath=process.argv[2] ?? path.resolve(".tmp/P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_1.json");
function sha(value){return createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");}
function fail(code,details=[]){console.log(JSON.stringify({a10_determination:code,details},null,2));process.exitCode=code.startsWith("REJECT")?2:3;}

if(!fs.existsSync(evidencePath)){fail("NOT_READY__P3_EVIDENCE_MISSING",[evidencePath]);process.exit();}
const evidence=JSON.parse(fs.readFileSync(evidencePath,"utf8"));
const claimed=evidence.evidence_sha256;
const clone=structuredClone(evidence);delete clone.evidence_sha256;
const reproduced=sha(clone);
if(!claimed||claimed!==reproduced){fail("NOT_READY__P3_EVIDENCE_HASH_INVALID",[`claimed=${claimed??"null"}`,`reproduced=${reproduced}`]);process.exit();}

const details=[];
if(evidence.qualification_determination!=="EVIDENCE_READY_FOR_A10_AUTHORITY_DETERMINATION") details.push(`qualification_determination=${evidence.qualification_determination}`);
if(!Array.isArray(evidence.hard_falsifiers)||evidence.hard_falsifiers.length) details.push(`hard_falsifiers=${JSON.stringify(evidence.hard_falsifiers??null)}`);
const bank=evidence.reference_bank_agreement;
if(!bank||bank.total!==15||bank.agree!==15||bank.disagree!==0||bank.unknown_or_error!==0) details.push(`reference_bank_agreement=${JSON.stringify(bank??null)}`);
if(evidence.a10_authority_granted!==false) details.push("P3 evidence attempted to grant A10 authority");
if(evidence.governance_overlay_ref!=="PR3-GPT6-REBINDING-CONTROL-OVERLAY-v1.0") details.push("GPT6 governance overlay provenance missing");
if(evidence.b0_automatic_admission_authority_gap!=="OPEN") details.push("B0 automatic admission authority gap not preserved");
if(!evidence.generator||!evidence.generator.model_requested||!evidence.evaluator_candidate||!evidence.evaluator_candidate.model_requested) details.push("requested model provenance missing");

const modelVersions=new Set();
for(const row of [...(evidence.b0_cases??[]),...(evidence.b2_cases??[])]){
 if(row.provider?.model_version) modelVersions.add(row.provider.model_version);
}
if(modelVersions.size===0) details.push("no observed generator model_version");
const evaluatorVersions=new Set();
for(const row of evidence.reference_bank??[]){
 if(row.evaluator?.model_version) evaluatorVersions.add(row.evaluator.model_version);
}
for(const row of [...(evidence.b0_cases??[]),...(evidence.b2_cases??[])]){
 if(row.evaluator?.model_version) evaluatorVersions.add(row.evaluator.model_version);
}
if(evaluatorVersions.size===0) details.push("no observed evaluator model_version");

if(details.length){
 const reject=Array.isArray(evidence.hard_falsifiers)&&evidence.hard_falsifiers.length>0;
 fail(reject?"REJECT__P3_HARD_FALSIFIER_OR_QUALIFICATION_FAILURE":"NOT_READY__P3_EVIDENCE_INCOMPLETE",details);
 process.exit();
}

const decision={
 artifact_id:"A10-PR3-EVALUATOR-AUTHORITY-DECISION-INPUT-v1.1",
 generated_at:new Date().toISOString(),
 p3_evidence_sha256:claimed,
 a10_determination:"READY_FOR_CENTER_AUTHORITY_DECISION",
 candidate_authority_id:"EVE-B2-EVALUATOR-AUTHORITY-CANDIDATE-v0.3.0-GPT6",
 proposed_successor:{
  status:"RESTRICTED",
  qualified_scope:{profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",locale:"es",target_class:"B2_CAPTURE_RENDER"},
  criterion_ids:["intent_fidelity","observer_fidelity","reflexive_integrity","narrative_canonical_fidelity"],
  automatic_admission:false,
  generator_model_versions:[...modelVersions],
  evaluator_model_versions:[...evaluatorVersions],
  invalidation_triggers:["generator_change","context_policy_change","profile_revision_change","criterion_change","evaluator_model_change","evaluator_prompt_change","provider_behavior_change_material_to_scope"]
 },
 authority_claimed:false,
 required_human_authority_action:"CENTRO_DE_CONTROL_PROMOTION_DECISION",
  qualified_scope_boundary:"B2_CAPTURE_RENDER_ONLY",scope_expansion_authorized:false,automatic_admission:false,
  b0_automatic_admission_authority_gap:"OPEN__BLOCKS_P5_IF_UNRESOLVED",stop_after_output:true
};
const out=path.resolve(".tmp/A10_PR3_EVALUATOR_AUTHORITY_DECISION_INPUT_v1_1.json");
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(decision,null,2));
console.log(JSON.stringify({a10_determination:decision.a10_determination,output:out,p3_evidence_sha256:claimed,generator_model_versions:decision.proposed_successor.generator_model_versions,evaluator_model_versions:decision.proposed_successor.evaluator_model_versions},null,2));
