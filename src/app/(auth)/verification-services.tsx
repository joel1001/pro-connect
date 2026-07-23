import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { CredentialStepActions, OnboardingStepHeader, ProfessionalPricingNotice } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { PricingType, ServiceEntryInput } from '@/types';
import { roleAccent, radius, spacing } from '@/theme';

const emptyService = (): ServiceEntryInput => ({
  name: '',
  description: '',
  price: 0,
  currency: 'USD',
  pricingType: 'FIXED',
  allowsBargaining: false,
  durationMinutes: 60,
});

export default function VerificationServices() {
  const { t } = useTranslation();
  const meta = credentialMeta('services');
  const accent = roleAccent.professional;
  const [items, setItems] = useState<ServiceEntryInput[]>([emptyService()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('services') as never);

  const update = (index: number, patch: Partial<ServiceEntryInput>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const buildPayload = () =>
    items
      .map((s) => ({
        ...s,
        name: s.name.trim(),
        description: s.description?.trim() || undefined,
        price: Number(s.price),
        currency: s.currency || 'USD',
        durationMinutes: s.durationMinutes || 60,
      }))
      .filter((s) => s.name && s.price > 0);

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('services', {
        skipped: skip,
        services: skip ? [] : buildPayload(),
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
      subtitle={t('registerFlow.servicesHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepServices')}
          badge={t('registerFlow.stepRecommended')}
        />

        <ProfessionalPricingNotice compact />

        {items.map((item, index) => (
          <View
            key={index}
            style={{
              gap: spacing.sm,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: '#E2E8E5',
              borderRadius: radius.lg,
            }}
          >
            <Text variant="bodyStrong">{t('registerFlow.serviceItem', { index: index + 1 })}</Text>
            <Input
              label={t('registerFlow.serviceName')}
              value={item.name}
              onChangeText={(v) => update(index, { name: v })}
            />
            <Input
              label={t('registerFlow.serviceDescription')}
              value={item.description ?? ''}
              onChangeText={(v) => update(index, { description: v })}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label={t('registerFlow.pricingFixed')}
                variant={item.pricingType === 'FIXED' ? 'primary' : 'outline'}
                accentColor={accent}
                size="sm"
                onPress={() => update(index, { pricingType: 'FIXED' as PricingType })}
                style={{ flex: 1 }}
              />
              <Button
                label={t('registerFlow.pricingHourly')}
                variant={item.pricingType === 'HOURLY' ? 'primary' : 'outline'}
                accentColor={accent}
                size="sm"
                onPress={() => update(index, { pricingType: 'HOURLY' as PricingType })}
                style={{ flex: 1 }}
              />
            </View>
            <Input
              label={
                item.pricingType === 'HOURLY'
                  ? t('registerFlow.pricePerHour')
                  : t('registerFlow.pricePerService')
              }
              value={item.price ? String(item.price) : ''}
              onChangeText={(v) => update(index, { price: Number(v.replace(/[^0-9.]/g, '')) || 0 })}
              keyboardType="numeric"
            />
            <Pressable
              onPress={() => update(index, { allowsBargaining: !item.allowsBargaining })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: accent,
                  backgroundColor: item.allowsBargaining ? accent : 'transparent',
                }}
              />
              <Text variant="caption">{t('registerFlow.allowsBargaining')}</Text>
            </Pressable>
          </View>
        ))}

        <Button label={t('registerFlow.addService')} variant="outline" accentColor={accent} onPress={() => setItems((p) => [...p, emptyService()])} />

        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}

        <CredentialStepActions
          hint={t('registerFlow.servicesOptionalHint')}
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
