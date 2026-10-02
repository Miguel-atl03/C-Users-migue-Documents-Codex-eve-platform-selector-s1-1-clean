import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../../..");
const serviceRoot = path.join(root, "src/services/eve/pr3");
const ref = "keqrkyumfyhfivllvdbl";
const url = `https://${ref}.supabase.co`;

function loadService(name, overrides = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} };
    cache.set(file, loadedModule);
    const source = fs.readFileSync(file, "utf8");
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    function localRequire(id) {
      if (id === "server-only") return {};
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id.startsWith("@/")) return load(path.join(root, "src", `${id.slice(2)}.ts`));
      if (id.startsWith(".")) {
        const resolved = path.resolve(path.dirname(file), id);
        return id.endsWith(".json") ? JSON.parse(fs.readFileSync(resolved, "utf8")) : load(`${resolved}.ts`);
      }
      return require(id);
    }
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename: file })(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load(path.isAbsolute(name) ? name : path.join(serviceRoot, `${name}.ts`));
}

function configure(t, extra = {}) {
  const values = {
    NODE_ENV: "test", EVE_PR3_PILOT_AUTH_MODE: "supabase_user",
    NEXT_PUBLIC_EVE_PR3_SUPABASE_URL: url,
    NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_noncredential_unit_fixture",
    EVE_PR3_EXPECTED_PROJECT_REF: ref,
    EVE_PR3_PILOT_SCOPE_REF: "CASE-P4-QA", EVE_PR3_PILOT_ACTIVITY_REF: "ACT-P4-QA",
    EVE_PR3_RUNTIME_ADAPTER: "blocked",
    EVE_PR3_ACTION_TOKEN_SECRET: randomBytes(32).toString("hex"), ...extra,
  };
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
}

function token(issuer = `${url}/auth/v1`, role = "authenticated") {
  return `unit.${Buffer.from(JSON.stringify({ iss: issuer, role })).toString("base64url")}.invalid-signature`;
}
function request(value) { return { headers: new Headers(value ? { Authorization: `Bearer ${value}`, "x-eve-pr3-principal-ref": "forged-browser-principal" } : {}) }; }

test("missing bearer and foreign issuer reject before calling Auth", async t => {
  configure(t);
  let calls = 0;
  const { resolvePr3Principal } = loadService("auth", { "@supabase/supabase-js": { createClient() { calls++; throw new Error("must not call"); } } });
  await assert.rejects(resolvePr3Principal(request()), error => error.status === 401);
  await assert.rejects(resolvePr3Principal(request(token("https://foreign.invalid/auth/v1"))), error => error.status === 401);
  await assert.rejects(resolvePr3Principal(request("malformed")), error => error.status === 401);
  assert.equal(calls, 0);
});

test("matching issuer is insufficient without server verification", async t => {
  configure(t);
  const { resolvePr3Principal } = loadService("auth", { "@supabase/supabase-js": { createClient: () => ({ auth: { getUser: async () => ({ data: { user: null }, error: { message: "invalid signature" } }) } }) } });
  await assert.rejects(resolvePr3Principal(request(token())), error => error.status === 401);
});

test("verified user sets principal and scope server-side (mock Auth only)", async t => {
  configure(t);
  const { resolvePr3Principal } = loadService("auth", { "@supabase/supabase-js": { createClient: (host, key, options) => {
    assert.equal(host, url);
    assert.equal(options.auth.persistSession, false);
    return { auth: { getUser: async value => { assert.equal(value, token()); return { data: { user: { id: "verified-user", is_anonymous: false } }, error: null }; } } };
  } } });
  const principal = await resolvePr3Principal(request(token()));
  assert.equal(principal.principal_ref, `supabase:${ref}:verified-user`);
  assert.equal(principal.scope_ref, "CASE-P4-QA");
  assert.equal(principal.auth_mode, "supabase_user");
});

test("production forbids local and static bearer authentication", async t => {
  configure(t, { NODE_ENV: "production", EVE_PR3_PILOT_AUTH_MODE: "local_test" });
  const { resolvePr3Principal } = loadService("auth");
  await assert.rejects(resolvePr3Principal(request()), /forbidden_in_production/);
  process.env.EVE_PR3_PILOT_AUTH_MODE = "static_bearer";
  await assert.rejects(resolvePr3Principal(request()), /forbidden_in_production/);
});

test("database guard checks host and pooler user instead of substring", () => {
  const { validatePr3DatabaseTarget } = loadService("target");
  assert.doesNotThrow(() => validatePr3DatabaseTarget(`postgresql://postgres@db.${ref}.supabase.co:5432/postgres`, ref));
  assert.doesNotThrow(() => validatePr3DatabaseTarget(`postgresql://postgres.${ref}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`, ref));
  for (const invalid of [
    `postgresql://postgres@wrong.invalid/postgres?note=${ref}`,
    `postgresql://postgres.${ref}@wrong.invalid/postgres`,
    `postgresql://postgres.other@aws-0-us-east-1.pooler.supabase.com/postgres?note=${ref}`,
    `https://db.${ref}.supabase.co/postgres`,
    `postgresql://postgres@db.${ref}.supabase.co/postgres?sslmode=disable`,
  ]) assert.throws(() => validatePr3DatabaseTarget(invalid, ref), /pr3_clean_database_target_mismatch/);
  assert.throws(() => validatePr3DatabaseTarget(`postgresql://postgres@db.${ref}.supabase.co/postgres`, "other"), /pr3_clean_database_target_mismatch/);
});

