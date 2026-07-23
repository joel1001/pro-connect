import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch, View } from 'react-native';

import { onboardingApi, type VerificationProgress } from '@/api/onboarding.api';
import { professionalMeApi } from '@/api/professionalMe.api';
import { Avatar, Badge, Button, Card, CountBadge, ScreenContainer, Text } from '@/components/atoms';
import { ListRow, SectionHeader } from '@/components/molecules';
import { getRoleConfig, PROFESSIONAL_PROFILE_LINKS, CLIENT_PROFILE_LINKS } from '@/config/roles';
import { applyEmergencyHireVisibilityUpdates } from '@/lib/emergencyHireVisibility';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useThemeStore } from '@/store/themeStore';
import { appThemePalettes, spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

import { LanguagePickerButton } from '@/components/molecules';
import { RoleSwitcher } from './RoleSwitcher';

const settingsLinks = [
  { key: 'profile.personalInfo', icon: 'person-outline' as const, href: '/shared/settings' },
  { key: 'profile.paymentMethods', icon: 'card-outline' as const, href: '/shared/payment-methods' },
  { key: 'profile.helpCenter', icon: 'help-circle-outline' as const, href: '/shared/help-center' },
  { key: 'profile.terms', icon: 'document-text-outline' as const, href: '/shared/terms' },
];

export function ProfileView() {
  const { t } = useTranslation();
  const { user, activeRole, logout } = useAuthStore();
  const refreshNotifications = useNotificationStore((s) => s.refresh);
  const { palette, setPalette } = useThemeStore();
  const theme = useTheme();
  const cfg = activeRole ? getRoleConfig(activeRole) : null;
  const isProfessionalAccount = user?.role === 'PROFESSIONAL';
  const [emergencyHireEnabled, setEmergencyHireEnabled] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [, setLoadingEmergency] = useState(false);
  const [incompleteOnboardingCount, setIncompleteOnboardingCount] = useState(0);
  const emergencyHireTouchedRef = useRef(false);
  const emergencyHireSyncTokenRef = useRef(0);

  const syncEmergencyHireEnabled = useCallback(async () => {
    if (activeRole !== 'PROFESSIONAL') return;
    const syncToken = ++emergencyHireSyncTokenRef.current;
    emergencyHireTouchedRef.current = false;
    setLoadingEmergency(true);
    try {
      const s = await professionalMeApi.getSettings();
      if (syncToken === emergencyHireSyncTokenRef.current && !emergencyHireTouchedRef.current) {
        setEmergencyHireEnabled(s.emergencyHireEnabled);
      }
    } catch {
      if (syncToken === emergencyHireSyncTokenRef.current && !emergencyHireTouchedRef.current) {
        setEmergencyHireEnabled(false);
      }
    } finally {
      setLoadingEmergency(false);
    }
  }, [activeRole]);

  useEffect(() => {
    void syncEmergencyHireEnabled();
  }, [syncEmergencyHireEnabled]);

  useFocusEffect(
    useCallback(() => {
      void syncEmergencyHireEnabled();
    }, [syncEmergencyHireEnabled]),
  );

  useFocusEffect(
    useCallback(() => {
      void refreshNotifications();
      let active = true;
      const syncOnboardingProgress = async () => {
        if (activeRole !== 'CLIENT' && activeRole !== 'PROFESSIONAL') {
          setIncompleteOnboardingCount(0);
          return;
        }
        try {
          const progress = await onboardingApi.progress();
          if (active) {
            setIncompleteOnboardingCount(countIncompleteOnboardingSteps(progress));
          }
        } catch {
          if (active) setIncompleteOnboardingCount(0);
        }
      };

      void syncOnboardingProgress();
      return () => {
        active = false;
      };
    }, [activeRole, refreshNotifications]),
  );

  const toggleEmergencyHire = async (enabled: boolean) => {
    const previousEnabled = emergencyHireEnabled;
    emergencyHireTouchedRef.current = true;
    setEmergencyHireEnabled(enabled);
    setSavingEmergency(true);
    try {
      const res = await professionalMeApi.setEmergencyHire(enabled);
      setEmergencyHireEnabled(res.emergencyHireEnabled);
      applyEmergencyHireVisibilityUpdates(res.professionalIds, res.emergencyHireEnabled);
    } catch {
      setEmergencyHireEnabled(previousEnabled);
    } finally {
      setSavingEmergency(false);
    }
  };

  return (
    <ScreenContainer>
      <SectionHeader title={t('profile.title')} />

      <LanguagePickerButton variant="full" />

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={user?.email ?? 'Usuario'} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="title">{user?.email ?? 'Usuario'}</Text>
          {cfg && <Badge label={t(cfg.label)} icon={cfg.icon} tone="primary" />}
        </View>
      </Card>

      <RoleSwitcher />

      {activeRole === 'PROFESSIONAL' && (
        <>
          {isProfessionalAccount && (
            <Card style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text variant="bodyStrong">{t('emergencyHire.proToggleTitle')}</Text>
                  <Text variant="caption" color="textSecondary">
                    {t('emergencyHire.proToggleHint')}
                  </Text>
                </View>
                <Switch
                  value={emergencyHireEnabled ?? false}
                  disabled={savingEmergency}
                  onValueChange={toggleEmergencyHire}
                />
              </View>
            </Card>
          )}
          <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
            <ListRow
              title="Verificación de identidad"
              subtitle="Completa los 15 pasos"
              icon="shield-checkmark-outline"
              showChevron
              onPress={() => router.push('/shared/identity-verification' as never)}
            />
            <ListRow
              title="Onboarding profesional"
              subtitle="Pasos 2–15 del registro"
              icon="list-outline"
              showChevron
              onPress={() => router.push('/professional/onboarding' as never)}
            />
          </Card>

          <SectionHeader title={t('nav.work')} subtitle={t('work.subtitle')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
            {PROFESSIONAL_PROFILE_LINKS.map((link) => (
              <ListRow
                key={link.href}
                title={t(link.label)}
                icon={link.icon}
                showChevron
                onPress={() => router.push(link.href as never)}
              />
            ))}
          </Card>
        </>
      )}

      {activeRole === 'CLIENT' && CLIENT_PROFILE_LINKS.length > 0 && (
        <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
          {CLIENT_PROFILE_LINKS.map((link) => (
            <ListRow
              key={link.href}
              title={t(link.label)}
              icon={link.icon}
              showChevron
              onPress={() => router.push(link.href as never)}
            />
          ))}
        </Card>
      )}

      {activeRole === 'SUPER_ADMIN' && (
        <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
          <ListRow
            title={t('screens.createUser')}
            subtitle="Cliente, Profesional, Admin o Super Admin"
            icon="person-add-outline"
            showChevron
            onPress={() => router.push('/super-admin/create-user' as never)}
          />
          <ListRow
            title={t('nav.users')}
            subtitle="Gestión global"
            icon="people-outline"
            showChevron
            onPress={() => router.push('/super-admin/users' as never)}
          />
        </Card>
      )}

      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {settingsLinks.map((link) => (
          <ListRow
            key={link.key}
            title={t(link.key)}
            icon={link.icon}
            right={
              link.key === 'profile.personalInfo' && incompleteOnboardingCount > 0 ? (
                <CountBadge count={incompleteOnboardingCount} size="sm" />
              ) : undefined
            }
            showChevron
            onPress={() => router.push(link.href as never)}
          />
        ))}
      </Card>

      <SectionHeader title={t('profile.themes')} subtitle={t('profile.themesSubtitle')} />
      <Card style={{ gap: spacing.sm }}>
        {appThemePalettes.map((item) => {
          const selected = item.key === palette;
          return (
            <Pressable
              key={item.key}
              onPress={() => void setPalette(item.key)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: selected ? item.primary : theme.colors.border,
                backgroundColor: selected ? item.primarySurface : theme.colors.surface,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View style={{ flexDirection: 'row' }}>
                {[item.primary, item.primaryDark, item.primaryLight].map((color, index) => (
                  <View
                    key={color}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: color,
                      marginLeft: index === 0 ? 0 : -6,
                      borderWidth: 2,
                      borderColor: theme.colors.surface,
                    }}
                  />
                ))}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{t(item.labelKey)}</Text>
                <Text variant="caption" color="textSecondary">
                  {t(item.descriptionKey)}
                </Text>
              </View>
              {selected ? <Badge label={t('profile.themeSelected')} tone="success" /> : null}
            </Pressable>
          );
        })}
      </Card>

      <Button label={t('profile.logout')} variant="danger" iconLeft="log-out-outline" onPress={logout} />
    </ScreenContainer>
  );
}

function countIncompleteOnboardingSteps(progress: VerificationProgress) {
  const requiredSteps = [
    progress.addressCompleted,
    progress.identityDocument,
    progress.faceMatch,
  ];

  if (progress.role === 'PROFESSIONAL') {
    requiredSteps.push(
      !progress.professionalTitleSkipped && progress.professionalTitle,
      !progress.professionalCollegeSkipped && progress.professionalCollege,
      !progress.certificationsSkipped && progress.certifications,
      !progress.portfolioSkipped && progress.portfolio,
      !progress.completedWorkSkipped && progress.completedWork,
      !progress.curriculumSkipped && progress.curriculum,
      !progress.clientReferencesSkipped && progress.clientReferences,
      !progress.linkedInSkipped && progress.linkedIn,
      !progress.servicesSkipped && !!progress.services,
      !progress.serviceContractSkipped && !!progress.serviceContract,
    );
  }

  return requiredSteps.filter((completed) => !completed).length;
}
