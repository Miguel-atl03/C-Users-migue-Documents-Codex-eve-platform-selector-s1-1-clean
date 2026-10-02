import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const evidencePath = path.join(root, "docs/production-activation/eve_production_activation_p9a_command_results.json");
if (process.argv.includes("--redact-legacy-status")) {
  const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  let count = 0;
  evidence.commands.supabase_status.stdout_tail = evidence.commands.supabase_status.stdout_tail
    .replace(/sb_secret_[A-Za-z0-9_-]{20,}/g, () => { count++; return "[REDACTED_LEGACY_LOCAL_SECRET]"; })
    .replace(/postgres(?:ql)?:\/\/[^\s"<>]+:[^\s"<>]+@/g, () => { count++; return "postgresql://[REDACTED]@"; })
    .replace(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g, (value, payload) => {
      try {
        if (JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role === "service_role") { count++; return "[REDACTED_LEGACY_LOCAL_SERVICE_ROLE]"; }
      } catch { /* Not a JWT. */ }
      return value;
    });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`REDACTED legacy local status values=${count}`);
  const legacyScripts = ["p4-runtime-real-local-smoke.mjs", "p4-validate-runtime-real-records.mjs", "p5-gates-readiness-local-smoke.mjs", "p5-validate-gates-readiness-records.mjs", "p6-client-safe-result-local-smoke.mjs", "p7-consultant-review-packet-local-smoke.mjs", "p8-controlled-parallel-production-local-smoke.mjs", "p9a-production-activation-lib.mjs"];
  for (const name of legacyScripts) {
    const file = path.join(root, "scripts/eve/production-activation", name);
    const source = fs.readFileSync(file, "utf8");
    const redacted = source.replace(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g, (value, payload) => {
      try { if (JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role === "service_role") return ""; } catch { /* Not a JWT. */ }
      return value;
    });
    if (source !== redacted) { fs.writeFileSync(file, redacted); console.log(`REMOVED embedded local service-role fallback: ${name}`); }
  }
}

const findings = [];
const ignored = new Set([".git", ".next", "node_modules", ".tmp", ".vercel"]);
const patterns = [
  ["supabase_secret", /sb_secret_[A-Za-z0-9_-]{20,}/],
  ["openai_key", /sk-proj-[A-Za-z0-9_-]{25,}/],
  ["github_token", /gh[pousr]_[A-Za-z0-9]{25,}/],
  ["other_recognized_secret", /AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{20,}|sk_live_[A-Za-z0-9]{20,}/],
  ["private_key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith(".env") && !entry.name.endsWith(".example")) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(absolute); continue; }
    if (!/\.(?:[cm]?js|tsx?|json|md|txt|sql|example|html|csv|ya?ml|toml)$/.test(entry.name)) continue;
    const content = fs.readFileSync(absolute, "utf8");
    for (const [kind, pattern] of patterns) if (pattern.test(content)) findings.push({ path: path.relative(root, absolute), kind });
    for (const match of content.matchAll(/postgres(?:ql)?:\/\/[^\s"'<>`]+/g)) {
      try {
        const url = new URL(match[0]);
        const password = decodeURIComponent(url.password);
        const fixturePassword = /^(?:pass|password|pw|p|secret|PLACEHOLDER|YOUR_PASSWORD|\[REDACTED\])$/i.test(password);
        if (password && !fixturePassword) findings.push({ path: path.relative(root, absolute), kind: "credentialed_dsn_review" });
      } catch { /* Incomplete placeholder or source expression, not a concrete DSN. */ }
    }
    for (const match of content.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
      try { if (JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")).role === "service_role") findings.push({ path: path.relative(root, absolute), kind: "service_role_jwt" }); } catch { /* Not a JWT. */ }
    }
  }
}
scan(root);
console.log(JSON.stringify({ result: findings.length ? "FAIL" : "PASS", findings }, null, 2));
if (findings.length) process.exitCode = 1;
