import { Pressable, View } from 'react-native';

import { Avatar, Button, Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { MarketplaceProfessional } from '@/lib/marketplace';
import { radius, spacing } from '@/theme';

type Props = {
  professional: MarketplaceProfessional;
  onViewProfile: () => void;
  onBook: () => void;
  onChat: () => void;
  availableLabel: string;
  fromPriceLabel: string;
  perHourLabel: string;
  viewProfileLabel: string;
  bookLabel: string;
  chatLabel: string;
};

export function ProfessionalPreviewCard({
  professional: p,
  onViewProfile,
  onBook,
  onChat,
  availableLabel,
  fromPriceLabel,
  perHourLabel,
  viewProfileLabel,
  bookLabel,
  chatLabel,
}: Props) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: radius.xl,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        ...theme.shadow.md,
      }}
    >
      <Avatar name={p.name} uri={p.avatarUrl} size={56} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{p.name}</Text>
        <Text variant="caption" color="textSecondary">
          {p.profession}
        </Text>
        {p.place ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {p.place}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
          <Icon name="star" size={14} color="#F59E0B" />
          <Text variant="caption" weight="600">
            {p.rating.toFixed(1)}
          </Text>
          <Text variant="caption" color="textMuted">
            · {fromPriceLabel} ${p.priceFrom}
            {perHourLabel}
          </Text>
        </View>
        {p.online ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.success }} />
            <Text variant="caption" style={{ color: theme.colors.success }} weight="600">
              {availableLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ gap: spacing.xs, alignItems: 'stretch' }}>
        <Button label={bookLabel} size="sm" fullWidth={false} onPress={onBook} style={{ minWidth: 92 }} />
        <Button label={chatLabel} size="sm" variant="outline" fullWidth={false} onPress={onChat} style={{ minWidth: 92 }} />
        <Pressable onPress={onViewProfile} hitSlop={8} style={{ alignItems: 'center' }}>
          <Text variant="caption" color="primary" weight="600">
            {viewProfileLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type ListItemProps = {
  professional: MarketplaceProfessional;
  onPress: () => void;
  onBook: () => void;
  onChat: () => void;
  onToggleFavorite?: () => void;
  favorited?: boolean;
  availableLabel: string;
  fromPriceLabel: string;
  perHourLabel: string;
  distanceLabel: string;
  bookLabel: string;
  chatLabel: string;
};

export function ProfessionalListItem({
  professional: p,
  onPress,
  onBook,
  onChat,
  onToggleFavorite,
  favorited,
  availableLabel,
  fromPriceLabel,
  perHourLabel,
  distanceLabel,
  bookLabel,
  chatLabel,
}: ListItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Avatar name={p.name} uri={p.avatarUrl} size={52} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{p.name}</Text>
        <Text variant="caption" color="textSecondary">
          {p.profession}
        </Text>
        {p.place ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {p.place}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Icon name="star" size={13} color="#F59E0B" />
          <Text variant="caption" weight="600">
            {p.rating.toFixed(1)}
          </Text>
          <Text variant="caption" color="textMuted">
            ({p.reviewCount})
          </Text>
          <Text variant="caption" color="textMuted">
            · {distanceLabel.replace('{{km}}', p.distanceKm.toFixed(1))}
          </Text>
        </View>
        {p.online ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success }} />
            <Text variant="caption" style={{ color: theme.colors.success }}>
              {availableLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: spacing.sm }}>
        <Pressable onPress={onToggleFavorite} hitSlop={8}>
          <Icon
            name={favorited ? 'heart' : 'heart-outline'}
            size={22}
            color={favorited ? theme.colors.danger : theme.colors.textMuted}
          />
        </Pressable>
        <Text variant="bodyStrong" style={{ color: theme.colors.primary }}>
          {fromPriceLabel} ${p.priceFrom}
          {perHourLabel}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Button label={bookLabel} size="sm" fullWidth={false} onPress={onBook} style={{ minWidth: 72 }} />
          <Button label={chatLabel} size="sm" variant="outline" fullWidth={false} onPress={onChat} style={{ minWidth: 72 }} />
        </View>
      </View>
    </Pressable>
  );
}
