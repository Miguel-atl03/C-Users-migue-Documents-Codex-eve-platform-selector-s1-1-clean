import type { ClientContextSelection } from "../types/client-context.types";

export const CLIENT_CONTEXT_QUERY_KEYS = {
  company: "company_id",
  relationship: "engagement_id",
  case: "case_id",
} as const;

const LEGACY_CLIENT_CONTEXT_QUERY_KEYS = {
  company: "company",
  relationship: "relationship",
  case: "case",
} as const;

const FUTURE_CASE_DEPENDENCY_KEYS = [
  "process",
  "milestone",
  "user",
  "user_id",
  "functionalRole",
  "role_runtime_session_id",
  "activity",
  "activity_id",
  "run",
  "alert",
  "trace",
  "participant",
  "participant_id",
  "profile",
  "profile_id",
  "manual_process",
  "manual_work_item",
] as const;

export function parseClientContextSelection(
  params: URLSearchParams,
): ClientContextSelection {
  return {
    companyId: normalizedParam(
      params.get(CLIENT_CONTEXT_QUERY_KEYS.company) ??
        params.get(LEGACY_CLIENT_CONTEXT_QUERY_KEYS.company),
    ),
    relationshipId: normalizedParam(
      params.get(CLIENT_CONTEXT_QUERY_KEYS.relationship) ??
        params.get(LEGACY_CLIENT_CONTEXT_QUERY_KEYS.relationship),
    ),
    caseId: normalizedParam(
      params.get(CLIENT_CONTEXT_QUERY_KEYS.case) ??
        params.get(LEGACY_CLIENT_CONTEXT_QUERY_KEYS.case),
    ),
  };
}

export function buildClientContextNavigation(
  current: URLSearchParams,
  selection: ClientContextSelection,
): URLSearchParams {
  const next = new URLSearchParams(current);
  setOrDelete(next, CLIENT_CONTEXT_QUERY_KEYS.company, selection.companyId);
  setOrDelete(
    next,
    CLIENT_CONTEXT_QUERY_KEYS.relationship,
    selection.relationshipId,
  );
  setOrDelete(next, CLIENT_CONTEXT_QUERY_KEYS.case, selection.caseId);
  setOrDelete(
    next,
    LEGACY_CLIENT_CONTEXT_QUERY_KEYS.company,
    selection.companyId,
  );
  setOrDelete(
    next,
    LEGACY_CLIENT_CONTEXT_QUERY_KEYS.relationship,
    selection.relationshipId,
  );
  setOrDelete(
    next,
    LEGACY_CLIENT_CONTEXT_QUERY_KEYS.case,
    selection.caseId,
  );
  return next;
}

export function changeClientContextCompany(
  current: URLSearchParams,
  companyId: string | null,
): URLSearchParams {
  const next = buildClientContextNavigation(current, {
    companyId,
    relationshipId: null,
    caseId: null,
  });
  clearFutureDependencies(next);
  next.delete("milestone");
  next.delete("participant");
  next.delete("profile");
  return next;
}

export function changeClientContextRelationship(
  current: URLSearchParams,
  selection: Pick<ClientContextSelection, "companyId" | "relationshipId">,
): URLSearchParams {
  const next = buildClientContextNavigation(current, {
    ...selection,
    caseId: null,
  });
  clearFutureDependencies(next);
  next.delete("milestone");
  next.delete("participant");
  next.delete("profile");
  return next;
}

export function changeClientContextCase(
  current: URLSearchParams,
  selection: ClientContextSelection,
): URLSearchParams {
  const previousCaseId = normalizedParam(
    current.get(CLIENT_CONTEXT_QUERY_KEYS.case) ??
      current.get(LEGACY_CLIENT_CONTEXT_QUERY_KEYS.case),
  );
  const next = buildClientContextNavigation(current, selection);
  if (previousCaseId !== selection.caseId) {
    clearFutureDependencies(next);
    next.delete("milestone");
    next.delete("participant");
    next.delete("profile");
  }
  return next;
}

function clearFutureDependencies(params: URLSearchParams) {
  for (const key of FUTURE_CASE_DEPENDENCY_KEYS) params.delete(key);
}

function normalizedParam(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (value) params.set(key, value);
  else params.delete(key);
}
