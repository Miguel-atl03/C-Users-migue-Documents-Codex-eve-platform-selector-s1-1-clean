#!/usr/bin/env node
/**
 * P3 static scan: service_role exposure in client-facing code and env files.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");

const CLIENT_STRICT_ROOTS = ["src/app", "src/components", "src/features"];
const SERVER_SCAN_ROOTS = ["src/services", "supabase"];

const ENV_PATTERNS = [".env", ".env.local", ".env.development", ".env.production"];

const CLIENT_FORBIDDEN = [
  { id: "service_role_literal", regex: /service_role/i },
  { id: "next_public_service_role", regex: /NEXT_PUBLIC_.*SERVICE_ROLE/i },
  { id: "supabase_service_role_key", regex: /SUPABASE_SERVICE_ROLE_KEY/i },
];

const SERVER_DANGEROUS = [
  { id: "create_client_service_role", regex: /createClient\s*\([\s\S]{0,200}service_role/i },
  { id: "next_public_service_role", regex: /NEXT_PUBLIC_.*SERVICE_ROLE/i },
  { id: "client_auth_service_role", regex: /auth\s*:\s*\{[\s\S]{0,80}service_role/i },
];

const SERVER_ONLY_ALLOWLIST = new Set([
  "src/services/mba/server-supabase-client.mjs",
  "src/services/parallel-production/runtime/repository.mjs",
]);

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkFiles(full, out);
    } else if (/\.(ts|tsx|js|mjs|sql|toml|json)$/i.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function scanFile(filePath, patterns, rel) {
  const content = readFileSync(filePath, "utf8");
  const hits = [];
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) hits.push(pattern.id);
  }
  return hits.length > 0 ? { file: rel, hits } : null;
}

function scanEnvFiles() {
  const findings = [];
  for (const name of ENV_PATTERNS) {
    const full = join(repoRoot, name);
    if (!existsSync(full)) continue;
    const content = readFileSync(full, "utf8");
    if (/SERVICE_ROLE|service_role/i.test(content)) {
      findings.push({ file: name, hits: ["env_service_role_reference"] });
    }
  }
  return findings;
}

function main() {
  const clientViolations = [];
  const serverViolations = [];
  const serverBoundaryMentions = [];

  for (const root of CLIENT_STRICT_ROOTS) {
    for (const file of walkFiles(join(repoRoot, root))) {
      const rel = relative(repoRoot, file).replace(/\\/g, "/");
      const hit = scanFile(file, CLIENT_FORBIDDEN, rel);
      if (hit) clientViolations.push(hit);
    }
  }

  for (const root of SERVER_SCAN_ROOTS) {
    for (const file of walkFiles(join(repoRoot, root))) {
      const rel = relative(repoRoot, file).replace(/\\/g, "/");
      if (SERVER_ONLY_ALLOWLIST.has(rel)) continue;
      const dangerous = scanFile(file, SERVER_DANGEROUS, rel);
      if (dangerous) serverViolations.push(dangerous);
      else if (/service_role/i.test(readFileSync(file, "utf8"))) {
        serverBoundaryMentions.push(rel);
      }
    }
  }

  const envFindings = scanEnvFiles();
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const nextPublicServiceRole = /NEXT_PUBLIC_.*SERVICE_ROLE/i.test(JSON.stringify(packageJson));

  const blockingViolations = [...clientViolations, ...serverViolations, ...envFindings];
  if (nextPublicServiceRole) {
    blockingViolations.push({ file: "package.json", hits: ["next_public_service_role"] });
  }

  const result = {
    validator: "p3-scan-service-role-exposure",
    status: blockingViolations.length === 0 ? "passed" : "failed",
    service_role_in_client: clientViolations.length > 0,
    service_role_key_committed: envFindings.length > 0,
    next_public_service_role_found: nextPublicServiceRole,
    client_can_bypass_rls: blockingViolations.some((v) => v.hits.includes("bypass_rls")),
    client_violations: clientViolations,
    server_dangerous_violations: serverViolations,
    server_boundary_mentions_count: serverBoundaryMentions.length,
    env_files_present: ENV_PATTERNS.some((name) => existsSync(join(repoRoot, name))),
    server_only_allowlist: [...SERVER_ONLY_ALLOWLIST],
  };

  console.log(JSON.stringify(result, null, 2));
  if (blockingViolations.length > 0) process.exit(1);
}

main();
