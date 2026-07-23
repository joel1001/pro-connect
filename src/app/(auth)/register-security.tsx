import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import { IdentityDataCard, ImageUploadField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi, IdentityDocumentData } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS } from '@/lib/credentialFlow';
import { useAuthStore } from '@/store/authStore';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { spacing } from '@/theme';

const CLIENT_TOTAL_STEPS = 3;

export default function RegisterSecurity() {
  const { t } = useTranslation();
  const activeRole = useAuthStore((s) => s.user?.role);
  const registrationRole = useRegistrationRoleStore((s) => s.role);
  const role = activeRole ?? registrationRole ?? 'CLIENT';
  const isProfessional = role === 'PROFESSIONAL';

  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [idData, setIdData] = useState<IdentityDocumentData | null>(null);
  const [idAnalyzed, setIdAnalyzed] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [hint, setHint] = useState(t('registerFlow.lookAtCamera'));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'front' | 'back' | 'selfie' | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matched, setMatched] = useState(false);

  const saveIdentityUrls = async (front: string | null, back: string | null) => {
    await onboardingApi.completeStep('identityDocument', {
      documentUrl: front ?? undefined,
      documentBackUrl: back ?? undefined,
    });
  };

  const runAnalyze = async (): Promise<boolean> => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await onboardingApi.analyzeId();
      if (result.success) {
        setIdData(result.extracted ?? null);
        setIdAnalyzed(true);
        return true;
      }
      setIdAnalyzed(false);
      setIdData(null);
      setError(result.message || t('registerFlow.idAnalysisFailed'));
      return false;
    } catch (e) {
      setIdAnalyzed(false);
      setError(getApiErrorMessage(e, t('registerFlow.idAnalysisFailed')));
      return false;
    } finally {
      setAnalyzing(false);
    }
  };

  const onUploadFront = async (uri: string, fileName: string, mimeType: string) => {
    setError(null);
    setUploading('front');
    try {
      const uploaded = await onboardingApi.upload('identity-front', uri, fileName, mimeType);
      const back = idBackUrl;
      setIdFrontUrl(uploaded.url);
      setIdAnalyzed(false);
      setIdData(null);
      setMatched(false);
      setMatchScore(null);
      await saveIdentityUrls(uploaded.url, back);
      if (back) await runAnalyze();
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
      const front = idFrontUrl;
      setIdBackUrl(uploaded.url);
      setIdAnalyzed(false);
      setIdData(null);
      setMatched(false);
      setMatchScore(null);
      await saveIdentityUrls(front, uploaded.url);
      if (front) await runAnalyze();
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploading(null);
    }
  };

  const onUploadSelfie = async (uri: string, fileName: string, mimeType: string) => {
    setError(null);
    setUploading('selfie');
    try {
      const uploaded = await onboardingApi.upload('selfie', uri, fileName, mimeType);
      await onboardingApi.completeStep('selfie', { documentUrl: uploaded.url });
      setSelfieUrl(uploaded.url);
      setMatched(false);
      setMatchScore(null);
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    if (!selfieUrl || matched) return;
    const hints = [t('registerFlow.blinkSlowly'), t('registerFlow.lookAtCamera'), t('registerFlow.holdStill')];
    let step = 0;
    const timer = setInterval(() => {
      step = (step + 1) % hints.length;
      setHint(hints[step]);
    }, 2000);
    return () => clearInterval(timer);
  }, [selfieUrl, matched, t]);

  const onFaceMatch = async () => {
    setError(null);
    setMatching(true);
    try {
      if (!idAnalyzed) {
        const ok = await runAnalyze();
        if (!ok) return;
      }
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

  const idReady = Boolean(idFrontUrl && idBackUrl);
  const canTakeSelfie = idReady && !analyzing && uploading !== 'front' && uploading !== 'back';
  const canFaceMatch = idReady && !!selfieUrl && uploading === null && !analyzing;

  const onContinueProfessional = () => {
    router.push('/(auth)/register-professional-notice' as never);
  };

  const onContinueClient = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (!idAnalyzed) {
        const ok = await runAnalyze();
        if (!ok) return;
      }
      await onboardingApi.submitForReview();
      router.replace('/(auth)/pending-review' as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('registerFlow.identityVerifyTitle')}
      subtitle={
        isProfessional
          ? t('registerFlow.identityVerifySubtitle')
          : t('registerFlow.identityVerifySubtitleClient')
      }
      showBrand={false}
    >
      <OnboardingStepHeader
        step={3}
        total={isProfessional ? CREDENTIAL_TOTAL_STEPS : CLIENT_TOTAL_STEPS}
        title={t('registerFlow.identityVerifyStep')}
      />
      <View style={{ gap: spacing.md }}>
        <Text variant="caption" color="textSecondary">
          {isProfessional
            ? t('registerFlow.identityBothSidesHint')
            : t('registerFlow.identityClientHint')}
        </Text>

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

        {isProfessional ? (
          <>
            <ImageUploadField
              label={t('registerFlow.uploadSelfie')}
              hint={
                canTakeSelfie
                  ? t('registerFlow.uploadSelfieHint')
                  : t('registerFlow.uploadSelfieWaitingId')
              }
              qualityTip={canTakeSelfie ? t('registerFlow.photoQualityTipSelfie') : undefined}
              imageUri={selfieUrl}
              onPick={onUploadSelfie}
              loading={uploading === 'selfie'}
              disabled={!canTakeSelfie}
              cameraType={ImagePicker.CameraType.front}
            />

            {!canTakeSelfie && !selfieUrl && (
              <Text variant="caption" color="textMuted" center>
                {t('registerFlow.uploadSelfieWaitingId')}
              </Text>
            )}

            {selfieUrl && !matched && (
              <Text variant="body" center color="textSecondary">
                {hint}
              </Text>
            )}

            {matchScore != null && (
              <Text variant="caption" color={matched ? 'success' : 'danger'} center>
                {t('registerFlow.faceMatchScore', { score: Math.round(matchScore) })}
              </Text>
            )}
          </>
        ) : null}

        {idReady && !idAnalyzed && !analyzing && (
          <Button
            label={t('registerFlow.retryIdAnalysis')}
            variant="ghost"
            onPress={runAnalyze}
          />
        )}

        {error && (
          <Text variant="caption" color="danger" center>
            {error}
          </Text>
        )}

        {!matched ? (
          isProfessional ? (
            <Button
              label={t('registerFlow.runFaceMatch')}
              loading={matching || analyzing}
              disabled={!canFaceMatch || matching}
              onPress={onFaceMatch}
            />
          ) : (
            <Button
              label={t('common.continue')}
              loading={submitting || analyzing}
              disabled={!idReady || !idAnalyzed || submitting}
              onPress={onContinueClient}
            />
          )
        ) : (
          <Button label={t('common.continue')} onPress={onContinueProfessional} />
        )}
      </View>
    </AuthLayout>
  );
}
