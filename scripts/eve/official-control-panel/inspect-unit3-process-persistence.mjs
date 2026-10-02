/**
 * Local factual gate for Unit 3 process + milestones persistence.
 * After Unit 3A, expected tables exist; Amber may still have empty structure.
 * Does not invent rows; does not touch staging/production.
 */
import { execFileSync } from "child_process";

const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const CONTAINER = process.env.EVE_LOCAL_DB_CONTAINER || "supabase_db_eve-platform";
const UNIT3A_TABLES = ["case_main_processes", "case_milestones"];

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
      "-F",
      "|",
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

function main() {
  const processTables = psql(`
    select table_name
    from information_schema.tables
    where table_schema='public'
      and (
        table_name ilike '%milestone%'
        or table_name ilike '%hito%'
        or table_name ilike '%main_process%'
        or table_name ilike '%proceso%'
        or table_name ilike '%process_structure%'
        or table_name ilike '%case_process%'
      )
    order by 1
  `);

  const processishCols = psql(`
    select table_name || '.' || column_name
    from information_schema.columns
    where table_schema='public'
      and (
        column_name ilike '%milestone%'
        or column_name ilike '%hito%'
        or column_name ilike '%main_process%'
        or column_name ilike '%proceso_principal%'
        or column_name ilike '%current_milestone%'
        or column_name ilike '%expected_event%'
        or column_name ilike '%support_process%'
      )
    order by 1
  `);

  const amber = psql(`
    select
      id::text
      || '|' || left(coalesce(display_name,''), 80)
      || '|' || (client_company_id is not null)::text
      || '|' || (client_relationship_id is not null)::text
      || '|' || coalesce(estado_actual, 'NULL')
    from public.sesiones_llenado
    where id = '${AMBER_CASE}'::uuid
  `);

  let amberProcessCount = "0";
  let amberMilestoneCount = "0";
  try {
    amberProcessCount = psql(
      `select count(*)::text from public.case_main_processes where case_id='${AMBER_CASE}'::uuid and enabled=true`,
    )[0] ?? "0";
    amberMilestoneCount = psql(
      `select count(*)::text
       from public.case_milestones m
       join public.case_main_processes p on p.id = m.main_process_id
       where p.case_id='${AMBER_CASE}'::uuid and m.enabled=true`,
    )[0] ?? "0";
  } catch {
    amberProcessCount = "tables_missing";
    amberMilestoneCount = "tables_missing";
  }

  const hasUnit3a =
    UNIT3A_TABLES.every((name) => processTables.includes(name));

  const pstN = psql(
    `select count(*)::text from public.process_state_timer_event where case_id='${AMBER_CASE}'::uuid`,
  );
  let pmN = [];
  let pmErr = null;
  try {
    pmN = psql(
      `select count(*)::text from public.eve_pm_registry where case_id='${AMBER_CASE}'`,
    );
  } catch (error) {
    pmErr = error instanceof Error ? error.message : String(error);
  }

  const report = {
    verdict: hasUnit3a
      ? "UNIT_3A_PERSISTENCE_PRESENT"
      : "UNIT_3_BLOCKED",
    unit3UiActivation: "not_started",
    reason: hasUnit3a
      ? "Persistencia Unit 3A presente. Amber puede permanecer sin proceso/hitos (ausencia factual). UI Unit 3 no activada."
      : "No existe persistencia factual Case → Proceso principal → Hitos del caso para el Panel Oficial.",
    processMilestoneTables: processTables,
    processishColumns: processishCols,
    amberCase: amber[0]
      ? (() => {
          const [id, label, hasCompany, hasRelationship, estadoActual] =
            amber[0].split("|");
          return {
            id,
            label,
            hasCompany: hasCompany === "t" || hasCompany === "true",
            hasRelationship:
              hasRelationship === "t" || hasRelationship === "true",
            estadoActual,
            enabledMainProcesses: amberProcessCount,
            enabledMilestones: amberMilestoneCount,
          };
        })()
      : null,
    process_state_timer_event_for_amber: Number(pstN[0] ?? "0"),
    eve_pm_registry_for_amber: pmErr ? { error: pmErr } : Number(pmN[0] ?? "0"),
    excluded_near_misses: [
      "process_state_timer_event → Runtime 40+20 (fuera de Unidad 3)",
      "eve_pm_registry → registro candidato PM, no hitos operativos del panel",
      "BPMN corpus → diseño, no persistencia",
      "estado_actual en sesiones_llenado → capa de cuestionario, no hito del caso",
    ],
  };

  console.log(JSON.stringify(report, null, 2));

  if (!hasUnit3a && processTables.length === 0 && processishCols.length === 0) {
    process.exit(0);
  }
  if (hasUnit3a) {
    process.exit(0);
  }
  process.exit(2);
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify({
      verdict: "UNIT_3_BLOCKED",
      inspectError: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
}
