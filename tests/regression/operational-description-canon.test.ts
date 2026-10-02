import { register } from "node:module";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-operational-description-canon-path-hook.mjs");

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

const {
  OPERATIONAL_DESCRIPTION_PATH_STEPS,
  OPERATIONAL_DESCRIPTION_UI,
  buildOperationalDescriptionLlmSystemPrompt,
} = await import("@/features/significado/operational-description-canon");
const { buildLlmCoachUserPrompt } = await import(
  "@/services/operational-description-coach/llm-coach-prompt"
);

test("canon path steps align with UI prompt fields", () => {
  assert.equal(OPERATIONAL_DESCRIPTION_PATH_STEPS.length, 5);
  assert.match(OPERATIONAL_DESCRIPTION_UI.promptLead, /práctica real/i);
  assert.equal(
    OPERATIONAL_DESCRIPTION_PATH_STEPS[0]?.id,
    "trigger",
  );
});

test("llm system prompt embeds cybernetic component map", () => {
  const prompt = buildOperationalDescriptionLlmSystemPrompt();
  assert.match(prompt, /input_transduction/i);
  assert.match(prompt, /variety_attenuation/i);
  assert.match(prompt, /output_transduction/i);
  assert.match(prompt, /SEMÁNTICA|cotejo/i);
  assert.doesNotMatch(prompt, /priority_gap/i);
});

test("llm user prompt carries cybernetic component map", () => {
  const prompt = buildLlmCoachUserPrompt({
    draftText: "Comparo la proyeccion",
    context: {
      activityTitle: "Analizo la proyección mensual de erogaciones",
    },
  });

  assert.match(prompt, /cybernetic_components/i);
  assert.match(prompt, /Comparo la proyeccion/i);
  assert.doesNotMatch(prompt, /priority_gap/i);
});

test("prompt copy component imports canon", async () => {
  const source = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(
        projectRoot,
        "src/components/significado/OperationalDescriptionPromptCopy.tsx",
      ),
      "utf8",
    ),
  );

  assert.match(source, /operational-description-canon/);
  assert.match(source, /OPERATIONAL_DESCRIPTION_PATH_STEPS/);
});
