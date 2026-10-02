import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = process.env.EVE_BASE_URL ?? "http://localhost:3000";
const limit = process.env.EVE_OBSERVABILITY_LIMIT ?? "50";
const since = process.env.EVE_OBSERVABILITY_SINCE ?? "2026-05-19T17:23:00.000Z";

const response = await fetch(`${baseUrl}/api/runtime/observability?limit=${encodeURIComponent(limit)}&since=${encodeURIComponent(since)}`);
const text = await response.text();
let report;
try {
  report = JSON.parse(text);
} catch {
  report = { status: "failed", error: text };
}

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "runtime-observability-audit-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));

if (!response.ok || report.status === "failed") {
  process.exitCode = 1;
}


