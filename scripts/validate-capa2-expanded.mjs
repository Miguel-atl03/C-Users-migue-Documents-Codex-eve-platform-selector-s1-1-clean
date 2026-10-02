import fs from "node:fs";
import path from "node:path";

const FIXTURES_DIR = path.resolve("fixtures");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const latestFile = (pattern) => {
  const files = fs
    .readdirSync(FIXTURES_DIR)
    .filter((name) => pattern.test(name))
    .map((name) => ({
      name,
      file: path.join(FIXTURES_DIR, name),
      mtime: fs.statSync(path.join(FIXTURES_DIR, name)).mtimeMs,
    }))
    .sort((left, right) => right.mtime - left.mtime);

  if (!files.length) throw new Error(`No file found for ${pattern}`);
  return files[0].file;
};

const calibrationReports = process.argv.slice(2).filter((item) => item.endsWith(".json"));
const mutationReport = calibrationReports.find((file) =>
  /boundary-mutation-report/.test(path.basename(file)),
);
const sessionReports = calibrationReports.filter((file) =>
  /calibration-report/.test(path.basename(file)),
);

if (!sessionReports.length) {
  sessionReports.push(latestFile(/^capa2-calibration-report-\d+\.json$/));
}

const resolvedSessionReports = sessionReports.map((file) => path.resolve(file));
const resolvedMutationReport = mutationReport
  ? path.resolve(mutationReport)
  : latestFile(/^capa2-boundary-mutation-report-\d+\.json$/);

const nodeFromActualRoot = (label) => String(label ?? "").match(/N\d{2}/)?.[0] ?? null;

const structuralSignalsFromBundles = (bundles = []) => {
  const rows = [];
  for (const bundle of bundles) {
    for (const item of [...(bundle.supports ?? []), ...(bundle.weakens ?? [])]) {
      const variable = String(item.canonicalVariable ?? "");
      if (!variable.startsWith("structural_signal.")) continue;
      rows.push({
        nodeId: bundle.nodeId,
        sceneName: bundle.sceneName,
        signal: variable.replace("structural_signal.", ""),
        family: item.value?.signal_family ?? null,
        role: item.value?.causal_role ?? null,
        weight: item.weight ?? null,
        reason: item.reason ?? null,
      });
    }
  }
  return rows;
};

