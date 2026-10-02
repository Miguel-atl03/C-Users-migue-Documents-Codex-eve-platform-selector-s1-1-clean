import { NextRequest, NextResponse } from "next/server";
import { assertConsultantControlPanelAccess } from "@/services/eve/consultant-control-panel/consultant-control-panel-access";
import {
  buildConsultantControlPanelState,
  parseControlPanelFilters,
  parseControlPanelInclude,
  resolveControlPanelFixtureQuery,
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
  const include = parseControlPanelInclude(request.nextUrl.searchParams);
  const fixtureQuery = resolveControlPanelFixtureQuery(request.nextUrl.searchParams);
  const state = buildConsultantControlPanelState({
    filters,
    role: access.role,
    fixtureQuery,
    include,
  });

  return NextResponse.json(state, {
    status: 200,
    headers: {
      "X-EVE-Contract-Version": "1.0",
      "Cache-Control": "private, no-store",
    },
  });
}
