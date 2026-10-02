import {
  buildSupportProcessAxisItems,
} from "./catalogs/support-process-axis.catalog";
import { assertConsultantClientContextAccess } from "./official-control-panel-context-service";
import type { OfficialControlPanelContextRepository } from "./official-control-panel-context.types";
import type {
  OfficialControlPanelSupportProcessAccessResult,
  SupportProcessAxisResponse,
} from "./official-control-panel-support-process.types";

const ACCESS_DENIED_MESSAGE =
  "No fue posible abrir los procesos de soporte del caso.";
const DATA_UNAVAILABLE_MESSAGE =
  "No fue posible abrir los procesos de soporte del caso.";

export type OfficialControlPanelSupportProcessAccessInput = {
  consultantUserId: string;
  companyId: string;
  relationshipId: string;
  caseId: string;
  at?: Date;
};

/**
 * Cumulative access: consultant → company → relationship → case.
 * URL alone never grants access. Failures do not distinguish existence.
 */
export async function assertConsultantCaseSupportProcessAccess(
  contextRepository: OfficialControlPanelContextRepository,
  input: OfficialControlPanelSupportProcessAccessInput,
): Promise<OfficialControlPanelSupportProcessAccessResult> {
  try {
    const contextAccess = await assertConsultantClientContextAccess(
      contextRepository,
      {
        consultantUserId: input.consultantUserId,
        companyId: input.companyId,
        relationshipId: input.relationshipId,
        caseId: input.caseId,
        at: input.at,
      },
    );

    if (!contextAccess.ok) {
      return {
        ok: false,
        status: 403,
        code: "support_process_access_denied",
        message: ACCESS_DENIED_MESSAGE,
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      status: 500,
      code: "support_process_data_unavailable",
      message: DATA_UNAVAILABLE_MESSAGE,
    };
  }
}

/**
 * Builds the Eje X axis from the rector catalog.
 * Operational status / attention are unavailable until a factual per-case
 * source exists. Catalog must still be returned (degradable BFF).
 */
export function buildSupportProcessAxisResponse(): SupportProcessAxisResponse {
  return buildSupportProcessAxisItems();
}