const signalSummary = (signals) => {
  const counts = new Map();
  for (const signal of signals) {
    const key = `${signal.signal}|${signal.family ?? "unknown"}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [signal, family] = key.split("|");
      return { signal, family, count };
    })
    .sort((left, right) => right.count - left.count || left.signal.localeCompare(right.signal));
};

const sessionRows = [];
for (const reportFile of resolvedSessionReports) {
  const report = readJson(reportFile);
  for (const session of report.sessions ?? []) {
    const actualRootCode =
      session.actualRootCode ?? nodeFromActualRoot(session.actualRoot);
    const signals = structuralSignalsFromBundles(session.evidenceBundles ?? []);
    const dominantBundle = [...(session.topEvidenceBundles ?? [])].sort(
      (left, right) => (right.net ?? 0) - (left.net ?? 0),
    )[0];

    sessionRows.push({
      sourceReport: path.relative(process.cwd(), reportFile),
      roleNumber: session.roleNumber,
      roleName: session.roleName,
      sessionId: session.sessionId,
      expectedRootCanonical: session.expectedRootCanonical ?? null,
      actualRootCode,
      actualRoot: session.actualRoot,
      status: session.expectedVsActual,
      confidence: session.actualConfidence,
      needsReentry: session.needsReentry,
      needsExpertReview: session.needsExpertReview,
      ranking: session.engineRanking ?? session.recomputedRanking ?? [],
      keyStructuralSignals: signalSummary(signals).slice(0, 8),
      dominantBundle: dominantBundle
        ? {
            nodeId: dominantBundle.nodeId,
            ruleId: dominantBundle.ruleId,
            sceneName: dominantBundle.sceneName,
            supportScore: dominantBundle.supportScore,
            weakenScore: dominantBundle.weakenScore,
            net: dominantBundle.net,
            supports: dominantBundle.supports?.slice(0, 5) ?? [],
            weakens: dominantBundle.weakens?.slice(0, 3) ?? [],
          }
        : null,
      ablationRootChanges: (session.ablations ?? [])
        .filter((item) => item.rootChangedAfterRemoval || item.rootChangedAfterHalfWeight)
        .map((item) => ({
          groupName: item.groupName,
          rootAfterRemoval: item.rootAfterRemoval?.nodeId ?? null,
          rootAfterHalfWeight: item.rootAfterHalfWeight?.nodeId ?? null,
        })),
    });
  }
}

const knownSessions = sessionRows.filter((row) => row.expectedRootCanonical);
const matchedKnown = knownSessions.filter((row) => row.expectedRootCanonical === row.actualRootCode);
const highConfidenceDivergences = knownSessions.filter(
  (row) => row.expectedRootCanonical !== row.actualRootCode && row.confidence === "high",
);
const rootCounts = sessionRows.reduce((counts, row) => {
  counts[row.actualRootCode] = (counts[row.actualRootCode] ?? 0) + 1;
  return counts;
}, {});
const dominantRoot = Object.entries(rootCounts).sort((left, right) => right[1] - left[1])[0] ?? null;

const mutation = readJson(resolvedMutationReport);
const mutationById = Object.fromEntries((mutation.mutations ?? []).map((item) => [item.id, item]));
const mutationChecks = [
  {
    id: "baseline_case3_is_n03",
    passed: mutation.baseline?.root?.nodeId === "N03",
    detail: mutation.baseline?.root?.nodeId ?? null,
  },
  {
    id: "reinforce_n03_stays_n03",
    passed: mutationById.reinforce_n03_stable_architecture?.root?.nodeId === "N03",
    detail: mutationById.reinforce_n03_stable_architecture?.root?.nodeId ?? null,
  },
  {
    id: "reinforce_n06_switches_n06",
    passed: mutationById.reinforce_n06_temporal_break?.root?.nodeId === "N06",
    detail: mutationById.reinforce_n06_temporal_break?.root?.nodeId ?? null,
  },
  {
    id: "remove_temporal_break_stays_n03",
    passed: mutationById.remove_temporal_break?.root?.nodeId === "N03",
    detail: mutationById.remove_temporal_break?.root?.nodeId ?? null,
  },
];

const accuracy = knownSessions.length ? matchedKnown.length / knownSessions.length : 0;
const dominantShare = dominantRoot ? dominantRoot[1] / sessionRows.length : 0;
const gateChecks = [
  {
    id: "known_case_accuracy_at_least_75_percent",
    passed: accuracy >= 0.75,
    value: Number(accuracy.toFixed(3)),
    threshold: 0.75,
  },
  {
    id: "mutation_boundary_checks_pass",
    passed: mutationChecks.every((item) => item.passed),
    value: mutationChecks,
  },
  {
    id: "no_single_root_above_60_percent_in_expanded_validation",
    passed: dominantShare <= 0.6,
    value: { dominantRoot: dominantRoot?.[0] ?? null, share: Number(dominantShare.toFixed(3)) },
    threshold: 0.6,
  },
  {
    id: "no_high_confidence_known_divergences",
    passed: highConfidenceDivergences.length === 0,
    value: highConfidenceDivergences.map((row) => ({
      roleNumber: row.roleNumber,
      expected: row.expectedRootCanonical,
      actual: row.actualRootCode,
      confidence: row.confidence,
      sourceReport: row.sourceReport,
    })),
  },
  {
    id: "expert_review_visible_for_nonfinal_outputs",
    passed: sessionRows.every((row) => row.needsExpertReview === true),
    value: sessionRows.filter((row) => row.needsExpertReview !== true).length,
  },
];

const gatePassed = gateChecks.every((item) => item.passed);
const recommendation = gatePassed
  ? "Capa 2 por sesion puede pasar a preparacion de Capa 2.5 con monitoreo."
  : "Capa 2 por sesion no debe pasar todavia a Capa 2.5; la validacion ampliada justifica una micro-ronda posterior basada en evidencia nueva.";

const report = {
  generatedAt: new Date().toISOString(),
  calibrationReports: resolvedSessionReports.map((file) => path.relative(process.cwd(), file)),
  mutationReport: path.relative(process.cwd(), resolvedMutationReport),
  gate: {
    passed: gatePassed,
    recommendation,
    checks: gateChecks,
  },
  aggregate: {
    totalSessions: sessionRows.length,
    knownExpectedSessions: knownSessions.length,
    matchedKnownSessions: matchedKnown.length,
    accuracy: Number(accuracy.toFixed(3)),
    rootCounts,
    dominantRoot: dominantRoot
      ? { nodeId: dominantRoot[0], count: dominantRoot[1], share: Number(dominantShare.toFixed(3)) }
      : null,
    highConfidenceDivergences: highConfidenceDivergences.length,
  },
  sessions: sessionRows,
};

const markdown = (value) => {
  const lines = [
    "# Capa 2 MVP - Validacion ampliada por sesion",
    "",
    `Generated at: ${value.generatedAt}`,
    "",
    "## Gate formal de salida",
    "",
    `Resultado: ${value.gate.passed ? "PASO" : "NO PASO"}`,
    "",
    value.gate.recommendation,
    "",
    "| Check | Resultado | Valor |",
    "|---|---|---|",
  ];

  for (const check of value.gate.checks) {
    lines.push(
      `| ${check.id} | ${check.passed ? "pass" : "fail"} | ${JSON.stringify(check.value)} |`,
    );
  }

  lines.push("", "## Sesiones evaluadas", "");
  lines.push("| fuente | rol | esperado | producido | confianza | estado |");
  lines.push("|---|---:|---|---|---|---|");
  for (const session of value.sessions) {
    lines.push(
      `| ${session.sourceReport} | ${session.roleNumber} | ${session.expectedRootCanonical ?? "AMBIGUO"} | ${session.actualRootCode} | ${session.confidence} | ${session.status} |`,
    );
  }

  lines.push("", "## Diagnostico agregado", "");
  lines.push(`- Sesiones totales: ${value.aggregate.totalSessions}`);
  lines.push(`- Sesiones con hipotesis esperada: ${value.aggregate.knownExpectedSessions}`);
  lines.push(`- Aciertos conocidos: ${value.aggregate.matchedKnownSessions}`);
  lines.push(`- Precision observada: ${value.aggregate.accuracy}`);
  lines.push(`- Nodo dominante: ${value.aggregate.dominantRoot?.nodeId ?? "none"} (${value.aggregate.dominantRoot?.share ?? 0})`);
  lines.push(`- Divergencias con confianza alta: ${value.aggregate.highConfidenceDivergences}`);
  lines.push("");
  lines.push("## Observaciones por sesion", "");

  for (const session of value.sessions) {
    lines.push(`### ${session.sourceReport} / rol ${session.roleNumber}`);
    lines.push("");
    lines.push(`Root: ${session.actualRootCode} | Confidence: ${session.confidence} | Status: ${session.status}`);
    lines.push("");
    lines.push("Ranking:");
    for (const item of session.ranking) lines.push(`- ${item.nodeId}: ${item.score}`);
    lines.push("");
    lines.push("Senales estructurales clave:");
    for (const signal of session.keyStructuralSignals) {
      lines.push(`- ${signal.signal} / ${signal.family} / count ${signal.count}`);
    }
    if (session.dominantBundle) {
      lines.push("");
      lines.push(
        `Bundle dominante: ${session.dominantBundle.nodeId} / ${session.dominantBundle.sceneName} / net ${session.dominantBundle.net}`,
      );
      lines.push("Evidencia que sostiene:");
      for (const item of session.dominantBundle.supports) {
        lines.push(`- ${item.variable}: ${item.weight} - ${item.reason}`);
      }
      lines.push("Evidencia que debilita:");
      for (const item of session.dominantBundle.weakens) {
        lines.push(`- ${item.variable}: ${item.weight} - ${item.reason}`);
      }
    }
    if (session.ablationRootChanges.length) {
      lines.push("");
      lines.push("Ablaciones con cambio de raiz:");
      for (const item of session.ablationRootChanges) {
        lines.push(`- ${item.groupName}: removal=${item.rootAfterRemoval}, half=${item.rootAfterHalfWeight}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
};

const stamp = Date.now();
const jsonPath = path.join(FIXTURES_DIR, `capa2-expanded-validation-report-${stamp}.json`);
const mdPath = jsonPath.replace(/\.json$/, ".md");

fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
fs.writeFileSync(mdPath, markdown(report));

console.log(`Expanded validation JSON: ${path.relative(process.cwd(), jsonPath)}`);
console.log(`Expanded validation MD: ${path.relative(process.cwd(), mdPath)}`);
console.log(`Gate: ${gatePassed ? "PASSED" : "FAILED"}`);
console.log(recommendation);
