import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivityRuntimeRunListItem,
  LinkedRoleRuntimeSession,
  OfficialControlPanelMonitoringRuntimeRepository,
  ProfileRuntimeSessionLink,
  RoleRuntimeSessionListItem,
} from "./official-control-panel-monitoring.types";

type RoleSessionRow = {
  role_runtime_session_id: string;
  sesion_id: string;
  case_id: string | null;
  role_id: string | null;
  state: string;
  primary_activity_count: number;
  secondary_activity_count: number;
};

type ActivityRunRow = {
  activity_runtime_run_id: string;
  sesion_id: string | null;
  role_runtime_session_id: string;
  activity_id: string | null;
  activity_name: string | null;
  state: string;
  base_visible_count: number;
  causal_visible_count: number;
  readiness_state: string | null;
  current_runtime_interaction_id: string | null;
};

type LinkJoinRow = {
  id: string;
  case_participant_profile_id: string;
  role_runtime_session_id: string;
  status: "active" | "inactive" | "revoked";
  linked_at: string;
  role_runtime_session: RoleSessionRow | RoleSessionRow[] | null;
};

type LinkRow = {
  id: string;
  case_participant_profile_id: string;
  role_runtime_session_id: string;
  status: "active" | "inactive" | "revoked";
  linked_at: string;
  metadata: Record<string, unknown> | null;
};

/**
 * Lectura factual Runtime + puente perfil↔sesión.
 * No une por role_id. Conteos fallidos → null (no 0 inventado).
 */
