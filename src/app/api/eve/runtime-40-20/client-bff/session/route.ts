import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase-server";
import {
  authenticateCommercialRequest,
  bearerTokenFromRequest,
} from "@/lib/session-boundary";
import {
  buildBFFAuditEnvelopeCandidate,
  buildBFFDependencyBlockedResponse,
  buildBFFSafeSessionResponse,
  getBFFRuntimeLocalStatus,
  isP2DependencyBlocked,
  parseScopeFromQuery,
  validateBFFScope,
} from "@/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service";
import {
  EVE_RUNTIME_40_20_LOCAL_CATALOG_VERSION_ID,
  createRuntimeSessionAndRunLocal,
} from "@/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-local-adapter";

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
    "session",
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
        client_safe_message: "No pudimos preparar una sesion Runtime para ese caso.",
      },
      { status: 403 },
    );
  }

  const audit = buildBFFAuditEnvelopeCandidate(
    "session",
    scopeResult.scope,
    dependencyBlocked ? "bff_dependency_blocked" : "bff_safe_response_built",
  );

  if (dependencyBlocked) {
    const blocked = buildBFFDependencyBlockedResponse(scopeResult.scope);
    return NextResponse.json({ ...blocked, audit_ref: audit.audit_envelope_candidate_ref }, {
      status: 503,
    });
  }

  if (
    runtimeStatus.runtime_real_enabled &&
    scopeResult.scope.role_id &&
    scopeResult.scope.activity_id &&
    scopeResult.scope.run_id
  ) {
    try {
      await createRuntimeSessionAndRunLocal({
        scope: {
          ...scopeResult.scope,
          role_id: scopeResult.scope.role_id,
          activity_id: scopeResult.scope.activity_id,
          run_id: scopeResult.scope.run_id,
          client_session_id:
            scopeResult.scope.client_session_id ?? scopeResult.scope.correlation_id,
          idempotency_key: scopeResult.scope.idempotency_key ?? scopeResult.scope.correlation_id,
        },
        catalog_version_id: EVE_RUNTIME_40_20_LOCAL_CATALOG_VERSION_ID,
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

  const response = buildBFFSafeSessionResponse({ scope: scopeResult.scope });
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
