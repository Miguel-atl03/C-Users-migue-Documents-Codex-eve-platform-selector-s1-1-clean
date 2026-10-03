import "server-only";
import { deriveIdentity, sha256CanonicalJson, utcTimestamp } from "../canonical";
import { executePr3ReceiptBound } from "../execution-service";
import type { Pr3CommandReceipt } from "../contracts";
import type { Pr3Repository } from "../repository";
import {
  B0_PROFILE_ID,
  type B0ProductionAiRequest,
} from "./b0-binding";
import {
  B0ProductionAiAdapter,
  b0IntentRef,
  type B0ProductionAiResult,
} from "./b0-adapter";
import {
  OpenAiB0ResponsesProvider,
  type B0AiProvider,
} from "./openai-responses";
import {
  B2_PROFILE_ID,
  B2_PROFILE_REVISION,
  prepareB2AiRequest,
  type B2ProductionAiRequest,
} from "./b2-binding";
import {
  B2ProductionAiAdapter,
  type B2ProductionAiResult,
} from "./b2-adapter";
import {
  OpenAiB2ResponsesProvider,
  type B2AiProvider,
} from "./b2-openai-responses";
import {
  B0_ROUTING_MODEL_ID,
  B0_ROUTING_PROVIDER_REF,
  B0_ROUTING_PROMPT_PROFILE_REF,
  B0_ROUTING_PROMPT_PROFILE_REVISION,
  b0RoutingInstructionsSha256,
  runB0RoutingOperation,
  validateB0RoutingRequest,
  type B0RoutingProviderResult,
  type B0RoutingRequest,
} from "./b0-routing";
import { UnitOfWorkPr3AiStore, type AioRecord } from "./store";

function internalAiScope(args:{
  object_run_id:string;
  interaction_key:string;
  context_revision:string;
  ai_operation:string;
  profile_ref:string;
  intent_ref:string;
}){
  return `internal-ai:${args.object_run_id}|${args.interaction_key}|${args.context_revision}|${args.ai_operation}|${args.profile_ref}|${args.intent_ref}`;
}

function aiSideEffectRefs(result:{ai_operation_id?:string;proposal_id?:string;idempotent_replay?:boolean}){
  if(result.idempotent_replay) return [];
  return [result.ai_operation_id,result.proposal_id].filter((x):x is string=>Boolean(x));
}

export async function executeB0InternalAiCommand(args:{
  repo:Pr3Repository;
  input:B0ProductionAiRequest;
  provider?:B0AiProvider;
}){
  const intent_ref=b0IntentRef(args.input);
  const context_revision=args.input.b0_request.observation_context_revision;
  const scope=internalAiScope({
    object_run_id:args.input.object_run_id,
    interaction_key:args.input.interaction_key,
    context_revision,
    ai_operation:"render",
    profile_ref:B0_PROFILE_ID,
    intent_ref,
  });
  const payload={
    ai_operation:"render",
    object_run_id:args.input.object_run_id,
    interaction_key:args.input.interaction_key,
    context_revision,
    profile_ref:B0_PROFILE_ID,
    intent_ref,
    request:args.input.b0_request,
  };
  return executePr3ReceiptBound<B0ProductionAiResult>({
    repo:args.repo,
    operation:"INTERNAL_AI",
    command_scope_ref:scope,
    command_event_id:args.input.server_command_event_id,
    payload,
    execute:async(tx)=>{
      const store=new UnitOfWorkPr3AiStore(tx);
      const adapter=new B0ProductionAiAdapter(store,args.provider??new OpenAiB0ResponsesProvider());
      const result=await adapter.execute(args.input);
      return {
        result,
        side_effect_refs:aiSideEffectRefs(result),
        refs:{
          object_run_id:args.input.object_run_id,
          interaction_key:args.input.interaction_key,
          context_revision,
        },
      };
    },
  });
}

export type B2InternalAiCommandResult=
 |{kind:"DETERMINISTIC_ONLY_NO_AI";deterministic_target_ids:readonly string[]}
 |{kind:"AI_COMMAND";receipt:Pr3CommandReceipt;result:B2ProductionAiResult};

