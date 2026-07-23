import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Input, Text } from '@/components/atoms';
import { CredentialStepActions, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { spacing } from '@/theme';

export default function VerificationLinkedIn() {
  const { t } = useTranslation();
  const meta = credentialMeta('linkedin');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [behanceUrl, setBehanceUrl] = useState('');
  const [dribbbleUrl, setDribbbleUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('linkedin') as never);

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('linkedIn', {
        skipped: skip,
        linkedInUrl: skip ? undefined : linkedInUrl.trim() || undefined,
        githubUrl: skip ? undefined : githubUrl.trim() || undefined,
        behanceUrl: skip ? undefined : behanceUrl.trim() || undefined,
        dribbbleUrl: skip ? undefined : dribbbleUrl.trim() || undefined,
        websiteUrl: skip ? undefined : websiteUrl.trim() || undefined,
      });
      goNext();
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('registerFlow.credentialsPhaseTitle')}
      subtitle={t('registerFlow.professionalLinksHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepProfessionalLinks')}
          badge={t('registerFlow.stepRecommended')}
        />
        <Input label="LinkedIn" placeholder="https://linkedin.com/in/..." value={linkedInUrl} onChangeText={setLinkedInUrl} autoCapitalize="none" keyboardType="url" iconLeft="logo-linkedin" />
        <Input label="GitHub" placeholder="https://github.com/..." value={githubUrl} onChangeText={setGithubUrl} autoCapitalize="none" keyboardType="url" iconLeft="logo-github" />
        <Input label="Behance" placeholder="https://behance.net/..." value={behanceUrl} onChangeText={setBehanceUrl} autoCapitalize="none" keyboardType="url" iconLeft="color-palette-outline" />
        <Input label="Dribbble" placeholder="https://dribbble.com/..." value={dribbbleUrl} onChangeText={setDribbbleUrl} autoCapitalize="none" keyboardType="url" iconLeft="basketball-outline" />
        <Input label={t('registerFlow.websiteUrl')} placeholder="https://..." value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" iconLeft="globe-outline" />
        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        <CredentialStepActions
          hint={t('registerFlow.credentialsOptionalHint')}
          continueLabel={t('common.continue')}
          skipLabel={t('registerFlow.skipStep')}
          loading={loading}
          onContinue={() => save(false)}
          onSkip={() => save(true)}
        />
      </ScrollView>
    </AuthLayout>
  );
}
