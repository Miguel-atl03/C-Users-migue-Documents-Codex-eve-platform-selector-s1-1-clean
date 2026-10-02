import type { RegistryRealMinimalBoundaryInput } from "./registry-real-minimal-types";

const FORBIDDEN_FLAGS: Array<keyof RegistryRealMinimalBoundaryInput> = [
  "runtime_40_20_started",
  "ir_real_created",
  "object_inventory_real_opened",
  "f5c_real_opened",
  "production_parallel_real_opened",
  "export_created",
  "diagnosis_created",
  "delivered_created",
  "conformance_claimed",
  "consistency_claimed",
];

export function assertRegistryRealMinimalBoundary(
  input: RegistryRealMinimalBoundaryInput,
): {
  ok: boolean;
  blockers: string[];
} {
  const blockers = FORBIDDEN_FLAGS.filter((flag) => input[flag] === true);

  return {
    ok: blockers.length === 0,
    blockers,
  };
}
