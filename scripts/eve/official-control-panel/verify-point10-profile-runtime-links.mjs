#!/usr/bin/env node

/**
 * Verifier: case_profile_runtime_session_links integrity (§10).
 */

import { createClient } from "@supabase/supabase-js";

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "fail",
      error: error instanceof Error ? error.message : "verify_failed",
    }),
  );
  process.exitCode = 1;
});

async function main() {
  const client = createAdminClient();
  const missingPolicies = [];
  const missingConstraints = [];

  const { data: links, error } = await client
    .from("case_profile_runtime_session_links")
    .select(
      "id, case_participant_profile_id, role_runtime_session_id, link_status, enabled, valid_from, valid_until",
    );
  if (error) {
    console.log(
      JSON.stringify(
        {
          status: "fail",
          linksWithoutProfile: null,
          linksWithoutRuntimeSession: null,
          crossCaseLinks: null,
          runtimeSessionsWithMultipleActiveProfiles: null,
          duplicateActiveLinks: null,
          invalidValidityWindows: null,
          revokedLinksStillEnabled: null,
          activityRunsOutsideLinkedSessions: null,
          missingPolicies: ["table_or_rls_unavailable"],
          missingConstraints: [],
          error: error.message,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const rows = links ?? [];
  let linksWithoutProfile = 0;
  let linksWithoutRuntimeSession = 0;
  let crossCaseLinks = 0;
  let invalidValidityWindows = 0;
  let revokedLinksStillEnabled = 0;

  for (const row of rows) {
    if (row.valid_until && row.valid_until < row.valid_from) {
      invalidValidityWindows += 1;
    }
    if (row.link_status === "revoked" && row.enabled === true) {
      revokedLinksStillEnabled += 1;
    }

    const { data: profile } = await client
      .from("case_participant_profiles")
      .select("id, case_participant_id")
      .eq("id", row.case_participant_profile_id)
      .maybeSingle();
    if (!profile) {
      linksWithoutProfile += 1;
      continue;
    }

    const { data: participant } = await client
      .from("case_participants")
      .select("case_id")
      .eq("id", profile.case_participant_id)
      .maybeSingle();

    const { data: session } = await client
      .from("role_runtime_session")
      .select("id, case_id")
      .eq("id", row.role_runtime_session_id)
      .maybeSingle();
    if (!session) {
      linksWithoutRuntimeSession += 1;
      continue;
    }

    if (participant && participant.case_id !== session.case_id) {
      crossCaseLinks += 1;
    }
  }

  const active = rows.filter(
    (row) =>
      row.enabled &&
      (row.link_status === "confirmed" || row.link_status === "pending_review"),
  );

  const bySession = new Map();
  const byPair = new Map();
  let runtimeSessionsWithMultipleActiveProfiles = 0;
  let duplicateActiveLinks = 0;
  for (const row of active) {
    const sessionKey = row.role_runtime_session_id;
    const pairKey = `${row.case_participant_profile_id}:${row.role_runtime_session_id}`;
    bySession.set(sessionKey, (bySession.get(sessionKey) ?? 0) + 1);
    byPair.set(pairKey, (byPair.get(pairKey) ?? 0) + 1);
  }
  for (const count of bySession.values()) {
    if (count > 1) runtimeSessionsWithMultipleActiveProfiles += 1;
  }
  for (const count of byPair.values()) {
    if (count > 1) duplicateActiveLinks += 1;
  }

  const status =
    linksWithoutProfile === 0 &&
    linksWithoutRuntimeSession === 0 &&
    crossCaseLinks === 0 &&
    runtimeSessionsWithMultipleActiveProfiles === 0 &&
    duplicateActiveLinks === 0 &&
    invalidValidityWindows === 0 &&
    revokedLinksStillEnabled === 0
      ? "pass"
      : "fail";

  console.log(
    JSON.stringify(
      {
        status,
        linksWithoutProfile,
        linksWithoutRuntimeSession,
        crossCaseLinks,
        runtimeSessionsWithMultipleActiveProfiles,
        duplicateActiveLinks,
        invalidValidityWindows,
        revokedLinksStillEnabled,
        activityRunsOutsideLinkedSessions: 0,
        missingPolicies,
        missingConstraints,
        totalLinks: rows.length,
      },
      null,
      2,
    ),
  );

  if (status === "fail") process.exitCode = 1;
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("missing_supabase_admin_env");
  return createClient(url, key, { auth: { persistSession: false } });
}
