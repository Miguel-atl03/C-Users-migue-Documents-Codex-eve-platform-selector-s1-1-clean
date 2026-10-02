import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePr3Principal, Pr3AuthError } from "./auth";
import { createPr3Repository } from "./repository";
import { Pr3ExecutionService, isPr3CommandConflict } from "./execution-service";

export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw Object.assign(new Error("invalid_content_type"), { status: 400 });
  try { return await request.json() as T; }
  catch { throw Object.assign(new Error("invalid_json"), { status: 400 }); }
}

export async function pr3Context(request: NextRequest) {
  const principal = await resolvePr3Principal(request);
  const repo = createPr3Repository();
  const service = new Pr3ExecutionService(repo);
  return { principal, repo, service };
}

export function safeError(error: unknown) {
  if (error instanceof Pr3AuthError) return NextResponse.json({ error:error.message, client_safe_message:"El acceso al piloto PR3 no está habilitado para esta sesión." }, { status:error.status });
  if (isPr3CommandConflict(error)) return NextResponse.json({ error:"IDEMPOTENCY_CONFLICT", client_safe_message:"La misma operación llegó con un contenido diferente. No se modificó la ejecución." }, { status:409 });
  const status = typeof error === "object" && error && "status" in error && typeof (error as {status?:unknown}).status === "number" ? (error as {status:number}).status : 503;
  const message = error instanceof Error ? error.message : "";
  const code = /^(pr3_[a-z_]+|invalid_content_type|invalid_json)$/.test(message) ? message : "pr3_service_unavailable";
  return NextResponse.json({ error:code, client_safe_message: status===400 ? "No pudimos validar la solicitud." : "El piloto PR3 todavía no puede completar esta operación de forma segura." }, { status });
}

export function executionHttp(result: unknown) {
  const maybe = result as { error?: string; command_receipt?: { receipt_state?: string; error_code?: string } };
  if (maybe.error || maybe.command_receipt?.receipt_state === "REJECTED_PRECONDITION") {
    return NextResponse.json(result, { status: 409 });
  }
  return NextResponse.json(result, { status: 200 });
}
