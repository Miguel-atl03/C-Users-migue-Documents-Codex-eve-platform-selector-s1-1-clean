import type {
  EVEParallelProductionRequest,
  EVEParallelProductionRehearsalResult,
  EVEParallelProductionScope,
} from "./runtime-40-20-parallel-production-types";
import { buildConsultantReviewPacketFromLocal } from "../consultant-result/runtime-40-20-consultant-result-local-adapter";
import type { EVEActivationChainContextRef } from "../client-result/runtime-40-20-client-result-service";
import {
  buildParallelProductionRehearsalResult,
  getParallelProductionLocalAdapterStatus,
  validateParallelProductionNoForbiddenFields,
  validateParallelProductionRehearsalStructure,
  validateParallelProductionScope,
} from "./runtime-40-20-parallel-production-service";

export async function buildParallelProductionRehearsalFromLocal(
  request: EVEParallelProductionRequest,
  env: NodeJS.ProcessEnv = process.env,
  chainContext?: EVEActivationChainContextRef & Record<string, unknown>,
): Promise<EVEParallelProductionRehearsalResult | null> {
  const status = getParallelProductionLocalAdapterStatus(env);
  if (status.dependency_blocked) return null;

  const validation = validateParallelProductionScope(request.scope);
  if (!validation.valid) return null;

  const consultantPacket = await buildConsultantReviewPacketFromLocal(
    { scope: validation.scope },
    env,
    chainContext,
  );
  if (!consultantPacket || !validateParallelProductionNoForbiddenFields(consultantPacket)) {
    return null;
  }

  if (
    chainContext?.consultant_packet_ref &&
    consultantPacket.packet_ref !== chainContext.consultant_packet_ref
  ) {
    return null;
  }

  const readiness_state = consultantPacket.readiness_decision.readiness_state;
  const buildInput = {
    scope: validation.scope,
    consultant_packet: consultantPacket,
    readiness_state,
  };

  const rehearsal = buildParallelProductionRehearsalResult(buildInput);
  if (!validateParallelProductionRehearsalStructure(rehearsal)) return null;
  return rehearsal;
}

export async function readParallelProductionScopeFromLocal(
  scope: EVEParallelProductionScope,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  consultant_packet_available: boolean;
  readiness_state: string | null;
  readiness_decision_record_id: string | null;
} | null> {
  const status = getParallelProductionLocalAdapterStatus(env);
  if (status.dependency_blocked) return null;

  const consultantPacket = await buildConsultantReviewPacketFromLocal({ scope }, env);
  if (!consultantPacket) {
    return {
      consultant_packet_available: false,
      readiness_state: null,
      readiness_decision_record_id: null,
    };
  }

  return {
    consultant_packet_available: true,
    readiness_state: consultantPacket.readiness_decision.readiness_state,
    readiness_decision_record_id:
      consultantPacket.readiness_decision.readiness_decision_record_id,
  };
}

export const Runtime40_20ParallelProductionLocalAdapter = {
  buildParallelProductionRehearsalFromLocal,
  readParallelProductionScopeFromLocal,
};
