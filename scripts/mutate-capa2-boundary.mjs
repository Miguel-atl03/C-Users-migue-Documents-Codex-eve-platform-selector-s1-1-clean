import fs from "node:fs";
import path from "node:path";

const FIXTURES_DIR = path.resolve("fixtures");

const NODE_LABELS = {
  N03: "N03 Anarquia Operacional",
  N04: "N04 Violacion Causal",
  N06: "N06 Tortura Causal",
  N10: "N10 Promesa Imposible",
};

const SIGNAL_TAXONOMY = {
  explicit_n04_breach: {
    signal_family: "strong_breach",
    causal_role: "root_candidate",
    root_candidate_strength: "high",
    can_act_as_symptom: false,
  },
  temporal_dependency_break: {
    signal_family: "temporal_olc_break",
    causal_role: "root_candidate",
    root_candidate_strength: "high",
    can_act_as_symptom: false,
  },
  workaround_as_coordination_architecture: {
    signal_family: "stable_informal_architecture",
    causal_role: "root_candidate",
    root_candidate_strength: "high",
    can_act_as_symptom: false,
  },
  system_parallel_as_primary_truth: {
    signal_family: "stable_informal_architecture",
    causal_role: "root_candidate",
    root_candidate_strength: "high",
    can_act_as_symptom: false,
  },
  formal_system_insufficient_absorption: {
    signal_family: "stable_informal_architecture",
    causal_role: "contextual_support",
    root_candidate_strength: "medium",
    can_act_as_symptom: false,
  },
  workaround_as_symptom: {
    signal_family: "symptom_compensation",
    causal_role: "symptom_or_consequence",
    root_candidate_strength: "low",
    can_act_as_symptom: true,
  },
};

