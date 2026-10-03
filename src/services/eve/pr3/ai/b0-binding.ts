import "server-only";
import { canonicalJson, sha256Utf8 } from "../canonical";

export const B0_PROFILE_ID = "EVE-B0-PR1-OPERATIONAL-PROFILE" as const;
export const B0_PROFILE_REVISION = "0.1-R4" as const;
export const B0_PROFILE_SHA256 = "17df2c5b5ae151d692126b0b3fcc0301a9ef89dbf5ffc5683c2e32a0c968b30c" as const;
export const B0_AI_PROVIDER_REF = "vercel.ai_gateway.openresponses.v1" as const;
export const B0_AI_MODEL_ID = "openai/gpt-5.4-mini" as const;
export const B0_PROMPT_PROFILE_REF = "EVE-PR3-B0-RENDER-PROMPT" as const;
export const B0_PROMPT_PROFILE_REVISION = "1.0" as const;
export const B0_RESPONSE_SCHEMA_REF = "EVE-PR3-B0-AI-PROPOSAL-SCHEMA@1.0" as const;

const FORBIDDEN = [
  "change_question_code","change_canonical_options","change_canonical_variable","decide_branch","publish_readiness",
  "declare_ai_candidate_as_user_evidence","invent_missing_facts","diagnose_vsm","diagnose_ahe","create_mmabp_fact",
] as const;

