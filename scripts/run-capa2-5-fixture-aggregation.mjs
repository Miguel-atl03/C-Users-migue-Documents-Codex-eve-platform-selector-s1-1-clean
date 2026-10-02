import fs from "node:fs/promises";
import path from "node:path";

import { aggregateClientCausalOutputs } from "../src/services/client-causal-aggregation-engine.ts";

const repoRoot = process.cwd();
const baseUrl = process.env.EVE_BASE_URL ?? "http://localhost:3000";
const fixtureFile =
  process.argv[2] ??
  path.join(repoRoot, "fixtures", "manufactura-assisted-multisession-result-1778807372647.json");

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

const fixture = JSON.parse(await fs.readFile(fixtureFile, "utf8"));
const roleSessions = fixture.roleSessions ?? [];
const empresaId = `fixture-client-${path.basename(fixtureFile, ".json")}`;

const inputs = [];

for (const role of roleSessions) {
  const diagnostic = await postJson("/api/causal/diagnostic", {
    sessionId: role.sessionId,
    persist: false,
  });
  const output = diagnostic.output;
  inputs.push({
    empresa_id: empresaId,
    sesion_id: role.sessionId,
    usuario_id: null,
    role_label: role.roleName ?? role.roleHeader ?? null,
    role_observation_position: {
      sesion_id: role.sessionId,
      usuario_id: null,
      role_label: role.roleName ?? role.roleHeader ?? null,
      observation_scope: "partial_role_lens_on_client_system",
      interpretation_unit: "client_system",
      note:
        "Validacion por fixture: las sesiones historicas pueden no compartir empresa_id en Supabase, pero se tratan como lentes del mismo caso de prueba.",
    },
    session_causal_output_id:
      role.causalSummary?.sessionCausalOutputId ?? `fixture-${role.sessionId}`,
    output,
  });
  console.log(`Loaded role lens ${role.roleNumber ?? inputs.length}: ${role.roleName}`);
}

const output = aggregateClientCausalOutputs(inputs);
const timestamp = Date.now();
const jsonPath = path.join(
  repoRoot,
  "fixtures",
  `capa2-5-fixture-aggregation-result-${timestamp}.json`,
);
await fs.writeFile(jsonPath, JSON.stringify({ fixtureFile, output }, null, 2), "utf8");

console.log(`Capa 2.5 fixture aggregation JSON: ${path.relative(repoRoot, jsonPath)}`);
console.log(
  JSON.stringify(
    {
      clientRoot: output.client_root_node_probable?.node_label ?? null,
      confidence: output.confidence_level_client,
      rolePerspectiveCount: output.role_perspective_map.length,
      supportingRoles: output.sessions_that_support.map((item) => item.role_label),
      weakeningRoles: output.sessions_that_weaken.map((item) => item.role_label),
      contradictions: output.cross_session_contradictions.length,
      needsExpertReview: output.needs_expert_review_client,
    },
    null,
    2,
  ),
);
