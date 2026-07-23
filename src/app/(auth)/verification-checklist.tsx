import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import {
  credentialStepStatus,
  OnboardingStepHeader,
  ProgressBar,
  VerificationStepRow,
} from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi, VerificationProgress } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { spacing } from '@/theme';

export default function VerificationChecklist() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<VerificationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    onboardingApi.progress().then(setProgress).catch((e) => setError(getApiErrorMessage(e)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const done = progress?.completedSteps ?? 0;
  const total = progress?.totalSteps ?? 9;
  const canSubmit = progress?.identityDocument && progress?.faceMatch;
  const hasSkippedSteps =
    progress?.professionalTitleSkipped ||
    progress?.professionalCollegeSkipped ||
    progress?.certificationsSkipped ||
    progress?.portfolioSkipped ||
    progress?.completedWorkSkipped ||
    progress?.curriculumSkipped ||
    progress?.clientReferencesSkipped ||
    progress?.linkedInSkipped ||
    progress?.serviceContractSkipped ||
    progress?.servicesSkipped;

  return (
    <AuthLayout
      title={t('registerFlow.verificationTitle')}
      subtitle={t('registerFlow.credentialsPhaseSubtitle')}
      showBrand={false}
    >
      <OnboardingStepHeader step={2} title={t('registerFlow.verificationStep')} />
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <VerificationStepRow
          icon="card-outline"
          label={t('registerFlow.stepIdentity')}
          status={progress?.identityDocument ? 'done' : 'pending'}
          onPress={() => router.push('/(auth)/verification-identity' as never)}
        />
        <VerificationStepRow
          icon="camera-outline"
          label={t('registerFlow.stepSelfie')}
          status={progress?.faceMatch ? 'done' : 'pending'}
          onPress={() => router.push('/(auth)/verification-biometric' as never)}
        />

        <Text variant="caption" color="textMuted">
          {t('registerFlow.checklistOptionalNote')}
        </Text>

        <VerificationStepRow
          icon="school-outline"
          label={t('registerFlow.stepTitle')}
          status={credentialStepStatus(progress?.professionalTitle, progress?.professionalTitleSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-step' as never)}
        />
        <VerificationStepRow
          icon="business-outline"
          label={t('registerFlow.stepCollege')}
          status={credentialStepStatus(progress?.professionalCollege, progress?.professionalCollegeSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-college' as never)}
        />
        <VerificationStepRow
          icon="people-outline"
          label={t('registerFlow.stepClientReferences')}
          status={credentialStepStatus(progress?.clientReferences, progress?.clientReferencesSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-client-references' as never)}
        />
        <VerificationStepRow
          icon="hammer-outline"
          label={t('registerFlow.stepWork')}
          status={credentialStepStatus(progress?.completedWork, progress?.completedWorkSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-work' as never)}
        />
        <VerificationStepRow
          icon="images-outline"
          label={t('registerFlow.stepPortfolio')}
          status={credentialStepStatus(progress?.portfolio, progress?.portfolioSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-portfolio' as never)}
        />
        <VerificationStepRow
          icon="logo-linkedin"
          label={t('registerFlow.stepLinkedIn')}
          status={credentialStepStatus(progress?.linkedIn, progress?.linkedInSkipped)}
          optional
          onPress={() => router.push({ pathname: '/(auth)/verification-linkedin' } as never)}
        />
        <VerificationStepRow
          icon="ribbon-outline"
          label={t('registerFlow.stepCertifications')}
          status={credentialStepStatus(progress?.certifications, progress?.certificationsSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-certifications' as never)}
        />
        <VerificationStepRow
          icon="document-text-outline"
          label={t('registerFlow.stepCurriculum')}
          status={credentialStepStatus(progress?.curriculum, progress?.curriculumSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-curriculum' as never)}
        />
        <VerificationStepRow
          icon="pricetag-outline"
          label={t('registerFlow.stepServices')}
          status={credentialStepStatus(progress?.services, progress?.servicesSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-services' as never)}
        />
        <VerificationStepRow
          icon="create-outline"
          label={t('registerFlow.stepContract')}
          status={credentialStepStatus(progress?.serviceContract, progress?.serviceContractSkipped)}
          optional
          onPress={() => router.push('/(auth)/verification-contract' as never)}
        />

        {hasSkippedSteps ? (
          <Text variant="caption" color="textMuted">
            {t('registerFlow.checklistSkippedNote')}
          </Text>
        ) : null}

        <ProgressBar current={done} total={total} label={t('registerFlow.progress', { done, total })} />

        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        <Button
          label={t('registerFlow.submitVerification')}
          loading={loading}
          disabled={!canSubmit}
          onPress={async () => {
            setLoading(true);
            setError(null);
            try {
              await onboardingApi.submitForReview();
              router.replace('/(auth)/pending-review' as never);
            } catch (e) {
              setError(getApiErrorMessage(e, t('registerFlow.error')));
            } finally {
              setLoading(false);
            }
          }}
        />
      </ScrollView>
    </AuthLayout>
  );
}