test("target mismatch creates zero pools and zero database side effects", async t => {
  configure(t, { EVE_PR3_DATABASE_URL: `postgresql://postgres@wrong.invalid/postgres?ref=${ref}` });
  let allocations = 0;
  const { PostgresPr3Repository } = loadService("repository", { pg: { Pool: class { constructor() { allocations++; } } } });
  const health = await new PostgresPr3Repository().health();
  assert.equal(health.ok, false);
  assert.equal(health.detail, "pr3_clean_database_target_mismatch");
  assert.equal(allocations, 0);
});

test("receipt retry and conflict exercise the actual execution service", async t => {
  configure(t);
  const { MemoryPr3Repository } = loadService("repository");
  const { Pr3ExecutionService, isPr3CommandConflict } = loadService("execution-service");
  const repo = new MemoryPr3Repository();
  const service = new Pr3ExecutionService(repo);
  const principal = { principal_ref: "qa-unit", scope_ref: "CASE-P4-QA", activity_ref: "ACT-P4-QA", auth_mode: "local_test" };
  const input = { token_request_id: "retry-identity", operation: "OPEN_OR_RESUME" };
  const first = await service.issueActionToken(principal, input);
  const retry = await service.issueActionToken(principal, input);
  assert.equal(retry.action_token, first.action_token);
  assert.equal(retry.client_event_id, first.client_event_id);
  assert.equal(retry.command_receipt.receipt_state, "IDEMPOTENT_REPLAY");
  assert.equal(repo.debug().receipts.size, 1);
  await assert.rejects(service.issueActionToken(principal, { ...input, context_revision: "different-payload" }), isPr3CommandConflict);
  const command = { action_token: first.action_token, client_event_id: first.client_event_id, mode: "OPEN_OR_RESUME", scope_ref: principal.scope_ref, activity_ref: principal.activity_ref, expected_chain_definition_id: "EVE-PR3-B0-B2-CHAIN", expected_chain_definition_revision: "1.0" };
  const blocked = await service.openOrResume(principal, command);
  assert.equal(blocked.error, "PROMOTED_RUNTIME_ADAPTER_NOT_DEPLOYED");
  assert.equal(blocked.command_receipt.receipt_state, "REJECTED_PRECONDITION");
  assert.equal(repo.debug().projections.size, 0);
  assert.equal(repo.debug().audits.length, 0);
  const before = repo.debug().receipts.size;
  assert.equal(await service.readState("unknown"), null);
  assert.equal(repo.debug().receipts.size, before);
});

test("unknown errors do not expose database credentials to clients", async () => {
  const { safeError } = loadService("http");
  const response = safeError(new Error("postgresql://user:password@db.invalid/postgres"));
  const payload = await response.json();
  assert.equal(payload.error, "pr3_service_unavailable");
  assert.ok(!JSON.stringify(payload).includes("password"));
});

test("A06 v1.4 contains the live 32-record 360-field successor", () => {
  const mapping = JSON.parse(fs.readFileSync(path.join(root, "pr3/authority/A06_PR3_AUTHORITATIVE_PERSISTENCE_MAPPING_v1_4.json"), "utf8"));
  assert.equal(mapping.logical_records.length, 32);
  assert.equal(mapping.logical_records.reduce((sum, record) => sum + record.fields.length, 0), 360);
});

test("health endpoint requires its own proof and cannot bypass business authentication", async t => {
  configure(t, { NODE_ENV: "production", EVE_PR3_PERSISTENCE_MODE: "postgres", EVE_PR3_DATABASE_URL: "" });
  const { GET } = loadService(path.join(root, "src/app/api/eve/pr3/pilot/health/route.ts"));
  const response = await GET({ headers: new Headers() });
  assert.equal(response.status, 401);
});

test("protected health reports missing DSN and proves guard/runtime rejection without opening Pools", async t => {
  configure(t, { NODE_ENV: "production", EVE_PR3_PERSISTENCE_MODE: "postgres", EVE_PR3_DATABASE_URL: "" });
  let pools = 0;
  const { GET } = loadService(path.join(root, "src/app/api/eve/pr3/pilot/health/route.ts"), { pg: { Pool: class { constructor() { pools++; throw new Error("must not allocate"); } } } });
  const proof = createHmac("sha256", process.env.EVE_PR3_ACTION_TOKEN_SECRET).update("EVE_PR3_P4_HEALTH_V1").digest("hex");
  const response = await GET({ headers: new Headers({ "x-eve-pr3-health-proof": proof }) });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.database.code, "CLEAN_PR3_DATABASE_SECRET_UNAVAILABLE_TO_EXECUTION_CONTEXT");
  assert.equal(body.wrong_target_guard, true);
  assert.deepEqual(body.runtime, { fail_closed: true, code: "PROMOTED_RUNTIME_ADAPTER_NOT_DEPLOYED" });
  assert.equal(pools, 0);
});
