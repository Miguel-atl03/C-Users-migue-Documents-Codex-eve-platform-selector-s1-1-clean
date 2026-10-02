import { NextRequest, NextResponse } from "next/server";
import { assertConsultantControlPanelAccess } from "@/services/eve/consultant-control-panel/consultant-control-panel-access";
import { handleDownloadRequest } from "@/services/eve/consultant-control-panel/consultant-control-panel-service";
import type { DownloadRequestBody } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";

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

  let body: DownloadRequestBody;
  try {
    body = (await request.json()) as DownloadRequestBody;
  } catch {
    return NextResponse.json(
      {
        status: "blocked",
        error: "invalid_request",
        consultant_safe_message: "La solicitud no pudo procesarse.",
      },
      { status: 400 },
    );
  }

  const result = handleDownloadRequest(body);
  const status = result.status === "blocked" ? 400 : 503;
  return NextResponse.json(result, { status });
}
