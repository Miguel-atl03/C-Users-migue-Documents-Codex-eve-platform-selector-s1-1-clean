import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const sourceTextPath =
  process.argv[2] ??
  path.join(repoRoot, "..", "..", "..", "2026-05-12", "quiero-que-realices-una-tarea-de", "5-casos-prueba-eve-extraido.txt");
const outputPath =
  process.argv[3] ??
  path.join(repoRoot, "fixtures", "controlled-5-cases-session-input.json");

const blockIdFor = (questionCode) => {
  if (questionCode.startsWith("0.5")) return "block_0_5";
  const block = questionCode.split(".")[0];
  return `block_${block}`;
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

const normaliseSpaces = (text) => text.replace(/\s+/g, " ").trim();

const splitCases = (text) => {
  const matches = [...text.matchAll(/CASO\s+(\d+)\s+-\s+([^\n]+)/g)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? text.indexOf("RESUMEN DE LOS 5 CASOS");
    return {
      number: Number(match[1]),
      heading: normaliseSpaces(match[2]),
      body: text.slice(start, end > start ? end : undefined),
    };
  });
};

const afterLabel = (body, label) => {
  const index = body.indexOf(label);
  if (index < 0) return "";
  const rest = body.slice(index + label.length);
  const nextLabel = rest.search(/\n[A-ZÁÉÍÓÚÑ][^\n]{2,80}\n/);
  return normaliseSpaces(nextLabel >= 0 ? rest.slice(0, nextLabel) : rest);
};

const parseActivities = (caseNumber, body) => {
  const activityMatches = [...body.matchAll(/Actividad\s+(\d+):\s+([^\n]+)/g)];
  return activityMatches.map((match, index) => {
    const start = match.index + match[0].length;
    const end =
      activityMatches[index + 1]?.index ??
      body.indexOf("Qué tipo de patrón quieres probar") ??
      body.indexOf("QuÃ© tipo de patrÃ³n quieres probar") ??
      body.length;
    return {
      id: `controlled_case${caseNumber}_activity${match[1]}`,
      activityNumber: Number(match[1]),
      title: normaliseSpaces(match[2]),
      narrativeAnchor: normaliseSpaces(match[2]),
      origin: "usuario_redactada",
      accepted: true,
      critical: true,
      interconnectionScore: 4,
      what: normaliseSpaces(body.slice(start, end)),
      frequency: "Recurrente dentro del rol descrito",
      coordination: "Segun contexto del caso de prueba",
      friction: normaliseSpaces(body.slice(start, end)),
    };
  });
};

const caseProfiles = {
  1: {
    expectedRootCanonical: "N03",
    expectedRootLabel: "N03 Anarquia Operacional",
    testHypothesis: "Sistema oficial no soporta la operacion real; aparecen sistemas paralelos, Excel, llamadas y reglas informales.",
    nominal: 100,
    real: 65,
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
    rework: "often",
    missingInfo: "often",
    informalRule: "yes",
    sacrifice: "often",
    wear: "high",
    effort: "unsustainable",
    visibility: "hidden",
    trenchPhrase: "El Excel es la verdad; el ERP es decoracion.",
  },
  2: {
    expectedRootCanonical: "N06",
    expectedRootLabel: "N06 Tortura Causal",
    testHypothesis: "Secuencias ilogicas y dependencias temporales fuerzan transiciones antes de que sus condiciones existan.",
    nominal: 100,
    real: 60,
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
    rework: "often",
    missingInfo: "sometimes",
    informalRule: "yes",
    sacrifice: "often",
    wear: "high",
    effort: "unsustainable",
    visibility: "partially_visible",
    trenchPhrase: "El plan ya nacio tarde, pero aun asi hay que cumplirlo.",
  },
  3: {
    expectedRootCanonical: "N04",
    expectedRootLabel: "N04 Violacion Causal",
    testHypothesis: "La presion por velocidad fuerza transiciones que comprometen calidad e integridad del objeto.",
    nominal: 50,
    real: 100,
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
    rework: "often",
    missingInfo: "often",
    informalRule: "yes",
    sacrifice: "often",
    wear: "high",
    effort: "high",
    visibility: "hidden",
    trenchPhrase: "Si el cliente esta esperando, libera aunque duela.",
  },
  4: {
    expectedRootCanonical: "N10",
    expectedRootLabel: "N10 Promesa Imposible",
    testHypothesis: "Metas PM exigen un PF que viola capacidad y condiciones OLC.",
    nominal: 1200,
    real: 800,
    wait: "none",
    deadlock: "no",
    route: "no",
    parallel: "parallel_independent",
    hidden: "no",
    sequence: "same",
    deviation: "sometimes",
    deliveryFailure: "no",
    transformationFailure: "sometimes",
    discretion: "none",
    workaround: "sometimes",
    rework: "sometimes",
    missingInfo: "sometimes",
    informalRule: "yes",
    sacrifice: "often",
    wear: "high",
    effort: "unsustainable",
    visibility: "hidden",
    trenchPhrase: "Las metas no se negocian, se cumplen.",
  },
  5: {
    expectedRootCanonical: null,
    expectedRootLabel: "AMBIGUO",
    testHypothesis: "Caso ambiguo con sintomas de N03, N04, N06 y N10; deberia bajar confianza o pedir revision experta.",
    nominal: 15,
    real: 10,
    wait: "2_to_5_days",
    deadlock: "sometimes",
    route: "both",
    parallel: "parallel_dependent",
    hidden: "yes",
    sequence: "major_differences",
    deviation: "often",
    deliveryFailure: "yes",
    transformationFailure: "sometimes",
    discretion: "low",
    workaround: "often",
    rework: "sometimes",
    missingInfo: "often",
    informalRule: "yes",
    sacrifice: "sometimes",
    wear: "medium",
    effort: "high",
    visibility: "partially_visible",
    trenchPhrase: "Cumplimos, pero pagando urgencias y tapando huecos.",
  },
};

