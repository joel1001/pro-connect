import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import { ImageUploadField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { spacing } from '@/theme';

export default function VerificationBiometric() {
  const { t } = useTranslation();
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [hint, setHint] = useState(t('registerFlow.blinkSlowly'));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    const hints = [t('registerFlow.blinkSlowly'), t('registerFlow.lookAtCamera'), t('registerFlow.holdStill')];
    let step = 0;
    const timer = setInterval(() => {
      step = (step + 1) % hints.length;
      setHint(hints[step]);
    }, 2000);
    return () => clearInterval(timer);
  }, [t]);

  const onUploadSelfie = async (uri: string, fileName: string, mimeType: string) => {
    setError(null);
    setLoading(true);
    try {
      const uploaded = await onboardingApi.upload('selfie', uri, fileName, mimeType);
      await onboardingApi.completeStep('selfie', { documentUrl: uploaded.url });
      setSelfieUrl(uploaded.url);
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setLoading(false);
    }
  };

  const onFaceMatch = async () => {
    setError(null);
    setMatching(true);
    try {
      const result = await onboardingApi.faceMatch();
      setMatchScore(result.similarityScore);
      setMatched(result.matched);
      if (!result.matched) {
        setError(result.message || t('registerFlow.faceMatchFailed'));
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setMatching(false);
    }
  };

  return (
    <AuthLayout title={t('registerFlow.biometricTitle')} subtitle={t('registerFlow.biometricSubtitle')} showBrand={false}>
      <OnboardingStepHeader step={3} title={t('registerFlow.stepSelfie')} />
      <View style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md }}>
        <Text variant="body" center color="textSecondary">
          {hint}
        </Text>
        <ImageUploadField
          label={t('registerFlow.uploadSelfie')}
          hint={t('registerFlow.uploadSelfieHint')}
          qualityTip={t('registerFlow.photoQualityTipSelfie')}
          imageUri={selfieUrl}
          onPick={onUploadSelfie}
          loading={loading}
        />
        {matchScore != null && (
          <Text variant="caption" color={matched ? 'success' : 'danger'} center>
            {t('registerFlow.faceMatchScore', { score: Math.round(matchScore) })}
          </Text>
        )}
        {error && (
          <Text variant="caption" color="danger" center>
            {error}
          </Text>
        )}
        {!matched ? (
          <Button
            label={t('registerFlow.runFaceMatch')}
            loading={matching}
            disabled={!selfieUrl || loading}
            onPress={onFaceMatch}
            fullWidth
          />
        ) : (
          <Button label={t('common.continue')} onPress={() => router.back()} fullWidth />
        )}
      </View>
    </AuthLayout>
  );
}
