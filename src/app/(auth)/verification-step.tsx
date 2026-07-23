import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Input, Text } from '@/components/atoms';
import { CredentialStepActions, ImageUploadField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { spacing } from '@/theme';

export default function VerificationStep() {
  const { t } = useTranslation();
  const meta = credentialMeta('title');
  const [titleText, setTitleText] = useState('');
  const [titleDocUrl, setTitleDocUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('title') as never);

  const onUploadTitle = async (uri: string, fileName: string, mimeType: string) => {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await onboardingApi.upload('title', uri, fileName, mimeType);
      setTitleDocUrl(uploaded.url);
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploading(false);
    }
  };

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('professionalTitle', {
        skipped: skip,
        titleText: skip ? undefined : titleText.trim() || undefined,
        titleDocumentUrl: skip ? undefined : titleDocUrl ?? undefined,
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
      subtitle={t('registerFlow.titleHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepTitle')}
          badge={t('registerFlow.stepRecommended')}
        />
        <Text variant="caption" color="textSecondary">
          {t('registerFlow.credentialsIdNote')}
        </Text>
        <Input
          label={t('registerFlow.titleName')}
          placeholder={t('registerFlow.titlePlaceholder')}
          value={titleText}
          onChangeText={setTitleText}
          iconLeft="school-outline"
        />
        <ImageUploadField
          label={t('registerFlow.uploadTitleDoc')}
          hint={t('registerFlow.uploadTitleDocHint')}
          imageUri={titleDocUrl}
          onPick={onUploadTitle}
          loading={uploading}
          cameraType={ImagePicker.CameraType.back}
        />
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
          continueDisabled={uploading}
          onContinue={() => save(false)}
          onSkip={() => save(true)}
        />
      </ScrollView>
    </AuthLayout>
  );
}
