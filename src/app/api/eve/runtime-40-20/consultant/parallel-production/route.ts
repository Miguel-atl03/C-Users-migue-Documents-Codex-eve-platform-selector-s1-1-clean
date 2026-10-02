import { NextRequest, NextResponse } from "next/server";
import { buildParallelProductionRehearsalFromLocal } from "@/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-local-adapter";
import {
  buildParallelProductionDependencyBlockedResponse,
  isParallelProductionDependencyBlocked,
  parseParallelProductionScopeFromBody,
  validateParallelProductionNoForbiddenFields,
  validateParallelProductionScope,
} from "@/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-service";

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

  const scopeResult = validateParallelProductionScope(
    parseParallelProductionScopeFromBody(body),
  );

  if (!scopeResult.valid) {
    return NextResponse.json(
      {
        error: "invalid_scope",
        consultant_safe_message:
          "Faltan datos para preparar el paquete de producción paralela controlada.",
        blocking_reasons: scopeResult.blocking_reasons,
      },
      { status: 400 },
    );
  }

  const dependencyBlocked = isParallelProductionDependencyBlocked();

  if (dependencyBlocked) {
    const blocked = buildParallelProductionDependencyBlockedResponse(scopeResult.scope);
    return NextResponse.json(blocked, { status: 503 });
  }

  const rehearsal = await buildParallelProductionRehearsalFromLocal({
    scope: scopeResult.scope,
  });

  if (!rehearsal || !validateParallelProductionNoForbiddenFields(rehearsal)) {
    return NextResponse.json(
      {
        status: "rehearsal_unavailable",
        consultant_safe_message:
          "No fue posible preparar el paquete de producción paralela controlada de forma segura.",
        correlation_id: scopeResult.scope.correlation_id,
      },
      { status: 503 },
    );
  }

  return NextResponse.json(rehearsal, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    {
      error: "method_not_allowed",
      consultant_safe_message: "Este punto de acceso solo admite preparación por POST.",
    },
    { status: 405 },
  );
}
