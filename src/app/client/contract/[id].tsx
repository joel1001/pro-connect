import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Divider, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { ContractDocumentEditor, PaymentBreakdown, SectionHeader } from '@/components/molecules';
import { contractsApi } from '@/api/contracts.api';
import { paymentsApi, PaymentPreview } from '@/api/payments.api';
import { servicesApi } from '@/api/services.api';
import { getApiErrorMessage } from '@/api/client';
import { formatContractServices } from '@/lib/contractServices';
import { resolvePaymentChannel } from '@/lib/paymentChannel';
import { realtimeService } from '@/services/realtime';
import { Contract, Service } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function ClientContractView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [contract, setContract] = useState<Contract | null>(null);
  const [serviceCatalog, setServiceCatalog] = useState<Service[]>([]);
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accent = roleAccent.client;
  const paymentChannel = resolvePaymentChannel();

  const load = () => {
    if (!id) return;
    contractsApi
      .get(id)
      .then((c) => {
        setContract(c);
        return Promise.all([
          servicesApi.list({ professionalId: c.professionalId }),
          paymentsApi.preview({ contractId: c.id, paymentChannel }),
        ]);
      })
      .then(([services, paymentPreview]) => {
        setServiceCatalog(services);
        setPreview(paymentPreview);
      })
      .catch(() => setContract(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id, paymentChannel]);

  useEffect(() => {
    if (!id) return undefined;
    return realtimeService.onContractUpdate(id, () => {
      load();
    });
  }, [id, paymentChannel]);

  const hasDocument = Boolean(contract?.pdfUrl || contract?.documentText);
  const professionalConfirmed = Boolean(contract?.professionalSigned);
  const canPay = Boolean(contract?.clientSigned && professionalConfirmed);
  const canSign = hasDocument && professionalConfirmed && !contract?.clientSigned;

  const onSign = async () => {
    if (!contract) return;
    setSigning(true);
    setError(null);
    try {
      const signed = await contractsApi.sign(contract.id, 'CLIENT');
      setContract(signed);
      router.push(`/client/payment/${signed.id}` as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.contract.error')));
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (!contract) return null;

  const total = preview ? Number(preview.totalCharged) : Number(contract.amount) + Number(contract.platformFee ?? 0);

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('client.contract.title')} subtitle={contract.id} />

      <Card style={{ gap: spacing.md }}>
        <Row label={t('client.contract.professional')} value={contract.professionalId} />
        <Row
          label={(contract.serviceIds?.length ?? 0) > 1 ? t('client.contract.services') : t('client.contract.service')}
          value={formatContractServices(contract, serviceCatalog)}
        />
        <Row label={t('client.contract.date')} value={contract.scheduledDate} />
        <Row label={t('client.contract.status')} value={contract.status} />
        <Divider />
        <Row label={t('client.contract.serviceTotal')} value={`$${Number(contract.amount).toFixed(2)}`} />
        <Row label={t('payment.proconnectFee')} value={`$${Number(contract.platformFee ?? 0).toFixed(2)}`} />
        <Row label={t('client.contract.totalDue')} value={`$${total.toFixed(2)}`} bold />
      </Card>

      {preview ? (
        <Card style={{ gap: spacing.sm }}>
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
      ) : null}

      <ContractDocumentEditor
        editable={false}
        context="contract"
        contractId={contract.id}
        accentColor={accent}
        value={{
          pdfUrl: contract.pdfUrl,
          signedPdfUrl: contract.signedPdfUrl,
          documentText: contract.documentText,
          documentSource: contract.documentSource,
        }}
        onChange={() => undefined}
      />

      <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
        {professionalConfirmed ? t('client.contract.clientReviewHint') : t('client.contract.waitingProfessionalConfirmation')}
      </Text>

      {error ? <Text variant="caption" color="danger">{error}</Text> : null}

      {canPay ? (
        <Button
          label={t('appointments.proceedToPayment')}
          accentColor={accent}
          loading={signing}
          onPress={() => router.push(`/client/payment/${contract.id}` as never)}
        />
      ) : (
        <Button
          label={t('client.contractSign')}
          accentColor={accent}
          loading={signing}
          disabled={!canSign}
          onPress={onSign}
        />
      )}
      {!hasDocument ? (
        <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
          {t('client.contract.waitingProDocument')}
        </Text>
      ) : null}
    </ScreenContainer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="caption" color="textSecondary">{label}</Text>
      <Text variant={bold ? 'bodyStrong' : 'body'}>{value}</Text>
    </View>
  );
}
