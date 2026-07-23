import { View } from 'react-native';

import { Badge, Button, Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';
import { urgentHireColors } from '@/theme/urgentHire';

type Props = {
  expired: boolean;
  timeRemaining: string | null;
  isProfessional: boolean;
  hasPendingProQuote: boolean;
  quoteCancelled: boolean;
  contractPending: boolean;
  accentColor: string;
  onSendQuote?: () => void;
  labels: {
    title: string;
    countdown: string;
    subtitle: string;
    expiredSubtitle: string;
    readOnlyHint: string;
    sendQuote: string;
    reviewQuote: string;
    waitingQuote: string;
    freeMessaging: string;
    contractPending: string;
    resendQuoteHint: string;
  };
};

export function EmergencyHireChatBanner({
  expired,
  timeRemaining,
  isProfessional,
  hasPendingProQuote,
  quoteCancelled,
  contractPending,
  accentColor,
  onSendQuote,
  labels,
}: Props) {
  const theme = useTheme();
  const accent = expired ? theme.colors.danger : urgentHireColors.icon;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: expired ? `${theme.colors.danger}40` : theme.colors.border,
        borderRadius: radius.lg,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
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
          backgroundColor: expired ? `${theme.colors.danger}0D` : urgentHireColors.surface,
          borderBottomWidth: 1,
          borderBottomColor: expired ? `${theme.colors.danger}25` : urgentHireColors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.sm,
              backgroundColor: expired ? `${theme.colors.danger}18` : urgentHireColors.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name={expired ? 'time-outline' : 'flash-outline'}
              size={18}
              color={accent}
            />
          </View>
          <Text variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
            {labels.title}
          </Text>
        </View>
        {!expired && timeRemaining ? (
          <Badge
            label={labels.countdown.replace('{{time}}', timeRemaining)}
            tone="warning"
            icon="timer-outline"
          />
        ) : expired ? (
          <Badge label={labels.readOnlyHint} tone="danger" />
        ) : null}
      </View>

      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <Text variant="caption" color="textSecondary" style={{ lineHeight: 20 }}>
          {expired ? labels.expiredSubtitle : labels.subtitle}
        </Text>

        {expired ? null : isProfessional ? (
          <>
            {quoteCancelled ? (
              <Text variant="caption" color="textSecondary" style={{ lineHeight: 20 }}>
                {labels.resendQuoteHint}
              </Text>
            ) : null}
            <Button
              label={labels.sendQuote}
              size="sm"
              accentColor={accentColor}
              onPress={onSendQuote}
              style={{ alignSelf: 'flex-start', minWidth: 140 }}
              fullWidth={false}
            />
          </>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.md,
              backgroundColor: theme.colors.surfaceAlt,
              alignSelf: 'flex-start',
            }}
          >
            <Icon
              name={
                contractPending
                  ? 'document-text-outline'
                  : hasPendingProQuote
                    ? 'checkmark-circle-outline'
                    : quoteCancelled
                      ? 'chatbubble-ellipses-outline'
                      : 'hourglass-outline'
              }
              size={16}
              color={
                contractPending || hasPendingProQuote
                  ? theme.colors.success
                  : theme.colors.textMuted
              }
            />
            <Text variant="caption" color="textSecondary" style={{ flexShrink: 1 }}>
              {contractPending
                ? labels.contractPending
                : hasPendingProQuote
                  ? labels.reviewQuote
                  : quoteCancelled
                    ? labels.freeMessaging
                    : labels.waitingQuote}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
