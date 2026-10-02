import { createAuthenticatedServerSupabaseClient } from "@/lib/supabase-server";
import { authenticateCommercialRequest, bearerTokenFromRequest } from "@/lib/session-boundary";

export type ParticipantContextStatus =
  | "ready"
  | "no_context"
  | "case_selection_required"
  | "profile_selection_required";

export type ParticipantContextReady = {
  status: "ready";
  user: {
    id: string;
    name: string;
    email: string;
  };
  company: {
    id: string;
    name: string;
  };
  case: {
    id: string;
    name: string;
  };
  clientRelationship: {
    id: string;
    name: string;
  };
  participant: {
    id: string;
    status: string;
  };
  position: {
    id: string;
    title: string;
    source: string;
  } | null;
  functionalProfiles: Array<{
    id: string;
    roleCode: string | null;
    roleLabel: string;
    status: string;
  }>;
};

export type ParticipantContextResult =
  | ParticipantContextReady
  | {
      status: Exclude<ParticipantContextStatus, "ready">;
      user?: ParticipantContextReady["user"];
      reason: string;
    };

type EveUserRow = {
  id: string;
  empresa_id: string;
  nombre: string;
  email: string;
  auth_user_id: string | null;
};

type CaseParticipantRow = {
  id: string;
  empresa_id: string;
  client_relationship_id: string;
  case_id: string;
  usuario_id: string | null;
  participant_name: string | null;
  participant_email: string;
  status: string;
};

type CaseProfileRow = {
  id: string;
  case_participant_id: string;
  role_code: string | null;
  role_label: string;
  profile_status: string;
};

type CasePositionRow = {
  id: string;
  case_participant_id: string;
  declared_title: string;
  source: string;
  status: string;
};

type CaseRow = {
  id: string;
  display_name: string | null;
  client_company_id: string | null;
  client_relationship_id: string | null;
};

type CompanyRow = {
  id: string;
  nombre: string;
};

type RelationshipRow = {
  id: string;
  display_name: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

export async function resolveAuthenticatedParticipantContext(
  request: Request,
): Promise<ParticipantContextResult> {
  const token = bearerTokenFromRequest(request);
  const auth = await authenticateCommercialRequest(request);

  if (!token || !auth.user) {
    return { status: "no_context", reason: "auth_required" };
  }

  const client = createAuthenticatedServerSupabaseClient(token);
  const { data: eveUser, error: userError } = await client
    .from("usuarios")
    .select("id, empresa_id, nombre, email, auth_user_id")
    .eq("auth_user_id", auth.user.authUserId)
    .maybeSingle<EveUserRow>();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!eveUser) {
    return {
      status: "no_context",
      user: {
        id: auth.user.authUserId,
        name: auth.user.displayName,
        email: auth.user.email,
      },
      reason: "authenticated_user_not_linked",
    };
  }

  const user = {
    id: eveUser.id,
    name: eveUser.nombre,
    email: eveUser.email,
  };

  const { data: participants, error: participantsError } = await client
    .from("case_participants")
    .select(
      "id, empresa_id, client_relationship_id, case_id, usuario_id, participant_name, participant_email, status",
    )
    .eq("usuario_id", eveUser.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<CaseParticipantRow[]>();

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const activeParticipants = (participants ?? []).filter(
    (participant) => normalizeEmail(participant.participant_email) === normalizeEmail(eveUser.email),
  );

  if (!activeParticipants.length) {
    return { status: "no_context", user, reason: "no_active_case_participant" };
  }

  const caseIds = uniqueValues(activeParticipants.map((participant) => participant.case_id));
  if (caseIds.length > 1) {
    return { status: "case_selection_required", user, reason: "multiple_active_cases" };
  }

  const participant = activeParticipants[0];
  const { data: positions, error: positionsError } = await client
    .from("case_participant_positions")
    .select("id, case_participant_id, declared_title, source, status")
    .eq("case_participant_id", participant.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<CasePositionRow[]>();

  if (positionsError) {
    throw new Error(positionsError.message);
  }

  const { data: profiles, error: profilesError } = await client
    .from("case_participant_profiles")
    .select("id, case_participant_id, role_code, role_label, profile_status")
    .eq("case_participant_id", participant.id)
    .eq("profile_status", "active")
    .order("created_at", { ascending: true })
    .returns<CaseProfileRow[]>();

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const { data: sessionCase, error: caseError } = await client
    .from("sesiones_llenado")
    .select("id, display_name, client_company_id, client_relationship_id")
    .eq("id", participant.case_id)
    .maybeSingle<CaseRow>();

  if (caseError) {
    throw new Error(caseError.message);
  }

  if (!sessionCase) {
    return { status: "no_context", user, reason: "case_not_visible" };
  }

  const { data: company, error: companyError } = await client
    .from("empresas")
    .select("id, nombre")
    .eq("id", participant.empresa_id)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    throw new Error(companyError.message);
  }

  const { data: relationship, error: relationshipError } = await client
    .from("client_relationships")
    .select("id, display_name")
    .eq("id", participant.client_relationship_id)
    .maybeSingle<RelationshipRow>();

  if (relationshipError) {
    throw new Error(relationshipError.message);
  }

  if (!company || !relationship) {
    return { status: "no_context", user, reason: "company_or_relationship_not_visible" };
  }

  return {
    status: "ready",
    user,
    company: {
      id: company.id,
      name: company.nombre,
    },
    case: {
      id: sessionCase.id,
      name: sessionCase.display_name ?? "Caso EVE",
    },
    clientRelationship: {
      id: relationship.id,
      name: relationship.display_name,
    },
    participant: {
      id: participant.id,
      status: participant.status,
    },
    position: positions?.[0]
      ? {
          id: positions[0].id,
          title: positions[0].declared_title,
          source: positions[0].source,
        }
      : null,
    functionalProfiles: (profiles ?? []).map((profile) => ({
      id: profile.id,
      roleCode: profile.role_code,
      roleLabel: profile.role_label,
      status: profile.profile_status,
    })),
  };
}

export function participantContextHttpStatus(context: ParticipantContextResult) {
  if (context.status === "ready" || context.status === "no_context") return 200;
  return 409;
}
