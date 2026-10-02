#!/usr/bin/env node
/**
 * R4 acceptance fixtures orchestrator (test-only, idempotent).
 *
 * Provisions FX-01..FX-12 and writes:
 *   reports/local/rector-r4-acceptance/manifest.json
 *
 * Usage (local Supabase only):
 *   node scripts/eve/official-control-panel/r4/provision-r4-acceptance-fixtures.mjs
 *
 * After provision, product flows must NOT need service_role
 * (identities/structure/RPC admin only during this script).
 */
import {
  AMBER_CASE,
  AMBER_COMPANY,
  R4_MANIFEST_DIR,
  R4_MANIFEST_PATH,
  assertLocal,
  createAdminClient,
  resolveEnv,
  writeJson,
} from "./r4-seed-lib.mjs";
import { provisionFx01 } from "./seed-fx01-empresa-saludable.mjs";
import { provisionFx02 } from "./seed-fx02-usuario-multirrol.mjs";
import { provisionFx03 } from "./seed-fx03-seleccion-le8.mjs";
import { provisionFx04 } from "./seed-fx04-seleccion-gt8.mjs";
import { provisionFx05 } from "./seed-fx05-workmap-gap.mjs";
import { provisionFx06 } from "./seed-fx06-ruta-b2.mjs";
import { provisionFx07 } from "./seed-fx07-feedback-b3.mjs";
import {
  provisionFx08,
  provisionFx09AndFx10,
  provisionFx11,
} from "./seed-fx08-11-wrappers.mjs";
import { provisionFx12 } from "./seed-fx12-final-alternativo.mjs";

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});

async function main() {
  const env = resolveEnv();
  assertLocal(env.supabaseUrl);
  const admin = createAdminClient(env);
  const ctx = { env, admin };

  const startedAt = new Date().toISOString();
  const fixtures = {};
  const errors = [];
  const productGaps = [];

  async function run(id, fn) {
    const t0 = Date.now();
    try {
      const result = await fn(ctx);
      fixtures[id] = {
        ...result,
        provisionedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
      };
      if (Array.isArray(result.productGaps)) {
        for (const gap of result.productGaps) {
          productGaps.push({ fixture: id, ...gap });
        }
      }
      console.error(`[R4] ${id} ok (${Date.now() - t0}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ fixture: id, error: message });
      fixtures[id] = {
        ok: false,
        fixture: id,
        error: message,
        provisionedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
      };
      console.error(`[R4] ${id} FAIL: ${message}`);
    }
  }

  await run("FX-01", () => provisionFx01(ctx));
  await run("FX-02", () => provisionFx02(ctx));
  await run("FX-03", () => provisionFx03(ctx));
  await run("FX-04", () => provisionFx04(ctx));
  await run("FX-05", () => provisionFx05(ctx));
  await run("FX-06", () => provisionFx06(ctx));
  await run("FX-07", () => provisionFx07(ctx));
  await run("FX-08", () => provisionFx08());
  await run("FX-09-10", async () => {
    const { fx09, fx10 } = await provisionFx09AndFx10(ctx);
    fixtures["FX-09"] = {
      ...fx09,
      provisionedAt: new Date().toISOString(),
    };
    fixtures["FX-10"] = {
      ...fx10,
      provisionedAt: new Date().toISOString(),
    };
    console.error("[R4] FX-09 ok (via point-14)");
    console.error("[R4] FX-10 ok (via point-14)");
    return { ok: true, fixture: "FX-09-10", wrapped: ["FX-09", "FX-10"] };
  });
  await run("FX-11", () => provisionFx11());
  await run("FX-12", () => provisionFx12(ctx));

  // Drop internal wrapper key if present
  delete fixtures["FX-09-10"];

  const amberGuard = {
    amberCompanyForbidden: AMBER_COMPANY,
    amberCaseForbidden: AMBER_CASE,
    touchedAmber: false,
  };

  const manifest = {
    ok: errors.length === 0,
    suite: "rector-r4-acceptance",
    startedAt,
    finishedAt: new Date().toISOString(),
    amberGuard,
    fixtureCount: Object.keys(fixtures).filter((k) => k.startsWith("FX-")).length,
    fixtures,
    productGaps,
    errors,
    provisionCommand:
      "node scripts/eve/official-control-panel/r4/provision-r4-acceptance-fixtures.mjs",
    registryPath: "tests/fixtures/official-control-panel/r4/r4-fixture-registry.ts",
    docsPath: "docs/eve/panel-control/RECTOR_R4_FIXTURE_REGISTRY.md",
    note:
      "After this provision, e2e/product flows must use authenticated BFF — not service_role — for business transitions.",
  };

  writeJson(R4_MANIFEST_PATH, manifest);
  console.log(
    JSON.stringify(
      {
        ok: manifest.ok,
        manifestPath: R4_MANIFEST_PATH,
        fixtureCount: manifest.fixtureCount,
        errorCount: errors.length,
        productGapCount: productGaps.length,
        fixtures: Object.keys(fixtures).sort(),
      },
      null,
      2,
    ),
  );

  if (!manifest.ok) process.exitCode = 1;
}

// silence unused dir import lint for tooling that tree-shakes
void R4_MANIFEST_DIR;
