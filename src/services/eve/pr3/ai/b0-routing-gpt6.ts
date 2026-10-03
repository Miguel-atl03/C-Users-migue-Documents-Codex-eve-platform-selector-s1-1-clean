import "server-only";
import { canonicalJson,sha256Utf8 } from "../canonical";

export const B0_ROUTING_PROVIDER_REF="vercel.ai_gateway.openresponses.v1" as const;
export const B0_ROUTING_GPT6_MODEL_ID="openai/gpt-6-luna" as const;
export const B0_ROUTING_GPT6_TECHNICAL_BINDING_REVISION="1.1-GPT6" as const;
export const B0_ROUTING_PROMPT_PROFILE_REF="EVE-PR3-B0-INTERNAL-ROUTING-PROMPT" as const;
export const B0_ROUTING_PROMPT_PROFILE_REVISION="1.0" as const;

export type B0AuthorizedEvidence=Record<string,unknown>;
export type B0GenericityStatus="SPECIFIC_ACTIVITY"|"GENERIC_ACTIVITY"|"GENERICITY_UNKNOWN";
export type B0ScaleStatus="TRAVERSABLE_ACTIVITY"|"MACROPROCESS_TOO_BROAD"|"MICROACTION_TOO_NARROW"|"SCALE_UNKNOWN";

type B0RoutingBase={
 request_id:string;
 run_id:string;
 observation_context_revision:string;
 context_revision:string;
 authorized_evidence:B0AuthorizedEvidence;
 decision_contract:unknown;
 output_schema:unknown;
 authority:"ai_semantic_routing_control_not_business_evidence"|string;
};
export type B0GenericityRequest=B0RoutingBase&{operation:"classify_genericity"};
export type B0ScaleRequest=B0RoutingBase&{operation:"classify_scale";target_id:"C6_scale_assessment";anchor_fingerprint:string};
export type B0RoutingRequest=B0GenericityRequest|B0ScaleRequest;

export type B0GenericityResult={genericity_status:B0GenericityStatus;evidence_refs:readonly string[];brief_reason:string};
export type B0ScaleResult={
 action:"propose"|"abstain";
 scale_status:B0ScaleStatus;
 evidence_refs:readonly string[];
 brief_reason:string;
 request_id:string;
 context_revision:string;
 anchor_fingerprint:string;
 target_id:"C6_scale_assessment";
};
export type B0RoutingProviderResult={
 provider_ref:typeof B0_ROUTING_PROVIDER_REF;
 provider_request_id:string|null;
 model_id:typeof B0_ROUTING_GPT6_MODEL_ID;
 model_version:string;
 usage:unknown;
 operation:"classify_genericity"|"classify_scale";
 result:B0GenericityResult|B0ScaleResult;
 effective_status:B0GenericityStatus|B0ScaleStatus;
};

export class B0RoutingProviderError extends Error{constructor(public code:string,message=code,public retryable=false){super(message);}}

const genericitySchema={
 type:"object",additionalProperties:false,required:["genericity_status","evidence_refs","brief_reason"],
 properties:{
  genericity_status:{type:"string",enum:["SPECIFIC_ACTIVITY","GENERIC_ACTIVITY","GENERICITY_UNKNOWN"]},
  evidence_refs:{type:"array",items:{type:"string"}},
  brief_reason:{type:"string"}
 }
} as const;

const scaleSchema={
 type:"object",additionalProperties:false,
 required:["action","scale_status","evidence_refs","brief_reason","request_id","context_revision","anchor_fingerprint","target_id"],
 properties:{
  action:{type:"string",enum:["propose","abstain"]},
  scale_status:{type:"string",enum:["TRAVERSABLE_ACTIVITY","MACROPROCESS_TOO_BROAD","MICROACTION_TOO_NARROW","SCALE_UNKNOWN"]},
  evidence_refs:{type:"array",items:{type:"string"}},
  brief_reason:{type:"string"},
  request_id:{type:"string"},
  context_revision:{type:"string"},
  anchor_fingerprint:{type:"string"},
  target_id:{type:"string",enum:["C6_scale_assessment"]}
 }
} as const;

