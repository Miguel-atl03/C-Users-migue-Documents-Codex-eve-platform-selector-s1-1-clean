import type {
  CurrentAssignmentRecord,
  CurrentRelationshipRecord,
  OfficialControlPanelContextAccessInput,
  OfficialControlPanelContextAccessResult,
  OfficialControlPanelContextRepository,
} from "./official-control-panel-context.types";

const ACCESS_DENIED_MESSAGE = "No fue posible abrir el contexto solicitado.";
const DATA_UNAVAILABLE_MESSAGE = "No fue posible cargar el contexto.";

type EffectiveRecord = Pick<
  CurrentAssignmentRecord | CurrentRelationshipRecord,
  "status" | "validFrom" | "validUntil"
>;

export function isContextRecordEffective(
  record: EffectiveRecord,
  at = new Date(),
): boolean {
  if (record.status !== "enabled") return false;

  const instant = at.getTime();
  const validFrom = Date.parse(record.validFrom);
  const validUntil = record.validUntil ? Date.parse(record.validUntil) : null;

  if (!Number.isFinite(validFrom) || instant < validFrom) return false;
  if (validUntil !== null && (!Number.isFinite(validUntil) || instant > validUntil)) {
    return false;
  }
  return true;
}

export async function assertConsultantClientContextAccess(
  repository: OfficialControlPanelContextRepository,
  input: OfficialControlPanelContextAccessInput,
): Promise<OfficialControlPanelContextAccessResult> {
  const at = input.at ?? new Date();

  try {
    const assignment = await repository.findAssignment(
      input.consultantUserId,
      input.companyId,
    );

    if (
      !assignment ||
      assignment.consultantUserId !== input.consultantUserId ||
      assignment.companyId !== input.companyId ||
      !isContextRecordEffective(assignment, at)
    ) {
      return accessDenied();
    }

    if (input.relationshipId) {
      const relationship = await repository.findRelationship(input.relationshipId);
      if (
        !relationship ||
        relationship.companyId !== input.companyId ||
        !isContextRecordEffective(relationship, at)
      ) {
        return accessDenied();
      }
    }

    if (input.caseId) {
      if (!input.relationshipId) return accessDenied();

      const linkedCase = await repository.findCase(input.caseId);
      if (
        !linkedCase ||
        linkedCase.companyId !== input.companyId ||
        linkedCase.relationshipId !== input.relationshipId
      ) {
        return accessDenied();
      }
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      code: "context_data_unavailable",
      status: 500,
      message: DATA_UNAVAILABLE_MESSAGE,
    };
  }
}

export function presentCaseStatus(status: string | null): string | null {
  if (!status) return null;

  const labels: Record<string, string> = {
    capa_1_triple: "Recopilación inicial",
    capa_2_estructural: "Recopilación estructural",
    capa_2_5_s2: "Coordinación",
    capa_3a_patron: "Patrones de trabajo",
    pausa_s4: "Aclaración en curso",
    capa_3b_ruptura: "Profundización",
    completado: "Completado",
  };

  return labels[status] ?? null;
}

function accessDenied(): OfficialControlPanelContextAccessResult {
  return {
    ok: false,
    code: "context_access_denied",
    status: 403,
    message: ACCESS_DENIED_MESSAGE,
  };
}