export async function executeB2InternalAiCommand(args:{
  repo:Pr3Repository;
  input:B2ProductionAiRequest;
  provider?:B2AiProvider;
}):Promise<B2InternalAiCommandResult>{
  const prepared=prepareB2AiRequest(args.input);
  if(!prepared.provider_request){
    return {kind:"DETERMINISTIC_ONLY_NO_AI",deterministic_target_ids:prepared.deterministic_target_ids};
  }

  const request=prepared.provider_request;
  const filteredInput:B2ProductionAiRequest={...args.input,b2_request:request};
  const profile_ref=`${B2_PROFILE_ID}@${B2_PROFILE_REVISION}`;
  const intent_ref=request.normative_context_ref;
  const scope=internalAiScope({
    object_run_id:filteredInput.object_run_id,
    interaction_key:filteredInput.interaction_key,
    context_revision:request.context_revision,
    ai_operation:request.operation,
    profile_ref,
    intent_ref,
  });
  const payload={
    ai_operation:request.operation,
    object_run_id:filteredInput.object_run_id,
    interaction_key:filteredInput.interaction_key,
    context_revision:request.context_revision,
    profile_ref,
    intent_ref,
    request,
  };

  const wrapped=await executePr3ReceiptBound<B2ProductionAiResult>({
    repo:args.repo,
    operation:"INTERNAL_AI",
    command_scope_ref:scope,
    command_event_id:filteredInput.server_command_event_id,
    payload,
    execute:async(tx)=>{
      const store=new UnitOfWorkPr3AiStore(tx);
      const adapter=new B2ProductionAiAdapter(store,args.provider??new OpenAiB2ResponsesProvider());
      const result=await adapter.execute(filteredInput);
      return {
        result,
        side_effect_refs:aiSideEffectRefs(result),
        refs:{
          object_run_id:filteredInput.object_run_id,
          interaction_key:filteredInput.interaction_key,
          context_revision:request.context_revision,
        },
      };
    },
  });
  return {kind:"AI_COMMAND",receipt:wrapped.receipt,result:wrapped.result};
}

export type B0RoutingCommandInput={
  object_run_id:string;
  interaction_key:string;
  server_command_event_id:string;
  requested_at:string;
  routing_request:B0RoutingRequest;
};

export type B0RoutingCommandResult={
  status:"completed"|"safe_fallback"|"hold";
  ai_operation_id:string;
  operation:"classify_genericity"|"classify_scale";
  effective_status?:string;
  routing_result?:unknown;
  classification:"internal_routing_assessment_not_business_evidence";
  reason?:string;
};

function b0RoutingIntentRef(request:B0RoutingRequest){
  return request.operation==="classify_scale"
    ? `classify_scale:${request.target_id}`
    : "classify_genericity";
}

function b0RoutingSchemaRef(request:B0RoutingRequest){
  return request.operation==="classify_scale"
    ? "EVE-PR3-B0-SCALE-ROUTING-SCHEMA@1.0"
    : "EVE-PR3-B0-GENERICITY-ROUTING-SCHEMA@1.0";
}