export const B0_ROUTING_INSTRUCTIONS=[
 "Eres el Cognitive Adapter interno de B0 para control de routing. Tu salida nunca es evidencia de negocio ni confirmación del usuario.",
 "Usa únicamente authorized_evidence y el decision_contract entregado. No agregues hechos, roles, receptores, triggers, procesos o fronteras no presentes.",
 "classify_genericity: decide sólo si la etiqueta confirmada/corregida sigue siendo demasiado genérica. Ante ambigüedad material usa GENERICITY_UNKNOWN.",
 "classify_scale: STRUCTURAL_COMPLETENESS no equivale a OPERATIONAL_SCALE. No declares TRAVERSABLE_ACTIVITY sólo por gramática completa, objeto, acción o endpoint.",
 "classify_scale: usa SCALE_UNKNOWN si macro vs traversable o micro vs traversable sigue materialmente ambiguo. Prefiere SCALE_UNKNOWN a un falso positivo TRAVERSABLE_ACTIVITY.",
 "classify_scale: TRAVERSABLE_ACTIVITY requiere soporte no vacío de authorized_evidence. action=abstain siempre implica SCALE_UNKNOWN efectivo.",
 "No crees captured_user_evidence, no diagnostiques VSM/AHE y no conviertas esta evaluación interna en hecho MMABP.",
 "Devuelve exclusivamente el objeto estructurado. brief_reason es una razón corta y auditable, no chain-of-thought."
].join("\n");

function authorizedValue(value:unknown):boolean{
 if(value===null||value===undefined||value==="") return false;
 if(Array.isArray(value)) return value.length>0;
 if(typeof value==="object") return Object.keys(value as Record<string,unknown>).length>0;
 return true;
}
function validateRefs(refs:readonly string[],evidence:B0AuthorizedEvidence){
 for(const ref of refs){
  if(typeof ref!=="string"||!ref.trim()||!(ref in evidence)||!authorizedValue(evidence[ref])) throw new B0RoutingProviderError(`B0_ROUTING_EVIDENCE_REF_INVALID:${ref}`);
 }
}
export function validateB0RoutingRequest(request:B0RoutingRequest):void{
 if(!request.request_id||!request.run_id||!request.context_revision||!request.observation_context_revision) throw new B0RoutingProviderError("B0_ROUTING_REQUEST_BINDING_MISSING");
 if(request.context_revision!==request.observation_context_revision) throw new B0RoutingProviderError("B0_ROUTING_REQUEST_CONTEXT_MISMATCH");
 if(!request.authorized_evidence||typeof request.authorized_evidence!=="object") throw new B0RoutingProviderError("B0_ROUTING_AUTHORIZED_EVIDENCE_MISSING");
 if(request.authority!=="ai_semantic_routing_control_not_business_evidence") throw new B0RoutingProviderError("B0_ROUTING_AUTHORITY_MISMATCH");
 if(request.operation==="classify_scale"&&(!request.anchor_fingerprint||request.target_id!=="C6_scale_assessment")) throw new B0RoutingProviderError("B0_SCALE_REQUEST_BINDING_MISSING");
}
export function validateB0RoutingResult(request:B0RoutingRequest,result:B0GenericityResult|B0ScaleResult):B0GenericityStatus|B0ScaleStatus{
 if(request.operation==="classify_genericity"){
  const r=result as B0GenericityResult;
  if(!["SPECIFIC_ACTIVITY","GENERIC_ACTIVITY","GENERICITY_UNKNOWN"].includes(r.genericity_status)||!Array.isArray(r.evidence_refs)||typeof r.brief_reason!=="string"||!r.brief_reason.trim()) throw new B0RoutingProviderError("B0_GENERICITY_RESULT_INVALID");
  validateRefs(r.evidence_refs,request.authorized_evidence);
  return r.genericity_status;
 }
 const r=result as B0ScaleResult;
 if(!["propose","abstain"].includes(r.action)||!["TRAVERSABLE_ACTIVITY","MACROPROCESS_TOO_BROAD","MICROACTION_TOO_NARROW","SCALE_UNKNOWN"].includes(r.scale_status)||!Array.isArray(r.evidence_refs)||typeof r.brief_reason!=="string"||!r.brief_reason.trim()) throw new B0RoutingProviderError("B0_SCALE_RESULT_INVALID");
 if(r.request_id!==request.request_id||r.context_revision!==request.context_revision||r.anchor_fingerprint!==request.anchor_fingerprint||r.target_id!==request.target_id) throw new B0RoutingProviderError("B0_SCALE_RESPONSE_BINDING_MISMATCH");
 validateRefs(r.evidence_refs,request.authorized_evidence);
 if(r.action==="abstain") return "SCALE_UNKNOWN";
 if(r.scale_status==="TRAVERSABLE_ACTIVITY"&&r.evidence_refs.length===0) throw new B0RoutingProviderError("B0_SCALE_POSITIVE_WITHOUT_SUPPORT");
 return r.scale_status;
}

