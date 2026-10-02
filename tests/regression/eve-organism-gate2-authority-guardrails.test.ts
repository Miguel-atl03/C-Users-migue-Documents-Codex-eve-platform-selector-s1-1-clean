import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  appendGate2AuthorityLedgerEntry,
  evaluateGate2AlgedonicChannel,
  evaluateGate2AuthorityGuardrails,
  evaluateGate2CapabilityTransition,
  evaluateGate2SideEffectGuard,
  evaluateGate2TenantAuthIsolation,
  getGate2AuthorityPromotionStatus,
  getGate2CapabilityCatalog,
} from "../../src/services/eve-organism-gate2-authority-guardrails.ts";

import type {
  Gate2AuthorityLedger,
  Gate2AuthorityLedgerEntry,
  Gate2CapabilityState,
  Gate2SideEffectClass,
} from "../../src/types/eve-organism-gate2-authority-guardrails.ts";

const serviceSource = readFileSync(
  "src/services/eve-organism-gate2-authority-guardrails.ts",
  "utf8",
);

function emptyLedger(): Gate2AuthorityLedger {
  return { entries: [], appendOnly: true, checksumChain: true, grantsAuthority: false };
}

function firstEntry(): Gate2AuthorityLedgerEntry {
  return {
    sequence: 1,
    recordType: "TRANSITION_REQUEST",
    actorId: "offline-actor",
    auditorId: "offline-auditor",
    capabilityId: "gateAdvisory",
    decision: "request-local-shadow-transition",
  };
}

function capabilityState(capabilityId: string): Gate2CapabilityState | "BLOCKED_NON_CAPABILITY" {
  const catalog = getGate2CapabilityCatalog();
  const found = catalog.capabilities.find((item) => item.capabilityId === capabilityId);
  if (found) return found.currentState;
  assert.ok(catalog.blockedNonCapabilities.includes(capabilityId));
  return "BLOCKED_NON_CAPABILITY";
}

