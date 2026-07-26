import { getLocales } from 'expo-localization';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countriesApi, Country } from '@/api/countries-info.api';
import { Icon, Input, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  countryLabel: string;
  cancelLabel: string;
  onCountryChange?: (country: Country) => void;
};

export function PhoneNumberField({
  label,
  placeholder,
  value,
  onChangeText,
  countryLabel,
  cancelLabel,
  onCountryChange,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    countriesApi
      .getAll()
      .then((data) => {
        if (!active) return;

        const regionCode = getLocales()[0]?.regionCode?.toUpperCase() ?? 'US';
        const defaultCountry =
          data.find((country) => country.code === regionCode) ??
          data.find((country) => country.code === 'US') ??
          data[0] ??
          null;

        setCountries(data);
        setSelectedCountry(defaultCountry);
        if (defaultCountry) onCountryChange?.(defaultCountry);
      })
      .catch((error) => console.error('Error loading countries:', error));

    return () => {
      active = false;
    };
  }, [onCountryChange]);

  const selectCountry = (country: Country) => {
    setSelectedCountry(country);
    onCountryChange?.(country);
    setOpen(false);
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="caption" color="textSecondary" weight="600">
        {label}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={countryLabel}
          accessibilityState={{ expanded: open, disabled: countries.length === 0 }}
          disabled={countries.length === 0}
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            width: 122,
            height: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            borderWidth: 1.5,
            borderColor: open ? theme.colors.primary : theme.colors.border,
            borderRadius: radius.md,
            backgroundColor: theme.colors.surface,
            opacity: pressed || countries.length === 0 ? 0.65 : 1,
          })}
        >
          <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
            {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.dialCode}` : '—'}
          </Text>
          <Icon name="chevron-down" size={17} color={theme.colors.textMuted} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Input
            accessibilityLabel={label}
            placeholder={placeholder}
            keyboardType="phone-pad"
            iconLeft="call-outline"
            value={value}
            onChangeText={onChangeText}
          />
        </View>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: theme.colors.overlay,
          }}
        >
          <Pressable
            accessibilityRole="none"
            onPress={(event) => event.stopPropagation()}
            style={{
              maxHeight: '70%',
              paddingTop: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.md,
                paddingBottom: spacing.sm,
              }}
            >
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {countryLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                hitSlop={8}
                style={{ paddingVertical: spacing.xs }}
              >
                <Text variant="body" color="primary" weight="600">
                  {cancelLabel}
                </Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {countries.map((country) => {
                const active = selectedCountry?.code === country.code;

                return (
                  <Pressable
                    key={country.code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => selectCountry(country)}
                    style={{
                      minHeight: 52,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <Text variant="body" style={{ fontSize: 22 }}>
                      {country.flag}
                    </Text>
                    <Text variant="body" weight={active ? '700' : '400'} style={{ flex: 1 }}>
                      {country.name}
                    </Text>
                    <Text variant="body" color={active ? 'primary' : 'textSecondary'}>
                      {country.dialCode}
                    </Text>
                    {active && <Icon name="checkmark" size={18} color={theme.colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
