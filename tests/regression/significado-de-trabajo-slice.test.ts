import { register } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-significado-de-trabajo-slice-path-hook.mjs");

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
const draftServiceModule = await import("@/services/significado-draft");
const runtimeBlock0Module = await import("@/features/significado/runtime-block0-canonical");
const runtimeBlock0AdapterModule = await import("@/services/runtime-block0-catalog-adapter");

const {
  RUNTIME_BLOCK0_CANONICAL_QUESTIONS,
  getSignificadoBlock0QuestionsForScreen,
  buildBlock0AnswerKey,
  createEmptyBlock0Answers,
} = runtimeBlock0Module;
const { getRuntimeBlock0InteractionViewModels } = runtimeBlock0AdapterModule;

type WorkMapData = import("@/domain/local-work-map").WorkMapData;

const {
  acknowledgeSavedWithWarnings,
  buildDraftSubmitPayload,
  createEmptySignificadoDraft,
  evaluateDraftReadiness,
  getSignificadoCaptureUnits,
  hydrateDraftFromWorkMap,
  normalizeSignificadoDraft,
  setGlobalPriority,
} = draftStateModule;

const { SIGNIFICADO_DRAFT_STORAGE_PREFIX } = draftServiceModule;

const COMPONENT_PATH = "src/components/significado/SignificadoDeTuTrabajo.tsx";
const DEV_PAGE_PATH = "src/app/dev/significado/page.tsx";
const DRAFT_STATE_PATH = "src/features/significado/significado-draft-state.ts";
const DRAFT_SERVICE_PATH = "src/services/significado-draft.ts";

