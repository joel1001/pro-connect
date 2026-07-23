import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { CredentialStepActions, ImageUploadField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { CompletedWorkEntry, onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { spacing } from '@/theme';

const emptyWork = (): CompletedWorkEntry => ({ title: '', description: '', externalUrl: '' });

export default function VerificationWork() {
  const { t } = useTranslation();
  const meta = credentialMeta('work');
  const [items, setItems] = useState<CompletedWorkEntry[]>([emptyWork()]);
  const [photoUrls, setPhotoUrls] = useState<(string | null)[]>([null]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('work') as never);

  const update = (index: number, field: keyof CompletedWorkEntry, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const onUploadPhoto = async (index: number, uri: string, fileName: string, mimeType: string) => {
    setUploadingIndex(index);
    setError(null);
    try {
      const uploaded = await onboardingApi.upload('work', uri, fileName, mimeType);
      setPhotoUrls((prev) => prev.map((u, i) => (i === index ? uploaded.url : u)));
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploadingIndex(null);
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyWork()]);
    setPhotoUrls((prev) => [...prev, null]);
  };

  const buildPayload = () =>
    items
      .map((w, index) => ({
        title: w.title.trim(),
        description: w.description?.trim() || undefined,
        externalUrl: w.externalUrl?.trim() || undefined,
        imageUrls: photoUrls[index] ? [photoUrls[index]!] : undefined,
      }))
      .filter((w) => w.title);

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('completedWork', {
        skipped: skip,
        completedWorks: skip ? [] : buildPayload(),
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
      subtitle={t('registerFlow.workHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepWork')}
          badge={t('registerFlow.stepRecommended')}
        />
        {items.map((item, index) => (
          <View key={index} style={{ gap: spacing.sm }}>
            <Text variant="caption" color="textSecondary" weight="600">
              {t('registerFlow.workItem', { n: index + 1 })}
            </Text>
            <Input
              label={t('registerFlow.workTitle')}
              placeholder={t('registerFlow.workTitlePlaceholder')}
              value={item.title}
              onChangeText={(v) => update(index, 'title', v)}
              iconLeft="hammer-outline"
            />
            <Input
              label={t('registerFlow.workDescription')}
              placeholder={t('registerFlow.workDescriptionPlaceholder')}
              value={item.description ?? ''}
              onChangeText={(v) => update(index, 'description', v)}
              iconLeft="document-text-outline"
            />
            <Input
              label={t('registerFlow.workLink')}
              placeholder="https://..."
              value={item.externalUrl ?? ''}
              onChangeText={(v) => update(index, 'externalUrl', v)}
              autoCapitalize="none"
              keyboardType="url"
              iconLeft="link-outline"
            />
            <ImageUploadField
              label={t('registerFlow.uploadWorkPhoto')}
              hint={t('registerFlow.uploadWorkPhotoHint')}
              imageUri={photoUrls[index]}
              onPick={(uri, fileName, mimeType) => onUploadPhoto(index, uri, fileName, mimeType)}
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
