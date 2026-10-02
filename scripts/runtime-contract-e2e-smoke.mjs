import fs from "node:fs";
import path from "node:path";
import { validateMmabpDesignSourceBundle } from "./validate-parallel-production.mjs";
const root = process.cwd();
const baseUrl = process.env.EVE_BASE_URL ?? "http://localhost:3000";
const manifest = JSON.parse(fs.readFileSync(path.join(root, "src/runtime/capa-1-v2-1-runtime-manifest.json"), "utf8"));

const post = async (route, body) => {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${route} failed ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
};

const optionValue = (question) => question.options?.[0]?.value ?? "si";
const valueFor = (question) => {
  const code = question.question_code ?? question.code;
  if (code === "7.0") return { answerJson: { generatedReview: "Revision ligera generada para smoke E2E." } };
  if (code === "7.0a") return { selectedValue: "medium" };
  if (code === "7.1") return { selectedValue: "confirm_suggested" };
  if (code === "7.2") return { selectedValue: "intermediate" };
  if (code === "7.3") return { selectedValue: "S2" };
  if (code === "7.3a") return { selectedValue: "yes_main", freeText: "Hay carga interpersonal observada." };
  if (code === "7.4") return { freeText: "Confirmo que no es diagnostico, solo preclasificacion ligera." };

  const fieldType = question.field_type ?? question.fieldType;
  const answerMode = question.answer_mode ?? question.answerMode;
  if (fieldType?.includes("multi") || answerMode?.includes("multi")) return { selectedValues: [optionValue(question)] };
  if (fieldType === "number" || fieldType === "number_with_unit" || answerMode === "numeric" || answerMode === "numeric_with_unit") return { freeText: "8" };
  if (question.options?.length && !question.allows_free_text) return { selectedValue: optionValue(question) };
  if (question.options?.length && question.allows_free_text) return { selectedValue: optionValue(question), freeText: `Smoke E2E ${code}` };
  return { freeText: `Smoke E2E ${code}: evidencia operativa suficiente para derivacion canonica.` };
};

const buildAnswers = (sceneId, activityId) =>
  manifest.blocks.flatMap((block) =>
    block.questions
      .filter((question) => !(question.internalOnly || question.field_type === "internal" || question.field_type === "computed"))
      .map((question) => {
        const value = valueFor(question);
        return {
          activityId,
          sceneId,
          questionCode: question.question_code,
          blockId: block.block_id,
          selectedValue: value.selectedValue ?? null,
          selectedValues: value.selectedValues ?? null,
          freeText: value.freeText ?? null,
          answerJson: value.answerJson,
          instrumentVersion: "CAPA1_V2_1",
          answerNature: question.answerNature ?? "captured",
          canonicalVariable: typeof question.canonical_variable_output === "string" ? question.canonical_variable_output : undefined,
          provenanceChain: [
            {
              question_code: question.question_code,
              source: "runtime_manifest_e2e_smoke",
              provenance_type: question.provenance_type ?? "captured_user_evidence",
            },
          ],
          consolidatedValue: value.answerJson ?? value.selectedValues ?? value.selectedValue ?? value.freeText ?? null,
          readiness: {},
          confidence: {},
          flags: [],
          bundles: {},
        };
      }),
  );

