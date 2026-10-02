import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivityRuntimeRunScope,
  BranchingDecisionRow,
  InteractionInstanceRow,
  InteractionMappingRow,
  OfficialControlPanelRuntimeMatrixRepository,
  SourceNodeRefRow,
  SubfieldResponseRow,
} from "./official-control-panel-runtime-matrix.types";
import type {
  RuntimeControlSnapshotRecord,
  RuntimeGapSummary,
  RuntimeManualReviewSummary,
  RuntimeReentrySummary,
  RuntimeTimerSummary,
} from "./official-control-panel-runtime-control.types";
import {
  mapDecisionToManualReview,
  mapDecisionToReentry,
  mapGapRow,
  mapTimerRow,
} from "./official-control-panel-runtime-control-service";

/**
 * Schema shapes observed:
 * - draft_p3 (local preview): PK `id`, FK `run_id`, branching `opened_interaction_id` text
 * - canonical: PK `activity_runtime_run_id`, FK same name, opened instance UUID
 *
 * Domain contract stays stable; physical selects adapt after detection.
 */
export type RuntimeMatrixSchemaShape = "draft_p3" | "canonical";

let cachedShape: RuntimeMatrixSchemaShape | null = null;

export async function detectRuntimeMatrixSchemaShape(
  client: SupabaseClient,
): Promise<RuntimeMatrixSchemaShape> {
  if (cachedShape) return cachedShape;
  const { data, error } = await client
    .from("activity_runtime_run")
    .select("*")
    .limit(0);
  // Prefer information_schema via rpc-less heuristic: try select of canonical PK.
  void data;
  void error;

  const probe = await client
    .from("activity_runtime_run")
    .select("activity_runtime_run_id")
    .limit(1);
  if (!probe.error) {
    cachedShape = "canonical";
    return cachedShape;
  }

  const draftProbe = await client
    .from("activity_runtime_run")
    .select("id")
    .limit(1);
  if (!draftProbe.error) {
    cachedShape = "draft_p3";
    return cachedShape;
  }

  // Fail closed to draft for local preview tooling if both probes fail oddly.
  cachedShape = "draft_p3";
  return cachedShape;
}

export function resetRuntimeMatrixSchemaShapeCache(): void {
  cachedShape = null;
}

type CausalEvaluationRow = {
  id: string;
  activity_runtime_run_id: string;
  causal_code: string;
  lifecycle_state: string;
  closure_state: string | null;
  activation_state: string | null;
  blocking_state: string | null;
  branching_decision_id: string | null;
  canonical_route_closed: boolean | null;
  evidence_complete: boolean | null;
  blocks_full_readiness_factually: boolean | null;
  catalog_version_id: string | null;
};

type CausalVariableResolutionRow = {
  id: string;
  causal_evaluation_id: string;
  variable_code: string;
  resolution_state: string;
  required_variable_rule_id: string | null;
  invalidated_at: string | null;
};

export type EffectiveCausalEvaluationRecord = {
  id: string;
  runId: string;
  causalCode: string;
  closureState: string | null;
  activationState: string | null;
  blockingState: string | null;
  branchingDecisionId: string | null;
  canonicalRouteClosed: boolean | null;
  evidenceComplete: boolean | null;
  blocksFullReadinessFactually: boolean | null;
  catalogVersionId: string | null;
  resolutions: Array<{
    variableCode: string;
    resolutionState: string;
    requiredVariableRuleId: string | null;
  }>;
};

export type OfficialControlPanelRuntimeMatrixRepositoryExtended =
  OfficialControlPanelRuntimeMatrixRepository & {
    listEffectiveCausalEvaluationsByRun(
      runId: string,
    ): Promise<EffectiveCausalEvaluationRecord[]>;
    listRequiredVariableRules(input: {
      catalogVersionId: string;
      causalCodes?: string[];
    }): Promise<
      Array<{
        id: string;
        causalCode: string;
        variableCode: string;
        requirementGroup: string;
        requirementOperator: "all_of" | "one_of";
        allowNotApplicableWithEvidence: boolean;
        sequence: number;
      }>
    >;
    findEffectiveControlSnapshot(
      runId: string,
    ): Promise<RuntimeControlSnapshotRecord | null>;
    listReadinessGapsByRun(runId: string): Promise<RuntimeGapSummary[]>;
    listProcessStateTimersByRun(runId: string): Promise<RuntimeTimerSummary[]>;
    listReentriesByRun(runId: string): Promise<RuntimeReentrySummary[]>;
    listManualReviewsByRun(runId: string): Promise<RuntimeManualReviewSummary[]>;
  };