export const B0_AI_TARGETS = {
  "0.1": { ai_mode:"AI_DEFAULT_CONTEXTUAL_RENDER", question:"Esto es lo que entendimos de esta actividad. ¿Está correcto?", variable:"activity_name_user_confirmed" },
  "0.1a": { ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER", question:"Corrige la frase para que diga claramente qué haces, sobre qué trabajas y qué queda listo.", variable:"activity_name_user_confirmed" },
  "0.3": { ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER", question:"¿Con qué frecuencia haces esta actividad?", variable:"activity_frequency_base / scene_frequency_base" },
  "0.3a": { ai_mode:"AI_CONDITIONAL_CLARIFICATION", question:"Si cambia la frecuencia, ¿qué la hace más probable?", variable:"activity_frequency_pattern_hint" },
  "0.4": { ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER", question:"¿En qué situación suele aparecer esta actividad?", variable:"activity_typical_context / scene_typical_context" },
  "0.5_actor_scope": { ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER", question:"¿Quién la hace normalmente o sobre quién recae directamente?", variable:"activity_primary_actor_scope / scene_primary_actor_scope" },
  "0.6": { ai_mode:"AI_DEFAULT_CONTEXTUAL_RENDER", question:"¿Qué recibes, ves o necesitas para empezar esta actividad?", variable:"activity_start_condition_hint / scene_boundary_start_hint" },
  "0.8": { ai_mode:"AI_OPTIONAL_CONTEXTUAL_RENDER", question:"¿La haces casi siempre igual o cambia según el caso?", variable:"activity_variation_mode / scene_variation_mode" },
  "0.8a": { ai_mode:"AI_CONDITIONAL_CLARIFICATION", question:"¿Cuál es el cambio o caso especial más común?", variable:"activity_exception_signature / scene_exception_signature" },
  "0.A": { ai_mode:"AI_CONDITIONAL_CLARIFICATION", question:"El nombre suena amplio. ¿Qué distingue esta actividad de otras parecidas?", variable:"activity_name_disambiguation" },
  "0.B": { ai_mode:"AI_CONDITIONAL_CLARIFICATION", question:"Parece que el inicio y el cierre se mezclan. Completa: empieza cuando ___ y termina cuando ___.", variable:"activity_boundary_clarification" },
  "0.C": { ai_mode:"AI_CONDITIONAL_CLARIFICATION", question:"Esta descripción parece muy grande o muy pequeña. ¿Qué parte concreta conviene revisar de inicio a fin?", variable:"activity_scale_adjustment" },
  "0.D": { ai_mode:"AI_CONDITIONAL_CLARIFICATION", question:"La estructura parece incompleta. ¿Qué falta: sobre qué trabajas, con qué criterio o qué queda listo?", variable:"activity_semantic_completion / semantic_gap_unresolved" },
} as const;
export type B0AiTargetId = keyof typeof B0_AI_TARGETS;

export type B0ContextSource = { evidence_id: string; literal: string };
export type B0IntentEnvelope = { ref: string; canonical_intent: string; risk_if_wrong: string; forbidden_projection: readonly string[] };
export type B0RuntimeAiRequest = {
  request_id:string; run_id?:string; interaction_instance_id?:string; profile_ref:string; operation:string;
  observation_context_revision:string; target_ids:readonly string[]; systemic_intent_envelopes:readonly B0IntentEnvelope[];
  role_observation_envelope:{ref:string;activity_id?:string;entry_mode?:string;narrative_revision?:string;knowledge_limits?:string;source_refs?:readonly string[]};
  context_sources:readonly B0ContextSource[];
  operation_limits:{may_change_canon:boolean;may_decide_branch:boolean;may_create_evidence:boolean;may_diagnose:boolean};
  fallback_policy:string; human_review_policy:string;
};
export type B0ProductionAiRequest = { object_run_id:string; interaction_key:string; server_command_event_id:string; requested_at:string; b0_request:B0RuntimeAiRequest };
export type B0SupportRef = { evidence_id:string; start:number|null; end:number|null };
export type B0AiProposal = {
  context_revision:string; action:"propose"|"abstain";
  questions:readonly {target_id:string;text:string;supports:readonly B0SupportRef[];neutral:boolean}[];
  candidates:readonly {target_id:string;proposed_value:string|null;epistemic_type:"ai_proposed_candidate";supports:readonly B0SupportRef[]}[];
  issues:readonly string[];
  reflexive_receipt:{evidence_used_refs:readonly string[];assumptions_added:readonly string[];material_alternatives:readonly string[];intent_alignment:string;observer_scope_check:string;presupposition_confirmation_risks:readonly string[];specificity_action:string;remaining_gaps:readonly string[]};
};

export function assertB0ProductionAiRequest(input:B0ProductionAiRequest):void{
  const req=input.b0_request;
  if(!input.object_run_id||!input.interaction_key||!input.server_command_event_id||!input.requested_at) throw new Error("a08_identity_binding_missing");
  if(req.profile_ref!==B0_PROFILE_ID||req.operation!=="render") throw new Error("a08_b0_profile_or_operation_mismatch");
  if(!req.observation_context_revision) throw new Error("a08_context_revision_required");
  if(!req.target_ids.length||new Set(req.target_ids).size!==req.target_ids.length) throw new Error("a08_target_set_invalid");
  for(const target of req.target_ids){
    if(!(target in B0_AI_TARGETS)) throw new Error(`a08_target_not_authorized:${target}`);
    const intent=req.systemic_intent_envelopes.find(x=>x.ref===`B0-SIE::${target}`);
    if(!intent) throw new Error(`a08_intent_envelope_missing:${target}`);
    for(const forbidden of FORBIDDEN) if(!intent.forbidden_projection.includes(forbidden)) throw new Error(`a08_forbidden_projection_missing:${target}:${forbidden}`);
  }
  if(req.role_observation_envelope.ref!=="B0-ROE-v0.1") throw new Error("a08_role_observation_policy_mismatch");
  if(req.fallback_policy!=="SAFE_CANONICAL_FALLBACK_OR_HOLD"||req.human_review_policy!=="HUMAN_GATE_MVP") throw new Error("a08_fallback_or_human_gate_mismatch");
  if(req.operation_limits.may_change_canon||req.operation_limits.may_decide_branch||req.operation_limits.may_create_evidence||req.operation_limits.may_diagnose) throw new Error("a08_operation_authority_exceeded");
  if(req.context_sources.some(s=>!s.evidence_id||typeof s.literal!=="string")) throw new Error("a08_context_sources_invalid");
}

export function assertB0AiProposal(req:B0RuntimeAiRequest,p:B0AiProposal):void{
  if(!p||!["propose","abstain"].includes(p.action)) throw new Error("a08_ai_schema_invalid");
  if(p.context_revision!==req.observation_context_revision) throw new Error("a08_ai_proposal_stale_at_creation");
  const allowed=new Set(req.target_ids), evidence=new Set(req.context_sources.map(s=>s.evidence_id));
  const supports=(refs:readonly B0SupportRef[])=>{for(const ref of refs) if(!evidence.has(ref.evidence_id)) throw new Error(`a08_support_not_authorized:${ref.evidence_id}`);};
  for(const q of p.questions){if(!allowed.has(q.target_id)||!q.text.trim()) throw new Error("a08_ai_question_target_invalid");supports(q.supports);}
  for(const c of p.candidates){if(!allowed.has(c.target_id)||c.epistemic_type!=="ai_proposed_candidate") throw new Error("a08_ai_candidate_authority_invalid");supports(c.supports);}
  const r=p.reflexive_receipt;
  if(!r||![r.evidence_used_refs,r.assumptions_added,r.material_alternatives,r.presupposition_confirmation_risks,r.remaining_gaps].every(Array.isArray)||!r.intent_alignment||!r.observer_scope_check||!r.specificity_action) throw new Error("a08_reflexive_receipt_missing");
  for(const ref of r.evidence_used_refs) if(!evidence.has(ref)) throw new Error(`a08_reflexive_evidence_not_authorized:${ref}`);
}

const supportSchema={type:"object",additionalProperties:false,required:["evidence_id","start","end"],properties:{evidence_id:{type:"string"},start:{type:["integer","null"]},end:{type:["integer","null"]}}} as const;
export const B0_AI_RESPONSE_SCHEMA={type:"object",additionalProperties:false,required:["context_revision","action","questions","candidates","issues","reflexive_receipt"],properties:{
 context_revision:{type:"string"},action:{type:"string",enum:["propose","abstain"]},
 questions:{type:"array",items:{type:"object",additionalProperties:false,required:["target_id","text","supports","neutral"],properties:{target_id:{type:"string"},text:{type:"string"},supports:{type:"array",items:supportSchema},neutral:{type:"boolean"}}}},
 candidates:{type:"array",items:{type:"object",additionalProperties:false,required:["target_id","proposed_value","epistemic_type","supports"],properties:{target_id:{type:"string"},proposed_value:{type:["string","null"]},epistemic_type:{type:"string",enum:["ai_proposed_candidate"]},supports:{type:"array",items:supportSchema}}}},
 issues:{type:"array",items:{type:"string"}},
 reflexive_receipt:{type:"object",additionalProperties:false,required:["evidence_used_refs","assumptions_added","material_alternatives","intent_alignment","observer_scope_check","presupposition_confirmation_risks","specificity_action","remaining_gaps"],properties:{
  evidence_used_refs:{type:"array",items:{type:"string"}},assumptions_added:{type:"array",items:{type:"string"}},material_alternatives:{type:"array",items:{type:"string"}},intent_alignment:{type:"string"},observer_scope_check:{type:"string"},presupposition_confirmation_risks:{type:"array",items:{type:"string"}},specificity_action:{type:"string"},remaining_gaps:{type:"array",items:{type:"string"}}
 }}
}} as const;

export const B0_AI_INSTRUCTIONS=[
 "Eres el Adaptador Cognitivo de B0 de EVE PR3. Tu única operación autorizada en este binding es render.",
 "Trabaja sólo con context_sources e intent envelopes suministrados. No uses memoria privada del modelo como fuente.",
 "Puedes contextualizar redacción visible y proponer candidatos ai_proposed_candidate, pero nunca crear evidencia del usuario.",
 "No cambies códigos, opciones o variables canónicas; no decidas branching, readiness, handoff ni verdad de negocio.",
 "No inventes hechos. Preserva unknown/unconfirmed. Si el soporte es insuficiente o presupone hechos, abstente.",
 "No diagnostiques VSM ni AHE y no crees hechos MMABP.",
 "Todo soporte debe usar evidence_id autorizado.",
 "Devuelve sólo el objeto estructurado. No incluyas razonamiento privado; reflexive_receipt es trazabilidad declarativa."
].join("\n");

export function b0AiInputPayload(req:B0RuntimeAiRequest){return {request:req,authorized_target_contracts:req.target_ids.map(target=>{const spec=B0_AI_TARGETS[target as B0AiTargetId];return {target_id:target,canonical_question_text:spec.question,canonical_variable_output:spec.variable,ai_mode:spec.ai_mode,systemic_intent_envelope_ref:`B0-SIE::${target}`,narrative_canonical_binding_ref:`B0-NCB::${target}`};})};}
export function b0InstructionsSha256(){return sha256Utf8(B0_AI_INSTRUCTIONS);}
export function b0InputSha256(req:B0RuntimeAiRequest){return sha256Utf8(canonicalJson(b0AiInputPayload(req)));}
