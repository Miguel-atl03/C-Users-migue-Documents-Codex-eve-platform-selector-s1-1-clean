import {
  createAuthenticatedServerSupabaseClient,
  runWithServerSupabaseClient,
  supabaseAnonServer,
  supabaseServer,
} from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionMode = "commercial" | "demo";

export const DEMO_USER_EMAIL = "demo@eve.local";

export type AuthenticatedPlatformUser = {
  authUserId: string;
  email: string;
  displayName: string;
};

export type EvePlatformUser = AuthenticatedPlatformUser & {
  eveUserId: string;
  empresaId: string;
};

export function normalizeSessionMode(value: unknown): SessionMode {
  return value === "demo" ? "demo" : "commercial";
}

export function bearerTokenFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createOperationalServerSupabaseClient(
  request: Request,
  mode: SessionMode,
) {
  if (mode === "demo") return supabaseAnonServer;

  const token = bearerTokenFromRequest(request);
  if (!token) {
    throw new Error("Commercial mode requires an authenticated Supabase user.");
  }

  return createAuthenticatedServerSupabaseClient(token);
}

export function runWithOperationalServerSupabaseClient<T>(
  request: Request,
  mode: SessionMode,
  operation: () => T,
) {
  return runWithServerSupabaseClient(
    createOperationalServerSupabaseClient(request, mode),
    operation,
  );
}

export async function authenticateCommercialRequest(request: Request) {
  const token = bearerTokenFromRequest(request);

  if (!token) {
    return {
      user: null,
      error: "Commercial mode requires an authenticated Supabase user.",
      status: 401,
    } as const;
  }

  const authClient = createAuthenticatedServerSupabaseClient(token);
  const { data, error } = await authClient.auth.getUser();

  if (error || !data.user?.email) {
    return {
      user: null,
      error: "Commercial mode could not verify the Supabase user.",
      status: 401,
    } as const;
  }

  const metadata = data.user.user_metadata ?? {};
  const displayName =
    typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : data.user.email;

  return {
    user: {
      authUserId: data.user.id,
      email: data.user.email,
      displayName,
    },
    error: null,
    status: 200,
  } as const;
}

export async function resolveCommercialEveUser(request: Request) {
  const token = bearerTokenFromRequest(request);
  const auth = await authenticateCommercialRequest(request);

  if (!auth.user) {
    return auth;
  }

  const client = createAuthenticatedServerSupabaseClient(token!);
  const { data: eveUser, error } = await client
    .from("usuarios")
    .select("id, empresa_id, email, auth_user_id")
    .eq("auth_user_id", auth.user.authUserId)
    .maybeSingle();

  if (error) {
    return {
      user: null,
      error: error.message,
      status: 500,
    } as const;
  }

  if (!eveUser) {
    return {
      user: null,
      error: "Commercial user is authenticated but not linked to an EVE user.",
      status: 403,
    } as const;
  }

  return {
    user: {
      ...auth.user,
      eveUserId: eveUser.id,
      empresaId: eveUser.empresa_id,
    },
    error: null,
    status: 200,
  } as const;
}

export async function resolveCommercialSessionOwner(
  request: Request,
  sessionId: string,
) {
  const eveUser = await resolveCommercialEveUser(request);

  if (!eveUser.user) {
    return {
      user: null,
      session: null,
      error: eveUser.error,
      status: eveUser.status,
    } as const;
  }

  const client = createOperationalServerSupabaseClient(request, "commercial");
  const { data: session, error } = await client
    .from("sesiones_llenado")
    .select(
      "id, version_herramienta_id, estado_actual, porcentaje_avance, created_at, updated_at, usuario_id",
    )
    .eq("id", sessionId)
    .eq("usuario_id", eveUser.user.eveUserId)
    .maybeSingle();

  if (error) {
    return {
      user: eveUser.user,
      session: null,
      error: error.message,
      status: 500,
    } as const;
  }

  if (!session) {
    const { data: participantSession, error: participantSessionError } = await client
      .from("sesiones_llenado")
      .select(
        "id, version_herramienta_id, estado_actual, porcentaje_avance, created_at, updated_at, usuario_id",
      )
      .eq("id", sessionId)
      .maybeSingle();

    if (participantSessionError) {
      return {
        user: eveUser.user,
        session: null,
        error: participantSessionError.message,
        status: 500,
      } as const;
    }

    if (participantSession) {
      const { data: participant, error: participantError } = await client
        .from("case_participants")
        .select("id")
        .eq("case_id", sessionId)
        .eq("usuario_id", eveUser.user.eveUserId)
        .eq("status", "active")
        .maybeSingle();

      if (participantError) {
        return {
          user: eveUser.user,
          session: null,
          error: participantError.message,
          status: 500,
        } as const;
      }

      if (participant) {
        return {
          user: eveUser.user,
          session: participantSession,
          error: null,
          status: 200,
        } as const;
      }
    }

    return {
      user: eveUser.user,
      session: null,
      error: "No encontre una sesion comercial propia con ese ID.",
      status: 404,
    } as const;
  }

  return {
    user: eveUser.user,
    session,
    error: null,
    status: 200,
  } as const;
}

export async function resolveDemoSessionOwner(sessionId: string) {
  const { data: session, error } = await supabaseServer
    .from("sesiones_llenado")
    .select(
      "id, version_herramienta_id, estado_actual, porcentaje_avance, created_at, updated_at, usuario_id, usuarios!inner(email)",
    )
    .eq("id", sessionId)
    .eq("usuarios.email", DEMO_USER_EMAIL)
    .maybeSingle();

  if (error) {
    return {
      user: null,
      session: null,
      error: error.message,
      status: 500,
    } as const;
  }

  if (!session) {
    return {
      user: null,
      session: null,
      error: "No encontre una sesion demo propia con ese ID.",
      status: 404,
    } as const;
  }

  return {
    user: null,
    session,
    error: null,
    status: 200,
  } as const;
}

export async function resolveSessionOwner(
  request: Request,
  sessionId: string,
  mode: SessionMode,
) {
  return mode === "commercial"
    ? resolveCommercialSessionOwner(request, sessionId)
    : resolveDemoSessionOwner(sessionId);
}

export async function resolveSceneOwner(
  request: Request,
  {
    sessionId,
    sceneId,
    mode,
  }: {
    sessionId: string;
    sceneId: string;
    mode: SessionMode;
  },
) {
  const sessionOwner = await resolveSessionOwner(request, sessionId, mode);

  if (!sessionOwner.session) {
    return {
      ...sessionOwner,
      scene: null,
    } as const;
  }

  const client =
    mode === "commercial"
      ? createOperationalServerSupabaseClient(request, mode)
      : (supabaseServer as SupabaseClient);
  const { data: scene, error } = await client
    .from("scene_registry")
    .select("id, sesion_id")
    .eq("id", sceneId)
    .eq("sesion_id", sessionId)
    .maybeSingle();

  if (error) {
    return {
      ...sessionOwner,
      scene: null,
      error: error.message,
      status: 500,
    } as const;
  }

  if (!scene) {
    return {
      ...sessionOwner,
      scene: null,
      error: "No encontre una escena propia con ese ID.",
      status: 404,
    } as const;
  }

  return {
    ...sessionOwner,
    scene,
    error: null,
    status: 200,
  } as const;
}
