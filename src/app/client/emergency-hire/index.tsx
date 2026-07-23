import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { catalogApi } from '@/api/catalog.api';
import { getApiErrorMessage } from '@/api/client';
import { emergencyHireApi } from '@/api/emergencyHire.api';
import { Button, Card, Input, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmergencyHireContactOverlay, EmergencyHireContactStep } from '@/components/client/EmergencyHireContactOverlay';
import { EmergencyHireDisclaimer } from '@/components/client/EmergencyHireDisclaimer';
import { EmergencyHireProfessionalCard } from '@/components/client/EmergencyHireProfessionalCard';
import { DatePickerField, DropdownField, ErrorBanner, formatLocalDate, SectionHeader } from '@/components/molecules';
import { useLiveOnlineMap } from '@/hooks/usePresenceWatch';
import { resolveReachableApiBaseUrl } from '@/lib/backendProbe';
import { runEmergencyHireContactFlow } from '@/lib/emergencyHireContact';
import { isEmergencyHireVisible, syncEmergencyHireVisibilityFromServer } from '@/lib/emergencyHireVisibility';
import { realtimeService } from '@/services/realtime';
import {
  EMERGENCY_HIRE_DESCRIPTION_MIN_LENGTH,
  isValidEmergencyHireDescription,
} from '@/lib/emergencyHireDescription';
import {
  clampPreferredTime,
  defaultPreferredTime,
  isDateWithinUrgentWindow,
  isValidPreferredSchedule,
  maxPreferredDate,
  minimumPreferredTime,
  startOfToday,
} from '@/lib/emergencyHireSchedule';
import { roleAccent, spacing } from '@/theme';
import { Category, EmergencyHireAvailableProfessional } from '@/types';
import * as Device from 'expo-device';

async function resolveDeviceLocation(): Promise<{
  lat: number;
  lng: number;
  label: string;
} | null> {
  if (__DEV__ && !Device.isDevice) {
    console.log('Local development on emulator, using forced location');

    return {
      lat: 10.0163,
      lng: -84.2116,
      label: 'Alajuela, Alajuela',
    };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    const place = places[0];

    if (place) {
      const parts = [place.district, place.city, place.region].filter(Boolean);

      if (parts.length > 0) {
        label = parts.join(', ');
      }
    }
  } catch {
    // Keep coordinate fallback
  }

  return { lat, lng, label };
}

