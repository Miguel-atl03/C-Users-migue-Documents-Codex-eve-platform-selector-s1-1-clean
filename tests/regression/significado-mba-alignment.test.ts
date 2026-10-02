import { register } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-significado-mba-alignment-path-hook.mjs");

writeFileSync(
  hookPath,
  `import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const projectRoot = ${JSON.stringify(projectRoot)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return {
      shortCircuit: true,
      url: pathToFileURL(mappedPath).href,
    };
  }
  return nextResolve(specifier, context);
}
`,
);

register(pathToFileURL(hookPath).href, import.meta.url);

const draftStateModule = await import("@/features/significado/significado-draft-state");

type WorkMapData = import("@/domain/local-work-map").WorkMapData;

const { buildDraftSubmitPayload, createEmptySignificadoDraft, setGlobalPriority } =
  draftStateModule;

const ALLOWED_DIFFS = new Set([
  "src/components/significado/SignificadoDeTuTrabajo.tsx",
  "src/components/significado/significado-de-tu-trabajo.module.css",
  "src/features/significado/significado-copy.ts",
  "src/features/significado/significado-draft-state.ts",
  "src/features/significado/runtime-block0-canonical.ts",
  "src/domain/significado-de-trabajo.ts",
  "src/services/significado-activity-anchor-adapter.ts",
  "src/app/dev/significado/page.tsx",
  "tests/regression/significado-de-trabajo-slice.test.ts",
  "tests/regression/significado-activity-anchor-adapter.test.ts",
  "tests/regression/significado-flow-wiring.test.ts",
  "tests/regression/significado-mba-alignment.test.ts",
  "docs/audits/CLOSEOUT_R2_2_MBA_ALIGNMENT_PATCH.md",
  "docs/audits/CLOSEOUT_R2_2_SIGNIFICADO_FLOW.md",
  "docs/audits/CLOSEOUT_R2_3_SIGNIFICADO_VISUAL_UI_PASS_V0_1.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_VISUAL_QUESTIONS_ROW_LAYOUT_V0_2.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_FORM_ROWS_V0_2_REFINEMENT.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_ACTIVITY_FORM_V0_3.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_QUESTIONS_V0_4.md",
  "docs/audits/AUDIT_RUNTIME_BLOCK0_CANONICAL_EXTRACTION.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_RUNTIME_BLOCK0_CANONICAL_FORM_V0_5.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_PREFILL_CONFIRMATION_V0_6.md",
  "docs/audits/AUDIT_RUNTIME_BLOCK0_CANONICAL_HELP_TEXT.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_HELP_TEXT_FIX_V0_7.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_WORKMAP_ROW_LAYOUT_V0_9.md",
  "docs/audits/CLOSEOUT_SIGNIFICADO_UI_VISUAL_FINAL_FROZEN_V1_0.md",
  "docs/audits/CLEAN_INTEGRATION_SANDBOX_PREP.md",
  "src/services/workmap-to-block0-prefill.ts",
  "tests/regression/workmap-to-block0-prefill.test.ts",
  "docs/audits/CLOSEOUT_WORKMAP_TO_BLOCK0_PREFILL_PRODUCTION_V1.md",
]);

const PREVIOUSLY_ALLOWED_DIFFS = new Set(["src/app/page.tsx", "src/lib/types.ts"]);

const FORBIDDEN_VISIBLE_PATTERNS = [
  /prioridad/i,
  /energ/i,
  /carga/i,
  /pesad/i,
  /claridad/i,
  /claro/i,
  /que parte quieres revisar primero/i,
  /que parte de tu trabajo quieres/i,
  /\bVSM\b/,
  /\bMMABP\b/i,
  /\bAHE\b/,
  /\breadiness\b/i,
  /\bgaps\b/i,
  /\bruntime\b/i,
  /diagn[oó]stico/i,
  /transducci[oó]n/i,
  /\bexport\b/i,
  /Producci[oó]n Paralela/i,
  /\bact-/,
  /\bwm-/,
  /\bpayload\b/i,
  /\bbundle\b/i,
  /captured_user_evidence/i,
  /Respuesta capturada/i,
  /\bRespondido\b/i,
  /\bEvidencia\b/i,
];

function readText(path: string) {
  assert.equal(existsSync(path), true, `Missing file: ${path}`);
  return readFileSync(path, "utf8");
}

function visibleCopySource(source: string): string {
  return source
    .split("\n")
    .filter((line) => !line.trim().startsWith("export "))
    .join("\n");
}

