#!/usr/bin/env node
/**
 * Unit 2C — classify orphan cases without writing to the database.
 *
 * Usage:
 *   node classify-orphan-cases.mjs --all --snapshot=reports/staging/unit2/orphan-cases-snapshot.json
 *   node classify-orphan-cases.mjs --case=<uuid> --snapshot=...
 *   node classify-orphan-cases.mjs --all --output=reports/staging/unit2/orphan-cases-inventory.json
 *
 * Live DB mode (optional, read-only):
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   node classify-orphan-cases.mjs --all --live
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  classifyOrphanCase,
  summarizeClassifications,
} from "./orphan-case-classification-lib.mjs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const args = parseArgs(process.argv.slice(2));

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "classify_orphan_failed",
    }),
  );
  process.exitCode = 1;
});

async function main() {
  if (!args.all && !args.case) {
    throw new Error("require --all or --case=<uuid>");
  }
  if (args.case && !UUID_PATTERN.test(args.case)) {
    throw new Error("invalid_case_uuid");
  }

  const evidenceIndex = loadEvidenceRegistry(args.registry);
  const orphans = args.live
    ? await loadOrphansFromDb(args.case ?? null)
    : loadOrphansFromSnapshot(args.snapshot, args.case ?? null);

  const assessments = orphans.map((orphan) =>
    classifyOrphanCase(
      {
        caseId: orphan.caseId,
        caseLabel: orphan.caseLabel ?? null,
      },
      evidenceIndex,
    ),
  );

  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    unit: "2C",
    mode: args.live ? "live_readonly" : "snapshot",
    totalAnalyzed: assessments.length,
    classificationCounts: summarizeClassifications(assessments),
    preservedCanonicalAmber: evidenceIndex.preservedCanonical ?? null,
    assessments,
  };

  const serialized = JSON.stringify(payload, null, 2);
  if (args.output) {
    const outputPath = resolve(args.output);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, serialized);
  }
  console.log(serialized);
}

function loadEvidenceRegistry(pathArg) {
  const path = resolve(
    pathArg || "reports/staging/unit2/orphan-evidence-registry.json",
  );
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadOrphansFromSnapshot(pathArg, caseId) {
  const path = resolve(
    pathArg || "reports/staging/unit2/orphan-cases-snapshot.json",
  );
  const snapshot = JSON.parse(readFileSync(path, "utf8"));
  const cases = Array.isArray(snapshot.cases) ? snapshot.cases : [];
  const filtered = caseId
    ? cases.filter((row) => row.caseId === caseId)
    : cases;
  if (caseId && filtered.length === 0) {
    throw new Error("case_not_found_in_snapshot");
  }
  return filtered;
}

async function loadOrphansFromDb(caseId) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.MBA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_admin_environment_missing");

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = client
    .from("sesiones_llenado")
    .select("id, display_name, estado_actual, created_at, porcentaje_avance")
    .or("client_company_id.is.null,client_relationship_id.is.null")
    .order("created_at", { ascending: true });

  if (caseId) query = query.eq("id", caseId);

  const { data, error } = await query;
  if (error) throw new Error("orphan_query_failed");
  const rows = (data ?? []).map((row) => ({
    caseId: row.id,
    caseLabel: row.display_name ?? null,
    estadoActual: row.estado_actual ?? null,
    createdAt: row.created_at ?? null,
    porcentajeAvance:
      typeof row.porcentaje_avance === "number" ? row.porcentaje_avance : null,
  }));
  if (caseId && rows.length === 0) throw new Error("case_not_found");
  return rows;
}

function parseArgs(values) {
  const parsed = {};
  for (const value of values) {
    if (!value.startsWith("--")) {
      throw new Error(`invalid_argument:${value}`);
    }
    if (!value.includes("=")) {
      parsed[value.slice(2)] = true;
      continue;
    }
    const [key, ...rest] = value.slice(2).split("=");
    parsed[key] = rest.join("=");
  }
  return parsed;
}
