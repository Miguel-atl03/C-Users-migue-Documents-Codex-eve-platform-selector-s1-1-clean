import "server-only";
import { canonicalJson } from "../canonical";
import { B0_AI_INSTRUCTIONS,B0_AI_MODEL_ID,B0_AI_PROVIDER_REF,B0_AI_RESPONSE_SCHEMA,type B0AiProposal,type B0RuntimeAiRequest,b0AiInputPayload } from "./b0-binding";

export type B0ProviderResult={provider_ref:typeof B0_AI_PROVIDER_REF;provider_request_id:string|null;model_id:typeof B0_AI_MODEL_ID;model_version:string;usage:unknown;proposal:B0AiProposal};
export interface B0AiProvider{propose(request:B0RuntimeAiRequest):Promise<B0ProviderResult>;}
export class B0ProviderError extends Error{constructor(public code:string,message=code,public retryable=false){super(message);}}

function outputText(payload:Record<string,unknown>):string{
 const output=Array.isArray(payload.output)?payload.output:[];
 for(const item of output as Array<Record<string,unknown>>){
  const content=Array.isArray(item.content)?item.content:[];
  for(const part of content as Array<Record<string,unknown>>){
   if(part.type==="refusal") throw new B0ProviderError("OPENAI_REFUSAL",String(part.refusal??"model refusal"));
   if(part.type==="output_text"&&typeof part.text==="string") return part.text;
  }
 }
 throw new B0ProviderError("OPENAI_OUTPUT_TEXT_MISSING");
}

async function once(apiKey:string,request:B0RuntimeAiRequest):Promise<B0ProviderResult>{
 const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),20_000);
 try{
  const response=await fetch("https://ai-gateway.vercel.sh/v1/responses",{
   method:"POST",
   headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
   signal:controller.signal,
   body:JSON.stringify({
    providerOptions:{gateway:{disallowPromptTraining:true}},
    model:B0_AI_MODEL_ID,
    store:false,
    reasoning:{effort:"none"},
    instructions:B0_AI_INSTRUCTIONS,
    input:canonicalJson(b0AiInputPayload(request)),
    text:{format:{type:"json_schema",name:"eve_pr3_b0_ai_proposal",strict:true,schema:B0_AI_RESPONSE_SCHEMA}},
    max_output_tokens:1400
   })
  });
  const payload=await response.json().catch(()=>({})) as Record<string,unknown>;
  if(!response.ok){const retryable=response.status===408||response.status===409||response.status===429||response.status>=500;throw new B0ProviderError(`OPENAI_HTTP_${response.status}`,"Vercel AI Gateway Responses request failed",retryable);}
  if(payload.status!=="completed") throw new B0ProviderError(`OPENAI_STATUS_${String(payload.status??"UNKNOWN").toUpperCase()}`);
  let proposal:B0AiProposal;
  try{proposal=JSON.parse(outputText(payload)) as B0AiProposal;}catch(error){if(error instanceof B0ProviderError) throw error;throw new B0ProviderError("OPENAI_STRUCTURED_OUTPUT_PARSE_FAILED");}
  return {provider_ref:B0_AI_PROVIDER_REF,provider_request_id:typeof payload.id==="string"?payload.id:null,model_id:B0_AI_MODEL_ID,model_version:typeof payload.model==="string"?payload.model:B0_AI_MODEL_ID,usage:payload.usage??null,proposal};
 }catch(error){
  if(error instanceof B0ProviderError) throw error;
  if(error instanceof Error&&error.name==="AbortError") throw new B0ProviderError("OPENAI_TIMEOUT","OpenAI Responses timeout",true);
  throw new B0ProviderError("OPENAI_TRANSPORT_ERROR","OpenAI Responses transport error",true);
 }finally{clearTimeout(timeout);}
}

export class OpenAiB0ResponsesProvider implements B0AiProvider{
 async propose(request:B0RuntimeAiRequest):Promise<B0ProviderResult>{
  const apiKey=(process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN)?.trim();
  if(!apiKey) throw new B0ProviderError("AI_GATEWAY_AUTH_NOT_CONFIGURED");
  try{return await once(apiKey,request);}catch(error){if(!(error instanceof B0ProviderError)||!error.retryable) throw error;return once(apiKey,request);}
 }
}
