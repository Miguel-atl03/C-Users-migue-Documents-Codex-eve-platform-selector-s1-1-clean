import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));

const clientResultStub = {
  buildClientSafeResultDTO: (request) => ({
    visible_state:
      request.readiness_state === "blocked"
        ? "bloqueado_seguro"
        : request.readiness_state === "reentry_required"
          ? "necesitamos_aclarar_algo"
          : request.readiness_state === "ready"
            ? "informacion_en_revision"
            : "resultado_en_revision",
    visible_title: "Resultado en revisión",
    visible_message: "Tu información está en revisión.",
    visible_next_action: { kind: "esperar_revision", label: "Esperar revisión", enabled: true },
    review_pending: true,
    can_correct: false,
    can_reenter: request.readiness_state === "reentry_required",
    client_safe: true,
  }),
  getClientSafeResultLocalAdapterStatus: () => ({
    enabled: false,
    dependency_blocked: true,
    local_runtime_flag_required: true,
    local_gates_readiness_flag_required: true,
    local_client_safe_result_flag_required: true,
    local_target_available: false,
    blocked_reason: "client_safe_result_local_flag_disabled",
  }),
  isClientSafeResultDependencyBlocked: (env = process.env) =>
    env.EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED !== "true" ||
    env.EVE_RUNTIME_40_20_LOCAL_ENABLED !== "true" ||
    env.EVE_GATES_READINESS_LOCAL_ENABLED !== "true",
  validateClientSafeResultNoInternalLeakage: () => true,
};

const service = loadModule("runtime-40-20-client-bff-service.ts", {
  "./runtime-40-20-client-bff-types": loadTypesModule(),
  "../client-result/runtime-40-20-client-result-service": clientResultStub,
  "../gates-readiness/runtime-40-20-gates-readiness-types": {},
});

const validScope = {
  tenant_id: "tenant-1",
  case_id: "case-1",
  correlation_id: "corr-1",
};

const validInteractionScope = {
  ...validScope,
  role_id: "role-1",
  activity_id: "activity-1",
  run_id: "run-1",
};

test("1. Scope valid with tenant_id/case_id/correlation_id.", () => {
  const result = service.validateBFFScope(validScope, "state");
  assert.equal(result.valid, true);
  assert.equal(result.blocking_reasons.length, 0);
});

test("2. Missing tenant_id blocks request.", () => {
  const result = service.validateBFFScope(
    { case_id: "case-1", correlation_id: "corr-1" },
    "state",
  );
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_tenant_id"));
});

test("3. Missing case_id blocks request.", () => {
  const result = service.validateBFFScope(
    { tenant_id: "tenant-1", correlation_id: "corr-1" },
    "state",
  );
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_case_id"));
});

test("4. Missing correlation_id blocks request.", () => {
  const result = service.validateBFFScope(
    { tenant_id: "tenant-1", case_id: "case-1" },
    "state",
  );
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_correlation_id"));
});

test("5. POST without idempotency_key blocks request.", () => {
  const scopeResult = service.validateBFFScope(validInteractionScope, "answer");
  assert.equal(scopeResult.valid, true);
  const idempotencyResult = service.validateBFFIdempotency(
    scopeResult.scope,
    true,
  );
  assert.equal(idempotencyResult.valid, false);
  assert.ok(
    idempotencyResult.blocking_reasons.includes("missing_idempotency_key"),
  );
});

test("6. Safe state response has no internal fields.", () => {
  const response = service.buildBFFSafeStateResponse({ scope: validScope });
  assert.equal(service.validateBFFNoInternalFieldLeakage(response), true);
});

test("7. Safe session response has no internal fields.", () => {
  const response = service.buildBFFSafeSessionResponse({ scope: validScope });
  assert.equal(service.validateBFFNoInternalFieldLeakage(response), true);
});

test("8. Safe interaction response has no internal fields.", () => {
  const response = service.buildBFFSafeInteractionResponse({
    scope: validInteractionScope,
  });
  assert.equal(service.validateBFFNoInternalFieldLeakage(response), true);
});

