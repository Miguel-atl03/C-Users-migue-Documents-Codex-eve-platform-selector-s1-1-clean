export type RectorDocDomain =
  | "workmap"
  | "significado"
  | "runtime"
  | "primary_activity_selection"
  | "block0"
  | "epistemic_governance"
  | "budget";

export type RectorDocStatus =
  | "editorial_only"
  | "human_canonical_md"
  | "machine_readable_json"
  | "machine_readable_partial"
  | "executable_ts"
  | "deprecated_editorial_source";

export type RectorDocRegistryEntry = {
  id: string;
  title: string;
  domain: RectorDocDomain;
  status: RectorDocStatus;
  editorialSources: string[];
  humanCanonicalMd?: string;
  machineReadableJson?: string;
  executableTs?: string;
  tests: string[];
  runtimeAuthority: boolean;
  notes?: string;
};

export const RECTOR_DOCS_REGISTRY = [
  {
    id: "primary_activity_selection_v1_3",
    title: "Primary Activity Selection Policy EVE/MMABP v1.3",
    domain: "primary_activity_selection",
    status: "executable_ts",
    editorialSources: [
      "docs/policies/PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx",
    ],
    humanCanonicalMd: "docs/runtime/primary-activity-selection-policy.v1.3.md",
    machineReadableJson: "src/rules/primary-activity-selection-policy.v1.3.json",
    executableTs: "src/domain/primary-activity-selection-policy.v1.3.ts",
    tests: ["tests/regression/primary-activity-selection-policy.test.ts"],
    runtimeAuthority: true,
    notes:
      "XLSX v1.2 is a deprecated editorial antecedent only; runtime authority is v1.3 TS/JSON plus tests.",
  },
  {
    id: "runtime_block0_catalog",
    title: "Runtime Block0 Catalog",
    domain: "block0",
    status: "machine_readable_partial",
    editorialSources: [
      "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    ],
    humanCanonicalMd: "docs/runtime/block0-machine-readable-contract.md",
    machineReadableJson: "src/features/runtime/block0/block0.catalog.json",
    executableTs: "src/features/runtime/block0-catalog-snapshot.ts",
    tests: [
      "tests/regression/runtime-block0-catalog-adapter.test.ts",
      "tests/regression/runtime-block0-machine-readable-contract.test.ts",
    ],
    runtimeAuthority: true,
    notes:
      "Current adapter authority remains the TS snapshot; JSON is the V1 machine-readable counterpart and validation target.",
  },
  {
    id: "runtime_block0_response_model_r1",
    title: "Runtime Block0 Response Model R1",
    domain: "block0",
    status: "executable_ts",
    editorialSources: [],
    executableTs:
      "src/domain/runtime-block0-response.ts; src/services/runtime-block0-response-model.ts",
    tests: ["tests/regression/runtime-block0-response-model.test.ts"],
    runtimeAuthority: true,
    notes:
      "Owns the in-memory response bundle envelope and epistemic status for B0 responses.",
  },
  {
    id: "workmap_to_block0_prefill",
    title: "WorkMap to Block0 Prefill",
    domain: "runtime",
    status: "executable_ts",
    editorialSources: [],
    executableTs: "src/services/workmap-to-block0-prefill.ts",
    tests: ["tests/regression/workmap-to-block0-prefill.test.ts"],
    runtimeAuthority: true,
    notes:
      "Prefill is context only; it must not emit captured evidence or complete B0 automatically.",
  },
  {
    id: "runtime_40_20_full_catalog",
    title: "Runtime 40/20 Full Catalog",
    domain: "runtime",
    status: "machine_readable_partial",
    editorialSources: [
      "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
      "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    ],
    humanCanonicalMd: "docs/runtime/runtime-40-20-machine-readable-map.md",
    machineReadableJson: "src/features/runtime/catalog/runtime-40-20.manifest.json",
    tests: ["tests/regression/runtime-block0-machine-readable-contract.test.ts"],
    runtimeAuthority: false,
    notes:
      "Full runtime catalog not yet fully materialized as executable machine-readable source.",
  },
] as const satisfies readonly RectorDocRegistryEntry[];

export function getRectorDocRegistryEntry(
  id: string,
): RectorDocRegistryEntry | undefined {
  return RECTOR_DOCS_REGISTRY.find((entry) => entry.id === id);
}
