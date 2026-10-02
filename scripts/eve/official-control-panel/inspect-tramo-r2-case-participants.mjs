/**
 * Local factual gate for Tramo R2 / R2A (case participants → functional profiles).
 * Evaluates real evidence. Does not invent Amber participants.
 * sesiones_llenado.usuario_id is NEVER treated as case participant.
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

function tableExists(name) {
  const rows = psql(`
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = '${name}'
  `);
  return rows.length > 0;
}

function hasColumns(table, columns) {
  const found = psql(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = '${table}'
      and column_name in (${columns.map((c) => `'${c}'`).join(",")})
    order by 1
  `);
  return columns.every((c) => found.includes(c));
}

function hasFk(table, column) {
  const rows = psql(`
    select 1
    from information_schema.key_column_usage k
    join information_schema.table_constraints c
      on c.constraint_name = k.constraint_name
     and c.table_schema = k.table_schema
    where k.table_schema = 'public'
      and k.table_name = '${table}'
      and k.column_name = '${column}'
      and c.constraint_type = 'FOREIGN KEY'
  `);
  return rows.length > 0;
}

function hasPolicy(table) {
  const rows = psql(`
    select 1 from pg_policies
    where schemaname = 'public' and tablename = '${table}'
    limit 1
  `);
  return rows.length > 0;
}

function main() {
  let amberSessionOwner = null;
  let amberParticipantCount = "0";
  let amberProfileCount = "0";
  let amberRoleRuntimeCount = "0";

  try {
    amberSessionOwner =
      psql(`
        select coalesce(usuario_id::text, '')
        from public.sesiones_llenado
        where id = '${AMBER_CASE}'::uuid
      `)[0] || null;

    amberRoleRuntimeCount =
      psql(
        `select count(*)::text from public.role_runtime_session where case_id = '${AMBER_CASE}'::uuid`,
      )[0] ?? "0";

    if (tableExists("case_participants")) {
      amberParticipantCount =
        psql(
          `select count(*)::text from public.case_participants where case_id = '${AMBER_CASE}'::uuid and enabled = true`,
        )[0] ?? "0";
    }
    if (tableExists("case_participant_profiles")) {
      amberProfileCount =
        psql(`
          select count(*)::text
          from public.case_participant_profiles p
          join public.case_participants cp on cp.id = p.case_participant_id
          where cp.case_id = '${AMBER_CASE}'::uuid
            and p.enabled = true
            and cp.enabled = true
        `)[0] ?? "0";
    }
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          verdict: "TRAMO_R2_INSPECT_ERROR",
          inspectError: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const hasParticipantsTable = tableExists("case_participants");
  const hasProfilesTable = tableExists("case_participant_profiles");

  const factualCaseToParticipant =
    hasParticipantsTable &&
    hasColumns("case_participants", ["case_id", "user_id", "enabled"]) &&
    hasFk("case_participants", "case_id") &&
    hasFk("case_participants", "user_id") &&
    hasPolicy("case_participants");

  const factualParticipantToProfile =
    hasProfilesTable &&
    hasColumns("case_participant_profiles", [
      "case_participant_id",
      "display_label",
      "resolution_status",
      "enabled",
    ]) &&
    hasFk("case_participant_profiles", "case_participant_id") &&
    hasPolicy("case_participant_profiles");

  const hasParticipantsApi = existsSync(
    resolve(
      ROOT,
      "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/route.ts",
    ),
  );
  const hasProfilesApi = existsSync(
    resolve(
      ROOT,
      "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/route.ts",
    ),
  );
  const kpiStripCalculatesUsers = fileHas(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
    /Usuarios[\s\S]{0,120}(?!—)\d/,
  );
  const uiNavigationActive = fileHas(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
    /Personas participantes/,
  );

  const persistenceReady =
    factualCaseToParticipant && factualParticipantToProfile;
  const bffReady = hasParticipantsApi && hasProfilesApi;

  let verdict;
  let reason;
  if (!persistenceReady) {
    verdict = "TRAMO_R2_BLOCKED_INSUFFICIENT_FACTUAL_SOURCE";
    reason =
      "Falta contrato oficial Caso→Participante y/o Participante→Perfil (tablas, FKs, RLS). sesiones_llenado.usuario_id no cuenta.";
  } else if (!bffReady) {
    verdict = "TRAMO_R2A_PERSISTENCE_PRESENT_BFF_INCOMPLETE";
    reason =
      "Persistencia R2A detectada; BFF participants/profiles incompleto.";
  } else {
    verdict = "TRAMO_R2A_PERSISTENCE_PRESENT";
    reason =
      "Fuente factual Caso→Participante→Perfil presente. UI R2B y KPI Usuarios/Roles no activados por este inspector.";
  }

  const report = {
    verdict,
    reason,
    factualCaseToParticipant,
    factualParticipantToProfile,
    tables: {
      case_participants: hasParticipantsTable,
      case_participant_profiles: hasProfilesTable,
    },
    amber: {
      caseId: AMBER_CASE,
      sesionesLlenadoUsuarioId: amberSessionOwner,
      caseParticipantCount: Number(amberParticipantCount),
      caseParticipantProfileCount: Number(amberProfileCount),
      roleRuntimeSessionCount: Number(amberRoleRuntimeCount),
      note: "sesiones_llenado.usuario_id ≠ case_participants; vacío Amber es válido",
      sessionOwnerIsNotParticipantContract: true,
    },
    productFreeze: {
      participantsBffPresent: hasParticipantsApi,
      profilesBffPresent: hasProfilesApi,
      kpiUsersRolesNumeric: kpiStripCalculatesUsers,
      uiPersonasParticipantesActive: uiNavigationActive,
    },
    nextRectorPoint: uiNavigationActive
      ? "R2B ya visible — revisar alcance"
      : "R2B — navegación visual Caso → Persona → Perfil (requiere aprobación)",
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

main();
