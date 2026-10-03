import "server-only";
import { canonicalJson,deriveIdentity,sha256CanonicalJson,utcTimestamp } from "../canonical";
import { B0_AI_MODEL_ID,B0_AI_PROVIDER_REF,B0_PROFILE_ID,B0_PROFILE_REVISION,B0_PROMPT_PROFILE_REF,B0_PROMPT_PROFILE_REVISION,B0_RESPONSE_SCHEMA_REF,assertB0AiProposal,assertB0ProductionAiRequest,b0InputSha256,b0InstructionsSha256,type B0ProductionAiRequest } from "./b0-binding";
import { B0ProviderError,OpenAiB0ResponsesProvider,type B0AiProvider } from "./openai-responses";
import type { AioRecord, Pr3AiStore } from "./store";

export type B0ProductionAiResult=
 |{status:"waiting_review";ai_operation_id:string;proposal_id:string;proposal:unknown;idempotent_replay:boolean}
 |{status:"safe_fallback";ai_operation_id:string;reason:string;proposal_id?:string;idempotent_replay:boolean}
 |{status:"hold";ai_operation_id:string;reason:string;idempotent_replay:boolean};

function intentRef(input:B0ProductionAiRequest){return input.b0_request.systemic_intent_envelopes.map(x=>x.ref).sort().join("+");}
function operationIdentity(input:B0ProductionAiRequest){return deriveIdentity("aio",["object_run_id","interaction_key","operation","profile_ref","intent_ref","context_revision","context_sources","requested_at"],{
 object_run_id:input.object_run_id,
 interaction_key:input.interaction_key,
 operation:"render",
 profile_ref:B0_PROFILE_ID,
 intent_ref:intentRef(input),
 context_revision:input.b0_request.observation_context_revision,
 context_sources:input.b0_request.context_sources,
 requested_at:input.requested_at
});}
function generatorRef(modelVersion:string=B0_AI_MODEL_ID){return `${B0_AI_PROVIDER_REF}:${B0_AI_MODEL_ID}:${modelVersion}:${B0_PROMPT_PROFILE_REF}@${B0_PROMPT_PROFILE_REVISION}`;}

