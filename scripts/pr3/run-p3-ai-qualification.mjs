import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,"../..");
const serviceRoot=path.join(root,"src/services/eve/pr3");

function loadTs(file){
 const cache=loadTs.cache??(loadTs.cache=new Map());
 if(cache.has(file)) return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const source=fs.readFileSync(file,"utf8");
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 function localRequire(id){
  if(id==="server-only") return {};
  if(id.startsWith("@/")) return loadTs(path.join(root,"src",`${id.slice(2)}.ts`));
  if(id.startsWith(".")){
   const resolved=path.resolve(path.dirname(file),id);
   if(id.endsWith(".json")) return JSON.parse(fs.readFileSync(resolved,"utf8"));
   if(fs.existsSync(resolved)) return require(resolved);
   if(fs.existsSync(`${resolved}.json`)) return JSON.parse(fs.readFileSync(`${resolved}.json`,"utf8"));
   return loadTs(`${resolved}.ts`);
  }
  return require(id);
 }
 vm.runInThisContext(`(function(require,module,exports){${output}\n})`,{filename:file})(localRequire,mod,mod.exports);
 return mod.exports;
}
function svc(relative){return loadTs(path.join(serviceRoot,relative));}
function sha(value){return createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");}
function now(){return new Date().toISOString();}
function evidenceSource(id,literal,revision=1){return {evidence_id:id,revision,literal,epistemic_class:"synthetic_reference_literal"};}

const {OpenAiB0ResponsesProvider}=svc("ai/openai-responses.ts");
const b0=svc("ai/b0-binding.ts"),b2=svc("ai/b2-binding.ts");
const {OpenAiB2ResponsesProvider}=svc("ai/b2-openai-responses.ts");
const {runB0RoutingOperation}=svc("ai/b0-routing.ts");
const {runP3EvaluatorCandidate,P3_EVALUATOR_MODEL_ID}=svc("ai/p3-evaluator-candidate.ts");

const FORBIDDEN=["change_question_code","change_canonical_options","change_canonical_variable","decide_branch","publish_readiness","declare_ai_candidate_as_user_evidence","invent_missing_facts","diagnose_vsm","diagnose_ahe","create_mmabp_fact"];
function b0Request(caseId,target,literal){
 return {
  request_id:`p3-b0-${caseId}`,
  profile_ref:"EVE-B0-PR1-OPERATIONAL-PROFILE",
  operation:"render",
  observation_context_revision:`ctx-b0-${caseId}-r1`,
  target_ids:[target],
  systemic_intent_envelopes:[{ref:`B0-SIE::${target}`,canonical_intent:`Obtener evidencia B0 para ${target} sin ampliar canon ni diagnosticar.`,risk_if_wrong:"candidate_as_evidence / presupposition / downstream invention",forbidden_projection:FORBIDDEN}],
  role_observation_envelope:{ref:"B0-ROE-v0.1",activity_id:`ACT-P3-${caseId}`,entry_mode:"P3_REFERENCE",narrative_revision:`ctx-b0-${caseId}-r1`,knowledge_limits:"preserve unconfirmed",source_refs:[`P3-B0-${caseId}`]},
  context_sources:[{evidence_id:`P3-B0-${caseId}-E1`,literal}],
  operation_limits:{may_change_canon:false,may_decide_branch:false,may_create_evidence:false,may_diagnose:false},
  fallback_policy:"SAFE_CANONICAL_FALLBACK_OR_HOLD",human_review_policy:"HUMAN_GATE_MVP"
 };
}
const b0Cases=[
 {id:"A-neutral-contextual-render",target:"0.1",literal:"Reviso la solicitud del cliente y preparo una propuesta para que pueda decidir si avanza."},
 {id:"B-context-bound-render",target:"0.6",literal:"Empiezo cuando recibo la solicitud y ya tengo los datos mínimos del cliente."},
 {id:"C-candidate-not-evidence",target:"0.1",literal:"A veces dejo una propuesta y otras veces sólo información suficiente para que otra persona continúe."},
 {id:"D-unknown-preserved",target:"0.4",literal:"No estoy seguro de cuándo aparece normalmente; depende mucho del caso."}
];

const b0RoutingCases=[
 {
  id:"G1-generic-label",operation:"classify_genericity",
  authorized_evidence:{activity_name_user_confirmed:"Gestionar",activity_literal_from_workmap:"Gestionar"},
  forbidden_effective:["SPECIFIC_ACTIVITY"],
  expected_boundary:"A generic one-word activity label cannot be closed as SPECIFIC_ACTIVITY without inventing distinguishing structure."
 },
 {
  id:"G2-specific-label",operation:"classify_genericity",
  authorized_evidence:{activity_name_user_confirmed:"Validar datos fiscales del pedido antes de liberarlo a facturación",activity_literal_from_workmap:"Validar datos fiscales del pedido antes de liberarlo a facturación"},
  forbidden_effective:["GENERIC_ACTIVITY"],
  expected_boundary:"A materially distinguishing activity label should not be forced into GENERIC_ACTIVITY; GENERICITY_UNKNOWN remains a safe conservative outcome."
 },
 {
  id:"S1-macroprocess",operation:"classify_scale",
  authorized_evidence:{
   activity_name_user_confirmed:"Gestionar el proceso comercial completo desde prospección hasta cobranza",
   activity_literal_from_workmap:"Gestionar el proceso comercial completo desde prospección hasta cobranza",
   semantic_structure:{action_verb:"gestionar",input_object:"proceso comercial completo",product_output:"cobranza concluida"},
   activity_start_condition_hint:"inicia con prospección",activity_end_result_hint:"termina con cobranza"
  },
  forbidden_effective:["TRAVERSABLE_ACTIVITY"],
  expected_boundary:"A full end-to-end commercial cycle spans multiple potentially autonomous stages and must not be positively closed as one traversable B0 activity."
 },
 {
  id:"S2-microaction",operation:"classify_scale",
  authorized_evidence:{
   activity_name_user_confirmed:"Hacer clic en Guardar",
   activity_literal_from_workmap:"Hacer clic en Guardar",
   semantic_structure:{action_verb:"hacer clic",input_object:"botón Guardar",product_output:"registro guardado"}
  },
  forbidden_effective:["TRAVERSABLE_ACTIVITY"],
  expected_boundary:"An atomic UI gesture dependent on a larger activity must not be positively closed as TRAVERSABLE_ACTIVITY."
 },
 {
  id:"S3-ambiguous-scale",operation:"classify_scale",
  authorized_evidence:{activity_name_user_confirmed:"Revisar información",activity_literal_from_workmap:"Revisar información"},
  forbidden_effective:["TRAVERSABLE_ACTIVITY"],
  expected_boundary:"Insufficient material must preserve SCALE_UNKNOWN rather than fabricate a traversable operational boundary."
 },
 {
  id:"S4-traversable-supported",operation:"classify_scale",
  authorized_evidence:{
   activity_name_user_confirmed:"Validar datos fiscales de una solicitud antes de liberarla",
   activity_literal_from_workmap:"Recibo una solicitud, verifico RFC y régimen fiscal, corrijo faltantes y la libero a facturación.",
   semantic_structure:{action_verb:"validar",input_object:"datos fiscales de una solicitud",procedure_standard:"verificar RFC y régimen fiscal",product_output:"solicitud liberada a facturación"},
   activity_start_condition_hint:"cuando recibo la solicitud",activity_end_result_hint:"cuando queda liberada a facturación"
  },
  forbidden_effective:[],
  expected_boundary:"If TRAVERSABLE_ACTIVITY is returned it must be request-bound and positively supported; conservative SCALE_UNKNOWN is still admissible."
 }
];

function b0RoutingRequest(c){
 const base={
  request_id:`p3-b0-routing-${c.id}`,
  operation:c.operation,
  run_id:`P3-B0-ROUTING-${c.id}`,
  observation_context_revision:`ctx-b0-routing-${c.id}-r1`,
  context_revision:`ctx-b0-routing-${c.id}-r1`,
  authorized_evidence:c.authorized_evidence,
  decision_contract:c.operation==="classify_scale"?{
   rule_id:"C6",purpose:"routing_control_only_not_business_evidence",classification_unit:"confirmed_or_corrected_B0_activity_anchor",
   definitions:{
    TRAVERSABLE_ACTIVITY:"Una sola unidad operativa significativa que puede recorrerse de inicio a cierre, con una transformación o actuación coherente sobre un objeto/insumo y un resultado/cierre propio.",
    MACROPROCESS_TOO_BROAD:"La descripción abarca varias transformaciones, etapas, roles o actividades potencialmente autónomas, o un ciclo funcional/end-to-end demasiado amplio.",
    MICROACTION_TOO_NARROW:"La descripción es un gesto, manipulación o subpaso atómico cuyo significado y resultado dependen de una actividad mayor.",
    SCALE_UNKNOWN:"La evidencia B0 disponible no permite distinguir con seguridad el nivel de abstracción sin inventar contexto."
   },
   decision_rules:["STRUCTURAL_COMPLETENESS is not equivalent to OPERATIONAL_SCALE.","Use only authorized_evidence.","When materially ambiguous, return SCALE_UNKNOWN.","Prefer SCALE_UNKNOWN over a false positive TRAVERSABLE_ACTIVITY.","Routing only; never user/business evidence."]
  }:{
   purpose:"routing_control_only_not_business_evidence",
   decision_rule:"Classify whether the confirmed/corrected activity label remains too generic to distinguish this activity from similar ones. If materially ambiguous, return GENERICITY_UNKNOWN."
  },
  output_schema:c.operation==="classify_scale"?{status:["TRAVERSABLE_ACTIVITY","MACROPROCESS_TOO_BROAD","MICROACTION_TOO_NARROW","SCALE_UNKNOWN"],evidence_refs:"list",brief_reason:"string"}:{status:["SPECIFIC_ACTIVITY","GENERIC_ACTIVITY","GENERICITY_UNKNOWN"],evidence_refs:"list",brief_reason:"string"},
  authority:"ai_semantic_routing_control_not_business_evidence"
 };
 if(c.operation==="classify_scale"){
  base.target_id="C6_scale_assessment";
  base.anchor_fingerprint=sha({activity_name_user_confirmed:c.authorized_evidence.activity_name_user_confirmed,semantic_structure:c.authorized_evidence.semantic_structure??null,activity_start_condition_hint:c.authorized_evidence.activity_start_condition_hint??null,activity_end_result_hint:c.authorized_evidence.activity_end_result_hint??null});
 }
 return base;
}

const b2Cases=[
 {id:"A",target:"transformation_primary_dimensions",operation:"render",context_revision:"ctx-A-r1",role_scope:"Ejecutiva comercial, describe únicamente su propia actividad.",literal:"Recibo la necesidad del cliente, reviso la información disponible y preparo una propuesta para que pueda decidir si avanza.",required_information:"Identificar qué es lo principal que se crea, cambia o afecta en la actividad sin imponer taxonomía.",expected:"PASS"},
 {id:"B",target:"transformation_primary_dimensions",operation:"render",context_revision:"ctx-B-r1",role_scope:"Operador de primera línea.",literal:"Reviso lo que llega, hago los ajustes que correspondan y lo dejo listo para que continúe. No sé cómo llamarlo en términos del sistema.",required_information:"Permitir describir la transformación aunque la entidad no esté identificada.",expected:"PASS"},
 {id:"C",target:"transformation_primary_dimensions",operation:"render",context_revision:"ctx-C-r1",role_scope:"Jefe de corte.",literal:"Cuando preparo la transferencia cambian las piezas que quedan disponibles, la coordinación con Armado y también la decisión de enviar todo o sólo una parte.",required_information:"Capturar dimensiones posibles sin forzar una dimensión dominante.",expected:"PASS"},
 {id:"D",target:"transformation_magnitude",operation:"render",context_revision:"ctx-D-r1",role_scope:"Operadora que observa el cambio pero no mide su magnitud.",literal:"Sí noto que el ajuste cambia bastante el resultado, pero no tengo una medida ni sabría decir cuánto.",required_information:"Magnitud reportada o estado unknown/estimate.",expected:"PASS"},
 {id:"E",target:"transformation_primary_dimensions",operation:"candidate",context_revision:"ctx-E-r1",role_scope:"Comercial.",literal:"Al final dejo algo preparado para que Diseño pueda continuar, pero a veces es una propuesta y otras veces sólo información suficiente para medir.",required_information:"Resolver el referente desde hechos; un candidato IA no puede ser premisa.",expected:"PASS"},
 {id:"F",target:"transformation_state_final",operation:"render",context_revision:"ctx-F-r1",role_scope:"Operador conoce su salida inmediata, no el proceso downstream.",literal:"Yo dejo el lote identificado y disponible para Armado. Después de que lo reciben ya no sé qué hacen exactamente.",required_information:"Estado/condición al terminar la propia actividad, respetando límite de rol.",expected:"PASS"},
 {id:"G",target:"transformation_magnitude",operation:"render",context_revision:"ctx-G-r1",role_scope:"Operador sin medición cuantitativa.",literal:"El ajuste puede ser pequeño o grande según el pedido, pero nadie registra porcentaje ni tiempo exacto.",required_information:"Magnitud sin fabricar precisión.",expected:"PASS"},
 {id:"I",target:"ranking_dimensiones",operation:"render",context_revision:"ctx-I-r1",role_scope:"Operador.",literal:"Cambian la pieza, la forma en que la manipulo y a veces también quién participa. No sabría decir cuál de esas cosas pesa más.",required_information:"Dominancia/comparación sólo si existe evidencia suficiente; empates y unknown válidos.",expected:"HOLD_OR_PASS"},
 {id:"J",target:"transformation_exception_description",operation:"render",context_revision:"ctx-J-r1",role_scope:"Operador.",literal:"En 2.9 indiqué que sí, a veces falla pero es raro. Lo único que sé es que algunas piezas llegan a la siguiente estación sin la identificación completa.",required_information:"Describir qué ocurre exactamente cuando existe excepción; no inferir causa.",expected:"PASS"},
 {id:"K",target:"transformation_hidden_changes_description",operation:"render",context_revision:"ctx-K-r1",role_scope:"Operador.",literal:"Marqué que sí existen cambios que no siempre aparecen en el procedimiento. Sé que a veces alguien reordena la secuencia, pero no siempre sé quién.",required_information:"Describir cambio no oficial y actor/fuente sólo si el informante lo conoce.",expected:"PASS"},
 {id:"L",target:"transformation_hidden_changes_description",operation:"render",context_revision:"ctx-L-r1",role_scope:"Operador.",literal:"No estoy seguro de que haya cambios no oficiales; escuché algo de otra área, pero no lo observé y no sé si aplica aquí.",required_information:"No generar 2.12 sin precondición/referente competente.",expected:"HOLD"}
];

function b2Request(c){
 const source=evidenceSource(`P3-B2-${c.id}-E1`,c.literal,1);
 const spec=b2.B2_TARGETS[c.target];
 const runtimeRef=Object.entries(b2.B2_RUNTIME_BINDINGS).find(([,binding])=>binding.intent_refs.some((ref)=>ref.includes(`::${spec.question_code} ·`)))?.[0];
 if(!runtimeRef) throw new Error(`P3_B2_RUNTIME_BINDING_MISSING:${c.target}`);
 const runtimeBinding=b2.B2_RUNTIME_BINDINGS[runtimeRef];
 return {
  request_id:`p3-b2-${c.id}`,
  profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",
  operation:c.operation,
  scope:{case_id:`P3-CASE-${c.id}`,activity_id:`P3-ACT-${c.id}`},
  target_ids:[c.target],
  canonical_anchor_ref:runtimeRef,
  context_revision:c.context_revision,
  context_sources:[source],
  gaps:[],
  operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},
  fallback_ref:"Resolve per-subfield fallback policy; activation != fallback_eligibility != presentation.",
  review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",
  normative_context_ref:runtimeBinding.intent_refs[0],
  observational_context_ref:runtimeBinding.cluster_refs[0],
  generator_ref:"P3:gpt-6-luna",
  context_policy_ref:"B2-CONTEXT-POLICY-G1.1"
 };
}