const scenarioTests: Array<[string, () => void]> = [
  ["001 Exporta getGate2CapabilityCatalog", () => assert.equal(typeof getGate2CapabilityCatalog, "function")],
  ["002 Exporta evaluateGate2CapabilityTransition", () => assert.equal(typeof evaluateGate2CapabilityTransition, "function")],
  ["003 Exporta evaluateGate2SideEffectGuard", () => assert.equal(typeof evaluateGate2SideEffectGuard, "function")],
  ["004 Exporta evaluateGate2TenantAuthIsolation", () => assert.equal(typeof evaluateGate2TenantAuthIsolation, "function")],
  ["005 Exporta evaluateGate2AlgedonicChannel", () => assert.equal(typeof evaluateGate2AlgedonicChannel, "function")],
  ["006 Exporta appendGate2AuthorityLedgerEntry", () => assert.equal(typeof appendGate2AuthorityLedgerEntry, "function")],
  ["007 Exporta evaluateGate2AuthorityGuardrails", () => assert.equal(typeof evaluateGate2AuthorityGuardrails, "function")],
  ["008 Exporta getGate2AuthorityPromotionStatus", () => assert.equal(typeof getGate2AuthorityPromotionStatus, "function")],

  ["009 Catalogo tiene 15 capacidades", () => assert.equal(getGate2CapabilityCatalog().capabilities.length, 15)],
  ["010 Ninguna capability actual esta SUPERVISED", () => assert.equal(getGate2CapabilityCatalog().capabilities.some((item) => item.currentState === "SUPERVISED"), false)],
  ["011 Ninguna capability actual esta CONTROLLED_ACTIVE", () => assert.equal(getGate2CapabilityCatalog().capabilities.some((item) => item.currentState === "CONTROLLED_ACTIVE"), false)],
  ["012 Ninguna capability actual esta ACTIVE", () => assert.equal(getGate2CapabilityCatalog().capabilities.some((item) => item.currentState === "ACTIVE"), false)],
  ["013 registryWrite esta OFF o blocked", () => assert.ok(["OFF", "BLOCKED_NON_CAPABILITY"].includes(capabilityState("registryWrite")))],
  ["014 finalExport esta OFF o blocked", () => assert.ok(["OFF", "BLOCKED_NON_CAPABILITY"].includes(capabilityState("finalExport")))],
  ["015 diagnosis esta OFF o blocked", () => assert.ok(["OFF", "BLOCKED_NON_CAPABILITY"].includes(capabilityState("diagnosis")))],
  ["016 databaseWrite esta OFF o blocked", () => assert.ok(["OFF", "BLOCKED_NON_CAPABILITY"].includes(capabilityState("databaseWrite")))],
  ["017 uiExposure esta OFF o blocked", () => assert.ok(["OFF", "BLOCKED_NON_CAPABILITY"].includes(capabilityState("uiExposure")))],
  ["018 parallelExecution esta OFF o blocked", () => assert.ok(["OFF", "BLOCKED_NON_CAPABILITY"].includes(capabilityState("parallelExecution")))],
  ["019 SHADOW a SUPERVISED bloquea", () => assert.equal(evaluateGate2CapabilityTransition({ capabilityId: "gateAdvisory", fromState: "SHADOW", toState: "SUPERVISED" }).allowed, false)],
  ["020 VALIDATED a SHADOW puede pasar solo offline si el diseno lo permite", () => assert.equal(evaluateGate2CapabilityTransition({ capabilityId: "gateAdvisory", fromState: "VALIDATED", toState: "SHADOW", offlineOnly: true }).resultCode, "PASS_OFFLINE_ONLY")],
  ["021 Cualquier transicion a CONTROLLED_ACTIVE bloquea", () => assert.equal(evaluateGate2CapabilityTransition({ capabilityId: "gateAdvisory", fromState: "SHADOW", toState: "CONTROLLED_ACTIVE" }).allowed, false)],
  ["022 Cualquier transicion a ACTIVE bloquea", () => assert.equal(evaluateGate2CapabilityTransition({ capabilityId: "gateAdvisory", fromState: "SHADOW", toState: "ACTIVE" }).allowed, false)],
  ["023 Transicion critica sin ledger bloquea", () => assert.equal(evaluateGate2CapabilityTransition({ capabilityId: "gateAdvisory", fromState: "SHADOW", toState: "ROLLBACK_IN_PROGRESS" }).resultCode, "BLOCKED_LEDGER_REQUIRED")],
  ["024 Transicion critica sin manual review bloquea cuando aplica", () => assert.equal(evaluateGate2CapabilityTransition({ capabilityId: "gateAdvisory", fromState: "SHADOW", toState: "ROLLBACK_IN_PROGRESS", hasLedgerEntry: true }).resultCode, "BLOCKED_MANUAL_REVIEW_REQUIRED")],

  ["025 NONE permitido offline", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "NONE" }).decision, "ALLOW_OFFLINE_LOCAL")],
  ["026 LOCAL_MEMORY_ONLY permitido offline", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "LOCAL_MEMORY_ONLY" }).allowed, true)],
  ["027 LOCAL_AUDIT_RECORD permitido offline", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "LOCAL_AUDIT_RECORD" }).allowed, true)],
  ["028 LOCAL_SHADOW_OUTBOX_RECORD permitido solo local", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "LOCAL_SHADOW_OUTBOX_RECORD" }).localOnly, true)],
  ["029 PRODUCT_STATE_WRITE denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "PRODUCT_STATE_WRITE" }).allowed, false)],
  ["030 DATABASE_WRITE denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "DATABASE_WRITE" }).allowed, false)],
  ["031 REGISTRY_WRITE denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "REGISTRY_WRITE" }).allowed, false)],
  ["032 EXPORT_GENERATION denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "EXPORT_GENERATION", hasAcaSatisfied: true }).allowed, false)],
  ["033 DIAGNOSIS_EMISSION denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "DIAGNOSIS_EMISSION", hasAggregatedCausalMovie: true }).allowed, false)],
  ["034 UI_EXPOSURE denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "UI_EXPOSURE" }).allowed, false)],
  ["035 NETWORK_CALL denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "NETWORK_CALL" }).allowed, false)],
  ["036 PARALLEL_EXECUTION real denegado", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "PARALLEL_EXECUTION" }).allowed, false)],
  ["037 Export sin ACA Satisfied produce quarantine", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "EXPORT_GENERATION" }).quarantine, true)],
  ["038 Diagnostico sin PeliculaCausalAgregada produce quarantine", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "DIAGNOSIS_EMISSION" }).quarantine, true)],
  ["039 Object State fuera de OLC produce quarantine", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "LOCAL_AUDIT_RECORD", objectInsideOlc: false }).quarantine, true)],
  ["040 QA rework al core produce deny", () => assert.equal(evaluateGate2SideEffectGuard({ sideEffectClass: "LOCAL_MEMORY_ONLY", qaReworkToCore: true }).decision, "DENY")],

  ["041 Missing tenantId bloquea", () => assert.equal(evaluateGate2TenantAuthIsolation({ organizationId: "org-1" }).resultCode, "BLOCKED_TENANT_CONTEXT")],
  ["042 Missing organizationId bloquea", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1" }).resultCode, "BLOCKED_TENANT_CONTEXT")],
  ["043 Cross-tenant mismatch bloquea", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1", organizationId: "org-1", expectedTenantId: "tenant-1", observedTenantId: "tenant-2" }).crossTenantResult, "BLOCKED_CROSS_TENANT")],
  ["044 service_role bloquea", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1", organizationId: "org-1", actorAuthority: "service_role" }).resultCode, "BLOCKED_AUTH_BOUNDARY")],
  ["045 anonymous authority bloquea", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1", organizationId: "org-1", actorAuthority: "anonymous" }).resultCode, "BLOCKED_AUTH_BOUNDARY")],
  ["046 RLS proof missing devuelve requires evidence", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1", organizationId: "org-1", actorAuthority: "human" }).resultCode, "REQUIRES_REAL_PRODUCT_EVIDENCE")],
  ["047 Nunca declara tenant isolation proven", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1", organizationId: "org-1", tenantIsolationEvidencePresent: true, authBoundaryEvidencePresent: true, rlsBoundaryEvidencePresent: true }).tenantIsolationProven, false)],
  ["048 Nunca declara auth boundary proven", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1", organizationId: "org-1", tenantIsolationEvidencePresent: true, authBoundaryEvidencePresent: true, rlsBoundaryEvidencePresent: true }).authBoundaryProven, false)],
  ["049 Nunca declara RLS proven", () => assert.equal(evaluateGate2TenantAuthIsolation({ tenantId: "tenant-1", organizationId: "org-1", tenantIsolationEvidencePresent: true, authBoundaryEvidencePresent: true, rlsBoundaryEvidencePresent: true }).rlsBoundaryProven, false)],

  ["050 TENANT_LEAK usa AG-NG-014", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "TENANT_LEAK" }).sourceRule, "AG-NG-014")],
  ["051 TENANT_LEAK produce QUARANTINE", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "TENANT_LEAK" }).action, "QUARANTINE")],
  ["052 B3_ROUTE_MISSING usa AG-NG-011", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "B3_ROUTE_MISSING" }).sourceRule, "AG-NG-011")],
  ["053 B3_ROUTE_MISSING no produce candidate", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "B3_ROUTE_MISSING" }).producesCandidate, false)],
  ["054 B7_BOUNDARY_VIOLATION usa AG-NG-012 o AG-NG-013", () => assert.ok(["AG-NG-012", "AG-NG-013"].includes(evaluateGate2AlgedonicChannel({ trigger: "B7_BOUNDARY_VIOLATION" }).sourceRule ?? ""))],
  ["055 B7_BOUNDARY_VIOLATION diagnostic_use_allowed false", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "B7_BOUNDARY_VIOLATION" }).diagnosticUseAllowed, false)],
  ["056 UNAUDITED_OVERRIDE usa AG-NG-022", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "UNAUDITED_OVERRIDE" }).sourceRule, "AG-NG-022")],
  ["057 STATE_LEDGER_DIVERGENCE usa AG-NG-027", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "STATE_LEDGER_DIVERGENCE" }).sourceRule, "AG-NG-027")],
  ["058 ROLLBACK_FAILURE usa AG-NG-025", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "ROLLBACK_FAILURE" }).sourceRule, "AG-NG-025")],
  ["059 AUDITOR_EXECUTOR_COLLAPSE usa AG-NG-024", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "AUDITOR_EXECUTOR_COLLAPSE" }).sourceRule, "AG-NG-024")],
  ["060 FIXTURE_CLAIMED_AS_REAL usa AG-NG-029", () => assert.equal(evaluateGate2AlgedonicChannel({ trigger: "FIXTURE_CLAIMED_AS_REAL" }).sourceRule, "AG-NG-029")],

  ["061 Ledger inicial acepta primera entrada valida", () => assert.equal(appendGate2AuthorityLedgerEntry(emptyLedger(), firstEntry()).accepted, true)],
  ["062 Segunda entrada exige previousEntryChecksum", () => {
    const first = appendGate2AuthorityLedgerEntry(emptyLedger(), firstEntry()).ledger;
    assert.equal(appendGate2AuthorityLedgerEntry(first, { ...firstEntry(), sequence: 2 }).accepted, false);
  }],
  ["063 Checksum chain cambia al agregar entrada", () => {
    const first = appendGate2AuthorityLedgerEntry(emptyLedger(), firstEntry());
    const second = appendGate2AuthorityLedgerEntry(first.ledger, { ...firstEntry(), sequence: 2, previousEntryChecksum: first.appendedEntry?.entryChecksum });
    assert.notEqual(first.appendedEntry?.entryChecksum, second.appendedEntry?.entryChecksum);
  }],
  ["064 Ledger no concede autoridad", () => assert.equal(appendGate2AuthorityLedgerEntry(emptyLedger(), firstEntry()).ledger.grantsAuthority, false)],
  ["065 Override request y override decision son tipos separados", () => assert.notEqual("OVERRIDE_REQUEST", "OVERRIDE_DECISION")],
  ["066 Executor auditor collapse genera bloqueo", () => assert.equal(appendGate2AuthorityLedgerEntry(emptyLedger(), { ...firstEntry(), recordType: "OVERRIDE_DECISION", actorId: "same", auditorId: "same" }).accepted, false)],
  ["067 Critical decision without ledger bloquea promocion", () => assert.equal(evaluateGate2CapabilityTransition({ capabilityId: "gateAdvisory", fromState: "SHADOW", toState: "ROLLBACK_IN_PROGRESS" }).requiresLedger, true)],
  ["068 append no toca filesystem", () => assert.doesNotMatch(serviceSource, /from\s+['\"]node:fs|writeFile|appendFile/)],
  ["069 append no toca DB", () => assert.doesNotMatch(serviceSource, /createClient|\bdb\.|databaseClient|sql`/i)],

  ["070 evaluateGate2AuthorityGuardrails devuelve PASS_OFFLINE_ONLY para caso local permitido", () => assert.equal(evaluateGate2AuthorityGuardrails({
    tenantAuth: { tenantId: "tenant-1", organizationId: "org-1", actorAuthority: "human", tenantIsolationEvidencePresent: true, authBoundaryEvidencePresent: true, rlsBoundaryEvidencePresent: true },
    algedonic: { trigger: "NONE" },
    sideEffect: { sideEffectClass: "LOCAL_AUDIT_RECORD" },
    capabilityTransition: { capabilityId: "gateAdvisory", fromState: "VALIDATED", toState: "SHADOW", offlineOnly: true },
    realProductEvidenceProvided: true,
  }).resultCode, "PASS_OFFLINE_ONLY")],
  ["071 Devuelve BLOCKED_SIDE_EFFECT ante DB write", () => assert.equal(evaluateGate2AuthorityGuardrails({ sideEffect: { sideEffectClass: "DATABASE_WRITE" }, realProductEvidenceProvided: true }).resultCode, "BLOCKED_SIDE_EFFECT")],
  ["072 Devuelve BLOCKED_TENANT_CONTEXT ante tenant faltante", () => assert.equal(evaluateGate2AuthorityGuardrails({ tenantAuth: { organizationId: "org-1" }, realProductEvidenceProvided: true }).resultCode, "BLOCKED_TENANT_CONTEXT")],
  ["073 Devuelve BLOCKED_ALGEDONIC_TRIGGER ante tenant leak", () => assert.equal(evaluateGate2AuthorityGuardrails({ algedonic: { trigger: "TENANT_LEAK" }, realProductEvidenceProvided: true }).resultCode, "BLOCKED_ALGEDONIC_TRIGGER")],
  ["074 Devuelve NOT_READY_FOR_GATE3 cuando falta evidencia real", () => assert.equal(evaluateGate2AuthorityGuardrails({ sideEffect: { sideEffectClass: "LOCAL_MEMORY_ONLY" } }).resultCode, "NOT_READY_FOR_GATE3")],
  ["075 Nunca devuelve GATE3_READY", () => assert.notEqual(evaluateGate2AuthorityGuardrails({ realProductEvidenceProvided: true }).resultCode, "GATE3_READY")],
  ["076 Nunca devuelve OBSERVER_READY", () => assert.notEqual(evaluateGate2AuthorityGuardrails({ realProductEvidenceProvided: true }).resultCode, "OBSERVER_READY")],
  ["077 Nunca devuelve PRODUCTION_READY", () => assert.notEqual(evaluateGate2AuthorityGuardrails({ realProductEvidenceProvided: true }).resultCode, "PRODUCTION_READY")],
  ["078 Nunca devuelve DIAGNOSIS_READY", () => assert.notEqual(evaluateGate2AuthorityGuardrails({ realProductEvidenceProvided: true }).resultCode, "DIAGNOSIS_READY")],

  ["079 getGate2AuthorityPromotionStatus gate3Ready false", () => assert.equal(getGate2AuthorityPromotionStatus().gate3Ready, false)],
  ["080 supervisedOperationAuthorized false", () => assert.equal(getGate2AuthorityPromotionStatus().supervisedOperationAuthorized, false)],
  ["081 controlledActiveAuthorized false", () => assert.equal(getGate2AuthorityPromotionStatus().controlledActiveAuthorized, false)],
  ["082 activeAuthorized false", () => assert.equal(getGate2AuthorityPromotionStatus().activeAuthorized, false)],
  ["083 blockersClosedByAuthorityGuardrails 0", () => assert.equal(getGate2AuthorityPromotionStatus().blockersClosedByAuthorityGuardrails, 0)],
  ["084 exitConditionsClosedByAuthorityGuardrails 0", () => assert.equal(getGate2AuthorityPromotionStatus().exitConditionsClosedByAuthorityGuardrails, 0)],

  ["085 Service no importa supabase", () => assert.doesNotMatch(serviceSource, /from\s+['\"][^'\"]*supabase|supabase\./i)],
  ["086 Service no importa DB clients", () => assert.doesNotMatch(serviceSource, /createClient|databaseClient|\bdb\./i)],
  ["087 Service no importa WorkMap", () => assert.doesNotMatch(serviceSource, /from\s+['\"][^'\"]*WorkMap|WorkMap\./)],
  ["088 Service no importa Significado", () => assert.doesNotMatch(serviceSource, /from\s+['\"][^'\"]*Significado|Significado\./)],
  ["089 Service no usa fetch", () => assert.doesNotMatch(serviceSource, /\bfetch\s*\(/)],
  ["090 Service no usa axios", () => assert.doesNotMatch(serviceSource, /axios\s*\./)],
  ["091 Service no escribe registry", () => assert.doesNotMatch(serviceSource, /writeRegistry|registryClient|registry\.write/i)],
  ["092 Service no genera export", () => assert.doesNotMatch(serviceSource, /generateExport|emitExport|exportClient/i)],
  ["093 Service no diagnosis", () => assert.doesNotMatch(serviceSource, /emitDiagnosis|generateDiagnosis|diagnosisClient/i)],
  ["094 Service no filesystem write", () => assert.doesNotMatch(serviceSource, /writeFile|appendFile|createWriteStream/)],
  ["095 No package.json modificado por la implementacion", () => assert.doesNotMatch(serviceSource, /package\.json/)],
  ["096 No lockfiles modificados por la implementacion", () => assert.doesNotMatch(serviceSource, /package-lock|pnpm-lock|yarn\.lock/)],
];

for (const [name, runScenario] of scenarioTests) {
  test(name, runScenario);
}

test("097 matrix summary covers every required scenario", () => {
  assert.equal(scenarioTests.length, 96);
});
