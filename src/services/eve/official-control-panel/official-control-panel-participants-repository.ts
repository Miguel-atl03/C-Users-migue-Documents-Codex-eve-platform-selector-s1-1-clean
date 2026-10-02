import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapParticipantRow,
  mapProfileRow,
} from "./official-control-panel-participants-service";
import type {
  CaseParticipantProfileRecord,
  CaseParticipantRecord,
  OfficialControlPanelParticipantsRepository,
} from "./official-control-panel-participants.types";

export function createOfficialControlPanelParticipantsRepository(
  client: SupabaseClient,
): OfficialControlPanelParticipantsRepository {
  return {
    async listEnabledParticipantsByCase(
      caseId: string,
    ): Promise<CaseParticipantRecord[]> {
      const modern = await client
        .from("case_participants")
        .select(
          "id, case_id, usuario_id, participant_name, participant_email, status, created_at, usuarios(id, auth_user_id, nombre, email, rol_declarado)",
        )
        .eq("case_id", caseId)
        .eq("status", "active")
        .order("created_at", { ascending: true });

      if (!modern.error) {
        return (modern.data ?? []).map((row) =>
          mapParticipantRow(row as Record<string, unknown>),
        );
      }

      const { data, error } = await client
        .from("case_participants")
        .select(
          "id, case_id, user_id, display_label, participation_status, valid_from, valid_until, enabled",
        )
        .eq("case_id", caseId)
        .eq("enabled", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) =>
        mapParticipantRow(row as Record<string, unknown>),
      );
    },

    async findParticipantById(
      participantId: string,
    ): Promise<CaseParticipantRecord | null> {
      const modern = await client
        .from("case_participants")
        .select(
          "id, case_id, usuario_id, participant_name, participant_email, status, created_at, usuarios(id, auth_user_id, nombre, email, rol_declarado)",
        )
        .eq("id", participantId)
        .maybeSingle();

      if (!modern.error) {
        return modern.data
          ? mapParticipantRow(modern.data as Record<string, unknown>)
          : null;
      }

      const { data, error } = await client
        .from("case_participants")
        .select(
          "id, case_id, user_id, display_label, participation_status, valid_from, valid_until, enabled",
        )
        .eq("id", participantId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapParticipantRow(data as Record<string, unknown>);
    },

    async listEnabledProfilesByParticipant(
      participantId: string,
    ): Promise<CaseParticipantProfileRecord[]> {
      const modern = await client
        .from("case_participant_profiles")
        .select(
          "id, case_participant_id, role_label, role_code, profile_status, is_primary, created_at",
        )
        .eq("case_participant_id", participantId)
        .eq("profile_status", "active")
        .order("created_at", { ascending: true });

      if (!modern.error) {
        return (modern.data ?? []).map((row) =>
          mapProfileRow(row as Record<string, unknown>),
        );
      }

      const { data, error } = await client
        .from("case_participant_profiles")
        .select(
          "id, case_participant_id, display_label, resolution_status, valid_from, valid_until, enabled",
        )
        .eq("case_participant_id", participantId)
        .eq("enabled", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) =>
        mapProfileRow(row as Record<string, unknown>),
      );
    },

    async findProfileById(
      profileId: string,
    ): Promise<CaseParticipantProfileRecord | null> {
      const modern = await client
        .from("case_participant_profiles")
        .select(
          "id, case_participant_id, role_label, role_code, profile_status, is_primary, created_at",
        )
        .eq("id", profileId)
        .maybeSingle();

      if (!modern.error) {
        return modern.data
          ? mapProfileRow(modern.data as Record<string, unknown>)
          : null;
      }

      const { data, error } = await client
        .from("case_participant_profiles")
        .select(
          "id, case_participant_id, display_label, resolution_status, valid_from, valid_until, enabled",
        )
        .eq("id", profileId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapProfileRow(data as Record<string, unknown>);
    },
  };
}
