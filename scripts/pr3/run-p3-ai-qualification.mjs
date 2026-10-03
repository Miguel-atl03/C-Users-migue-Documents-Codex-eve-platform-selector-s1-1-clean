import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { createHash, randomUUID } from "node:crypto";

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
function supportRange(source,quote){const chars=Array.from(source.literal),q=Array.from(quote);const text=chars.join(""),idx=text.indexOf(q.join(""));if(idx<0) throw new Error(`fixture quote not found: ${quote}`);const start=Array.from(text.slice(0,idx)).length;return {evidence_id:source.evidence_id,revision:source.revision,start,end:start+q.length,quote};}

const {
 B0_PROFILE_ID,B0RuntimeAiRequest:_,OpenAiB0ResponsesProvider
}=Object.assign({},svc("ai/b0-binding.ts"),svc("ai/openai-responses.ts"));
const b0=svc("ai/b0-binding.ts"),b2=svc("ai/b2-binding.ts");
const {OpenAiB2ResponsesProvider}=svc("ai/b2-openai-responses.ts");
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
 return {
  request_id:`p3-b2-${c.id}`,
  profile_ref:"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1",
  operation:c.operation,
  scope:{case_id:`P3-CASE-${c.id}`,activity_id:`P3-ACT-${c.id}`},
  target_ids:[c.target],
  canonical_anchor_ref:b2.B2_TARGETS[c.target].question_code,
  context_revision:c.context_revision,
  context_sources:[source],
  gaps:[],
  operation_limits:{max_questions_per_proposal:2,max_semantic_candidates:8},
  fallback_ref:{policy:"SAFE_CANONICAL_FALLBACK_OR_HOLD"},
  review_policy_ref:"B2-RP-AI-PROPOSAL-G1.1",
  normative_context_ref:`P3-INTENT-${c.id}`,
  observational_context_ref:`P3-OBS-${c.id}`,
  generator_ref:"P3:gpt-6-luna",
  context_policy_ref:"P3-REFERENCE-CONTEXT-v1"
 };
}

const referenceBank=[
 ["A","render fiel","PASS","intent_fidelity"],["B","pregunta inductiva","FAIL","intent_fidelity"],["C","candidato IA usado como premisa","FAIL","reflexive_integrity"],
 ["D","conocimiento fuera del rol","FAIL","observer_fidelity"],["E","unsupported specificity","FAIL","reflexive_integrity"],["F","alternativa material omitida","FAIL","reflexive_integrity"],
 ["G","stale context","FAIL","narrative_canonical_fidelity"],["H","target incorrecto","FAIL","narrative_canonical_fidelity"],["I","cita correcta pero interpretación no soportada","FAIL","reflexive_integrity"],
 ["J","unknown legítimo","PASS","observer_fidelity"],["K","fallback seguro","PASS","narrative_canonical_fidelity"],["L","K2 fallback estático prohibido","FAIL","intent_fidelity"],
 ["M","self-check limpio pero propuesta defectuosa","FAIL","reflexive_integrity"],["N","cambio sutil de intención","FAIL","intent_fidelity"],["O","lenguaje cotidiano distinto al canon pero fiel","PASS","intent_fidelity"]
];

async function evaluateLive(objectKey,caseId,request,proposal,governedIntent){
 return runP3EvaluatorCandidate({
  case_id:`${objectKey}-${caseId}`,object_key:objectKey,criterion_scope:["intent_fidelity","observer_fidelity","reflexive_integrity","narrative_canonical_fidelity"],
  source_context:request,governed_intent:governedIntent,proposal_or_fixture:proposal,reference_judgment:null
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
  source_evidence:{b0_model_test_sha256:"4a2e9a4404a0962dc09a874441de329f70dc90a722cd035d3dcf2f70fdbcaabf",b2_model_test_sha256:"9d7df9583b5d0a42ce146dc2546781131efa5a007c2e0bc59c24b42acf887b15",evaluator_reference_bank_sha256:"3852c6d4e69639c001f738dce133352472d06ca3ba3675973077a2d1c7b36fb6"},
  deterministic_preflight:{},
  b0_cases:[],b2_cases:[],reference_bank:[],
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

 const b2Provider=new OpenAiB2ResponsesProvider();
 for(const c of b2Cases){
  const req=b2Request(c);
  const row={case_id:c.id,target:c.target,expected:c.expected,request_sha256:sha(req),provider:null,deterministic_conformance:null,evaluator:null,error:null};
  try{
   const result=await b2Provider.propose(req);
   row.provider={request_id:result.provider_request_id,model_version:result.model_version,usage:result.usage,proposal_sha256:sha(result.proposal),proposal:result.proposal};
   try{b2.assertB2Proposal(req,result.proposal);row.deterministic_conformance="PASS";}catch(error){row.deterministic_conformance="FAIL";row.error=String(error);evidence.hard_falsifiers.push(`B2_CONTRACT:${c.id}:${String(error)}`);}
   if(row.deterministic_conformance==="PASS") row.evaluator=await evaluateLive("B2",c.id,req,result.proposal,{target:c.target,canonical_question:b2.B2_TARGETS[c.target].question,required_information:c.required_information,expected_reference_action:c.expected});
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
    proposal_or_fixture:{fixture_text:fixture,not_product_model_output:true},
    reference_judgment:expected
   });
   const observed=review.result.results.find(x=>x.criterion_id===criterion)?.outcome??"UNKNOWN";
   row.observed=observed;row.agreement=observed===expected;
   row.evaluator={provider_request_id:review.provider_request_id,model_version:review.model_version,usage:review.usage,aggregate_result:review.result.aggregate_result,material_findings:review.result.material_findings};
   if(!row.agreement) evidence.hard_falsifiers.push(`EVALUATOR_REFERENCE_DISAGREEMENT:${row.fixture_id}:${expected}->${observed}`);
  }catch(error){row.error=String(error);evidence.hard_falsifiers.push(`EVALUATOR_REFERENCE_ERROR:${row.fixture_id}:${String(error)}`);}
  evidence.reference_bank.push(row);
 }

 const liveSemanticFailures=[...evidence.b0_cases,...evidence.b2_cases].filter(x=>x.evaluator&&["FAIL","HOLD"].includes(x.evaluator.result.aggregate_result));
 for(const row of liveSemanticFailures) evidence.hard_falsifiers.push(`LIVE_SEMANTIC_REVIEW:${row.case_id}:${row.evaluator.result.aggregate_result}`);

 evidence.reference_bank_agreement={agree:evidence.reference_bank.filter(x=>x.agreement===true).length,disagree:evidence.reference_bank.filter(x=>x.agreement===false).length,unknown_or_error:evidence.reference_bank.filter(x=>x.agreement==null).length,total:evidence.reference_bank.length};
 evidence.qualification_determination=evidence.hard_falsifiers.length===0?"EVIDENCE_READY_FOR_A10_AUTHORITY_DETERMINATION":"P3_CONFORMANCE_NOT_CLOSED";
 evidence.completed_at=now();
 evidence.evidence_sha256=sha({...evidence,evidence_sha256:undefined});
 fs.mkdirSync(path.join(root,".tmp"),{recursive:true});
 const out=path.join(root,".tmp/P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_0.json");
 fs.writeFileSync(out,JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({determination:evidence.qualification_determination,reference_bank_agreement:evidence.reference_bank_agreement,hard_falsifier_count:evidence.hard_falsifiers.length,evidence_sha256:evidence.evidence_sha256,output:out},null,2));
 if(evidence.hard_falsifiers.length) process.exitCode=2;
}
await main();
