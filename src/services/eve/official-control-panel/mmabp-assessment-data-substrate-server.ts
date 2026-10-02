import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateClientMmabpStructuralFacts,
  validateInventoryReadiness,
  validateMmabpDesignSourceBundle,
  validateMmabpIrPackage,
  validateQuadrantRegistryPackage,
} from "../../../../scripts/validate-parallel-production.mjs";

export type MmabpSourcePackageType =
  | "evidence_bundle"
  | "structural_facts"
  | "quadrant_registry"
  | "inventory"
  | "mmabp_ir";

const REQUIRED_KEYS: Record<MmabpSourcePackageType, string> = {
  evidence_bundle: "literal_evidence",
  structural_facts: "structural_facts",
  quadrant_registry: "registries",
  inventory: "inventory_readiness",
  mmabp_ir: "models",
};

type ValidationResult = {
  status?: string;
  ok?: boolean;
  errors?: string[];
  failures?: string[];
  findings?: string[];
  warnings?: string[];
};

function assertValidationResult(name: string, validation: ValidationResult): void {
  const errors = [
    ...(validation.errors ?? []),
    ...(validation.failures ?? []),
    ...(validation.findings ?? []),
  ];
  const passed =
    validation.status === "passed" ||
    (validation.status === undefined && (validation.ok === true || errors.length === 0));
  if (!passed) {
    throw new Error(`${name}:${errors.join("; ") || validation.status || "failed"}`);
  }
}

export function canonicalizeMmabpJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeMmabpJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalizeMmabpJson(entry)]),
    );
  }
  return value;
}

export function calculateMmabpServerSha256(value: unknown): string {
  const canonical = JSON.stringify(canonicalizeMmabpJson(value));
  return createHash("sha256").update(canonical).digest("hex");
}

export function assertMmabpPackageShape(
  packageType: MmabpSourcePackageType,
  content: unknown,
): void {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new Error("mmabp_content_must_be_object");
  }
  if (!(REQUIRED_KEYS[packageType] in content)) {
    throw new Error(`mmabp_invalid_${packageType}`);
  }
}

export function assertOfficialMmabpPackageValidation(input: {
  packageType: MmabpSourcePackageType;
  content: unknown;
  sourceBundle?: unknown;
  structuralFacts?: unknown;
  inventoryReadiness?: unknown;
  registryPackage?: unknown;
  conformanceReport?: unknown;
  consistencyReport?: unknown;
}): void {
  assertMmabpPackageShape(input.packageType, input.content);
  if (input.packageType === "evidence_bundle") {
    assertValidationResult("mmabp_invalid_evidence_bundle", validateMmabpDesignSourceBundle(input.content));
    return;
  }
  if (input.packageType === "structural_facts") {
    assertValidationResult(
      "mmabp_invalid_structural_facts",
      validateClientMmabpStructuralFacts(input.content, input.sourceBundle),
    );
    return;
  }
  if (input.packageType === "inventory") {
    assertValidationResult(
      "mmabp_invalid_inventory",
      validateInventoryReadiness(input.content, input.structuralFacts, input.sourceBundle),
    );
    return;
  }
  if (input.packageType === "quadrant_registry") {
    assertValidationResult(
      "mmabp_invalid_quadrant_registry",
      validateQuadrantRegistryPackage(input.content, input.structuralFacts, input.inventoryReadiness),
    );
    return;
  }
  assertValidationResult(
    "mmabp_invalid_ir",
    validateMmabpIrPackage(input.content, input.registryPackage, {
      conformanceReport: input.conformanceReport,
      consistencyReport: input.consistencyReport,
    }),
  );
}

export async function ingestMmabpSourcePackageVersion(input: {
  supabase: SupabaseClient;
  companyId: string;
  caseId: string;
  parallelProductionPackageId: string;
  packageType: MmabpSourcePackageType;
  sourcePackageId: string;
  schemaId: string;
  schemaVersion: string;
  content: unknown;
  requestId: string;
  actorId: string;
  idempotencyKey: string;
  producerType: string;
  producerRef: string;
  expectedSha256?: string | null;
  sourceBundle?: unknown;
  structuralFacts?: unknown;
  inventoryReadiness?: unknown;
  registryPackage?: unknown;
  conformanceReport?: unknown;
  consistencyReport?: unknown;
}) {
  assertOfficialMmabpPackageValidation(input);
  const canonicalContent = canonicalizeMmabpJson(input.content);

  return input.supabase.rpc("eve_mmabp_ingest_source_package_version_v2", {
    p_company_id: input.companyId,
    p_case_id: input.caseId,
    p_parallel_production_package_id: input.parallelProductionPackageId,
    p_package_type: input.packageType,
    p_source_package_id: input.sourcePackageId,
    p_schema_id: input.schemaId,
    p_schema_version: input.schemaVersion,
    p_content: canonicalContent,
    p_request_id: input.requestId,
    p_expected_sha256: input.expectedSha256 ?? null,
    p_producer_type: input.producerType,
    p_producer_ref: input.producerRef,
    p_actor_id: input.actorId,
    p_idempotency_key: input.idempotencyKey,
  });
}
