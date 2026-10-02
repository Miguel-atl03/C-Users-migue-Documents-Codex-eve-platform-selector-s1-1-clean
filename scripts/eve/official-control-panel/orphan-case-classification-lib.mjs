/**
 * Pure classification helpers for Unit 2C orphan cases.
 * No heuristics for company ownership. No DB writes.
 */

export const CLASSIFICATIONS = Object.freeze({
  UNAMBIGUOUS: "unambiguous",
  COMPANY_WITHOUT_RELATIONSHIP: "company-without-relationship",
  AMBIGUOUS_RELATIONSHIP: "ambiguous-relationship",
  AMBIGUOUS_COMPANY: "ambiguous-company",
  INSUFFICIENT_EVIDENCE: "insufficient-evidence",
  INVALID_OR_TECHNICAL: "invalid-or-technical",
});

export const ACTIONS = Object.freeze({
  LINK: "link",
  CREATE_RELATIONSHIP_REVIEW: "create-relationship-review",
  MANUAL_REVIEW: "manual-review",
  RETAIN_UNLINKED: "retain-unlinked",
});

/** Evidence kinds that are never sufficient alone for company/relationship. */
export const FORBIDDEN_SOLE_EVIDENCE = Object.freeze([
  "usuario_id",
  "usuarios.empresa_id",
  "session_fill_alone",
  "email",
  "partial_name",
  "most_recent_date",
  "last_record",
  "workmap",
  "runtime",
  "primary_activity",
  "similar_filename",
  "textual_similarity",
  "local_seed",
  "manual_selection_without_docs",
]);

/**
 * @typedef {{
 *   source: string;
 *   pathOrTable: string;
 *   identifier: string;
 *   field: string;
 *   date: string;
 *   result: string;
 * }} EvidenceReference
 */

/**
 * @typedef {{
 *   caseId: string;
 *   caseLabel: string | null;
 *   classification: string;
 *   verifiedCompanyId: string | null;
 *   verifiedRelationshipId: string | null;
 *   evidence: EvidenceReference[];
 *   contradictions: string[];
 *   recommendedAction: string;
 * }} OrphanCaseAssessment
 */

/**
 * Classify one orphan from allowed documentary evidence only.
 * @param {{
 *   caseId: string;
 *   caseLabel?: string | null;
 *   estadoActual?: string | null;
 *   porcentajeAvance?: number | null;
 * }} orphan
 * @param {{
 *   documentaryCaseCompany?: Record<string, string>;
 *   documentaryCaseRelationships?: Record<string, string[]>;
 *   enabledRelationshipsByCompany?: Record<string, Array<{ id: string; status: string }>>;
 *   companyDuplicates?: Array<{ companyIds: string[]; note: string }>;
 *   ambiguousCompanyCases?: Record<string, string[]>;
 *   technicalCaseIds?: string[];
 * }} evidenceIndex
 * @returns {OrphanCaseAssessment}
 */
