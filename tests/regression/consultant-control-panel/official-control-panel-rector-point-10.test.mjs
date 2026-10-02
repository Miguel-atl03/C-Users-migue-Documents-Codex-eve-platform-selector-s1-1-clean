import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-rector10-bridge-hook.mjs");
writeFileSync(
  hookPath,
  `import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const root = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = resolvePath(root, "src", specifier.slice(2));
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

const {
  buildMonitoringRolesResponse,
  buildMonitoringActivitiesResponse,
  buildMonitoringUsersResponse,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-monitoring-service.ts",
    ),
  ).href
);

const { changeMonitoringSession } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/state/monitoring-depth-navigation.ts",
    ),
  ).href
);

function participantsRepo() {
  return {
    async listEnabledParticipantsByCase() {
      return [
        {
          id: "p1",
          caseId: "c1",
          userId: "u1",
          displayLabel: "Laura",
          participationStatus: "active",
          validFrom: "2026-01-01",
          validUntil: null,
          enabled: true,
        },
      ];
    },
    async findParticipantById(id) {
      if (id !== "p1") return null;
      return {
        id: "p1",
        caseId: "c1",
        userId: "u1",
        displayLabel: "Laura",
        participationStatus: "active",
        validFrom: "2026-01-01",
        validUntil: null,
        enabled: true,
      };
    },
    async listEnabledProfilesByParticipant() {
      return [
        {
          id: "pr1",
          caseParticipantId: "p1",
          displayLabel: "Operaciones",
          resolutionStatus: "resolved",
          validFrom: "2026-01-01",
          validUntil: null,
          enabled: true,
        },
      ];
    },
    async findProfileById(id) {
      if (id !== "pr1") return null;
      return {
        id: "pr1",
        caseParticipantId: "p1",
        displayLabel: "Operaciones",
        resolutionStatus: "resolved",
        validFrom: "2026-01-01",
        validUntil: null,
        enabled: true,
      };
    },
  };
}

test("migración puente perfil↔RRS existe y no usa role_id como FK", () => {
  const migration = read(
    "supabase/migrations/20260716170000_eve_official_control_panel_point10_profile_runtime_links.sql",
  );
  assert.match(migration, /case_profile_runtime_session_links/);
  assert.match(migration, /profile_runtime_session_case_mismatch/);
  assert.match(migration, /case_profile_rrs_one_active_profile_per_session_idx/);
  assert.match(migration, /do NOT use role_runtime_session\.role_id/i);
  assert.match(migration, /Does not equate role_id/);
  assert.match(migration, /profile_runtime_session_link_created/);
});

test("roles: sin vínculo / una sesión / varias / pendiente", async () => {
  const repo = participantsRepo();

  const none = await buildMonitoringRolesResponse(repo, {
    async findLinkedRoleSessionsByProfile() {
      return [];
    },
  }, "p1");
  assert.equal(none.roles[0].activitiesLinkStatus, "no_runtime_session_link");
  assert.equal(none.roles[0].roleRuntimeSessionId, null);

  const one = await buildMonitoringRolesResponse(repo, {
    async findLinkedRoleSessionsByProfile() {
      return [
        {
          linkId: "l1",
          profileId: "pr1",
          roleRuntimeSessionId: "s1",
          caseId: "c1",
          state: "active",
          linkStatus: "confirmed",
          validFrom: "2026-01-01",
          validUntil: null,
        },
      ];
    },
  }, "p1");
  assert.equal(one.roles[0].activitiesLinkStatus, "linked");
  assert.equal(one.roles[0].roleRuntimeSessionId, "s1");

  const many = await buildMonitoringRolesResponse(repo, {
    async findLinkedRoleSessionsByProfile() {
      return [
        {
          linkId: "l1",
          profileId: "pr1",
          roleRuntimeSessionId: "s1",
          caseId: "c1",
          state: "active",
          linkStatus: "confirmed",
          validFrom: "2026-01-01",
          validUntil: null,
        },
        {
          linkId: "l2",
          profileId: "pr1",
          roleRuntimeSessionId: "s2",
          caseId: "c1",
          state: "active",
          linkStatus: "confirmed",
          validFrom: "2026-01-02",
          validUntil: null,
        },
      ];
    },
  }, "p1");
  assert.equal(many.roles[0].activitiesLinkStatus, "multiple_runtime_sessions");
  assert.equal(many.roles[0].roleRuntimeSessionId, null);
  assert.deepEqual(many.roles[0].roleRuntimeSessionIds, ["s1", "s2"]);

  const pending = await buildMonitoringRolesResponse(repo, {
    async findLinkedRoleSessionsByProfile() {
      return [
        {
          linkId: "l1",
          profileId: "pr1",
          roleRuntimeSessionId: "s1",
          caseId: "c1",
          state: "draft",
          linkStatus: "pending_review",
          validFrom: "2026-01-01",
          validUntil: null,
        },
      ];
    },
  }, "p1");
  assert.equal(pending.roles[0].activitiesLinkStatus, "pending_review");
});

test("actividades: solo de sesión vinculada; B0 canónico se proyecta desde el run", async () => {
  const repo = participantsRepo();
  const runtime = {
    async findLinkedRoleSessionsByProfile() {
      return [
        {
          linkId: "l1",
          profileId: "pr1",
          roleRuntimeSessionId: "s1",
          caseId: "c1",
          state: "active",
          linkStatus: "confirmed",
          validFrom: "2026-01-01",
          validUntil: null,
        },
      ];
    },
    async listActivityRunsBySession(sessionId) {
      assert.equal(sessionId, "s1");
      return [
        {
          id: "run1",
          caseId: "c1",
          roleRuntimeSessionId: "s1",
          activityId: "act-1",
          activityLabel: "Solicito y envio factura",
          state: "active_base_capture",
          baseVisibleCount: 3,
          causalVisibleCount: 1,
          readinessState: "ready",
          currentRuntimeInteractionId: null,
          interactionInstanceCount: 4,
          confirmedInteractionInstanceCount: 4,
          subfieldResponseCount: 11,
          evidenceItemCount: 11,
          canonicalVariableCount: 11,
        },
      ];
    },
  };

  const body = await buildMonitoringActivitiesResponse(
    repo,
    runtime,
    "pr1",
    "s1",
  );
  assert.equal(body.linkStatus, "linked");
  assert.equal(body.activities.length, 1);
  assert.equal(body.activities[0].runStateLabel, "Runtime en ejecución");
  assert.equal(body.activities[0].label, "Solicito y envio factura");
  assert.equal(
    body.activities[0].baseLabel,
    "B0 confirmado (4/4, 11 subcampos, 11 evidencias, 11 variables)",
  );
  assert.equal(body.activities[0].currentBlockLabel, "B0 confirmado");
  assert.equal(body.activities[0].readinessLabel, "ready");
});

test("conteo fallido produce null, no cero", async () => {
  const users = await buildMonitoringUsersResponse(participantsRepo(), {
    async countRoleSessionsByCase() {
      return null;
    },
    async countActivityRunsByCase() {
      return null;
    },
  }, "c1");
  assert.equal(users.caseRoleSessionCount, null);
  assert.equal(users.caseActivityRunCount, null);
});

test("navegación cambio de sesión limpia activity/run", () => {
  const current = new URLSearchParams(
    "participant=p1&profile=pr1&role_runtime_session_id=s1&activity_id=a1&run=r1",
  );
  const next = changeMonitoringSession(current, {
    participantId: "p1",
    userId: null,
    profileId: "pr1",
    roleRuntimeSessionId: "s2",
  });
  assert.equal(next.get("role_runtime_session_id"), "s2");
  assert.equal(next.get("activity_id"), null);
  assert.equal(next.get("run"), null);
});

test("scripts y docs del puente existen; ejes 7–9 intactos en shell", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/manage-profile-runtime-session-links.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/verify-point10-profile-runtime-links.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "docs/eve/panel-control/RECTOR_POINT_10_PROFILE_RUNTIME_LINK_IMPLEMENTATION.md",
      ),
    ),
  );

  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.match(shell, /SupportProcessAxis/);
  assert.match(shell, /CoreMilestoneRail/);
  assert.match(shell, /XyInteractionMatrix/);
});
