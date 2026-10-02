import type {
  ClientCaseOption,
  ClientCompanyOption,
  ClientRelationshipOption,
} from "@/services/eve/official-control-panel/official-control-panel-context.types";

export type ClientContextStatus =
  | "loading-companies"
  | "no-company"
  | "loading-relationships"
  | "no-relationship"
  | "loading-cases"
  | "no-case"
  | "active"
  | "error";

export type ClientContextSelection = {
  companyId: string | null;
  relationshipId: string | null;
  caseId: string | null;
};

export type ClientContextPresentation = {
  companyLabel: string;
  relationshipLabel: string;
  caseLabel: string;
  currentStatusLabel: string;
  nextStepLabel: string;
  participationLabel: string;
  attentionLabel: string;
};

export type ClientContextAuthReadiness =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "error";

export type ClientContextErrorKind = "session" | "context" | "network";

export type ClientContextViewModel = {
  status: ClientContextStatus;
  companiesLoading: boolean;
  companiesLoaded: boolean;
  companies: ClientCompanyOption[];
  relationships: ClientRelationshipOption[];
  cases: ClientCaseOption[];
  selection: ClientContextSelection;
  selectedCompany: ClientCompanyOption | null;
  selectedRelationship: ClientRelationshipOption | null;
  selectedCase: ClientCaseOption | null;
  errorMessage: string | null;
  errorKind: ClientContextErrorKind | null;
  authReadiness?: ClientContextAuthReadiness;
};