const buildAnswers = (activity, roleName, profile) => {
  const text = activity.what;
  const base = [
    answer(activity.id, "0.1", { freeText: `${roleName} - ${activity.title}` }),
    answer(activity.id, "0.2", { selectedValue: "daily" }),
    answer(activity.id, "0.3", { freeText: text }),
    answer(activity.id, "0.4", { freeText: roleName }),
    answer(activity.id, "0.5", { selectedValue: "normal_recurrent" }),
    answer(activity.id, "0.5.1", { freeText: "Cliente final, produccion y direccion" }),
    answer(activity.id, "0.5.1a", { freeText: "Operacion, calidad, costos y personas que absorben la friccion" }),
    answer(activity.id, "0.5.1_rel", { selectedValue: "different" }),
    answer(activity.id, "1.1", { freeText: "Orden, urgencia, reporte, presion operativa o cambio de prioridad." }),
    answer(activity.id, "1.2", { selectedValue: "external_request" }),
    answer(activity.id, "1.3", { selectedValue: "medium" }),
    answer(activity.id, "1.4", { selectedValue: "daily" }),
    answer(activity.id, "1.5", { selectedValue: "mixed" }),
    answer(activity.id, "1.6", { freeText: "Materiales, informacion, capacidad, aprobaciones y condiciones previas listas." }),
    answer(activity.id, "1.7", { freeText: "Se retrasa, se improvisa, se cambia de prioridad o se usa una ruta paralela." }),
    answer(activity.id, "2.1", { selectedValues: ["object", "action"] }),
    answer(activity.id, "2.1a", { freeText: "Orden, material, producto, dato o reporte operativo." }),
    answer(activity.id, "2.1c", { freeText: "Decision, validacion, liberacion, compra, planificacion o coordinacion." }),
    answer(activity.id, "2.3", { selectedValue: "high" }),
    answer(activity.id, "2.5", { freeText: "Antes hay datos incompletos, condiciones no satisfechas o presion." }),
    answer(activity.id, "2.6", { freeText: "Debe quedar listo, validado, producido, liberado o coordinado." }),
    answer(activity.id, "2.7", { selectedValue: "often" }),
    answer(activity.id, "2.9", { selectedValue: profile.transformationFailure }),
    answer(activity.id, "2.10", { freeText: "La falla genera retrabajo, urgencias, datos divergentes o decisiones informales." }),
    answer(activity.id, "3.1", { freeText: "Salida operativa de la escena: orden, material, producto, decision o reporte." }),
    answer(activity.id, "3.2", { freeText: "Area siguiente, cliente interno, produccion, compras, calidad o direccion." }),
    answer(activity.id, "3.4", { freeText: "La continuidad del flujo depende de que esta salida llegue bien y a tiempo." }),
    answer(activity.id, "3.5", { freeText: "Si llega mal, tarde o incompleta se detiene el flujo o se compromete calidad/costo." }),
    answer(activity.id, "3.6", { freeText: "El siguiente paso intenta continuar produccion, compra, despacho, inspeccion o reporte." }),
    answer(activity.id, "3.8", { freeText: "Debe coincidir con especificaciones, capacidad real, datos confiables y reglas de calidad." }),
    answer(activity.id, "3.9", { freeText: profile.route === "no" ? "Sistema formal y junta de seguimiento" : "Excel, correo, llamada, WhatsApp, sistema formal y acuerdos manuales." }),
    answer(activity.id, "3.11", { selectedValue: profile.deliveryFailure }),
    answer(activity.id, "4.1", { freeText: "Depende de ventas, compras, materiales, maquinas, ERP, calidad, proveedores o direccion." }),
    answer(activity.id, "4.2", { freeText: "Dependen produccion, calidad, despacho, clientes, proveedores o direccion." }),
    answer(activity.id, "4.3", { selectedValue: profile.wait }),
    answer(activity.id, "4.4", { selectedValue: "yes", freeText: "Fechas prometidas, cierres diarios, entregas, auditorias o compromisos con cliente." }),
    answer(activity.id, "4.5", { selectedValue: profile.deadlock }),
    answer(activity.id, "4.5b", { freeText: "Se resuelve con negociacion, urgencias, replanificacion o sacrificio." }),
    answer(activity.id, "4.6", { selectedValue: profile.rework === "often" ? "often" : "sometimes" }),
    answer(activity.id, "4.6b", { freeText: "Datos incompletos, materiales defectuosos, cambios de prioridad o capacidad insuficiente." }),
    answer(activity.id, "4.7", { selectedValue: profile.route }),
    answer(activity.id, "4.7b", { freeText: "La decide quien sostiene la escena para que no se detenga el flujo." }),
    answer(activity.id, "4.8", { selectedValue: profile.parallel }),
    answer(activity.id, "4.9", { selectedValue: profile.hidden }),
    answer(activity.id, "4.9b", { freeText: "Correcciones, llamadas, hojas paralelas, negociaciones o aceptaciones no visibles." }),
    answer(activity.id, "4.10", { selectedValue: profile.sequence }),
    answer(activity.id, "4.10b", { freeText: "Lo real incorpora atajos, presion, datos paralelos o pasos omitidos." }),
    answer(activity.id, "4.11", { freeText: "Se detiene produccion, compra, inspeccion, despacho o toma de decision." }),
    answer(activity.id, "4.12", { freeText: "Capacidad, informacion, materiales, aprobaciones, calidad o proveedor." }),
    answer(activity.id, "4.13", { selectedValue: profile.deviation }),
    answer(activity.id, "5.0", { selectedValue: "mixed" }),
    answer(activity.id, "5.1", { freeText: String(profile.nominal) }),
    answer(activity.id, "5.2", { freeText: String(profile.real) }),
    answer(activity.id, "5.8", { selectedValue: profile.discretion }),
    answer(activity.id, "5.9", { freeText: "Metas, fechas, capacidad, calidad, presupuesto, disponibilidad y reglas formales." }),
    answer(activity.id, "5.10", { freeText: "Se sacrifica calidad, margen, descanso, trazabilidad o estabilidad del flujo." }),
    answer(activity.id, "5.11", { freeText: "Se absorben pendientes y variaciones fuera de la capacidad normal." }),
    answer(activity.id, "5.12", { freeText: "Urgencias, Excel paralelo, llamadas, horas extra o negociacion informal." }),
    answer(activity.id, "5.13", { selectedValue: profile.effort === "unsustainable" ? "already_deteriorating" : "short_term" }),
    answer(activity.id, "5.14", { freeText: "Retrabajo, retrasos, sobrecostos, defectos, desgaste y versiones contradictorias." }),
    answer(activity.id, "6.1", { selectedValue: profile.workaround }),
    answer(activity.id, "6.2", { selectedValues: ["manual_tracking", "side_channel", "manual_correction"] }),
    answer(activity.id, "6.2a", { freeText: "Se usa registro paralelo, llamada directa, negociacion o correccion manual." }),
    answer(activity.id, "6.2b", { freeText: roleName }),
    answer(activity.id, "6.2c", { selectedValue: profile.visibility }),
    answer(activity.id, "6.3", { selectedValue: profile.rework }),
    answer(activity.id, "6.3a", { freeText: "Se rehacen reportes, produccion, inspecciones, compras o conciliaciones." }),
    answer(activity.id, "6.4", { selectedValue: profile.missingInfo }),
    answer(activity.id, "6.4a", { freeText: "Faltan datos reales, capacidad, inventario, defecto, costo o condicion del objeto." }),
    answer(activity.id, "6.4b", { freeText: "Se reemplaza con memoria, Excel, llamada, inspeccion rapida o negociacion." }),
    answer(activity.id, "6.5", { selectedValue: profile.informalRule, freeText: "Si es urgente, resuelvelo por fuera y despues regularizamos." }),
    answer(activity.id, "6.6", { selectedValue: profile.sacrifice }),
    answer(activity.id, "6.6a", { freeText: "Se sacrifica descanso, calidad, margen, trazabilidad o estabilidad." }),
    answer(activity.id, "6.6b", { freeText: roleName }),
    answer(activity.id, "6.7", { selectedValue: profile.wear }),
    answer(activity.id, "6.7a", { freeText: "Cansancio, frustracion, conflictos, urgencias y perdida de confianza en el sistema." }),
    answer(activity.id, "6.8", { selectedValue: profile.effort }),
    answer(activity.id, "6.9", { freeText: profile.trenchPhrase }),
    answer(activity.id, "6.9a", { selectedValues: ["fatigue", "frustration", "alert"] }),
    answer(activity.id, "6.9b", { freeText: roleName }),
    answer(activity.id, "6.9c", { freeText: "Cuando la realidad no coincide con el sistema o la meta prometida." }),
    answer(activity.id, "6.10", { freeText: "Aparecen excepciones, urgencias, versiones paralelas y compensaciones humanas." }),
    answer(activity.id, "6.10a", { selectedValue: profile.deviation === "almost_always" ? "almost_always" : "often" }),
    answer(activity.id, "6.10b", { freeText: "El flujo se detendria o llegaria al cliente con retrasos, defectos o costo oculto." }),
    answer(activity.id, "6.11", { selectedValue: profile.visibility }),
  ];

  return base;
};

