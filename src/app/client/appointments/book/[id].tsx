import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Input, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { DatePickerField, formatLocalDate, SectionHeader } from '@/components/molecules';
import { appointmentsApi } from '@/api/appointments.api';
import { availabilityApi } from '@/api/availability.api';
import { professionalsApi } from '@/api/professionals.api';
import { servicesApi } from '@/api/services.api';
import { getApiErrorMessage } from '@/api/client';
import { ProfessionalUser, Service } from '@/types';
import { roleAccent, spacing } from '@/theme';

function priceLabel(service: Service, t: (k: string) => string) {
  const suffix = service.pricingType === 'HOURLY' ? t('client.perHour') : '';
  return `$${service.price}${suffix}`;
}

function standardMinimumDate() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(12, 0, 0, 0);
  return date;
}

export default function BookAppointment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const accent = roleAccent.client;
  const [pro, setPro] = useState<ProfessionalUser | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(() => {
    return standardMinimumDate();
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateStr = formatLocalDate(date);
  const minStandardDate = standardMinimumDate();
  const isStandardDateAllowed = date >= minStandardDate;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [p, s] = await Promise.all([
          professionalsApi.getById(id),
          servicesApi.list({ professionalId: id }),
        ]);
        setPro(p);
        const active = s.filter((x) => x.active);
        setServices(active);
        if (active[0]) setServiceIds([active[0].id]);
      } catch (e) {
        setLoadError(getApiErrorMessage(e, t('appointments.errors.create')));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  useEffect(() => {
    if (!id) return;
    availabilityApi.slots(id, dateStr).then(setSlots).catch(() => setSlots([]));
  }, [id, dateStr]);

  useEffect(() => {
    if (slots.length && !slots.includes(selectedTime)) {
      setSelectedTime(slots[0] ?? '');
    }
  }, [slots, selectedTime]);

  const toggleService = (serviceId: string) => {
    setServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((x) => x !== serviceId) : [...prev, serviceId],
    );
  };

  const submit = async () => {
    if (!pro || serviceIds.length === 0 || !selectedTime) return;
    if (!isStandardDateAllowed) {
      setError(t('appointments.standardMinDateError'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const apt = await appointmentsApi.create({
        professionalId: pro.id,
        serviceIds,
        scheduledDate: dateStr,
        scheduledTime: selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime,
        notes: notes.trim() || undefined,
      });
      router.replace(`/client/appointments/${apt.id}` as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('appointments.errors.create')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <ScreenContainer showBack>
        <Card style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">{t('appointments.bookTitle')}</Text>
          <Text variant="caption" color="danger">
            {loadError}
          </Text>
        </Card>
      </ScreenContainer>
    );
  }

  if (loading || !pro) return <Spinner fullscreen />;

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('appointments.bookTitle')} subtitle={pro.headline} />
      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">{t('client.contract.services')}</Text>
        {services.map((s) => (
          <Button
            key={s.id}
            label={`${serviceIds.includes(s.id) ? '✓ ' : ''}${s.name} — ${priceLabel(s, t)}`}
            size="sm"
            variant={serviceIds.includes(s.id) ? 'primary' : 'outline'}
            accentColor={accent}
            onPress={() => toggleService(s.id)}
          />
        ))}
      </Card>
      <DatePickerField
        label={t('client.contract.date')}
        value={date}
        onChange={setDate}
        minimumDate={minStandardDate}
      />
      <Card style={{ gap: spacing.xs, backgroundColor: `${accent}10` }}>
        <Text variant="caption" color="textSecondary">
          {t('appointments.standardBookingHint')}
        </Text>
      </Card>
      <Text variant="label" weight="600" style={{ marginBottom: spacing.xs }}>
        {t('appointments.availableSlots')}
      </Text>
      {slots.length === 0 ? (
        <Text variant="caption" color="textSecondary">
          {t('appointments.noSlots')}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {slots.map((slot) => (
            <Button
              key={slot}
              label={slot.slice(0, 5)}
              size="sm"
              variant={selectedTime === slot ? 'primary' : 'outline'}
              accentColor={accent}
              onPress={() => setSelectedTime(slot)}
            />
          ))}
        </View>
      )}
      <Input label={t('appointments.notes')} value={notes} onChangeText={setNotes} multiline />
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={t('appointments.request')}
        accentColor={accent}
        loading={submitting}
        disabled={!selectedTime || serviceIds.length === 0 || !isStandardDateAllowed}
        onPress={submit}
      />
    </ScreenContainer>
  );
}