export class B0ProductionAiAdapter{
 constructor(private store:Pr3AiStore,private provider:B0AiProvider=new OpenAiB0ResponsesProvider()){}
 async execute(input:B0ProductionAiRequest):Promise<B0ProductionAiResult>{
  assertB0ProductionAiRequest(input);
  const identity=operationIdentity(input),req=input.b0_request;

  const existingProposal=await this.store.getProposalForOperation(identity.record_id,req.request_id);
  if(existingProposal){
   if(existingProposal.context_revision!==req.observation_context_revision) return {status:"safe_fallback",ai_operation_id:existingProposal.ai_operation_id,proposal_id:existingProposal.proposal_id,reason:"STALE_EXISTING_PROPOSAL",idempotent_replay:true};
   return existingProposal.action==="abstain"
    ? {status:"safe_fallback",ai_operation_id:existingProposal.ai_operation_id,proposal_id:existingProposal.proposal_id,reason:"AI_ABSTAIN",idempotent_replay:true}
    : {status:"waiting_review",ai_operation_id:existingProposal.ai_operation_id,proposal_id:existingProposal.proposal_id,proposal:existingProposal.payload,idempotent_replay:true};
  }

  const existingOperation=await this.store.getOperation(identity.record_id);
  if(existingOperation){
   if(["failed","fallback","rejected"].includes(existingOperation.status)) return {status:"safe_fallback",ai_operation_id:identity.record_id,reason:existingOperation.failure_code??"AI_OPERATION_PREVIOUSLY_CLOSED",idempotent_replay:true};
   return {status:"hold",ai_operation_id:identity.record_id,reason:"AI_OPERATION_IN_PROGRESS_OR_INTERRUPTED",idempotent_replay:true};
  }

  const base:AioRecord={
   ai_operation_id:identity.record_id,object_run_id:input.object_run_id,interaction_key:input.interaction_key,operation:"render",
   profile_ref:B0_PROFILE_ID,intent_ref:intentRef(input),context_revision:req.observation_context_revision,context_sources:req.context_sources,
   generator_ref:generatorRef(),status:"requested",requested_at:input.requested_at,provider_ref:B0_AI_PROVIDER_REF,model_id:B0_AI_MODEL_ID,model_version:B0_AI_MODEL_ID,
   prompt_profile_ref:B0_PROMPT_PROFILE_REF,prompt_profile_revision:B0_PROMPT_PROFILE_REVISION,response_schema_ref:B0_RESPONSE_SCHEMA_REF,
   instructions_sha256:b0InstructionsSha256(),input_payload_sha256:b0InputSha256(req),provider_request_id:null,usage:null,completed_at:null,failure_code:null
  };

  const claimed=await this.store.insertOperationIfAbsent(base);
  if(!claimed){
   const raced=await this.store.getProposalForOperation(identity.record_id,req.request_id);
   if(raced&&raced.context_revision===req.observation_context_revision) return raced.action==="abstain"
    ? {status:"safe_fallback",ai_operation_id:identity.record_id,proposal_id:raced.proposal_id,reason:"AI_ABSTAIN",idempotent_replay:true}
    : {status:"waiting_review",ai_operation_id:identity.record_id,proposal_id:raced.proposal_id,proposal:raced.payload,idempotent_replay:true};
   return {status:"hold",ai_operation_id:identity.record_id,reason:"AI_OPERATION_IN_PROGRESS_OR_INTERRUPTED",idempotent_replay:true};
  }

  try{
   const result=await this.provider.propose(req);
   assertB0AiProposal(req,result.proposal);
   const completedAt=utcTimestamp(),payloadSha=sha256CanonicalJson(result.proposal);
   const proposalIdentity=deriveIdentity("aip",["ai_operation_id","request_id","action","payload_sha256"],{ai_operation_id:identity.record_id,request_id:req.request_id,action:result.proposal.action,payload_sha256:payloadSha});
   await this.store.insertProposal({
    proposal_id:proposalIdentity.record_id,ai_operation_id:identity.record_id,request_id:req.request_id,interaction_key:input.interaction_key,
    context_revision:req.observation_context_revision,action:result.proposal.action,payload:result.proposal,payload_sha256:payloadSha,
    model_ref:generatorRef(result.model_version),review_state:result.proposal.action==="abstain"?"hold":"pending",created_at:completedAt
   });
   await this.store.finishOperation(identity.record_id,{status:result.proposal.action==="abstain"?"fallback":"completed",provider_request_id:result.provider_request_id,model_version:result.model_version,usage:result.usage,completed_at:completedAt,failure_code:result.proposal.action==="abstain"?"AI_ABSTAIN":null});
   return result.proposal.action==="abstain"
    ? {status:"safe_fallback",ai_operation_id:identity.record_id,proposal_id:proposalIdentity.record_id,reason:"AI_ABSTAIN",idempotent_replay:false}
    : {status:"waiting_review",ai_operation_id:identity.record_id,proposal_id:proposalIdentity.record_id,proposal:result.proposal,idempotent_replay:false};
  }catch(error){
   const code=error instanceof B0ProviderError?error.code:error instanceof Error?error.message:"AI_UNKNOWN_ERROR";
   await this.store.finishOperation(identity.record_id,{status:code.startsWith("a08_")?"rejected":"fallback",completed_at:utcTimestamp(),failure_code:code});
   return {status:"safe_fallback",ai_operation_id:identity.record_id,reason:code,idempotent_replay:false};
  }
 }
}

export function b0AiRequestCanonicalHash(input:B0ProductionAiRequest){
 return sha256CanonicalJson({server_command_event_id:input.server_command_event_id,requested_at:input.requested_at,b0_request:JSON.parse(canonicalJson(input.b0_request))});
}
