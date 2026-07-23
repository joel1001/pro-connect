import { apiClient } from './client';
import { getApiBaseUrl } from '@/constants/config';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export type TwoFactorMethod = 'BIOMETRIC' | 'SMS' | 'AUTHENTICATOR';

export interface AddressPayload {
  country?: string;
  province: string;
  canton: string;
  district: string;
  streetLine: string;
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  credentialUrl?: string;
  documentUrl?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface PortfolioLinkEntry {
  title?: string;
  url: string;
  type?: string;
}

export interface CompletedWorkEntry {
  title: string;
  description?: string;
  externalUrl?: string;
  imageUrls?: string[];
  completedAt?: string;
}

export interface ClientReferenceEntry {
  clientName: string;
  company?: string;
  contactPhone?: string;
  contactEmail?: string;
  projectDescription?: string;
  testimonial?: string;
  referenceUrl?: string;
}

export interface VerificationProgress {
  verificationId?: string;
  status?: string;
  completedSteps: number;
  totalSteps: number;
  identityDocument: boolean;
  identityAnalyzed?: boolean;
  identityDocumentData?: IdentityDocumentData;
  selfie: boolean;
  faceMatch: boolean;
  biometric: boolean;
  professionalTitle: boolean;
  professionalTitleSkipped?: boolean;
  professionalCollege: boolean;
  professionalCollegeSkipped?: boolean;
  collegeAssociated?: boolean;
  certifications: boolean;
  certificationsSkipped?: boolean;
  portfolio: boolean;
  portfolioSkipped?: boolean;
  completedWork: boolean;
  completedWorkSkipped?: boolean;
  curriculum: boolean;
  curriculumSkipped?: boolean;
  clientReferences: boolean;
  clientReferencesSkipped?: boolean;
  linkedIn: boolean;
  linkedInSkipped?: boolean;
  serviceContract?: boolean;
  serviceContractSkipped?: boolean;
  contractPdfUrl?: string;
  contractDocumentText?: string;
  contractDocumentSource?: string;
  services?: boolean;
  servicesSkipped?: boolean;
  faceMatchScore?: number;
  role: string;
  twoFactorMethod?: TwoFactorMethod;
  addressCompleted: boolean;
}

export interface UploadResponse {
  url: string;
  fileName?: string;
  contentType?: string;
}

export interface FaceMatchResult {
  matched: boolean;
  similarityScore: number;
  provider: string;
  message: string;
}

export interface IdentityDocumentData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  idNumber?: string;
  documentType?: string;
  birthDate?: string;
  expiryDate?: string;
  nationality?: string;
  sex?: string;
  rawText?: string;
}

export interface IdDocumentAnalysisResult {
  success: boolean;
  provider: string;
  message: string;
  extracted?: IdentityDocumentData;
}

export interface VerificationStepPayload {
  skipped?: boolean;
  value?: string;
  documentUrl?: string;
  documentBackUrl?: string;
  titleText?: string;
  titleDocumentUrl?: string;
  collegeAssociated?: boolean;
  collegeName?: string;
  collegeUrl?: string;
  licenseNumber?: string;
  licenseDocumentUrl?: string;
  licenseVerificationUrl?: string;
  certifications?: CertificationEntry[];
  portfolioUrls?: string[];
  portfolioLinks?: PortfolioLinkEntry[];
  completedWorks?: CompletedWorkEntry[];
  curriculumUrl?: string;
  resumeFileName?: string;
  clientReferences?: ClientReferenceEntry[];
  linkedInUrl?: string;
  githubUrl?: string;
  behanceUrl?: string;
  dribbbleUrl?: string;
  websiteUrl?: string;
  contractPdfUrl?: string;
  contractSignedPdfUrl?: string;
  contractDocumentText?: string;
  contractDocumentSource?: string;
  services?: import('@/types').ServiceEntryInput[];
}

export type ProfessionalPricingDisclosure = {
  platformCommissionRate: number;
  marketplaceCommissionRate: number;
  appStoreFeeRate: number;
  googlePlayFeeRate: number;
  defaultCountryCode: string;
  defaultTaxRate: number;
};

export const onboardingApi = {
  saveAddress: (payload: AddressPayload) =>
    apiClient.put('/onboarding/address', payload),

  saveSecurity: (method: TwoFactorMethod) =>
    apiClient.put('/onboarding/security', { method }),

  progress: () =>
    apiClient.get<VerificationProgress>('/onboarding/progress').then((r) => r.data),

  pricingDisclosure: (countryCode?: string) =>
    apiClient
      .get<ProfessionalPricingDisclosure>('/onboarding/pricing-disclosure', {
        params: countryCode ? { countryCode } : undefined,
      })
      .then((r) => r.data),

  upload: async (category: string, uri: string, fileName: string, mimeType: string) => {
    const token = await storage.get(STORAGE_KEYS.accessToken);
    const form = new FormData();
    form.append('category', category);
    form.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);

    // fetch (not axios) — RN sets multipart boundary correctly and keeps Authorization
    const response = await fetch(`${getApiBaseUrl()}/onboarding/uploads`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'bypass-tunnel-reminder': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });

    const body = (await response.json().catch(() => ({}))) as UploadResponse & { message?: string };
    if (!response.ok) {
      const err = new Error(body.message ?? `Request failed with status code ${response.status}`) as Error & {
        response?: { status: number; data: unknown };
      };
      err.response = { status: response.status, data: body };
      throw err;
    }
    return body;
  },

  faceMatch: () =>
    apiClient.post<FaceMatchResult>('/onboarding/verification/face-match').then((r) => r.data),

  analyzeId: () =>
    apiClient.post<IdDocumentAnalysisResult>('/onboarding/verification/analyze-id').then((r) => r.data),

  completeStep: (step: string, payload?: VerificationStepPayload) =>
    apiClient
      .patch(`/onboarding/verification/steps/${step}`, payload ?? {})
      .then((r) => r.data),

  submitForReview: () =>
    apiClient.post('/onboarding/verification/submit-for-review'),

  generateContractTemplate: (acceptDisclaimer: boolean) =>
    apiClient
      .post<{ contractDocumentText?: string; contractDocumentSource?: string }>(
        '/onboarding/contract/generate',
        { acceptDisclaimer },
      )
      .then((r) => r.data),
};
