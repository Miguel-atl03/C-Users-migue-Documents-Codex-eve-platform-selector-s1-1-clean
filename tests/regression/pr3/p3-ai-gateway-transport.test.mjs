import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"../../..");
const files=[
 "src/services/eve/pr3/ai/openai-responses.ts",
 "src/services/eve/pr3/ai/b2-openai-responses.ts",
 "src/services/eve/pr3/ai/b0-routing.ts",
 "src/services/eve/pr3/ai/p3-evaluator-candidate.ts"
];

test("PR3 AI transports use Vercel AI Gateway OIDC and no direct OpenAI credential dependency",()=>{
 for(const relative of files){
  const source=fs.readFileSync(path.join(root,relative),"utf8");
  assert.match(source,/https:\/\/ai-gateway\.vercel\.sh\/v1\/responses/);
  assert.match(source,/VERCEL_OIDC_TOKEN/);
  assert.match(source,/AI_GATEWAY_API_KEY/);
  assert.match(source,/disallowPromptTraining:true/);
  assert.doesNotMatch(source,/https:\/\/api\.openai\.com\/v1\/responses/);
  assert.doesNotMatch(source,/EVE_PR3_OPENAI_API_KEY/);
 }
});

test("A08 A09 authority pins gateway generator while preserving pending P3 qualification",()=>{
 const a08=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A08_PR3_B0_PRODUCTION_AI_BINDING_v1_0.json"),"utf8"));
 const a09=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A09_PR3_B2_PRODUCTION_AI_MODE_BINDING_v1_0.json"),"utf8"));
 for(const binding of [a08,a09]){
  assert.equal(binding.provider_binding.provider_ref,"vercel.ai_gateway.openresponses.v1");
  assert.equal(binding.provider_binding.endpoint,"https://ai-gateway.vercel.sh/v1/responses");
  assert.equal(binding.provider_binding.model_id,"openai/gpt-5.4-mini");
  assert.equal(binding.provider_binding.auth_mode,"VERCEL_OIDC_TOKEN_AUTOMATIC__AI_GATEWAY_API_KEY_LOCAL_FALLBACK");
  assert.equal(binding.provider_binding.prompt_training,"DISALLOWED");
  assert.equal(binding.provider_binding.qualification_state,"PENDING_P3_GATEWAY_REAL_MODEL_EXECUTION");
 }
});
