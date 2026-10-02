import { NextResponse } from "next/server";
import {
  buildMbaComplianceReport,
  createMbaServiceRoleSupabaseClient,
  createMbaEventLedger,
  createMbaTimerLedger,
} from "@/services/mba/index.mjs";
import { persistMbaControlPlaneState } from "@/services/mba/supabase-persistence.mjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const ledger = createMbaEventLedger({ env: process.env });
    const timerLedger = createMbaTimerLedger();

    for (const event of body.events ?? []) {
      ledger.recordEvent(event);
    }
    for (const timer of body.timers ?? []) {
      timerLedger.startTimer(timer);
    }

    const report = buildMbaComplianceReport({
      case_id: body.caseId ?? body.case_id,
      ledger,
      timerLedger,
      hard_gate_candidates: body.hard_gate_candidates ?? [],
    });
    const serviceRole = createMbaServiceRoleSupabaseClient(process.env);
    const persistence = await persistMbaControlPlaneState({
      supabase: serviceRole.client,
      ledger,
      timerLedger,
      report,
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
      report,
      persistence,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to build MBA compliance report.",
      },
      { status: 500 },
    );
  }
}
