import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase-server";
import {
  authenticateCommercialRequest,
  bearerTokenFromRequest,
} from "@/lib/session-boundary";
import {
  buildBFFAuditEnvelopeCandidate,
  buildBFFDependencyBlockedResponse,
  buildBFFSafeInteractionResponse,
  getBFFRuntimeLocalStatus,
  isP2DependencyBlocked,
  parseScopeFromQuery,
  validateBFFScope,
} from "@/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service";
import { createInteractionAndAnswerLocal } from "@/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-local-adapter";

export async function GET(request: NextRequest) {
  const token = bearerTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      {
        error: "auth_required",
        client_safe_message: "Necesitamos una sesion activa para continuar.",
      },
      { status: 401 },
    );
  }

  const scopeResult = validateBFFScope(
    parseScopeFromQuery(request.nextUrl.searchParams),
    "interaction",
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

  const runtimeStatus = getBFFRuntimeLocalStatus();
  const dependencyBlocked = isP2DependencyBlocked();
  const auth = await authenticateCommercialRequest(request);
  if (!auth.user) {
    return NextResponse.json(
      {
        error: "auth_required",
        client_safe_message: "Necesitamos una sesion activa para continuar.",
      },
      { status: auth.status },
    );
  }
  const runtimeClient = createAuthenticatedServerSupabaseClient(token);
  const access = await runtimeClient.rpc("eve_can_access_case", {
    p_case_id: scopeResult.scope.case_id,
  });
  if (access.error || access.data !== true) {
    return NextResponse.json(
      {
        error: "access_denied",
        client_safe_message: "No pudimos preparar esta interaccion para ese caso.",
      },
      { status: 403 },
    );
  }

  const audit = buildBFFAuditEnvelopeCandidate(
    "interaction",
    scopeResult.scope,
    dependencyBlocked ? "bff_dependency_blocked" : "bff_safe_response_built",
  );

  if (dependencyBlocked) {
    const blocked = buildBFFDependencyBlockedResponse(scopeResult.scope);
    return NextResponse.json({ ...blocked, audit_ref: audit.audit_envelope_candidate_ref }, {
      status: 503,
    });
  }

  if (runtimeStatus.runtime_real_enabled) {
    try {
      await createInteractionAndAnswerLocal({
        interaction: {
          scope: {
            ...scopeResult.scope,
            client_session_id:
              scopeResult.scope.client_session_id ?? scopeResult.scope.correlation_id,
            idempotency_key: scopeResult.scope.idempotency_key ?? scopeResult.scope.correlation_id,
          },
          runtime_interaction_id: "runtime_local_question",
          state: "shown",
        },
        answer: { subfields: [] },
        actor_user_id: auth.user.authUserId,
      },
      runtimeClient,
    );
    } catch {
      const blocked = buildBFFDependencyBlockedResponse(scopeResult.scope);
      return NextResponse.json({ ...blocked, audit_ref: audit.audit_envelope_candidate_ref }, {
        status: 503,
      });
    }
  }

  const response = buildBFFSafeInteractionResponse({ scope: scopeResult.scope });
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