/**
 * Lectura factual para matrices Base/Causal + ledger causal effective.
 * No inventa resoluciones; ausencia de ledger = not_evaluated.
 */
export function createOfficialControlPanelRuntimeMatrixRepository(
  client: SupabaseClient,
): OfficialControlPanelRuntimeMatrixRepositoryExtended {
  return {
    async findRunById(runId) {
      const shape = await detectRuntimeMatrixSchemaShape(client);
      if (shape === "canonical") {
        const { data, error } = await client
          .from("activity_runtime_run")
          .select(
            "activity_runtime_run_id, activity_id, role_runtime_session_id, state, catalog_version_id, sesion_id",
          )
          .eq("activity_runtime_run_id", runId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const row = data as Record<string, unknown>;
        let caseId = "";
        const sessionId = String(row.role_runtime_session_id ?? "");
        if (sessionId) {
          const session = await client
            .from("role_runtime_session")
            .select("case_id")
            .eq("role_runtime_session_id", sessionId)
            .maybeSingle();
          caseId = String(session.data?.case_id ?? "");
        }
        return {
          id: String(row.activity_runtime_run_id),
          caseId,
          activityId: (row.activity_id as string | null) ?? null,
          roleRuntimeSessionId: sessionId,
          state: String(row.state ?? ""),
          catalogVersionId: (row.catalog_version_id as string | null) ?? null,
        } satisfies ActivityRuntimeRunScope;
      }

      const { data, error } = await client
        .from("activity_runtime_run")
        .select(
          "id, case_id, activity_id, role_runtime_session_id, state, catalog_version_id",
        )
        .eq("id", runId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as Record<string, unknown>;
      return {
        id: String(row.id),
        caseId: String(row.case_id ?? ""),
        activityId: (row.activity_id as string | null) ?? null,
        roleRuntimeSessionId: String(row.role_runtime_session_id ?? ""),
        state: String(row.state ?? ""),
        catalogVersionId: (row.catalog_version_id as string | null) ?? null,
      } satisfies ActivityRuntimeRunScope;
    },

    async listBranchingDecisionsByRun(runId) {
      const shape = await detectRuntimeMatrixSchemaShape(client);
      if (shape === "canonical") {
        const { data, error } = await client
          .from("branching_decision")
          .select(
            "branching_decision_id, activity_runtime_run_id, role_runtime_session_id, opened_interaction_instance_id, closed_interaction_instance_id, trigger_signal, reason, decision_type, target_runtime_interaction_id",
          )
          .eq("activity_runtime_run_id", runId)
          .order("created_at", { ascending: true });
        if (error) throw error;

        const rows = (data ?? []) as Array<Record<string, unknown>>;
        const instanceIds = [
          ...new Set(
            rows
              .flatMap((r) => [
                r.opened_interaction_instance_id,
                r.closed_interaction_instance_id,
              ])
              .filter((v): v is string => typeof v === "string" && Boolean(v)),
          ),
        ];
        const instanceMap = new Map<string, string>();
        if (instanceIds.length > 0) {
          const { data: instances, error: instError } = await client
            .from("runtime_interaction_instance")
            .select("runtime_interaction_instance_id, runtime_interaction_id")
            .in("runtime_interaction_instance_id", instanceIds);
          if (instError) throw instError;
          for (const inst of instances ?? []) {
            const i = inst as Record<string, unknown>;
            instanceMap.set(
              String(i.runtime_interaction_instance_id),
              String(i.runtime_interaction_id),
            );
          }
        }

        return rows.map((row): BranchingDecisionRow => {
          const openedInst = row.opened_interaction_instance_id
            ? instanceMap.get(String(row.opened_interaction_instance_id))
            : null;
          const closedInst = row.closed_interaction_instance_id
            ? instanceMap.get(String(row.closed_interaction_instance_id))
            : null;
          const target =
            typeof row.target_runtime_interaction_id === "string"
              ? row.target_runtime_interaction_id
              : null;
          return {
            id: String(row.branching_decision_id),
            runId: String(row.activity_runtime_run_id),
            caseId: "",
            activityId: null,
            openedInteractionId: openedInst ?? target ?? null,
            closedInteractionId: closedInst ?? null,
            triggerSignal: (row.trigger_signal as string | null) ?? null,
            reason: String(row.reason ?? ""),
            decisionType: String(row.decision_type ?? ""),
            roleRuntimeSessionId:
              (row.role_runtime_session_id as string | null) ?? null,
          };
        });
      }

      const { data, error } = await client
        .from("branching_decision")
        .select(
          "id, run_id, case_id, activity_id, opened_interaction_id, closed_interaction_id, trigger_signal, reason, decision_type",
        )
        .eq("run_id", runId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(
        (row): BranchingDecisionRow => ({
          id: String(row.id),
          runId: String(row.run_id),
          caseId: String(row.case_id ?? ""),
          activityId: (row.activity_id as string | null) ?? null,
          openedInteractionId:
            (row.opened_interaction_id as string | null) ?? null,
          closedInteractionId:
            (row.closed_interaction_id as string | null) ?? null,
          triggerSignal: (row.trigger_signal as string | null) ?? null,
          reason: String(row.reason ?? ""),
          decisionType: String(row.decision_type ?? ""),
        }),
      );
    },

    async listInteractionInstancesByRun(runId) {
      const shape = await detectRuntimeMatrixSchemaShape(client);
      if (shape === "canonical") {
        const { data, error } = await client
          .from("runtime_interaction_instance")
          .select(
            "runtime_interaction_instance_id, activity_runtime_run_id, runtime_interaction_id, state, skipped_reason",
          )
          .eq("activity_runtime_run_id", runId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return ((data ?? []) as Array<Record<string, unknown>>).map(
          (row): InteractionInstanceRow => ({
            id: String(row.runtime_interaction_instance_id),
            runId: String(row.activity_runtime_run_id),
            runtimeInteractionId: String(row.runtime_interaction_id),
            activityId: null,
            state: String(row.state ?? ""),
            skippedReason: (row.skipped_reason as string | null) ?? null,
          }),
        );
      }

      const { data, error } = await client
        .from("runtime_interaction_instance")
        .select(
          "id, run_id, runtime_interaction_id, activity_id, state, skipped_reason",
        )
        .eq("run_id", runId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(
        (row): InteractionInstanceRow => ({
          id: String(row.id),
          runId: String(row.run_id),
          runtimeInteractionId: String(row.runtime_interaction_id),
          activityId: (row.activity_id as string | null) ?? null,
          state: String(row.state ?? ""),
          skippedReason: (row.skipped_reason as string | null) ?? null,
        }),
      );
    },

    async listInteractionMappingsByCatalogVersion(catalogVersionId) {
      const shape = await detectRuntimeMatrixSchemaShape(client);
      if (shape === "canonical") {
        const { data, error } = await client
          .from("runtime_interaction_mapping")
          .select(
            "runtime_interaction_id, source_node_ref_id, mapping_role, catalog_version_id",
          )
          .eq("catalog_version_id", catalogVersionId);
        if (error) throw error;
        return ((data ?? []) as Array<Record<string, unknown>>).map(
          (row): InteractionMappingRow => ({
            runtimeInteractionId: String(row.runtime_interaction_id),
            sourceNodeRef: String(row.source_node_ref_id ?? ""),
            mappingRole: String(row.mapping_role ?? ""),
            catalogVersionId: String(row.catalog_version_id),
          }),
        );
      }

      const { data, error } = await client
        .from("runtime_interaction_mapping")
        .select(
          "runtime_interaction_id, source_node_ref, mapping_role, catalog_version_id",
        )
        .eq("catalog_version_id", catalogVersionId)
        .eq("active", true);
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(
        (row): InteractionMappingRow => ({
          runtimeInteractionId: String(row.runtime_interaction_id),
          sourceNodeRef: String(row.source_node_ref ?? ""),
          mappingRole: String(row.mapping_role ?? ""),
          catalogVersionId: String(row.catalog_version_id),
        }),
      );
    },

    async listSourceNodeRefsByCatalogVersion(catalogVersionId) {
      const shape = await detectRuntimeMatrixSchemaShape(client);
      if (shape === "canonical") {
        const { data, error } = await client
          .from("source_node_ref")
          .select(
            "source_node_ref_id, source_code, catalog_version_id, source_node_id",
          )
          .eq("catalog_version_id", catalogVersionId);
        if (error) throw error;
        return ((data ?? []) as Array<Record<string, unknown>>).map(
          (row): SourceNodeRefRow => ({
            sourceNodeRef: String(row.source_node_ref_id ?? ""),
            sourceQuestionCode:
              (row.source_code as string | null) ??
              (row.source_node_id as string | null) ??
              null,
            catalogVersionId: String(row.catalog_version_id),
          }),
        );
      }

      const { data, error } = await client
        .from("source_node_ref")
        .select("source_node_ref, source_question_code, catalog_version_id")
        .eq("catalog_version_id", catalogVersionId)
        .eq("active", true);
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(
        (row): SourceNodeRefRow => ({
          sourceNodeRef: String(row.source_node_ref ?? ""),
          sourceQuestionCode: (row.source_question_code as string | null) ?? null,
          catalogVersionId: String(row.catalog_version_id),
        }),
      );
    },

    async listSubfieldResponsesByRun(runId) {
      const shape = await detectRuntimeMatrixSchemaShape(client);
      if (shape === "canonical") {
        const { data, error } = await client
          .from("runtime_subfield_response")
          .select(
            "subfield_response_id, activity_runtime_run_id, runtime_interaction_instance_id, epistemic_status",
          )
          .eq("activity_runtime_run_id", runId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return ((data ?? []) as Array<Record<string, unknown>>).map(
          (row): SubfieldResponseRow => ({
            id: String(row.subfield_response_id),
            runId: String(row.activity_runtime_run_id),
            interactionInstanceId: String(
              row.runtime_interaction_instance_id ?? "",
            ),
            epistemicStatus: String(row.epistemic_status ?? ""),
          }),
        );
      }

      const { data, error } = await client
        .from("runtime_subfield_response")
        .select("id, run_id, interaction_id, epistemic_status")
        .eq("run_id", runId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(
        (row): SubfieldResponseRow => ({
          id: String(row.id),
          runId: String(row.run_id),
          interactionInstanceId: String(row.interaction_id ?? ""),
          epistemicStatus: String(row.epistemic_status ?? ""),
        }),
      );
    },

    async listEffectiveCausalEvaluationsByRun(runId) {
      const { data, error } = await client
        .from("runtime_causal_evaluations")
        .select(
          "id, activity_runtime_run_id, causal_code, lifecycle_state, closure_state, activation_state, blocking_state, branching_decision_id, canonical_route_closed, evidence_complete, blocks_full_readiness_factually, catalog_version_id",
        )
        .eq("activity_runtime_run_id", runId)
        .eq("lifecycle_state", "effective");
      if (error) {
        // Table may not exist yet in older DBs — degrade to empty.
        if (String(error.message ?? "").includes("does not exist")) return [];
        throw error;
      }
      const evaluations = (data ?? []) as CausalEvaluationRow[];
      if (evaluations.length === 0) return [];

      const ids = evaluations.map((e) => e.id);
      const { data: resolutions, error: resError } = await client
        .from("runtime_causal_variable_resolutions")
        .select(
          "id, causal_evaluation_id, variable_code, resolution_state, required_variable_rule_id, invalidated_at",
        )
        .in("causal_evaluation_id", ids);
      if (resError) throw resError;

      const byEval = new Map<string, CausalVariableResolutionRow[]>();
      for (const row of (resolutions ?? []) as CausalVariableResolutionRow[]) {
        const list = byEval.get(row.causal_evaluation_id) ?? [];
        list.push(row);
        byEval.set(row.causal_evaluation_id, list);
      }

      return evaluations.map((e) => ({
        id: e.id,
        runId: e.activity_runtime_run_id,
        causalCode: e.causal_code,
        closureState: e.closure_state,
        activationState: e.activation_state,
        blockingState: e.blocking_state,
        branchingDecisionId: e.branching_decision_id,
        canonicalRouteClosed: e.canonical_route_closed,
        evidenceComplete: e.evidence_complete,
        blocksFullReadinessFactually: e.blocks_full_readiness_factually,
        catalogVersionId: e.catalog_version_id,
        resolutions: (byEval.get(e.id) ?? [])
          .filter((r) => !r.invalidated_at)
          .map((r) => ({
            variableCode: r.variable_code,
            resolutionState: r.resolution_state,
            requiredVariableRuleId: r.required_variable_rule_id,
          })),
      }));
    },

    async listRequiredVariableRules(input) {
      let query = client
        .from("runtime_causal_required_variable_rules")
        .select(
          "id, causal_code, variable_code, requirement_group, requirement_operator, allow_not_applicable_with_evidence, sequence",
        )
        .eq("catalog_version_id", input.catalogVersionId)
        .eq("enabled", true)
        .order("sequence", { ascending: true });
      if (input.causalCodes?.length) {
        query = query.in("causal_code", input.causalCodes);
      }
      const { data, error } = await query;
      if (error) {
        if (String(error.message ?? "").includes("does not exist")) return [];
        throw error;
      }
      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        causalCode: String(row.causal_code),
        variableCode: String(row.variable_code),
        requirementGroup: String(row.requirement_group),
        requirementOperator: row.requirement_operator as "all_of" | "one_of",
        allowNotApplicableWithEvidence: Boolean(
          row.allow_not_applicable_with_evidence,
        ),
        sequence: Number(row.sequence ?? 0),
      }));
    },

    async findEffectiveControlSnapshot(runId) {
      const { data, error } = await client
        .from("runtime_run_control_snapshots")
        .select(
          "id, activity_runtime_run_id, snapshot_version, lifecycle_state, readiness_state, active_gap_count, blocking_gap_count, active_timer_count, overdue_timer_count, reentry_required, manual_review_required, blocking_base_ids, blocking_causal_ids, restricted_scopes, source_state_hash, effective_at",
        )
        .eq("activity_runtime_run_id", runId)
        .eq("lifecycle_state", "effective")
        .maybeSingle();
      if (error) {
        if (String(error.message ?? "").includes("does not exist")) return null;
        throw error;
      }
      if (!data) return null;
      const row = data as Record<string, unknown>;
      return {
        id: String(row.id),
        runId: String(row.activity_runtime_run_id),
        snapshotVersion: Number(row.snapshot_version ?? 0),
        lifecycleState: String(row.lifecycle_state),
        readinessState: String(row.readiness_state),
        activeGapCount: Number(row.active_gap_count ?? 0),
        blockingGapCount: Number(row.blocking_gap_count ?? 0),
        activeTimerCount: Number(row.active_timer_count ?? 0),
        overdueTimerCount: Number(row.overdue_timer_count ?? 0),
        reentryRequired: Boolean(row.reentry_required),
        manualReviewRequired: Boolean(row.manual_review_required),
        blockingBaseIds: Array.isArray(row.blocking_base_ids)
          ? row.blocking_base_ids.map(String)
          : [],
        blockingCausalIds: Array.isArray(row.blocking_causal_ids)
          ? row.blocking_causal_ids.map(String)
          : [],
        restrictedScopes: Array.isArray(row.restricted_scopes)
          ? row.restricted_scopes.map(String)
          : [],
        sourceStateHash:
          typeof row.source_state_hash === "string"
            ? row.source_state_hash
            : null,
        effectiveAt:
          typeof row.effective_at === "string" ? row.effective_at : null,
      };
    },

    async listReadinessGapsByRun(runId) {
      const { data, error } = await client
        .from("readiness_gap_record")
        .select(
          "id, run_id, gap_type, affected_route, severity, status, created_at, updated_at, metadata, reentry_target, manual_review_flag",
        )
        .eq("run_id", runId)
        .order("created_at", { ascending: true });
      if (error) {
        if (String(error.message ?? "").includes("does not exist")) return [];
        throw error;
      }
      return ((data ?? []) as Array<Record<string, unknown>>).map(mapGapRow);
    },

    async listProcessStateTimersByRun(runId) {
      const { data, error } = await client
        .from("process_state_timer_event")
        .select(
          "id, run_id, gate_id, awaited_event, release_condition, timeout_state, created_at, updated_at, metadata",
        )
        .eq("run_id", runId)
        .order("created_at", { ascending: true });
      if (error) {
        if (String(error.message ?? "").includes("does not exist")) return [];
        throw error;
      }
      return ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
        mapTimerRow(row),
      );
    },

    async listReentriesByRun(runId) {
      const out: RuntimeReentrySummary[] = [];
      const { data: decisions, error: dErr } = await client
        .from("readiness_decision_record")
        .select(
          "id, run_id, readiness_state, reason, reentry_target, dominant_gate, created_at, metadata",
        )
        .eq("run_id", runId);
      if (dErr) {
        if (String(dErr.message ?? "").includes("does not exist")) return [];
        throw dErr;
      }
      for (const row of (decisions ?? []) as Array<Record<string, unknown>>) {
        const mapped = mapDecisionToReentry(row);
        if (mapped) out.push(mapped);
      }

      const { data: gaps, error: gErr } = await client
        .from("readiness_gap_record")
        .select(
          "id, run_id, status, reentry_target, affected_route, created_at, metadata",
        )
        .eq("run_id", runId);
      if (gErr) {
        if (String(gErr.message ?? "").includes("does not exist")) return out;
        throw gErr;
      }
      for (const row of (gaps ?? []) as Array<Record<string, unknown>>) {
        const target =
          typeof row.reentry_target === "string" ? row.reentry_target.trim() : "";
        if (!target) continue;
        const metadata =
          row.metadata && typeof row.metadata === "object"
            ? (row.metadata as Record<string, unknown>)
            : {};
        out.push({
          id: String(row.id),
          sourceInteractionId:
            typeof row.affected_route === "string"
              ? row.affected_route
              : typeof metadata.source_interaction_id === "string"
                ? metadata.source_interaction_id
                : null,
          targetBlock: target,
          reason: "gap_reentry_target",
          status: typeof row.status === "string" ? row.status : null,
          openedAt: typeof row.created_at === "string" ? row.created_at : null,
          resolvedAt:
            typeof metadata.resolved_at === "string"
              ? metadata.resolved_at
              : null,
        });
      }
      return out;
    },

    async listManualReviewsByRun(runId) {
      const out: RuntimeManualReviewSummary[] = [];
      const { data: decisions, error: dErr } = await client
        .from("readiness_decision_record")
        .select(
          "id, run_id, readiness_state, reason, manual_review_required, created_at, metadata",
        )
        .eq("run_id", runId)
        .eq("manual_review_required", true);
      if (dErr) {
        if (String(dErr.message ?? "").includes("does not exist")) return [];
        throw dErr;
      }
      for (const row of (decisions ?? []) as Array<Record<string, unknown>>) {
        const mapped = mapDecisionToManualReview(row);
        if (mapped) out.push(mapped);
      }

      const { data: gaps, error: gErr } = await client
        .from("readiness_gap_record")
        .select(
          "id, run_id, status, manual_review_flag, affected_route, created_at, metadata",
        )
        .eq("run_id", runId)
        .eq("manual_review_flag", true);
      if (gErr) {
        if (String(gErr.message ?? "").includes("does not exist")) return out;
        throw gErr;
      }
      for (const row of (gaps ?? []) as Array<Record<string, unknown>>) {
        const mapped = mapDecisionToManualReview({
          ...row,
          reason: "gap_manual_review_flag",
        });
        if (mapped) out.push(mapped);
      }
      return out;
    },
  };
}
