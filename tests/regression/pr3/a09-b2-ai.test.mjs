import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"../../..");
const binding=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A09_PR3_B2_PRODUCTION_AI_MODE_BINDING_v1_0.json"),"utf8"));
const a02=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A02_PR3_PRODUCTION_OBJECT_REGISTRY_v1_0.json"),"utf8"));
const overlay=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A06_PR3_AI_OPERATION_ENUM_CORRECTION_OVERLAY_v1_0.json"),"utf8"));
const b2=a02.objects.find(x=>x.object_key==="B2");

test("A09 binds exact promoted B2 identity",()=>{
 assert.equal(binding.authority.b2_profile.id,b2.profile_id);
 assert.equal(binding.authority.b2_profile.revision,b2.profile_revision);
 assert.equal(binding.authority.b2_profile.sha256,b2.profile_sha256);
 assert.equal(binding.authority.b2_runtime.sha256,b2.runtime_sha256);
 assert.equal(b2.ai_policy,"EXACT_MODE_MAP");
});

test("A09 exact mode counts are preserved",()=>{
 const values=Object.values(binding.target_variable_mode_map);
 const counts=Object.fromEntries(["AI_DEFAULT_CONTEXTUAL_RENDER","AI_OPTIONAL_CONTEXTUAL_RENDER","AI_CONDITIONAL_CLARIFICATION","DETERMINISTIC"].map(mode=>[mode,values.filter(x=>x.ai_mode===mode).length]));
 assert.deepEqual(counts,binding.mode_map_declared);
 assert.equal(values.length,26);
});

test("A09 deterministic targets have zero allowed model operations",()=>{
 for(const id of binding.deterministic_zero_model_call_targets){
  const item=binding.target_variable_mode_map[id];
  assert.equal(item.ai_mode,"DETERMINISTIC");
  assert.deepEqual(item.ops,[]);
 }
});

test("A09 clarification persistence has explicit correction overlay",()=>{
 assert.equal(overlay.base_mapping_ref,"A06-PR3-AUTHORITATIVE-PERSISTENCE-MAPPING-v1.4");
 assert.match(overlay.corrected_source_path,/clarification/);
 assert.equal(overlay.physical_schema_change,false);
});

test("A09 does not authorize automatic admission",()=>{
 assert.equal(binding.evaluator_state.authorized_evaluator,"NOT_AVAILABLE");
 assert.equal(binding.evaluator_state.automatic_admission_enabled,false);
 assert.equal(binding.request_contract.review_policy_ref,"B2-RP-AI-PROPOSAL-G1.1");
 assert.equal(binding.provider_binding.qualification_state,"PENDING_P3_GATEWAY_REAL_MODEL_EXECUTION");
 assert.equal(binding.provider_binding.provider_ref,"vercel.ai_gateway.openresponses.v1");
 assert.equal(binding.provider_binding.model_id,"openai/gpt-5.4-mini");
 assert.equal(binding.provider_binding.auth_mode,"VERCEL_OIDC_TOKEN_AUTOMATIC__AI_GATEWAY_API_KEY_LOCAL_FALLBACK");
});
