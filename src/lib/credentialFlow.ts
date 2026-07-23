/** Guided professional credential steps after identity verification (ID + selfie). */
export const CREDENTIAL_FLOW = [
  { path: '/(auth)/verification-step', step: 4, key: 'title' },
  { path: '/(auth)/verification-college', step: 5, key: 'college' },
  { path: '/(auth)/verification-client-references', step: 6, key: 'clientReferences' },
  { path: '/(auth)/verification-work', step: 7, key: 'work' },
  { path: '/(auth)/verification-portfolio', step: 8, key: 'portfolio' },
  { path: '/(auth)/verification-linkedin', step: 9, key: 'linkedin' },
  { path: '/(auth)/verification-certifications', step: 10, key: 'certifications' },
  { path: '/(auth)/verification-curriculum', step: 11, key: 'curriculum' },
  { path: '/(auth)/verification-services', step: 12, key: 'services' },
  { path: '/(auth)/verification-contract', step: 13, key: 'contract' },
] as const;

export type CredentialStepKey = (typeof CREDENTIAL_FLOW)[number]['key'];

export const CREDENTIAL_START = CREDENTIAL_FLOW[0].path;
export const CREDENTIAL_CHECKLIST = '/(auth)/verification-checklist';
export const CREDENTIAL_TOTAL_STEPS = 13;

export function credentialMeta(key: CredentialStepKey) {
  return CREDENTIAL_FLOW.find((s) => s.key === key)!;
}

export function nextCredentialRoute(key: CredentialStepKey): string {
  const idx = CREDENTIAL_FLOW.findIndex((s) => s.key === key);
  if (idx < 0 || idx >= CREDENTIAL_FLOW.length - 1) {
    return CREDENTIAL_CHECKLIST;
  }
  return CREDENTIAL_FLOW[idx + 1].path;
}
