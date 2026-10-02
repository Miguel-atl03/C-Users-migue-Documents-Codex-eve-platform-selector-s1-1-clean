import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const inputPath =
  process.argv[2] ??
  path.join(repoRoot, "fixtures", "manufactura-assisted-session-input.json");
const baseUrl = process.env.EVE_BASE_URL ?? "http://localhost:3000";
const company = {
  nombre: "Manufactura de Muebles - Caso de Prueba EVE",
  sector: "Manufactura de muebles",
};

const readJson = async (filePath) =>
  JSON.parse(await fs.readFile(filePath, "utf8"));

const postJson = async (pathname, body) => {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${pathname} failed: ${JSON.stringify(json)}`);
  }

  return json;
};

const roleEmail = (roleNumber) =>
  `manufactura.rol${roleNumber}.${Date.now()}@eve.local`;

const adminEmail = () => `manufactura.admin.${Date.now()}@eve.local`;

const buildRoleRelatos = (roleSession) => {
  const first = roleSession.activities[0];
  const second = roleSession.activities[1] ?? first;

  return {
    ultimo_incendio: [
      {
        question: "Actividad principal relacionada",
        answer: first.title,
      },
      {
        question: "Que paso",
        answer:
          "Sesion asistida reconstruida desde caso de manufactura: se documentan fricciones, dependencias, capacidad real y coordinacion del rol.",
      },
    ],
    lo_que_no_deberia_pasar: [
      {
        question: "Actividad principal relacionada",
        answer: second.title,
      },
      {
        question: "Que no deberia pasar",
        answer:
          "No deberia normalizarse operar con informacion incompleta, metas incompatibles, workaround y sacrificio humano recurrente.",
      },
    ],
  };
};

const completeOperationalSession = async (input, roleSession) => {
  const bootstrap = await postJson("/api/session/bootstrap", {
    company,
    user: {
      nombre: roleSession.roleName,
      rol_declarado: roleSession.vsmRole ?? roleSession.roleHeader,
      email: roleEmail(roleSession.roleNumber),
    },
  });
  const sessionId = bootstrap.session.id;
  console.log(`Role ${roleSession.roleNumber} session created: ${sessionId}`);

  const intake = await postJson("/api/intake/triple", {
    sessionId,
    activities: roleSession.activities,
    relatos: buildRoleRelatos(roleSession),
  });
  console.log(`Role ${roleSession.roleNumber} activities saved: ${intake.activities.length}`);

  const inputActivityIdByLegacyId = new Map(
    intake.activities.map((activity, index) => [
      activity.id,
      roleSession.activities[index].id,
    ]),
  );

  const bootstrapScenes = await postJson("/api/scenes/bootstrap", { sessionId });
  console.log(`Role ${roleSession.roleNumber} scenes bootstrapped: ${bootstrapScenes.scenes.length}`);

  for (const [index, scene] of bootstrapScenes.scenes.entries()) {
    const inputActivityId = inputActivityIdByLegacyId.get(scene.legacy_actividad_id);
    const answers = input.sceneAnswersByActivityId[inputActivityId] ?? [];

    if (!answers.length) {
      console.warn(`No answers found for scene ${scene.id}`);
      continue;
    }

    const sceneAnswers = answers.map((answer) => ({
      ...answer,
      activityId: scene.legacy_actividad_id,
      sceneId: scene.id,
    }));

    await postJson("/api/scenes/answers", {
      sessionId,
      sceneId: scene.id,
      answers: sceneAnswers,
    });
    await postJson("/api/scenes/derive", { sessionId, sceneId: scene.id });
    await postJson("/api/scenes/preclassify", { sessionId, sceneId: scene.id });
    await postJson("/api/scenes/consistency", { sessionId, sceneId: scene.id });
    await postJson("/api/scenes/canonicalize", { sessionId, sceneId: scene.id });

    console.log(
      `Role ${roleSession.roleNumber} scene ${index + 1}/${bootstrapScenes.scenes.length} completed`,
    );
  }

  const intermediate = await postJson("/api/session/intermediate-output", {
    sessionId,
  });
  const causal = await postJson("/api/causal/diagnostic", {
    sessionId,
  });

  return {
    roleNumber: roleSession.roleNumber,
    roleHeader: roleSession.roleHeader,
    roleName: roleSession.roleName,
    vsmRole: roleSession.vsmRole,
    expectedRootCanonical: roleSession.expectedRootCanonical ?? null,
    expectedRootLabel: roleSession.expectedRootLabel ?? null,
    testHypothesis: roleSession.testHypothesis ?? null,
    sessionId,
    activityCount: roleSession.activities.length,
    sceneCount: bootstrapScenes.scenes.length,
    intermediate,
    causalSummary: {
      sessionCausalOutputId: causal.persistence?.session_causal_output_id ?? null,
      rootNode:
        causal.output.root_node_probable_within_mvp_scope?.nodeLabel ?? null,
      confidenceLevel: causal.output.confidence_level,
      needsReentry: causal.output.needs_reentry,
      needsExpertReview: causal.output.needs_expert_review,
      activatedNodes: [
        causal.output.root_node_probable_within_mvp_scope,
        ...causal.output.secondary_nodes_activated,
      ]
        .filter(Boolean)
        .map((node) => ({
          node: node.nodeLabel,
          confidence: node.confidenceLevel,
          scenesThatSupport: node.scenesThatSupport.length,
        })),
    },
  };
};

const createGlobalAdminSession = async () => {
  const bootstrap = await postJson("/api/session/bootstrap", {
    company,
    user: {
      nombre: "Experto EVE Consultor",
      rol_declarado: "Administrador global de lectura empresarial",
      email: adminEmail(),
    },
  });

  return {
    sessionId: bootstrap.session.id,
    purpose:
      "Sesion global administrativa para consultar las sesiones operativas por rol; no mezcla actividades de usuarios.",
  };
};

const main = async () => {
  const input = await readJson(inputPath);

  console.log(`Loading case: ${input.metadata.caseName}`);
  console.log(`Strategy: one operational session per role + one global admin session`);
  console.log(`Roles: ${input.roleSessions.length}`);
  console.log(`Total activities: ${input.metadata.activityCount}`);

  const adminSession = await createGlobalAdminSession();
  console.log(`Global admin session created: ${adminSession.sessionId}`);

  const roleResults = [];

  for (const roleSession of input.roleSessions) {
    roleResults.push(await completeOperationalSession(input, roleSession));
  }

  const result = {
    caseName: input.metadata.caseName,
    reconstructionMode: input.metadata.reconstructionMode,
    sessionStrategy: input.metadata.sessionStrategy,
    globalAdminSession: adminSession,
    roleSessions: roleResults,
  };
  const resultPath = path.join(
    path.dirname(inputPath),
    `manufactura-assisted-multisession-result-${Date.now()}.json`,
  );
  await fs.writeFile(resultPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`Result written: ${resultPath}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
