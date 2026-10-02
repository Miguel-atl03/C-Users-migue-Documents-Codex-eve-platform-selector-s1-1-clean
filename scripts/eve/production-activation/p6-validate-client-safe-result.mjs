#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const smokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json",
);
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p6_client_safe_result_inventory.json",
);

const ALLOWED_VISIBLE_STATES = new Set([
  "sesion_lista",
  "mapa_de_trabajo_listo",
  "actividad_seleccionada",
  "pregunta",
  "respuesta_registrada",
  "informacion_en_revision",
  "necesitamos_aclarar_algo",
  "puedes_corregir",
  "resultado_en_revision",
  "bloqueado_seguro",
]);

const ALLOWED_NEXT_ACTIONS = new Set([
  "esperar_revision",
  "corregir_respuesta",
  "aclarar_informacion",
  "continuar_interaccion",
  "contactar_revision",
  "sin_accion_segura",
]);

function loadClientResultService() {
  const servicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-service.ts",
  );
  const typesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-types.ts",
  );
  const gatesTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-types.ts",
  );
  const typesModule = transpile(typesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": transpile(gatesTypesPath, {}),
  });
  return transpile(servicePath, {
    "./runtime-40-20-client-result-types": typesModule,
    "../gates-readiness/runtime-40-20-gates-readiness-types": transpile(gatesTypesPath, {}),
    "@supabase/supabase-js": { createClient: () => ({}) },
  });
}

function transpile(filePath, requireMap) {
  const source = readFileSync(filePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      require: (id) => requireMap[id] ?? {},
      process,
    },
    { filename: filePath },
  );
  return module.exports;
}

function main() {
  if (!existsSync(smokePath)) {
    console.error("Missing P6 smoke results. Run p6-client-safe-result-local-smoke.mjs first.");
    process.exit(1);
  }

  const smoke = JSON.parse(readFileSync(smokePath, "utf8"));
  const service = loadClientResultService();
  const dto = smoke.client_safe_result_dto;

  const allowed_visible_state_used = ALLOWED_VISIBLE_STATES.has(dto.visible_state);
  const next_action_safe =
    dto.visible_next_action &&
    ALLOWED_NEXT_ACTIONS.has(dto.visible_next_action.kind) &&
    typeof dto.visible_next_action.label === "string";
  const correction_or_reentry_safe =
    (dto.can_correct === true && dto.visible_next_action?.kind === "corregir_respuesta") ||
    (dto.can_reenter === true && dto.visible_next_action?.kind === "aclarar_informacion") ||
    dto.visible_state === "resultado_en_revision" ||
    dto.visible_state === "informacion_en_revision";

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P6_CLIENT_SAFE_RESULT_VALIDATION",
    generated_at: new Date().toISOString(),
    client_visible_result_safe:
      smoke.client_visible_result_safe === true &&
      dto.client_safe === true &&
      service.validateClientSafeResultNoInternalLeakage(dto),
    client_final_diagnosis_visible: false,
    allowed_visible_state_used,
    next_action_safe,
    correction_or_reentry_safe,
    visible_state: dto.visible_state,
    visible_next_action_kind: dto.visible_next_action?.kind ?? null,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (
    !result.client_visible_result_safe ||
    !result.allowed_visible_state_used ||
    !result.next_action_safe
  ) {
    process.exit(1);
  }
}

main();
