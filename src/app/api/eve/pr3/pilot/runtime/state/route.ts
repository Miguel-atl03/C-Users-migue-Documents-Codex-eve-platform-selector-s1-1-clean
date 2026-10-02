import { NextRequest, NextResponse } from "next/server";
import { pr3Context, safeError } from "@/services/eve/pr3/http";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const {service}=await pr3Context(request);
    const chainRunId=request.nextUrl.searchParams.get("chain_run_id")?.trim();
    if(!chainRunId) return NextResponse.json({error:"missing_chain_run_id"},{status:400});
    const state=await service.readState(chainRunId);
    if(!state) return NextResponse.json({error:"not_found"},{status:404});
    return NextResponse.json(state,{status:200,headers:{"Cache-Control":"private, no-store",ETag:`\"${Buffer.from(JSON.stringify(state)).toString("base64url").slice(0,32)}\"`}});
  } catch(error){ return safeError(error); }
}
