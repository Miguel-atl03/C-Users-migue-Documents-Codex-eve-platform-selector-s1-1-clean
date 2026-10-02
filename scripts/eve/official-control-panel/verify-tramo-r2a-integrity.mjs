#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "fail",
      duplicateActiveParticipants: null,
      profilesWithoutParticipant: null,
      crossCaseProfiles: null,
      duplicateActiveProfiles: null,
      invalidValidityWindows: null,
      silentReassignments: null,
      missingPolicies: [],
      missingConstraints: [],
      error:
        error instanceof Error
          ? error.message
          : "tramo_r2a_integrity_verification_failed",
    }),
  );
  process.exitCode = 1;
});

async function main() {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.MBA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_admin_environment_missing");

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.rpc(
    "eve_verify_tramo_r2a_case_participant_integrity",
  );
  if (error || !data || typeof data !== "object") {
    throw new Error(
      error?.message
        ? `tramo_r2a_integrity_rpc_failed:${error.message}`
        : "tramo_r2a_integrity_rpc_failed",
    );
  }

  const result = {
    status: data.status === "pass" ? "pass" : "fail",
    duplicateActiveParticipants: numberOrNull(
      data.duplicateActiveParticipants,
    ),
    profilesWithoutParticipant: numberOrNull(data.profilesWithoutParticipant),
    crossCaseProfiles: numberOrNull(data.crossCaseProfiles),
    duplicateActiveProfiles: numberOrNull(data.duplicateActiveProfiles),
    invalidValidityWindows: numberOrNull(data.invalidValidityWindows),
    silentReassignments: numberOrNull(data.silentReassignments),
    missingPolicies: stringArray(data.missingPolicies),
    missingConstraints: stringArray(data.missingConstraints),
  };

  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "pass") process.exitCode = 1;
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}
