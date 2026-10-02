import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));

const service = loadModule("runtime-40-20-client-result-service.ts", {
  "./runtime-40-20-client-result-types": loadTypesModule(),
  "@supabase/supabase-js": {
    createClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
  "../gates-readiness/runtime-40-20-gates-readiness-types": {},
});

const validScope = {
  tenant_id: "tenant-1",
  case_id: "case-1",
  run_id: "run-1",
  correlation_id: "corr-1",
};

test("1. Scope valid.", () => {
  const result = service.validateClientSafeResultScope(validScope);
  assert.equal(result.valid, true);
});

test("2. tenant_id required.", () => {
  const result = service.validateClientSafeResultScope({
    case_id: "case-1",
    run_id: "run-1",
    correlation_id: "corr-1",
  });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_tenant_id"));
});

test("3. case_id required.", () => {
  const result = service.validateClientSafeResultScope({
    tenant_id: "tenant-1",
    run_id: "run-1",
    correlation_id: "corr-1",
  });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_case_id"));
});

test("4. run_id required.", () => {
  const result = service.validateClientSafeResultScope({
    tenant_id: "tenant-1",
    case_id: "case-1",
    correlation_id: "corr-1",
  });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_run_id"));
});

test("5. ready maps to informacion_en_revision.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready",
  });
  assert.equal(dto.visible_state, "informacion_en_revision");
});

test("6. ready_with_flags maps to resultado_en_revision.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready_with_flags",
  });
  assert.equal(dto.visible_state, "resultado_en_revision");
});

test("7. blocked maps to bloqueado_seguro.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "blocked",
  });
  assert.equal(dto.visible_state, "bloqueado_seguro");
});

test("8. reentry_required maps to necesitamos_aclarar_algo.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "reentry_required",
  });
  assert.equal(dto.visible_state, "necesitamos_aclarar_algo");
});

test("9. manual_review_required maps to informacion_en_revision.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "manual_review_required",
  });
  assert.equal(dto.visible_state, "informacion_en_revision");
});

test("10. Client result DTO contains visible_state.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready",
  });
  assert.ok(dto.visible_state);
});

test("11. Client result DTO contains visible_title.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready",
  });
  assert.ok(dto.visible_title);
});

test("12. Client result DTO contains visible_message.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready",
  });
  assert.ok(dto.visible_message);
});

test("13. Client result DTO contains visible_next_action.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready",
  });
  assert.ok(dto.visible_next_action?.kind);
  assert.ok(dto.visible_next_action?.label);
});

test("14. Client result DTO client_safe true.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready",
  });
  assert.equal(dto.client_safe, true);
});

test("15. No readiness_state exposed.", () => {
  assertNoTermExposure("readiness_state");
});

test("16. No readiness_decision_record exposed.", () => {
  assertNoTermExposure("readiness_decision_record");
});

test("17. No readiness_gap_record exposed.", () => {
  assertNoTermExposure("readiness_gap_record");
});

test("18. No Gate exposed.", () => {
  assertNoTermExposure("Gate");
});

test("19. No Chip exposed.", () => {
  assertNoTermExposure("Chip");
});

test("20. No Runtime table exposed.", () => {
  for (const dto of allSampleDtos()) {
    assert.equal(JSON.stringify(dto).includes("Runtime table"), false);
  }
});

test("21. No MMABP exposed.", () => {
  assertNoTermExposure("MMABP");
});

test("22. No VSM exposed.", () => {
  assertNoTermExposure("VSM");
});

test("23. No AHE exposed.", () => {
  assertNoTermExposure("AHE");
});

test("24. No diagnosis exposed.", () => {
  assertNoTermExposure("diagnóstico");
});

test("25. No pathology exposed.", () => {
  assertNoTermExposure("patología");
});

test("26. No export exposed.", () => {
  assertNoTermExposure("export payload");
});

test("27. No registry exposed.", () => {
  assertNoTermExposure("registry");
});

test("28. No IR exposed.", () => {
  for (const dto of allSampleDtos()) {
    assert.equal(/\bIR\b/.test(JSON.stringify(dto)), false);
  }
});

test("29. Correction action supported.", () => {
  const dto = service.buildClientSafeCorrectionReentryDTO("correction");
  assert.equal(dto.visible_state, "puedes_corregir");
  assert.equal(dto.visible_next_action.kind, "corregir_respuesta");
  assert.equal(dto.can_correct, true);
});

test("30. Reentry action supported.", () => {
  const dto = service.buildClientSafeCorrectionReentryDTO("reentry");
  assert.equal(dto.visible_state, "necesitamos_aclarar_algo");
  assert.equal(dto.visible_next_action.kind, "aclarar_informacion");
  assert.equal(dto.can_reenter, true);
});

test("31. Review pending supported.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "ready_with_flags",
  });
  assert.equal(dto.review_pending, true);
});

test("32. Blocked safe supported.", () => {
  const dto = service.buildClientSafeResultDTO({
    scope: validScope,
    readiness_state: "blocked",
  });
  assert.equal(dto.visible_state, "bloqueado_seguro");
  assert.equal(dto.visible_next_action.enabled, false);
});

test("33. diagnosis_created remains false.", () => {
  assert.equal(service.buildP6ClientSafeResultBoundaryFlags().diagnosis_created, false);
});

test("34. export_real_created remains false.", () => {
  assert.equal(service.buildP6ClientSafeResultBoundaryFlags().export_real_created, false);
});

test("35. produccion_paralela_started remains false.", () => {
  assert.equal(
    service.buildP6ClientSafeResultBoundaryFlags().produccion_paralela_started,
    false,
  );
});

test("36. qa_green_real_created remains false.", () => {
  assert.equal(service.buildP6ClientSafeResultBoundaryFlags().qa_green_real_created, false);
});

test("37. activation_allowed remains false.", () => {
  assert.equal(service.buildP6ClientSafeResultBoundaryFlags().activation_allowed, false);
});

test("38. Dependency blocked without all local flags.", () => {
  assert.equal(
    service.isClientSafeResultDependencyBlocked({
      EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
      EVE_GATES_READINESS_LOCAL_ENABLED: "false",
      EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    }),
    true,
  );
});

test("39. Dependency unblocked with all local flags and local supabase.", () => {
  assert.equal(
    service.isClientSafeResultDependencyBlocked({
      EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
      EVE_GATES_READINESS_LOCAL_ENABLED: "true",
      EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    }),
    false,
  );
});

function allSampleDtos() {
  const states = [
    "ready",
    "ready_with_flags",
    "blocked",
    "reentry_required",
    "manual_review_required",
  ];
  return states.map((readiness_state) =>
    service.buildClientSafeResultDTO({ scope: validScope, readiness_state }),
  );
}

function assertNoTermExposure(term) {
  for (const dto of allSampleDtos()) {
    assert.equal(
      JSON.stringify(dto).toLowerCase().includes(term.toLowerCase()),
      false,
      `Unexpected exposure of ${term}`,
    );
  }
}

function loadTypesModule() {
  return loadModule("runtime-40-20-client-result-types.ts", {
    "../gates-readiness/runtime-40-20-gates-readiness-types": {},
  });
}

function loadModule(fileName, requireMap) {
  const source = readFileSync(join(__dirname, fileName), "utf8");
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
      if (id.endsWith("gates-readiness-types")) return {};
      throw new Error(`Unexpected require: ${id}`);
    },
  };
  vm.runInNewContext(outputText, context, { filename: fileName });
  return module.exports;
}