test("9. Safe answer response has no internal fields.", () => {
  const response = service.buildBFFSafeAnswerResponse({
    scope: { ...validInteractionScope, idempotency_key: "idem-1" },
  });
  assert.equal(service.validateBFFNoInternalFieldLeakage(response), true);
});

test("10. Safe review response has no internal fields.", () => {
  const response = service.buildBFFSafeReviewResponse({
    scope: { ...validScope, run_id: "run-1" },
  });
  assert.equal(service.validateBFFNoInternalFieldLeakage(response), true);
});

test("11. Dependency blocked response is client-safe.", () => {
  const response = service.buildBFFDependencyBlockedResponse(validScope);
  assert.equal(response.dependency_blocked, true);
  assert.equal(response.status, "servicio_en_preparacion");
  assert.equal(service.validateBFFNoInternalFieldLeakage(response), true);
});

test("12. Dependency blocked does not expose Runtime.", () => {
  const response = service.buildBFFDependencyBlockedResponse(validScope);
  const serialized = JSON.stringify(response).toLowerCase();
  assert.equal(serialized.includes("runtime_interaction_instance"), false);
  assert.equal(serialized.includes("internal_runtime_state"), false);
});

test("13. Dependency blocked does not expose Supabase.", () => {
  const response = service.buildBFFDependencyBlockedResponse(validScope);
  const serialized = JSON.stringify(response).toLowerCase();
  assert.equal(serialized.includes("supabase"), false);
});

test("14. Dependency blocked does not expose SQL.", () => {
  const response = service.buildBFFDependencyBlockedResponse(validScope);
  const serialized = JSON.stringify(response).toLowerCase();
  assert.equal(/\bsql\b/i.test(serialized), false);
});

test("15. No service_role exposure.", () => {
  const payloads = [
    service.buildBFFSafeStateResponse({ scope: validScope }),
    service.buildBFFDependencyBlockedResponse(validScope),
  ];
  for (const payload of payloads) {
    assert.equal(service.validateBFFNoServiceRoleExposure(payload), true);
  }
});

test("16. No MMABP exposure.", () => {
  assertNoTermExposure("MMABP");
});

test("17. No VSM exposure.", () => {
  assertNoTermExposure("VSM");
});

test("18. No AHE exposure.", () => {
  assertNoTermExposure("AHE");
});

test("19. No Gate exposure.", () => {
  assertNoTermExposure("Gate");
});

test("20. No Chip exposure.", () => {
  assertNoTermExposure("Chip");
});

test("21. No Runtime table exposure.", () => {
  assertNoTermExposure("Runtime table");
});

test("22. No diagnosis exposure.", () => {
  assertNoTermExposure("diagnóstico final");
});

test("23. No export exposure.", () => {
  assertNoTermExposure("export payload");
});

test("24. No registry exposure.", () => {
  assertNoTermExposure("registry");
});

test("25. No IR exposure.", () => {
  const payloads = allSafePayloads();
  for (const payload of payloads) {
    const serialized = JSON.stringify(payload);
    assert.equal(/\bIR\b/.test(serialized), false);
  }
});

test("26. BFF route inventory created.", () => {
  const types = loadTypesModule();
  assert.equal(types.EVE_CLIENT_BFF_ROUTE_INVENTORY.length, 5);
  for (const entry of types.EVE_CLIENT_BFF_ROUTE_INVENTORY) {
    assert.equal(entry.created, true);
  }
});

test("27. BFF audit envelope candidate created.", () => {
  const audit = service.buildBFFAuditEnvelopeCandidate(
    "state",
    validScope,
    "bff_scope_validated",
  );
  assert.ok(audit.audit_envelope_candidate_ref);
  assert.equal(audit.supabase_touched, false);
  assert.equal(audit.runtime_real_started, false);
});

