import "server-only";
import { deriveIdentity,sha256CanonicalJson,utcTimestamp } from "../canonical";
import { B2_AI_MODEL_ID,B2_AI_PROVIDER_REF,B2_PROFILE_ID,B2_PROFILE_REVISION,B2_PROMPT_PROFILE_REF,B2_PROMPT_PROFILE_REVISION,B2_RESPONSE_SCHEMA_REF,assertB2Proposal,prepareB2AiRequest,b2InputSha256,b2InstructionsSha256,type B2ProductionAiRequest } from "./b2-binding";
import { B2ProviderError,OpenAiB2ResponsesProvider,type B2AiProvider } from "./b2-openai-responses";
import { PostgresPr3AiStore,type AioRecord,type Pr3AiStore } from "./store";

export type B2ProductionAiResult=
 |{status:"waiting_review";ai_operation_id:string;proposal_id:string;proposal:unknown;idempotent_replay:boolean}
 |{status:"safe_fallback";ai_operation_id?:string;reason:string;proposal_id?:string;idempotent_replay:boolean}
 |{status:"hold";ai_operation_id:string;reason:string;idempotent_replay:boolean};

function operationIdentity(input:B2ProductionAiRequest){
 const req=input.b2_request;
 return deriveIdentity("aio",["object_run_id","interaction_key","operation","profile_ref","intent_ref","context_revision","context_sources","requested_at"],{
  object_run_id:input.object_run_id,interaction_key:input.interaction_key,operation:req.operation,profile_ref:`${B2_PROFILE_ID}@${B2_PROFILE_REVISION}`,
  intent_ref:req.normative_context_ref,context_revision:req.context_revision,context_sources:req.context_sources,requested_at:input.requested_at
 });
}
function generatorRef(modelVersion:string=B2_AI_MODEL_ID){return `${B2_AI_PROVIDER_REF}:${B2_AI_MODEL_ID}:${modelVersion}:${B2_PROMPT_PROFILE_REF}@${B2_PROMPT_PROFILE_REVISION}`;}

export class B2ProductionAiAdapter{
 constructor(private store:Pr3AiStore=new PostgresPr3AiStore(),private provider:B2AiProvider=new OpenAiB2ResponsesProvider()){}
 async execute(input:B2ProductionAiRequest):Promise<B2ProductionAiResult>{
  const prepared=prepareB2AiRequest(input);
  if(!prepared.provider_request){
   return {status:"safe_fallback",reason:`DETERMINISTIC_ONLY_NO_MODEL_CALL:${prepared.deterministic_target_ids.join(",")}`,idempotent_replay:false};
  }
  const req=prepared.provider_request;
  const aiInput:{object_run_id:string;interaction_key:string;server_command_event_id:string;requested_at:string;b2_request:typeof req}={...input,b2_request:req};
  const identity=operationIdentity(aiInput);

  const existingProposal=await this.store.getProposalForOperation(identity.record_id,req.request_id);
  if(existingProposal){
   if(existingProposal.context_revision!==req.context_revision) return {status:"safe_fallback",ai_operation_id:existingProposal.ai_operation_id,proposal_id:existingProposal.proposal_id,reason:"STALE_EXISTING_PROPOSAL",idempotent_replay:true};
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
   ai_operation_id:identity.record_id,object_run_id:input.object_run_id,interaction_key:input.interaction_key,operation:req.operation,
   profile_ref:`${B2_PROFILE_ID}@${B2_PROFILE_REVISION}`,intent_ref:req.normative_context_ref,context_revision:req.context_revision,context_sources:req.context_sources,
   generator_ref:generatorRef(),status:"requested",requested_at:input.requested_at,provider_ref:B2_AI_PROVIDER_REF,model_id:B2_AI_MODEL_ID,model_version:B2_AI_MODEL_ID,
   prompt_profile_ref:B2_PROMPT_PROFILE_REF,prompt_profile_revision:B2_PROMPT_PROFILE_REVISION,response_schema_ref:B2_RESPONSE_SCHEMA_REF,
   instructions_sha256:b2InstructionsSha256(),input_payload_sha256:b2InputSha256(req),provider_request_id:null,usage:null,completed_at:null,failure_code:null
  };
  const claimed=await this.store.insertOperationIfAbsent(base);
  if(!claimed) return {status:"hold",ai_operation_id:identity.record_id,reason:"AI_OPERATION_IN_PROGRESS_OR_INTERRUPTED",idempotent_replay:true};

  try{
   const result=await this.provider.propose(req);
   assertB2Proposal(req,result.proposal);
   const completedAt=utcTimestamp(),payloadSha=sha256CanonicalJson(result.proposal);
   const proposalIdentity=deriveIdentity("aip",["ai_operation_id","request_id","action","payload_sha256"],{ai_operation_id:identity.record_id,request_id:req.request_id,action:result.proposal.action,payload_sha256:payloadSha});
   await this.store.insertProposal({
    proposal_id:proposalIdentity.record_id,ai_operation_id:identity.record_id,request_id:req.request_id,interaction_key:input.interaction_key,
    context_revision:req.context_revision,action:result.proposal.action,payload:result.proposal,payload_sha256:payloadSha,
    model_ref:generatorRef(result.model_version),review_state:result.proposal.action==="abstain"?"hold":"pending",created_at:completedAt
   });
   await this.store.finishOperation(identity.record_id,{status:result.proposal.action==="abstain"?"fallback":"completed",provider_request_id:result.provider_request_id,model_version:result.model_version,usage:result.usage,completed_at:completedAt,failure_code:result.proposal.action==="abstain"?"AI_ABSTAIN":null});
   return result.proposal.action==="abstain"
    ? {status:"safe_fallback",ai_operation_id:identity.record_id,proposal_id:proposalIdentity.record_id,reason:"AI_ABSTAIN",idempotent_replay:false}
    : {status:"waiting_review",ai_operation_id:identity.record_id,proposal_id:proposalIdentity.record_id,proposal:result.proposal,idempotent_replay:false};
  }catch(error){
   const code=error instanceof B2ProviderError?error.code:error instanceof Error?error.message:"AI_UNKNOWN_ERROR";
   await this.store.finishOperation(identity.record_id,{status:code.startsWith("a09_")?"rejected":"fallback",completed_at:utcTimestamp(),failure_code:code});
   return {status:"safe_fallback",ai_operation_id:identity.record_id,reason:code,idempotent_replay:false};
  }
 }
}
