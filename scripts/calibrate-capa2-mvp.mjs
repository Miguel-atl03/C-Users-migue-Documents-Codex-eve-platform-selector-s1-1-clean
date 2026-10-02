import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const baseUrl = process.env.EVE_BASE_URL ?? "http://localhost:3000";
const resultFile =
  process.argv[2] ??
  (await latestFile(path.join(repoRoot, "fixtures"), /^manufactura-assisted-multisession-result-.*\.json$/));

const NODE_LABELS = {
  N03: "N03 Anarquia Operacional",
  N04: "N04 Violacion Causal",
  N06: "N06 Tortura Causal",
  N10: "N10 Promesa Imposible",
};

const RULE_NODE = {
  "R-N03-ANARQUIA-OPERACIONAL-MVP": "N03",
  "R-N04-VIOLACION-CAUSAL-MVP": "N04",
  "R-N06-TORTURA-CAUSAL-MVP": "N06",
  "R-N10-PROMESA-IMPOSIBLE-MVP": "N10",
};

const ABLATION_GROUPS = {
  workaround_compensation: [
    /workaround/i,
    /sacrificio/i,
    /absorcion/i,
    /desgaste/i,
    /effort/i,
    /trench/i,
    /compens/i,
  ],
  alternative_deviation: [
    /alternative_paths/i,
    /flow_deviation/i,
    /parallelism/i,
    /delivery_channel/i,
    /route_/i,
    /desviaci/i,
  ],
  informal_hidden: [
    /regla_informal/i,
    /hidden_subprocess/i,
    /real_vs_official/i,
    /informacion_faltante/i,
    /ocult/i,
  ],
  capacity_bargain: [
    /capacidad/i,
    /brecha/i,
    /resource_bargain/i,
    /discrecionalidad/i,
    /constre/i,
    /variedad_residual/i,
  ],
  consistency_flags: [/consistency_flag/i, /flagType/i, /^R\d+_/i],
  block7_light_inference: [/light_inference/i, /preclassification/i],
};

async function latestFile(dir, pattern) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const candidates = await Promise.all(
    files
      .filter((file) => file.isFile() && pattern.test(file.name))
      .map(async (file) => {
        const fullPath = path.join(dir, file.name);
        const stat = await fs.stat(fullPath);
        return { fullPath, mtimeMs: stat.mtimeMs };
      }),
  );

  candidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (!candidates[0]) throw new Error("No multisession result file found.");
  return candidates[0].fullPath;
}

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

const evidenceText = (item) =>
  [
    item.canonicalVariable,
    item.reason,
    item.nature,
    item.evidenceTier,
    JSON.stringify(item.value ?? {}),
  ]
    .filter(Boolean)
    .join(" ");

const itemInGroup = (item, groupName) =>
  ABLATION_GROUPS[groupName].some((pattern) => pattern.test(evidenceText(item)));

const supportScore = (items) => {
  const primarySecondary = items
    .filter((item) => item.evidenceTier !== "inferential")
    .reduce((total, item) => total + (Number(item.weight) || 0), 0);
  const inferential = items
    .filter((item) => item.evidenceTier === "inferential")
    .reduce((total, item) => total + (Number(item.weight) || 0), 0);

  return primarySecondary + Math.min(0.8, inferential);
};

const bundleScore = (bundle, options = {}) => {
  const removedGroup = options.removedGroup ?? null;
  const reductionGroup = options.reductionGroup ?? null;
  const multiplier = options.multiplier ?? 1;

  const mapItem = (item) => {
    if (removedGroup && itemInGroup(item, removedGroup)) return null;
    if (reductionGroup && itemInGroup(item, reductionGroup)) {
      return { ...item, weight: (Number(item.weight) || 0) * multiplier };
    }
    return item;
  };

  const supports = bundle.supports.map(mapItem).filter(Boolean);
  const weakens = bundle.weakens.map(mapItem).filter(Boolean);
  const primarySecondary = supports
    .filter((item) => item.evidenceTier !== "inferential")
    .reduce((total, item) => total + (Number(item.weight) || 0), 0);
  const score = supportScore(supports);
  const weakenScore = weakens.reduce(
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
    removedSupportWeight:
      bundle.supportScore - score > 0 ? Number((bundle.supportScore - score).toFixed(2)) : 0,
  };
};

