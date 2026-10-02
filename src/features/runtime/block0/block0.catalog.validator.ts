import type {
  Block0Catalog,
  Block0CatalogInteraction,
  Block0CatalogValidationResult,
} from "./block0.catalog.types";

const EXPECTED_IDS = ["B0-Q01", "B0-Q02", "B0-Q03", "B0-Q04"] as const;

const VALID_HELP_TEXT_KINDS = new Set(["canonical", "fallback_no_canonico", "none"]);
const VALID_CANONICAL_HELP_STATUSES = new Set([
  "present",
  "CANONICAL_HELP_MISSING",
]);
const PROHIBITED_VISIBLE_PATTERNS = [
  /Bloque 0/i,
  /\bruntime\b/i,
  /\bMMABP\b/i,
  /\bVSM\b/i,
  /\bpayload\b/i,
  /\bgates\b/i,
  /\bscore\b/i,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSourceRefs(
  interaction: Block0CatalogInteraction,
  errors: string[],
) {
  if (!Array.isArray(interaction.sourceSheetRefs) || interaction.sourceSheetRefs.length === 0) {
    errors.push(`${interaction.runtimeInteractionId} must have sourceSheetRefs`);
    return;
  }

  for (const [index, sourceRef] of interaction.sourceSheetRefs.entries()) {
    if (!isNonEmptyString(sourceRef.sourceSheet)) {
      errors.push(`${interaction.runtimeInteractionId} source ref ${index} misses sourceSheet`);
    }
    if (!Array.isArray(sourceRef.sourceColumns) || sourceRef.sourceColumns.length === 0) {
      errors.push(`${interaction.runtimeInteractionId} source ref ${index} misses sourceColumns`);
    }
  }
}

function validateVisibleText(
  interaction: Block0CatalogInteraction,
  errors: string[],
) {
  const visibleText = `${interaction.questionText}\n${interaction.helpText}`;

  for (const pattern of PROHIBITED_VISIBLE_PATTERNS) {
    if (pattern.test(visibleText)) {
      errors.push(`${interaction.runtimeInteractionId} leaks internal term ${pattern}`);
    }
  }

  if (interaction.technicalLabel && interaction.helpText === interaction.technicalLabel) {
    errors.push(`${interaction.runtimeInteractionId} uses technicalLabel as helpText`);
  }
}

function validateInteraction(
  interaction: Block0CatalogInteraction,
  expectedIndex: number,
  errors: string[],
) {
  const expectedId = EXPECTED_IDS[expectedIndex];
  if (interaction.runtimeInteractionId !== expectedId) {
    errors.push(`Expected ${expectedId} at index ${expectedIndex}`);
  }
  if (interaction.sourceRuntimeInteractionId !== interaction.runtimeInteractionId) {
    errors.push(`${interaction.runtimeInteractionId} must preserve sourceRuntimeInteractionId`);
  }
  if (interaction.runtimeOrder !== expectedIndex + 1) {
    errors.push(`${interaction.runtimeInteractionId} has wrong runtimeOrder`);
  }
  if (!isNonEmptyString(interaction.questionText)) {
    errors.push(`${interaction.runtimeInteractionId} misses questionText`);
  }
  if (!VALID_HELP_TEXT_KINDS.has(interaction.helpTextKind)) {
    errors.push(`${interaction.runtimeInteractionId} has invalid helpTextKind`);
  }
  if (!VALID_CANONICAL_HELP_STATUSES.has(interaction.canonicalHelpStatus)) {
    errors.push(`${interaction.runtimeInteractionId} has invalid canonicalHelpStatus`);
  }
  if (interaction.runtimeInteractionId === "B0-Q01" && interaction.subfields.length === 0) {
    errors.push("B0-Q01 must keep semantic subfields");
  }
  if (interaction.runtimeInteractionId === "B0-Q03" && interaction.subfields.length === 0) {
    errors.push("B0-Q03 must keep frequency/context/actor subfields");
  }
  if (
    interaction.runtimeInteractionId === "B0-Q04" &&
    !interaction.storageRule?.includes("input_transduction")
  ) {
    errors.push("B0-Q04 must preserve separable boundary metadata");
  }

  validateVisibleText(interaction, errors);
  validateSourceRefs(interaction, errors);
}

export function validateBlock0Catalog(
  catalog: unknown,
): Block0CatalogValidationResult {
  const errors: string[] = [];

  if (!isRecord(catalog)) {
    return { valid: false, errors: ["catalog must be an object"] };
  }

  if (catalog.schemaVersion !== "runtime-block0-catalog.v1") {
    errors.push("schemaVersion must be runtime-block0-catalog.v1");
  }

  const interactions = catalog.interactions;
  if (!Array.isArray(interactions)) {
    return { valid: false, errors: [...errors, "interactions must be an array"] };
  }

  if (interactions.length !== EXPECTED_IDS.length) {
    errors.push("catalog must contain exactly B0-Q01 through B0-Q04");
  }

  const ids = interactions
    .filter(isRecord)
    .map((interaction) => interaction.runtimeInteractionId)
    .filter((id): id is string => typeof id === "string");
  if (new Set(ids).size !== ids.length) {
    errors.push("runtimeInteractionId values must be unique");
  }

  for (const [index, interaction] of interactions.entries()) {
    if (!isRecord(interaction)) {
      errors.push(`interaction ${index} must be an object`);
      continue;
    }
    validateInteraction(interaction as Block0CatalogInteraction, index, errors);
  }

  return { valid: errors.length === 0, errors };
}

export type { Block0Catalog };