const run = async () => {
  const suffix = Date.now();
  const bootstrap = await post("/api/session/bootstrap", {
    company: { nombre: `Empresa Smoke ${suffix}`, sector: "Manufactura" },
    user: { nombre: "Smoke E2E", rol_declarado: "Supervisor", email: `smoke-${suffix}@eve.local` },
  });
  const sessionId = bootstrap.session.id;

  const intake = await post("/api/intake/triple", {
    sessionId,
    activities: [
      {
        id: "activity-smoke-1",
        title: "Validacion de materiales antes de produccion",
        narrativeAnchor: "Cada manana valido materiales, detecto faltantes, coordino con compras y compenso atrasos para que produccion no se detenga.",
        origin: "usuario_redactada",
        accepted: true,
        critical: true,
        interconnectionScore: 5,
      },
    ],
    relatos: {
      ultimo_incendio: [{ questionId: "p1", answer: "Validacion de materiales antes de produccion" }],
      lo_que_no_deberia_pasar: [{ questionId: "a1", answer: "Validacion de materiales antes de produccion" }],
    },
  });
  const activityId = intake.activities[0].id;

  const scenes = await post("/api/scenes/bootstrap", { sessionId });
  const scene = scenes.scenes[0];
  if (!scene?.id) throw new Error("No scene created.");

  const answers = buildAnswers(scene.id, activityId);
  const savedAnswers = await post("/api/scenes/answers", { sessionId, sceneId: scene.id, answers });
  const derivation = await post("/api/scenes/derive", { sessionId, sceneId: scene.id });
  const preclassification = await post("/api/scenes/preclassify", { sessionId, sceneId: scene.id });
  const canonicalize = await post("/api/scenes/canonicalize", { sessionId, sceneId: scene.id });
  const intermediate = await post("/api/session/intermediate-output", { sessionId });
  const parallelProduction = await post("/api/parallel-production/design-source-bundle", { sessionId });

  const verification = await post("/api/scenes/runtime-contract-verify", { sceneId: scene.id });
  if (verification.status !== "passed") {
    throw new Error(`runtime contract verification failed: ${JSON.stringify(verification)}`);
  }

  const report = {
    status: "passed",
    checkedAt: new Date().toISOString(),
    sessionId,
    sceneId: scene.id,
    activityId,
    savedAnswers,
    derivation,
    preclassification,
    canonicalize,
    intermediate,
    parallelProduction: {
      readiness: parallelProduction.readiness,
      candidateCount: parallelProduction.candidateCount,
      evidenceCount: parallelProduction.evidenceCount,
      bundleType: parallelProduction.bundle?.bundle_type,
      boundaries: parallelProduction.bundle?.boundaries,
      sourceCore: parallelProduction.bundle?.source_core,
    },
    verification: {
      bundleTypes: verification.bundleTypes,
      allBundlesNotDiagnostic: verification.allBundlesNotDiagnostic,
      inference: verification.inference,
      block7AnswersPersisted: verification.block7AnswersPersisted,
    },
  };

  const requiredBundles = ["ahe_observation_bundle", "compensation_bundle", "evidence_bundle_for_transduction"];
  for (const bundle of requiredBundles) {
    if (!report.verification.bundleTypes?.includes(bundle)) throw new Error(`Missing bundle ${bundle}`);
  }
  if (!report.verification.allBundlesNotDiagnostic) throw new Error("Some bundles are diagnostic.");
  if (!report.verification.inference?.preclassification_readiness) throw new Error("Missing preclassification_readiness.");
  if (report.verification.inference.confidence_score < 0 || report.verification.inference.confidence_score > 100) {
    throw new Error("confidence_score out of 0-100 range.");
  }
  for (const code of ["7.3a"]) {
    if (!report.verification.block7AnswersPersisted?.includes(code)) throw new Error(`Missing persisted ${code}`);
  }

  const parallelValidation = validateMmabpDesignSourceBundle(parallelProduction.bundle);
  if (parallelValidation.status !== "passed") {
    throw new Error(`parallel production bundle failed validation: ${parallelValidation.errors.join("; ")}`);
  }
  if (parallelProduction.bundle?.bundle_type !== "mmabp_design_source_bundle") {
    throw new Error("Missing mmabp_design_source_bundle.");
  }
  if (!parallelProduction.bundle?.boundaries?.does_not_modify_capa2_readiness) {
    throw new Error("Parallel production bundle changed Capa 2 readiness boundary.");
  }
  if (!report.verification.bundleTypes?.includes("evidence_bundle_for_transduction")) {
    throw new Error("Core evidence bundle was not preserved.");
  }

  fs.mkdirSync(path.join(root, "reports"), { recursive: true });
  fs.writeFileSync(path.join(root, "reports", "runtime-contract-e2e-smoke-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
};

run().catch((error) => {
  const report = { status: "failed", checkedAt: new Date().toISOString(), error: error.message };
  fs.mkdirSync(path.join(root, "reports"), { recursive: true });
  fs.writeFileSync(path.join(root, "reports", "runtime-contract-e2e-smoke-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});