function outputText(payload:Record<string,unknown>):string{
 const output=Array.isArray(payload.output)?payload.output:[];
 for(const item of output as Array<Record<string,unknown>>){
  const parts=Array.isArray(item.content)?item.content:[];
  for(const part of parts as Array<Record<string,unknown>>){
   if(part.type==="refusal") throw new B0RoutingProviderError("OPENAI_REFUSAL",String(part.refusal??"model refusal"));
   if(part.type==="output_text"&&typeof part.text==="string") return part.text;
  }
 }
 throw new B0RoutingProviderError("OPENAI_OUTPUT_TEXT_MISSING");
}

async function once(apiKey:string,request:B0RoutingRequest):Promise<B0RoutingProviderResult>{
 validateB0RoutingRequest(request);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20_000);
 try{
  const schema=request.operation==="classify_scale"?scaleSchema:genericitySchema;
  const response=await fetch("https://ai-gateway.vercel.sh/v1/responses",{
   method:"POST",
   headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
   signal:controller.signal,
   body:JSON.stringify({
    providerOptions:{gateway:{disallowPromptTraining:true}},
    model:B0_ROUTING_GPT6_MODEL_ID,
    store:false,
    reasoning:{effort:"none"},
    instructions:B0_ROUTING_INSTRUCTIONS,
    input:canonicalJson(request),
    text:{format:{type:"json_schema",name:request.operation==="classify_scale"?"eve_pr3_b0_scale_routing":"eve_pr3_b0_genericity_routing",strict:true,schema}},
    max_output_tokens:900
   })
  });
  const payload=await response.json().catch(()=>({})) as Record<string,unknown>;
  if(!response.ok){const retryable=response.status===408||response.status===409||response.status===429||response.status>=500;throw new B0RoutingProviderError(`OPENAI_HTTP_${response.status}`,"Vercel AI Gateway Responses request failed",retryable);}
  if(payload.status!=="completed") throw new B0RoutingProviderError(`OPENAI_STATUS_${String(payload.status??"UNKNOWN").toUpperCase()}`);
  let result:B0GenericityResult|B0ScaleResult;
  try{result=JSON.parse(outputText(payload)) as B0GenericityResult|B0ScaleResult;}catch(error){if(error instanceof B0RoutingProviderError) throw error;throw new B0RoutingProviderError("OPENAI_STRUCTURED_OUTPUT_PARSE_FAILED");}
  const effectiveStatus=validateB0RoutingResult(request,result);
  return {provider_ref:B0_ROUTING_PROVIDER_REF,provider_request_id:typeof payload.id==="string"?payload.id:null,model_id:B0_ROUTING_GPT6_MODEL_ID,model_version:typeof payload.model==="string"?payload.model:B0_ROUTING_GPT6_MODEL_ID,usage:payload.usage??null,operation:request.operation,result,effective_status:effectiveStatus};
 }catch(error){
  if(error instanceof B0RoutingProviderError) throw error;
  if(error instanceof Error&&error.name==="AbortError") throw new B0RoutingProviderError("OPENAI_TIMEOUT","OpenAI Responses timeout",true);
  throw new B0RoutingProviderError("OPENAI_TRANSPORT_ERROR","OpenAI Responses transport error",true);
 }finally{clearTimeout(timeout);}
}

export async function runB0RoutingOperation(request:B0RoutingRequest):Promise<B0RoutingProviderResult>{
 const apiKey=(process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN)?.trim();
 if(!apiKey) throw new B0RoutingProviderError("AI_GATEWAY_AUTH_NOT_CONFIGURED");
 try{return await once(apiKey,request);}catch(error){if(!(error instanceof B0RoutingProviderError)||!error.retryable) throw error;return once(apiKey,request);}
}
export function b0RoutingInstructionsSha256(){return sha256Utf8(B0_ROUTING_INSTRUCTIONS);}