export async function executeB0RoutingAiCommand(args:{
  repo:Pr3Repository;
  input:B0RoutingCommandInput;
  runner?:(request:B0RoutingRequest)=>Promise<B0RoutingProviderResult>;
}){
  const request=args.input.routing_request;
  validateB0RoutingRequest(request);
  const intent_ref=b0RoutingIntentRef(request);
  const scope=internalAiScope({
    object_run_id:args.input.object_run_id,
    interaction_key:args.input.interaction_key,
    context_revision:request.context_revision,
    ai_operation:request.operation,
    profile_ref:B0_PROFILE_ID,
    intent_ref,
  });
  const payload={
    ai_operation:request.operation,
    object_run_id:args.input.object_run_id,
    interaction_key:args.input.interaction_key,
    context_revision:request.context_revision,
    profile_ref:B0_PROFILE_ID,
    intent_ref,
    request,
  };

  return executePr3ReceiptBound<B0RoutingCommandResult>({
    repo:args.repo,
    operation:"INTERNAL_AI",
    command_scope_ref:scope,
    command_event_id:args.input.server_command_event_id,
    payload,
    execute:async(tx)=>{
      const store=new UnitOfWorkPr3AiStore(tx);
      const operationIdentity=deriveIdentity("aio",[
        "object_run_id","interaction_key","operation","profile_ref","intent_ref","context_revision","context_sources","requested_at",
      ],{
        object_run_id:args.input.object_run_id,
        interaction_key:args.input.interaction_key,
        operation:request.operation,
        profile_ref:B0_PROFILE_ID,
        intent_ref,
        context_revision:request.context_revision,
        context_sources:request.authorized_evidence,
        requested_at:args.input.requested_at,
      });
      const base:AioRecord={
        ai_operation_id:operationIdentity.record_id,
        object_run_id:args.input.object_run_id,
        interaction_key:args.input.interaction_key,
        operation:request.operation,
        profile_ref:B0_PROFILE_ID,
        intent_ref,
        context_revision:request.context_revision,
        context_sources:request.authorized_evidence,
        generator_ref:`${B0_ROUTING_PROVIDER_REF}:${B0_ROUTING_MODEL_ID}:${B0_ROUTING_PROMPT_PROFILE_REF}@${B0_ROUTING_PROMPT_PROFILE_REVISION}`,
        status:"requested",
        requested_at:args.input.requested_at,
        provider_ref:B0_ROUTING_PROVIDER_REF,
        model_id:B0_ROUTING_MODEL_ID,
        model_version:B0_ROUTING_MODEL_ID,
        prompt_profile_ref:B0_ROUTING_PROMPT_PROFILE_REF,
        prompt_profile_revision:B0_ROUTING_PROMPT_PROFILE_REVISION,
        response_schema_ref:b0RoutingSchemaRef(request),
        instructions_sha256:b0RoutingInstructionsSha256(),
        input_payload_sha256:sha256CanonicalJson(request),
        provider_request_id:null,
        usage:null,
        completed_at:null,
        failure_code:null,
      };

      const claimed=await store.insertOperationIfAbsent(base);
      if(!claimed){
        return {
          result:{
            status:"hold",
            ai_operation_id:operationIdentity.record_id,
            operation:request.operation,
            classification:"internal_routing_assessment_not_business_evidence",
            reason:"ROUTING_OPERATION_EXISTS_WITHOUT_CURRENT_COMMAND_RECEIPT",
          },
          side_effect_refs:[],
          refs:{
            object_run_id:args.input.object_run_id,
            interaction_key:args.input.interaction_key,
            context_revision:request.context_revision,
          },
        };
      }

      try{
        const provider=await (args.runner??runB0RoutingOperation)(request);
        const completed_at=utcTimestamp();
        await store.finishOperation(operationIdentity.record_id,{
          status:"completed",
          provider_request_id:provider.provider_request_id,
          model_version:provider.model_version,
          usage:provider.usage,
          completed_at,
          failure_code:null,
        });
        return {
          result:{
            status:"completed",
            ai_operation_id:operationIdentity.record_id,
            operation:request.operation,
            effective_status:String(provider.effective_status),
            routing_result:provider.result,
            classification:"internal_routing_assessment_not_business_evidence",
          },
          side_effect_refs:[operationIdentity.record_id],
          refs:{
            object_run_id:args.input.object_run_id,
            interaction_key:args.input.interaction_key,
            context_revision:request.context_revision,
          },
        };
      }catch(error){
        const code=error instanceof Error?error.message:"B0_ROUTING_UNKNOWN_ERROR";
        await store.finishOperation(operationIdentity.record_id,{
          status:"fallback",
          completed_at:utcTimestamp(),
          failure_code:code,
        });
        return {
          result:{
            status:"safe_fallback",
            ai_operation_id:operationIdentity.record_id,
            operation:request.operation,
            classification:"internal_routing_assessment_not_business_evidence",
            reason:code,
          },
          side_effect_refs:[operationIdentity.record_id],
          refs:{
            object_run_id:args.input.object_run_id,
            interaction_key:args.input.interaction_key,
            context_revision:request.context_revision,
          },
        };
      }
    },
  });
}
