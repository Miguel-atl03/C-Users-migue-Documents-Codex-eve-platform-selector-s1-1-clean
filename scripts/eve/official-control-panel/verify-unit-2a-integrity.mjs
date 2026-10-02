#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "fail",
      orphanCases: null,
      crossCompanyCases: null,
      invalidAssignments: null,
      missingPolicies: [],
      missingConstraints: [],
      error:
        error instanceof Error
          ? error.message
          : "unit_2a_integrity_verification_failed",
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
    "eve_verify_official_context_integrity",
  );

  if (error || !data || typeof data !== "object") {
    throw new Error("unit_2a_integrity_rpc_failed");
  }

  const result = {
    status: data.status === "pass" ? "pass" : "fail",
    orphanCases: numberOrNull(data.orphanCases),
    crossCompanyCases: numberOrNull(data.crossCompanyCases),
    invalidAssignments: numberOrNull(data.invalidAssignments),
    missingPolicies: stringArray(data.missingPolicies),
    missingConstraints: stringArray(data.missingConstraints),
    relationshipsWithoutCompany: numberOrNull(
      data.relationshipsWithoutCompany,
    ),
    duplicateActiveAssignments: numberOrNull(
      data.duplicateActiveAssignments,
    ),
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
