import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = join(tmpdir(), "eve-p-client-01-path-hook.mjs");
writeFileSync(
  hookPath,
  `import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const projectRoot = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return { shortCircuit: true, url: pathToFileURL(mappedPath).href };
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\\.(tsx?|jsx?|mjs|cjs|json)$/.test(specifier) &&
    context.parentURL
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const withTs = resolvePath(parentDir, specifier + ".ts");
    const withTsx = resolvePath(parentDir, specifier + ".tsx");
    if (existsSync(withTs)) {
      return { shortCircuit: true, url: pathToFileURL(withTs).href };
    }
    if (existsSync(withTsx)) {
      return { shortCircuit: true, url: pathToFileURL(withTsx).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

const { buildConsultantControlPanelState } = await import(
  "@/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
);
const {
  buildPClient01WorkspaceVM,
  buildUserExperienceVM,
  buildPreRuntimeContextVM,
} = await import(
  "@/services/eve/consultant-control-panel/p-client-01-view-models.ts"
);
const { PROCESS_OPERATIONAL_VIEWS, defaultOperationalView, isPClient01OperationalView, parsePClient01UrlView, toPClient01UrlView } =
  await import(
    "@/components/consultant/control-panel/pm-process-catalog.ts"
  );

function assertExists(relativePath) {
  assert.equal(
    existsSync(resolve(projectRoot, relativePath)),
    true,
    `Missing ${relativePath}`,
  );
}

test("P-CLIENT-01 operational views are experience + pre-runtime", () => {
  assert.deepEqual(PROCESS_OPERATIONAL_VIEWS["P-CLIENT-01"], [
    "experience",
    "pre-runtime",
  ]);
  assert.equal(defaultOperationalView("P-CLIENT-01"), "experience");
  assert.equal(isPClient01OperationalView("experience"), true);
  assert.equal(isPClient01OperationalView("pre-runtime"), true);
  assert.equal(isPClient01OperationalView("cases"), false);
});

test("P-CLIENT-01 §2.1 URL aliases map to internal tabs", () => {
  assert.equal(parsePClient01UrlView("client-experience"), "experience");
  assert.equal(parsePClient01UrlView("pre-runtime-context"), "pre-runtime");
  assert.equal(parsePClient01UrlView("experience"), "experience");
  assert.equal(parsePClient01UrlView("cases"), null);
  assert.equal(toPClient01UrlView("experience"), "client-experience");
  assert.equal(toPClient01UrlView("pre-runtime"), "pre-runtime-context");
});

test("P-CLIENT-01 workspace components exist", () => {
  assertExists(
    "src/components/consultant/control-panel/p-client-01/PClient01Workspace.tsx",
  );
  assertExists(
    "src/components/consultant/control-panel/p-client-01/PClient01ContextHeader.tsx",
  );
  assertExists(
    "src/components/consultant/control-panel/p-client-01/PClient01ArchitecturalContract.tsx",
  );
  assertExists(
    "src/components/consultant/control-panel/p-client-01/PClient01StatusBand.tsx",
  );
  assertExists(
    "src/components/consultant/control-panel/p-client-01/UserExperienceView.tsx",
  );
  assertExists(
    "src/components/consultant/control-panel/p-client-01/PreRuntimeContextView.tsx",
  );
  assertExists(
    "docs/consultant-control-panel/architecture/REPO_TBD_P_CLIENT_01_V1_V5.md",
  );
  const shell = readFileSync(
    resolve(
      projectRoot,
      "src/components/consultant/control-panel/ConsultantControlPanelPMShell.tsx",
    ),
    "utf8",
  );
  assert.match(shell, /PClient01Workspace/);
  assert.match(shell, /ccp-pclient01-workspace|selectedProcessCode === "P-CLIENT-01"/);
  assert.match(shell, /toPClient01UrlView|parsePClient01UrlView/);
});

test("enrichment attaches p_client_01 experience + pre_runtime from Ámbar fixture", () => {
  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { ...process.env, NODE_ENV: "development" },
  });

  assert.ok(state.p_client_01);
  assert.equal(state.p_client_01.process.pm_process_id, "P-CLIENT-01");
  assert.equal(state.p_client_01.process.pf_process_id, "PF-CLIENT-01");
  assert.ok(state.p_client_01.experience);
  assert.ok(state.p_client_01.pre_runtime);
  assert.equal(
    state.p_client_01.pre_runtime.handoff.context_must_not_be_saved_as_confirmed_evidence,
    true,
  );
  assert.ok(Array.isArray(state.p_client_01.experience.stages));
  assert.ok(state.p_client_01.experience.stages.length >= 10);
  assert.equal(state.p_client_01.architectural_contract.is_runtime_4020, false);
  assert.equal(state.p_client_01.architectural_contract.replaces_p_core_01, false);
  assert.equal(
    state.p_client_01.architectural_contract.governed_object,
    "ClientEngagement",
  );
  assert.ok(state.p_client_01.context_header.engagement_object_state_display.includes("ClientEngagement"));
  assert.equal(state.p_client_01.context_header.engagement_epistemic_status, "unavailable");
  assert.equal(state.p_client_01.status_band.mode, "READ-ONLY");
  assert.ok(state.p_client_01.workspace_zones.includes("context_header"));
  assert.ok(state.p_client_01.workspace_zones.includes("status_band"));
});

test("UserExperienceVM never marks continue_enabled under ROLE_ASSIGNMENT_GAP", () => {
  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { ...process.env, NODE_ENV: "development" },
  });

  const withGap = {
    ...state,
    critical_alerts: [
      {
        alert_id: "ROLE_ASSIGNMENT_GAP",
        severity: "review",
        title: "Asignación funcional sin resolver",
        message: "mixed_unresolved en fixture de prueba",
        reentry_target: "WorkMap functional assignment review",
      },
    ],
  };

  const experience = buildUserExperienceVM(withGap);
  assert.equal(experience.continue_enabled, false);
  assert.equal(experience.continue_reason_code, "ROLE_ASSIGNMENT_GAP");

  const functionalStage = experience.stages.find(
    (stage) => stage.stage_id === "functional_review",
  );
  assert.ok(functionalStage);
  assert.equal(functionalStage.status, "review");
  assert.equal(functionalStage.reason_code, "ROLE_ASSIGNMENT_GAP");
});

test("PreRuntimeContextVM keeps epistemic badges and forbids evidence elevation", () => {
  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { ...process.env, NODE_ENV: "development" },
  });
  const preRuntime = buildPreRuntimeContextVM(state);

  assert.equal(preRuntime.handoff.context_must_not_be_saved_as_confirmed_evidence, true);
  assert.ok(preRuntime.availability_warning);
  assert.ok(
    ["context_only", "inferred_from_workmap", "unavailable", "gap", "captured_user_context"].includes(
      preRuntime.estado_a.functional_role_context.epistemic_status,
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(preRuntime),
    /confirmed_mmabp_evidence":true/,
  );

  const workspace = buildPClient01WorkspaceVM(state);
  assert.equal(workspace.process.pm_process_id, "P-CLIENT-01");
  assert.equal(workspace.experience.selected_count == null || workspace.experience.selected_count <= 8, true);
});

test("Vista 1 stage payloads include DOCX §4.3 fields from BFF", () => {
  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { ...process.env, NODE_ENV: "development" },
  });
  const experience = buildUserExperienceVM(state);

  assert.ok(experience.current_activity?.label);
  assert.equal(experience.policy_max_primaries, 8);
  assert.ok((experience.eligible_count ?? 0) > 0);
  assert.ok(experience.hierarchy_rows.length > 0);
  assert.ok(experience.actions.some((action) => action.action_id === "open_evidence"));
  assert.ok(
    experience.actions.every(
      (action) =>
        action.enabled ||
        action.reason_code === "AUDITED_ENDPOINT_NOT_AVAILABLE" ||
        action.reason_code != null,
    ),
  );

  const estadoA = experience.stages.find((stage) => stage.stage_id === "estado_a");
  assert.ok(estadoA);
  assert.ok(
    estadoA.detail_fields.some((field) => field.key === "functional_role_context"),
  );
  assert.ok(
    estadoA.detail_fields.some((field) => field.key === "decision_level_context"),
  );

  const b05 = experience.stages.find((stage) => stage.stage_id === "b05_b7");
  assert.ok(b05);
  assert.ok(b05.detail_fields.some((field) => field.key === "base_summary"));
  assert.ok(b05.detail_fields.some((field) => field.key === "causal_summary"));

  const post = experience.stages.find((stage) => stage.stage_id === "post_runtime");
  assert.ok(post);
  assert.ok(post.detail_fields.some((field) => field.key === "EvidenceBundle_state" || field.key === "SCR_state"));
});

test("Vista 5 exposes primary activity list from read model", () => {
  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { ...process.env, NODE_ENV: "development" },
  });
  const preRuntime = buildPreRuntimeContextVM(state);
  assert.ok(preRuntime.selection.primary_activity_list.length > 0);
  assert.equal(
    preRuntime.estado_a.functional_role_context.epistemic_status === "context_only" ||
      preRuntime.estado_a.functional_role_context.epistemic_status === "unavailable",
    true,
  );
});

test("empty scope yields non-fabricated workmap presence", () => {
  const state = buildConsultantControlPanelState({
    role: "consultant",
    env: { ...process.env, NODE_ENV: "test", EVE_CONSULTANT_CONTROL_PANEL_FIXTURE: "" },
  });
  const experience = buildUserExperienceVM(state);
  assert.equal(experience.saved_work_map_exists, null);
  assert.equal(experience.continue_enabled, false);

  const preRuntime = buildPreRuntimeContextVM(state);
  assert.equal(preRuntime.bundle_available, false);
  assert.equal(preRuntime.estado_a.functional_role_context.value, null);
  assert.equal(preRuntime.estado_a.functional_role_context.epistemic_status, "unavailable");
});
