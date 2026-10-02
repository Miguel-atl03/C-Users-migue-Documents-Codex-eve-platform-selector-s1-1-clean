import { NextRequest, NextResponse } from "next/server";
import { buildClientSafeResultFromLocalReadiness } from "@/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-service";
import {
  buildBFFAuditEnvelopeCandidate,
  buildBFFDependencyBlockedResponse,
  buildBFFSafeReviewResultDTO,
  isBFFReviewDependencyBlockedForP5,
  parseScopeFromQuery,
  validateBFFSafeReviewResultNoLeakage,
  validateBFFScope,
} from "@/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service";

export async function GET(request: NextRequest) {
  const scopeResult = validateBFFScope(
    parseScopeFromQuery(request.nextUrl.searchParams),
    "review",
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

  const dependencyBlocked = isBFFReviewDependencyBlockedForP5();
  const audit = buildBFFAuditEnvelopeCandidate(
    "review",
    scopeResult.scope,
    dependencyBlocked ? "bff_dependency_blocked" : "bff_safe_response_built",
  );

  if (dependencyBlocked) {
    const blocked = buildBFFDependencyBlockedResponse(scopeResult.scope);
    return NextResponse.json({ ...blocked, audit_ref: audit.audit_envelope_candidate_ref }, {
      status: 503,
    });
  }

  const localResult = await buildClientSafeResultFromLocalReadiness({
    tenant_id: scopeResult.scope.tenant_id,
    case_id: scopeResult.scope.case_id,
    role_id: scopeResult.scope.role_id,
    activity_id: scopeResult.scope.activity_id,
    run_id: scopeResult.scope.run_id ?? "",
    correlation_id: scopeResult.scope.correlation_id,
  });

  const response = localResult
    ? {
        visible_state: localResult.visible_state,
        visible_title: localResult.visible_title,
        visible_message: localResult.visible_message,
        visible_next_action: localResult.visible_next_action,
        review_pending: localResult.review_pending,
        can_correct: localResult.can_correct,
        can_reenter: localResult.can_reenter,
        client_safe: true as const,
      }
    : buildBFFSafeReviewResultDTO({ scope: scopeResult.scope });

  if (!validateBFFSafeReviewResultNoLeakage(response)) {
    return NextResponse.json(
      {
        status: "bloqueado_seguro",
        client_safe_message:
          "Por ahora no podemos mostrar el estado de revisión de forma segura.",
        client_safe: true,
      },
      { status: 200 },
    );
  }

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
