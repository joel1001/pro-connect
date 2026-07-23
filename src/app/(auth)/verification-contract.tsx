import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Text } from '@/components/atoms';
import {
  ContractDocumentEditor,
  ContractDocumentState,
  CredentialStepActions,
  OnboardingStepHeader,
} from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { roleAccent, spacing } from '@/theme';

export default function VerificationContract() {
  const { t } = useTranslation();
  const meta = credentialMeta('contract');
  const accent = roleAccent.professional;
  const [doc, setDoc] = useState<ContractDocumentState>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onboardingApi.progress().then((p) => {
      setDoc({
        pdfUrl: p.contractPdfUrl,
        documentText: p.contractDocumentText,
        documentSource: p.contractDocumentSource as ContractDocumentState['documentSource'],
      });
    }).catch(() => undefined);
  }, []);

  const goNext = () => router.push(nextCredentialRoute('contract') as never);

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('serviceContract', {
        skipped: skip,
        contractPdfUrl: skip ? undefined : doc.pdfUrl ?? undefined,
        contractSignedPdfUrl: skip ? undefined : doc.signedPdfUrl ?? undefined,
        contractDocumentText: skip ? undefined : doc.documentText ?? undefined,
        contractDocumentSource: skip ? undefined : doc.documentSource ?? undefined,
      });
      goNext();
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setLoading(false);
    }
  };

  const hasDocument = Boolean(doc.pdfUrl || doc.documentText);

  return (
    <AuthLayout
      title={t('registerFlow.credentialsPhaseTitle')}
      subtitle={t('registerFlow.contractHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepContract')}
          badge={t('registerFlow.stepRecommended')}
        />
        <ContractDocumentEditor
          editable
          context="onboarding"
          accentColor={accent}
          value={doc}
          onChange={setDoc}
        />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
        <CredentialStepActions
          hint={t('registerFlow.contractOptionalHint')}
          continueLabel={t('common.continue')}
          skipLabel={t('registerFlow.skipStep')}
          loading={loading}
          continueDisabled={!hasDocument}
          onContinue={() => save(false)}
          onSkip={() => save(true)}
        />
      </ScrollView>
    </AuthLayout>
  );
}
