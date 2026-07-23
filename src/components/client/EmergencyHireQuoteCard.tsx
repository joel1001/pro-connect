import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Icon, Text } from '@/components/atoms';
import { PaymentPreview, paymentsApi } from '@/api/payments.api';
import { resolvePaymentChannel } from '@/lib/paymentChannel';
import { useTheme } from '@/hooks/useTheme';
import { EmergencyHireNegotiation, NegotiationProposalStatus } from '@/types';
import { radius, spacing } from '@/theme';

type Props = {
  negotiation: EmergencyHireNegotiation;
  serviceNames: string[];
  accentColor: string;
  labels: {
    title: string;
    date: string;
    time: string;
    arrival: string;
    price: string;
    included: string;
    notes: string;
    duration: string;
    confirm: string;
    decline: string;
    viewContract: string;
    statusPending: string;
    statusAccepted: string;
    statusDeclined: string;
    statusCancelled: string;
    statusSuperseded: string;
    basePrice: string;
    proconnectFee: string;
    estimatedTotal: string;
  };
  onConfirm?: () => void;
  onDecline?: () => void;
  onViewContract?: () => void;
  showActions?: boolean;
  showViewContract?: boolean;
  actionsLoading?: boolean;
};

function statusMeta(
  status: NegotiationProposalStatus,
  labels: Props['labels'],
): { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' } {
  switch (status) {
    case 'ACCEPTED':
      return { label: labels.statusAccepted, tone: 'success' };
    case 'REJECTED':
      return { label: labels.statusCancelled, tone: 'danger' };
    case 'SUPERSEDED':
      return { label: labels.statusSuperseded, tone: 'neutral' };
    default:
      return { label: labels.statusPending, tone: 'warning' };
  }
}

export function EmergencyHireQuoteCard({
  negotiation,
  serviceNames,
  accentColor,
  labels,
  onConfirm,
  onDecline,
  onViewContract,
  showActions,
  showViewContract,
  actionsLoading,
}: Props) {
  const theme = useTheme();
  const status = statusMeta(negotiation.status, labels);
  const [feePreview, setFeePreview] = useState<PaymentPreview | null>(null);

  useEffect(() => {
    if (!showActions || negotiation.status !== 'PENDING') {
      setFeePreview(null);
      return;
    }
    const amount = Number(negotiation.price);
    if (!amount || amount <= 0) return;
    paymentsApi
      .previewQuote({
        amount,
        currency: negotiation.currency ?? 'USD',
        paymentChannel: resolvePaymentChannel(),
      })
      .then(setFeePreview)
      .catch(() => setFeePreview(null));
  }, [showActions, negotiation.status, negotiation.price, negotiation.currency]);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: radius.lg,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        minWidth: 260,
        ...theme.shadow.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          backgroundColor: theme.colors.surfaceAlt,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.sm,
              backgroundColor: `${accentColor}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="document-text-outline" size={18} color={accentColor} />
          </View>
          <Text variant="bodyStrong">{labels.title}</Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <View
          style={{
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            gap: 2,
          }}
        >
          <Text variant="caption" color="textSecondary">
            {labels.basePrice}
          </Text>
          <Text variant="title" style={{ color: accentColor }}>
            {negotiation.price} {negotiation.currency}
          </Text>
        </View>

        {feePreview ? (
          <View
            style={{
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              gap: spacing.xs,
              backgroundColor: `${accentColor}10`,
            }}>
            <QuoteRow
              label={`${labels.proconnectFee} (${(feePreview.platformCommissionRate * 100).toFixed(0)}%)`}
              value={`${feePreview.currency} ${Number(feePreview.platformFee).toFixed(2)}`}
            />
            <QuoteRow
              label={labels.estimatedTotal}
              value={`${feePreview.currency} ${Number(feePreview.totalCharged).toFixed(2)}`}
            />
          </View>
        ) : null}

        <QuoteRow label={labels.included} value={serviceNames.join(', ') || '—'} />
        <QuoteRow label={labels.date} value={negotiation.serviceDate ?? '—'} />
        <QuoteRow label={labels.time} value={negotiation.serviceTime?.slice(0, 5) ?? '—'} />
        {negotiation.estimatedArrivalTime ? (
          <QuoteRow label={labels.arrival} value={negotiation.estimatedArrivalTime.slice(0, 5)} />
        ) : null}
        {negotiation.estimatedDurationMinutes ? (
          <QuoteRow label={labels.duration} value={`${negotiation.estimatedDurationMinutes} min`} />
        ) : null}
        {negotiation.notes ? <QuoteRow label={labels.notes} value={negotiation.notes} multiline /> : null}

        {showActions && onConfirm && onDecline ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
            <Button
              label={labels.decline}
              size="sm"
              variant="outline"
              accentColor={accentColor}
              onPress={onDecline}
              loading={actionsLoading}
              style={{ flex: 1 }}
            />
            <Button
              label={labels.confirm}
              size="sm"
              accentColor={accentColor}
              onPress={onConfirm}
              loading={actionsLoading}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}

        {showViewContract && onViewContract ? (
          <Button
            label={labels.viewContract}
            size="sm"
            variant="outline"
            accentColor={accentColor}
            onPress={onViewContract}
          />
        ) : null}
      </View>
    </View>
  );
}

export function EmergencyHireQuoteCardSkeleton({
  title,
  loadingLabel,
  accentColor,
}: {
  title: string;
  loadingLabel: string;
  accentColor: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: radius.lg,
        backgroundColor: theme.colors.surface,
        padding: spacing.md,
        gap: spacing.sm,
        minWidth: 260,
        ...theme.shadow.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.sm,
            backgroundColor: `${accentColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="document-text-outline" size={18} color={accentColor} />
        </View>
        <Text variant="bodyStrong">{title}</Text>
      </View>
      <Text variant="body" color="textSecondary">
        {loadingLabel}
      </Text>
    </View>
  );
}

function QuoteRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingVertical: 2,
      }}
    >
      <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text
        variant="body"
        style={{ flex: 1.3, textAlign: 'right' }}
        numberOfLines={multiline ? undefined : 3}
      >
        {value}
      </Text>
    </View>
  );
}
