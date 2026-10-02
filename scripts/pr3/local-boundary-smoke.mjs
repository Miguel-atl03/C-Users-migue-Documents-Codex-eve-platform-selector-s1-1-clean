import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const base = "http://127.0.0.1:3001";
const evidence = { base, deployment: "LOCAL_ONLY", tests: [] };
const routes = [
  ["GET", "state"],
  ["POST", "action-token"],
  ["POST", "respond"],
  ["POST", "correct"],
  ["POST", "open-or-resume"],
  ["POST", "resume"],
];
for (const [method, route] of routes) {
  const response = await fetch(`${base}/api/eve/pr3/pilot/runtime/${route}`, { method });
  const body = await response.json();
  assert.equal(response.status, 401, route);
  assert.equal(body.error, "pr3_auth_required", route);
  evidence.tests.push({ route, status: response.status, error: body.error });
}
for (const [name, issuer] of [
  ["foreign_issuer_fixture", "https://foreign-project.supabase.co/auth/v1"],
  ["clean_issuer_invalid_signature_fixture", "https://keqrkyumfyhfivllvdbl.supabase.co/auth/v1"],
]) {
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ iss: issuer, role: "authenticated", sub: "00000000-0000-0000-0000-000000000000", exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url"),
    Buffer.alloc(32).toString("base64url"),
  ].join(".");
  const response = await fetch(`${base}/api/eve/pr3/pilot/runtime/state`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json();
  assert.equal(response.status, 401, name);
  assert.equal(body.error, "pr3_clean_auth_token_rejected", name);
  evidence.tests.push({ fixture: name, status: response.status, error: body.error, real_user: false });
}
const frontdoor = await fetch(`${base}/pr3-pilot`);
const html = await frontdoor.text();
assert.equal(frontdoor.status, 200);
assert.ok(html.includes("El acceso al piloto permanece cerrado."));
assert.ok(!html.includes("CASE-LOCAL-PR3"));
evidence.tests.push({ route: "pr3-pilot", status: 200, pilot_gate: "CLOSED" });
evidence.result = "PASS";
fs.mkdirSync(path.join(root, ".tmp"), { recursive: true });
fs.writeFileSync(path.join(root, ".tmp/p4-local-boundary-smoke.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
