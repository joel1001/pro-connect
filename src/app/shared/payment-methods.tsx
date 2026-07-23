import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Badge, Button, Card, Icon, Input, ScreenContainer, Text } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { SavedPaymentMethod, usePaymentMethodsStore } from '@/store/paymentMethodsStore';
import { radius, spacing } from '@/theme';

const brandLabels: Record<SavedPaymentMethod['brand'], string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: 'Card',
};

export default function PaymentMethods() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { methods, ready, bootstrap, addMethod, setDefault, removeMethod } = usePaymentMethodsStore();
  const [holderName, setHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const formattedCardNumber = useMemo(
    () =>
      cardNumber
        .replace(/\D/g, '')
        .slice(0, 19)
        .replace(/(.{4})/g, '$1 ')
        .trim(),
    [cardNumber],
  );

  const handleCardNumberChange = (value: string) => {
    setCardNumber(value.replace(/\D/g, '').slice(0, 19));
  };

  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const handleAddCard = async () => {
    if (cvc.replace(/\D/g, '').length < 3) {
      Alert.alert(t('profile.paymentInvalidCard'));
      return;
    }

    try {
      setSaving(true);
      await addMethod({ holderName, cardNumber, expiry });
      setHolderName('');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      Alert.alert(t('profile.paymentAdded'));
    } catch (error) {
      const messageKey =
        error instanceof Error && error.message === 'invalid-expiry'
          ? 'profile.paymentInvalidExpiry'
          : 'profile.paymentInvalidCard';
      Alert.alert(t(messageKey));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (method: SavedPaymentMethod) => {
    Alert.alert(t('profile.paymentRemove'), `${brandLabels[method.brand]} •••• ${method.last4}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.paymentRemove'),
        style: 'destructive',
        onPress: () => void removeMethod(method.id),
      },
    ]);
  };

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('profile.paymentMethods')} subtitle={t('profile.paymentMethodsSubtitle')} />

      {ready && methods.length === 0 && (
        <Card style={{ gap: spacing.sm, alignItems: 'center' }}>
          <Icon name="card-outline" size={34} color={theme.colors.primary} />
          <Text variant="bodyStrong" center>
            {t('profile.paymentNoCards')}
          </Text>
          <Text variant="caption" color="textSecondary" center>
            {t('profile.paymentNoCardsHint')}
          </Text>
        </Card>
      )}

      {methods.map((method) => (
        <Card
          key={method.id}
          onPress={() => void setDefault(method.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            borderColor: method.isDefault ? theme.colors.primary : theme.colors.border,
            backgroundColor: method.isDefault ? theme.colors.primarySurface : theme.colors.surface,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surfaceSunken,
            }}
          >
            <Icon name="card-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="bodyStrong">
              {brandLabels[method.brand]} •••• {method.last4}
            </Text>
            <Text variant="caption" color="textSecondary">
              {method.holderName} · {method.expiryMonth}/{method.expiryYear}
            </Text>
            {method.isDefault && <Badge label={t('profile.paymentDefault')} tone="success" />}
          </View>
          <Pressable onPress={() => handleRemove(method)} hitSlop={10}>
            <Icon name="trash-outline" size={20} color={theme.colors.textMuted} />
          </Pressable>
          {method.isDefault ? (
            <Icon name="checkmark-circle" size={24} color={theme.colors.primary} />
          ) : (
            <Icon name="ellipse-outline" size={24} color={theme.colors.textMuted} />
          )}
        </Card>
      ))}

      <Card style={{ gap: spacing.md }}>
        <Text variant="title">{t('profile.paymentAddCard')}</Text>
        <Input
          label={t('profile.paymentCardholder')}
          value={holderName}
          onChangeText={setHolderName}
          autoCapitalize="words"
          placeholder="Gabriela Castro"
          iconLeft="person-outline"
        />
        <Input
          label={t('profile.paymentCardNumber')}
          value={formattedCardNumber}
          onChangeText={handleCardNumberChange}
          keyboardType="number-pad"
          placeholder="4242 4242 4242 4242"
          iconLeft="card-outline"
          maxLength={23}
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input
              label={t('profile.paymentExpiry')}
              value={expiry}
              onChangeText={handleExpiryChange}
              keyboardType="number-pad"
              placeholder="MM/YY"
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label={t('profile.paymentCvc')}
              value={cvc}
              onChangeText={(value) => setCvc(value.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secure
              placeholder="123"
              maxLength={4}
            />
          </View>
        </View>
        <Text variant="caption" color="textSecondary">
          {t('profile.paymentSecurityHint')}
        </Text>
        <Button
          label={t('screens.addPaymentMethod')}
          iconLeft="add-outline"
          onPress={handleAddCard}
          loading={saving}
        />
      </Card>
    </ScreenContainer>
  );
}
