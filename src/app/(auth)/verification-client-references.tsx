import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { CredentialStepActions, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { ClientReferenceEntry, onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { spacing } from '@/theme';

const emptyReference = (): ClientReferenceEntry => ({
  clientName: '',
  company: '',
  contactPhone: '',
  contactEmail: '',
  projectDescription: '',
  testimonial: '',
  referenceUrl: '',
});

export default function VerificationClientReferences() {
  const { t } = useTranslation();
  const meta = credentialMeta('clientReferences');
  const [items, setItems] = useState<ClientReferenceEntry[]>([emptyReference()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('clientReferences') as never);

  const update = (index: number, field: keyof ClientReferenceEntry, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyReference()]);

  const buildPayload = () =>
    items
      .map((r) => ({
        clientName: r.clientName.trim(),
        company: r.company?.trim() || undefined,
        contactPhone: r.contactPhone?.trim() || undefined,
        contactEmail: r.contactEmail?.trim() || undefined,
        projectDescription: r.projectDescription?.trim() || undefined,
        testimonial: r.testimonial?.trim() || undefined,
        referenceUrl: r.referenceUrl?.trim() || undefined,
      }))
      .filter((r) => r.clientName);

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('clientReferences', {
        skipped: skip,
        clientReferences: skip ? [] : buildPayload(),
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
      subtitle={t('registerFlow.clientReferencesHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepClientReferences')}
          badge={t('registerFlow.stepRecommended')}
        />
        {items.map((item, index) => (
          <View key={index} style={{ gap: spacing.sm }}>
            <Text variant="caption" color="textSecondary" weight="600">
              {t('registerFlow.clientReferenceItem', { n: index + 1 })}
            </Text>
            <Input
              label={t('registerFlow.clientReferenceName')}
              placeholder={t('registerFlow.clientReferenceNamePlaceholder')}
              value={item.clientName}
              onChangeText={(v) => update(index, 'clientName', v)}
              iconLeft="person-outline"
            />
            <Input
              label={t('registerFlow.clientReferenceCompany')}
              placeholder={t('registerFlow.clientReferenceCompanyPlaceholder')}
              value={item.company ?? ''}
              onChangeText={(v) => update(index, 'company', v)}
              iconLeft="business-outline"
            />
            <Input
              label={t('registerFlow.clientReferencePhone')}
              placeholder="+506 7000 0000"
              value={item.contactPhone ?? ''}
              onChangeText={(v) => update(index, 'contactPhone', v)}
              keyboardType="phone-pad"
              iconLeft="call-outline"
            />
            <Input
              label={t('registerFlow.clientReferenceEmail')}
              placeholder="cliente@example.com"
              value={item.contactEmail ?? ''}
              onChangeText={(v) => update(index, 'contactEmail', v)}
              autoCapitalize="none"
              keyboardType="email-address"
              iconLeft="mail-outline"
            />
            <Input
              label={t('registerFlow.clientReferenceProject')}
              placeholder={t('registerFlow.clientReferenceProjectPlaceholder')}
              value={item.projectDescription ?? ''}
              onChangeText={(v) => update(index, 'projectDescription', v)}
              iconLeft="briefcase-outline"
            />
            <Input
              label={t('registerFlow.clientReferenceTestimonial')}
              placeholder={t('registerFlow.clientReferenceTestimonialPlaceholder')}
              value={item.testimonial ?? ''}
              onChangeText={(v) => update(index, 'testimonial', v)}
              iconLeft="chatbubble-outline"
            />
            <Input
              label={t('registerFlow.clientReferenceLink')}
              placeholder="https://..."
              value={item.referenceUrl ?? ''}
              onChangeText={(v) => update(index, 'referenceUrl', v)}
              autoCapitalize="none"
              keyboardType="url"
              iconLeft="link-outline"
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
          onContinue={() => save(false)}
          onSkip={() => save(true)}
        />
      </ScrollView>
    </AuthLayout>
  );
}
