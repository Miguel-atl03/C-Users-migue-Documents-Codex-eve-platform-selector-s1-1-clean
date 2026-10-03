import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"../../..");
const binding=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A08_PR3_B0_PRODUCTION_AI_BINDING_v1_0.json"),"utf8"));
const a11=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A11_PR3_AI_PROVENANCE_LEDGER_v1_0.json"),"utf8"));
const a02=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A02_PR3_PRODUCTION_OBJECT_REGISTRY_v1_0.json"),"utf8"));
const b0=a02.objects.find(x=>x.object_key==="B0");

test("A08 binds exact promoted B0 identity",()=>{
 assert.equal(binding.authority.b0_profile.id,b0.profile_id);
 assert.equal(binding.authority.b0_profile.revision,b0.profile_revision);
 assert.equal(binding.authority.b0_profile.sha256,b0.profile_sha256);
 assert.equal(binding.authority.b0_runtime.sha256,b0.runtime_sha256);
 assert.equal(binding.authority.b0_mother_contract.sha256,b0.mother_contract_sha256);
 assert.equal(b0.ai_policy,"CONTRACT_AUTHORIZED_ONLY");
});

test("A08 keeps provider binding pending P3 qualification",()=>{
 assert.equal(binding.provider_binding.provider_ref,"vercel.ai_gateway.openresponses.v1");
 assert.equal(binding.provider_binding.model_id,"openai/gpt-5.4-mini");
 assert.equal(binding.provider_binding.store,false);
 assert.deepEqual(binding.provider_binding.tools,[]);
 assert.equal(binding.provider_binding.qualification_state,"PENDING_P3_GATEWAY_REAL_MODEL_EXECUTION");
 assert.deepEqual(binding.provider_binding.authorized_operations,["render","classify_genericity","classify_scale"]);
 assert.equal(binding.source_implementation.routing_provider_module,"src/services/eve/pr3/ai/b0-routing.ts");
 assert.equal(binding.provider_binding.auth_mode,"VERCEL_OIDC_TOKEN_AUTOMATIC__AI_GATEWAY_API_KEY_LOCAL_FALLBACK");
 assert.equal(binding.provider_binding.prompt_training,"DISALLOWED");
 assert.deepEqual(binding.source_implementation.routing_operations,["classify_genericity","classify_scale"]);
});

test("A08 preserves A11 generator/evaluator/admission/evidence separation",()=>{
 assert.equal(a11.separation_rules.generator,"AIOperation + AIProposal");
 assert.equal(a11.separation_rules.evaluator,"EvaluatorAuthority + EvaluationRecord");
 assert.equal(a11.separation_rules.admission,"AdmissionDecision");
 assert.match(a11.separation_rules.user_evidence,/AI proposal never self-promotes/);
 assert.ok(binding.does_not_authorize.includes("Evaluator qualification"));
 assert.ok(binding.does_not_authorize.includes("AdmissionDecision"));
 assert.ok(binding.does_not_authorize.includes("User evidence promotion"));
});

test("A08 target surface is exact B0 promoted render surface",()=>{
 assert.deepEqual(binding.allowed_target_ids,["0.1","0.1a","0.3","0.3a","0.4","0.5_actor_scope","0.6","0.8","0.8a","0.A","0.B","0.C","0.D"]);
 assert.equal(binding.b0_contract_projection.operation,"render");
 assert.equal(binding.b0_contract_projection.role_observation_policy_ref,"B0-ROE-v0.1");
 assert.equal(binding.b0_contract_projection.reflexive_observation_policy_ref,"B0-AROR-v0.1");
 assert.equal(binding.b0_contract_projection.operation_limits.may_change_canon,false);
 assert.equal(binding.b0_contract_projection.operation_limits.may_decide_branch,false);
 assert.equal(binding.b0_contract_projection.operation_limits.may_create_evidence,false);
 assert.equal(binding.b0_contract_projection.operation_limits.may_diagnose,false);
});


test("A08 internal routing remains non-evidence and preserves conservative scale authority",()=>{
 const genericity=binding.internal_routing_operations.classify_genericity;
 const scale=binding.internal_routing_operations.classify_scale;
 assert.equal(genericity.user_evidence_authority,false);
 assert.equal(scale.user_evidence_authority,false);
 assert.match(genericity.authority,/routing only/i);
 assert.equal(scale.systemic_distinction,"STRUCTURAL_COMPLETENESS != OPERATIONAL_SCALE");
 assert.match(scale.positive_support_rule,/non-empty evidence_refs/i);
 assert.match(scale.abstention_precedence,/SCALE_UNKNOWN/);
 assert.match(scale.safe_fallback,/SCALE_UNKNOWN/);
});
