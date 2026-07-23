import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, InteractionManager, Pressable, ScrollView, View } from 'react-native';

import { availabilityApi } from '@/api/availability.api';
import { catalogApi } from '@/api/catalog.api';
import { onboardingApi, type VerificationProgress } from '@/api/onboarding.api';
import { profileApi, type ProfileAddress, type ProfileMe } from '@/api/profile.api';
import { servicesApi } from '@/api/services.api';
import { Avatar, Badge, Button, Card, Icon, Input, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { DropdownField, ListRow, SectionHeader } from '@/components/molecules';
import { COSTA_RICA_COUNTRY_NAME, CostaRicaLocationOption, getCostaRicaProvinces } from '@/lib/costaRicaLocations';
import { useAuthStore } from '@/store/authStore';
import { spacing } from '@/theme';
import { Category, Service, WeeklyAvailabilitySlot } from '@/types';

type OnboardingStep = {
  key: string;
  title: string;
  completed: boolean;
  skipped?: boolean;
  href?: string;
};

const emptyAddress: ProfileAddress = {
  country: COSTA_RICA_COUNTRY_NAME,
  province: '',
  canton: '',
  district: '',
  streetLine: '',
};

const normalizeAddress = (address?: Partial<ProfileAddress> | null): ProfileAddress => ({
  country: address?.country || COSTA_RICA_COUNTRY_NAME,
  province: address?.province ?? '',
  canton: address?.canton ?? '',
  district: address?.district ?? '',
  streetLine: address?.streetLine ?? '',
});

function toLocationOptions(items: CostaRicaLocationOption[]) {
  return items.map((item) => ({ label: item.name, value: item.name }));
}

const WEEK_DAYS = [
  { dayOfWeek: 1, key: 'mon' },
  { dayOfWeek: 2, key: 'tue' },
  { dayOfWeek: 3, key: 'wed' },
  { dayOfWeek: 4, key: 'thu' },
  { dayOfWeek: 5, key: 'fri' },
  { dayOfWeek: 6, key: 'sat' },
  { dayOfWeek: 7, key: 'sun' },
] as const;

type WorkingHourDay = {
  dayOfWeek: number;
  key: (typeof WEEK_DAYS)[number]['key'];
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type ServiceForm = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  durationMinutes: string;
  allowsBargaining: boolean;
  active: boolean;
};

const defaultWorkingHours = (): WorkingHourDay[] =>
  WEEK_DAYS.map((day) => ({
    ...day,
    enabled: day.dayOfWeek <= 6,
    startTime: '08:00',
    endTime: '17:00',
  }));

const emptyServiceForm = (categoryId = ''): ServiceForm => ({
  categoryId,
  name: '',
  description: '',
  price: '',
  currency: 'USD',
  durationMinutes: '60',
  allowsBargaining: false,
  active: true,
});

function serviceToForm(service: Service): ServiceForm {
  return {
    id: service.id,
    categoryId: service.categoryId,
    name: service.name,
    description: service.description ?? '',
    price: String(service.price ?? ''),
    currency: service.currency ?? 'USD',
    durationMinutes: String(service.durationMinutes || 60),
    allowsBargaining: !!service.allowsBargaining,
    active: !!service.active,
  };
}

function normalizeTime(value?: string) {
  if (!value) return '';
  if (value.includes('T')) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(11, 16);
  }
  return value.slice(0, 5);
}

function availabilityToWorkingHours(slots?: WeeklyAvailabilitySlot[] | null): WorkingHourDay[] {
  const byDay = new Map((slots ?? []).map((slot) => [slot.dayOfWeek, slot]));
  return WEEK_DAYS.map((day) => {
    const slot = byDay.get(day.dayOfWeek);
    return {
      ...day,
      enabled: !!slot,
      startTime: normalizeTime(slot?.startTime) || '08:00',
      endTime: normalizeTime(slot?.endTime) || '17:00',
    };
  });
}

function isValidTimeWindow(startTime: string, endTime: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) && /^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) && startTime < endTime;
}

