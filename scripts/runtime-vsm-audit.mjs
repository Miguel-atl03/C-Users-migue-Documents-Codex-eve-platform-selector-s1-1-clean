import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = process.env.EVE_BASE_URL ?? "http://localhost:3000";
const limit = process.env.EVE_VSM_LIMIT ?? process.env.EVE_OBSERVABILITY_LIMIT ?? "100";
const since = process.env.EVE_VSM_SINCE ?? process.env.EVE_OBSERVABILITY_SINCE ?? "2026-05-19T17:23:00.000Z";
const url = `${baseUrl}/api/runtime/vsm?limit=${encodeURIComponent(limit)}&since=${encodeURIComponent(since)}`;

const response = await fetch(url);
const text = await response.text();
let snapshot;
try {
  snapshot = JSON.parse(text);
} catch {
  snapshot = { status: "red", error: text };
}

const driftSignals = snapshot.trends?.driftSignals ?? [];
const algedonicEvents = snapshot.algedonic?.events ?? [];
const criticalTemporalDrift = driftSignals.filter((signal) => signal.severity === "critical");

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "runtime-vsm-dashboard-report.json"),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "reports", "runtime-vsm-alerts.json"),
  `${JSON.stringify({
    generatedAt: snapshot.generatedAt,
    status: snapshot.status,
    events: algedonicEvents,
    driftSignals,
    weeklyPeriods: snapshot.trends?.weekly?.length ?? 0,
    monthlyPeriods: snapshot.trends?.monthly?.length ?? 0,
  }, null, 2)}\n`,
);

console.log(JSON.stringify({
  status: snapshot.status,
  generatedAt: snapshot.generatedAt,
  baselineSince: snapshot.baselineSince,
  events: algedonicEvents.length,
  driftSignals: driftSignals.length,
  criticalTemporalDrift: criticalTemporalDrift.length,
  weeklyPeriods: snapshot.trends?.weekly?.length ?? 0,
  monthlyPeriods: snapshot.trends?.monthly?.length ?? 0,
}, null, 2));

if (!response.ok || snapshot.status === "red" || criticalTemporalDrift.length) process.exitCode = 1;