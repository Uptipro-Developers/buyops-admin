export type KycEntityType = "individual" | "family-office" | "institution";
export type KycTrack = "foundry" | "harbor";
export type KycStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "failed"
  | "remediation_required";
export type KycDocumentStatus = "missing" | "pending" | "approved" | "rejected";

export interface KycDocument {
  id: string;
  name: string;
  fileUrl: string | null;
  fileName?: string;
  status: KycDocumentStatus;
  rejectReason?: string;
}

export interface KycInvestor {
  id: string;
  name: string;
  email: string;
  entityType: KycEntityType;
  investorTrack: KycTrack;
  kycStatus: KycStatus;
  kycSubmittedAt: string | null;
  kycVerifiedAt?: string | null;
  kycLastRemindedAt?: string | null;
  kycRemediationItems: string[];
  kycProfile: Record<string, unknown>;
  kycDeclarations: Record<string, unknown>;
  kycDocuments: KycDocument[];
  profileRequirements?: FieldDefinition[];
  declarationRequirements?: FieldDefinition[];
  documentRequirements?: string[];
  optionalDocumentRequirements?: string[];
}

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  pending: "Not submitted",
  under_review: "Under review",
  verified: "Verified",
  failed: "Rejected",
  remediation_required: "Remediation required",
};

export const KYC_ENTITY_LABELS: Record<KycEntityType, string> = {
  individual: "Individual",
  "family-office": "Family Office",
  institution: "Institution",
};

type FieldDefinition = { key: string; label: string };

export const KYC_PROFILE_FIELDS: Record<KycEntityType, FieldDefinition[]> = {
  individual: [
    { key: "nationalId", label: "National ID (NIN)" },
    { key: "bvn", label: "BVN" },
    { key: "residentialAddress", label: "Residential Address" },
  ],
  "family-office": [
    { key: "companyName", label: "Company Name" },
    { key: "rcNumber", label: "RC Number" },
    { key: "companyAddress", label: "Company Address" },
    { key: "repName", label: "Authorized Representative" },
    { key: "repEmail", label: "Representative Email" },
  ],
  institution: [
    { key: "companyName", label: "Company Name" },
    { key: "rcNumber", label: "RC Number" },
    { key: "companyAddress", label: "Company Address" },
    { key: "repName", label: "Authorized Representative" },
    { key: "repEmail", label: "Representative Email" },
    { key: "institutionType", label: "Institution Type" },
    { key: "structure", label: "Structure" },
    { key: "aumRange", label: "AUM Range" },
    { key: "horizon", label: "Investment Horizon" },
    { key: "sectors", label: "Sectors of Interest" },
    { key: "regulatoryStatus", label: "Regulatory Status" },
  ],
};

export const KYC_DECLARATION_FIELDS: Record<KycEntityType, FieldDefinition[]> = {
  individual: [
    { key: "sourceOfFunds", label: "Source of Funds" },
    { key: "targetTrack", label: "Target Investment Track" },
  ],
  "family-office": [
    { key: "declaredAumRange", label: "Declared AUM Range" },
    { key: "targetTrack", label: "Target Investment Track" },
  ],
  institution: [],
};

const DOCUMENTS: Record<Exclude<KycEntityType, "institution">, string[]> = {
  individual: [
    "Government Photo ID",
    "Live Biometric Selfie",
    "Proof of Address",
    "Accreditation Questionnaire",
  ],
  "family-office": [
    "Articles of Incorporation",
    "Trustee/Director Passports",
    "Proof of AUM / Asset Scale",
    "Beneficial Ownership (UBO)",
  ],
};

const INSTITUTION_DOCUMENTS = [
  "Articles of Incorporation",
  "Trustee/Director Passports",
  "Board Resolution Letter",
  "Beneficial Ownership (UBO)",
  "Corporate Registration & Tax ID",
  "Officer / Director Identification",
  "AML Compliance Certificate",
];

export function requiredDocumentNames(entityType: KycEntityType, track: KycTrack) {
  if (entityType !== "institution") return [...DOCUMENTS[entityType]];
  return track === "harbor"
    ? [...INSTITUTION_DOCUMENTS, ...DOCUMENTS.individual]
    : [...INSTITUTION_DOCUMENTS];
}

const hasValue = (value: unknown) =>
  Array.isArray(value)
    ? value.length > 0
    : value !== undefined && value !== null && String(value).trim().length > 0;

export function displayKycValue(key: string, value: unknown) {
  if (!hasValue(value)) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (key === "targetTrack") return value === "harbor" ? "Urbco Harbor" : "Urbco Foundry";
  return String(value);
}

export function calculateKycCompletion(investor: KycInvestor) {
  const profileFields = investor.profileRequirements || KYC_PROFILE_FIELDS[investor.entityType];
  const declarationFields = investor.declarationRequirements || KYC_DECLARATION_FIELDS[investor.entityType];
  const documentNames = investor.documentRequirements || requiredDocumentNames(investor.entityType, investor.investorTrack);
  const profileDone = profileFields.filter(({ key }) => hasValue(investor.kycProfile[key])).length;
  const declarationsDone = declarationFields.filter(({ key }) => hasValue(investor.kycDeclarations[key])).length;
  const documentsDone = documentNames.filter((name) => {
    const document = investor.kycDocuments.find((item) => item.name === name);
    return document?.status === "pending" || document?.status === "approved";
  }).length;
  const total = profileFields.length + declarationFields.length + documentNames.length;
  const done = profileDone + declarationsDone + documentsDone;
  return {
    percent: total ? Math.round((done / total) * 100) : 0,
    profile: { done: profileDone, total: profileFields.length },
    documents: { done: documentsDone, total: documentNames.length },
    declarations: { done: declarationsDone, total: declarationFields.length },
  };
}

export type KycChecklistItem = {
  id: string;
  group: "Profile" | "Document" | "Declaration";
  label: string;
  done: boolean;
};

export function buildKycChecklist(investor: KycInvestor): KycChecklistItem[] {
  const profile = (investor.profileRequirements || KYC_PROFILE_FIELDS[investor.entityType]).map(({ key, label }) => ({
    id: `profile:${key}`,
    group: "Profile" as const,
    label,
    done: hasValue(investor.kycProfile[key]),
  }));
  const documents = (investor.documentRequirements || requiredDocumentNames(investor.entityType, investor.investorTrack)).map((name) => {
    const document = investor.kycDocuments.find((item) => item.name === name);
    return {
      id: `document:${name}`,
      group: "Document" as const,
      label: name,
      done: document?.status === "approved" || document?.status === "pending",
    };
  });
  const declarations = (investor.declarationRequirements || KYC_DECLARATION_FIELDS[investor.entityType]).map(({ key, label }) => ({
    id: `declaration:${key}`,
    group: "Declaration" as const,
    label,
    done: hasValue(investor.kycDeclarations[key]),
  }));
  return [...profile, ...documents, ...declarations];
}
