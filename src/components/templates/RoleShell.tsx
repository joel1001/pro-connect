import { Slot, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Spinner, Text, CountBadge } from '@/components/atoms';
import { BrandLogo } from '@/components/organisms/BrandLogo';
import { getRoleConfig, getTabNav, NavItem } from '@/config/roles';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { spacing, layout } from '@/theme';
import { UserRole } from '@/types';

/**
 * Responsive navigation shell shared by every role group layout.
 * - Mobile: bottom tab bar (mobile-first, matches the app designs).
 * - Desktop/web: persistent left sidebar + wide content area (real web app feel).
 */
export function RoleShell({ role }: { role: UserRole }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { useDesktopLayout } = useResponsive();
  const { status, activeRole } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const unreadNotificationCount = useNotificationStore((s) => s.unreadNotificationCount);
  const cfg = getRoleConfig(role);
  const accent = theme.colors.primary;

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/(auth)/onboarding');
  }, [status, router]);

  // Keep the URL template aligned with the selected role.
  useEffect(() => {
    if (status === 'authenticated' && activeRole && activeRole !== role) {
      router.replace(getRoleConfig(activeRole).nav[0].href as never);
    }
  }, [status, activeRole, role, router]);

  if (status !== 'authenticated') return <Spinner fullscreen />;
  const tabNav = getTabNav(role);

  const matchLength = (item: NavItem) => {
    let best = 0;
    const candidates = [item.href, ...(item.activePrefixes ?? [])].map((path) => path.split('?')[0]);
    for (const path of candidates) {
      if (pathname === path || pathname.startsWith(`${path}/`)) {
        best = Math.max(best, path.length);
      }
    }
    return best;
  };

  const isActive = (item: NavItem, items: NavItem[]) => {
    const matches = items
      .filter((n) => matchLength(n) > 0)
      .sort((a, b) => matchLength(b) - matchLength(a));
    return matches[0]?.href === item.href;
  };

  if (useDesktopLayout) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.colors.surfaceAlt }}>
        <View
          style={{
            width: layout.sidebarWidth,
            backgroundColor: theme.colors.surface,
            borderRightWidth: 1,
            borderRightColor: theme.colors.border,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            gap: spacing.xl,
          }}
        >
          <BrandLogo size="sm" />
          <View style={{ gap: 4 }}>
            {cfg.nav.map((item) => {
              const active = isActive(item, cfg.nav);
              const showBadge = item.label === 'nav.messages' && unreadCount > 0;
              const showAlertBadge = item.label === 'nav.notifications' && unreadNotificationCount > 0;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.navigate(item.href as never)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderRadius: 10,
                    backgroundColor: active ? `${accent}14` : 'transparent',
                  }}
                >
                  <View>
                    <Icon name={item.icon} size={20} color={active ? accent : theme.colors.textSecondary} />
                    {showBadge || showAlertBadge ? (
                      <View style={{ position: 'absolute', top: -6, right: -10 }}>
                        <CountBadge
                          count={showBadge ? unreadCount : unreadNotificationCount}
                          color={accent}
                          size="sm"
                        />
                      </View>
                    ) : null}
                  </View>
                  <Text
                    variant="bodyStrong"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ flex: 1, color: active ? accent : theme.colors.textSecondary }}
                  >
                    {t(item.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      {tabNav.length > 0 ? (
        <BottomTabBar
          nav={tabNav}
          isActive={(item) => isActive(item, tabNav)}
          onPress={(h) => router.navigate(h as never)}
        />
      ) : null}
    </View>
  );
}

function BottomTabBar({
  nav,
  isActive,
  onPress,
}: {
  nav: NavItem[];
  isActive: (item: NavItem) => boolean;
  onPress: (href: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const unreadNotificationCount = useNotificationStore((s) => s.unreadNotificationCount);
  const tabColor = theme.colors.primary;
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceAlt,
        borderTopWidth: 1,
        borderTopColor: theme.colors.primaryLight,
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : spacing.sm),
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.xs,
      }}
    >
      {nav.map((item) => {
        const active = isActive(item);
        const showBadge = item.label === 'nav.messages' && unreadCount > 0;
        const showAlertBadge = item.label === 'nav.notifications' && unreadNotificationCount > 0;
        return (
          <Pressable
            key={item.href}
            onPress={() => onPress(item.href)}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 2,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: active ? theme.colors.primarySurface : 'transparent',
            }}
          >
            <View>
              <Icon name={item.icon} size={22} color={active ? tabColor : theme.colors.textMuted} />
              {showBadge || showAlertBadge ? (
                <View style={{ position: 'absolute', top: -5, right: -10 }}>
                  <CountBadge
                    count={showBadge ? unreadCount : unreadNotificationCount}
                    color={tabColor}
                    size="sm"
                  />
                </View>
              ) : null}
            </View>
            <Text
              variant="label"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ width: '100%', textAlign: 'center', color: active ? tabColor : theme.colors.textMuted }}
            >
              {t(item.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
