import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { CredentialStepActions, ImageUploadField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { CertificationEntry, onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { spacing } from '@/theme';

const emptyCert = (): CertificationEntry => ({ name: '', issuer: '', credentialUrl: '' });

export default function VerificationCertifications() {
  const { t } = useTranslation();
  const meta = credentialMeta('certifications');
  const [items, setItems] = useState<CertificationEntry[]>([emptyCert()]);
  const [docUrls, setDocUrls] = useState<(string | null)[]>([null]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('certifications') as never);

  const update = (index: number, field: keyof CertificationEntry, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const onUploadDoc = async (index: number, uri: string, fileName: string, mimeType: string) => {
    setUploadingIndex(index);
    setError(null);
    try {
      const uploaded = await onboardingApi.upload('certification', uri, fileName, mimeType);
      setDocUrls((prev) => prev.map((u, i) => (i === index ? uploaded.url : u)));
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploadingIndex(null);
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyCert()]);
    setDocUrls((prev) => [...prev, null]);
  };

  const buildPayload = () =>
    items
      .map((c, index) => ({
        ...c,
        name: c.name.trim(),
        issuer: c.issuer?.trim() || undefined,
        credentialUrl: c.credentialUrl?.trim() || undefined,
        documentUrl: docUrls[index] ?? undefined,
      }))
      .filter((c) => c.name);

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('certifications', {
        skipped: skip,
        certifications: skip ? [] : buildPayload(),
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
      subtitle={t('registerFlow.certificationsHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepCertifications')}
          badge={t('registerFlow.stepRecommended')}
        />
        {items.map((item, index) => (
          <View key={index} style={{ gap: spacing.sm }}>
            <Text variant="caption" color="textSecondary" weight="600">
              {t('registerFlow.certificationItem', { n: index + 1 })}
            </Text>
            <Input
              label={t('registerFlow.certName')}
              placeholder={t('registerFlow.certNamePlaceholder')}
              value={item.name}
              onChangeText={(v) => update(index, 'name', v)}
              iconLeft="ribbon-outline"
            />
            <Input
              label={t('registerFlow.certIssuer')}
              placeholder={t('registerFlow.certIssuerPlaceholder')}
              value={item.issuer ?? ''}
              onChangeText={(v) => update(index, 'issuer', v)}
              iconLeft="business-outline"
            />
            <Input
              label={t('registerFlow.certUrl')}
              placeholder="https://..."
              value={item.credentialUrl ?? ''}
              onChangeText={(v) => update(index, 'credentialUrl', v)}
              autoCapitalize="none"
              keyboardType="url"
              iconLeft="link-outline"
            />
            <ImageUploadField
              label={t('registerFlow.uploadCertDoc')}
              hint={t('registerFlow.uploadCertDocHint')}
              imageUri={docUrls[index]}
              onPick={(uri, fileName, mimeType) => onUploadDoc(index, uri, fileName, mimeType)}
              loading={uploadingIndex === index}
              cameraType={ImagePicker.CameraType.back}
            />
          </View>
        ))}
        <Button label={t('registerFlow.addAnother')} variant="ghost" onPress={addItem} />
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
          continueDisabled={uploadingIndex !== null}
          onContinue={() => save(false)}
          onSkip={() => save(true)}
        />
      </ScrollView>
    </AuthLayout>
  );
}
