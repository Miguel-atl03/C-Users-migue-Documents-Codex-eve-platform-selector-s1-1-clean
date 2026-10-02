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
      if (char === quote) {
        quote = null;
      }
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
      if (depth === 0) {
        return source.slice(declarationIndex, index + 1);
      }
    }
  }

  assert.fail(`${functionName} body could not be extracted`);
}

test("types exposes WorkMap and R2.2 Significado states without Sentido", () => {
  assert.match(typesSource, /["']intake_work_map["']/);
  assert.match(typesSource, /["']intake_significado["']/);
  assert.doesNotMatch(typesSource, /["']intake_sentido["']/);
});

test("page wires WorkMapIntake into Significado instead of questionnaire directly", () => {
  assert.match(pageSource, /WorkMapIntake/);
  assert.match(pageSource, /flowState === "intake_work_map"/);
  assert.match(pageSource, /onContinue=\{continueFromWorkMapToSignificado\}/);
  assert.match(pageSource, /onSave=\{saveWorkMapDraft\}/);

  assert.match(pageSource, /SignificadoDeTuTrabajo/);
  assert.match(pageSource, /SignificadoSubmitPayload/);
  assert.match(pageSource, /flowState === "intake_significado"/);
  assert.doesNotMatch(pageSource, /onContinue=\{saveWorkMapIntake\}/);
  assert.doesNotMatch(pageSource, /intake_sentido/);
  assert.doesNotMatch(pageSource, /phase:\s*["']significado["']/);
  assert.doesNotMatch(pageSource, /phase:\s*["']sentido["']/);
});

test("saveWorkMapDraft saves only the draft and does not advance", () => {
  const draftBlock = extractFunctionBlock(pageSource, "saveWorkMapDraft");

  assert.match(draftBlock, /setWorkMap\(draft\)/);
  assert.match(draftBlock, /phase:\s*"save"/);
  assert.doesNotMatch(draftBlock, /rankActivities/);
  assert.doesNotMatch(draftBlock, /bootstrapScenes/);
  assert.doesNotMatch(draftBlock, /setFlowState\(\s*"questionnaire_main"\s*\)/);
});

test("continueFromWorkMapToSignificado only moves WorkMap into Significado", () => {
  const continueBlock = extractFunctionBlock(pageSource, "continueFromWorkMapToSignificado");

  assert.match(continueBlock, /selectPrimaryActivitiesFromWorkMap\(draft\)/);
  assert.match(continueBlock, /setPrimaryActivitySelectionResult\(selectionResult\)/);
  assert.match(continueBlock, /setWorkMap\(draft\)/);
  assert.match(continueBlock, /setFlowState\("intake_significado"\)/);
  assert.doesNotMatch(continueBlock, /flattenWorkMapToActivities/);
  assert.doesNotMatch(continueBlock, /rankActivities/);
  assert.doesNotMatch(continueBlock, /bootstrapScenes/);
  assert.doesNotMatch(continueBlock, /setFlowState\(\s*"questionnaire_main"\s*\)/);
});

test("post WorkMap pipeline remains the only questionnaire bridge", () => {
  const pipelineBlock = extractFunctionBlock(pageSource, "runPostWorkMapQuestionnairePipeline");

  assert.match(pipelineBlock, /selectedPrimaryActivitiesToLegacyActivities/);
  assert.match(pipelineBlock, /phase:\s*"continue"/);
  assert.match(pipelineBlock, /rankActivities\(databaseSessionId\)/);
  assert.match(pipelineBlock, /bootstrapScenes\(databaseSessionId\)/);
  assert.match(pipelineBlock, /selectedIds/);
  assert.match(pipelineBlock, /setFlowState\("questionnaire_main"\)/);
  assert.match(pageSource, /flowState === "questionnaire_main"/);
  assert.match(pageSource, /SceneQuestionnaireRunner/);
});

test("WorkMapIntake source was not modified after package application", () => {
  const diffOutput = execFileSync(
    "git",
    ["diff", "--name-only", "--", "src/components/WorkMapIntake.tsx"],
    { encoding: "utf8" },
  );

  assert.equal(diffOutput.trim(), "");
});
