import { NextRequest, NextResponse } from "next/server";
import { assertConsultantControlPanelAccess } from "@/services/eve/consultant-control-panel/consultant-control-panel-access";
import {
  buildConsultantControlPanelState,
  parseControlPanelFilters,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  const filters = parseControlPanelFilters(request.nextUrl.searchParams);
  const state = buildConsultantControlPanelState({ filters, role: access.role });
  return NextResponse.json(state.area_2_client_progress, { status: 200 });
}
