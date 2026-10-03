import "server-only";
import type { Pr3UnitOfWork } from "../repository";
import type { AioRecord, AiProposalRecord, Pr3AiStore } from "./records";

export type { AioRecord, AiProposalRecord, AioStatus, AiProposalReviewState, Pr3AiStore } from "./records";

/**
 * Production AI writes MUST use the caller's PR3 UnitOfWork so A07
 * CommandReceipt and every AIOperation/AIProposal side effect commit or roll
 * back atomically in the same PostgreSQL transaction.
 */
export class UnitOfWorkPr3AiStore implements Pr3AiStore {
  constructor(private tx: Pr3UnitOfWork) {}
  getOperation(id:string){ return this.tx.getAiOperation(id); }
  insertOperationIfAbsent(row:AioRecord){ return this.tx.insertAiOperationIfAbsent(row); }
  finishOperation(id:string,patch:Parameters<Pr3AiStore["finishOperation"]>[1]){ return this.tx.finishAiOperation(id,patch); }
  getProposalForOperation(aiOperationId:string,requestId:string){ return this.tx.getAiProposalForOperation(aiOperationId,requestId); }
  insertProposal(row:AiProposalRecord){ return this.tx.insertAiProposal(row); }
}

/**
 * Memory store is QA-only. It deliberately has no database adapter and cannot
 * become a production persistence path.
 */
export class MemoryPr3AiStore implements Pr3AiStore {
  operations=new Map<string,AioRecord>();
  proposals=new Map<string,AiProposalRecord>();

  async getOperation(id:string){ return this.operations.get(id)??null; }
  async insertOperationIfAbsent(row:AioRecord){
    if(this.operations.has(row.ai_operation_id)) return false;
    this.operations.set(row.ai_operation_id,structuredClone(row));
    return true;
  }
  async finishOperation(id:string,patch:Parameters<Pr3AiStore["finishOperation"]>[1]){
    const row=this.operations.get(id);
    if(!row) throw new Error("unknown_ai_operation");
    this.operations.set(id,{...row,...structuredClone(patch)});
  }
  async getProposalForOperation(aiOperationId:string,requestId:string){
    return [...this.proposals.values()].find(row=>row.ai_operation_id===aiOperationId&&row.request_id===requestId)??null;
  }
  async insertProposal(row:AiProposalRecord){
    if(this.proposals.has(row.proposal_id)) throw new Error("duplicate_ai_proposal");
    this.proposals.set(row.proposal_id,structuredClone(row));
  }
}
