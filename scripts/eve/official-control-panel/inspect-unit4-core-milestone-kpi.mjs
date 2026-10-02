/**
 * Local factual gate for Unit 4 KPI readiness.
 * After Unit 4A, persistence may exist while KPI UI remains inactive.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const CONTAINER =
  process.env.EVE_LOCAL_DB_CONTAINER || "supabase_db_eve-platform";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function psql(sql) {
  const out = execFileSync(
    "docker",
    [
      "exec",
      CONTAINER,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-c",
      sql,
    ],
    { encoding: "utf8" },
  );
  return out
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function fileHas(rel, pattern) {
  const full = resolve(ROOT, rel);
  if (!existsSync(full)) return false;
  return pattern.test(readFileSync(full, "utf8"));
}

function main() {
  let tables = [];
  let amberProcess = "0";
  let amberLinks = "0";
  let amberAchievements = "0";
  try {
    tables = psql(`
      select table_name
      from information_schema.tables
      where table_schema='public'
        and table_name in (
          'core_milestone_definitions',
          'case_core_milestones',
          'core_milestone_achievements'
        )
      order by 1
    `);
    amberProcess =
      psql(
        `select count(*)::text from public.case_main_processes where case_id='${AMBER_CASE}'::uuid and enabled=true`,
      )[0] ?? "0";
    if (tables.includes("case_core_milestones")) {
      amberLinks =
        psql(
          `select count(*)::text from public.case_core_milestones where case_id='${AMBER_CASE}'::uuid and enabled=true`,
        )[0] ?? "0";
    }
    if (tables.includes("core_milestone_achievements")) {
      amberAchievements =
        psql(
          `select count(*)::text
           from public.core_milestone_achievements a
           join public.case_core_milestones ccm on ccm.id = a.case_core_milestone_id
           where ccm.case_id='${AMBER_CASE}'::uuid and a.revoked_at is null`,
        )[0] ?? "0";
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        verdict: "UNIT_4_INSPECT_ERROR",
        inspectError: error instanceof Error ? error.message : String(error),
      }, null, 2),
    );
    process.exit(1);
  }

  const hasUnit4a =
    tables.includes("core_milestone_definitions") &&
    tables.includes("case_core_milestones") &&
    tables.includes("core_milestone_achievements");

  const kpiStripCalculates = fileHas(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
    /coreMilestoneProgress|\d+\s*de\s*\d+/,
  );
  const bffHasProgress = fileHas(
    "src/services/eve/official-control-panel/official-control-panel-process-structure.types.ts",
    /coreMilestoneProgress/,
  );

  const report = {
    verdict: hasUnit4a
      ? "UNIT_4A_PERSISTENCE_PRESENT_KPI_UI_NOT_ACTIVATED"
      : "UNIT_4_BLOCKED",
    unit4KpiUiActivation: kpiStripCalculates ? "unexpectedly_active" : "not_started",
    reason: hasUnit4a
      ? "Persistencia H0–H6 presente. KPI visual no activado. Amber debe permanecer unavailable sin logros inventados."
      : "Sin persistencia Unit 4A de hitos core / evidencia.",
    tables,
    amber: {
      caseId: AMBER_CASE,
      enabledMainProcesses: Number(amberProcess),
      enabledCoreLinks: Number(amberLinks),
      activeAchievements: Number(amberAchievements),
      expectedProgressStatus: "unavailable",
    },
    productFreeze: {
      bffExposesCoreMilestoneProgress: bffHasProgress,
      kpiStripCalculatesNumericProgress: kpiStripCalculates,
    },
  };

  console.log(JSON.stringify(report, null, 2));

  if (kpiStripCalculates) process.exit(2);
  process.exit(0);
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify({
      verdict: "UNIT_4_INSPECT_ERROR",
      inspectError: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
}
