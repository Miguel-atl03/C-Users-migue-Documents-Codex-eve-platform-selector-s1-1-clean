import { NextResponse } from "next/server";
import { buildRuntimeVsmSnapshot } from "@/runtime-vsm/runtime-vsm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const since = url.searchParams.get("since") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const snapshot = await buildRuntimeVsmSnapshot({ since, limit });
    return NextResponse.json(snapshot, { status: snapshot.status === "red" ? 500 : 200 });
  } catch (error) {
    return NextResponse.json(
      { status: "red", error: error instanceof Error ? error.message : "runtime_vsm_failed" },
      { status: 500 },
    );
  }
}