export function classifyOrphanCase(orphan, evidenceIndex = {}) {
  const caseId = String(orphan.caseId);
  const evidence = [];
  const contradictions = [];

  const documentaryCompany =
    evidenceIndex.documentaryCaseCompany?.[caseId] ?? null;
  const documentaryRelationships =
    evidenceIndex.documentaryCaseRelationships?.[caseId] ?? [];
  const ambiguousCompanyNotes =
    evidenceIndex.ambiguousCompanyCases?.[caseId] ?? [];
  const isTechnical = (evidenceIndex.technicalCaseIds ?? []).includes(caseId);

  if (isTechnical) {
    evidence.push({
      source: "technical_flag_registry",
      pathOrTable: "orphan-evidence-registry.json#technicalCaseIds",
      identifier: caseId,
      field: "technicalCaseIds",
      date: new Date().toISOString().slice(0, 10),
      result: "flagged_invalid_or_technical",
    });
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.INVALID_OR_TECHNICAL,
      verifiedCompanyId: null,
      verifiedRelationshipId: null,
      evidence,
      contradictions,
      recommendedAction: ACTIONS.RETAIN_UNLINKED,
    };
  }

  if (ambiguousCompanyNotes.length > 0) {
    for (const note of ambiguousCompanyNotes) {
      contradictions.push(note);
    }
    evidence.push({
      source: "duplicate_company_register",
      pathOrTable: "docs/eve/panel-control/STAGING_AMBER_CANONICAL.md",
      identifier: caseId,
      field: "non_canonical_amber_pair",
      date: "2026-07-15",
      result: "company_ambiguous_do_not_link",
    });
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.AMBIGUOUS_COMPANY,
      verifiedCompanyId: null,
      verifiedRelationshipId: null,
      evidence,
      contradictions,
      recommendedAction: ACTIONS.MANUAL_REVIEW,
    };
  }

  if (!documentaryCompany) {
    evidence.push({
      source: "documentary_scan",
      pathOrTable: "orphan-evidence-registry.json#documentaryCaseCompany",
      identifier: caseId,
      field: "caseId",
      date: new Date().toISOString().slice(0, 10),
      result: "no_allowed_documentary_company_binding",
    });
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.INSUFFICIENT_EVIDENCE,
      verifiedCompanyId: null,
      verifiedRelationshipId: null,
      evidence,
      contradictions,
      recommendedAction: ACTIONS.RETAIN_UNLINKED,
    };
  }

  evidence.push({
    source: "documentary_case_company",
    pathOrTable: "orphan-evidence-registry.json#documentaryCaseCompany",
    identifier: caseId,
    field: "companyId",
    date: new Date().toISOString().slice(0, 10),
    result: documentaryCompany,
  });

  const relationships =
    evidenceIndex.enabledRelationshipsByCompany?.[documentaryCompany] ?? [];
  const enabled = relationships.filter((r) => r.status === "enabled");

  if (documentaryRelationships.length > 1) {
    contradictions.push(
      `multiple_documentary_relationships:${documentaryRelationships.join(",")}`,
    );
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.AMBIGUOUS_RELATIONSHIP,
      verifiedCompanyId: documentaryCompany,
      verifiedRelationshipId: null,
      evidence,
      contradictions,
      recommendedAction: ACTIONS.MANUAL_REVIEW,
    };
  }

  if (enabled.length > 1 && documentaryRelationships.length === 0) {
    contradictions.push(
      `multiple_enabled_relationships_for_company:${enabled.map((r) => r.id).join(",")}`,
    );
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.AMBIGUOUS_RELATIONSHIP,
      verifiedCompanyId: documentaryCompany,
      verifiedRelationshipId: null,
      evidence,
      contradictions,
      recommendedAction: ACTIONS.MANUAL_REVIEW,
    };
  }

  if (documentaryRelationships.length === 1) {
    const relationshipId = documentaryRelationships[0];
    const match = enabled.find((r) => r.id === relationshipId);
    if (!match) {
      contradictions.push(`documentary_relationship_not_enabled:${relationshipId}`);
      return {
        caseId,
        caseLabel: orphan.caseLabel ?? null,
        classification: CLASSIFICATIONS.COMPANY_WITHOUT_RELATIONSHIP,
        verifiedCompanyId: documentaryCompany,
        verifiedRelationshipId: null,
        evidence,
        contradictions,
        recommendedAction: ACTIONS.CREATE_RELATIONSHIP_REVIEW,
      };
    }
    evidence.push({
      source: "documentary_case_relationship",
      pathOrTable: "orphan-evidence-registry.json#documentaryCaseRelationships",
      identifier: caseId,
      field: "relationshipId",
      date: new Date().toISOString().slice(0, 10),
      result: relationshipId,
    });
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.UNAMBIGUOUS,
      verifiedCompanyId: documentaryCompany,
      verifiedRelationshipId: relationshipId,
      evidence,
      contradictions,
      recommendedAction: ACTIONS.LINK,
    };
  }

  if (enabled.length === 1) {
    // Single enabled relationship alone is NOT enough without documentary case→relationship.
    // Company verified; relationship not documentarily bound → B.
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.COMPANY_WITHOUT_RELATIONSHIP,
      verifiedCompanyId: documentaryCompany,
      verifiedRelationshipId: null,
      evidence,
      contradictions: [
        "company_verified_but_case_relationship_not_documentarily_bound",
      ],
      recommendedAction: ACTIONS.CREATE_RELATIONSHIP_REVIEW,
    };
  }

  if (enabled.length === 0) {
    return {
      caseId,
      caseLabel: orphan.caseLabel ?? null,
      classification: CLASSIFICATIONS.COMPANY_WITHOUT_RELATIONSHIP,
      verifiedCompanyId: documentaryCompany,
      verifiedRelationshipId: null,
      evidence,
      contradictions,
      recommendedAction: ACTIONS.CREATE_RELATIONSHIP_REVIEW,
    };
  }

  return {
    caseId,
    caseLabel: orphan.caseLabel ?? null,
    classification: CLASSIFICATIONS.INSUFFICIENT_EVIDENCE,
    verifiedCompanyId: null,
    verifiedRelationshipId: null,
    evidence,
    contradictions,
    recommendedAction: ACTIONS.RETAIN_UNLINKED,
  };
}

/**
 * Reject assessments that rely on forbidden sole evidence markers.
 * @param {OrphanCaseAssessment} assessment
 * @returns {boolean}
 */
export function usesForbiddenSoleEvidence(assessment) {
  return (assessment.evidence ?? []).some((item) =>
    FORBIDDEN_SOLE_EVIDENCE.includes(item.field) ||
    FORBIDDEN_SOLE_EVIDENCE.includes(item.source),
  );
}

/**
 * Summarize classification counts.
 * @param {OrphanCaseAssessment[]} assessments
 */
export function summarizeClassifications(assessments) {
  const counts = {
    unambiguous: 0,
    "company-without-relationship": 0,
    "ambiguous-relationship": 0,
    "ambiguous-company": 0,
    "insufficient-evidence": 0,
    "invalid-or-technical": 0,
  };
  for (const item of assessments) {
    if (counts[item.classification] !== undefined) {
      counts[item.classification] += 1;
    }
  }
  return counts;
}
