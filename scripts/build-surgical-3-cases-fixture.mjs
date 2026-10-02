import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const sourceTextPath = process.argv[2];
const outputPath =
  process.argv[3] ??
  path.join(repoRoot, "fixtures", "surgical-3-cases-session-input.json");

if (!sourceTextPath) {
  throw new Error("Usage: node scripts/build-surgical-3-cases-fixture.mjs <source-text> [output-json]");
}

const profiles = {
  A: {
    roleNumber: 1,
    expectedRootCanonical: "N06",
    expectedRootLabel: "N06 Tortura Causal",
    hypothesis:
      "Workaround fuerte como consecuencia de secuencia causal rota PF-OLC.",
    nominal: 6,
    real: 2,
    wait: "2_to_5_days",
    deadlock: "often",
    route: "yes_formal",
    parallel: "parallel_dependent",
    hidden: "no",
    sequence: "major_differences",
    deviation: "sometimes",
    deliveryFailure: "yes",
    transformationFailure: "often",
    discretion: "low",
    workaround: "sometimes",
    workaroundTypes: ["side_channel", "manual_correction"],
    rework: "often",
    missingInfo: "sometimes",
    informalRule: "yes",
    sacrifice: "often",
    wear: "high",
    effort: "unsustainable",
    visibility: "partially_visible",
    trenchPhrase: "El plan ya viola la secuencia: manufactura empieza sin materiales.",
    causalOrder:
      "Primero aparece fecha imposible y dependencia no satisfecha; luego aparecen pagos urgentes y replanificacion como respuesta.",
  },
  B: {
    roleNumber: 2,
    expectedRootCanonical: "N04",
    expectedRootLabel: "N04 Violacion Causal",
    hypothesis:
      "Workaround fuerte como consecuencia de presion para despachar objeto no conforme.",
    nominal: 40,
    real: 32,
    wait: "less_than_1h",
    deadlock: "sometimes",
    route: "yes_informal",
    parallel: "parallel_dependent",
    hidden: "yes",
    sequence: "major_differences",
    deviation: "often",
    deliveryFailure: "yes",
    transformationFailure: "often",
    discretion: "low",
    workaround: "sometimes",
    workaroundTypes: ["informal_approval", "manual_correction"],
    rework: "often",
    missingInfo: "often",
    informalRule: "yes",
    sacrifice: "often",
    wear: "high",
    effort: "high",
    visibility: "hidden",
    trenchPhrase: "El producto no esta conforme, pero lo quieren despachar.",
    causalOrder:
      "Primero calidad detecta objeto no conforme; luego aparece simplificacion de reporte como respuesta a presion.",
  },
  C: {
    roleNumber: 3,
    expectedRootCanonical: "N03",
    expectedRootLabel: "N03 Anarquia Operacional",
    hypothesis:
      "Workaround como arquitectura normal permanente por desacople MoC-PF.",
    nominal: 100,
    real: 60,
    wait: "1_to_4h",
    deadlock: "sometimes",
    route: "both",
    parallel: "parallel_dependent",
    hidden: "yes",
    sequence: "major_differences",
    deviation: "almost_always",
    deliveryFailure: "yes",
    transformationFailure: "often",
    discretion: "medium",
    workaround: "often",
    workaroundTypes: ["manual_tracking", "side_channel", "personal_memory"],
    rework: "often",
    missingInfo: "often",
    informalRule: "yes",
    sacrifice: "often",
    wear: "high",
    effort: "unsustainable",
    visibility: "hidden",
    trenchPhrase: "El Excel es la verdad; el ERP solo se actualiza para que cuadre.",
    causalOrder:
      "Primero falla el sistema oficial como ontologia; el workaround no es excepcion sino arquitectura normal.",
  },
};

const normalise = (value) => value.replace(/\s+/g, " ").trim();

const blockIdFor = (questionCode) => {
  if (questionCode.startsWith("0.5")) return "block_0_5";
  return `block_${questionCode.split(".")[0]}`;
};

const answer = (activityId, questionCode, values) => ({
  activityId,
  questionCode,
  blockId: blockIdFor(questionCode),
  selectedValue: values.selectedValue ?? null,
  selectedValues: values.selectedValues ?? null,
  freeText: values.freeText ?? null,
  answerJson: values.answerJson ?? null,
  instrumentVersion: "CAPA1_V2_1",
  answerNature: values.answerNature ?? "captured",
});

