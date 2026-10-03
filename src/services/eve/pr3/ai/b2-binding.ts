import "server-only";
import { canonicalJson,sha256Utf8 } from "../canonical";

export const B2_PROFILE_ID="EVE-C1-B2-OPERATIONAL-PROJECTION-G1" as const;
export const B2_PROFILE_REVISION="1.1" as const;
export const B2_PROFILE_SHA256="7c795ea221de055777ed5d97be3767ca71c94e3fc217d28de98564f01499f78f" as const;
export const B2_AI_PROVIDER_REF="openai.responses.v1" as const;
export const B2_AI_MODEL_ID="gpt-6-luna" as const;
export const B2_PROMPT_PROFILE_REF="EVE-PR3-B2-PROPOSAL-PROMPT" as const;
export const B2_PROMPT_PROFILE_REVISION="1.0" as const;
export const B2_RESPONSE_SCHEMA_REF="urn:eve:capture:ai-proposal:1.1" as const;
export const B2_REVIEW_POLICY_REF="B2-RP-AI-PROPOSAL-G1.1" as const;

export const B2_TARGETS={
 transformation_primary_dimensions:{question_code:"2.1",question:"¿Qué es lo principal que creas, cambias o afectas con esta actividad?",ai_mode:"AI_DEFAULT_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 objeto_tipo:{question_code:"2.1a",question:"¿Cuál es ese objeto?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 sujeto_tipo:{question_code:"2.1b",question:"¿Cuál es ese sujeto?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 accion_tipo:{question_code:"2.1c",question:"¿Cuál es la acción principal?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 dimension_dominante_AB:{question_code:"2.1_AB_Relacion",question:"¿Cuál de estos dos es el limitante principal?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render"]},
 dimension_dominante_AC:{question_code:"2.1_AC_Relacion",question:"¿La acción es el cuello de botella o el objeto?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render"]},
 dimension_dominante_BC:{question_code:"2.1_BC_Relacion",question:"¿Qué limita más tu capacidad?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render"]},
 dimension_dominante_ABC:{question_code:"2.1_ABC_Relacion",question:"En esta actividad, ¿cuál de estos tres es el obstáculo principal?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render"]},
 ranking_dimensiones:{question_code:"2.1_ABC_Prioridad",question:"Si tuvieras que ordenarlos por importancia, ¿cuál va primero?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render"]},
 atributos_objeto_cambian:{question_code:"2.2_obj",question:"De ese {OBJETO}, ¿cuáles de estas propiedades o características cambian?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 atributos_sujeto_cambian:{question_code:"2.2_suj",question:"De ese {SUJETO}, ¿cuáles de estas propiedades o características cambian?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 atributos_accion_cambian:{question_code:"2.2_acc",question:"De esa {ACCIÓN}, ¿cuáles de estas características cambian?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 transformation_magnitude:{question_code:"2.3",question:"Cuando haces esta actividad, ¿qué tanto cambia lo principal con respecto a cómo llegó?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render"]},
 transformation_causality_action:{question_code:"2.4a",question:"¿Qué acción o cambio haces tú directamente sobre lo principal?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 transformation_causality_trigger:{question_code:"2.4b",question:"¿Qué es lo que normalmente provoca que hagas ese cambio?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 transformation_state_initial:{question_code:"2.5",question:"Justo antes de que comience esta actividad, ¿en qué estado o condición se encuentra lo principal?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 transformation_state_final:{question_code:"2.6",question:"Después de que termina esta actividad, ¿en qué estado o condición queda lo principal?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 transformation_iterations:{question_code:"2.7",question:"¿Lo principal se transforma una sola vez o hay múltiples ciclos de transformación?",ai_mode:"DETERMINISTIC",ops:[]},
 transformation_iteration_count:{question_code:"2.8",question:"Si respondiste 'Pocas veces' o 'Muchas veces', ¿cuántos ciclos típicamente ocurren?",ai_mode:"DETERMINISTIC",ops:[]},
 transformation_exception_type:{question_code:"2.9",question:"¿Hay momentos en que no se transforma aunque debería, o se transforma de forma incorrecta?",ai_mode:"DETERMINISTIC",ops:[]},
 transformation_exception_description:{question_code:"2.10",question:"Si respondiste 'Sí' en la pregunta anterior, ¿cómo falla la transformación? ¿Qué ocurre exactamente?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 transformation_hidden_changes:{question_code:"2.11",question:"¿Hay cambios que ocurren en lo principal pero que no son oficiales o esperados?",ai_mode:"DETERMINISTIC",ops:[]},
 transformation_hidden_changes_description:{question_code:"2.12",question:"Si respondiste 'Sí', ¿cuáles son esos cambios no oficiales y quién los hace?",ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER",ops:["render","candidate"]},
 dimension_dominante_clarificada:{question_code:"2.A",question:"Veo que marcaste varias dimensiones o atributos, pero todavía no queda claro qué es lo que realmente limita más esta transformación. ¿Dirías que el problema principal está en el objeto, en el sujeto, en la acción o en una combinación concreta?",ai_mode:"AI_CONDITIONAL_CLARIFICATION",ops:["clarification"]},
 transformation_exception_description_clarified:{question_code:"2.B",question:"Mencionaste que la transformación falla, pero todavía no queda claro cómo falla exactamente. ¿Qué es lo primero que ves que sale mal o no cambia cómo debería?",ai_mode:"AI_CONDITIONAL_CLARIFICATION",ops:["clarification"]},
 transformation_hidden_changes_description_clarified:{question_code:"2.C",question:"Mencionaste cambios no oficiales, pero todavía no queda claro cuál es el cambio concreto o quién lo hace. ¿Qué cambia fuera del procedimiento normal y desde dónde ocurre?",ai_mode:"AI_CONDITIONAL_CLARIFICATION",ops:["clarification"]}
} as const;
export type B2TargetId=keyof typeof B2_TARGETS;

export const B2_RUNTIME_BINDINGS={
 "B2-Q12":{cluster_refs:["K1"],intent_refs:["B2-SIE-K1-v0.8C::2.1 · normativo; nunca evidence_context.","B2-SIE-K1-v0.8C::2.1a · normativo; nunca evidence_context.","B2-SIE-K1-v0.8C::2.1b · normativo; nunca evidence_context.","B2-SIE-K1-v0.8C::2.1c · normativo; nunca evidence_context."]},
 "B2-Q13":{cluster_refs:["K3"],intent_refs:["B2-SIE-K3-v0.8C::2.2_obj · normativo; nunca evidence_context.","B2-SIE-K3-v0.8C::2.2_suj · normativo; nunca evidence_context.","B2-SIE-K3-v0.8C::2.2_acc · normativo; nunca evidence_context."]},
 "B2-Q14":{cluster_refs:["K4"],intent_refs:["B2-SIE-K4-v0.8C::2.4a · normativo; nunca evidence_context.","B2-SIE-K4-v0.8C::2.4b · normativo; nunca evidence_context."]},
 "B2-Q15":{cluster_refs:["K4"],intent_refs:["B2-SIE-K4-v0.8C::2.5 · normativo; nunca evidence_context.","B2-SIE-K4-v0.8C::2.6 · normativo; nunca evidence_context."]},
 "B2-Q16":{cluster_refs:["K3","K5"],intent_refs:["B2-SIE-K3-v0.8C::2.3 · normativo; nunca evidence_context.","B2-SIE-K5-v0.8C::2.7 · normativo; nunca evidence_context."]},
 "B2-Q17":{cluster_refs:["K6","K7"],intent_refs:["B2-SIE-K6-v0.8C::2.9 · normativo; nunca evidence_context.","B2-SIE-K7-v0.8C::2.11 · normativo; nunca evidence_context."]},
 "C04":{cluster_refs:["K2"],intent_refs:["B2-SIE-K2-v0.8C::2.1_AB_Relacion · normativo; nunca evidence_context.","B2-SIE-K2-v0.8C::2.1_AC_Relacion · normativo; nunca evidence_context.","B2-SIE-K2-v0.8C::2.1_BC_Relacion · normativo; nunca evidence_context.","B2-SIE-K2-v0.8C::2.1_ABC_Relacion · normativo; nunca evidence_context.","B2-SIE-K2-v0.8C::2.1_ABC_Prioridad · normativo; nunca evidence_context.","B2-SIE-K2-v0.8C::2.A · normativo; nunca evidence_context."]},
 "C05":{cluster_refs:["K6"],intent_refs:["B2-SIE-K6-v0.8C::2.10 · normativo; nunca evidence_context.","B2-SIE-K6-v0.8C::2.B · normativo; nunca evidence_context."]},
 "C06":{cluster_refs:["K7"],intent_refs:["B2-SIE-K7-v0.8C::2.12 · normativo; nunca evidence_context.","B2-SIE-K7-v0.8C::2.C · normativo; nunca evidence_context."]},
 "C07":{cluster_refs:["K5"],intent_refs:["B2-SIE-K5-v0.8C::2.8 · normativo; nunca evidence_context."]}
} as const;

export type B2Operation="render"|"candidate"|"clarification";
export type B2ContextSource={evidence_id:string;revision:number;literal:string;question_code?:string;variable_id?:string;knowledge_basis?:string;epistemic_class?:string};
export type B2RuntimeAiRequest={
 request_id:string;profile_ref:string;operation:B2Operation;scope:{case_id:string;activity_id:string;role_id?:string;scene_id?:string};
 target_ids:readonly string[];canonical_anchor_ref:string;context_revision:string;context_sources:readonly B2ContextSource[];gaps:readonly string[];
 operation_limits:{max_questions_per_proposal:number;max_semantic_candidates:number};fallback_ref:unknown;review_policy_ref:string;
 normative_context_ref:string;observational_context_ref:string;generator_ref?:string;context_policy_ref?:string;
};
export type B2ProductionAiRequest={object_run_id:string;interaction_key:string;server_command_event_id:string;requested_at:string;b2_request:B2RuntimeAiRequest};
export type B2Support={evidence_id:string;revision:number;start:number;end:number;quote:string};
export type B2AiProposal={
 request_id:string;context_revision:string;systemic_intent_ref:string;observation_context_ref:string;action:"propose"|"abstain";
 questions:readonly {target_id:string;text:string;supports:readonly B2Support[];neutral:boolean}[];
 candidates:readonly {target_id:string;proposed_value:string|number|boolean|null|readonly string[];epistemic_type:"ai_proposed_candidate";supports:readonly B2Support[]}[];
 issues:readonly string[];
 reflexive_receipt:{evidence_used_refs:readonly string[];assumptions_added:readonly string[];material_alternatives:readonly string[];presupposition_confirmation_risks:readonly string[];observer_scope_control:string;specificity_action:"contextualize"|"neutralize"|"abstain";remaining_gaps:readonly string[]};
};

export function assertB2Request(input:B2ProductionAiRequest):void{
 const req=input.b2_request;
 if(!input.object_run_id||!input.interaction_key||!input.server_command_event_id||!input.requested_at) throw new Error("a09_identity_binding_missing");
 if(req.profile_ref!==`${B2_PROFILE_ID}@${B2_PROFILE_REVISION}`) throw new Error("a09_b2_profile_mismatch");
 if(!["render","candidate","clarification"].includes(req.operation)) throw new Error("a09_operation_invalid");
 if(!req.target_ids.length||new Set(req.target_ids).size!==req.target_ids.length) throw new Error("a09_target_set_invalid");
 const activeBindings=[] as Array<{target:string;runtime_ref:string}>;
 for(const target of req.target_ids){
  const spec=B2_TARGETS[target as B2TargetId];
  if(!spec) throw new Error(`a09_target_unknown:${target}`);
  if(spec.ai_mode==="DETERMINISTIC") throw new Error(`a09_deterministic_target_forbids_model:${target}`);
  if(!(spec.ops as readonly string[]).includes(req.operation)) throw new Error(`a09_operation_not_authorized_for_target:${target}:${req.operation}`);
  const runtimeRef=Object.entries(B2_RUNTIME_BINDINGS).find(([,binding])=>binding.intent_refs.some((ref)=>ref.includes(`::${spec.question_code} ·`)))?.[0];
  if(!runtimeRef) throw new Error(`a09_runtime_binding_missing:${target}`);
  activeBindings.push({target,runtime_ref:runtimeRef});
 }
 const anchors=new Set(activeBindings.map((binding)=>binding.runtime_ref));
 if(anchors.size!==1||!anchors.has(req.canonical_anchor_ref)) throw new Error("a09_canonical_anchor_mismatch");
 const runtimeBinding=B2_RUNTIME_BINDINGS[req.canonical_anchor_ref as keyof typeof B2_RUNTIME_BINDINGS];
 if(!runtimeBinding) throw new Error("a09_runtime_anchor_unknown");
 if(!(runtimeBinding.intent_refs as readonly string[]).includes(req.normative_context_ref)) throw new Error("a09_normative_context_mismatch");
 if(!(runtimeBinding.cluster_refs as readonly string[]).includes(req.observational_context_ref)) throw new Error("a09_observational_context_mismatch");
 if(req.operation_limits.max_questions_per_proposal!==2||req.operation_limits.max_semantic_candidates!==8) throw new Error("a09_operation_limits_mismatch");
 if(req.review_policy_ref!==B2_REVIEW_POLICY_REF) throw new Error("a09_review_policy_mismatch");
 if(!req.context_revision||!req.canonical_anchor_ref||!req.normative_context_ref||!req.observational_context_ref) throw new Error("a09_context_binding_missing");
 if(req.context_sources.some(s=>!s.evidence_id||!Number.isInteger(s.revision)||s.revision<1||typeof s.literal!=="string")) throw new Error("a09_context_sources_invalid");
}

function codePoints(value:string){return Array.from(value);}
function validateSupport(s:B2Support,sources:Map<string,B2ContextSource>){
 const src=sources.get(s.evidence_id);if(!src) throw new Error("a09_support_evidence_not_found");
 if(s.revision!==src.revision) throw new Error("a09_support_stale_revision");
 const chars=codePoints(src.literal);
 if(!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start<0||s.end<=s.start||s.end>chars.length) throw new Error("a09_support_range_invalid");
 if(s.quote!==chars.slice(s.start,s.end).join("")) throw new Error("a09_support_quote_mismatch");
}
export function assertB2Proposal(req:B2RuntimeAiRequest,p:B2AiProposal):void{
 if(p.request_id!==req.request_id) throw new Error("a09_response_request_id_mismatch");
 if(p.context_revision!==req.context_revision) throw new Error("a09_response_context_stale");
 if(p.systemic_intent_ref!==req.normative_context_ref||p.observation_context_ref!==req.observational_context_ref) throw new Error("a09_response_context_binding_mismatch");
 if(!["propose","abstain"].includes(p.action)) throw new Error("a09_response_action_invalid");
 if(p.questions.length>2||p.candidates.length>8) throw new Error("a09_output_limit_exceeded");
 const allowed=new Set(req.target_ids),sources=new Map(req.context_sources.map(s=>[s.evidence_id,s]));
 for(const q of p.questions){if(!allowed.has(q.target_id)||!q.text.trim()) throw new Error("a09_question_target_invalid");if(!q.supports.length&&q.neutral!==true) throw new Error("a09_unsupported_contextual_question");for(const s of q.supports) validateSupport(s,sources);}
 for(const c of p.candidates){if(!allowed.has(c.target_id)||c.epistemic_type!=="ai_proposed_candidate"||!c.supports.length) throw new Error("a09_candidate_invalid");for(const s of c.supports) validateSupport(s,sources);}
 const r=p.reflexive_receipt;if(!r||!["contextualize","neutralize","abstain"].includes(r.specificity_action)) throw new Error("a09_reflexive_receipt_invalid");
 for(const ref of r.evidence_used_refs) if(!sources.has(ref)) throw new Error(`a09_reflexive_evidence_not_authorized:${ref}`);
}

const support={type:"object",additionalProperties:false,required:["evidence_id","revision","start","end","quote"],properties:{evidence_id:{type:"string"},revision:{type:"integer"},start:{type:"integer"},end:{type:"integer"},quote:{type:"string"}}} as const;
const candidateValue={anyOf:[{type:"string"},{type:"number"},{type:"boolean"},{type:"null"},{type:"array",items:{type:"string"}}]} as const;
export const B2_AI_RESPONSE_SCHEMA={type:"object",additionalProperties:false,required:["request_id","context_revision","systemic_intent_ref","observation_context_ref","action","questions","candidates","issues","reflexive_receipt"],properties:{
 request_id:{type:"string"},context_revision:{type:"string"},systemic_intent_ref:{type:"string"},observation_context_ref:{type:"string"},action:{type:"string",enum:["propose","abstain"]},
 questions:{type:"array",maxItems:2,items:{type:"object",additionalProperties:false,required:["target_id","text","supports","neutral"],properties:{target_id:{type:"string"},text:{type:"string"},supports:{type:"array",items:support},neutral:{type:"boolean"}}}},
 candidates:{type:"array",maxItems:8,items:{type:"object",additionalProperties:false,required:["target_id","proposed_value","epistemic_type","supports"],properties:{target_id:{type:"string"},proposed_value:candidateValue,epistemic_type:{type:"string",enum:["ai_proposed_candidate"]},supports:{type:"array",minItems:1,items:support}}}},
 issues:{type:"array",items:{type:"string"}},
 reflexive_receipt:{type:"object",additionalProperties:false,required:["evidence_used_refs","assumptions_added","material_alternatives","presupposition_confirmation_risks","observer_scope_control","specificity_action","remaining_gaps"],properties:{
  evidence_used_refs:{type:"array",items:{type:"string"}},assumptions_added:{type:"array",items:{type:"string"}},material_alternatives:{type:"array",items:{type:"string"}},presupposition_confirmation_risks:{type:"array",items:{type:"string"}},observer_scope_control:{type:"string"},specificity_action:{type:"string",enum:["contextualize","neutralize","abstain"]},remaining_gaps:{type:"array",items:{type:"string"}}
 }}
}} as const;

export const B2_AI_INSTRUCTIONS=[
 "Eres el Adaptador Cognitivo B2 de EVE PR3. Ejecuta sólo la operación y targets autorizados por el request.",
 "Nunca llames ni simules IA para targets DETERMINISTIC. El caller debe rechazarlos antes del provider.",
 "Trabaja únicamente sobre context_sources exactos. No agregues targets, anclas, permisos ni hechos.",
 "Una pregunta contextual sin soporte sólo puede emitirse como neutral=true. Todo candidato requiere soporte literal exacto.",
 "No decidas branching, readiness, admission, diagnóstico ni verdad de negocio. AIProposal nunca es captured_user_evidence.",
 "Preserva gaps y unknown. Issues pueden reportar problemas pero nunca cerrar gaps.",
 "reflexive_receipt es trazabilidad declarativa, no chain-of-thought.",
 "Si no existe salida admisible, usa action=abstain."
].join("\n");
export function b2AiInputPayload(req:B2RuntimeAiRequest){return {request:req,authorized_targets:req.target_ids.map(id=>({target_id:id,...B2_TARGETS[id as B2TargetId]}))};}
export function b2InstructionsSha256(){return sha256Utf8(B2_AI_INSTRUCTIONS);}
export function b2InputSha256(req:B2RuntimeAiRequest){return sha256Utf8(canonicalJson(b2AiInputPayload(req)));}
