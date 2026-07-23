import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, View } from 'react-native';

import { Button, Card, Input, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { DropdownField, SectionHeader } from '@/components/molecules';
import { AdminCountryOption, adminApi } from '@/api/admin.api';
import { AppSettings, CountryCommissionRule } from '@/types';
import { roleAccent, spacing } from '@/theme';

const percentToInput = (value?: number) => String(Number(((value ?? 0) * 100).toFixed(2)));
const inputToRate = (value: string) => Math.max(0, (Number(value.replace(',', '.')) || 0) / 100);

function normalizeCountryCode(value: string) {
  return value.trim().toUpperCase();
}

export default function SuperAdminCommissions() {
  const { t } = useTranslation();
  const accent = roleAccent.superAdmin;
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [countries, setCountries] = useState<AdminCountryOption[]>([]);
  const [countryCode, setCountryCode] = useState('CR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.getSettings(), adminApi.listCountries()])
      .then(([nextSettings, nextCountries]) => {
        setSettings(nextSettings);
        setCountries(nextCountries);
      })
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  const updateCountryRate = (
    key: 'platformCommissionRatesByCountry' | 'marketplaceCommissionRatesByCountry' | 'taxRatesByCountry',
    value: string,
  ) => {
    if (!settings) return;
    const code = normalizeCountryCode(countryCode);
    if (!code) return;
    setSettings({
      ...settings,
      [key]: {
        ...(settings[key] ?? {}),
        [code]: inputToRate(value),
      },
    });
  };

  const updateCustomRules = (rules: CountryCommissionRule[]) => {
    if (!settings) return;
    const code = normalizeCountryCode(countryCode);
    setSettings({
      ...settings,
      customCommissionRulesByCountry: {
        ...(settings.customCommissionRulesByCountry ?? {}),
        [code]: rules,
      },
    });
  };

  const updateCustomRule = (index: number, patch: Partial<CountryCommissionRule>) => {
    const rules = [...(settings?.customCommissionRulesByCountry?.[code] ?? [])];
    rules[index] = { ...rules[index], ...patch };
    updateCustomRules(rules);
  };

  const addCustomRule = () => {
    const rules = settings?.customCommissionRulesByCountry?.[code] ?? [];
    updateCustomRules([
      ...rules,
      {
        key: `custom_${rules.length + 1}`,
        label: t('admin.commissions.customDefaultLabel'),
        rate: 0,
        deductFromProfessional: true,
        taxable: true,
        active: true,
      },
    ]);
  };

  const removeCustomRule = (index: number) => {
    updateCustomRules((settings?.customCommissionRulesByCountry?.[code] ?? []).filter((_, ruleIndex) => ruleIndex !== index));
  };

  const addCountry = () => {
    if (!settings) return;
    const code = normalizeCountryCode(countryCode);
    if (!code) {
      Alert.alert(t('nav.commissions'), t('admin.commissions.countryRequired'));
      return;
    }
    setSettings({
      ...settings,
      platformCommissionRatesByCountry: {
        ...(settings.platformCommissionRatesByCountry ?? {}),
        [code]: settings.platformCommissionRatesByCountry?.[code] ?? settings.defaultPlatformCommissionRate ?? 0,
      },
      marketplaceCommissionRatesByCountry: {
        ...(settings.marketplaceCommissionRatesByCountry ?? {}),
        [code]: settings.marketplaceCommissionRatesByCountry?.[code] ?? settings.marketplaceCommissionRate ?? 0,
      },
      taxRatesByCountry: {
        ...(settings.taxRatesByCountry ?? {}),
        [code]: settings.taxRatesByCountry?.[code] ?? 0,
      },
    });
  };

  if (loading) return <Spinner fullscreen />;
  if (!settings) return null;

  const code = normalizeCountryCode(countryCode);
  const platformRate = settings.platformCommissionRatesByCountry?.[code] ?? settings.defaultPlatformCommissionRate ?? 0;
  const marketplaceRate = settings.marketplaceCommissionRatesByCountry?.[code] ?? settings.marketplaceCommissionRate ?? 0;
  const taxRate = settings.taxRatesByCountry?.[code] ?? 0;
  const configuredCountries = Array.from(
    new Set([
      ...Object.keys(settings.platformCommissionRatesByCountry ?? {}),
      ...Object.keys(settings.marketplaceCommissionRatesByCountry ?? {}),
      ...Object.keys(settings.taxRatesByCountry ?? {}),
      ...Object.keys(settings.customCommissionRulesByCountry ?? {}),
    ]),
  ).sort();
  const customRules = settings.customCommissionRulesByCountry?.[code] ?? [];
  const countryOptions = countries.map((country) => ({
    label: `${country.name} (${country.code})${country.configured || configuredCountries.includes(country.code) ? ' ✓' : ''}`,
    value: country.code,
  }));

  return (
    <ScreenContainer scroll>
      <SectionHeader title={t('nav.commissions')} subtitle={t('admin.commissions.subtitle')} />
      <Card style={{ gap: 16 }}>
        <Text variant="bodyStrong">{t('admin.commissions.country')}</Text>
        <DropdownField
          label={t('admin.commissions.countryCode')}
          value={countryCode}
          options={countryOptions}
          onChange={(value) => setCountryCode(value)}
          placeholder="CR"
        />
        <Button label={t('admin.commissions.addCountry')} variant="outline" accentColor={accent} onPress={addCountry} />
        {configuredCountries.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {configuredCountries.map((country) => (
              <Button key={country} label={country} size="sm" variant={country === code ? 'primary' : 'outline'} accentColor={accent} onPress={() => setCountryCode(country)} />
            ))}
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 16 }}>
        <Text variant="bodyStrong">{t('admin.commissions.rulesFor', { country: code || t('admin.commissions.country') })}</Text>
        <Input
          label={t('admin.commissions.proConnectCommission')}
          value={percentToInput(platformRate)}
          onChangeText={(value) => updateCountryRate('platformCommissionRatesByCountry', value)}
          keyboardType="numeric"
        />
        <Input
          label={t('admin.commissions.marketplaceCommission')}
          value={percentToInput(marketplaceRate)}
          onChangeText={(value) => updateCountryRate('marketplaceCommissionRatesByCountry', value)}
          keyboardType="numeric"
        />
        <Input
          label={t('admin.commissions.countryTax')}
          value={percentToInput(taxRate)}
          onChangeText={(value) => updateCountryRate('taxRatesByCountry', value)}
          keyboardType="numeric"
        />
        <Text variant="caption" color="textSecondary">
          {t('admin.commissions.invoiceHint')}
        </Text>
      </Card>
      <Card style={{ gap: 16 }}>
        <View style={{ gap: spacing.xs }}>
          <Text variant="bodyStrong">{t('admin.commissions.customTitle')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('admin.commissions.customSubtitle')}
          </Text>
        </View>
        {customRules.map((rule, index) => (
          <Card key={`${rule.key}-${index}`} style={{ gap: 12, borderColor: `${accent}33` }}>
            <Input
              label={t('admin.commissions.customName')}
              value={rule.label}
              onChangeText={(value) => updateCustomRule(index, { label: value })}
            />
            <Input
              label={t('admin.commissions.customKey')}
              value={rule.key}
              onChangeText={(value) => updateCustomRule(index, { key: value.trim().toLowerCase().replace(/\s+/g, '_') })}
              autoCapitalize="none"
            />
            <Input
              label={t('admin.commissions.customRate')}
              value={percentToInput(rule.rate)}
              onChangeText={(value) => updateCustomRule(index, { rate: inputToRate(value) })}
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Button
                label={rule.active === false ? t('admin.commissions.inactive') : t('admin.commissions.active')}
                size="sm"
                variant={rule.active === false ? 'outline' : 'primary'}
                accentColor={accent}
                onPress={() => updateCustomRule(index, { active: rule.active === false })}
              />
              <Button
                label={
                  rule.deductFromProfessional === false
                    ? t('admin.commissions.chargedToClient')
                    : t('admin.commissions.deductFromProfessional')
                }
                size="sm"
                variant="outline"
                accentColor={accent}
                onPress={() => updateCustomRule(index, { deductFromProfessional: rule.deductFromProfessional === false })}
              />
              <Button
                label={rule.taxable === false ? t('admin.commissions.notTaxable') : t('admin.commissions.taxable')}
                size="sm"
                variant="outline"
                accentColor={accent}
                onPress={() => updateCustomRule(index, { taxable: rule.taxable === false })}
              />
            </View>
            <Button
              label={t('admin.commissions.removeCustom')}
              variant="ghost"
              accentColor={accent}
              onPress={() => removeCustomRule(index)}
            />
          </Card>
        ))}
        <Button label={t('admin.commissions.addCustom')} variant="outline" accentColor={accent} onPress={addCustomRule} />
      </Card>
      <Button label={t('screens.save')} accentColor={accent} loading={saving} onPress={onSave} />
    </ScreenContainer>
  );
}
