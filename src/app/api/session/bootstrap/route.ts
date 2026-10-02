import { NextResponse } from "next/server";
import {
  authenticateCommercialRequest,
  normalizeSessionMode,
  runWithOperationalServerSupabaseClient,
} from "@/lib/session-boundary";
import { resolveAuthenticatedParticipantContext } from "@/lib/participant-context";
import { supabaseServer } from "@/lib/supabase-server";

const demoCompany = {
  nombre: "Empresa Demo EVE",
  sector: "Diagnostico organizacional",
};

const demoUser = {
  nombre: "Usuario Demo",
  rol_declarado: "Participante piloto",
  email: "demo@eve.local",
};

type BootstrapPayload = {
  mode?: "commercial" | "demo";
  company?: {
    nombre?: string;
    sector?: string;
  };
  user?: {
    nombre?: string;
    rol_declarado?: string;
    email?: string;
  };
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as BootstrapPayload;
  const mode = normalizeSessionMode(payload.mode);
  const commercialAuth =
    mode === "commercial" ? await authenticateCommercialRequest(request) : null;

  if (commercialAuth && !commercialAuth.user) {
    return NextResponse.json(
      {
        error: commercialAuth.error,
        mode,
      },
      { status: commercialAuth.status },
    );
  }

  if (mode === "commercial") {
    const participantContext = await resolveAuthenticatedParticipantContext(request);
    if (participantContext.status === "ready") {
      return NextResponse.json({
        session: {
          id: participantContext.case.id,
          estado_actual: "capa_1_triple",
          porcentaje_avance: 0,
          participant_context: {
            case_id: participantContext.case.id,
            case_participant_id: participantContext.participant.id,
            case_participant_profile_ids: participantContext.functionalProfiles.map(
              (profile) => profile.id,
            ),
          },
        },
        version: "caso existente",
        mode,
        bootstrap: "participant_case_reused",
        participantContext,
      });
    }

    if (
      participantContext.status === "case_selection_required" ||
      participantContext.status === "profile_selection_required"
    ) {
      return NextResponse.json(
        {
          error: participantContext.status,
          mode,
          participantContext,
        },
        { status: 409 },
      );
    }
  }

  const companyName = payload.company?.nombre?.trim();
  const companySector = payload.company?.sector?.trim();

  if (mode === "commercial" && !companyName) {
    return NextResponse.json(
      {
        error:
          "Commercial mode requires a company name to create a capture session.",
        mode,
      },
      { status: 400 },
    );
  }

  const authenticatedUser = commercialAuth?.user ?? null;
  const companyInput = {
    nombre:
      mode === "demo" ? companyName || demoCompany.nombre : companyName!,
    sector:
      mode === "demo"
        ? companySector || demoCompany.sector
        : companySector || "No declarado",
  };
  const userInput = {
    nombre:
      mode === "demo"
        ? demoUser.nombre
        : payload.user?.nombre?.trim() || authenticatedUser!.displayName,
    rol_declarado:
      mode === "demo"
        ? demoUser.rol_declarado
        : payload.user?.rol_declarado?.trim() || "Usuario plataforma",
    email:
      mode === "demo"
        ? demoUser.email
        : authenticatedUser!.email,
  };

  return await runWithOperationalServerSupabaseClient(request, mode, async () => {
  const { data: version, error: versionError } = await supabaseServer
    .from("versiones_herramienta")
    .select("id, numero_version")
    .eq("activa", true)
    .single();

  if (versionError || !version) {
    return NextResponse.json(
      {
        error:
          "No encontre una version activa. Revisa que seed.sql haya creado v1.0.",
      },
      { status: 500 },
    );
  }

  const userLookup = mode === "commercial" && authenticatedUser
    ? supabaseServer
        .from("usuarios")
        .select("id, empresa_id, email, auth_user_id")
        .eq("auth_user_id", authenticatedUser.authUserId)
        .maybeSingle()
    : supabaseServer
        .from("usuarios")
        .select("id, empresa_id, email, auth_user_id")
        .eq("email", demoUser.email)
        .maybeSingle();

  const { data: existingUser, error: userLookupError } = await userLookup;

  if (userLookupError) {
    return NextResponse.json({ error: userLookupError.message }, { status: 500 });
  }

  let userId = existingUser?.id;

  if (!userId && mode === "commercial" && authenticatedUser) {
    const { data: emailUser, error: emailUserError } = await supabaseServer
      .from("usuarios")
      .select("id, empresa_id, email, auth_user_id")
      .eq("email", authenticatedUser.email)
      .maybeSingle();

    if (emailUserError) {
      return NextResponse.json({ error: emailUserError.message }, { status: 500 });
    }

    if (emailUser?.auth_user_id && emailUser.auth_user_id !== authenticatedUser.authUserId) {
      return NextResponse.json(
        {
          error:
            "Commercial email is already linked to a different authenticated user.",
          mode,
        },
        { status: 409 },
      );
    }

    if (emailUser) {
      const { data: linkedUser, error: linkError } = await supabaseServer
        .from("usuarios")
        .update({ auth_user_id: authenticatedUser.authUserId })
        .eq("id", emailUser.id)
        .is("auth_user_id", null)
        .select("id")
        .single();

      if (linkError || !linkedUser) {
        return NextResponse.json(
          {
            error:
              linkError?.message ??
              "No pude vincular el usuario comercial autenticado.",
            mode,
          },
          { status: 500 },
        );
      }

      userId = linkedUser.id;
    }
  }

  if (!userId) {
    const { data: company, error: companyError } = await supabaseServer
      .from("empresas")
      .insert(companyInput)
      .select("id")
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: companyError?.message ?? "No pude crear la empresa demo." },
        { status: 500 },
      );
    }

    const { data: user, error: userError } = await supabaseServer
      .from("usuarios")
      .insert({
        ...userInput,
        empresa_id: company.id,
        ...(mode === "commercial" && authenticatedUser
          ? { auth_user_id: authenticatedUser.authUserId }
          : {}),
      })
      .select("id")
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: userError?.message ?? "No pude crear el usuario demo." },
        { status: 500 },
      );
    }

    userId = user.id;
  }

  const { data: session, error: sessionError } = await supabaseServer
    .from("sesiones_llenado")
    .insert({
      usuario_id: userId,
      version_herramienta_id: version.id,
      estado_actual: "capa_1_triple",
      porcentaje_avance: 0,
    })
    .select("id, estado_actual, porcentaje_avance, created_at")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message ?? "No pude crear la sesion." },
      { status: 500 },
    );
  }

  await supabaseServer.from("metricas_por_capa").insert({
    sesion_id: session.id,
    capa: "capa_1_triple",
  });

  return NextResponse.json({
    session,
    version: version.numero_version,
    mode,
    bootstrap: mode === "commercial" ? "legacy_generic_session_created" : "demo_session_created",
  });
  });
}
