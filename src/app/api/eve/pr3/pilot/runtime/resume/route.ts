import { NextRequest } from "next/server";
import type { Pr3ResumeCommand } from "@/services/eve/pr3/contracts";
import { executionHttp, parseJsonBody, pr3Context, safeError } from "@/services/eve/pr3/http";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try { const {principal,service}=await pr3Context(request); const body=await parseJsonBody<Pr3ResumeCommand>(request); return executionHttp(await service.resume(principal,body)); }
  catch(error){ return safeError(error); }
}
