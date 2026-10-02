import { NextRequest, NextResponse } from "next/server";
import { buildConsultantReviewPacketFromLocal } from "@/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result-local-adapter";
import {
  buildConsultantReviewPacketDependencyBlockedResponse,
  isConsultantReviewPacketDependencyBlocked,
  parseConsultantScopeFromBody,
  validateConsultantReviewPacketNoForbiddenFields,
  validateConsultantReviewPacketScope,
} from "@/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result-service";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "invalid_request",
        consultant_safe_message: "La solicitud no pudo procesarse.",
      },
      { status: 400 },
    );
  }

  const scopeResult = validateConsultantReviewPacketScope(parseConsultantScopeFromBody(body));

  if (!scopeResult.valid) {
    return NextResponse.json(
      {
        error: "invalid_scope",
        consultant_safe_message: "Faltan datos para ensamblar el paquete de revisión.",
        blocking_reasons: scopeResult.blocking_reasons,
      },
      { status: 400 },
    );
  }

  const dependencyBlocked = isConsultantReviewPacketDependencyBlocked();

  if (dependencyBlocked) {
    const blocked = buildConsultantReviewPacketDependencyBlockedResponse(scopeResult.scope);
    return NextResponse.json(blocked, { status: 503 });
  }

  const packet = await buildConsultantReviewPacketFromLocal({ scope: scopeResult.scope });

  if (!packet || !validateConsultantReviewPacketNoForbiddenFields(packet)) {
    return NextResponse.json(
      {
        status: "packet_unavailable",
        consultant_safe_message:
          "No fue posible ensamblar el paquete de revisión consultor de forma segura.",
        correlation_id: scopeResult.scope.correlation_id,
      },
      { status: 503 },
    );
  }

  return NextResponse.json(packet, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    {
      error: "method_not_allowed",
      consultant_safe_message: "Este punto de acceso solo admite ensamblaje por POST.",
    },
    { status: 405 },
  );
}