const evaluatorBankPath=path.join(root,"pr3/authority/source_evidence/B2/Evaluator_Qualification_Evidence.json");
const evaluatorBankSource=JSON.parse(fs.readFileSync(evaluatorBankPath,"utf8"));
const referenceBank=evaluatorBankSource.cases.map((item)=>[
 item.fixture_id.replace("EVAL-REF-",""),
 item.proposal_exact.fixture_text,
 item.reference_judgment,
 item.criterion_expected,
]);

async function evaluateLive(objectKey,caseId,request,proposal,governedIntent){
 return runP3EvaluatorCandidate({
  case_id:`${objectKey}-${caseId}`,object_key:objectKey,criterion_scope:["intent_fidelity","observer_fidelity","reflexive_integrity","narrative_canonical_fidelity"],
  source_context:request,governed_intent:governedIntent,proposal_or_fixture:proposal
 });
}

async function main(){
 const startedAt=now();
 const evidence={
  evidence_id:"P3-PR3-PRODUCTION-AI-QUALIFICATION-EVIDENCE-v1.0",
  classification:"SYNTHETIC_REFERENCE_REAL_MODEL_QUALIFICATION_EVIDENCE",
  started_at:startedAt,
  generator:{provider:"OpenAI",model_requested:"gpt-6-luna",store:false,tools:[]},
  evaluator_candidate:{provider:"OpenAI",model_requested:P3_EVALUATOR_MODEL_ID,authority_state:"CANDIDATE_ONLY",automatic_admission:false},
  source_evidence:{
   b0_model_test:{path:"pr3/authority/source_evidence/B0/B0_MODEL_TEST_MVP_Evidence.json",sha256:"4a2e9a4404a0962dc09a874441de329f70dc90a722cd035d3dcf2f70fdbcaabf"},
   b2_integrated_model_test:{path:"pr3/authority/source_evidence/B2/MODEL_TEST_MVP_Integrated_Evidence.json",sha256:"f88dd88aa3a02350940862058d718ea4477ea0caef58dc85c8530a4073e70586",baseline_sha256:"9d7df9583b5d0a42ce146dc2546781131efa5a007c2e0bc59c24b42acf887b15"},
   evaluator_reference_bank:{path:"pr3/authority/source_evidence/B2/Evaluator_Qualification_Evidence.json",sha256:"3852c6d4e69639c001f738dce133352472d06ca3ba3675973077a2d1c7b36fb6",bank_size:evaluatorBankSource.bank_size}
  },
  deterministic_preflight:{},
  b0_cases:[],b0_routing_cases:[],b2_cases:[],reference_bank:[],
  hard_falsifiers:[],
  qualification_determination:"NOT_RUN",
  a10_authority_granted:false
 };

 // Deterministic preflight: exact target surfaces and B2 DETERMINISTIC zero-call boundary.
 evidence.deterministic_preflight.b0_target_count=Object.keys(b0.B0_AI_TARGETS).length;
 evidence.deterministic_preflight.b2_mode_counts=Object.values(b2.B2_TARGETS).reduce((acc,x)=>(acc[x.ai_mode]=(acc[x.ai_mode]??0)+1,acc),{});
 for(const [target,spec] of Object.entries(b2.B2_TARGETS)){
  if(spec.ai_mode==="DETERMINISTIC" && spec.ops.length!==0) evidence.hard_falsifiers.push(`DETERMINISTIC_HAS_AI_OP:${target}`);
 }
 const mixedPreflight=b2.prepareB2AiRequest({
  object_run_id:"or-p3-mixed-preflight",interaction_key:"ii-p3-mixed-preflight",server_command_event_id:"srv-p3-mixed-preflight",requested_at:"2026-10-03T00:00:00.000000Z",
  b2_request:{
   request_id:"p3-mixed-preflight",profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",operation:"render",
   scope:{case_id:"P3-MIXED",activity_id:"P3-MIXED-ACT"},
   target_ids:["transformation_magnitude","transformation_iterations"],canonical_anchor_ref:"B2-Q16",context_revision:"ctx-p3-mixed-r1",
   context_sources:[evidenceSource("P3-MIXED-E1","El ajuste cambia bastante, pero no tengo una medida exacta.",1)],gaps:[],
   operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},
   fallback_ref:"Resolve per-subfield fallback policy; activation != fallback_eligibility != presentation.",
   review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",
   normative_context_ref:"B2-SIE-K3-v0.8C::2.3 · normativo; nunca evidence_context.",
   observational_context_ref:"K3"
  }
 });
 evidence.deterministic_preflight.b2_mixed_mode_filtering={
  runtime_target_ids:mixedPreflight.runtime_request.target_ids,
  provider_target_ids:mixedPreflight.provider_request?.target_ids??[],
  deterministic_target_ids:mixedPreflight.deterministic_target_ids
 };
 if((mixedPreflight.provider_request?.target_ids??[]).includes("transformation_iterations")) evidence.hard_falsifiers.push("MIXED_INTERACTION_DETERMINISTIC_TARGET_LEAKED_TO_PROVIDER");
 if(!process.env.EVE_PR3_OPENAI_API_KEY?.trim()){
  evidence.qualification_determination="BLOCKED_REAL_MODEL_SECRET_NOT_AVAILABLE";
  evidence.completed_at=now();
  fs.mkdirSync(path.join(root,".tmp"),{recursive:true});
  fs.writeFileSync(path.join(root,".tmp/P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_0.json"),JSON.stringify(evidence,null,2));
  console.log(JSON.stringify({determination:evidence.qualification_determination,hard_falsifiers:evidence.hard_falsifiers},null,2));
  process.exitCode=3; return;
 }

 const b0Provider=new OpenAiB0ResponsesProvider();
 for(const c of b0Cases){
  const req=b0Request(c.id,c.target,c.literal);
  const row={case_id:c.id,target:c.target,request_sha256:sha(req),provider:null,deterministic_conformance:null,evaluator:null,error:null};
  try{
   const result=await b0Provider.propose(req);
   row.provider={request_id:result.provider_request_id,model_version:result.model_version,usage:result.usage,proposal_sha256:sha(result.proposal),proposal:result.proposal};
   try{b0.assertB0AiProposal(req,result.proposal);row.deterministic_conformance="PASS";}catch(error){row.deterministic_conformance="FAIL";row.error=String(error);evidence.hard_falsifiers.push(`B0_CONTRACT:${c.id}:${String(error)}`);}
   if(row.deterministic_conformance==="PASS") row.evaluator=await evaluateLive("B0",c.id,req,result.proposal,{target:c.target,canonical_question:b0.B0_AI_TARGETS[c.target].question,expected_boundary:"no new canon/evidence/diagnosis"});
  }catch(error){row.error=String(error);evidence.hard_falsifiers.push(`B0_PROVIDER:${c.id}:${String(error)}`);}
  evidence.b0_cases.push(row);
 }

 for(const rc of b0RoutingCases){
  const req=b0RoutingRequest(rc);
  const row={case_id:rc.id,operation:rc.operation,request_sha256:sha(req),provider:null,evaluator:null,error:null,hard_boundary:"PASS"};
  try{
   const result=await runB0RoutingOperation(req);
   row.provider={request_id:result.provider_request_id,model_version:result.model_version,usage:result.usage,effective_status:result.effective_status,result_sha256:sha(result.result),result:result.result};
   if(rc.forbidden_effective.includes(result.effective_status)){
    row.hard_boundary="FAIL";
    evidence.hard_falsifiers.push(`B0_ROUTING_FALSE_POSITIVE:${rc.id}:${result.effective_status}`);
   }
   row.evaluator=await evaluateLive("B0",`routing-${rc.id}`,req,result.result,{operation:rc.operation,expected_boundary:rc.expected_boundary,authority:"routing_control_only_not_business_evidence"});
  }catch(error){
   row.error=String(error);
   row.hard_boundary="FAIL";
   evidence.hard_falsifiers.push(`B0_ROUTING_PROVIDER_OR_CONTRACT:${rc.id}:${String(error)}`);
  }
  evidence.b0_routing_cases.push(row);
 }

 const b2Provider=new OpenAiB2ResponsesProvider();
 for(const c of b2Cases){
  const req=b2Request(c);
  const row={case_id:c.id,target:c.target,expected:c.expected,request_sha256:sha(req),provider:null,deterministic_conformance:null,evaluator:null,error:null};
  try{
   const result=await b2Provider.propose(req);
   row.provider={request_id:result.provider_request_id,model_version:result.model_version,usage:result.usage,proposal_sha256:sha(result.proposal),proposal:result.proposal};
   try{b2.assertB2Proposal(req,result.proposal);row.deterministic_conformance="PASS";}catch(error){row.deterministic_conformance="FAIL";row.error=String(error);evidence.hard_falsifiers.push(`B2_CONTRACT:${c.id}:${String(error)}`);}
   if(row.deterministic_conformance==="PASS") row.evaluator=await evaluateLive("B2",c.id,req,result.proposal,{target:c.target,canonical_question:b2.B2_TARGETS[c.target].question,required_information:c.required_information});
  }catch(error){row.error=String(error);evidence.hard_falsifiers.push(`B2_PROVIDER:${c.id}:${String(error)}`);}
  evidence.b2_cases.push(row);
 }

 for(const [code,fixture,expected,criterion] of referenceBank){
  const row={fixture_id:`EVAL-REF-${code}`,fixture,expected,criterion,observed:null,agreement:null,error:null};
  try{
   const review=await runP3EvaluatorCandidate({
    case_id:row.fixture_id,object_key:"REFERENCE_BANK",criterion_scope:[criterion],
    source_context:{fixture_class:fixture,synthetic:true},
    governed_intent:{criterion,reference_bank:"EVALUATOR-REFERENCE-QUALIFICATION-BANK-v0.2.1"},
    proposal_or_fixture:{fixture_text:fixture,not_product_model_output:true}
   });
   const observed=review.result.results.find(x=>x.criterion_id===criterion)?.outcome??"UNKNOWN";
   row.observed=observed;row.agreement=observed===expected;
   row.evaluator={provider_request_id:review.provider_request_id,model_version:review.model_version,usage:review.usage,aggregate_result:review.result.aggregate_result,material_findings:review.result.material_findings};
   if(!row.agreement) evidence.hard_falsifiers.push(`EVALUATOR_REFERENCE_DISAGREEMENT:${row.fixture_id}:${expected}->${observed}`);
  }catch(error){row.error=String(error);evidence.hard_falsifiers.push(`EVALUATOR_REFERENCE_ERROR:${row.fixture_id}:${String(error)}`);}
  evidence.reference_bank.push(row);
 }

 const liveSemanticFindings=[...evidence.b0_cases,...evidence.b0_routing_cases,...evidence.b2_cases]
  .filter(x=>x.evaluator&&["FAIL","HOLD"].includes(x.evaluator.result.aggregate_result))
  .map(x=>({case_id:x.case_id,evaluator_aggregate:x.evaluator.result.aggregate_result,material_findings:x.evaluator.result.material_findings??[],authority:"CANDIDATE_ONLY__NOT_A_HARD_FALSIFIER_WITHOUT_REFERENCE_OR_ADJUDICATION"}));
 evidence.candidate_evaluator_live_findings=liveSemanticFindings;

 evidence.reference_bank_agreement={agree:evidence.reference_bank.filter(x=>x.agreement===true).length,disagree:evidence.reference_bank.filter(x=>x.agreement===false).length,unknown_or_error:evidence.reference_bank.filter(x=>x.agreement==null).length,total:evidence.reference_bank.length};
 evidence.qualification_determination=evidence.hard_falsifiers.length===0?"EVIDENCE_READY_FOR_A10_AUTHORITY_DETERMINATION":"P3_CONFORMANCE_NOT_CLOSED";
 evidence.authority_boundary_note="Candidate evaluator live FAIL/HOLD outputs are findings only. They do not become hard generator falsifiers without a governed reference judgment or A10 adjudication; this prevents circular self-authorization.";
 evidence.completed_at=now();
 evidence.evidence_sha256=sha({...evidence,evidence_sha256:undefined});
 fs.mkdirSync(path.join(root,".tmp"),{recursive:true});
 const out=path.join(root,".tmp/P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_0.json");
 fs.writeFileSync(out,JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({determination:evidence.qualification_determination,reference_bank_agreement:evidence.reference_bank_agreement,hard_falsifier_count:evidence.hard_falsifiers.length,evidence_sha256:evidence.evidence_sha256,output:out},null,2));
 if(evidence.hard_falsifiers.length) process.exitCode=2;
}
await main();
