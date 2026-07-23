import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { EmergencyHireNegotiation } from '@/types';
import { radius, spacing } from '@/theme';

export type QuoteSummary = {
  professionalName: string;
  serviceNames: string[];
  date: string;
  time: string;
  price: string;
  currency: string;
  notes?: string | null;
  durationMinutes?: number | null;
};

type Props = {
  visible: boolean;
  summary: QuoteSummary | null;
  loading?: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  onClose: () => void;
  labels: {
    title: string;
    professional: string;
    service: string;
    date: string;
    time: string;
    price: string;
    included: string;
    notes: string;
    duration: string;
    confirm: string;
    decline: string;
  };
  accentColor: string;
};

export function QuoteConfirmationModal({
  visible,
  summary,
  loading,
  onConfirm,
  onDecline,
  onClose,
  labels,
  accentColor,
}: Props) {
  const theme = useTheme();
  if (!summary) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxl,
            maxHeight: '88%',
          }}
        >
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            {labels.title}
          </Text>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: spacing.sm }}>
            <Row label={labels.professional} value={summary.professionalName} />
            {summary.serviceNames.length > 0 ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="caption" color="textSecondary" weight="600">
                  {labels.included}
                </Text>
                {summary.serviceNames.map((name) => (
                  <Text key={name} variant="body">
                    • {name}
                  </Text>
                ))}
              </View>
            ) : (
              <Row label={labels.service} value="—" />
            )}
            <Row label={labels.date} value={summary.date} />
            <Row label={labels.time} value={summary.time} />
            <Row label={labels.price} value={`${summary.price} ${summary.currency}`} bold />
            {summary.durationMinutes ? (
              <Row label={labels.duration} value={`${summary.durationMinutes} min`} />
            ) : null}
            {summary.notes ? <Row label={labels.notes} value={summary.notes} multiline /> : null}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              label={labels.decline}
              variant="outline"
              accentColor={accentColor}
              onPress={onDecline}
              loading={loading}
              style={{ flex: 1 }}
            />
            <Button
              label={labels.confirm}
              accentColor={accentColor}
              onPress={onConfirm}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  label,
  value,
  bold,
  multiline,
}: {
  label: string;
  value: string;
  bold?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="textSecondary" weight="600">
        {label}
      </Text>
      <Text variant={bold ? 'bodyStrong' : 'body'} numberOfLines={multiline ? undefined : 2}>
        {value}
      </Text>
    </View>
  );
}

export function negotiationToQuoteSummary(
  negotiation: EmergencyHireNegotiation,
  professionalName: string,
  serviceNames: string[],
): QuoteSummary {
  return {
    professionalName,
    serviceNames,
    date: negotiation.serviceDate ?? '',
    time: negotiation.serviceTime?.slice(0, 5) ?? '',
    price: String(negotiation.price),
    currency: negotiation.currency ?? 'USD',
    notes: negotiation.notes,
    durationMinutes: negotiation.estimatedDurationMinutes,
  };
}
