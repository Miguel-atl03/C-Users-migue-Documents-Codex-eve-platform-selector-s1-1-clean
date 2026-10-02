"use client";

import { useMemo } from "react";
import { SignificadoDeTuTrabajo } from "@/components/significado/SignificadoDeTuTrabajo";
import {
  SIGNIFICADO_DEV_SESSION_ID,
  buildSignificadoBlock0DevPrefill,
  createSignificadoBlock0DevWorkMap,
  resolveSignificadoBlock0DevPrimarySelection,
} from "@/features/significado/significado-dev-fixture";

export default function SignificadoDevPage() {
  const workMap = useMemo(() => createSignificadoBlock0DevWorkMap(), []);
  const primaryActivitySelectionResult = useMemo(
    () => resolveSignificadoBlock0DevPrimarySelection(workMap),
    [workMap],
  );
  const block0Prefill = useMemo(
    () => buildSignificadoBlock0DevPrefill(workMap, primaryActivitySelectionResult),
    [workMap, primaryActivitySelectionResult],
  );
  void block0Prefill;

  return (
    <>
      <div className="border-b border-neutral-200 bg-[#f7f7f2] px-4 py-2 text-center text-xs text-neutral-600">
        Dev fixture · WorkMap → Block 0 prefill builder ·{" "}
        <a
          className="font-medium text-emerald-800 hover:underline"
          href={`/admin/significado-trace/${encodeURIComponent(SIGNIFICADO_DEV_SESSION_ID)}`}
        >
          Ver trazabilidad de consultor
        </a>
      </div>
      <SignificadoDeTuTrabajo
        layout="standalone"
        onBack={() => window.history.back()}
        onContinue={() => undefined}
        primaryActivitySelectionResult={primaryActivitySelectionResult}
        sessionId={SIGNIFICADO_DEV_SESSION_ID}
        userDisplayName="Miguel García"
        workMap={workMap}
      />
    </>
  );
}