export function createOfficialControlPanelMonitoringRuntimeRepository(
  client: SupabaseClient,
): OfficialControlPanelMonitoringRuntimeRepository {
  return {
    async countRoleSessionsByCase(caseId) {
      try {
        const { count, error } = await client
          .from("role_runtime_session")
          .select("role_runtime_session_id", { count: "exact", head: true })
          .eq("sesion_id", caseId);
        if (error) return null;
        return count ?? 0;
      } catch {
        return null;
      }
    },

    async countActivityRunsByCase(caseId) {
      try {
        const { count, error } = await client
          .from("activity_runtime_run")
          .select("activity_runtime_run_id", { count: "exact", head: true })
          .eq("sesion_id", caseId);
        if (error) return null;
        return count ?? 0;
      } catch {
        return null;
      }
    },

    async listRoleSessionsByCase(caseId) {
      const { data, error } = await client
        .from("role_runtime_session")
        .select(
          "role_runtime_session_id, sesion_id, case_id, role_id, state, primary_activity_count, secondary_activity_count",
        )
        .eq("sesion_id", caseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as RoleSessionRow[]).map(mapSession);
    },

    async listActivityRunsBySession(roleRuntimeSessionId) {
      const { data, error } = await client
        .from("activity_runtime_run")
        .select(
          "activity_runtime_run_id, sesion_id, role_runtime_session_id, activity_id, activity_name, state, base_visible_count, causal_visible_count, readiness_state, current_runtime_interaction_id",
        )
        .eq("role_runtime_session_id", roleRuntimeSessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as ActivityRunRow[];
      const metrics = await loadRuntimeRunMetrics(
        client,
        rows.map((row) => row.activity_runtime_run_id),
      );
      return rows.map((row) => mapRun(row, metrics.get(row.activity_runtime_run_id)));
    },

    async findLinkedRoleSessionsByProfile(profileId) {
      const { data, error } = await client
        .from("case_profile_runtime_session_links")
        .select(
          "id, case_participant_profile_id, role_runtime_session_id, status, linked_at, role_runtime_session(role_runtime_session_id, sesion_id, case_id, role_id, state, primary_activity_count, secondary_activity_count)",
        )
        .eq("case_participant_profile_id", profileId)
        .eq("status", "active")
        .order("linked_at", { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as LinkJoinRow[];
      const linked: LinkedRoleRuntimeSession[] = [];
      for (const row of rows) {
        const session = Array.isArray(row.role_runtime_session)
          ? row.role_runtime_session[0]
          : row.role_runtime_session;
        if (!session) continue;
        if (session.state === "archived") continue;
        linked.push({
          linkId: row.id,
          profileId: row.case_participant_profile_id,
          roleRuntimeSessionId: row.role_runtime_session_id,
          caseId: session.sesion_id,
          state: session.state,
          linkStatus: "confirmed",
          validFrom: row.linked_at,
          validUntil: null,
        });
      }
      return linked;
    },

    async findProfileLinkByRuntimeSession(roleRuntimeSessionId) {
      const { data, error } = await client
        .from("case_profile_runtime_session_links")
        .select(
          "id, case_participant_profile_id, role_runtime_session_id, status, linked_at, metadata",
        )
        .eq("role_runtime_session_id", roleRuntimeSessionId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as LinkRow;
      return {
        id: row.id,
        profileId: row.case_participant_profile_id,
        roleRuntimeSessionId: row.role_runtime_session_id,
        linkStatus: "confirmed",
        enabled: true,
        validFrom: row.linked_at,
        validUntil: null,
        sourceReference:
          typeof row.metadata?.source_reference === "string"
            ? row.metadata.source_reference
            : null,
      };
    },

    async findSessionById(roleRuntimeSessionId) {
      const { data, error } = await client
        .from("role_runtime_session")
        .select(
          "role_runtime_session_id, sesion_id, case_id, role_id, state, primary_activity_count, secondary_activity_count",
        )
        .eq("role_runtime_session_id", roleRuntimeSessionId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapSession(data as RoleSessionRow);
    },
  };
}

function mapSession(row: RoleSessionRow): RoleRuntimeSessionListItem {
  return {
    id: row.role_runtime_session_id,
    caseId: row.sesion_id,
    roleId: row.role_id,
    state: row.state,
    selectedPrimaryActivityCount: row.primary_activity_count,
    secondaryActivityCount: row.secondary_activity_count,
  };
}

type RuntimeRunMetrics = {
  interactionInstanceCount: number | null;
  confirmedInteractionInstanceCount: number | null;
  subfieldResponseCount: number | null;
  evidenceItemCount: number | null;
  canonicalVariableCount: number | null;
};

async function loadRuntimeRunMetrics(
  client: SupabaseClient,
  runIds: string[],
): Promise<Map<string, RuntimeRunMetrics>> {
  const metrics = new Map(
    runIds.map((id) => [
      id,
      {
        interactionInstanceCount: 0,
        confirmedInteractionInstanceCount: 0,
        subfieldResponseCount: 0,
        evidenceItemCount: 0,
        canonicalVariableCount: 0,
      } satisfies RuntimeRunMetrics,
    ]),
  );
  if (runIds.length === 0) return metrics;

  await Promise.all([
    incrementMetric(client, metrics, "runtime_interaction_instance", runIds, {
      totalKey: "interactionInstanceCount",
      confirmedKey: "confirmedInteractionInstanceCount",
    }),
    incrementMetric(client, metrics, "runtime_subfield_response", runIds, {
      totalKey: "subfieldResponseCount",
    }),
    incrementMetric(client, metrics, "evidence_item", runIds, {
      totalKey: "evidenceItemCount",
    }),
    incrementMetric(client, metrics, "canonical_variable_record", runIds, {
      totalKey: "canonicalVariableCount",
    }),
  ]);

  return metrics;
}

async function incrementMetric(
  client: SupabaseClient,
  metrics: Map<string, RuntimeRunMetrics>,
  table: string,
  runIds: string[],
  keys: {
    totalKey: keyof RuntimeRunMetrics;
    confirmedKey?: keyof RuntimeRunMetrics;
  },
): Promise<void> {
  try {
    const { data, error } = keys.confirmedKey
      ? await client
          .from(table)
          .select("activity_runtime_run_id, state")
          .in("activity_runtime_run_id", runIds)
      : await client
          .from(table)
          .select("activity_runtime_run_id")
          .in("activity_runtime_run_id", runIds);
    if (error) {
      for (const value of metrics.values()) value[keys.totalKey] = null;
      if (keys.confirmedKey) {
        for (const value of metrics.values()) value[keys.confirmedKey] = null;
      }
      return;
    }
    for (const raw of data ?? []) {
      const row = raw as unknown as Record<string, unknown>;
      const runId = String(row.activity_runtime_run_id ?? "");
      const current = metrics.get(runId);
      if (!current) continue;
      current[keys.totalKey] = (current[keys.totalKey] ?? 0) + 1;
      if (keys.confirmedKey && row.state === "confirmed") {
        current[keys.confirmedKey] = (current[keys.confirmedKey] ?? 0) + 1;
      }
    }
  } catch {
    for (const value of metrics.values()) value[keys.totalKey] = null;
    if (keys.confirmedKey) {
      for (const value of metrics.values()) value[keys.confirmedKey] = null;
    }
  }
}

function mapRun(
  row: ActivityRunRow,
  metrics: RuntimeRunMetrics | undefined,
): ActivityRuntimeRunListItem {
  return {
    id: row.activity_runtime_run_id,
    caseId: row.sesion_id ?? "",
    roleRuntimeSessionId: row.role_runtime_session_id,
    activityId: row.activity_id,
    activityLabel: row.activity_name,
    state: row.state,
    baseVisibleCount: row.base_visible_count,
    causalVisibleCount: row.causal_visible_count,
    readinessState: row.readiness_state,
    currentRuntimeInteractionId: row.current_runtime_interaction_id,
    interactionInstanceCount: metrics?.interactionInstanceCount ?? null,
    confirmedInteractionInstanceCount:
      metrics?.confirmedInteractionInstanceCount ?? null,
    subfieldResponseCount: metrics?.subfieldResponseCount ?? null,
    evidenceItemCount: metrics?.evidenceItemCount ?? null,
    canonicalVariableCount: metrics?.canonicalVariableCount ?? null,
  };
}
