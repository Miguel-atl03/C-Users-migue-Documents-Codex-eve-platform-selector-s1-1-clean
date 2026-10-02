#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "fail",
      missingCoreDefinitions: [],
      duplicateCoreDefinitions: [],
      invalidSequences: null,
      casesWithIncompleteCoreLinks: null,
      crossCaseOperationalMilestoneLinks: null,
      achievementsWithoutEvidence: null,
      objectStateMismatches: null,
      duplicateActiveAchievements: null,
      invalidRevocations: null,
      missingPolicies: [],
      missingConstraints: [],
      error:
        error instanceof Error
          ? error.message
          : "unit_4a_integrity_verification_failed",
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
    "eve_verify_unit4a_core_milestone_integrity",
  );
  if (error || !data || typeof data !== "object") {
    throw new Error(
      error?.message
        ? `unit_4a_integrity_rpc_failed:${error.message}`
        : "unit_4a_integrity_rpc_failed",
    );
  }

  const result = {
    status: data.status === "pass" ? "pass" : "fail",
    missingCoreDefinitions: stringArray(data.missingCoreDefinitions),
    duplicateCoreDefinitions: stringArray(data.duplicateCoreDefinitions),
    invalidSequences: numberOrNull(data.invalidSequences),
    casesWithIncompleteCoreLinks: numberOrNull(
      data.casesWithIncompleteCoreLinks,
    ),
    crossCaseOperationalMilestoneLinks: numberOrNull(
      data.crossCaseOperationalMilestoneLinks,
    ),
    achievementsWithoutEvidence: numberOrNull(
      data.achievementsWithoutEvidence,
    ),
    objectStateMismatches: numberOrNull(data.objectStateMismatches),
    duplicateActiveAchievements: numberOrNull(
      data.duplicateActiveAchievements,
    ),
    invalidRevocations: numberOrNull(data.invalidRevocations),
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
