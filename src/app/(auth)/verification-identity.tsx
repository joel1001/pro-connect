import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import { IdentityDataCard, ImageUploadField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi, IdentityDocumentData } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { spacing } from '@/theme';

export default function VerificationIdentity() {
  const { t } = useTranslation();
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [idData, setIdData] = useState<IdentityDocumentData | null>(null);
  const [idAnalyzed, setIdAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'front' | 'back' | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveAndMaybeAnalyze = async (front: string | null, back: string | null) => {
    await onboardingApi.completeStep('identityDocument', {
      documentUrl: front ?? undefined,
      documentBackUrl: back ?? undefined,
    });
    if (front && back) {
      setAnalyzing(true);
      try {
        const result = await onboardingApi.analyzeId();
        if (result.success && result.extracted) {
          setIdData(result.extracted);
          setIdAnalyzed(true);
        } else {
          setIdAnalyzed(false);
          setError(result.message || t('registerFlow.idAnalysisFailed'));
        }
      } catch (e) {
        setIdAnalyzed(false);
        setError(getApiErrorMessage(e, t('registerFlow.idAnalysisFailed')));
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const onUploadFront = async (uri: string, fileName: string, mimeType: string) => {
    setError(null);
    setUploading('front');
    try {
      const uploaded = await onboardingApi.upload('identity-front', uri, fileName, mimeType);
      setIdFrontUrl(uploaded.url);
      setIdAnalyzed(false);
      setIdData(null);
      await saveAndMaybeAnalyze(uploaded.url, idBackUrl);
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploading(null);
    }
  };

  const onUploadBack = async (uri: string, fileName: string, mimeType: string) => {
    setError(null);
    setUploading('back');
    try {
      const uploaded = await onboardingApi.upload('identity-back', uri, fileName, mimeType);
      setIdBackUrl(uploaded.url);
      setIdAnalyzed(false);
      setIdData(null);
      await saveAndMaybeAnalyze(idFrontUrl, uploaded.url);
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploading(null);
    }
  };

  const onSave = async () => {
    if (!idAnalyzed) return;
    setLoading(true);
    try {
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('registerFlow.stepIdentity')} subtitle={t('registerFlow.identityHint')} showBrand={false}>
      <OnboardingStepHeader step={2} title={t('registerFlow.stepIdentity')} />
      <View style={{ gap: spacing.md }}>
        <ImageUploadField
          label={t('registerFlow.uploadIdFront')}
          hint={t('registerFlow.uploadIdHint')}
          imageUri={idFrontUrl}
          onPick={onUploadFront}
          loading={uploading === 'front'}
          cameraType={ImagePicker.CameraType.back}
        />
        <ImageUploadField
          label={t('registerFlow.uploadIdBack')}
          hint={t('registerFlow.uploadIdBackHint')}
          imageUri={idBackUrl}
          onPick={onUploadBack}
          loading={uploading === 'back'}
          cameraType={ImagePicker.CameraType.back}
        />
        {analyzing && (
          <Text variant="caption" color="textSecondary" center>
            {t('registerFlow.idAnalyzing')}
          </Text>
        )}
        {idAnalyzed && idData && <IdentityDataCard data={idData} />}
        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        <Button
          label={t('common.continue')}
          loading={loading || analyzing}
          disabled={!idAnalyzed}
          onPress={onSave}
        />
      </View>
    </AuthLayout>
  );
}
