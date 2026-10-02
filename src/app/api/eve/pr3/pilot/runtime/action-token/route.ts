import { NextRequest, NextResponse } from "next/server";
import type { Pr3ActionTokenRequest } from "@/services/eve/pr3/contracts";
import { parseJsonBody, pr3Context, safeError } from "@/services/eve/pr3/http";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { principal, service } = await pr3Context(request);
    const body = await parseJsonBody<Pr3ActionTokenRequest>(request);
    if (!body.token_request_id || !body.operation) return NextResponse.json({ error:"invalid_request" }, { status:400 });
    const result = await service.issueActionToken(principal, body);
    return NextResponse.json(result, { status:200 });
  } catch (error) { return safeError(error); }
}