const splitCases = (text) => {
  const matches = [...text.matchAll(/CASO\s+([ABC])\s+-\s+([^\n]+)/g)];
  return matches.map((match, index) => ({
    key: match[1],
    heading: normalise(match[2]),
    body: text.slice(match.index, matches[index + 1]?.index ?? text.indexOf("MATRIZ DE DISTINCIÓN")),
  }));
};

const extractRole = (body, fallback) => {
  const match = body.match(/Rol\s*\n([^\n]+)/);
  return normalise(match?.[1] ?? fallback);
};

const parseActivities = (caseKey, body) => {
  const matches = [...body.matchAll(/Actividad\s+(\d+):\s+([^\n]+)/g)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end =
      matches[index + 1]?.index ??
      body.indexOf("Qué causa el workaround") ??
      body.length;
    const title = normalise(match[2]);
    const what = normalise(body.slice(start, end));
    return {
      id: `surgical_case${caseKey}_activity${match[1]}`,
      activityNumber: Number(match[1]),
      title,
      narrativeAnchor: title,
      origin: "usuario_redactada",
      accepted: true,
      critical: true,
      interconnectionScore: 4,
      what,
      frequency: "Recurrente dentro del caso quirurgico",
      coordination: "Segun el orden causal descrito en el caso",
      friction: what,
    };
  });
};

const textByMarker = (body, marker, nextMarkers) => {
  const start = body.indexOf(marker);
  if (start < 0) return "";
  const rest = body.slice(start + marker.length);
  const endCandidates = nextMarkers
    .map((next) => rest.indexOf(next))
    .filter((index) => index >= 0);
  const end = endCandidates.length ? Math.min(...endCandidates) : rest.length;
  return normalise(rest.slice(0, end));
};

