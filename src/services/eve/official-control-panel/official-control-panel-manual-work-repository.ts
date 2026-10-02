import type { SupabaseClient } from "@supabase/supabase-js";

export type ManualWorkItemRow = {
  id: string;
  company_id: string;
  case_id: string;
  process_code: string;
  source_object_label: string | null;
  source_state_label: string | null;
  expected_output_object_label: string | null;
  expected_output_state_label: string | null;
  manual_tracking_status: string;
  expected_event: string | null;
  opened_at: string | null;
  expected_handoff_at: string | null;
  responsible_label: string | null;
  handoff_status: string;
  handoff_origin: string | null;
  handoff_destination: string | null;
  acceptance_result_ref: string | null;
  artifact_ref: string | null;
  version: number;
  is_current: boolean;
  last_event_at: string | null;
  submitted_artifact_version_id: string | null;
  accepted_artifact_version_id: string | null;
};

export type ManualWorkArtifactRow = {
  id: string;
  work_item_id: string;
  artifact_kind: string;
  version_number: number;
  storage_reference: string;
  sanitized_filename: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  created_at: string;
};

export type ManualWorkEventRow = {
  id: string;
  work_item_id: string;
  case_id: string;
  company_id: string;
  process_code: string;
  event_type: string;
  actor_label: string;
  occurred_at: string;
  before_status: string;
  after_status: string;
  before_handoff_status: string | null;
  after_handoff_status: string | null;
  reason: string | null;
  artifact_ref: string | null;
};

export type ManualWorkCapabilityGrantRow = {
  capability: string;
  status: string;
};

export type ManualWorkRepository = {
  listCurrentWorkItemsForCase: (caseId: string) => Promise<ManualWorkItemRow[]>;
  listEventsForWorkItems: (
    workItemIds: string[],
  ) => Promise<ManualWorkEventRow[]>;
  listArtifactsForWorkItems: (
    workItemIds: string[],
  ) => Promise<ManualWorkArtifactRow[]>;
  listEnabledCapabilityGrants: (input: {
    consultantUserId: string;
    companyId: string;
  }) => Promise<ManualWorkCapabilityGrantRow[]>;
  listValidInputPackageIdsForWorkItems: (input: {
    caseId: string;
    workItemIds: string[];
  }) => Promise<Set<string>>;
  listValidSubmittedArtifactIds: (
    artifactIds: string[],
  ) => Promise<Set<string>>;
};

export function createOfficialControlPanelManualWorkRepository(
  client: SupabaseClient,
): ManualWorkRepository {
  return {
    async listCurrentWorkItemsForCase(caseId) {
      const { data, error } = await client
        .from("manual_process_work_item")
        .select(
          [
            "id",
            "company_id",
            "case_id",
            "process_code",
            "source_object_label",
            "source_state_label",
            "expected_output_object_label",
            "expected_output_state_label",
            "manual_tracking_status",
            "expected_event",
            "opened_at",
            "expected_handoff_at",
            "responsible_label",
            "handoff_status",
            "handoff_origin",
            "handoff_destination",
            "acceptance_result_ref",
            "artifact_ref",
            "version",
            "is_current",
            "last_event_at",
            "submitted_artifact_version_id",
            "accepted_artifact_version_id",
          ].join(","),
        )
        .eq("case_id", caseId)
        .eq("is_current", true)
        .in("process_code", ["P-SUP-03", "P-SUP-04", "P-SUP-05"])
        .order("process_code", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as ManualWorkItemRow[];
    },

    async listEventsForWorkItems(workItemIds) {
      if (workItemIds.length === 0) return [];
      const { data, error } = await client
        .from("manual_process_work_item_event")
        .select(
          [
            "id",
            "work_item_id",
            "case_id",
            "company_id",
            "process_code",
            "event_type",
            "actor_label",
            "occurred_at",
            "before_status",
            "after_status",
            "before_handoff_status",
            "after_handoff_status",
            "reason",
            "artifact_ref",
          ].join(","),
        )
        .in("work_item_id", workItemIds)
        .order("occurred_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as ManualWorkEventRow[];
    },

    async listArtifactsForWorkItems(workItemIds) {
      if (workItemIds.length === 0) return [];
      const { data, error } = await client
        .from("manual_work_artifact_version")
        .select(
          [
            "id",
            "work_item_id",
            "artifact_kind",
            "version_number",
            "storage_reference",
            "sanitized_filename",
            "content_type",
            "size_bytes",
            "sha256",
            "created_at",
          ].join(","),
        )
        .in("work_item_id", workItemIds)
        .order("version_number", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as ManualWorkArtifactRow[];
    },

    async listEnabledCapabilityGrants({ consultantUserId, companyId }) {
      const { data, error } = await client
        .from("eve_consultant_panel_capability_grant")
        .select("capability, status")
        .eq("consultant_user_id", consultantUserId)
        .eq("client_company_id", companyId)
        .eq("status", "enabled")
        .in("capability", ["manage_manual_work", "accept_manual_output"]);

      if (error) throw error;
      return (data ?? []) as unknown as ManualWorkCapabilityGrantRow[];
    },

    async listValidInputPackageIdsForWorkItems({ caseId, workItemIds }) {
      const valid = new Set<string>();
      if (workItemIds.length === 0) return valid;
      const { data, error } = await client.rpc(
        "eve_list_valid_manual_input_packages_as_consultant",
        {
          p_case_id: caseId,
          p_work_item_ids: workItemIds,
        },
      );
      if (error) throw error;
      for (const row of data ?? []) {
        if (row?.artifact_version_id) {
          valid.add(String(row.artifact_version_id));
        }
      }
      return valid;
    },

    async listValidSubmittedArtifactIds(artifactIds) {
      const unique = [...new Set(artifactIds.filter(Boolean))];
      if (unique.length === 0) return new Set<string>();
      // Authenticated cannot read blob bytes; rely on metadata + size for UI.
      // Exact checksum is enforced in accept RPC.
      const { data, error } = await client
        .from("manual_work_artifact_version")
        .select("id, sha256, size_bytes, artifact_kind")
        .in("id", unique)
        .eq("artifact_kind", "manual_output");
      if (error) throw error;
      const valid = new Set<string>();
      for (const row of data ?? []) {
        const sha = String(row.sha256 ?? "");
        if (
          sha.length === 64 &&
          /^[a-f0-9]{64}$/.test(sha) &&
          Number(row.size_bytes) > 0
        ) {
          valid.add(String(row.id));
        }
      }
      return valid;
    },
  };
}
