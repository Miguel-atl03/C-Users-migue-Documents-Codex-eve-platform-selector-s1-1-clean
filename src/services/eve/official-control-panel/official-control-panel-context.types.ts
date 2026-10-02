export type ClientCompanyOption = {
  id: string;
  label: string;
};

export type ClientRelationshipOption = {
  id: string;
  label: string;
};

export type ClientCaseOption = {
  id: string;
  label: string;
  statusLabel: string | null;
};

export type OfficialControlPanelContextAccessInput = {
  consultantUserId: string;
  companyId: string;
  relationshipId?: string | null;
  caseId?: string | null;
  at?: Date;
};

export type OfficialControlPanelContextAccessResult =
  | { ok: true }
  | {
      ok: false;
      code: "context_access_denied" | "context_data_unavailable";
      status: 403 | 500;
      message: string;
    };

export type CurrentAssignmentRecord = {
  consultantUserId: string;
  companyId: string;
  status: "enabled" | "disabled";
  validFrom: string;
  validUntil: string | null;
};

export type CurrentRelationshipRecord = {
  id: string;
  companyId: string;
  status: "enabled" | "disabled";
  validFrom: string;
  validUntil: string | null;
};

export type LinkedCaseRecord = {
  id: string;
  companyId: string | null;
  relationshipId: string | null;
};

export type OfficialControlPanelContextRepository = {
  findAssignment(
    consultantUserId: string,
    companyId: string,
  ): Promise<CurrentAssignmentRecord | null>;
  findRelationship(
    relationshipId: string,
  ): Promise<CurrentRelationshipRecord | null>;
  findCase(caseId: string): Promise<LinkedCaseRecord | null>;
  listCompanies(consultantUserId: string): Promise<ClientCompanyOption[]>;
  listRelationships(
    consultantUserId: string,
    companyId: string,
  ): Promise<ClientRelationshipOption[]>;
  listCases(
    consultantUserId: string,
    relationshipId: string,
  ): Promise<ClientCaseOption[]>;
};