const recomputeNodes = (bundles, options = {}) => {
  const byNode = {};
  for (const node of Object.values(RULE_NODE)) byNode[node] = 0;

  const scoredBundles = bundles.map((bundle) => bundleScore(bundle, options));
  for (const bundle of scoredBundles) {
    byNode[bundle.nodeId] = (byNode[bundle.nodeId] ?? 0) + bundle.recalculatedNet;
  }

  const ranking = Object.entries(byNode)
    .map(([nodeId, score]) => ({
      nodeId,
      label: NODE_LABELS[nodeId],
      score: Number(score.toFixed(2)),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return {
    root: ranking[0] ?? null,
    ranking,
    scoredBundles,
  };
};

const topEvidenceByNode = (bundles) => {
  const rows = [];
  for (const bundle of bundles) {
    const supports = [...bundle.supports]
      .sort((left, right) => (right.weight ?? 0) - (left.weight ?? 0))
      .slice(0, 5)
      .map((item) => ({
        variable: item.canonicalVariable ?? item.nature,
        tier: item.evidenceTier,
        weight: item.weight,
        reason: item.reason,
      }));
    const weakens = [...bundle.weakens]
      .sort((left, right) => (right.weight ?? 0) - (left.weight ?? 0))
      .slice(0, 3)
      .map((item) => ({
        variable: item.canonicalVariable ?? item.nature,
        tier: item.evidenceTier,
        weight: item.weight,
        reason: item.reason,
      }));
    rows.push({
      nodeId: bundle.nodeId,
      ruleId: bundle.ruleId,
      sceneId: bundle.sceneId,
      sceneName: bundle.sceneName,
      supportScore: bundle.supportScore,
      weakenScore: bundle.weakenScore,
      net: Number((bundle.supportScore - bundle.weakenScore).toFixed(2)),
      supports,
      weakens,
    });
  }

  return rows
    .sort((left, right) => right.net - left.net)
    .slice(0, 12);
};

const ablationReport = (output) => {
  const baseline = recomputeNodes(output.evidence_bundle_used);

  return Object.keys(ABLATION_GROUPS).map((groupName) => {
    const ablated = recomputeNodes(output.evidence_bundle_used, {
      removedGroup: groupName,
    });
    const sensitivityHalf = recomputeNodes(output.evidence_bundle_used, {
      reductionGroup: groupName,
      multiplier: 0.5,
    });

    return {
      groupName,
      baselineRoot: baseline.root,
      rootAfterRemoval: ablated.root,
      rootAfterHalfWeight: sensitivityHalf.root,
      rootChangedAfterRemoval:
        (baseline.root?.nodeId ?? null) !== (ablated.root?.nodeId ?? null),
      rootChangedAfterHalfWeight:
        (baseline.root?.nodeId ?? null) !== (sensitivityHalf.root?.nodeId ?? null),
      rankingAfterRemoval: ablated.ranking,
      rankingAfterHalfWeight: sensitivityHalf.ranking,
    };
  });
};

const syntheticItem = (nodeId, variable, weight) => ({
  sceneId: `synthetic-${nodeId}`,
  sceneName: `Synthetic ${nodeId}`,
  canonicalVariable: variable,
  value: "synthetic",
  reason: "Synthetic discrimination probe.",
  nature: "captured",
  evidenceTier: "primary",
  weight,
  evidenceAnswerIds: [],
});

const syntheticBundle = (nodeId, ruleId, variables) => ({
  id: `synthetic:${ruleId}`,
  ruleId,
  nodeId,
  supportScore: variables.reduce((total, item) => total + item.weight, 0),
  weakenScore: 0,
  supports: variables,
  weakens: [],
});

const discriminationScenarios = () => {
  const scenarios = [
    {
      id: "clear_n03_workaround_only",
      expectedRoot: "N03",
      bundles: [
        syntheticBundle("N03", "R-N03-ANARQUIA-OPERACIONAL-MVP", [
          syntheticItem("N03", "workaround_used", 2.5),
          syntheticItem("N03", "workaround_types", 1),
          syntheticItem("N03", "sacrificio_humano", 2),
        ]),
      ],
    },
    {
      id: "clear_n10_capacity_gap",
      expectedRoot: "N10",
      bundles: [
        syntheticBundle("N10", "R-N10-PROMESA-IMPOSIBLE-MVP", [
          syntheticItem("N10", "brecha_capacidad_5_3", 3),
          syntheticItem("N10", "capacidad_real_5_2", 2),
          syntheticItem("N10", "resource_bargain_5_14", 2),
        ]),
      ],
    },
    {
      id: "clear_n06_temporal_dependency",
      expectedRoot: "N06",
      bundles: [
        syntheticBundle("N06", "R-N06-TORTURA-CAUSAL-MVP", [
          syntheticItem("N06", "dependency_previous", 1),
          syntheticItem("N06", "dependency_next", 1),
          syntheticItem("N06", "deadlock_risk", 2),
          syntheticItem("N06", "blocking_impact", 2),
        ]),
      ],
    },
    {
      id: "clear_n04_hidden_information",
      expectedRoot: "N04",
      bundles: [
        syntheticBundle("N04", "R-N04-VIOLACION-CAUSAL-MVP", [
          syntheticItem("N04", "informacion_faltante", 2),
          syntheticItem("N04", "hidden_subprocess", 1.5),
          syntheticItem("N04", "delivery_failure_exists", 2),
        ]),
      ],
    },
  ];

  return scenarios.map((scenario) => {
    const result = recomputeNodes(scenario.bundles);
    return {
      id: scenario.id,
      expectedRoot: scenario.expectedRoot,
      actualRoot: result.root?.nodeId ?? null,
      passed: scenario.expectedRoot === (result.root?.nodeId ?? null),
      ranking: result.ranking,
    };
  });
};

const sessionReport = async (roleSession) => {
  const diagnostic = await postJson("/api/causal/diagnostic", {
    sessionId: roleSession.sessionId,
    persist: false,
  });
  const output = diagnostic.output;
  const baseline = recomputeNodes(output.evidence_bundle_used);
  const actualRootCode =
    output.root_node_probable_within_mvp_scope?.nodeId ??
    output.root_node_probable?.nodeId ??
    null;
  const engineRanking = [
    output.root_node_probable_within_mvp_scope,
    ...(output.secondary_nodes_activated ?? []),
  ]
    .filter(Boolean)
    .map((activation) => ({
      nodeId: activation.nodeId,
      label: activation.nodeLabel,
      score: Number((activation.activationScore ?? 0).toFixed(2)),
    }));

  return {
    roleNumber: roleSession.roleNumber,
    roleName: roleSession.roleName,
    expectedRootCanonical: roleSession.expectedRootCanonical ?? null,
    expectedRootLabel: roleSession.expectedRootLabel ?? null,
    expectedVsActual:
      roleSession.expectedRootCanonical === null ||
      roleSession.expectedRootCanonical === undefined
        ? "ambiguous_or_not_applicable"
        : actualRootCode === roleSession.expectedRootCanonical
          ? "matched_expected_root"
          : "diverged_from_expected_root",
    sessionId: roleSession.sessionId,
    actualRoot: output.root_node_probable_within_mvp_scope?.nodeLabel ?? null,
    actualRootCode,
    actualConfidence: output.confidence_level,
    needsReentry: output.needs_reentry,
    needsExpertReview: output.needs_expert_review,
    recomputedRanking: baseline.ranking,
    engineRanking,
    evidenceBundles: output.evidence_bundle_used,
    topEvidenceBundles: topEvidenceByNode(output.evidence_bundle_used),
    ablations: ablationReport(output),
  };
};

const markdownSummary = (report) => {
  const lines = [
    "# Capa 2 MVP Calibration Report",
    "",
    `Source: ${report.sourceFile}`,
    `Generated at: ${report.generatedAt}`,
    "",
    "## Session Roots",
    "",
    "| role | root | confidence | needs reentry | needs expert review |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const session of report.sessions) {
    lines.push(
      `| ${session.roleNumber} ${session.roleName} | ${session.actualRoot} | ${session.actualConfidence} | ${session.needsReentry} | ${session.needsExpertReview} |`,
    );
  }

  lines.push("", "## Expected Vs Actual", "");
  lines.push("| role | expected | actual | status |");
  lines.push("| --- | --- | --- | --- |");
  for (const session of report.sessions) {
    lines.push(
      `| ${session.roleNumber} ${session.roleName} | ${session.expectedRootLabel ?? "not specified"} | ${session.actualRoot} | ${session.expectedVsActual} |`,
    );
  }

  lines.push("", "## Ablation Root Changes", "");
  for (const session of report.sessions) {
    const changes = session.ablations
      .filter((item) => item.rootChangedAfterRemoval || item.rootChangedAfterHalfWeight)
      .map((item) => `${item.groupName}: removal=${item.rootAfterRemoval?.label ?? "none"}, half=${item.rootAfterHalfWeight?.label ?? "none"}`);
    lines.push(`- Role ${session.roleNumber}: ${changes.length ? changes.join("; ") : "no root changes under tested ablations"}`);
  }

  lines.push("", "## Discrimination Scenarios", "");
  for (const scenario of report.discriminationScenarios) {
    lines.push(
      `- ${scenario.id}: expected ${scenario.expectedRoot}, actual ${scenario.actualRoot}, passed=${scenario.passed}`,
    );
  }

  return lines.join("\n");
};

const main = async () => {
  const source = await readJson(resultFile);
  const sessions = [];

  for (const roleSession of source.roleSessions) {
    sessions.push(await sessionReport(roleSession));
    console.log(`Calibrated role ${roleSession.roleNumber}`);
  }

  const report = {
    sourceFile: resultFile,
    generatedAt: new Date().toISOString(),
    sessions,
    discriminationScenarios: discriminationScenarios(),
  };
  const outJson = path.join(
    path.dirname(resultFile),
    `capa2-calibration-report-${Date.now()}.json`,
  );
  const outMd = outJson.replace(/\.json$/, ".md");
  await fs.writeFile(outJson, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(outMd, markdownSummary(report), "utf8");
  console.log(`Calibration JSON: ${outJson}`);
  console.log(`Calibration MD: ${outMd}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
