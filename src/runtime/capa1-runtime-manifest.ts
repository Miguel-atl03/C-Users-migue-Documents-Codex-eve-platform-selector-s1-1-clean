import runtimeManifestData from "./capa-1-v2-1-runtime-manifest.json";
import consumptionContractData from "./platform-consumption-contract.json";
import type { QuestionCatalog, QuestionnaireQuestion } from "@/domain/questionnaire";

export const PLATFORM_RUNTIME_VERSION = "CAPA1_V2_1_RUNTIME_CONSUMER";

export type RuntimeManifest = typeof runtimeManifestData;
export type PlatformConsumptionContract = typeof consumptionContractData;

export const runtimeManifest = runtimeManifestData as RuntimeManifest;
export const platformConsumptionContract =
  consumptionContractData as PlatformConsumptionContract;

export const runtimeQuestionCatalog =
  runtimeManifest.runtimeCatalog as QuestionCatalog;

export const block7RuntimeContract = runtimeManifest.block_7_runtime;
export const runtimePersistenceContract =
  runtimeManifest.runtime_persistence_contract;
export const runtimeBoundaryContract = runtimeManifest.boundaries;

export function assertRuntimeManifestCompatible() {
  const metadata = runtimeManifest.metadata;
  const expectedRuntime = metadata.expected_platform_runtime_version;

  if (expectedRuntime !== PLATFORM_RUNTIME_VERSION) {
    throw new Error(
      `Manifest incompatible: expected ${expectedRuntime}, platform exposes ${PLATFORM_RUNTIME_VERSION}.`,
    );
  }

  if (metadata.compatibility_mode !== "strict_manifest_consumer") {
    throw new Error(
      `Manifest incompatible: unsupported compatibility mode ${metadata.compatibility_mode}.`,
    );
  }

  const requiredBlock7Codes = new Set(
    runtimeManifest.block_7_runtime.required_question_codes,
  );
  const block7Codes = new Set(
    runtimeQuestionCatalog.blocks
      .find((block) => block.id === "block_7")
      ?.questions.map((question) => question.code) ?? [],
  );

  for (const code of requiredBlock7Codes) {
    if (!block7Codes.has(code)) {
      throw new Error(`Manifest incompatible: Bloque 7 missing ${code}.`);
    }
  }
}

export const runtimeQuestionsByCode = new Map<string, QuestionnaireQuestion>(
  runtimeQuestionCatalog.blocks.flatMap((block) =>
    block.questions.map((question) => [question.code, question]),
  ),
);

export const runtimeBlockIdByQuestionCode = new Map<string, string>(
  runtimeQuestionCatalog.blocks.flatMap((block) =>
    block.questions.map((question) => [question.code, block.id]),
  ),
);

export function questionFieldType(question: QuestionnaireQuestion) {
  return question.field_type ?? question.fieldType;
}

export function questionAnswerMode(question: QuestionnaireQuestion) {
  return question.answer_mode ?? question.answerMode;
}

export function questionHelpText(question: QuestionnaireQuestion) {
  return question.help_text ?? "";
}

export function questionShortLabel(question: QuestionnaireQuestion) {
  return question.short_ui_label ?? question.code;
}

export function questionAllowsFreeText(question: QuestionnaireQuestion) {
  return Boolean(question.allows_free_text);
}

export function questionFreeTextCondition(question: QuestionnaireQuestion) {
  return question.free_text_condition ?? null;
}

export function questionBranchingRule(question: QuestionnaireQuestion) {
  return question.branching_rule ?? null;
}

export function questionDependsOn(question: QuestionnaireQuestion) {
  return question.depends_on ?? [];
}

export function questionGeneratedFrom(question: QuestionnaireQuestion) {
  return question.generated_from ?? [];
}

assertRuntimeManifestCompatible();
