import "server-only";
import { canonicalJson } from "../canonical";

export const P3_EVALUATOR_PROVIDER_REF="vercel.ai_gateway.openresponses.v1" as const;
export const P3_EVALUATOR_MODEL_ID="openai/gpt-6-sol" as const;
export const P3_EVALUATOR_TECHNICAL_BINDING_REVISION="1.1-GPT6" as const;
export const P3_EVALUATOR_PROMPT_PROFILE_REF="EVE-PR3-P3-SEMANTIC-EVALUATOR-CANDIDATE" as const;
export const P3_EVALUATOR_PROMPT_PROFILE_REVISION="1.0" as const;
export const P3_EVALUATOR_RESPONSE_SCHEMA_REF="EVE-PR3-P3-EVALUATOR-RESULT-SCHEMA@1.0" as const;

export type P3CriterionId="intent_fidelity"|"observer_fidelity"|"reflexive_integrity"|"narrative_canonical_fidelity";
export type P3EvaluatorResult={
  case_id:string;
  object_key:"B0"|"B2"|"REFERENCE_BANK";
  results:readonly {criterion_id:P3CriterionId;outcome:"PASS"|"FAIL"|"UNKNOWN"|"NOT_APPLICABLE";reason:string;evidence_refs:readonly string[]}[];
  aggregate_result:"PASS"|"FAIL"|"HOLD";
  material_findings:readonly string[];
  authority_claimed:false;
};

export const P3_EVALUATOR_SCHEMA={
 type:"object",additionalProperties:false,
 required:["case_id","object_key","results","aggregate_result","material_findings","authority_claimed"],
 properties:{
  case_id:{type:"string"},
  object_key:{type:"string",enum:["B0","B2","REFERENCE_BANK"]},
  results:{type:"array",items:{type:"object",additionalProperties:false,required:["criterion_id","outcome","reason","evidence_refs"],properties:{
   criterion_id:{type:"string",enum:["intent_fidelity","observer_fidelity","reflexive_integrity","narrative_canonical_fidelity"]},
   outcome:{type:"string",enum:["PASS","FAIL","UNKNOWN","NOT_APPLICABLE"]},
   reason:{type:"string"},
   evidence_refs:{type:"array",items:{type:"string"}}
  }}},
  aggregate_result:{type:"string",enum:["PASS","FAIL","HOLD"]},
  material_findings:{type:"array",items:{type:"string"}},
  authority_claimed:{type:"boolean",enum:[false]}
 }
} as const;

export const P3_EVALUATOR_INSTRUCTIONS=[
 "Actúas como evaluador CANDIDATE de EVE PR3. No tienes autoridad de admisión ni puedes promoverte a EvaluatorAuthority.",
 "Evalúa sólo el material entregado y los criterios declarados. No uses conocimiento externo para completar hechos del negocio.",
 "intent_fidelity: verifica que la propuesta busque la intención canónica sin cambiar el significado, target, pregunta u objetivo.",
 "observer_fidelity: verifica que no atribuya conocimiento fuera de la posición del informante y que preserve unknown/no sé.",
 "reflexive_integrity: verifica soporte, supuestos añadidos, alternativas materiales, riesgo de inducción y que un candidato IA no sea premisa/evidencia.",
 "narrative_canonical_fidelity: verifica contexto/revisión/target y que lenguaje cotidiano fiel no sea penalizado por diferir del canon.",
 "FAIL si existe una violación material demostrable. UNKNOWN/HOLD si el material es insuficiente para decidir sin inventar.",
 "No evalúes personalidad, viabilidad VSM ni causalidad humana. No infieras business truth.",
 "Devuelve únicamente el objeto estructurado. reason es una justificación breve y auditable, no chain-of-thought.",
 "authority_claimed debe ser false."
].join("\n");

export type P3EvaluatorInput={
 case_id:string;
 object_key:"B0"|"B2"|"REFERENCE_BANK";
 criterion_scope:readonly P3CriterionId[];
 source_context:unknown;
 governed_intent:unknown;
 proposal_or_fixture:unknown;
};

function outputText(payload:Record<string,unknown>):string{
 const output=Array.isArray(payload.output)?payload.output:[];
 for(const item of output as Array<Record<string,unknown>>){
  const content=Array.isArray(item.content)?item.content:[];
  for(const part of content as Array<Record<string,unknown>>){
   if(part.type==="refusal") throw new Error("P3_EVALUATOR_REFUSAL");
   if(part.type==="output_text"&&typeof part.text==="string") return part.text;
  }
 }
 throw new Error("P3_EVALUATOR_OUTPUT_TEXT_MISSING");
}

export async function runP3EvaluatorCandidate(input:P3EvaluatorInput):Promise<{provider_request_id:string|null;model_version:string;usage:unknown;result:P3EvaluatorResult}>{
 const apiKey=(process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN)?.trim();
 if(!apiKey) throw new Error("AI_GATEWAY_AUTH_NOT_CONFIGURED");
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30_000);
 try{
  const response=await fetch("https://ai-gateway.vercel.sh/v1/responses",{
   method:"POST",
   headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
   signal:controller.signal,
   body:JSON.stringify({
    providerOptions:{gateway:{disallowPromptTraining:true}},
    model:P3_EVALUATOR_MODEL_ID,
    store:false,
    reasoning:{effort:"medium"},
    instructions:P3_EVALUATOR_INSTRUCTIONS,
    input:canonicalJson(input),
    text:{format:{type:"json_schema",name:"eve_pr3_p3_evaluator_candidate",strict:true,schema:P3_EVALUATOR_SCHEMA}},
    max_output_tokens:2200
   })
  });
  const payload=await response.json().catch(()=>({})) as Record<string,unknown>;
  if(!response.ok) throw new Error(`P3_EVALUATOR_HTTP_${response.status}`);
  if(payload.status!=="completed") throw new Error(`P3_EVALUATOR_STATUS_${String(payload.status??"UNKNOWN").toUpperCase()}`);
  const result=JSON.parse(outputText(payload)) as P3EvaluatorResult;
  if(result.case_id!==input.case_id||result.object_key!==input.object_key||result.authority_claimed!==false) throw new Error("P3_EVALUATOR_BINDING_INVALID");
  const expected=new Set(input.criterion_scope);
  const observed=new Set(result.results.map((row)=>row.criterion_id));
  for(const row of result.results) if(!expected.has(row.criterion_id)) throw new Error(`P3_EVALUATOR_CRITERION_OUT_OF_SCOPE:${row.criterion_id}`);
  for(const criterion of expected) if(!observed.has(criterion)) throw new Error(`P3_EVALUATOR_CRITERION_MISSING:${criterion}`);
  if(observed.size!==expected.size||result.results.length!==expected.size) throw new Error("P3_EVALUATOR_CRITERION_DUPLICATE_OR_EXTRA");
  return {provider_request_id:typeof payload.id==="string"?payload.id:null,model_version:typeof payload.model==="string"?payload.model:P3_EVALUATOR_MODEL_ID,usage:payload.usage??null,result};
 }catch(error){
  if(error instanceof Error&&error.name==="AbortError") throw new Error("P3_EVALUATOR_TIMEOUT");
  throw error;
 }finally{clearTimeout(timeout);}
}
