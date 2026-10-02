import { NextResponse } from "next/server";
import {
  buildMbaComplianceReport,
  createMbaServiceRoleSupabaseClient,
  createMbaEventLedger,
  createMbaTimerLedger,
  observeCapa1Outputs,
  observeParallelProductionOutputs,
} from "@/services/mba/index.mjs";
import { persistMbaControlPlaneState } from "@/services/mba/supabase-persistence.mjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const ledger = createMbaEventLedger({ env: process.env });
    const timerLedger = createMbaTimerLedger();
    const capa1 = body.capa1
      ? observeCapa1Outputs(
          { ...body.capa1, case_id: body.caseId ?? body.case_id },
          { ledger, timerLedger },
        )
      : { hard_gate_candidates: [], findings: [] };
    const parallelProduction = body.parallelProduction
      ? observeParallelProductionOutputs(
          { ...body.parallelProduction, case_id: body.caseId ?? body.case_id },
          { ledger, timerLedger },
        )
      : { hard_gate_candidates: [], findings: [] };
    const report = buildMbaComplianceReport({
      case_id: body.caseId ?? body.case_id,
      ledger,
      timerLedger,
      hard_gate_candidates: [
        ...(capa1.hard_gate_candidates ?? []),
        ...(parallelProduction.hard_gate_candidates ?? []),
      ],
      extra_findings: [
        ...(capa1.findings ?? []),
        ...(parallelProduction.findings ?? []),
      ],
    });
    const serviceRole = createMbaServiceRoleSupabaseClient(process.env);
    const persistence = await persistMbaControlPlaneState({
      supabase: serviceRole.client,
      ledger,
      timerLedger,
      report,
      extraFindings: [
        ...(capa1.findings ?? []),
        ...(parallelProduction.findings ?? []),
      ],
      missingClientContext: serviceRole.client
        ? null
        : {
            error_code: serviceRole.error_code,
            error_message: serviceRole.error_message,
            table_name: null,
          },
    });

    return NextResponse.json({
      ok: true,
      mode: report.operation_mode,
      report,
      persistence,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to observe MBA control plane inputs.",
      },
      { status: 500 },
    );
  }
}