const PROHIBITED_VISIBLE_PATTERNS = [
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
  /Esto es lo que respond[ií]/i,
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
          { id: "act-2", text: "Mido dimensiones de la pieza producida." },
        ],
      },
      {
        id: "resp-2",
        text: "Yo verifico que los candidatos cumplan el perfil requerido.",
        activities: [{ id: "act-3", text: "Reviso expedientes de candidatos." }],
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

test("slice artifacts exist", () => {
  for (const path of [
    COMPONENT_PATH,
    DEV_PAGE_PATH,
    DRAFT_STATE_PATH,
    DRAFT_SERVICE_PATH,
    "src/features/significado/significado-copy.ts",
    "src/features/significado/significado-dev-fixture.ts",
    "src/features/significado/runtime-block0-canonical.ts",
    "src/components/significado/significado-de-tu-trabajo.module.css",
  ]) {
    assert.equal(existsSync(path), true, `Missing ${path}`);
  }
});

test("page renders Significado without creating Significado API phases", () => {
  const devPage = readText(DEV_PAGE_PATH);
  const mainPage = readText("src/app/page.tsx");

  assert.match(devPage, /SignificadoDeTuTrabajo/);
  assert.doesNotMatch(devPage, /DEV_VISUAL_DRAFT/);
  assert.match(devPage, /buildSignificadoBlock0DevPrefill/);
  assert.match(devPage, /createSignificadoBlock0DevWorkMap/);
  assert.doesNotMatch(devPage, /initialVisualDraft=/);
  assert.match(mainPage, /SignificadoDeTuTrabajo/);
  assert.doesNotMatch(mainPage, /phase:\s*["']significado["']/);
  assert.doesNotMatch(mainPage, /phase:\s*["']sentido["']/);
  assert.doesNotMatch(mainPage, /["']intake_sentido["']/);
  assert.match(mainPage, /\/api\/significado\/block0/);
  assert.match(mainPage, /block0Answers/);
  const mainPageWithoutCanonicalBlock0 = mainPage.replace(
    /\/api\/significado\/block0/g,
    "",
  );
  assert.doesNotMatch(
    mainPageWithoutCanonicalBlock0,
    /\/api\/[^"']*(?:significado|sentido|export|transduction)/i,
  );
  assert.match(
    mainPage,
    /\/api\/eve\/runtime-40-20\/client-bff\/experience-event/,
  );
});

test("runtime Block 0 canonical questions are derived from the adapter", () => {
  assert.ok(Array.isArray(RUNTIME_BLOCK0_CANONICAL_QUESTIONS));
  assert.equal(RUNTIME_BLOCK0_CANONICAL_QUESTIONS.length, 4);

  const runtimeAdapterQuestions = getRuntimeBlock0InteractionViewModels();
  const expectedIds = ["B0-Q01", "B0-Q02", "B0-Q03", "B0-Q04"];
  assert.deepEqual(
    RUNTIME_BLOCK0_CANONICAL_QUESTIONS.map((question) => question.id),
    expectedIds,
  );
  assert.deepEqual(
    RUNTIME_BLOCK0_CANONICAL_QUESTIONS.map(
      (question) => question.sourceRuntimeInteractionId,
    ),
    runtimeAdapterQuestions.map((question) => question.runtimeInteractionId),
  );
  assert.deepEqual(
    getSignificadoBlock0QuestionsForScreen().map((question) => question.id),
    runtimeAdapterQuestions.map((question) => question.runtimeInteractionId),
  );

  for (const question of RUNTIME_BLOCK0_CANONICAL_QUESTIONS) {
    assert.ok(question.sourceRuntimeInteractionId);
    assert.equal(question.sourceRuntimeInteractionId, question.id);
    assert.ok(question.sourceSheet);
    assert.ok(question.sourceSheetRefs.length);
    assert.ok(question.questionText.trim());
    assert.ok(question.helpText.trim());
    assert.ok(question.helpTextSource.trim());
    assert.ok(question.helpTextKind);
    assert.ok(question.canonicalHelpStatus);
    assert.ok(question.canonicalVariableList.length);
  }
});

test("Significado Block 0 mapper is not an independent hardcoded question list", () => {
  const runtimeCanonical = readText(
    "src/features/significado/runtime-block0-canonical.ts",
  );

  assert.match(runtimeCanonical, /getRuntimeBlock0InteractionViewModels/);
  assert.match(runtimeCanonical, /mapInteractionToSignificadoQuestion/);
  assert.doesNotMatch(
    runtimeCanonical,
    /export const RUNTIME_BLOCK0_CANONICAL_QUESTIONS[\s\S]*\[\s*\{/,
  );
});

test("Block 0 help text distinguishes canonical extraction from fallback", () => {
  const b0q01 = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.find(
    (question) => question.id === "B0-Q01",
  );
  const b0q02 = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.find(
    (question) => question.id === "B0-Q02",
  );
  const b0q03 = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.find(
    (question) => question.id === "B0-Q03",
  );
  const b0q04 = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.find(
    (question) => question.id === "B0-Q04",
  );

  assert.ok(b0q01);
  assert.equal(b0q01?.helpTextKind, "canonical");
  assert.equal(b0q01?.canonicalHelpStatus, "present");
  assert.equal(b0q01?.technicalLabel, "Confirmación o corrección de actividad");

  assert.ok(b0q02);
  assert.equal(b0q02?.helpTextKind, "fallback_no_canonico");
  assert.equal(b0q02?.canonicalHelpStatus, "CANONICAL_HELP_MISSING");
  assert.equal(b0q02?.technicalLabel, "Descripción operativa mínima");
  assert.notEqual(b0q02?.helpText, b0q02?.technicalLabel);

  assert.ok(b0q03);
  assert.equal(b0q03?.helpTextKind, "fallback_no_canonico");
  assert.equal(b0q03?.canonicalHelpStatus, "CANONICAL_HELP_MISSING");
  assert.equal(b0q03?.technicalLabel, "Frecuencia, contexto y actor inmediato");
  assert.notEqual(b0q03?.helpText, b0q03?.technicalLabel);

  assert.ok(b0q04);
  assert.equal(b0q04?.helpTextKind, "fallback_no_canonico");
  assert.equal(b0q04?.canonicalHelpStatus, "CANONICAL_HELP_MISSING");
  assert.equal(b0q04?.technicalLabel, "Inicio y cierre de la actividad");
  assert.equal(b0q04?.supplementalHelpTextKind, "fallback_no_canonico");
  assert.notEqual(b0q04?.helpText, b0q04?.technicalLabel);
});

test("visible Significado copy renders runtime Block 0 canonical form", () => {
  const component = readText(COMPONENT_PATH);
  const copy = readText("src/features/significado/significado-copy.ts");
  const devPage = readText(DEV_PAGE_PATH);
  const runtimeCanonical = readText("src/features/significado/runtime-block0-canonical.ts");
  const stylesheet = readText("src/components/significado/significado-de-tu-trabajo.module.css");

  assert.match(copy, /Significado de tu trabajo/);
  assert.match(copy, /[Ee]l resto de tu mapa se conserva como contexto/);
  assert.match(copy, /Volver al mapa/);
  assert.match(copy, /Esto es lo que EVE entendió desde tu mapa/);
  assert.match(copy, /Al continuar, confirmas esta información para la actividad/);
  assert.match(component, /RUNTIME_BLOCK0_CANONICAL_QUESTIONS/);
  assert.match(component, /questionHelp/);
  assert.match(component, /data-help-kind/);
  assert.doesNotMatch(component, /questionSupplementalHelp/);
  assert.doesNotMatch(component, /SIGNIFICADO_CONTEXT_BAR/);
  assert.doesNotMatch(component, /SIGNIFICADO_SUBFIELD_SUGGESTION_NOTE/);
  assert.match(component, /RuntimeBlock0Question/);
  assert.match(component, /SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE/);
  assert.match(component, /BLOCK0_QUESTION_SECTION_TITLES/);
  assert.match(component, /workMapStyles\.workMapTableHeader/);
  assert.match(component, /SIGNIFICADO_TABLE_HEADER_SECTION/);
  assert.match(component, /SIGNIFICADO_TABLE_HEADER_CONTENT/);
  assert.match(component, /formatActivityProgress/);
  assert.match(component, /formatBlock0QuestionProgress/);
  assert.match(component, /initialVisualDraft/);
  assert.match(component, /countBlock0PreparedProgress/);
  assert.match(component, /currentActivity\.title/);
  assert.doesNotMatch(component, /QuestionEpistemicBadges/);
  assert.doesNotMatch(component, /FieldEpistemicBadge/);
  assert.doesNotMatch(component, /SIGNIFICADO_CHIP_FROM_WORKMAP/);
  assert.doesNotMatch(component, /SIGNIFICADO_CHIP_REVIEW/);
  assert.doesNotMatch(component, /areaChipHint/);
  assert.match(component, /workMapStyles\.workMapCardFooter/);
  assert.match(component, /workMapStyles\.workMapCard/);
  assert.match(component, /ClientFlowHeader/);
  assert.match(component, /workMapStyles\.workMapRow/);
  assert.match(component, /workMapStyles\.sectionTitle/);
  assert.match(stylesheet, /\.epistemicBadgeGroup\s*\{[^}]*gap:\s*6px/s);
  assert.doesNotMatch(component, /SIGNIFICADO_PREFILL_BADGE/);
  assert.doesNotMatch(component, /SIGNIFICADO_REQUIRES_CONFIRMATION_BADGE/);
  assert.doesNotMatch(component, /SIGNIFICADO_REQUIRED_BADGE/);
  assert.doesNotMatch(component, /SIGNIFICADO_OPTIONAL_BADGE/);
  assert.doesNotMatch(component, /SIGNIFICADO_CONTEXT_SUGGESTION_HINT/);
  assert.doesNotMatch(component, /styles\.prefillBadge/);
  assert.doesNotMatch(component, /styles\.confirmationBadge/);
  assert.doesNotMatch(component, /styles\.optionalBadge/);
  assert.doesNotMatch(component, /styles\.requiredBadge/);
  assert.doesNotMatch(component, /contextSuggestionHint/);
  const devFixture = readText("src/features/significado/significado-dev-fixture.ts");
  assert.match(devPage, /buildSignificadoBlock0DevPrefill/);
  assert.match(devPage, /createSignificadoBlock0DevWorkMap/);
  assert.match(devPage, /resolveSignificadoBlock0DevPrimarySelection/);
  assert.match(devFixture, /SIGNIFICADO_BLOCK0_DEV_ACTIVITY_LITERAL/);
  assert.match(devFixture, /erogaciones comparando el gasto real contra Oracle/);
  assert.match(devFixture, /buildInitialBlock0VisualDraftFromWorkMap/);
  assert.doesNotMatch(devPage, /DEV_VISUAL_DRAFT/);
  assert.doesNotMatch(devPage, /initialVisualDraft=/);
  assert.doesNotMatch(devPage, /B0-Q01\.action_verb/);
  assert.doesNotMatch(devPage, /B0-Q03\.frequency_base/);
  assert.doesNotMatch(devPage, /inferred_from_workmap/);
  assert.doesNotMatch(devPage, /context_from_workmap/);
  assert.match(runtimeCanonical, /getRuntimeBlock0InteractionViewModels/);
  assert.match(runtimeCanonical, /getSignificadoBlock0QuestionsForScreen/);
  assert.match(runtimeCanonical, /inferred_from_workmap/);
  assert.match(runtimeCanonical, /showPrefillBadge/);
  assert.match(runtimeCanonical, /showRequiresConfirmationBadge/);
  assert.doesNotMatch(component, /OptionGroup/);
  assert.doesNotMatch(component, /SIGNIFICADO_Q1_LABEL/);
  assert.doesNotMatch(component, /SIGNIFICADO_SECTION_A_TITLE/);
  assert.doesNotMatch(component, /SIGNIFICADO_FREQUENCY_OPTIONS/);
  assert.doesNotMatch(component, /¿Qué actividad vamos a revisar\?/);
  assert.doesNotMatch(component, /¿Dónde empieza\?/);
  assert.doesNotMatch(component, /number=\{9\}/);
  assert.doesNotMatch(component, /Selecciona|Agregar soporte|elige cual/i);
  assert.doesNotMatch(copy, /¿Cómo llamarías a esta actividad/);
  assert.doesNotMatch(copy, /A\. Actividad y límites/);
  assert.doesNotMatch(copy, /Bloque 0/i);
  assert.doesNotMatch(devPage, /R2\.1 isolated slice/i);
  assert.doesNotMatch(devPage, /solo para desarrollo/i);
  assert.doesNotMatch(devPage, /Supabase/i);
  assert.doesNotMatch(devPage, /payload/i);
  assert.doesNotMatch(devPage, /ranking|score|gates|bundle/i);
  assert.match(devPage, /Dev fixture/);
  assert.match(devPage, /WorkMap.*Block 0 prefill builder/);
  assert.match(devPage, /Ver trazabilidad de consultor/);
  assert.doesNotMatch(devPage, /Diagn[oó]stico/i);
  assert.match(runtimeCanonical, /runtimeInteractionId/);


  const visibleCopy = visibleCopySource(copy);
  for (const pattern of PROHIBITED_VISIBLE_PATTERNS) {
    assert.doesNotMatch(
      visibleCopy,
      pattern,
      `Prohibited visible pattern ${pattern} in copy`,
    );
  }

  assert.doesNotMatch(component, /captured_user_evidence/);
  assert.doesNotMatch(component, />[^<{]*Respondido/);
  assert.doesNotMatch(component, />[^<{]*Respuesta capturada/);
  assert.doesNotMatch(component, />[^<{]*\bEvidencia\b/);
  assert.doesNotMatch(component, />[^<{]*\bDiagn[oó]stico\b/i);
});

test("each canonical Block 0 question exposes visible help text", () => {
  for (const question of RUNTIME_BLOCK0_CANONICAL_QUESTIONS) {
    assert.ok(question.helpText.trim(), `Missing help for ${question.id}`);
    assert.ok(question.helpTextSource.trim(), `Missing help source for ${question.id}`);
    assert.ok(question.helpTextKind, `Missing help kind for ${question.id}`);
    assert.ok(question.canonicalHelpStatus, `Missing help status for ${question.id}`);
  }
});

test("B0-Q01 help text is visible and does not reference hidden correction field", () => {
  const b0q01 = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.find(
    (question) => question.id === "B0-Q01",
  );
  const component = readText(COMPONENT_PATH);

  assert.ok(b0q01);
  assert.match(b0q01?.helpText ?? "", /Revisa cada parte por separado/i);
  assert.doesNotMatch(b0q01?.helpText ?? "", /Corrección libre/i);
  assert.match(component, /questionId === "B0-Q01"/);
  assert.match(component, /styles\.questionHelp/);
});

test("B0-Q01 keeps compound subfields for confirmation review", () => {
  const b0q01 = RUNTIME_BLOCK0_CANONICAL_QUESTIONS.find(
    (question) => question.id === "B0-Q01",
  );
  assert.ok(b0q01);
  assert.equal(b0q01?.responseKind, "compound");
  assert.equal(b0q01?.subfields?.length, 5);
  assert.deepEqual(
    b0q01?.subfields?.map((subfield) => subfield.label),
    [
      "Qué haces",
      "Sobre qué trabajas",
      "Cómo o bajo qué regla",
      "Qué queda listo",
      "Corrección libre",
    ],
  );
});

test("component keeps work map card shell, saved warning and navigation actions", () => {
  const component = readText(COMPONENT_PATH);
  const stylesheet = readText("src/components/significado/significado-de-tu-trabajo.module.css");
  const workMapStylesheet = readText("src/components/work-map-intake.module.css");

  assert.match(component, /formatActivityProgress/);
  assert.match(component, /SIGNIFICADO_CARD_TITLE/);
  assert.match(component, /SIGNIFICADO_SAVED_WITH_WARNINGS_NOTICE/);
  assert.match(component, /SIGNIFICADO_SAVE_REQUIRED_NOTICE/);
  assert.match(component, /isWorkMapSaved/);
  assert.match(component, /canContinue/);
  assert.match(component, /!isWorkMapSaved/);
  assert.match(component, /SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE/);
  assert.match(component, /resolveContinueCta/);
  assert.match(component, /SIGNIFICADO_CTA_BACK/);
  assert.match(component, /QuestionRow/);
  assert.doesNotMatch(component, /QuestionEpistemicBadges/);
  assert.match(component, /workMapStyles\.workMapCardFooter/);
  assert.match(component, /workMapStyles\.workTable/);
  assert.match(component, /workMapStyles\.contentCell/);
  assert.match(component, /workMapStyles\.sectionCell/);
  assert.match(component, /styles\.questionHelp/);
  assert.match(workMapStylesheet, /\.workMapRow\s*\{[^}]*display:\s*grid/s);
  assert.match(workMapStylesheet, /\.workMapTableHeader/);
});

test("draft service uses isolated localStorage prefix", () => {
  const service = readText(DRAFT_SERVICE_PATH);
  assert.match(
    service,
    new RegExp(SIGNIFICADO_DRAFT_STORAGE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  assert.doesNotMatch(service, /supabase/i);
});

test("normalizeSignificadoDraft preserves legacy data without making it active", () => {
  const normalized = normalizeSignificadoDraft(
    {
      perActivity: {
        "act-1": { clarity: "clear", energy: "light" },
      },
      global: { priority: { type: "all_equally" } },
      updatedAt: "2026-06-12T10:00:00.000Z",
    },
    "session-abc",
  );

  assert.equal(normalized.sessionId, "session-abc");
  assert.equal(normalized.perActivity["act-1"]?.clarity, "clear");
  assert.equal(normalized.global.priority?.type, "all_equally");
});

test("hydrateDraftFromWorkMap does not derive active priority", () => {
  const workMap = buildSavedWorkMap({
    responsibilities: [
      {
        id: "resp-only",
        text: "Yo coordino la operacion diaria del area.",
        activities: [{ id: "act-only", text: "Actualizo el tablero de seguimiento." }],
      },
    ],
  });

  const hydrated = hydrateDraftFromWorkMap(createEmptySignificadoDraft("session-one"), workMap);
  assert.equal(hydrated.global.priority, undefined);
});

test("getSignificadoCaptureUnits preserves traceable WorkMap context", () => {
  const workMap = buildSavedWorkMap();
  const capture = getSignificadoCaptureUnits(workMap);

  assert.equal(capture.traceableActivities.length, 3);
  assert.deepEqual(
    capture.traceableActivities.map((activity) => activity.id),
    ["act-1", "act-2", "act-3"],
  );
});

test("getSignificadoCaptureUnits uses per_activity at exactly 8 traceable activities", () => {
  const activities = Array.from({ length: 8 }, (_, index) => ({
    id: `act-threshold-${index + 1}`,
    text: `Actividad ${index + 1} con descripcion suficiente para contar.`,
  }));

  const workMap = buildSavedWorkMap({
    responsibilities: [
      {
        id: "resp-threshold",
        text: "Yo coordino la operacion diaria del area.",
        activities,
      },
    ],
  });

  const capture = getSignificadoCaptureUnits(workMap);

  assert.equal(capture.traceableActivities.length, 8);
  assert.equal(capture.captureMode, "per_activity");
  assert.equal(capture.units.length, 8);
});

test("getSignificadoCaptureUnits switches to per_responsibility above threshold", () => {
  const activities = Array.from({ length: 9 }, (_, index) => ({
    id: `act-over-${index + 1}`,
    text: `Actividad ${index + 1} con descripcion suficiente para contar.`,
  }));

  const workMap = buildSavedWorkMap({
    responsibilities: [
      {
        id: "resp-over",
        text: "Yo coordino la operacion diaria del area.",
        activities,
      },
    ],
  });

  const capture = getSignificadoCaptureUnits(workMap);

  assert.equal(capture.traceableActivities.length, 9);
  assert.equal(capture.captureMode, "per_responsibility");
  assert.equal(capture.units.length, 1);
});

test("evaluateDraftReadiness allows submit without user preference inputs", () => {
  const workMap = buildSavedWorkMap();
  const draft = createEmptySignificadoDraft("session-threshold");

  const readiness = evaluateDraftReadiness(workMap, draft);
  assert.equal(readiness.canSubmit, true);
  assert.equal(readiness.status, "ready");
  assert.equal(readiness.gaps.length, 0);
});

test("buildDraftSubmitPayload keeps WorkMap snapshot, traceability and boundary locks", async () => {
  const workMap = buildSavedWorkMap();
  const draft = setGlobalPriority(createEmptySignificadoDraft("session-complete"), {
    type: "responsibility",
    responsibilityId: "resp-2",
  });
  const { selectPrimaryActivitiesFromWorkMap } = await import(
    "@/services/primary-activity-selector"
  );
  const selection = selectPrimaryActivitiesFromWorkMap(workMap);
  const payload = buildDraftSubmitPayload(workMap, draft, selection);

  assert.ok(payload);
  assert.equal(payload?.sessionId, "session-complete");
  assert.equal(payload?.workMapSnapshot, workMap);
  assert.equal(payload?.traceableActivities.length, 3);
  assert.equal(payload?.diagnosticsEnabled, false);
  assert.equal(payload?.exportEnabled, false);
  assert.equal(payload?.transductionEnabled, false);
  assert.equal(payload?.selectionGovernance, "eve_policy");
  assert.equal(payload?.primaryActivitySelectionPolicy, "PRIMARY_ACTIVITY_SELECTION_V1_3");
  assert.equal(payload?.userPriorityDoesNotSelectRuntimeActivities, true);
  assert.equal(payload?.primaryActivitySelectionResolvedByUser, false);
  assert.equal(payload?.primaryActivitySelectionResult.selectionGovernance, "eve_policy");
  assert.equal(payload?.primaryActivitySelectionResult.userSelectedActivities, false);
  assert.equal(payload?.primaryActivitySelectionResult.maxPrimaryActivities, 8);
  assert.equal(payload?.bundle.selectedPrimaryActivityId, "");
  assert.equal(payload?.bundle.global.priority, undefined);
  assert.equal(
    payload?.primaryActivitySelectionResult.selectedPrimaryActivities[0]?.activityId,
    "act-1",
  );
  assert.equal(payload?.primaryActivity.id, "act-1");
});

test("savedWithWarnings requires explicit acknowledgment before submit", () => {
  const workMap = buildSavedWorkMap({ savedWithWarnings: true });
  const blockedDraft = createEmptySignificadoDraft("session-warn-blocked");
  const blocked = evaluateDraftReadiness(workMap, blockedDraft);

  assert.equal(blocked.canSubmit, false);
  assert.ok(
    blocked.gaps.some((gap) => gap.code === "saved_with_warnings_not_acknowledged"),
  );

  const readyDraft = acknowledgeSavedWithWarnings(blockedDraft);
  const ready = evaluateDraftReadiness(workMap, readyDraft);
  assert.equal(ready.canSubmit, true);
});

test("component wires local draft persistence and submit builder", () => {
  const component = readText(COMPONENT_PATH);

  assert.match(component, /writeSignificadoDraft/);
  assert.match(component, /readSignificadoDraftOrEmpty/);
  assert.match(component, /buildDraftSubmitPayload/);
  assert.match(component, /buildRuntimeBlock0ResponseBundle/);
  assert.match(component, /useOperationalDescriptionCoach/);
  assert.match(component, /useOperationalDescriptionIntroGuide/);
  assert.match(component, /OperationalDescriptionExampleAside/);
  assert.match(component, /OperationalDescriptionPromptCopy/);
  assert.match(component, /operationalDescriptionRow/);
  assert.match(component, /block0Answers: visualDraft/);
  assert.match(component, /runtimeBlock0ResponseBundle/);
  assert.match(component, /evaluateSignificadoSubmitGate/);
  assert.match(component, /resolveContinueCta/);
  assert.match(component, /isBlock0ReviewComplete/);
  assert.match(component, /SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE/);
  assert.match(component, /enhanceSignificadoActivityBoundaryReview/);
  assert.match(component, /buildInitialBlock0VisualDraftFromWorkMap/);
  assert.match(component, /resolvedInitialVisualDraft/);
  assert.match(component, /formatBlock0QuestionProgress/);
  assert.doesNotMatch(component, /secciones revisadas/);
});

test("workmap prefill populates B0-Q01 but keeps Continue gate incomplete", async () => {
  const { buildInitialBlock0VisualDraftFromWorkMap } = await import(
    "@/services/workmap-to-block0-prefill"
  );
  const { createSignificadoDevWorkMap } = await import(
    "@/features/significado/significado-dev-fixture"
  );
  const { selectPrimaryActivitiesFromWorkMap } = await import(
    "@/services/primary-activity-selector"
  );
  const { isActivityBoundaryQuestionComplete } = await import(
    "@/services/operational-description-coach/infer-activity-boundary"
  );

  const workMap = createSignificadoDevWorkMap();
  const selection = selectPrimaryActivitiesFromWorkMap(workMap);
  const prefill = buildInitialBlock0VisualDraftFromWorkMap({
    workMap,
    primaryActivity: selection.selectedPrimaryActivities[0],
  });

  const merged = {
    ...createEmptyBlock0Answers(),
    ...prefill.visualDraft,
  };

  assert.ok(merged[buildBlock0AnswerKey("B0-Q01", "action_verb")]?.trim());
  assert.equal(merged[buildBlock0AnswerKey("B0-Q02")]?.trim() ?? "", "");
  assert.equal(isActivityBoundaryQuestionComplete(merged), false);
});

test("significado boundary review infers dejo listo para output closure", async () => {
  const { enhanceSignificadoActivityBoundaryReview } = await import(
    "@/features/significado/runtime-block0-canonical"
  );
  const { inferActivityBoundaryReview } = await import(
    "@/services/operational-description-coach/infer-activity-boundary"
  );

  const draft =
    "preparo reporte de desviaciones con la explicación de lo que encontré y lo dejo listo para quien usa esos números en el siguiente control.";

  const baseReview = inferActivityBoundaryReview(draft, {
    activityTitle: "Analizo desviaciones",
    actionVerb: "Analizo",
    inputOrObject: "erogaciones",
    procedureOrStandard: "comparo contra presupuesto",
    outputOrResult: "reporte de desviaciones",
  });

  const enhanced = enhanceSignificadoActivityBoundaryReview(baseReview, draft);
  const exit = enhanced.sections.find(
    (section) => section.id === "output_transduction",
  );

  assert.equal(exit?.isSufficient, true);
  assert.match(exit?.inferredSnippet ?? "", /dejo listo para quien usa/i);
});

test("significado-draft-state avoids unsafe casts and type suppressions", () => {
  const source = readText(DRAFT_STATE_PATH);

  assert.doesNotMatch(source, /\bas any\b/);
  assert.doesNotMatch(source, /@ts-ignore|@ts-expect-error/);
  assert.doesNotMatch(source, /\bas string\[\]/);
});
