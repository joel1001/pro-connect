import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Divider, Icon, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { Badge } from '@/components/atoms/Badge';
import { ContractDocumentEditor, SectionHeader } from '@/components/molecules';
import { contractsApi } from '@/api/contracts.api';
import { getApiErrorMessage } from '@/api/client';
import { paymentsApi } from '@/api/payments.api';
import { servicesApi } from '@/api/services.api';
import { formatContractServices } from '@/lib/contractServices';
import { realtimeService } from '@/services/realtime';
import { useTheme } from '@/hooks/useTheme';
import { Contract, Payment, Service } from '@/types';
import { radius, spacing } from '@/theme';

export default function ProfessionalContractEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const [contract, setContract] = useState<Contract | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [serviceCatalog, setServiceCatalog] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accent = theme.colors.primary;

  const load = () => {
    if (!id) return;
    contractsApi
      .get(id)
      .then((c) => {
        setContract(c);
        return Promise.all([
          servicesApi.list({ professionalId: c.professionalId }),
          c.paymentId ? paymentsApi.get(c.paymentId).catch(() => null) : Promise.resolve(null),
        ]);
      })
      .then(([services, nextPayment]) => {
        setServiceCatalog(services);
        setPayment(nextPayment);
      })
      .catch(() => {
        setContract(null);
        setPayment(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    return realtimeService.onContractUpdate(id, () => {
      load();
    });
  }, [id]);

  useEffect(() => {
    if (!contract?.paymentId) return undefined;
    return realtimeService.onPaymentUpdate(contract.paymentId, () => {
      void paymentsApi.get(contract.paymentId!).then(setPayment).catch(() => undefined);
    });
  }, [contract?.paymentId]);

  if (loading) return <Spinner fullscreen />;
  if (!contract) return null;

  const editable =
    contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE';
  const hasDocument = Boolean(contract.pdfUrl || contract.documentText);
  const canConfirm = hasDocument && !contract.professionalSigned;
  const paymentHeld = payment?.status === 'HELD';
  const paidAmount = payment
    ? `${payment.currency ?? contract.currency ?? 'USD'} ${Number(payment.amount ?? 0).toFixed(2)}`
    : null;
  const professionalNet = payment?.professionalNet != null
    ? `${payment.currency ?? contract.currency ?? 'USD'} ${Number(payment.professionalNet).toFixed(2)}`
    : null;

  if (paymentHeld && payment) {
    return (
      <ScreenContainer scroll showBack>
        <PaymentConfirmedCard
          accent={accent}
          amount={paidAmount}
          status={t(`payment.status.${payment.status}`)}
          professionalNet={professionalNet}
          title={t('client.contract.paidTitle')}
          body={t('client.contract.paidBody')}
          badge={t('client.contract.paidBadge')}
          labels={{
            amount: t('client.contract.amountPaid'),
            status: t('client.contract.paymentStatus'),
            professionalNet: t('client.contract.professionalNet'),
          }}
        />
      </ScreenContainer>
    );
  }

  const confirmContract = async () => {
    if (!contract) return;
    setSigning(true);
    setError(null);
    try {
      setContract(await contractsApi.sign(contract.id, 'PROFESSIONAL'));
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.contract.confirmError')));
    } finally {
      setSigning(false);
    }
  };

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('client.contract.title')} subtitle={contract.id} />

      <Card style={{ gap: spacing.md }}>
        <Row label={t('client.contract.client')} value={contract.clientId} />
        <Row
          label={(contract.serviceIds?.length ?? 0) > 1 ? t('client.contract.services') : t('client.contract.service')}
          value={formatContractServices(contract, serviceCatalog)}
        />
        <Row label={t('client.contract.date')} value={contract.scheduledDate} />
        <Row label={t('client.contract.status')} value={contract.status} />
        <Divider />
        <Row label={t('client.contract.serviceTotal')} value={`$${Number(contract.amount).toFixed(2)}`} />
      </Card>

      {contract.professionalSigned ? (
        <Card style={{ gap: spacing.sm, borderRadius: radius.xl }}>
          <Badge label={t('client.contract.awaitingPayment')} tone="warning" icon="time-outline" />
          <Text variant="caption" color="textSecondary">
            {t('client.contract.awaitingPaymentBody')}
          </Text>
        </Card>
      ) : null}

      <ContractDocumentEditor
        editable={editable}
        context="contract"
        contractId={contract.id}
        accentColor={accent}
        value={{
          pdfUrl: contract.pdfUrl,
          signedPdfUrl: contract.signedPdfUrl,
          documentText: contract.documentText,
          documentSource: contract.documentSource,
        }}
        onChange={(next) =>
          setContract((c) =>
            c
              ? {
                  ...c,
                  pdfUrl: next.pdfUrl ?? undefined,
                  signedPdfUrl: next.signedPdfUrl ?? undefined,
                  documentText: next.documentText ?? undefined,
                  documentSource: next.documentSource ?? undefined,
                }
              : c,
          )
        }
      />

      <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
        {contract.professionalSigned ? t('client.contract.proConfirmedHint') : t('client.contract.proEditHint')}
      </Text>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={contract.professionalSigned ? t('client.contract.professionalConfirmed') : t('client.contract.confirmProfessional')}
        accentColor={accent}
        loading={signing}
        disabled={!canConfirm}
        onPress={confirmContract}
      />
    </ScreenContainer>
  );
}

function PaymentConfirmedCard({
  accent,
  amount,
  status,
  professionalNet,
  title,
  body,
  badge,
  labels,
}: {
  accent: string;
  amount: string | null;
  status: string;
  professionalNet: string | null;
  title: string;
  body: string;
  badge: string;
  labels: { amount: string; status: string; professionalNet: string };
}) {
  const theme = useTheme();
  return (
    <Card
      style={{
        gap: spacing.xl,
        borderColor: `${accent}33`,
        backgroundColor: theme.colors.primarySurface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -42,
          top: -48,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: `${accent}18`,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -56,
          bottom: -70,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: `${accent}0F`,
        }}
      />
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 28,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadow.md,
          }}
        >
          <Icon name="checkmark-circle-outline" size={38} color={theme.colors.onPrimary} />
        </View>
        <Badge label={badge} tone="success" solid />
        <View style={{ gap: spacing.xs }}>
          <Text variant="h2" center>
            {title}
          </Text>
          <Text variant="caption" color="textSecondary" center>
            {body}
          </Text>
        </View>
      </View>
      <View
        style={{
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: `${accent}24`,
        }}
      >
        {amount ? <PaymentRow label={labels.amount} value={amount} bold /> : null}
        <PaymentRow label={labels.status} value={status} />
        {professionalNet ? <PaymentRow label={labels.professionalNet} value={professionalNet} /> : null}
      </View>
    </Card>
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

function PaymentRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant={bold ? 'bodyStrong' : 'caption'} style={{ textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}
