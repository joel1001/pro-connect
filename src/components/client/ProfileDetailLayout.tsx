import { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Avatar, BackButton, Card, Icon, Spinner, Text } from '@/components/atoms';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing, Theme } from '@/theme';

type ProfileDetailLayoutProps = {
  title: string;
  subtitle?: string;
  icon: string;
  emptyIcon?: string;
  avatarName?: string;
  avatarUrl?: string;
  countLabel?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export function ProfileDetailLayout({
  title,
  subtitle,
  icon,
  emptyIcon = 'file-tray-outline',
  avatarName,
  avatarUrl,
  countLabel,
  loading,
  empty,
  emptyMessage,
  children,
}: ProfileDetailLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
      >
        <DetailBanner theme={theme} icon={icon} topInset={insets.top} />

        <View style={{ marginTop: -spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          <Card elevated style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              {avatarName ? <Avatar name={avatarName} uri={avatarUrl} size={52} /> : null}
              <View style={{ flex: 1, gap: spacing.xs }}>
                {subtitle ? (
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
                <Text variant="h3">{title}</Text>
                {countLabel ? <Badge label={countLabel} tone="primary" icon="layers-outline" /> : null}
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: theme.colors.primarySurface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={icon as never} size={22} color={theme.colors.primary} />
              </View>
            </View>
          </Card>

          {loading ? (
            <Card style={{ alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md }}>
              <Spinner />
              <Text variant="body" color="textSecondary">
                {t('common.loading')}
              </Text>
            </Card>
          ) : null}

          {!loading && empty ? (
            <Card>
              <EmptyState icon={emptyIcon as never} title={emptyMessage ?? title} />
            </Card>
          ) : null}

          {!loading && !empty ? children : null}
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: spacing.md,
          zIndex: 10,
        }}
      >
        <BackButton compact />
      </View>
    </View>
  );
}

function DetailBanner({ theme, icon, topInset }: { theme: Theme; icon: string; topInset: number }) {
  return (
    <View
      style={{
        height: 140 + topInset,
        paddingTop: topInset,
        backgroundColor: theme.colors.primaryLight,
        overflow: 'hidden',
      }}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.22 }}>
        <Icon name={icon as never} size={88} color={theme.colors.primary} />
      </View>
      <View
        style={{
          position: 'absolute',
          right: -24,
          top: topInset + 20,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: theme.colors.primarySurface,
          opacity: 0.5,
        }}
      />
    </View>
  );
}

export function DetailItemCard({ children, isLast }: { children: ReactNode; isLast?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: spacing.lg,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      {children}
    </View>
  );
}

export function DetailItemsGroup({ children }: { children: ReactNode }) {
  return (
    <Card padded={false} elevated>
      {children}
    </Card>
  );
}

export function DetailActionLink({
  label,
  onPress,
  icon = 'open-outline',
}: {
  label: string;
  onPress: () => void;
  icon?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: theme.colors.primarySurface,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}22`,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Icon name={icon as never} size={15} color={theme.colors.primary} />
      <Text variant="caption" weight="600" style={{ color: theme.colors.primary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function DetailIconTile({ icon }: { icon: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: `${theme.colors.primary}14`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon as never} size={22} color={theme.colors.primary} />
    </View>
  );
}

export function DetailQuote({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        marginTop: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: theme.colors.surfaceSunken,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
      }}
    >
      <Text variant="body" color="textSecondary" style={{ fontStyle: 'italic', lineHeight: 22 }}>
        “{text}”
      </Text>
    </View>
  );
}
