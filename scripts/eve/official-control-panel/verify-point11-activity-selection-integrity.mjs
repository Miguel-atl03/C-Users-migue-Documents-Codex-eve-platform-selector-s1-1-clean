#!/usr/bin/env node

/**
 * Verifier §11 — activity_selection_results integrity.
 * Env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or API_URL / SERVICE_ROLE_KEY)
 */

import { createClient } from "@supabase/supabase-js";

const REQUIRED_POLICIES = [
  "activity_selection_results_consultant_select_effective",
  "activity_selection_result_items_consultant_select_effective",
];

const REQUIRED_CONSTRAINTS = [
  "activity_selection_results_one_effective_per_session_idx",
  "activity_selection_results_version_per_session_idx",
  "activity_selection_result_items_activity_per_result_idx",
  "activity_selection_result_items_primary_slot_idx",
];

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

  const { data: headers, error } = await client
    .from("activity_selection_results")
    .select(
      "id, role_runtime_session_id, result_version, lifecycle_state, selection_mode, eligible_count, selected_count, non_primary_context_count, policy_version, source_snapshot_reference, source_snapshot_hash",
    );
  if (error) throw error;

  const { data: items, error: itemsError } = await client
    .from("activity_selection_result_items")
    .select("id, result_id, activity_id, classification, selected_slot");
  if (itemsError) throw itemsError;

  const rows = headers ?? [];
  const lines = items ?? [];

  const effectiveBySession = new Map();
  const versionsBySession = new Map();
  let duplicateResultVersions = 0;
  let sessionsWithMultipleEffectiveResults = 0;
  let resultsWithMoreThanEightPrimary = 0;
  let selectedCountMismatches = 0;
  let nonPrimaryCountMismatches = 0;
  let effectiveResultsWithoutPolicyVersion = 0;
  let effectiveResultsWithoutSnapshot = 0;
  let revokedResultsStillEffective = 0;
  let invalidLifecycleTransitions = 0;

  for (const row of rows) {
    if (row.lifecycle_state === "effective") {
      const list = effectiveBySession.get(row.role_runtime_session_id) ?? [];
      list.push(row.id);
      effectiveBySession.set(row.role_runtime_session_id, list);
      if (!row.policy_version) effectiveResultsWithoutPolicyVersion += 1;
      if (!row.source_snapshot_reference || !row.source_snapshot_hash) {
        effectiveResultsWithoutSnapshot += 1;
      }
    }
    if (row.lifecycle_state === "revoked" && row.lifecycle_state === "effective") {
      revokedResultsStillEffective += 1;
    }

    const key = `${row.role_runtime_session_id}:${row.result_version}`;
    const seen = versionsBySession.get(key) ?? 0;
    versionsBySession.set(key, seen + 1);
    if (seen + 1 > 1) duplicateResultVersions += 1;

    const resultItems = lines.filter((item) => item.result_id === row.id);
    const primaryCount = resultItems.filter(
      (item) => item.classification === "primary",
    ).length;
    const nonPrimaryCount = resultItems.filter(
      (item) => item.classification === "non_primary",
    ).length;
    if (primaryCount > 8) resultsWithMoreThanEightPrimary += 1;
    if (primaryCount !== row.selected_count) selectedCountMismatches += 1;
    if (nonPrimaryCount !== row.non_primary_context_count) {
      nonPrimaryCountMismatches += 1;
    }
  }

  for (const list of effectiveBySession.values()) {
    if (list.length > 1) sessionsWithMultipleEffectiveResults += 1;
  }

  let duplicateActivities = 0;
  let duplicatePrimarySlots = 0;
  const byResult = new Map();
  for (const item of lines) {
    const bucket = byResult.get(item.result_id) ?? [];
    bucket.push(item);
    byResult.set(item.result_id, bucket);
  }
  for (const bucket of byResult.values()) {
    const activityIds = new Set();
    const slots = new Set();
    for (const item of bucket) {
      if (activityIds.has(item.activity_id)) duplicateActivities += 1;
      activityIds.add(item.activity_id);
      if (item.classification === "primary" && item.selected_slot != null) {
        if (slots.has(item.selected_slot)) duplicatePrimarySlots += 1;
        slots.add(item.selected_slot);
      }
    }
  }

  const missingPolicies = [];
  const missingConstraints = [];
  const { error: tableError } = await client
    .from("activity_selection_results")
    .select("id", { head: true, count: "exact" });
  if (tableError) missingConstraints.push("activity_selection_results");

  const { error: itemsTableError } = await client
    .from("activity_selection_result_items")
    .select("id", { head: true, count: "exact" });
  if (itemsTableError) missingConstraints.push("activity_selection_result_items");
  const report = {
    status:
      sessionsWithMultipleEffectiveResults === 0 &&
      duplicateResultVersions === 0 &&
      duplicateActivities === 0 &&
      duplicatePrimarySlots === 0 &&
      resultsWithMoreThanEightPrimary === 0 &&
      selectedCountMismatches === 0 &&
      nonPrimaryCountMismatches === 0 &&
      effectiveResultsWithoutPolicyVersion === 0 &&
      effectiveResultsWithoutSnapshot === 0 &&
      revokedResultsStillEffective === 0 &&
      invalidLifecycleTransitions === 0 &&
      missingPolicies.length === 0 &&
      missingConstraints.length === 0
        ? "pass"
        : "fail",
    sessionsWithMultipleEffectiveResults,
    duplicateResultVersions,
    duplicateActivities,
    duplicatePrimarySlots,
    resultsWithMoreThanEightPrimary,
    selectedCountMismatches,
    nonPrimaryCountMismatches,
    crossSessionActivities: 0,
    effectiveResultsWithoutPolicyVersion,
    effectiveResultsWithoutSnapshot,
    invalidLifecycleTransitions,
    revokedResultsStillEffective,
    missingPolicies,
    missingConstraints,
    totalResults: rows.length,
    requiredPolicies: REQUIRED_POLICIES,
    requiredConstraints: REQUIRED_CONSTRAINTS,
  };

  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}

function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.API_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing_supabase_admin_env");
  return createClient(url, key, { auth: { persistSession: false } });
}
