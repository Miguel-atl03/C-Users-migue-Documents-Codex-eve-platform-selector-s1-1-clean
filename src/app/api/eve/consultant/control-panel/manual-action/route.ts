import { NextRequest, NextResponse } from "next/server";
import { assertConsultantControlPanelAccess } from "@/services/eve/consultant-control-panel/consultant-control-panel-access";
import { handleManualActionRequest } from "@/services/eve/consultant-control-panel/consultant-control-panel-service";
import type { ManualActionRequest } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = assertConsultantControlPanelAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      {
        error: access.error,
        consultant_safe_message: access.consultant_safe_message,
      },
      { status: access.status },
    );
  }

  let body: ManualActionRequest;
  try {
    body = (await request.json()) as ManualActionRequest;
  } catch {
    return NextResponse.json(
      {
        status: "rejected",
        error: "invalid_request",
        consultant_safe_message: "La solicitud no pudo procesarse.",
      },
      { status: 400 },
    );
  }

  const result = handleManualActionRequest(body);
  const status =
    result.status === "rejected"
      ? 400
      : result.status === "disabled_requires_audited_endpoint"
        ? 503
        : 200;

  return NextResponse.json(result, { status });
}
