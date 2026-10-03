import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"../../..");
const plan=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/P3_PR3_PRODUCTION_AI_QUALIFICATION_PLAN_v1_0.json"),"utf8"));
const a08=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A08_PR3_B0_PRODUCTION_AI_BINDING_v1_0.json"),"utf8"));
const a09=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A09_PR3_B2_PRODUCTION_AI_MODE_BINDING_v1_0.json"),"utf8"));
const a11=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A11_PR3_AI_PROVENANCE_LEDGER_v1_0.json"),"utf8"));

test("P3 starts only after A08/A09 source implementation and keeps P4 independent",()=>{
 assert.match(a08.state,/^SOURCE_IMPLEMENTED__P3_REAL_MODEL_QUALIFICATION_PENDING/);
 assert.match(a09.state,/^SOURCE_IMPLEMENTED__P3_REAL_MODEL_QUALIFICATION_PENDING/);
 assert.ok(plan.authority_inputs.includes("A08-PR3-B0-PRODUCTION-AI-BINDING-v1.0"));
 assert.ok(plan.authority_inputs.includes("A09-PR3-B2-PRODUCTION-AI-MODE-BINDING-v1.0"));
 assert.equal(plan.execution_boundaries.real_user_pilot,"HOLD");
 assert.equal(plan.execution_boundaries.no_runtime_activation,true);
});

test("P3 cannot self-authorize the evaluator or admission",()=>{
 assert.equal(plan.evaluator_candidate_configuration.authority_state,"CANDIDATE_ONLY");
 assert.equal(plan.evaluator_candidate_configuration.automatic_admission,false);
 assert.equal(plan.execution_boundaries.no_a10_promotion,true);
 assert.equal(a11.candidate_evaluator.status,"CANDIDATE");
 assert.equal(a11.candidate_evaluator.authorized_evaluator,"NOT_AVAILABLE");
});

test("P3 hard falsifiers preserve deterministic and epistemic boundaries",()=>{
 assert.ok(plan.hard_falsifiers.some(x=>x.includes("B2 DETERMINISTIC")));
 assert.ok(plan.hard_falsifiers.some(x=>x.includes("EvidenceItem")));
 assert.ok(plan.hard_falsifiers.some(x=>x.includes("stale context")));
 assert.ok(plan.hard_falsifiers.some(x=>x.includes("retry")));
 assert.match(plan.threshold_note,/do not define a statistical generalization threshold/);
});

test("P3 uses different generator/evaluator candidate configurations without claiming provider independence",()=>{
 assert.equal(plan.generator_configuration.model_id,"gpt-6-luna");
 assert.equal(plan.evaluator_candidate_configuration.model_id,"gpt-6.1-sol");
 assert.equal(plan.evaluator_candidate_configuration.provider_ref,plan.generator_configuration.provider_ref);
 assert.match(plan.qualification_dimensions.evaluator_candidate_evidence.join(" "),/same provider/);
});


test("P3 candidate evaluator cannot self-authorize live semantic findings",()=>{
 assert.equal(plan.evaluator_candidate_configuration.live_finding_authority,"FINDING_ONLY_UNTIL_REFERENCE_OR_A10_ADJUDICATION");
 assert.match(plan.evaluator_candidate_configuration.circularity_guard,/cannot make its own live FAIL\/HOLD result an authoritative hard falsifier/i);
 assert.equal(plan.execution_boundaries.no_a10_promotion,true);
});