const buildAnswers = (activity, roleName, profile, caseBody) => {
  const cause = textByMarker(caseBody, "Qué causa el workaround", [
    "Qué pasa antes de que aparezca el workaround",
  ]);
  const before = textByMarker(caseBody, "Qué pasa antes de que aparezca el workaround", [
    "Qué dependencia/condición no estaba satisfecha",
  ]);
  const dependency = textByMarker(caseBody, "Qué dependencia/condición no estaba satisfecha", [
    "Qué workaround se usa",
  ]);
  const workaround = textByMarker(caseBody, "Qué workaround se usa", [
    "Por qué el workaround",
  ]);
  const notRoot = textByMarker(caseBody, "Por qué el workaround", [
    "Prueba de que",
    "Nodo esperado",
  ]);
  const full = [activity.what, cause, before, dependency, workaround, notRoot, profile.causalOrder]
    .filter(Boolean)
    .join(" ");

  return [
    answer(activity.id, "0.1", { freeText: `${roleName} - ${activity.title}` }),
    answer(activity.id, "0.2", { selectedValue: "daily" }),
    answer(activity.id, "0.3", { freeText: full }),
    answer(activity.id, "0.4", { freeText: roleName }),
    answer(activity.id, "0.5", { selectedValue: "normal_recurrent" }),
    answer(activity.id, "0.5.1", { freeText: "Cliente final, operacion y direccion" }),
    answer(activity.id, "0.5.1a", { freeText: "Operacion, calidad, costos y personas que absorben la friccion" }),
    answer(activity.id, "0.5.1_rel", { selectedValue: "different" }),
    answer(activity.id, "1.1", { freeText: "Orden, presion, fecha, inspeccion, dato incompleto o dependencia no satisfecha." }),
    answer(activity.id, "1.2", { selectedValue: "external_request" }),
    answer(activity.id, "1.3", { selectedValue: "medium" }),
    answer(activity.id, "1.4", { selectedValue: "daily" }),
    answer(activity.id, "1.5", { selectedValue: "mixed" }),
    answer(activity.id, "1.6", { freeText: dependency || "Condiciones previas, informacion, materiales, conformidad o capacidad real." }),
    answer(activity.id, "1.7", { freeText: before || "Aparece workaround como respuesta para sostener el flujo." }),
    answer(activity.id, "2.1", { selectedValues: ["object", "action"] }),
    answer(activity.id, "2.1a", { freeText: "Orden, material, producto, inventario, reporte o atributo operativo." }),
    answer(activity.id, "2.1c", { freeText: "Decision, validacion, liberacion, compra, planificacion o coordinacion." }),
    answer(activity.id, "2.3", { selectedValue: "high" }),
    answer(activity.id, "2.5", { freeText: "Antes existe una condicion causal u ontologica no satisfecha." }),
    answer(activity.id, "2.6", { freeText: "Debe quedar listo, conforme, coordinado, definido o liberado." }),
    answer(activity.id, "2.7", { selectedValue: "often" }),
    answer(activity.id, "2.9", { selectedValue: profile.transformationFailure }),
    answer(activity.id, "2.10", { freeText: "La falla genera workaround, retrabajo, urgencias, reportes distorsionados o sistemas paralelos." }),
    answer(activity.id, "3.1", { freeText: "Salida operativa: orden, material, producto, decision, reporte o liberacion." }),
    answer(activity.id, "3.2", { freeText: "Area siguiente, produccion, calidad, compras, despacho o direccion." }),
    answer(activity.id, "3.4", { freeText: "El flujo depende de que la condicion previa se cumpla realmente." }),
    answer(activity.id, "3.5", { freeText: "Si llega mal, tarde o incompleta se viola causalidad, calidad u ontologia." }),
    answer(activity.id, "3.6", { freeText: "El siguiente paso intenta continuar aunque las condiciones esten rotas." }),
    answer(activity.id, "3.8", { freeText: "Debe respetar orden causal, conformidad del objeto o definicion real de atributos." }),
    answer(activity.id, "3.9", { freeText: "Sistema formal, Excel, llamada, reporte, autorizacion o canal alterno." }),
    answer(activity.id, "3.11", { selectedValue: profile.deliveryFailure }),
    answer(activity.id, "4.1", { freeText: "Depende de ventas, compras, materiales, conformidad, ERP, inventario o autoridad de calidad." }),
    answer(activity.id, "4.2", { freeText: "Dependen manufactura, despacho, cliente, compras, calidad o direccion." }),
    answer(activity.id, "4.3", { selectedValue: profile.wait }),
    answer(activity.id, "4.4", { selectedValue: "yes", freeText: "Fechas prometidas, lead times, despacho, inspeccion o auditoria." }),
    answer(activity.id, "4.5", { selectedValue: profile.deadlock }),
    answer(activity.id, "4.5b", { freeText: "Se resuelve con workaround, presion, replanificacion o distorsion de reporte." }),
    answer(activity.id, "4.6", { selectedValue: profile.rework === "often" ? "often" : "sometimes" }),
    answer(activity.id, "4.6b", { freeText: "Condicion previa no satisfecha, objeto no conforme u ontologia incompleta." }),
    answer(activity.id, "4.7", { selectedValue: profile.route }),
    answer(activity.id, "4.7b", { freeText: workaround || "Se decide por urgencia para sostener el flujo." }),
    answer(activity.id, "4.8", { selectedValue: profile.parallel }),
    answer(activity.id, "4.9", { selectedValue: profile.hidden }),
    answer(activity.id, "4.9b", { freeText: "Trabajo paralelo, correccion, llamada, Excel, reporte simplificado o decision no formal." }),
    answer(activity.id, "4.10", { selectedValue: profile.sequence }),
    answer(activity.id, "4.10b", { freeText: cause || "La secuencia real difiere de la oficial por ruptura causal u ontologica." }),
    answer(activity.id, "4.11", { freeText: "Se detiene manufactura, despacho, compra, liberacion o coordinacion real." }),
    answer(activity.id, "4.12", { freeText: "Lead time, conformidad del objeto, definicion de atributos o sistema oficial." }),
    answer(activity.id, "4.13", { selectedValue: profile.deviation }),
    answer(activity.id, "5.0", { selectedValue: "mixed" }),
    answer(activity.id, "5.1", { freeText: String(profile.nominal) }),
    answer(activity.id, "5.2", { freeText: String(profile.real) }),
    answer(activity.id, "5.8", { selectedValue: profile.discretion }),
    answer(activity.id, "5.9", { freeText: "Fechas, OLC, calidad, atributos, sistema formal, presupuesto o autoridad." }),
    answer(activity.id, "5.10", { freeText: "Se sacrifica tiempo, margen, calidad, trazabilidad o estabilidad." }),
    answer(activity.id, "5.11", { freeText: "Se absorbe variedad fuera de la capacidad normal." }),
    answer(activity.id, "5.12", { freeText: workaround || "Se usa salida de emergencia para sostener el flujo." }),
    answer(activity.id, "5.13", { selectedValue: profile.effort === "unsustainable" ? "already_deteriorating" : "short_term" }),
    answer(activity.id, "5.14", { freeText: "Retrabajo, urgencias, defectos, sobrecostos, sistemas paralelos o versiones contradictorias." }),
    answer(activity.id, "6.1", { selectedValue: profile.workaround }),
    answer(activity.id, "6.2", { selectedValues: profile.workaroundTypes }),
    answer(activity.id, "6.2a", { freeText: workaround || "Workaround documentado en el caso." }),
    answer(activity.id, "6.2b", { freeText: roleName }),
    answer(activity.id, "6.2c", { selectedValue: profile.visibility }),
    answer(activity.id, "6.3", { selectedValue: profile.rework }),
    answer(activity.id, "6.3a", { freeText: "Se rehace, comprime, simplifica, corrige o replanifica para sostener el flujo." }),
    answer(activity.id, "6.4", { selectedValue: profile.missingInfo }),
    answer(activity.id, "6.4a", { freeText: "Falta condicion previa, conformidad o definicion completa del objeto." }),
    answer(activity.id, "6.4b", { freeText: "Se reemplaza con llamada, Excel, negociacion, urgencia o simplificacion." }),
    answer(activity.id, "6.5", { selectedValue: profile.informalRule, freeText: "Si el sistema no alcanza, sostenlo por fuera y despues regularizamos." }),
    answer(activity.id, "6.6", { selectedValue: profile.sacrifice }),
    answer(activity.id, "6.6a", { freeText: "Tiempo, calidad, margen, descanso, trazabilidad o reputacion." }),
    answer(activity.id, "6.6b", { freeText: roleName }),
    answer(activity.id, "6.7", { selectedValue: profile.wear }),
    answer(activity.id, "6.7a", { freeText: "Cansancio, urgencia, frustracion, defectos, sobrecostos o perdida de confianza." }),
    answer(activity.id, "6.8", { selectedValue: profile.effort }),
    answer(activity.id, "6.9", { freeText: profile.trenchPhrase }),
    answer(activity.id, "6.9a", { selectedValues: ["fatigue", "frustration", "alert"] }),
    answer(activity.id, "6.9b", { freeText: roleName }),
    answer(activity.id, "6.9c", { freeText: profile.causalOrder }),
    answer(activity.id, "6.10", { freeText: `${profile.causalOrder} ${workaround}` }),
    answer(activity.id, "6.10a", { selectedValue: profile.workaround === "often" ? "almost_always" : "sometimes" }),
    answer(activity.id, "6.10b", { freeText: "El flujo se detiene, se despacha mal, o la operacion queda sin verdad operativa." }),
    answer(activity.id, "6.11", { selectedValue: profile.visibility }),
  ];
};

