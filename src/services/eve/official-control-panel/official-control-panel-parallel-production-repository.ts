import type { SupabaseClient } from "@supabase/supabase-js";

export type ParallelProductionPackageRow = {
  id: string;
  company_id: string;
  case_id: string;
  package_ref: string;
  package_status: string;
  readiness_status: string | null;
  aca_status: string | null;
  conformance_status: string;
  consistency_factual_status: string;
  consistency_temporal_status: string;
  consistency_structural_status: string;
  consistency_composite_status: string;
  b3_route_exception: boolean;
  b7_boundary_violation: boolean;
  export_eligibility: string;
  generator_available: boolean;
  export_generation_status: string;
  rework_process_code: string | null;
  source_bundle_ref: string | null;
  candidates_ref: string | null;
  facts_ref: string | null;
  registries_ref: string | null;
  ir_ref: string | null;
  inventory_ref: string | null;
  version: number;
  is_current: boolean;
  last_event_at: string | null;
};

export type ParallelProductionPackageEventRow = {
  id: string;
  package_id: string;
  event_type: string;
  actor_label: string;
  occurred_at: string;
  before_status: string;
  after_status: string;
  reason: string | null;
  evidence_ref: string | null;
};

export type ParallelProductionFindingRow = {
  id: string;
  package_id: string;
  finding_type: string;
  affected_model: string | null;
  severity: string | null;
  evidence_ref: string;
  origin: string;
  finding_status: string;
  rework_process_code: string;
  blocking: boolean;
  resolution_ref: string | null;
  opened_at: string;
  resolved_at: string | null;
};

export type ParallelProductionRepository = {
  getCurrentPackageForCase: (
    caseId: string,
  ) => Promise<ParallelProductionPackageRow | null>;
  listEventsForPackage: (
    packageId: string,
  ) => Promise<ParallelProductionPackageEventRow[]>;
  listFindingsForPackage: (
    packageId: string,
  ) => Promise<ParallelProductionFindingRow[]>;
};

const PACKAGE_COLS = [
  "id",
  "company_id",
  "case_id",
  "package_ref",
  "package_status",
  "readiness_status",
  "aca_status",
  "conformance_status",
  "consistency_factual_status",
  "consistency_temporal_status",
  "consistency_structural_status",
  "consistency_composite_status",
  "b3_route_exception",
  "b7_boundary_violation",
  "export_eligibility",
  "generator_available",
  "export_generation_status",
  "rework_process_code",
  "source_bundle_ref",
  "candidates_ref",
  "facts_ref",
  "registries_ref",
  "ir_ref",
  "inventory_ref",
  "version",
  "is_current",
  "last_event_at",
].join(",");

export function createOfficialControlPanelParallelProductionRepository(
  client: SupabaseClient,
): ParallelProductionRepository {
  return {
    async getCurrentPackageForCase(caseId) {
      const { data, error } = await client
        .from("parallel_production_package")
        .select(PACKAGE_COLS)
        .eq("case_id", caseId)
        .eq("is_current", true)
        .maybeSingle();
      if (error) throw error;
      return (data as ParallelProductionPackageRow | null) ?? null;
    },

    async listEventsForPackage(packageId) {
      const { data, error } = await client
        .from("parallel_production_package_event")
        .select(
          "id,package_id,event_type,actor_label,occurred_at,before_status,after_status,reason,evidence_ref",
        )
        .eq("package_id", packageId)
        .order("occurred_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ParallelProductionPackageEventRow[];
    },

    async listFindingsForPackage(packageId) {
      const { data, error } = await client
        .from("parallel_production_qa_finding")
        .select(
          "id,package_id,finding_type,affected_model,severity,evidence_ref,origin,finding_status,rework_process_code,blocking,resolution_ref,opened_at,resolved_at",
        )
        .eq("package_id", packageId)
        .order("opened_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ParallelProductionFindingRow[];
    },
  };
}
