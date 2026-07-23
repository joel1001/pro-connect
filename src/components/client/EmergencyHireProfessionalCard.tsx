import { Pressable, View } from 'react-native';

import { Avatar, Button, Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { resolveProfessionalAvatarUrl } from '@/lib/professionalAvatar';
import { EmergencyHireAvailableProfessional } from '@/types';
import { radius, spacing } from '@/theme';

type Props = {
  professional: EmergencyHireAvailableProfessional;
  accentColor: string;
  onContact: () => void;
  contactLabel: string;
  onlineLabel: string;
  offlineLabel: string;
  responseTimeLabel: string;
  jobsLabel: string;
  kmLabel: string;
  loading?: boolean;
};

export function EmergencyHireProfessionalCard({
  professional: p,
  accentColor,
  onContact,
  contactLabel,
  onlineLabel,
  offlineLabel,
  responseTimeLabel,
  jobsLabel,
  kmLabel,
  loading,
}: Props) {
  const theme = useTheme();
  const avatar = resolveProfessionalAvatarUrl({
    id: p.id,
    name: p.displayName,
    avatarUrl: p.avatarUrl,
  });

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: radius.xl,
        padding: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={p.displayName} uri={avatar} size={52} accentColor={accentColor} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{p.displayName}</Text>
          <Text variant="caption" color="textSecondary">
            {p.profession}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            <Icon name="star" size={13} color="#F59E0B" />
            <Text variant="caption" weight="600">
              {p.rating.toFixed(1)}
            </Text>
            <Text variant="caption" color="textMuted">
              · {jobsLabel.replace('{{count}}', String(p.completedJobs))}
            </Text>
            <Text variant="caption" color="textMuted">
              · {kmLabel.replace('{{km}}', p.distanceKm.toFixed(1))}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: p.online ? theme.colors.success : theme.colors.textMuted,
                }}
              />
              <Text variant="caption" style={{ color: p.online ? theme.colors.success : theme.colors.textMuted }}>
                {p.online ? onlineLabel : offlineLabel}
              </Text>
            </View>
            <Text variant="caption" color="textSecondary">
              {responseTimeLabel.replace('{{min}}', String(p.estimatedResponseMinutes))}
            </Text>
          </View>
        </View>
      </View>
      <Button label={contactLabel} size="sm" accentColor={accentColor} loading={loading} onPress={onContact} />
    </View>
  );
}
