import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing, Theme } from '@/theme';

type ProfileListSectionProps<T> = {
  title: string;
  items: T[];
  maxVisible?: number;
  viewAllLabel: string;
  onViewAll?: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  theme: Theme;
};

export function ProfileListSection<T>({
  title,
  items,
  maxVisible = 3,
  viewAllLabel,
  onViewAll,
  renderItem,
  keyExtractor,
  theme,
}: ProfileListSectionProps<T>) {
  if (!items.length) return null;

  const visible = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.sm }}>
      <Text variant="bodyStrong">{title}</Text>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: spacing.sm,
        }}
      >
        {visible.map((item, index) => (
          <View key={keyExtractor(item, index)}>
            {index > 0 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.border,
                  marginVertical: spacing.sm,
                }}
              />
            ) : null}
            {renderItem(item, index)}
          </View>
        ))}
        {hasMore && onViewAll ? (
          <View style={{ marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: spacing.xs }}>
            <Button label={viewAllLabel} variant="ghost" onPress={onViewAll} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ProfileLinkRow({
  label,
  url,
  onPress,
  theme,
}: {
  label: string;
  url: string;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text variant="body">{label}</Text>
      <Text variant="caption" color="primary" numberOfLines={1} style={{ maxWidth: '55%' }}>
        {url.replace(/^https?:\/\//, '')}
      </Text>
    </Pressable>
  );
}

export function ProfileSection({
  title,
  children,
  theme,
}: {
  title: string;
  children: ReactNode;
  theme: Theme;
}) {
  return (
    <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.sm }}>
      <Text variant="bodyStrong">{title}</Text>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {children}
      </View>
    </View>
  );
}
