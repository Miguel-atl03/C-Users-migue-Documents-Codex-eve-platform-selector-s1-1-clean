#!/usr/bin/env node
/**
 * FX-08/09/10/11 wrappers — reuse existing seeds; map manifests into R4.
 */
import { resolve } from "node:path";
import {
  EMAIL_ADMIN,
  ensureUser,
  mustGrant,
  projectRoot,
  readJsonIfExists,
  runNodeScript,
} from "./r4-seed-lib.mjs";

export async function provisionFx08() {
  runNodeScript(
    "scripts/eve/official-control-panel/seed-fx08-manual-actions-test.mjs",
  );
  const src = readJsonIfExists(
    resolve(projectRoot, "reports/local/rector-r2-fx08/manifest.json"),
  );
  if (!src?.ok && !src?.caseId) {
    throw new Error("fx08_manifest_missing_after_seed");
  }
  return {
    ok: true,
    fixture: "FX-08",
    title: "P-SUP-03 manual",
    reusedSeed: "seed-fx08-manual-actions-test.mjs",
    sourceManifestPath: "reports/local/rector-r2-fx08/manifest.json",
    companyId: src.companyFx08Id ?? src.companyId,
    relationshipId: src.relationshipId,
    caseId: src.caseId,
    caseIdB: src.caseIdB,
    workItems: src.workItems,
    consultants: src.consultants,
    trackingUrl: src.trackingUrl,
    relatedCriteria: ["CP-005", "CP-006", "SEC-001"],
    notes: [
      "Starting state only — transitions via UI→BFF→RPC in e2e.",
      "Reused R2 FX-08 seed as-is.",
    ],
  };
}

export async function provisionFx09AndFx10(ctx) {
  runNodeScript(
    "scripts/eve/official-control-panel/seed-point14-parallel-production-test.mjs",
  );
  const src = readJsonIfExists(
    resolve(projectRoot, "reports/local/rector-point-14/manifest.json"),
  );
  if (!src?.caseFindingsId) {
    throw new Error("point14_manifest_missing_after_seed");
  }

  const actorId = await ensureUser(ctx.admin, EMAIL_ADMIN, ctx.env.password);
  const consultantId = await ensureUser(
    ctx.admin,
    src.consultants.a.email,
    ctx.env.password,
  );
  await mustGrant(
    ctx.admin,
    actorId,
    consultantId,
    src.companyId,
    "manage_parallel_rework",
    "R4 FX-09 authenticated Point-14 lifecycle",
  );
  await mustGrant(
    ctx.admin,
    actorId,
    consultantId,
    src.companyId,
    "attempt_parallel_export",
    "R4 FX-10 authenticated export gate",
  );

  const fx09 = {
    ok: true,
    fixture: "FX-09",
    title: "P-SUP-06 rework",
    reusedSeed: "seed-point14-parallel-production-test.mjs",
    sourceManifestPath: "reports/local/rector-point-14/manifest.json",
    companyId: src.companyId,
    relationshipId: src.relationshipId,
    caseId: src.caseFindingsId,
    packageId: src.packageFindingsId,
    findingIds: src.findingIds,
    lifecycleFindingId: src.findingIds.b7,
    consultants: src.consultants,
    trackingUrl: src.monitoringFindingsUrl,
    relatedCriteria: ["CP-012"],
    notes: [
      "ACA WithFindings + rework finding lifecycle from point-14 seed.",
      "Assert no resolution before reevaluación completada in e2e.",
    ],
  };

  const fx10 = {
    ok: true,
    fixture: "FX-10",
    title: "Export bloqueado",
    reusedSeed: "seed-point14-parallel-production-test.mjs",
    sourceManifestPath: "reports/local/rector-point-14/manifest.json",
    companyId: src.companyId,
    relationshipId: src.relationshipId,
    caseId: src.caseFindingsId,
    packageId: src.packageFindingsId,
    acaStatus: "WithFindings",
    expectedExport: "blocked",
    exportGateCapability: "attempt_parallel_export",
    consultants: src.consultants,
    trackingUrl: src.monitoringFindingsUrl,
    caseSatisfiedId: src.caseSatisfiedId,
    packageSatisfiedId: src.packageSatisfiedId,
    relatedCriteria: ["CP-013", "CP-011"],
    notes: [
      "Export blocked while ACA != Satisfied (findings package).",
      "Do not confuse candidate_export_package with final export.",
    ],
  };

  return { fx09, fx10, source: src };
}

export async function provisionFx11() {
  runNodeScript(
    "scripts/eve/official-control-panel/provision-point15-17-experience-capabilities.mjs",
  );
  const src = readJsonIfExists(
    resolve(projectRoot, "reports/local/rector-points-15-17/manifest.json"),
  );
  if (!src?.caseNormalId && !src?.caseBlockedId) {
    throw new Error("point15_17_manifest_missing_after_seed");
  }
  return {
    ok: true,
    fixture: "FX-11",
    title: "Experiencia soporte",
    reusedSeed: "provision-point15-17-experience-capabilities.mjs",
    sourceManifestPath: "reports/local/rector-points-15-17/manifest.json",
    companyId: src.companyId,
    relationshipId: src.relationshipId,
    caseNormalId: src.caseNormalId,
    caseBlockedId: src.caseBlockedId,
    participantUserId: src.participantUserId,
    consultants: src.consultants,
    experienceJourneysUrl: src.experienceJourneysUrl,
    experienceSupportUrl: src.experienceSupportUrl,
    experienceBlockedUrl: src.experienceBlockedUrl,
    relatedCriteria: ["UX-001", "UX-002", "UX-003", "UX-004", "SEC-001"],
    notes: [
      "Reused §§15–17 experience seed (blocked + message + resume link).",
      "Product events must not use service_role in e2e (BFF authenticated).",
    ],
  };
}