test("28. Supabase touched remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.supabase_touched, false);
  assert.equal(service.validateBFFNoSupabaseAccessForP2(), true);
});

test("29. SQL executed remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.sql_executed, false);
  assert.equal(service.validateBFFNoSQLForP2(), true);
});

test("30. Runtime real started remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.runtime_real_started, false);
  assert.equal(service.validateBFFNoDirectRuntimeAccess(), true);
});

test("31. Gates real executed remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.gates_real_executed, false);
});

test("32. QA green real created remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.qa_green_real_created, false);
});

test("33. Activation allowed remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.activation_allowed, false);
});

test("34. Diagnosis created remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.diagnosis_created, false);
});

test("35. Export real created remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.export_real_created, false);
});

test("36. Producción Paralela started remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.produccion_paralela_started, false);
});

test("37. Real client access enabled remains false.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.real_client_access_enabled, false);
});

test("38. Ready for P3 Supabase/RLS/schema design can be true only if all above pass.", () => {
  const result = service.buildP2BFFRealDesignSecurityContractResult(true);
  assert.equal(result.ready_for_p3_supabase_rls_schema_design, true);
  const blocked = service.buildP2BFFRealDesignSecurityContractResult(false);
  assert.equal(blocked.ready_for_p3_supabase_rls_schema_design, false);
});

test("Import guard: BFF source files contain no forbidden imports.", () => {
  const bffDir = __dirname;
  const routeDir = join(
    __dirname,
    "../../../../app/api/eve/runtime-40-20/client-bff",
  );
  const forbiddenImportPatterns = [
    /@supabase/i,
    /from\s+['"][^'"]*supabase/i,
    /from\s+['"][^'"]*postgres/i,
    /CriticalRouteGate/i,
    /MMABPGateEngine/i,
    /BranchingEngine/i,
    /ParallelProductionExporter/i,
    /from\s+['"][^'"]*registry/i,
    /from\s+['"][^'"]*diagnosis/i,
    /from\s+['"][^'"]*export/i,
    /service_role/i,
  ];

  const files = [
    ...collectFiles(bffDir).filter((file) => !file.endsWith(".test.mjs")),
    ...(existsSync(routeDir) ? collectFiles(routeDir) : []),
  ];

  for (const filePath of files) {
    const importLines = readFileSync(filePath, "utf8")
      .split("\n")
      .filter((line) => /^\s*import\s/.test(line) || /\brequire\s*\(/.test(line));

    for (const line of importLines) {
      for (const pattern of forbiddenImportPatterns) {
        assert.equal(
          pattern.test(line),
          false,
          `Forbidden import pattern ${pattern} found in ${filePath}: ${line}`,
        );
      }
    }
  }
});

function allSafePayloads() {
  return [
    service.buildBFFSafeStateResponse({ scope: validScope }),
    service.buildBFFSafeSessionResponse({ scope: validScope }),
    service.buildBFFSafeInteractionResponse({ scope: validInteractionScope }),
    service.buildBFFSafeAnswerResponse({
      scope: { ...validInteractionScope, idempotency_key: "idem-1" },
    }),
    service.buildBFFSafeReviewResponse({
      scope: { ...validScope, run_id: "run-1" },
    }),
    service.buildBFFDependencyBlockedResponse(validScope),
  ];
}

function assertNoTermExposure(term) {
  for (const payload of allSafePayloads()) {
    assert.equal(
      JSON.stringify(payload).toLowerCase().includes(term.toLowerCase()),
      false,
      `Unexpected exposure of ${term}`,
    );
  }
}

function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function loadTypesModule() {
  return loadModule("runtime-40-20-client-bff-types.ts", {});
}

function loadModule(fileName, requireMap) {
  const source = readFileSync(new URL(fileName, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    require: (id) => {
      if (id in requireMap) return requireMap[id];
      throw new Error(`Unexpected require: ${id}`);
    },
  };

  vm.runInNewContext(outputText, context, { filename: fileName });
  return module.exports;
}
