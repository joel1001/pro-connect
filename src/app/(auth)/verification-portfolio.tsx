import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { CredentialStepActions, DropdownField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi, PortfolioLinkEntry } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import { CREDENTIAL_TOTAL_STEPS, credentialMeta, nextCredentialRoute } from '@/lib/credentialFlow';
import { spacing } from '@/theme';

const LINK_TYPES = [
  { label: 'Portfolio', value: 'portfolio' },
  { label: 'Website', value: 'website' },
  { label: 'GitHub', value: 'github' },
  { label: 'Behance', value: 'behance' },
  { label: 'Dribbble', value: 'dribbble' },
];

const emptyLink = (): PortfolioLinkEntry => ({ title: '', url: '', type: 'portfolio' });

export default function VerificationPortfolio() {
  const { t } = useTranslation();
  const meta = credentialMeta('portfolio');
  const [links, setLinks] = useState<PortfolioLinkEntry[]>([emptyLink()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => router.push(nextCredentialRoute('portfolio') as never);

  const save = async (skip: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onboardingApi.completeStep('portfolio', {
        skipped: skip,
        portfolioLinks: skip ? [] : links.filter((l) => l.url.trim()),
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
      subtitle={t('registerFlow.portfolioHint')}
      showBrand={false}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <OnboardingStepHeader
          step={meta.step}
          total={CREDENTIAL_TOTAL_STEPS}
          title={t('registerFlow.stepPortfolio')}
          badge={t('registerFlow.stepRecommended')}
        />
        {links.map((link, index) => (
          <View key={index} style={{ gap: spacing.sm }}>
            <Input
              label={t('registerFlow.portfolioLinkTitle', { n: index + 1 })}
              placeholder={t('registerFlow.portfolioLinkTitlePlaceholder')}
              value={link.title ?? ''}
              onChangeText={(v) => setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, title: v } : l)))}
              iconLeft="text-outline"
            />
            <Input
              label={t('registerFlow.portfolioLink', { n: index + 1 })}
              placeholder="https://..."
              value={link.url}
              onChangeText={(v) => setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, url: v } : l)))}
              autoCapitalize="none"
              keyboardType="url"
              iconLeft="globe-outline"
            />
            <DropdownField
              label={t('registerFlow.portfolioLinkType')}
              value={link.type ?? 'portfolio'}
              options={LINK_TYPES}
              onChange={(v) => setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, type: v } : l)))}
            />
          </View>
        ))}
        <Button label={t('registerFlow.addLink')} variant="ghost" onPress={() => setLinks((prev) => [...prev, emptyLink()])} />
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
