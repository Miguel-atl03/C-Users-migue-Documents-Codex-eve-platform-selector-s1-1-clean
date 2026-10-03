export type AioStatus="requested"|"completed"|"failed"|"fallback"|"rejected";

export type AioRecord={
 ai_operation_id:string;
 object_run_id:string;
 interaction_key:string;
 operation:string;
 profile_ref:string;
 intent_ref:string;
 context_revision:string;
 context_sources:unknown;
 generator_ref:string;
 status:AioStatus;
 requested_at:string;
 provider_ref:string;
 model_id:string;
 model_version:string;
 prompt_profile_ref:string;
 prompt_profile_revision:string;
 response_schema_ref:string;
 instructions_sha256:string;
 input_payload_sha256:string;
 provider_request_id?:string|null;
 usage?:unknown;
 completed_at?:string|null;
 failure_code?:string|null;
};

export type AiProposalReviewState="pending"|"admitted"|"rejected"|"hold"|"stale";

export type AiProposalRecord={
 proposal_id:string;
 ai_operation_id:string;
 request_id:string;
 interaction_key:string;
 context_revision:string;
 action:string;
 payload:unknown;
 payload_sha256:string;
 model_ref:string;
 review_state:AiProposalReviewState;
 created_at:string;
};

export interface Pr3AiStore{
 getOperation(id:string):Promise<AioRecord|null>;
 insertOperationIfAbsent(row:AioRecord):Promise<boolean>;
 finishOperation(id:string,patch:Pick<AioRecord,"status">&Partial<Pick<AioRecord,"provider_request_id"|"model_version"|"usage"|"completed_at"|"failure_code">>):Promise<void>;
 getProposalForOperation(aiOperationId:string,requestId:string):Promise<AiProposalRecord|null>;
 insertProposal(row:AiProposalRecord):Promise<void>;
}
