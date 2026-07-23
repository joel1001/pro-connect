import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Input, Text } from '@/components/atoms';
import { CredentialStepActions, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

export default function VerificationCurriculum() {
  const { t } = useTranslation();
  const theme = useTheme();
  const meta = credentialMeta('curriculum');
  const [curriculumUrl, setCurriculumUrl] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('curriculum') as never);

  const onUpload = async (uri: string, fileName: string, mimeType: string) => {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await onboardingApi.upload('curriculum', uri, fileName, mimeType);
      setCurriculumUrl(uploaded.url);
      setResumeFileName(fileName);
      setExternalUrl('');
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await onUpload(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
  };

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const url = skip ? undefined : curriculumUrl ?? (externalUrl.trim() || undefined);
      await onboardingApi.completeStep('curriculum', {
        skipped: skip,
        curriculumUrl: url,
        resumeFileName: skip ? undefined : resumeFileName ?? (externalUrl.trim() ? 'resume.pdf' : undefined),
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
      subtitle={t('registerFlow.curriculumHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepCurriculum')}
          badge={t('registerFlow.stepRecommended')}
        />
        <Pressable
          onPress={onPickFile}
          disabled={uploading || loading}
          style={{
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: theme.colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            alignItems: 'center',
            opacity: uploading || loading ? 0.6 : 1,
          }}
        >
          <Text variant="body" color="textSecondary">
            {curriculumUrl ? t('registerFlow.cvUploaded') : t('registerFlow.uploadCv')}
          </Text>
        </Pressable>
        <Text variant="caption" color="textMuted" center>
          {t('registerFlow.orExternalLink')}
        </Text>
        <Input
          label={t('registerFlow.cvLink')}
          placeholder="https://drive.google.com/..."
          value={externalUrl}
          onChangeText={(v) => {
            setExternalUrl(v);
            if (v.trim()) setCurriculumUrl(null);
          }}
          autoCapitalize="none"
          keyboardType="url"
          iconLeft="link-outline"
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
