import { NextResponse } from "next/server";

import { buildSafeOfficialPanelErrorBody } from "./official-control-panel-contract-normalize";
import type { PanelDataAvailability } from "./official-control-panel-contract.types";
import { createOfficialPanelRequestId } from "./official-control-panel-observability";

export function officialPanelNoStoreJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function officialPanelErrorResponse(input: {
  requestId: string;
  status: number;
  code: string;
  message: string;
  retryable?: boolean;
  dataStatus?: PanelDataAvailability;
}) {
  return officialPanelNoStoreJson(
    buildSafeOfficialPanelErrorBody({
      code: input.code,
      requestId: input.requestId,
      message: input.message,
      retryable: input.retryable,
      dataStatus: input.dataStatus,
    }),
    input.status,
  );
}

/** Ensure every BFF handler has a requestId even if observability was omitted. */
export function ensureOfficialPanelRequestId(existing?: string | null): string {
  if (existing && existing.trim().length > 0) return existing;
  return createOfficialPanelRequestId();
}
