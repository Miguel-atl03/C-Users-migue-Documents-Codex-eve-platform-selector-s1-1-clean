import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-rector11-path-hook.mjs");
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

const { buildActivitySelectionCoverageView } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-activity-selection-service.ts",
    ),
  ).href
);

test("§11 vacío factual sin resultado effective", async () => {
  const repo = {
    async countEffectiveBySession() {
      return 0;
    },
    async findEffectiveBySession() {
      return null;
    },
    async listItemsByResultId() {
      return [];
    },
  };
  const view = await buildActivitySelectionCoverageView(repo, {
    caseId: "c",
    participantId: "p",
    profileId: "pr",
    roleRuntimeSessionId: "s",
  });
  assert.equal(view.dataStatus, "unavailable");
  assert.match(view.message ?? "", /No hay un resultado de selección registrado/);
});

test("§11 available separa primarias y no primarias; no recalcula", async () => {
  const repo = {
    async countEffectiveBySession() {
      return 1;
    },
    async findEffectiveBySession() {
      return {
        id: "r1",
        caseId: "c",
        participantId: "p",
        profileId: "pr",
        roleRuntimeSessionId: "s",
        policyCode: "PRIMARY_ACTIVITY_SELECTION",
        policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3",
        sourceSnapshotReference: "workmap-file:fx",
        sourceSnapshotHash: "abc",
        resultVersion: 1,
        lifecycleState: "effective",
        selectionMode: "non_competitive_inclusion",
        eligibleCount: 2,
        selectedCount: 2,
        nonPrimaryContextCount: 1,
        workmapCoverageGap: false,
        promotionConditionCode: "reenter_if_signal",
        computedAt: "2026-07-16T00:00:00Z",
        effectiveFrom: "2026-07-16T00:00:00Z",
      };
    },
    async listItemsByResultId() {
      return [
        {
          id: "i1",
          resultId: "r1",
          activityId: "a1",
          displayLabel: "Entregar pedido",
          classification: "primary",
          selectedSlot: 1,
          selectionReasonCode: "included_all_eligible_under_8",
          sourceReference: "workmap",
          promotionConditionCode: null,
        },
        {
          id: "i2",
          resultId: "r1",
          activityId: "a2",
          displayLabel: "Armar kit",
          classification: "primary",
          selectedSlot: 2,
          selectionReasonCode: "included_all_eligible_under_8",
          sourceReference: "workmap",
          promotionConditionCode: null,
        },
        {
          id: "i3",
          resultId: "r1",
          activityId: "a3",
          displayLabel: "Archivar",
          classification: "non_primary",
          selectedSlot: null,
          selectionReasonCode: null,
          sourceReference: "workmap",
          promotionConditionCode: "reenter_if_signal",
        },
      ];
    },
  };
  const view = await buildActivitySelectionCoverageView(repo, {
    caseId: "c",
    participantId: "p",
    profileId: "pr",
    roleRuntimeSessionId: "s",
  });
  assert.equal(view.dataStatus, "available");
  assert.equal(view.selectionMode, "non-competitive-inclusion");
  assert.equal(view.selectionModeLabel, "Inclusión directa");
  assert.equal(view.primaryActivities.length, 2);
  assert.equal(view.nonPrimaryActivities.length, 1);
  assert.equal(view.selectedCount, 2);
});

test("§11 inconsistencia de conteos degrada a partial", async () => {
  const repo = {
    async countEffectiveBySession() {
      return 1;
    },
    async findEffectiveBySession() {
      return {
        id: "r1",
        caseId: "c",
        participantId: "p",
        profileId: "pr",
        roleRuntimeSessionId: "s",
        policyCode: "PRIMARY_ACTIVITY_SELECTION",
        policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3",
        sourceSnapshotReference: "workmap-file:fx",
        sourceSnapshotHash: "abc",
        resultVersion: 1,
        lifecycleState: "effective",
        selectionMode: "competitive_selection",
        eligibleCount: 12,
        selectedCount: 8,
        nonPrimaryContextCount: 4,
        workmapCoverageGap: false,
        promotionConditionCode: null,
        computedAt: "2026-07-16T00:00:00Z",
        effectiveFrom: "2026-07-16T00:00:00Z",
      };
    },
    async listItemsByResultId() {
      return [
        {
          id: "i1",
          resultId: "r1",
          activityId: "a1",
          displayLabel: "Solo una",
          classification: "primary",
          selectedSlot: 1,
          selectionReasonCode: "selected_for_high_final_score",
          sourceReference: "workmap",
          promotionConditionCode: null,
        },
      ];
    },
  };
  const view = await buildActivitySelectionCoverageView(repo, {
    caseId: "c",
    participantId: "p",
    profileId: "pr",
    roleRuntimeSessionId: "s",
  });
  assert.equal(view.dataStatus, "partial");
  assert.match(view.message ?? "", /incompleto/i);
});

test("§11 migración, BFF, UI y scripts existen; ejes 7–9 intactos; §12 no iniciado", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "supabase/migrations/20260716190000_eve_official_control_panel_point11_activity_selection_results.sql",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activity-selection/route.ts",
      ),
    ),
  );
  const activitySelectionRoute = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activity-selection/route.ts",
  );
  assert.match(activitySelectionRoute, /export async function GET/);
  assert.match(activitySelectionRoute, /export async function POST/);
  assert.match(
    activitySelectionRoute,
    /eve_publish_canonical_activity_selection_as_consultant/,
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/components/ActivitySelectionCoveragePanel.tsx",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/manage-activity-selection-results.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/verify-point11-activity-selection-integrity.mjs",
      ),
    ),
  );
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.match(shell, /SupportProcessAxis/);
  assert.match(shell, /CoreMilestoneRail/);
  assert.match(shell, /XyInteractionMatrix/);
  assert.match(shell, /selectActivity/);
  assert.doesNotMatch(shell, /RuntimeRunPanel/);

  const participantsPanel = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  assert.match(participantsPanel, /ActivitySelectionCoveragePanel/);
  assert.match(participantsPanel, /resolveActivityCoverageAvailability/);
  assert.doesNotMatch(
    participantsPanel,
    /selectedProfile && viewModel\.selectedSessionId/,
  );

  const coveragePanel = read(
    "src/features/official-consultant-control-panel/components/ActivitySelectionCoveragePanel.tsx",
  );
  assert.match(coveragePanel, /availability/);
  assert.match(coveragePanel, /Modo de selección/);
  assert.match(coveragePanel, /ABSENT_COUNT = "—"/);

  const milestoneDetail = read(
    "src/features/official-consultant-control-panel/components/CoreMilestoneDetail.tsx",
  );
  assert.match(milestoneDetail, /Condición esperada del caso/);
  assert.match(milestoneDetail, /Límite de espera/);
  assert.doesNotMatch(milestoneDetail, />Timer</);
  assert.doesNotMatch(milestoneDetail, /Estado del caso esperado/);

  const processSummary = read(
    "src/features/official-consultant-control-panel/components/SupportProcessWorkspaceSummary.tsx",
  );
  assert.match(processSummary, /Resultado esperado/);
  assert.doesNotMatch(processSummary, /Objeto y estado objetivo/);
});
