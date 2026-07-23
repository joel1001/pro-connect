import { View } from 'react-native';

import { Text } from '@/components/atoms';
import { PaymentPreview } from '@/api/payments.api';
import { spacing } from '@/theme';

type Props = {
  preview: PaymentPreview;
  labels: {
    base: string;
    platformFee: string;
    proconnectFee?: string;
    marketplaceFee: string;
    tax: string;
    storeFee: string;
    storeFeeAppStore: string;
    storeFeeGooglePlay: string;
    total: string;
    professionalEarnings: string;
  };
};

function storeFeeLabel(labels: Props['labels'], channel: string) {
  if (channel === 'APP_STORE') return labels.storeFeeAppStore;
  if (channel === 'GOOGLE_PLAY') return labels.storeFeeGooglePlay;
  return labels.storeFee;
}

export function PaymentBreakdown({ preview, labels }: Props) {
  const fmt = (n: number) => `${preview.currency} ${n.toFixed(2)}`;
  const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

  return (
    <View style={{ gap: spacing.sm }}>
      <Line label={labels.base} value={fmt(Number(preview.baseServicePrice))} />
      <Line
        label={`${labels.proconnectFee ?? labels.platformFee} (${pct(preview.platformCommissionRate)})`}
        value={fmt(Number(preview.platformFee))}
      />
      {Number(preview.marketplaceFee) > 0 ? (
        <Line
          label={`${labels.marketplaceFee} (${pct(preview.marketplaceCommissionRate)})`}
          value={fmt(Number(preview.marketplaceFee))}
        />
      ) : null}
      {Number(preview.taxAmount) > 0 ? (
        <Line label={`${labels.tax} (${pct(preview.taxRate)})`} value={fmt(Number(preview.taxAmount))} />
      ) : null}
      {Number(preview.storeFee) > 0 ? (
        <Line
          label={`${storeFeeLabel(labels, preview.paymentChannel)} (${pct(preview.storeFeeRate)})`}
          value={fmt(Number(preview.storeFee))}
        />
      ) : null}
      <Line label={labels.total} value={fmt(Number(preview.totalCharged))} bold />
      <Line label={labels.professionalEarnings} value={fmt(Number(preview.professionalEarnings))} muted />
    </View>
  );
}

function Line({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text variant="caption" color={muted ? 'textMuted' : 'textSecondary'} style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant={bold ? 'bodyStrong' : 'body'} color={muted ? 'textMuted' : undefined}>
        {value}
      </Text>
    </View>
  );
}