export default function EmergencyHireCreate() {
  const { t } = useTranslation();
  const accent = roleAccent.client;
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locating, setLocating] = useState(true);
  const [preferredDate, setPreferredDate] = useState(() => startOfToday());
  const [preferredTime, setPreferredTime] = useState(() => defaultPreferredTime());
  const [timeError, setTimeError] = useState<string | null>(null);
  const [availablePros, setAvailablePros] = useState<EmergencyHireAvailableProfessional[]>([]);
  const [loadingPros, setLoadingPros] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [contactStep, setContactStep] = useState<EmergencyHireContactStep | null>(null);
  const [contactProName, setContactProName] = useState<string | undefined>();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [scheduleLocked, setScheduleLocked] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [proSectionError, setProSectionError] = useState<string | null>(null);
  const availableProsRequestRef = useRef(0);
  const onlineByUserId = useLiveOnlineMap(availablePros);

  const categoryOptions = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ label: c.name, value: c.id })),
    [categories],
  );

  const refreshLocation = useCallback(async () => {
    setLocating(true);
    setProSectionError(null);
    try {
      const resolved = await resolveDeviceLocation();
      if (!resolved) {
        setCoords(null);
        setLocationLabel('');
        return;
      }
      setCoords({ lat: resolved.lat, lng: resolved.lng });
      setLocationLabel(resolved.label);
    } catch {
      setCoords(null);
      setLocationLabel('');
    } finally {
      setLocating(false);
    }
  }, [t]);

  const loadAvailablePros = useCallback(async (options?: { silent?: boolean }) => {
    if (!coords || !categoryId) {
      setAvailablePros([]);
      return;
    }
    const requestId = ++availableProsRequestRef.current;
    if (!options?.silent) setLoadingPros(true);
    setProSectionError(null);

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const pros = await emergencyHireApi.availableProfessionals({
          categoryId,
          latitude: coords.lat,
          longitude: coords.lng,
        });
        if (requestId !== availableProsRequestRef.current) return;
        pros.forEach((pro) => {
          syncEmergencyHireVisibilityFromServer(pro.id, pro.emergencyHireEnabled);
        });
        setAvailablePros(pros);
        if (!options?.silent) setLoadingPros(false);
        return; // success — exit early
      } catch (e) {
        if (requestId !== availableProsRequestRef.current) return;
        lastError = e;
        if (attempt < MAX_RETRIES - 1) {
          // Wait before retrying (1s, 2s)
          await new Promise((r) => setTimeout(r, RETRY_DELAY * Math.pow(2, attempt)));
        }
      }
    }

    // All retries failed
    if (requestId !== availableProsRequestRef.current) return;
    setProSectionError(getApiErrorMessage(lastError, t('emergencyHire.errors.loadPros')));
    if (!options?.silent) setLoadingPros(false);
  }, [categoryId, coords, t]);

  useEffect(() => {
    (async () => {
      try {
        // Warm up: ensure the backend URL is resolved before making API calls
        await resolveReachableApiBaseUrl();

        // Retry loading categories with backoff
        let cats: Category[] = [];
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            cats = await catalogApi.listCategories();
            break;
          } catch {
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
            }
          }
        }
        setCategories(cats);
        if (cats[0]) setCategoryId(cats[0].id);
        await refreshLocation();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshLocation]);

  useEffect(() => {
    void loadAvailablePros();
  }, [loadAvailablePros]);

  useEffect(() => {
    return realtimeService.onEmergencyHireAvailabilityChange((update) => {
      if (!update.enabled) {
        availableProsRequestRef.current += 1;
        setAvailablePros((current) => current.filter((pro) => pro.id !== update.professionalId));
        return;
      }
      void loadAvailablePros({ silent: true });
    });
  }, [loadAvailablePros]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadAvailablePros({ silent: true });
    }, 3_000);

    return () => clearInterval(interval);
  }, [loadAvailablePros]);

  const buildPayload = () => ({
    categoryId,
    description: description.trim(),
    latitude: coords!.lat,
    longitude: coords!.lng,
    locationLabel: locationLabel || undefined,
    preferredDate: formatLocalDate(preferredDate),
    preferredTime: preferredTime.length >= 5 ? preferredTime : `${preferredTime}:00`,
  });

  const ensureRequest = async (preferredProfessionalId?: string) => {
    if (activeRequestId) return activeRequestId;
    const request = await emergencyHireApi.create({
      ...buildPayload(),
      preferredProfessionalId,
    });
    setActiveRequestId(request.id);
    setScheduleLocked(true);
    return request.id;
  };

  const today = startOfToday();

  const validateAndNormalizeSchedule = (): boolean => {
    if (!isDateWithinUrgentWindow(preferredDate)) {
      setTimeError(t('emergencyHire.errors.scheduleBeyond'));
      return false;
    }
    const normalized = clampPreferredTime(preferredDate, preferredTime);
    if (normalized !== preferredTime) setPreferredTime(normalized);
    if (!isValidPreferredSchedule(preferredDate, normalized)) {
      setTimeError(t('emergencyHire.errors.preferredTimeMin', { time: minimumPreferredTime() }));
      return false;
    }
    setTimeError(null);
    return true;
  };

  const validateDescription = useCallback(
    (value: string): string | null => {
      const trimmed = value.trim();
      if (!trimmed) return t('emergencyHire.errors.requiredContact');
      if (!isValidEmergencyHireDescription(trimmed)) {
        return t('emergencyHire.errors.descriptionMin', {
          min: EMERGENCY_HIRE_DESCRIPTION_MIN_LENGTH,
        });
      }
      return null;
    },
    [t],
  );

  const contactProfessional = async (professionalId: string) => {
    const descError = validateDescription(description);
    if (!coords || !categoryId || descError) {
      const message = !coords
        ? t('emergencyHire.locationDenied')
        : descError ?? t('emergencyHire.errors.requiredContact');
      setProSectionError(message);
      if (descError) {
        setDescriptionError(descError);
      }
      return;
    }
    if (!validateAndNormalizeSchedule()) {
      setProSectionError(t('emergencyHire.errors.preferredTimeMin', { time: minimumPreferredTime() }));
      return;
    }
    setContactingId(professionalId);
    setContactProName(availablePros.find((pro) => pro.id === professionalId)?.displayName);
    setContactStep('publishing');
    setProSectionError(null);
    setDescriptionError(null);
    try {
      const result = await runEmergencyHireContactFlow({
        existingRequestId: activeRequestId,
        ensureRequest: () => ensureRequest(professionalId),
        contact: (requestId) => emergencyHireApi.contact(requestId, professionalId),
        onStep: setContactStep,
      });
      router.push({
        pathname: '/shared/chat',
        params: {
          conversationId: result.conversationId,
          emergencyHireRequestId: result.requestId,
        },
      } as never);
    } catch (e) {
      setProSectionError(getApiErrorMessage(e, t('emergencyHire.errors.contact')));
    } finally {
      setContactingId(null);
      setContactStep(null);
      setContactProName(undefined);
    }
  };

  const contactProgressLabels = useMemo(
    () => ({
      publishing: t('emergencyHire.contactProgress.publishing'),
      connecting: t('emergencyHire.contactProgress.connecting'),
      messaging: t('emergencyHire.contactProgress.messaging'),
      opening: t('emergencyHire.contactProgress.opening'),
    }),
    [t],
  );

  if (loading) return <Spinner fullscreen />;

  const scheduleReadOnly = scheduleLocked || !!activeRequestId;

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('emergencyHire.title')} subtitle={t('emergencyHire.subtitle')} />
      <EmergencyHireDisclaimer />

      <Card style={{ gap: spacing.xs }}>
        {locating ? (
          <Text variant="caption" color="textSecondary">
            {t('emergencyHire.locationFetching')}
          </Text>
        ) : coords ? (
          <Text variant="caption" color="textSecondary">
            {t('emergencyHire.locationDetected', { label: locationLabel })}
          </Text>
        ) : (
          <Text variant="caption" color="danger">
            {t('emergencyHire.locationDenied')}
          </Text>
        )}
        {!locating ? (
          <Button
            label={t('emergencyHire.refreshLocation')}
            size="sm"
            variant="outline"
            accentColor={accent}
            onPress={() => void refreshLocation()}
          />
        ) : null}
      </Card>

      <DropdownField
        label={t('emergencyHire.profession')}
        value={categoryId}
        options={categoryOptions}
        onChange={setCategoryId}
        placeholder={t('emergencyHire.professionPlaceholder')}
        disabled={categoryOptions.length === 0}
        disabledHint={t('emergencyHire.professionEmpty')}
      />
      <Input
        label={t('emergencyHire.description')}
        value={description}
        onChangeText={(value) => {
          setDescription(value);
          const err = validateDescription(value);
          if (!err) {
            setDescriptionError(null);
            setProSectionError(null);
          }
        }}
        onBlur={() => {
          const err = validateDescription(description);
          if (err) setDescriptionError(err);
        }}
        placeholder={t('emergencyHire.descriptionPlaceholder')}
        multiline
        error={descriptionError ?? undefined}
      />
      <DatePickerField
        label={t('emergencyHire.preferredDate')}
        value={preferredDate}
        onChange={(d) => {
          setPreferredDate(d);
          setTimeError(null);
        }}
        minimumDate={today}
        maximumDate={maxPreferredDate()}
        readOnly={scheduleReadOnly}
      />
      <Input
        label={t('emergencyHire.preferredTime')}
        value={preferredTime}
        onChangeText={(v) => {
          setPreferredTime(v);
          setTimeError(null);
        }}
        placeholder="HH:MM"
        editable={!scheduleReadOnly}
        error={timeError ?? undefined}
        onBlur={() => {
          const normalized = clampPreferredTime(preferredDate, preferredTime);
          setPreferredTime(normalized);
          if (!isValidPreferredSchedule(preferredDate, normalized)) {
            setTimeError(t('emergencyHire.errors.preferredTimeMin', { time: minimumPreferredTime() }));
            return;
          }
          setTimeError(null);
          if (normalized.trim().length >= 4) setScheduleLocked(true);
        }}
      />
      {!scheduleReadOnly ? (
        <Text variant="caption" color="textMuted">
          {t('emergencyHire.errors.preferredDateHint')} {t('emergencyHire.preferredTimeHint', { time: minimumPreferredTime() })}
        </Text>
      ) : null}

      {proSectionError ? (
        <ErrorBanner
          message={proSectionError}
          retryLabel={t('common.retry')}
          onRetry={() => void loadAvailablePros()}
          onDismiss={() => setProSectionError(null)}
        />
      ) : null}

      <SectionHeader
        title={t('emergencyHire.availableTitle')}
        subtitle={
          loadingPros
            ? t('emergencyHire.loadingPros')
            : t('emergencyHire.availableCount', { count: availablePros.length })
        }
      />
      {!coords ? (
        <Card>
          <Text variant="caption" color="textSecondary">
            {t('emergencyHire.locationRequired')}
          </Text>
        </Card>
      ) : loadingPros ? (
        <Spinner />
      ) : availablePros.length === 0 ? (
        <Card>
          <Text variant="caption" color="textSecondary">
            {t('emergencyHire.noProsNearby')}
          </Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {availablePros.map((pro) => (
            <EmergencyHireProfessionalCard
              key={pro.id}
              professional={{ ...pro, online: onlineByUserId[pro.id] ?? pro.online }}
              accentColor={accent}
              loading={contactingId === pro.id}
              contactLabel={t('emergencyHire.contact')}
              onlineLabel={t('emergencyHire.online')}
              offlineLabel={t('emergencyHire.offline')}
              responseTimeLabel={t('emergencyHire.responseTime')}
              jobsLabel={t('emergencyHire.completedJobs')}
              kmLabel={t('emergencyHire.distanceKm')}
              onContact={() => contactProfessional(pro.id)}
            />
          ))}
        </View>
      )}

      <EmergencyHireContactOverlay
        visible={contactStep != null}
        step={contactStep ?? 'publishing'}
        professionalName={contactProName}
        accentColor={accent}
        hint={t('emergencyHire.contactProgress.hint')}
        labels={contactProgressLabels}
      />
    </ScreenContainer>
  );
}
