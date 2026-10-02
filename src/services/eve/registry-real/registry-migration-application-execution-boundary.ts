export function assertRegistryMigrationApplicationExecutionBoundary(input: {
  operator_authorization_flag?: boolean;
  runtime_40_20_started?: boolean;
  ir_real_created?: boolean;
  object_inventory_real_opened?: boolean;
  f5c_real_opened?: boolean;
  production_parallel_real_opened?: boolean;
  export_created?: boolean;
  diagnosis_created?: boolean;
  delivered_created?: boolean;
  conformance_claimed?: boolean;
  consistency_claimed?: boolean;
}): {
  ok: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  if (input.operator_authorization_flag !== true) {
    blockers.push("explicit_operator_authorization_flag_missing");
  }

  for (const key of [
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
  ] as const) {
    if (input[key] === true) {
      blockers.push(key);
    }
  }

  return {
    ok: blockers.length === 0,
    blockers,
  };
}
