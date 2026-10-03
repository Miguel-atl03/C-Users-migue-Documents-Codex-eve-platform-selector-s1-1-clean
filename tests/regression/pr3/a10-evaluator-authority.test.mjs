import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root=path.resolve(import.meta.dirname,"../../..");
const a10=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/A10_PR3_EVALUATOR_AUTHORITY_DETERMINATION_PROCEDURE_v1_0.json"),"utf8");
const p3=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/P3_PR3_PRODUCTION_AI_QUALIFICATION_PLAN_v1_0.json"),"utf8");
const candidate=JSON.parse(fs.readFileSync(path.join(root,"pr3/authority/source_evidence/B2/EvaluatorAuthorityRecord_CANDIDATE.json"),"utf8");

test("A10 preserves candidate scope and does not self-authorize",()=>{
 assert.equal(a10.current_determination,"NOT_READY__P3_REAL_MODEL_EVIDENCE_NOT_YET_PRESENT");
 assert.equal(a10.center_decision_required,true);
 assert.equal(a10.authority_output_constraints.automatic_admission,false);
 assert.equal(a10.authority_output_constraints.scope_expansion_forbidden,true);
 assert.equal(a10.preserved_candidate_scope.profile_ref,candidate.qualified_scope.profile_ref);
 assert.equal(a10.preserved_candidate_scope.operation,candidate.qualified_scope.operation);
 assert.equal(a10.preserved_candidate_scope.locale,candidate.qualified_scope.locale);
 assert.equal(a10.preserved_candidate_scope.target_class,candidate.qualified_scope.target_class);
});

test("A10 requires exact P3 material evidence before authority decision",()=>{
 assert.ok(a10.preconditions.includes("P3 evidence artifact exists and its own SHA-256 reproduces."));
 assert.ok(a10.preconditions.includes("P3 hard_falsifiers is empty."));
 assert.match(a10.stop_condition,/EVALUATOR_AUTHORITY_CHANGE_REQUIRING_PROMOTION/);
 assert.equal(p3.execution_boundaries.no_a10_promotion,true);
});

test("A10 approved output remains restricted and invalidatable",()=>{
 assert.equal(a10.authority_output_constraints.default_status_if_approved,"RESTRICTED");
 assert.ok(a10.authority_output_constraints.recertification_triggers.includes("generator_change"));
 assert.ok(a10.authority_output_constraints.recertification_triggers.includes("evaluator_model_change"));
 assert.equal(a10.authority_output_constraints.candidate_record_immutable,true);
 assert.equal(a10.authority_output_constraints.new_successor_required,true);
});
