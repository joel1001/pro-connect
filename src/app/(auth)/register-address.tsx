import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { DropdownField, OnboardingStepHeader } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { onboardingApi } from '@/api/onboarding.api';
import { getApiErrorMessage } from '@/api/client';
import {
  COSTA_RICA_COUNTRY_NAME,
  CostaRicaLocationOption,
  getCostaRicaProvinces,
} from '@/lib/costaRicaLocations';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

function toOptions(items: CostaRicaLocationOption[]) {
  return items.map((i) => ({ label: i.name, value: i.name }));
}

export default function RegisterAddress() {
  const { t } = useTranslation();
  const theme = useTheme();
  const role = useAuthStore((s) => s.user?.role ?? 'CLIENT');

  const provinces = useMemo(() => getCostaRicaProvinces(), []);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [exactReference, setExactReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const provinceNode = useMemo(
    () => provinces.find((p) => p.name === province),
    [provinces, province],
  );
  const cityNode = useMemo(
    () => provinceNode?.children.find((c) => c.name === city),
    [provinceNode, city],
  );

  const canSubmit = province && city && street && exactReference.trim();

  const onContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      await onboardingApi.saveAddress({
        country: COSTA_RICA_COUNTRY_NAME,
        province,
        canton: city,
        district: street,
        streetLine: exactReference.trim(),
      });
      router.push('/(auth)/register-security' as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('registerFlow.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('registerFlow.addressTitle')}
      subtitle={t('registerFlow.addressSubtitle')}
      showBrand={false}
    >
      <OnboardingStepHeader step={2} total={role === 'PROFESSIONAL' ? 15 : 3} title={t('registerFlow.addressStep')} />
      <View style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <Text variant="caption" color="textSecondary" weight="600">
            {t('registerFlow.country')}
          </Text>
          <View
            style={{
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceSunken,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
            }}
          >
            <Text variant="body" weight="600" color="text">
              {COSTA_RICA_COUNTRY_NAME}
            </Text>
            <Text variant="caption" color="textMuted">
              {t('registerFlow.countryFixed')}
            </Text>
          </View>
        </View>

        <DropdownField
          label={t('registerFlow.province')}
          value={province}
          options={toOptions(provinces)}
          placeholder={t('registerFlow.selectProvince')}
          onChange={(v) => {
            setProvince(v);
            setCity('');
            setStreet('');
            setExactReference('');
          }}
        />

        <DropdownField
          label={t('registerFlow.city')}
          value={city}
          options={provinceNode ? toOptions(provinceNode.children) : []}
          placeholder={t('registerFlow.selectCity')}
          disabled={!province}
          disabledHint={t('registerFlow.selectProvinceFirst')}
          onChange={(v) => {
            setCity(v);
            setStreet('');
            setExactReference('');
          }}
        />

        <DropdownField
          label={t('registerFlow.streetLevel')}
          value={street}
          options={cityNode ? toOptions(cityNode.children) : []}
          placeholder={t('registerFlow.selectStreet')}
          disabled={!city}
          disabledHint={t('registerFlow.selectCityFirst')}
          onChange={(v) => {
            setStreet(v);
            setExactReference('');
          }}
        />

        <Input
          label={t('registerFlow.exactReference')}
          placeholder={t('registerFlow.exactReferencePlaceholder')}
          value={exactReference}
          onChangeText={setExactReference}
          iconLeft="home-outline"
          editable={!!street}
        />

        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        <Button label={t('common.continue')} loading={loading} disabled={!canSubmit} onPress={onContinue} />
      </View>
    </AuthLayout>
  );
}