export default function Settings() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ section?: string | string[]; focus?: string | string[] }>();
  const { user } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);
  const [servicesAnchorY, setServicesAnchorY] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [progress, setProgress] = useState<VerificationProgress | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<ProfileAddress>(emptyAddress);
  const [workingHours, setWorkingHours] = useState<WorkingHourDay[]>(defaultWorkingHours);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyServiceForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const provinces = useMemo(() => getCostaRicaProvinces(), []);
  const provinceNode = useMemo(
    () => provinces.find((province) => province.name === address.province),
    [address.province, provinces],
  );
  const cantonNode = useMemo(
    () => provinceNode?.children.find((canton) => canton.name === address.canton),
    [address.canton, provinceNode],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [nextProfile, nextProgress] = await Promise.all([
          profileApi.me(),
          onboardingApi.progress().catch(() => null),
        ]);

        if (!mounted) return;
        setProfile(nextProfile);
        setProgress(nextProgress);
        setDisplayName(nextProfile.displayName ?? '');
        setPhone(nextProfile.phone ?? '');
        setAddress(normalizeAddress(nextProfile.locationAddress));
        if (nextProfile.role === 'PROFESSIONAL') {
          const [availability, nextServices, nextCategories] = await Promise.all([
            availabilityApi.get(nextProfile.userId).catch(() => null),
            servicesApi.list({ professionalId: nextProfile.userId }).catch(() => []),
            catalogApi.listCategories().catch(() => []),
          ]);
          if (availability && mounted) {
            setWorkingHours(availabilityToWorkingHours(availability.weeklySlots));
          }
          if (mounted) {
            setServices(nextServices);
            setCategories(nextCategories);
            setServiceForm(emptyServiceForm(nextServices[0]?.categoryId ?? nextCategories[0]?.id ?? ''));
          }
        }
      } catch {
        if (mounted) {
          Alert.alert(t('profile.title'), t('profile.loadError'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const steps = useMemo(() => buildOnboardingSteps(progress), [progress]);
  const incompleteCount = steps.filter((step) => !step.completed || step.skipped).length;
  const isProfessional = profile?.role === 'PROFESSIONAL' || user?.role === 'PROFESSIONAL';
  const defaultCategoryId = services[0]?.categoryId ?? categories[0]?.id ?? '';
  const section = Array.isArray(params.section) ? params.section[0] : params.section;
  const focus = Array.isArray(params.focus) ? params.focus[0] : params.focus;
  const shouldFocusServices = section === 'services' || focus === 'services';

  useEffect(() => {
    if (loading || !shouldFocusServices || servicesAnchorY === null) return;
    const scrollToServices = () => {
      scrollRef.current?.scrollTo({
        y: Math.max(servicesAnchorY - spacing.md, 0),
        animated: true,
      });
    };
    const interaction = InteractionManager.runAfterInteractions(scrollToServices);
    const timers = [120, 350, 700].map((delay) => setTimeout(scrollToServices, delay));
    return () => {
      interaction.cancel();
      timers.forEach(clearTimeout);
    };
  }, [loading, shouldFocusServices, servicesAnchorY, services.length, categories.length]);

  const updateAddressField = (field: keyof ProfileAddress, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
  };
  const selectProvince = (province: string) => {
    setAddress((current) => ({
      ...current,
      country: COSTA_RICA_COUNTRY_NAME,
      province,
      canton: '',
      district: '',
      streetLine: '',
    }));
  };
  const selectCanton = (canton: string) => {
    setAddress((current) => ({
      ...current,
      country: COSTA_RICA_COUNTRY_NAME,
      canton,
      district: '',
      streetLine: '',
    }));
  };
  const selectDistrict = (district: string) => {
    setAddress((current) => ({
      ...current,
      country: COSTA_RICA_COUNTRY_NAME,
      district,
      streetLine: '',
    }));
  };

  const updateWorkingHour = (dayOfWeek: number, patch: Partial<WorkingHourDay>) => {
    setWorkingHours((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await profileApi.update({
        displayName: displayName.trim(),
        phone: phone.trim(),
        locationAddress: {
          country: COSTA_RICA_COUNTRY_NAME,
          province: address.province.trim(),
          canton: address.canton.trim(),
          district: address.district.trim(),
          streetLine: address.streetLine.trim(),
        },
      });

      const nextProgress = await onboardingApi.progress().catch(() => progress);
      setProfile(saved);
      setProgress(nextProgress);
      setAddress(normalizeAddress(saved.locationAddress));
      Alert.alert(t('profile.title'), t('profile.saveSuccess'));
    } catch {
      Alert.alert(t('profile.title'), t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const saveWorkingHours = async () => {
    const activeSlots = workingHours.filter((day) => day.enabled);
    if (!activeSlots.length || activeSlots.some((day) => !isValidTimeWindow(day.startTime, day.endTime))) {
      Alert.alert(t('screens.workingHours'), t('screens.workingHoursInvalid'));
      return;
    }

    setSavingAvailability(true);
    try {
      const weeklySlots: WeeklyAvailabilitySlot[] = activeSlots.map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));
      const saved = await availabilityApi.saveMine({
        professionalId: profile?.userId ?? user?.userId ?? 'me',
        slotDurationMinutes: 60,
        weeklySlots,
      });
      setWorkingHours(availabilityToWorkingHours(saved.weeklySlots));
      Alert.alert(t('screens.workingHours'), t('profile.workingHoursSaved'));
    } catch {
      Alert.alert(t('screens.workingHours'), t('screens.workingHoursSaveError'));
    } finally {
      setSavingAvailability(false);
    }
  };

  const resetServiceForm = () => {
    setServiceForm(emptyServiceForm(defaultCategoryId));
  };

  const saveService = async () => {
    const price = Number(serviceForm.price);
    const durationMinutes = Number(serviceForm.durationMinutes);
    const professionalId = profile?.userId ?? user?.userId;
    if (!professionalId || !serviceForm.categoryId || !serviceForm.name.trim() || !Number.isFinite(price) || price <= 0) {
      Alert.alert(t('nav.services'), t('profile.serviceValidationError'));
      return;
    }

    setSavingService(true);
    try {
      const payload = {
        professionalId,
        categoryId: serviceForm.categoryId,
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || undefined,
        price,
        currency: serviceForm.currency.trim() || 'USD',
        pricingType: 'FIXED' as const,
        allowsBargaining: serviceForm.allowsBargaining,
        durationMinutes: Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 60,
        active: serviceForm.active,
      };
      const saved = serviceForm.id
        ? await servicesApi.update(serviceForm.id, payload)
        : await servicesApi.create(payload);
      setServices((current) =>
        serviceForm.id
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      );
      setServiceForm(emptyServiceForm(saved.categoryId));
      Alert.alert(t('nav.services'), serviceForm.id ? t('profile.serviceUpdated') : t('profile.serviceCreated'));
    } catch {
      Alert.alert(t('nav.services'), t('profile.serviceSaveError'));
    } finally {
      setSavingService(false);
    }
  };

  const toggleService = async (service: Service) => {
    try {
      const saved = await servicesApi.update(service.id, { active: !service.active });
      setServices((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    } catch {
      Alert.alert(t('nav.services'), t('profile.serviceToggleError'));
    }
  };

  const deleteService = (service: Service) => {
    Alert.alert(t('nav.services'), t('profile.serviceDeleteConfirm', { name: service.name }), [
      { text: t('client.chatActions.cancel'), style: 'cancel' },
      {
        text: t('profile.serviceDelete'),
        style: 'destructive',
        onPress: () => {
          void servicesApi
            .remove(service.id)
            .then(() => {
              setServices((current) => current.filter((item) => item.id !== service.id));
              if (serviceForm.id === service.id) resetServiceForm();
            })
            .catch(() => Alert.alert(t('nav.services'), t('profile.serviceDeleteError')));
        },
      },
    ]);
  };

  if (loading) {
    return <Spinner fullscreen />;
  }

  return (
    <ScreenContainer scroll showBack scrollRef={scrollRef}>
      {!shouldFocusServices ? (
        <>
          <SectionHeader
            title={t('profile.personalInfo')}
            subtitle={t('profile.personalInfoSubtitle')}
          />

          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name={profile?.displayName || profile?.email || user?.email || 'U'} size={56} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text variant="bodyStrong">{profile?.displayName || user?.email?.split('@')[0] || t('profile.userFallback')}</Text>
              <Text variant="caption" color="textSecondary">{profile?.email || user?.email}</Text>
              <Badge label={profile?.role ?? user?.role ?? 'USER'} tone="primary" />
            </View>
          </Card>

          <Card style={{ gap: spacing.md }}>
            <Input label={t('profile.displayName')} value={displayName} onChangeText={setDisplayName} placeholder={t('profile.displayNamePlaceholder')} />
            <Input
              label={t('profile.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('profile.phonePlaceholder')}
              keyboardType="phone-pad"
            />
            <Input label={t('profile.emailReadonly')} value={profile?.email ?? user?.email ?? ''} editable={false} />
            <Input label={t('profile.userIdReadonly')} value={profile?.userId ?? user?.userId ?? ''} editable={false} />
          </Card>

          <SectionHeader title={t('profile.location')} subtitle={t('profile.locationSubtitle')} />
          <Card style={{ gap: spacing.md }}>
            <Input label={t('profile.country')} value={COSTA_RICA_COUNTRY_NAME} editable={false} />
            <DropdownField
              label={t('profile.province')}
              value={address.province}
              options={toLocationOptions(provinces)}
              onChange={selectProvince}
            />
            <DropdownField
              label={t('profile.city')}
              value={address.canton}
              options={provinceNode ? toLocationOptions(provinceNode.children) : []}
              disabled={!address.province}
              disabledHint={t('registerFlow.selectProvinceFirst')}
              onChange={selectCanton}
            />
            <DropdownField
              label={t('profile.district')}
              value={address.district}
              options={cantonNode ? toLocationOptions(cantonNode.children) : []}
              disabled={!address.canton}
              disabledHint={t('registerFlow.selectCityFirst')}
              onChange={selectDistrict}
            />
            <Input label={t('profile.street')} value={address.streetLine} onChangeText={(value) => updateAddressField('streetLine', value)} />
            <Button label={t('profile.saveChanges')} loading={saving} onPress={save} />
          </Card>
        </>
      ) : null}

      {isProfessional ? (
        <>
          <View
            onLayout={(event) => {
              setServicesAnchorY(event.nativeEvent.layout.y);
            }}
          >
            <SectionHeader title={t('nav.services')} subtitle={t('profile.servicesSubtitle')} />
            <Card style={{ gap: spacing.md }}>
            <Text variant="bodyStrong">
              {serviceForm.id ? t('profile.serviceEditTitle') : t('profile.serviceNewTitle')}
            </Text>
            <Input
              label={t('profile.serviceName')}
              value={serviceForm.name}
              onChangeText={(value) => setServiceForm((current) => ({ ...current, name: value }))}
              placeholder={t('profile.serviceNamePlaceholder')}
            />
            <Input
              label={t('profile.serviceDescription')}
              value={serviceForm.description}
              onChangeText={(value) => setServiceForm((current) => ({ ...current, description: value }))}
              placeholder={t('profile.serviceDescriptionPlaceholder')}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('profile.servicePrice')}
                  value={serviceForm.price}
                  onChangeText={(value) => setServiceForm((current) => ({ ...current, price: value }))}
                  keyboardType="decimal-pad"
                  placeholder="100"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('profile.serviceDuration')}
                  value={serviceForm.durationMinutes}
                  onChangeText={(value) => setServiceForm((current) => ({ ...current, durationMinutes: value }))}
                  keyboardType="number-pad"
                  placeholder="60"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('profile.serviceCurrency')}
                  value={serviceForm.currency}
                  onChangeText={(value) => setServiceForm((current) => ({ ...current, currency: value.toUpperCase() }))}
                  placeholder="USD"
                />
              </View>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text variant="caption" color="textSecondary" weight="600">
                  {t('profile.serviceStatus')}
                </Text>
                <Pressable
                  onPress={() => setServiceForm((current) => ({ ...current, active: !current.active }))}
                  style={{
                    height: 50,
                    borderWidth: 1.5,
                    borderColor: serviceForm.active ? '#16A34A' : '#E2E8E5',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="bodyStrong" color={serviceForm.active ? 'success' : 'textSecondary'}>
                    {serviceForm.active ? t('screens.active') : t('profile.serviceInactive')}
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="textSecondary" weight="600">
                {t('profile.serviceCategory')}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {categories.length ? (
                  categories.map((category) => {
                    const selected = serviceForm.categoryId === category.id;
                    return (
                      <Button
                        key={category.id}
                        label={category.name}
                        size="sm"
                        fullWidth={false}
                        variant={selected ? 'primary' : 'outline'}
                        onPress={() => setServiceForm((current) => ({ ...current, categoryId: category.id }))}
                      />
                    );
                  })
                ) : (
                  <Text variant="caption" color="textMuted">
                    {t('profile.serviceNoCategories')}
                  </Text>
                )}
              </View>
            </View>
            <Pressable
              onPress={() =>
                setServiceForm((current) => ({ ...current, allowsBargaining: !current.allowsBargaining }))
              }
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text variant="bodyStrong">{t('profile.serviceAllowsBargaining')}</Text>
              <Icon
                name={serviceForm.allowsBargaining ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={serviceForm.allowsBargaining ? '#16A34A' : '#9AA8A1'}
              />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {serviceForm.id ? (
                <Button label={t('profile.serviceCancelEdit')} variant="outline" fullWidth={false} onPress={resetServiceForm} />
              ) : null}
              <Button
                label={serviceForm.id ? t('profile.serviceSave') : t('profile.serviceAdd')}
                loading={savingService}
                onPress={saveService}
                style={{ flex: 1 }}
              />
            </View>
          </Card>

          <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
            {services.length ? (
              services.map((service) => (
                <View
                  key={service.id}
                  style={{
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E2E8E5',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{service.name}</Text>
                      <Text variant="caption" color="textSecondary">
                        {service.currency ?? 'USD'} ${Number(service.price).toFixed(2)} · {service.durationMinutes || 60} min
                      </Text>
                      {service.description ? (
                        <Text variant="caption" color="textMuted">
                          {service.description}
                        </Text>
                      ) : null}
                    </View>
                    <Badge label={service.active ? t('screens.active') : t('profile.serviceInactive')} tone={service.active ? 'success' : 'warning'} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <Button
                      label={t('screens.edit')}
                      size="sm"
                      fullWidth={false}
                      variant="outline"
                      onPress={() => setServiceForm(serviceToForm(service))}
                    />
                    <Button
                      label={service.active ? t('profile.serviceDeactivate') : t('profile.serviceActivate')}
                      size="sm"
                      fullWidth={false}
                      variant="secondary"
                      onPress={() => toggleService(service)}
                    />
                    <Button
                      label={t('profile.serviceDelete')}
                      size="sm"
                      fullWidth={false}
                      variant="danger"
                      onPress={() => deleteService(service)}
                    />
                  </View>
                </View>
              ))
            ) : (
              <Text variant="body" color="textSecondary" style={{ paddingVertical: spacing.md }}>
                {t('profile.serviceNoServices')}
              </Text>
            )}
          </Card>
          </View>

          <SectionHeader title={t('screens.workingHours')} subtitle={t('screens.workingHoursHint')} />
          <Card style={{ gap: spacing.md }}>
            {workingHours.map((day) => (
              <Card key={day.dayOfWeek} style={{ gap: spacing.sm, backgroundColor: day.enabled ? '#F0FDF4' : '#F7FAF8' }}>
                <Pressable
                  onPress={() => updateWorkingHour(day.dayOfWeek, { enabled: !day.enabled })}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}
                >
                  <Text variant="bodyStrong">{t(`screens.weekDays.${day.key}`)}</Text>
                  <Icon name={day.enabled ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={day.enabled ? '#16A34A' : '#9AA8A1'} />
                </Pressable>
                {day.enabled ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label={t('screens.startTime')}
                        value={day.startTime}
                        placeholder="08:00"
                        keyboardType="numbers-and-punctuation"
                        onChangeText={(value) => updateWorkingHour(day.dayOfWeek, { startTime: value })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label={t('screens.endTime')}
                        value={day.endTime}
                        placeholder="17:00"
                        keyboardType="numbers-and-punctuation"
                        onChangeText={(value) => updateWorkingHour(day.dayOfWeek, { endTime: value })}
                      />
                    </View>
                  </View>
                ) : null}
              </Card>
            ))}
            <Button label={t('profile.saveWorkingHours')} loading={savingAvailability} onPress={saveWorkingHours} />
          </Card>
        </>
      ) : null}

      <SectionHeader
        title={t('profile.onboardingStatus')}
        subtitle={incompleteCount > 0 ? t('profile.onboardingIncompleteCount', { count: incompleteCount }) : t('profile.onboardingComplete')}
      />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {steps.map((step) => {
          const incomplete = !step.completed || step.skipped;
          return (
            <ListRow
              key={step.key}
              title={step.title}
              subtitle={step.skipped ? t('profile.onboardingSkippedNote') : undefined}
              icon={incomplete ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              right={<Badge label={incomplete ? t('profile.onboardingIncomplete') : t('profile.onboardingCompleted')} tone={incomplete ? 'warning' : 'success'} />}
              showChevron={!!step.href}
              onPress={step.href ? () => router.push(step.href as never) : undefined}
            />
          );
        })}
      </Card>
    </ScreenContainer>
  );
}

function buildOnboardingSteps(progress: VerificationProgress | null): OnboardingStep[] {
  const base: OnboardingStep[] = [
    {
      key: 'address',
      title: 'Dirección',
      completed: !!progress?.addressCompleted,
    },
    {
      key: 'identityDocument',
      title: 'Documento de identidad',
      completed: !!progress?.identityDocument,
      href: '/(auth)/verification-identity',
    },
    {
      key: 'faceMatch',
      title: 'Validación biométrica',
      completed: !!progress?.faceMatch,
      href: '/(auth)/verification-biometric',
    },
  ];

  if (progress?.role !== 'PROFESSIONAL') {
    return base;
  }

  return [
    ...base,
    step('professionalTitle', 'Título profesional', progress?.professionalTitle, progress?.professionalTitleSkipped, '/(auth)/verification-step'),
    step('professionalCollege', 'Colegio profesional', progress?.professionalCollege, progress?.professionalCollegeSkipped, '/(auth)/verification-college'),
    step('certifications', 'Certificaciones', progress?.certifications, progress?.certificationsSkipped, '/(auth)/verification-certifications'),
    step('portfolio', 'Portafolio', progress?.portfolio, progress?.portfolioSkipped, '/(auth)/verification-portfolio'),
    step('completedWork', 'Trabajos realizados', progress?.completedWork, progress?.completedWorkSkipped, '/(auth)/verification-work'),
    step('curriculum', 'Currículum', progress?.curriculum, progress?.curriculumSkipped, '/(auth)/verification-curriculum'),
    step('clientReferences', 'Referencias de clientes', progress?.clientReferences, progress?.clientReferencesSkipped, '/(auth)/verification-client-references'),
    step('linkedIn', 'LinkedIn / redes profesionales', progress?.linkedIn, progress?.linkedInSkipped, '/(auth)/verification-linkedin'),
    step('services', 'Servicios', progress?.services, progress?.servicesSkipped, '/(auth)/verification-services'),
    step('serviceContract', 'Contrato de servicio', progress?.serviceContract, progress?.serviceContractSkipped, '/(auth)/verification-contract'),
  ];
}

function step(
  key: string,
  title: string,
  completed?: boolean,
  skipped?: boolean,
  href?: string,
): OnboardingStep {
  return {
    key,
    title,
    completed: !!completed && !skipped,
    skipped,
    href,
  };
}