const main = async () => {
  const text = await fs.readFile(sourceTextPath, "utf8");
  const cases = splitCases(text);

  if (cases.length !== 5) {
    throw new Error(`Expected 5 cases, found ${cases.length}`);
  }

  const sceneAnswersByActivityId = {};
  const roleSessions = cases.map((item) => {
    const roleName = afterLabel(item.body, "Rol del usuario").split("Contexto breve")[0] || `Caso ${item.number}`;
    const cleanRoleName = normaliseSpaces(roleName.replace(/Contexto breve.*/, ""));
    const profile = caseProfiles[item.number];
    const activities = parseActivities(item.number, item.body);

    for (const activity of activities) {
      sceneAnswersByActivityId[activity.id] = buildAnswers(
        activity,
        cleanRoleName,
        profile,
      );
    }

    return {
      roleNumber: item.number,
      roleHeader: `CASO ${item.number}: ${profile.expectedRootLabel}`,
      roleName: cleanRoleName,
      vsmRole: "Caso controlado Capa 2",
      expectedRootCanonical: profile.expectedRootCanonical,
      expectedRootLabel: profile.expectedRootLabel,
      testHypothesis: profile.testHypothesis,
      sourceHeading: item.heading,
      activities,
    };
  });

  const activityCount = roleSessions.reduce(
    (total, role) => total + role.activities.length,
    0,
  );
  const answerCount = Object.values(sceneAnswersByActivityId).reduce(
    (total, answers) => total + answers.length,
    0,
  );
  const output = {
    metadata: {
      caseName: "5 casos controlados - Plataforma EVE",
      sourceDocument: "5_Casos_de_Prueba_-_Plataforma_EVE™.docx",
      reconstructionMode: "reconstructed_from_controlled_case_document",
      activityCount,
      roleCount: roleSessions.length,
      answerCount,
      sessionStrategy: "one_operational_session_per_controlled_case_plus_one_global_admin_session",
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
