import "server-only";
import { Pool,type PoolClient } from "pg";
import { canonicalJson } from "../canonical";
import { validatePr3DatabaseTarget } from "../target";

export type AioStatus="requested"|"completed"|"failed"|"fallback"|"rejected";
export type AioRecord={
 ai_operation_id:string;object_run_id:string;interaction_key:string;operation:string;profile_ref:string;intent_ref:string;context_revision:string;context_sources:unknown;
 generator_ref:string;status:AioStatus;requested_at:string;provider_ref:string;model_id:string;model_version:string;prompt_profile_ref:string;prompt_profile_revision:string;
 response_schema_ref:string;instructions_sha256:string;input_payload_sha256:string;provider_request_id?:string|null;usage?:unknown;completed_at?:string|null;failure_code?:string|null;
};
export type AiProposalRecord={proposal_id:string;ai_operation_id:string;request_id:string;interaction_key:string;context_revision:string;action:string;payload:unknown;payload_sha256:string;model_ref:string;review_state:"pending"|"admitted"|"rejected"|"hold"|"stale";created_at:string};
export interface Pr3AiStore{
 getOperation(id:string):Promise<AioRecord|null>;
 insertOperationIfAbsent(row:AioRecord):Promise<boolean>;
 finishOperation(id:string,patch:Pick<AioRecord,"status">&Partial<Pick<AioRecord,"provider_request_id"|"model_version"|"usage"|"completed_at"|"failure_code">>):Promise<void>;
 getProposalForOperation(aiOperationId:string,requestId:string):Promise<AiProposalRecord|null>;
 insertProposal(row:AiProposalRecord):Promise<void>;
}

let pool:Pool|null=null,poolConnectionString:string|null=null;
function getAiPool(){
 const connectionString=process.env.EVE_PR3_DATABASE_URL;
 if(!connectionString) throw new Error("pr3_clean_database_not_configured");
 validatePr3DatabaseTarget(connectionString,process.env.EVE_PR3_EXPECTED_PROJECT_REF);
 if(pool&&poolConnectionString!==connectionString) throw new Error("pr3_clean_database_target_mismatch");
 if(!pool){pool=new Pool({connectionString,max:4,idleTimeoutMillis:30_000,statement_timeout:15_000});poolConnectionString=connectionString;}
 return pool;
}
async function withClient<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{const client=await getAiPool().connect();try{return await fn(client);}finally{client.release();}}

export class PostgresPr3AiStore implements Pr3AiStore{
 async getOperation(id:string){return withClient(async client=>{const r=await client.query("select * from eve_pr3.a_i_operation where ai_operation_id=$1",[id]);return (r.rows[0] as AioRecord|undefined)??null;});}
 async insertOperationIfAbsent(row:AioRecord){return withClient(async client=>{const r=await client.query(`insert into eve_pr3.a_i_operation
 (ai_operation_id,object_run_id,interaction_key,operation,profile_ref,intent_ref,context_revision,context_sources,generator_ref,status,requested_at,provider_ref,model_id,model_version,prompt_profile_ref,prompt_profile_revision,response_schema_ref,instructions_sha256,input_payload_sha256,provider_request_id,usage,completed_at,failure_code)
 values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11::timestamptz,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::timestamptz,$23)
 on conflict (ai_operation_id) do nothing returning ai_operation_id`,
 [row.ai_operation_id,row.object_run_id,row.interaction_key,row.operation,row.profile_ref,row.intent_ref,row.context_revision,canonicalJson(row.context_sources),row.generator_ref,row.status,row.requested_at,row.provider_ref,row.model_id,row.model_version,row.prompt_profile_ref,row.prompt_profile_revision,row.response_schema_ref,row.instructions_sha256,row.input_payload_sha256,row.provider_request_id??null,row.usage==null?null:canonicalJson(row.usage),row.completed_at??null,row.failure_code??null]);return r.rowCount===1;});}
 async finishOperation(id:string,patch:Pick<AioRecord,"status">&Partial<Pick<AioRecord,"provider_request_id"|"model_version"|"usage"|"completed_at"|"failure_code">>){await withClient(async client=>{await client.query(`update eve_pr3.a_i_operation set status=$2,provider_request_id=coalesce($3,provider_request_id),model_version=coalesce($4,model_version),usage=coalesce($5::jsonb,usage),completed_at=coalesce($6::timestamptz,completed_at),failure_code=$7 where ai_operation_id=$1`,[id,patch.status,patch.provider_request_id??null,patch.model_version??null,patch.usage==null?null:canonicalJson(patch.usage),patch.completed_at??null,patch.failure_code??null]);});}
 async getProposalForOperation(aiOperationId:string,requestId:string){return withClient(async client=>{const r=await client.query("select * from eve_pr3.a_i_proposal where ai_operation_id=$1 and request_id=$2 order by created_at asc limit 1",[aiOperationId,requestId]);return (r.rows[0] as AiProposalRecord|undefined)??null;});}
 async insertProposal(row:AiProposalRecord){await withClient(async client=>{await client.query(`insert into eve_pr3.a_i_proposal
 (proposal_id,ai_operation_id,request_id,interaction_key,context_revision,action,payload,payload_sha256,model_ref,review_state,created_at)
 values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::timestamptz)`,
 [row.proposal_id,row.ai_operation_id,row.request_id,row.interaction_key,row.context_revision,row.action,canonicalJson(row.payload),row.payload_sha256,row.model_ref,row.review_state,row.created_at]);});}
}

export class MemoryPr3AiStore implements Pr3AiStore{
 operations=new Map<string,AioRecord>();proposals=new Map<string,AiProposalRecord>();
 async getOperation(id:string){return this.operations.get(id)??null;}
 async insertOperationIfAbsent(row:AioRecord){if(this.operations.has(row.ai_operation_id)) return false;this.operations.set(row.ai_operation_id,structuredClone(row));return true;}
 async finishOperation(id:string,patch:Pick<AioRecord,"status">&Partial<Pick<AioRecord,"provider_request_id"|"model_version"|"usage"|"completed_at"|"failure_code">>){const row=this.operations.get(id);if(!row) throw new Error("unknown_ai_operation");this.operations.set(id,{...row,...structuredClone(patch)});}
 async getProposalForOperation(aiOperationId:string,requestId:string){return [...this.proposals.values()].find(row=>row.ai_operation_id===aiOperationId&&row.request_id===requestId)??null;}
 async insertProposal(row:AiProposalRecord){if(this.proposals.has(row.proposal_id)) throw new Error("duplicate_ai_proposal");this.proposals.set(row.proposal_id,structuredClone(row));}
}
