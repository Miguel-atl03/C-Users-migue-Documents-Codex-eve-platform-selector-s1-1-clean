import { NextRequest, NextResponse } from "next/server";
import {
  buildBFFAuditEnvelopeCandidate,
  buildBFFDependencyBlockedResponse,
  buildBFFSafeStateResponse,
  isP2DependencyBlocked,
  parseScopeFromQuery,
  validateBFFScope,
} from "@/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service";

export async function GET(request: NextRequest) {
  const scopeResult = validateBFFScope(
    parseScopeFromQuery(request.nextUrl.searchParams),
    "state",
  );

  if (!scopeResult.valid || !scopeResult.scope) {
    return NextResponse.json(
      {
        error: "invalid_scope",
        client_safe_message: "Faltan datos para continuar de forma segura.",
        blocking_reasons: scopeResult.blocking_reasons,
      },
      { status: 400 },
    );
  }

  const audit = buildBFFAuditEnvelopeCandidate(
    "state",
    scopeResult.scope,
    isP2DependencyBlocked() ? "bff_dependency_blocked" : "bff_safe_response_built",
  );

  if (isP2DependencyBlocked()) {
    const blocked = buildBFFDependencyBlockedResponse(scopeResult.scope);
    return NextResponse.json({ ...blocked, audit_ref: audit.audit_envelope_candidate_ref }, {
      status: 503,
    });
  }

  const response = buildBFFSafeStateResponse({ scope: scopeResult.scope });
  return NextResponse.json({ ...response, audit_ref: audit.audit_envelope_candidate_ref }, {
    status: 200,
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "method_not_allowed",
      client_safe_message: "Este punto de acceso solo admite consulta segura.",
    },
    { status: 405 },
  );
}