const main = async () => {
  const text = await fs.readFile(sourceTextPath, "utf8");
  const cases = splitCases(text);
  if (cases.length !== 3) throw new Error(`Expected 3 cases, found ${cases.length}`);

  const sceneAnswersByActivityId = {};
  const roleSessions = cases.map((item) => {
    const profile = profiles[item.key];
    const roleName = extractRole(item.body, `Caso ${item.key}`);
    const activities = parseActivities(item.key, item.body);
    for (const activity of activities) {
      sceneAnswersByActivityId[activity.id] = buildAnswers(
        activity,
        roleName,
        profile,
        item.body,
      );
    }
    return {
      roleNumber: profile.roleNumber,
      roleHeader: `CASO ${item.key}: ${profile.expectedRootLabel}`,
      roleName,
      vsmRole: "Caso quirurgico Capa 2",
      expectedRootCanonical: profile.expectedRootCanonical,
      expectedRootLabel: profile.expectedRootLabel,
      testHypothesis: profile.hypothesis,
      sourceHeading: item.heading,
      activities,
    };
  });

  const activityCount = roleSessions.reduce((total, role) => total + role.activities.length, 0);
  const answerCount = Object.values(sceneAnswersByActivityId).reduce((total, answers) => total + answers.length, 0);
  const output = {
    metadata: {
      caseName: "3 casos quirurgicos - N03 raiz vs workaround consecuencia",
      sourceDocument: "3_Casos_Quirurgicos_N03_Raiz_vs_Workaround_como_Consecuencia.docx",
      reconstructionMode: "reconstructed_from_surgical_case_document",
      activityCount,
      roleCount: roleSessions.length,
      answerCount,
      sessionStrategy: "one_operational_session_per_surgical_case_plus_one_global_admin_session",
      usesAllActivitiesAsMain: true,
      expectedRootCodesUseCanonicalMmabp: true,
    },
    roleSessions,
    sceneAnswersByActivityId,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`Fixture written: ${outputPath}`);
  console.log(`Cases: ${roleSessions.length}, activities: ${activityCount}, answers: ${answerCount}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
