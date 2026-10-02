import type { SupabaseClient } from "@supabase/supabase-js";

export type ExperienceScreenCatalogRow = {
  screen_key: string;
  label: string;
  segment: string;
  visibility: string;
  sort_order: number;
};

export type ExperienceScreenEventRow = {
  id: string;
  company_id: string;
  case_id: string;
  user_id: string;
  role_runtime_session_id: string | null;
  activity_id: string | null;
  screen_key: string;
  event_type: string;
  screen_status: string;
  occurred_at: string;
  request_id: string;
  session_reference: string;
  source_version: string;
  created_at: string;
};

export type ExperienceSupportActionRow = {
  id: string;
  company_id: string;
  case_id: string;
  user_id: string;
  role_runtime_session_id: string | null;
  activity_id: string | null;
  screen_key: string;
  action_type: string;
  reason_code: string;
  before_state: string;
  expected_effect: string;
  capability: string;
  actor_id: string;
  audit_ref: string;
  request_id: string;
  created_at: string;
};

export type ExperienceSelectorsFilter = {
  userId?: string | null;
  roleRuntimeSessionId?: string | null;
  activityId?: string | null;
  screenKey?: string | null;
};

export type ExperienceRepository = {
  listCatalog: () => Promise<ExperienceScreenCatalogRow[]>;
  listEventsForCase: (
    caseId: string,
    filters?: ExperienceSelectorsFilter,
  ) => Promise<ExperienceScreenEventRow[]>;
  listSupportActionsForCase: (
    caseId: string,
    filters?: ExperienceSelectorsFilter,
  ) => Promise<ExperienceSupportActionRow[]>;
};

const CATALOG_COLS =
  "screen_key, label, segment, visibility, sort_order" as const;

const EVENT_COLS = [
  "id",
  "company_id",
  "case_id",
  "user_id",
  "role_runtime_session_id",
  "activity_id",
  "screen_key",
  "event_type",
  "screen_status",
  "occurred_at",
  "request_id",
  "session_reference",
  "source_version",
  "created_at",
].join(", ");

const ACTION_COLS = [
  "id",
  "company_id",
  "case_id",
  "user_id",
  "role_runtime_session_id",
  "activity_id",
  "screen_key",
  "action_type",
  "reason_code",
  "before_state",
  "expected_effect",
  "capability",
  "actor_id",
  "audit_ref",
  "request_id",
  "created_at",
].join(", ");

export function createOfficialControlPanelExperienceRepository(
  client: SupabaseClient,
): ExperienceRepository {
  return {
    async listCatalog() {
      const { data, error } = await client
        .from("experience_screen_catalog")
        .select(CATALOG_COLS)
        .eq("enabled", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExperienceScreenCatalogRow[];
    },

    async listEventsForCase(caseId, filters) {
      let query = client
        .from("experience_screen_event")
        .select(EVENT_COLS)
        .eq("case_id", caseId)
        .order("occurred_at", { ascending: true })
        .order("id", { ascending: true });
      if (filters?.userId) query = query.eq("user_id", filters.userId);
      if (filters?.roleRuntimeSessionId) {
        query = query.eq(
          "role_runtime_session_id",
          filters.roleRuntimeSessionId,
        );
      }
      if (filters?.activityId) {
        query = query.eq("activity_id", filters.activityId);
      }
      if (filters?.screenKey) {
        query = query.eq("screen_key", filters.screenKey);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ExperienceScreenEventRow[];
    },

    async listSupportActionsForCase(caseId, filters) {
      let query = client
        .from("experience_support_action")
        .select(ACTION_COLS)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (filters?.userId) query = query.eq("user_id", filters.userId);
      if (filters?.roleRuntimeSessionId) {
        query = query.eq(
          "role_runtime_session_id",
          filters.roleRuntimeSessionId,
        );
      }
      if (filters?.activityId) {
        query = query.eq("activity_id", filters.activityId);
      }
      if (filters?.screenKey) {
        query = query.eq("screen_key", filters.screenKey);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ExperienceSupportActionRow[];
    },
  };
}
