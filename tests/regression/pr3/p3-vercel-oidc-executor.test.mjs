import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"../../..");
const script=fs.readFileSync(path.join(root,"scripts/pr3/run-p3-with-vercel-oidc.mjs"),"utf8");
const packageJson=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));

test("P3 autonomous executor uses project-scoped Vercel OIDC and no user OpenAI key",()=>{
 assert.match(script,/vercel","\["project","token","eve-pr3-pilot"/);
 assert.match(script,/VERCEL_OIDC_TOKEN/);
 assert.match(script,/AI_GATEWAY_API_KEY/);
 assert.doesNotMatch(script,/EVE_PR3_OPENAI_API_KEY/);
 assert.equal(packageJson.scripts["qualify:pr3-ai:vercel-oidc"],"node scripts/pr3/run-p3-with-vercel-oidc.mjs");
});

test("P3 autonomous executor freezes evidence but never writes the token",()=>{
 assert.match(script,/pr3\/evidence/);
 assert.match(script,/secrets_logged:false/);
 assert.doesNotMatch(script,/writeFileSync\([^\n]*VERCEL_OIDC_TOKEN/);
 assert.match(script,/P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_0\.json/);
 assert.match(script,/A10_PR3_EVALUATOR_AUTHORITY_DECISION_INPUT_v1_0\.json/);
});

test("P3 executor runs A10 only after P3 evidence-ready determination",()=>{
 const ready=script.indexOf('EVIDENCE_READY_FOR_A10_AUTHORITY_DETERMINATION');
 const a10=script.indexOf('run-a10-evaluator-authority-decision.mjs');
 assert.ok(ready>=0&&a10>ready);
});
