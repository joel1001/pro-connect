import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { PaymentBreakdown, SectionHeader } from '@/components/molecules';
import { contractsApi } from '@/api/contracts.api';
import { paymentsApi, PaymentConfig, PaymentPreview } from '@/api/payments.api';
import { resolvePaymentChannel } from '@/lib/paymentChannel';
import { useAuthStore } from '@/store/authStore';
import { Contract } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function PaymentEscrow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const accent = roleAccent.client;
  const isSimulated = paymentConfig?.simulated ?? true;
  const paymentChannel = resolvePaymentChannel();

  useEffect(() => {
    if (!id) return;
    Promise.all([paymentsApi.config().catch(() => null), contractsApi.get(id)])
      .then(async ([config, c]) => {
        setPaymentConfig(config);
        setContract(c);
        const p = await paymentsApi.preview({ contractId: c.id, paymentChannel });
        setPreview(p);
      })
      .catch(() => {
        setContract(null);
        setPreview(null);
      })
      .finally(() => setLoading(false));
  }, [id, paymentChannel]);

  const onPay = async () => {
    if (!contract || !user?.userId || !preview) return;
    setPaying(true);
    try {
      const payment = await paymentsApi.create({
        contractId: contract.id,
        clientId: user.userId,
        professionalId: contract.professionalId,
        amount: Number(preview.totalCharged),
        currency: contract.currency ?? preview.currency,
        paymentChannel,
      });
      await paymentsApi.hold(payment.id);
      router.replace('/client/contracts' as never);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (!contract || !preview) return null;

  const contractReadyForPayment = Boolean(contract.professionalSigned && contract.clientSigned);

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('payment.title')} subtitle={t('payment.subtitle')} />
      {!contractReadyForPayment ? (
        <Card style={{ gap: spacing.xs }}>
          <Text variant="bodyStrong">{t('client.contract.waitingProfessionalConfirmation')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('payment.contractNotReady')}
          </Text>
        </Card>
      ) : null}
      {isSimulated ? (
        <Card
          style={{
            backgroundColor: '#FFF8E6',
            borderColor: '#F5D76E',
            borderWidth: 1,
            gap: spacing.xs,
          }}>
          <Text variant="bodyStrong">{t('payment.simulatedBanner')}</Text>
        </Card>
      ) : null}
      <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
        <Text variant="title" center>
          {t('client.protectedPayment')}
        </Text>
        <Text variant="display" style={{ color: accent }}>
          {preview.currency} {Number(preview.totalCharged).toFixed(2)}
        </Text>
      </Card>
      <Card style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">{t('payment.breakdownTitle')}</Text>
        <PaymentBreakdown
          preview={preview}
          labels={{
            base: t('payment.base'),
            platformFee: t('payment.platformFee'),
            proconnectFee: t('payment.proconnectFee'),
            marketplaceFee: t('payment.marketplaceFee'),
            tax: t('payment.tax'),
            storeFee: t('payment.storeFee'),
            storeFeeAppStore: t('payment.storeFeeAppStore'),
            storeFeeGooglePlay: t('payment.storeFeeGooglePlay'),
            total: t('payment.total'),
            professionalEarnings: t('payment.professionalEarnings'),
          }}
        />
      </Card>
      <Button
        label={isSimulated ? t('payment.simulatedConfirm') : t('client.payReserve')}
        accentColor={accent}
        loading={paying}
        disabled={!contractReadyForPayment}
        onPress={onPay}
      />
    </ScreenContainer>
  );
}