const latestCalibrationReport = () => {
  const files = fs
    .readdirSync(FIXTURES_DIR)
    .filter((name) => /^capa2-calibration-report-\d+\.json$/.test(name))
    .map((name) => ({
      name,
      file: path.join(FIXTURES_DIR, name),
      mtime: fs.statSync(path.join(FIXTURES_DIR, name)).mtimeMs,
    }))
    .sort((left, right) => right.mtime - left.mtime);

  if (!files.length) throw new Error("No capa2 calibration report found.");
  return files[0].file;
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const evidenceText = (item) =>
  [
    item.canonicalVariable,
    item.variable,
    item.reason,
    item.nature,
    item.evidenceTier,
    JSON.stringify(item.value ?? {}),
  ]
    .filter(Boolean)
    .join(" ");

const itemTier = (item) => item.evidenceTier ?? item.tier ?? "primary";

const supportScore = (items) => {
  const primarySecondary = items
    .filter((item) => itemTier(item) !== "inferential")
    .reduce((total, item) => total + (Number(item.weight) || 0), 0);
  const inferential = items
    .filter((item) => itemTier(item) === "inferential")
    .reduce((total, item) => total + (Number(item.weight) || 0), 0);

  return primarySecondary + Math.min(0.8, inferential);
};

const bundleScore = (bundle) => {
  const primarySecondary = bundle.supports
    .filter((item) => itemTier(item) !== "inferential")
    .reduce((total, item) => total + (Number(item.weight) || 0), 0);
  const score = supportScore(bundle.supports);
  const weakenScore = bundle.weakens.reduce(
    (total, item) => total + (Number(item.weight) || 0),
    0,
  );
  const active = primarySecondary >= 3;

  return {
    ...bundle,
    active,
    recalculatedSupport: active ? score : 0,
    recalculatedWeaken: active ? weakenScore : 0,
    recalculatedNet: active ? score - weakenScore : 0,
  };
};

const recomputeNodes = (bundles) => {
  const byNode = { N03: 0, N04: 0, N06: 0, N10: 0 };
  const scoredBundles = bundles.map(bundleScore);

  for (const bundle of scoredBundles) {
    byNode[bundle.nodeId] += bundle.recalculatedNet;
  }

  const ranking = Object.entries(byNode)
    .map(([nodeId, score]) => ({
      nodeId,
      label: NODE_LABELS[nodeId],
      score: Number(score.toFixed(2)),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return { root: ranking[0] ?? null, ranking, scoredBundles };
};

const structuralItem = (bundle, signal, weight, reason) => ({
  sceneId: bundle.sceneId,
  sceneName: bundle.sceneName,
  canonicalVariable: `structural_signal.${signal}`,
  reason,
  nature: "computed",
  evidenceTier: "primary",
  weight,
  evidenceAnswerIds: [],
  value: {
    signal,
    active: true,
    ...SIGNAL_TAXONOMY[signal],
  },
});

const removeItems = (items, patterns) =>
  items.filter((item) => !patterns.some((pattern) => pattern.test(evidenceText(item))));

const addSupport = (bundle, signal, weight, reason) => ({
  ...bundle,
  supports: [...bundle.supports, structuralItem(bundle, signal, weight, reason)],
});

const addWeakener = (bundle, signal, weight, reason) => ({
  ...bundle,
  weakens: [...bundle.weakens, structuralItem(bundle, signal, weight, reason)],
});

const mutateBundles = (bundles, variantId) =>
  bundles.map((bundle) => {
    if (variantId === "reinforce_n03_stable_architecture" && bundle.nodeId === "N03") {
      return addSupport(
        addSupport(
          bundle,
          "system_parallel_as_primary_truth",
          2,
          "Mutacion: se refuerza sistema paralelo como fuente primaria de verdad operativa.",
        ),
        "formal_system_insufficient_absorption",
        1.5,
        "Mutacion: se refuerza insuficiencia del sistema formal para absorber variedad.",
      );
    }

    if (variantId === "reinforce_n06_temporal_break" && bundle.nodeId === "N06") {
      return addSupport(
        addSupport(
          bundle,
          "temporal_dependency_break",
          3,
          "Mutacion: se agrega ruptura temporal/OLC puntual explicita.",
        ),
        "workaround_as_symptom",
        2,
        "Mutacion: el workaround aparece como reaccion a dependencia temporal rota, no como arquitectura estable.",
      );
    }

    if (variantId === "reinforce_n06_temporal_break" && bundle.nodeId === "N03") {
      return addWeakener(
        bundle,
        "workaround_as_symptom",
        4,
        "Mutacion: la coordinacion informal queda reinterpretada como sintoma de ruptura temporal puntual.",
      );
    }

    if (variantId === "remove_stable_architecture" && bundle.nodeId === "N03") {
      return {
        ...bundle,
        supports: removeItems(bundle.supports, [
          /structural_signal\.workaround_as_coordination_architecture/i,
          /structural_signal\.system_parallel_as_primary_truth/i,
          /structural_signal\.formal_system_insufficient_absorption/i,
          /arquitectura normal/i,
          /sistema paralelo/i,
          /excel es la verdad/i,
          /erp insuficiente/i,
        ]),
      };
    }

    if (variantId === "remove_temporal_break" && bundle.nodeId === "N06") {
      return {
        ...bundle,
        supports: removeItems(bundle.supports, [
          /structural_signal\.temporal_dependency_break/i,
          /dependencia temporal\/OLC/i,
        ]),
      };
    }

    return bundle;
  });

const structuralSignals = (bundles) =>
  bundles.flatMap((bundle) =>
    [...bundle.supports, ...bundle.weakens]
      .filter((item) => String(item.canonicalVariable ?? "").startsWith("structural_signal."))
      .map((item) => ({
        nodeId: bundle.nodeId,
        sceneName: bundle.sceneName,
        signal: String(item.canonicalVariable).replace("structural_signal.", ""),
        family: item.value?.signal_family ?? null,
        weight: item.weight,
        role: item.value?.causal_role ?? null,
      })),
  );

const markdownReport = (report) => {
  const lines = [
    "# Capa 2 MVP - Minimal Mutation Boundary Test",
    "",
    `Source report: \`${report.sourceReport}\``,
    `Generated at: ${report.generatedAt}`,
    "",
    "## Baseline Caso 3",
    "",
    `Root: ${report.baseline.root?.label ?? "none"}`,
    "",
    "| Nodo | Score |",
    "|---|---:|",
    ...report.baseline.ranking.map((item) => `| ${item.label} | ${item.score} |`),
    "",
    "## Mutations",
    "",
  ];

  for (const mutation of report.mutations) {
    lines.push(`### ${mutation.id}`, "");
    lines.push(`Expected behavior: ${mutation.expectedBehavior}`);
    lines.push(`Root: ${mutation.root?.label ?? "none"}`);
    lines.push(`Methodological sense: ${mutation.methodologicalSense}`);
    lines.push("");
    lines.push("| Nodo | Score |");
    lines.push("|---|---:|");
    for (const item of mutation.ranking) lines.push(`| ${item.label} | ${item.score} |`);
    lines.push("");
    lines.push("Structural signals:");
    for (const signal of mutation.structuralSignals.slice(0, 12)) {
      lines.push(
        `- ${signal.nodeId} / ${signal.signal} / ${signal.family ?? "unknown"} / weight ${signal.weight}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
};

const sourceReport = process.argv[2] ? path.resolve(process.argv[2]) : latestCalibrationReport();
const parsed = JSON.parse(fs.readFileSync(sourceReport, "utf8"));
const case3 = parsed.sessions.find((session) => Number(session.roleNumber) === 3);
if (!case3) throw new Error("No roleNumber 3 found in report.");

const baselineBundles = clone(case3.evidenceBundles ?? case3.topEvidenceBundles ?? []);
const baseline = recomputeNodes(baselineBundles);

const variantDefinitions = [
  {
    id: "reinforce_n03_stable_architecture",
    expectedBehavior: "N03 should increase when system-parallel/stable informal architecture is reinforced.",
    methodologicalSense:
      "Debe fortalecer anarquia operacional si el workaround es arquitectura normal, no reaccion puntual.",
  },
  {
    id: "reinforce_n06_temporal_break",
    expectedBehavior: "N06 should increase when a punctual temporal/OLC rupture is added.",
    methodologicalSense:
      "Debe fortalecer tortura causal si aparece ruptura temporal especifica y no mera informalidad cronica.",
  },
  {
    id: "remove_stable_architecture",
    expectedBehavior: "N06 should rise if stable informal architecture evidence is removed.",
    methodologicalSense:
      "Debe bajar N03 si se quita la sustitucion estable del sistema formal.",
  },
  {
    id: "remove_temporal_break",
    expectedBehavior: "N03 should rise if punctual temporal/OLC rupture is removed.",
    methodologicalSense:
      "Debe bajar N06 si desaparece la ruptura temporal puntual y queda arquitectura informal.",
  },
];

const mutations = variantDefinitions.map((definition) => {
  const bundles = mutateBundles(clone(baselineBundles), definition.id);
  const result = recomputeNodes(bundles);

  return {
    ...definition,
    root: result.root,
    ranking: result.ranking,
    structuralSignals: structuralSignals(bundles),
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  sourceReport: path.relative(process.cwd(), sourceReport),
  case: {
    roleNumber: case3.roleNumber,
    roleName: case3.roleName,
    expectedRootCanonical: case3.expectedRootCanonical,
  },
  baseline: {
    root: baseline.root,
    ranking: baseline.ranking,
    structuralSignals: structuralSignals(baselineBundles),
  },
  mutations,
};

const stamp = Date.now();
const jsonPath = path.join(FIXTURES_DIR, `capa2-boundary-mutation-report-${stamp}.json`);
const mdPath = path.join(FIXTURES_DIR, `capa2-boundary-mutation-report-${stamp}.md`);

fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
fs.writeFileSync(mdPath, markdownReport(output));

console.log(`Boundary mutation JSON: ${path.relative(process.cwd(), jsonPath)}`);
console.log(`Boundary mutation MD: ${path.relative(process.cwd(), mdPath)}`);
for (const mutation of mutations) {
  console.log(`${mutation.id}: root=${mutation.root?.label ?? "none"} ranking=${mutation.ranking.map((item) => `${item.nodeId}:${item.score}`).join(", ")}`);
}
