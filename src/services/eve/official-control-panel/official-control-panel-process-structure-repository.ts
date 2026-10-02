import type { SupabaseClient } from "@supabase/supabase-js";

import { presentCoreMilestoneProgressFromRpc } from "./official-control-panel-core-milestones";
import type {
  CaseMainProcessRecord,
  CaseMilestoneRecord,
  CaseProcessStatus,
  OfficialControlPanelProcessStructureRepository,
} from "./official-control-panel-process-structure.types";

const DATA_SOURCE_ERROR = "official_control_panel_process_structure_data_source_error";

export function createOfficialControlPanelProcessStructureRepository(
  client: SupabaseClient,
): OfficialControlPanelProcessStructureRepository {
  return {
    async findEnabledMainProcessByCase(caseId) {
      const { data, error } = await client
        .from("case_main_processes")
        .select(
          "id, case_id, label, status, current_milestone_id, enabled",
        )
        .eq("case_id", caseId)
        .eq("enabled", true)
        .maybeSingle();

      if (error) throw new Error(DATA_SOURCE_ERROR);
      if (!data) return null;
      return mapMainProcess(data);
    },

    async findMainProcessById(mainProcessId) {
      const { data, error } = await client
        .from("case_main_processes")
        .select(
          "id, case_id, label, status, current_milestone_id, enabled",
        )
        .eq("id", mainProcessId)
        .maybeSingle();

      if (error) throw new Error(DATA_SOURCE_ERROR);
      if (!data) return null;
      return mapMainProcess(data);
    },

    async listEnabledMilestonesByProcess(mainProcessId) {
      const { data, error } = await client
        .from("case_milestones")
        .select(
          "id, main_process_id, label, sequence, status, expected_event_label, timer_due_at, support_process_label, enabled",
        )
        .eq("main_process_id", mainProcessId)
        .eq("enabled", true)
        .order("sequence", { ascending: true });

      if (error) throw new Error(DATA_SOURCE_ERROR);
      return (data ?? []).map(mapMilestone);
    },

    async findMilestoneById(milestoneId) {
      const { data, error } = await client
        .from("case_milestones")
        .select(
          "id, main_process_id, label, sequence, status, expected_event_label, timer_due_at, support_process_label, enabled",
        )
        .eq("id", milestoneId)
        .maybeSingle();

      if (error) throw new Error(DATA_SOURCE_ERROR);
      if (!data) return null;
      return mapMilestone(data);
    },

    async calculateCoreMilestoneProgress(caseId) {
      const { data, error } = await client.rpc(
        "eve_calculate_core_milestone_progress",
        { p_case_id: caseId },
      );
      if (error) throw new Error(DATA_SOURCE_ERROR);
      const progress = presentCoreMilestoneProgressFromRpc(data);
      return {
        achieved: progress.achieved,
        total: progress.total,
        status: progress.status,
      };
    },
  };
}

function mapMainProcess(data: Record<string, unknown>): CaseMainProcessRecord {
  return {
    id: String(data.id),
    caseId: String(data.case_id),
    label: String(data.label),
    status: normalizeProcessStatus(data.status),
    currentMilestoneId: data.current_milestone_id
      ? String(data.current_milestone_id)
      : null,
    enabled: Boolean(data.enabled),
  };
}

function mapMilestone(data: Record<string, unknown>): CaseMilestoneRecord {
  return {
    id: String(data.id),
    mainProcessId: String(data.main_process_id),
    label: String(data.label),
    sequence: Number(data.sequence),
    status: normalizeProcessStatus(data.status),
    expectedEventLabel: data.expected_event_label
      ? String(data.expected_event_label)
      : null,
    timerDueAt: data.timer_due_at ? String(data.timer_due_at) : null,
    supportProcessLabel: data.support_process_label
      ? String(data.support_process_label)
      : null,
    enabled: Boolean(data.enabled),
  };
}

function normalizeProcessStatus(value: unknown): CaseProcessStatus {
  const allowed: CaseProcessStatus[] = [
    "not_started",
    "available",
    "current",
    "waiting",
    "completed",
    "blocked",
    "unknown",
  ];
  const text = String(value ?? "unknown");
  return (allowed.includes(text as CaseProcessStatus)
    ? text
    : "unknown") as CaseProcessStatus;
}
