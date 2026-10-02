export function assertRuntimeCatalogMigrationApplicationExecutionBoundary(input: {
  operator_authorization_flag?: boolean;
  operator_authorization_flag_checked?: boolean;
  operator_authorization_flag_present?: boolean;
  process_env_flag_read?: boolean;
  env_file_read?: boolean;
  secret_env_read?: boolean;
  service_role_used?: boolean;
  catalog_activated?: boolean;
  runtime_40_20_started?: boolean;
  registry_live_db_created?: boolean;
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

  if (input.operator_authorization_flag_checked !== true) {
    blockers.push("operator_authorization_flag_not_checked");
  }

  if (input.operator_authorization_flag_present !== true) {
    blockers.push("operator_authorization_flag_missing");
  }

  if (input.env_file_read === true) {
    blockers.push("env_file_read_forbidden");
  }

  if (input.secret_env_read === true) {
    blockers.push("secret_env_read_forbidden");
  }

  if (input.service_role_used === true) {
    blockers.push("service_role_used_forbidden");
  }

  for (const [key, value] of Object.entries(input)) {
    if (
      ![
        "operator_authorization_flag",
        "operator_authorization_flag_checked",
        "operator_authorization_flag_present",
        "process_env_flag_read",
        "env_file_read",
        "secret_env_read",
        "service_role_used",
      ].includes(key) &&
      value === true
    ) {
      blockers.push(`${key}_forbidden`);
    }
  }

  return {
    ok: blockers.length === 0,
    blockers,
  };
}
