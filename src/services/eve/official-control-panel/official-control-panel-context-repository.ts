import type { SupabaseClient } from "@supabase/supabase-js";

import { presentCaseStatus } from "./official-control-panel-context-service";
import type {
  ClientCaseOption,
  ClientCompanyOption,
  ClientRelationshipOption,
  CurrentAssignmentRecord,
  CurrentRelationshipRecord,
  LinkedCaseRecord,
  OfficialControlPanelContextRepository,
} from "./official-control-panel-context.types";

const DATA_SOURCE_ERROR = "official_control_panel_context_data_source_error";

export function createOfficialControlPanelContextRepository(
  client: SupabaseClient,
): OfficialControlPanelContextRepository {
  return {
    async findAssignment(consultantUserId, companyId) {
      const { data, error } = await client
        .from("consultant_company_assignments")
        .select(
          "consultant_user_id, client_company_id, status, valid_from, valid_until",
        )
        .eq("consultant_user_id", consultantUserId)
        .eq("client_company_id", companyId)
        .maybeSingle();

      if (error) throw new Error(DATA_SOURCE_ERROR);
      if (!data) return null;

      return {
        consultantUserId: String(data.consultant_user_id),
        companyId: String(data.client_company_id),
        status: normalizeStatus(data.status),
        validFrom: String(data.valid_from),
        validUntil: data.valid_until ? String(data.valid_until) : null,
      } satisfies CurrentAssignmentRecord;
    },

    async findRelationship(relationshipId) {
      const { data, error } = await client
        .from("client_relationships")
        .select("id, client_company_id, status, valid_from, valid_until")
        .eq("id", relationshipId)
        .maybeSingle();

      if (error) throw new Error(DATA_SOURCE_ERROR);
      if (!data) return null;

      return {
        id: String(data.id),
        companyId: String(data.client_company_id),
        status: normalizeStatus(data.status),
        validFrom: String(data.valid_from),
        validUntil: data.valid_until ? String(data.valid_until) : null,
      } satisfies CurrentRelationshipRecord;
    },

    async findCase(caseId) {
      const { data, error } = await client
        .from("sesiones_llenado")
        .select("id, client_company_id, client_relationship_id")
        .eq("id", caseId)
        .maybeSingle();

      if (error) throw new Error(DATA_SOURCE_ERROR);
      if (!data) return null;

      return {
        id: String(data.id),
        companyId: data.client_company_id
          ? String(data.client_company_id)
          : null,
        relationshipId: data.client_relationship_id
          ? String(data.client_relationship_id)
          : null,
      } satisfies LinkedCaseRecord;
    },

    async listCompanies(consultantUserId) {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from("consultant_company_assignments")
        .select("client_company_id, empresas!inner(id, nombre)")
        .eq("consultant_user_id", consultantUserId)
        .eq("status", "enabled")
        .lte("valid_from", now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order("created_at", { ascending: true });

      if (error) throw new Error(DATA_SOURCE_ERROR);

      return (data ?? []).flatMap((row): ClientCompanyOption[] => {
        const company = oneRelation(row.empresas);
        if (!company?.id || !company.nombre) return [];
        return [{ id: String(company.id), label: String(company.nombre) }];
      });
    },

    async listRelationships(_consultantUserId, companyId) {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from("client_relationships")
        .select("id, display_name")
        .eq("client_company_id", companyId)
        .eq("status", "enabled")
        .lte("valid_from", now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order("display_name", { ascending: true });

      if (error) throw new Error(DATA_SOURCE_ERROR);

      return (data ?? []).map(
        (row): ClientRelationshipOption => ({
          id: String(row.id),
          label: String(row.display_name),
        }),
      );
    },

    async listCases(_consultantUserId, relationshipId) {
      const { data, error } = await client
        .from("sesiones_llenado")
        .select("id, display_name, estado_actual")
        .eq("client_relationship_id", relationshipId)
        .not("display_name", "is", null)
        .order("created_at", { ascending: true });

      if (error) throw new Error(DATA_SOURCE_ERROR);

      return (data ?? []).map(
        (row): ClientCaseOption => ({
          id: String(row.id),
          label: String(row.display_name),
          statusLabel: presentCaseStatus(
            typeof row.estado_actual === "string" ? row.estado_actual : null,
          ),
        }),
      );
    },
  };
}

function normalizeStatus(value: unknown): "enabled" | "disabled" {
  return value === "enabled" ? "enabled" : "disabled";
}

function oneRelation(
  value: unknown,
): { id?: unknown; nombre?: unknown } | null {
  if (Array.isArray(value)) {
    return (value[0] as { id?: unknown; nombre?: unknown } | undefined) ?? null;
  }
  if (value && typeof value === "object") {
    return value as { id?: unknown; nombre?: unknown };
  }
  return null;
}
