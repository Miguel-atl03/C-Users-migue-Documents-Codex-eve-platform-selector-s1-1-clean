import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync("src/app/page.tsx", "utf8");
const typesSource = readFileSync("src/lib/types.ts", "utf8");

function extractFunctionBlock(source: string, functionName: string): string {
  const declarationIndex = source.indexOf(`const ${functionName}`);
  assert.notEqual(declarationIndex, -1, `${functionName} declaration missing`);

  const firstBraceIndex = source.indexOf("{", declarationIndex);
  assert.notEqual(firstBraceIndex, -1, `${functionName} body missing`);

  let depth = 0;
  let quote: "\"" | "'" | "`" | null = null;
  let escaped = false;

  for (let index = firstBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "/" && next === "/") {
      index = source.indexOf("\n", index);
      if (index === -1) break;
      continue;
    }

    if (char === "/" && next === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      assert.notEqual(commentEnd, -1, `${functionName} unterminated comment`);
      index = commentEnd + 1;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(declarationIndex, index + 1);
    }
  }

  assert.fail(`${functionName} body could not be extracted`);
}

test("types include R2.2 Significado state without Sentido", () => {
  assert.match(typesSource, /["']intake_significado["']/);
  assert.match(typesSource, /["']intake_work_map["']/);
  assert.doesNotMatch(typesSource, /["']intake_sentido["']/);
});

test("page renders Significado between WorkMap and questionnaire", () => {
  assert.match(pageSource, /SignificadoDeTuTrabajo/);
  assert.match(pageSource, /SignificadoSubmitPayload/);
  assert.match(pageSource, /flowState === "intake_significado"/);
  assert.match(pageSource, /onBack=\{\(\) => setFlowState\("intake_work_map"\)\}/);
  assert.match(pageSource, /onContinue=\{submitSignificadoIntake\}/);
  assert.match(pageSource, /onContinue=\{continueFromWorkMapToSignificado\}/);
  assert.doesNotMatch(pageSource, /onContinue=\{saveWorkMapIntake\}/);
});

test("WorkMap continue only moves to Significado", () => {
  const continueBlock = extractFunctionBlock(
    pageSource,
    "continueFromWorkMapToSignificado",
  );

  assert.match(continueBlock, /setWorkMap\(draft\)/);
  assert.match(continueBlock, /selectPrimaryActivitiesFromWorkMap\(draft\)/);
  assert.match(continueBlock, /setPrimaryActivitySelectionResult\(selectionResult\)/);
  assert.match(continueBlock, /setFlowState\("intake_significado"\)/);
  assert.doesNotMatch(continueBlock, /flattenWorkMapToActivities/);
  assert.doesNotMatch(continueBlock, /rankActivities/);
  assert.doesNotMatch(continueBlock, /bootstrapScenes/);
  assert.doesNotMatch(continueBlock, /setFlowState\("questionnaire_main"\)/);
});

test("Significado submit validates boundary locks before continuing", () => {
  const submitBlock = extractFunctionBlock(pageSource, "submitSignificadoIntake");

  assert.match(submitBlock, /payload\.diagnosticsEnabled !== false/);
  assert.match(submitBlock, /payload\.exportEnabled !== false/);
  assert.match(submitBlock, /payload\.transductionEnabled !== false/);
  assert.match(submitBlock, /payload\.primaryActivitySelectionResult\.selectionGovernance !== "eve_policy"/);
  assert.match(submitBlock, /payload\.primaryActivitySelectionResult\.userSelectedActivities !== false/);
  assert.match(
    submitBlock,
    /runPostWorkMapQuestionnairePipeline\(\s*payload\.workMapSnapshot,\s*payload\.primaryActivitySelectionResult,\s*\)/,
  );
  assert.match(submitBlock, /\/api\/significado\/block0/);
  assert.match(submitBlock, /payload\.block0Answers/);
});

test("post WorkMap pipeline remains the only questionnaire bridge", () => {
  const pipelineBlock = extractFunctionBlock(
    pageSource,
    "runPostWorkMapQuestionnairePipeline",
  );

  assert.match(pipelineBlock, /selectedPrimaryActivitiesToLegacyActivities/);
  assert.match(pipelineBlock, /phase:\s*"continue"/);
  assert.match(pipelineBlock, /rankActivities\(databaseSessionId\)/);
  assert.match(pipelineBlock, /bootstrapScenes\(databaseSessionId\)/);
  assert.match(pipelineBlock, /selectedIds/);
  assert.match(pipelineBlock, /setFlowState\("questionnaire_main"\)/);
});

test("R2.2 does not create Significado or Sentido API phases", () => {
  assert.doesNotMatch(pageSource, /phase:\s*["']significado["']/);
  assert.doesNotMatch(pageSource, /phase:\s*["']sentido["']/);
});

test("forbidden files remain unmodified by tracked diff", () => {
  const forbiddenPaths = [
    "src/components/WorkMapIntake.tsx",
    "src/services/work-map-flatten.ts",
    "src/components/SceneQuestionnaireRunner.tsx",
    "package.json",
  ];
  const diffOutput = execFileSync("git", ["diff", "--name-only"], {
    encoding: "utf8",
  });

  for (const path of forbiddenPaths) {
    assert.equal(
      diffOutput.includes(path),
      false,
      `${path} should not be modified`,
    );
  }
});
