import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const packageDir = "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2";
const designPath = `${packageDir}/controlled-wiring-design-v1.md`;
const modesPath = "docs/audits/_eve_00_method_kernel_controlled_wiring_modes_v1.json";
const risksPath = "docs/audits/_eve_00_method_kernel_controlled_wiring_risks_v1.json";
const contractPath = "docs/audits/_eve_00_method_kernel_future_interface_contract_v1.json";
const registryPath = "src/config/rector-docs-registry.ts";
const chipTsPath = `${packageDir}/EVE_00_Method_Kernel_v0_2.ts`;
const authorityKey = ["runtime", "Authority"].join("");

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readLower(path: string) {
  return readFileSync(path, "utf8").toLowerCase();
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    return stat.isDirectory() ? walkFiles(path) : [path];
  });
}

function hasOwnDeep(value: unknown, key: string): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Object.hasOwn(value, key)) {
    return true;
  }
  return Object.values(value).some((child) => hasOwnDeep(child, key));
}

test("controlled wiring design artifacts exist and parse", () => {
  for (const path of [designPath, modesPath, risksPath, contractPath]) {
    assert.equal(existsSync(path), true, `${path} must exist`);
  }
  assert.equal(readJson(modesPath).dictamen, "METHOD_KERNEL_CONTROLLED_WIRING_DESIGN_READY");
  assert.equal(readJson(contractPath).contractStatus, "conceptual_design_only");
  assert.ok(Array.isArray(readJson(risksPath).risks));
});

test("controlled wiring modes are present with safe shadow defaults", () => {
  const modes = readJson(modesPath).modes;

  assert.ok(modes.shadow_mode);
  assert.ok(modes.advisory_mode);
  assert.ok(modes.controlled_gate_mode);
  assert.equal(modes.shadow_mode.canBlockUserFlow, false);
  assert.equal(modes.shadow_mode.canModifyPayload, false);
  assert.equal(modes.shadow_mode.canWriteRegistry, false);
  assert.equal(modes.shadow_mode.canTriggerDiagnosis, false);
});

test("controlled gate is future-only, authorized and disabled by default", () => {
  const modes = readJson(modesPath).modes;
  const design = readLower(designPath);
  const gateText = JSON.stringify(modes.controlled_gate_mode).toLowerCase();

  assert.match(gateText, /disabled by default|activate by default/);
  assert.match(gateText, /miguel explicit authorization|authorized-only activation path/);
  assert.ok(modes.controlled_gate_mode.prohibitedActions.includes("activate by default"));
  assert.match(design, /requiere autorizacion explicita de miguel/);
  assert.match(design, /no activable por defecto|disabled-by-default|no puede activarse por defecto/);
});

test("future contract rejects unsafe primary inputs", () => {
  const contract = readJson(contractPath);
  const forbiddenInputs = contract.forbiddenInputSources.join("\n").toLowerCase();

  for (const phrase of [
    "free text without provenance",
    "raw workmap draft as closed evidence",
    "unconfirmed b0 prefill",
    "data without sourceref",
    "ui output without response bundle"
  ]) {
    assert.match(forbiddenInputs, new RegExp(phrase));
  }
});

test("future contract and design prohibit invasive outputs and side effects", () => {
  const contract = readJson(contractPath);
  const design = readLower(designPath);
  const prohibited = [
    ...contract.prohibitedSideEffects,
    ...contract.proposedOutputShape.methodologicalReadinessState.split(" | ")
  ].join("\n").toLowerCase();
  const combined = `${design}\n${prohibited}`;

  for (const phrase of [
    "diagnostico eve",
    "ir",
    "registry",
    "produccion paralela",
    "runtime gate final",
    "actividades primarias",
    "mutacion de workmap",
    "mutacion de b0",
    "mensajes visibles al usuario final"
  ]) {
    assert.match(combined, new RegExp(phrase));
  }
});

test("runtime state separation remains explicit in design contract", () => {
  const design = readLower(designPath);
  const contract = readJson(contractPath);

  assert.match(design, /runtime readiness\/reentry/);
  assert.match(design, /methodological readiness/);
  assert.match(design, /diagnostic readiness/);
  assert.match(design, /production readiness/);
  assert.ok(contract.allowedReadinessStates.includes("ready_with_flags"));
  assert.ok(!contract.allowedReadinessStates.includes("blocked_by_missing_canonical_route"));
});

test("method kernel remains not wired into src or registry authority", () => {
  const registry = readFileSync(registryPath, "utf8");
  const chipTs = readFileSync(chipTsPath, "utf8");
  const packageToken = "EVE_00_Method_Kernel";
  const srcFiles = walkFiles("src").filter((path) => /\.(ts|tsx|js|jsx|json)$/.test(path));
  const srcReferences = srcFiles.filter((path) =>
    readFileSync(path, "utf8").includes(packageToken) ||
    readFileSync(path, "utf8").includes("docs/chips/method-kernel")
  );

  assert.equal(hasOwnDeep(readJson(modesPath), authorityKey), false);
  assert.equal(hasOwnDeep(readJson(contractPath), authorityKey), false);
  assert.doesNotMatch(registry, /method[-_ ]kernel|EVE_00_Method_Kernel/i);
  assert.doesNotMatch(chipTs, /from\s+["']@\/|from\s+["']\.\.\/\.\.\/\.\.\/src/);
  assert.deepEqual(srcReferences, []);
});

