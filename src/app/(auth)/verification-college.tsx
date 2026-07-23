import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Input, Text } from '@/components/atoms';
import { CredentialStepActions, ImageUploadField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { useTheme } from '@/hooks/useTheme';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { radius, spacing } from '@/theme';

export default function VerificationCollege() {
  const { t } = useTranslation();
  const theme = useTheme();
  const meta = credentialMeta('college');
  const [associated, setAssociated] = useState(true);
  const [collegeName, setCollegeName] = useState('');
  const [collegeUrl, setCollegeUrl] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseVerificationUrl, setLicenseVerificationUrl] = useState('');
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('college') as never);

  const onUploadLicense = async (uri: string, fileName: string, mimeType: string) => {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await onboardingApi.upload('license', uri, fileName, mimeType);
      setLicenseDocUrl(uploaded.url);
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
      await onboardingApi.completeStep('professionalCollege', {
        skipped: skip,
        collegeAssociated: skip ? undefined : associated,
        collegeName: skip || !associated ? undefined : collegeName.trim() || undefined,
        collegeUrl: skip || !associated ? undefined : collegeUrl.trim() || undefined,
        licenseNumber: skip || !associated ? undefined : licenseNumber.trim() || undefined,
        licenseDocumentUrl: skip || !associated ? undefined : licenseDocUrl ?? undefined,
        licenseVerificationUrl: skip || !associated ? undefined : licenseVerificationUrl.trim() || undefined,
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
      subtitle={t('registerFlow.collegeHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepCollege')}
          badge={t('registerFlow.stepRecommended')}
        />
        <Text variant="caption" color="textSecondary">
          {t('registerFlow.credentialsIdNote')}
        </Text>
        <Pressable
          onPress={() => setAssociated(true)}
          style={{
            borderWidth: 1.5,
            borderColor: associated ? theme.colors.primary : theme.colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Text variant="body" weight="600">
            {t('registerFlow.collegeAssociated')}
          </Text>
          <Text variant="caption" color="textSecondary">
            {t('registerFlow.collegeAssociatedDesc')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setAssociated(false)}
          style={{
            borderWidth: 1.5,
            borderColor: !associated ? theme.colors.primary : theme.colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Text variant="body" weight="600">
            {t('registerFlow.collegeNotAssociated')}
          </Text>
        </Pressable>

        {associated && (
          <>
            <Input
              label={t('registerFlow.collegeName')}
              placeholder={t('registerFlow.collegeNamePlaceholder')}
              value={collegeName}
              onChangeText={setCollegeName}
              iconLeft="business-outline"
            />
            <Input
              label={t('registerFlow.collegeUrl')}
              placeholder="https://www.colegio.cr/..."
              value={collegeUrl}
              onChangeText={setCollegeUrl}
              autoCapitalize="none"
              keyboardType="url"
              iconLeft="link-outline"
            />
            <Input
              label={t('registerFlow.licenseNumber')}
              placeholder={t('registerFlow.licensePlaceholder')}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              iconLeft="card-outline"
            />
            <Input
              label={t('registerFlow.licenseVerificationUrl')}
              placeholder="https://..."
              value={licenseVerificationUrl}
              onChangeText={setLicenseVerificationUrl}
              autoCapitalize="none"
              keyboardType="url"
              iconLeft="shield-checkmark-outline"
            />
            <ImageUploadField
              label={t('registerFlow.uploadLicenseDoc')}
              hint={t('registerFlow.uploadLicenseDocHint')}
              imageUri={licenseDocUrl}
              onPick={onUploadLicense}
              loading={uploading}
              cameraType={ImagePicker.CameraType.back}
            />
          </>
        )}

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
