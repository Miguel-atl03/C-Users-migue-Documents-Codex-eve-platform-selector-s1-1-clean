#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "fail",
      casesWithMultipleActiveMainProcesses: null,
      milestonesWithoutProcess: null,
      crossCaseMilestones: null,
      invalidCurrentMilestones: null,
      duplicateSequences: null,
      waitingWithoutCause: null,
      missingPolicies: [],
      missingConstraints: [],
      error:
        error instanceof Error
          ? error.message
          : "unit_3a_integrity_verification_failed",
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
    "eve_verify_unit3a_process_structure_integrity",
  );

  if (error || !data || typeof data !== "object") {
    throw new Error("unit_3a_integrity_rpc_failed");
  }

  const result = {
    status: data.status === "pass" ? "pass" : "fail",
    casesWithMultipleActiveMainProcesses: numberOrNull(
      data.casesWithMultipleActiveMainProcesses,
    ),
    milestonesWithoutProcess: numberOrNull(data.milestonesWithoutProcess),
    crossCaseMilestones: numberOrNull(data.crossCaseMilestones),
    invalidCurrentMilestones: numberOrNull(data.invalidCurrentMilestones),
    duplicateSequences: numberOrNull(data.duplicateSequences),
    waitingWithoutCause: numberOrNull(data.waitingWithoutCause),
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