function buildSavedWorkMap(overrides: Partial<WorkMapData> = {}): WorkMapData {
  return {
    selectedAreas: ["Produccion"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-1",
        text: "Yo defino el programa semanal de produccion segun pedidos.",
        activities: [
          { id: "act-1", text: "Registro facturas de proveedores en el ERP." },
        ],
      },
      {
        id: "resp-2",
        text: "Yo verifico que los candidatos cumplan el perfil requerido.",
        activities: [{ id: "act-2", text: "Reviso expedientes de candidatos." }],
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: true,
    isReviewMode: true,
    savedWithWarnings: false,
    ...overrides,
  };
}

test("Significado visible copy avoids user selection and internal architecture language", () => {
  const component = readText("src/components/significado/SignificadoDeTuTrabajo.tsx");
  const copy = readText("src/features/significado/significado-copy.ts");
  const devPage = readText("src/app/dev/significado/page.tsx");

  assert.match(copy, /Significado de tu trabajo/);
  assert.match(copy, /[Ee]l resto de tu mapa se conserva como contexto/);
  assert.match(copy, /Trabajo que realizas/);
  assert.match(component, /SignificadoDeTuTrabajo/);
  assert.match(component, /SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE/);
  assert.match(component, /BLOCK0_QUESTION_SECTION_TITLES/);
  assert.match(component, /workMapStyles\.workMapCard/);
  assert.match(component, /workMapStyles\.workMapRow/);
  assert.doesNotMatch(component, /SIGNIFICADO_PREFILL_BADGE/);
  assert.doesNotMatch(component, /SIGNIFICADO_REQUIRES_CONFIRMATION_BADGE/);
  assert.doesNotMatch(component, /SIGNIFICADO_REQUIRED_BADGE/);
  assert.doesNotMatch(component, /SIGNIFICADO_OPTIONAL_BADGE/);
  assert.doesNotMatch(component, /captured_user_evidence/);
  assert.doesNotMatch(component, /SIGNIFICADO_FREQUENCY_OPTIONS/);
  assert.doesNotMatch(component, /Selecciona|Agregar soporte|elige cual/i);
  assert.doesNotMatch(devPage, /R2\.1|Supabase|payload|ranking|score|gates|bundle/i);

  const visibleCopy = visibleCopySource(copy);
  for (const pattern of FORBIDDEN_VISIBLE_PATTERNS) {
    assert.doesNotMatch(visibleCopy, pattern, `Forbidden visible copy: ${pattern}`);
  }
});

test("Significado payload keeps context but does not resolve primary activities by user preference", () => {
  const workMap = buildSavedWorkMap();
  const draft = setGlobalPriority(createEmptySignificadoDraft("session-mba"), {
    type: "responsibility",
    responsibilityId: "resp-2",
  });
  const payload = buildDraftSubmitPayload(workMap, draft);

  assert.ok(payload);
  assert.equal(payload?.workMapSnapshot, workMap);
  assert.equal(payload?.traceableActivities.length, 2);
  assert.equal(payload?.diagnosticsEnabled, false);
  assert.equal(payload?.exportEnabled, false);
  assert.equal(payload?.transductionEnabled, false);
  assert.equal(payload?.selectionGovernance, "eve_policy");
  assert.equal(payload?.primaryActivitySelectionPolicy, "PRIMARY_ACTIVITY_SELECTION_V1_2");
  assert.equal(payload?.userPriorityDoesNotSelectRuntimeActivities, true);
  assert.equal(payload?.primaryActivitySelectionResolvedByUser, false);
  assert.equal(payload?.primaryActivitySelectionResult.selectionGovernance, "eve_policy");
  assert.equal(payload?.primaryActivitySelectionResult.userSelectedActivities, false);
  assert.equal(payload?.bundle.selectedPrimaryActivityId, "");
  assert.equal(payload?.bundle.global.priority, undefined);
  assert.equal(payload?.primaryActivity.id, "act-1");
});

test("R2.2 wiring still routes WorkMap to Significado to questionnaire without Significado API phase", () => {
  const page = readText("src/app/page.tsx");

  assert.match(page, /flowState === "intake_significado"/);
  assert.match(page, /onContinue=\{submitSignificadoIntake\}/);
  assert.match(page, /payload\.primaryActivitySelectionResult/);
  assert.match(page, /runPostWorkMapQuestionnairePipeline\(\s*payload\.workMapSnapshot,\s*payload\.primaryActivitySelectionResult,\s*\)/);
  assert.doesNotMatch(page, /phase:\s*["']significado["']/);
  assert.doesNotMatch(page, /phase:\s*["']sentido["']/);
});

test("forbidden files are not part of tracked product diff", () => {
  const diffOutput = execFileSync("git", ["diff", "--name-only"], {
    encoding: "utf8",
  });
  const changedPaths = diffOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^external-consumers\/eve-platform\//, ""));

  for (const changedPath of changedPaths) {
    assert.ok(
      ALLOWED_DIFFS.has(changedPath) || PREVIOUSLY_ALLOWED_DIFFS.has(changedPath),
      `Unexpected tracked diff: ${changedPath}`,
    );
  }
});
