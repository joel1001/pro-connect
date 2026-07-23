import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Input, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { DatePickerField, formatLocalDate, SectionHeader } from '@/components/molecules';
import { contractsApi } from '@/api/contracts.api';
import { offersApi } from '@/api/offers.api';
import { professionalsApi } from '@/api/professionals.api';
import { servicesApi } from '@/api/services.api';
import { getApiErrorMessage } from '@/api/client';
import { ProfessionalUser, Service } from '@/types';
import { roleAccent, spacing } from '@/theme';

function priceLabel(service: Service, t: (k: string) => string) {
  const suffix = service.pricingType === 'HOURLY' ? t('client.perHour') : '';
  return `$${service.price}${suffix}`;
}

function sumListedPrice(items: Service[]) {
  return items.reduce((sum, s) => sum + Number(s.price), 0);
}

export default function HireFlow() {
  const { id, serviceId: presetServiceId, amount: presetAmount } = useLocalSearchParams<{
    id: string;
    serviceId?: string;
    amount?: string;
  }>();
  const { t } = useTranslation();
  const [pro, setPro] = useState<ProfessionalUser | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [offerNote, setOfferNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accent = roleAccent.client;

  const selectedServices = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds],
  );

  const canBargain = selectedServices.some((s) => s.allowsBargaining);
  const offerService = selectedServices.find((s) => s.allowsBargaining) ?? selectedServices[0];

  useEffect(() => {
    if (!id) return;
    Promise.all([professionalsApi.getById(id), servicesApi.list({ professionalId: id })])
      .then(([p, s]) => {
        setPro(p);
        const active = s.filter((x) => x.active);
        setServices(active);
        if (active.length === 0) {
          if (presetServiceId) setServiceIds([presetServiceId]);
          if (presetAmount) setAmount(presetAmount);
          return;
        }
        const initialIds = presetServiceId
          ? [presetServiceId]
          : active[0]
            ? [active[0].id]
            : [];
        setServiceIds(initialIds);
        const initialTotal = presetAmount
          ? presetAmount
          : String(
              sumListedPrice(
                active.filter((x) => initialIds.includes(x.id)),
              ),
            );
        setAmount(initialTotal);
      })
      .catch(() => setPro(null))
      .finally(() => setLoading(false));
  }, [id, presetServiceId, presetAmount]);

  useEffect(() => {
    if (amountTouched || selectedServices.length === 0) return;
    setAmount(String(sumListedPrice(selectedServices)));
  }, [selectedServices, amountTouched]);

  const toggleService = (serviceId: string) => {
    setServiceIds((prev) => {
      const next = prev.includes(serviceId)
        ? prev.filter((x) => x !== serviceId)
        : [...prev, serviceId];
      return next;
    });
  };

  const onContinue = async () => {
    if (!pro || serviceIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const contract = await contractsApi.create({
        professionalId: pro.id,
        serviceIds,
        scheduledDate: formatLocalDate(scheduledDate),
        amount: Number(amount),
        currency: 'USD',
      });
      router.push(`/client/contract/${contract.id}` as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.offer.error')));
    } finally {
      setSubmitting(false);
    }
  };

  const onSendOffer = async () => {
    if (!pro || !offerService || serviceIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const serviceNames = selectedServices.map((s) => s.name).join(', ');
      const noteParts = [
        offerNote.trim(),
        selectedServices.length > 1 ? `${t('client.hireFlow.servicesIncluded')}: ${serviceNames}` : '',
      ].filter(Boolean);
      const offer = await offersApi.create({
        professionalId: pro.id,
        serviceId: offerService.id,
        offeredAmount: Number(amount),
        currency: offerService.currency || 'USD',
        note: noteParts.join('\n') || undefined,
      });
      router.push({ pathname: '/shared/chat', params: { conversationId: offer.conversationId } } as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('client.offer.error')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (!pro) return null;

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('client.hireTitle')} subtitle={t('screens.stepOf', { current: 2, total: 5 })} />
      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">{pro.headline}</Text>
        <Text variant="caption" color="textSecondary">
          ${pro.startingPrice}
          {t('client.fromPrice')}
        </Text>
      </Card>
      {services.length > 0 && (
        <Card style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">{t('client.contract.services')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('client.hireFlow.selectServicesHint')}
          </Text>
          {services.map((s) => {
            const selected = serviceIds.includes(s.id);
            return (
              <Button
                key={s.id}
                label={`${selected ? '✓ ' : ''}${s.name} — ${priceLabel(s, t)}${s.allowsBargaining ? ` · ${t('client.offer.bargaining')}` : ''}`}
                variant={selected ? 'primary' : 'outline'}
                accentColor={accent}
                size="sm"
                onPress={() => toggleService(s.id)}
              />
            );
          })}
        </Card>
      )}
      <DatePickerField
        label={t('client.contract.date')}
        value={scheduledDate}
        onChange={setScheduledDate}
        minimumDate={minDate}
      />
      <Input
        label={canBargain ? t('client.offer.yourOffer') : t('client.contract.serviceTotal')}
        value={amount}
        onChangeText={(text) => {
          setAmountTouched(true);
          setAmount(text);
        }}
        keyboardType="numeric"
      />
      {canBargain ? (
        <>
          <Input
            label={t('client.offer.noteOptional')}
            value={offerNote}
            onChangeText={setOfferNote}
            placeholder={t('client.offer.notePlaceholder')}
          />
          <Text variant="caption" color="textSecondary">
            {t('client.offer.hint')}
          </Text>
        </>
      ) : null}
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Button
          label={t('common.back')}
          variant="outline"
          accentColor={accent}
          onPress={() => router.back()}
          fullWidth
          style={{ flex: 1 }}
        />
        {canBargain ? (
          <Button
            label={t('client.offer.send')}
            accentColor={accent}
            loading={submitting}
            disabled={serviceIds.length === 0}
            onPress={onSendOffer}
            fullWidth
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            label={t('common.continue')}
            accentColor={accent}
            loading={submitting}
            disabled={serviceIds.length === 0}
            onPress={onContinue}
            fullWidth
            style={{ flex: 1 }}
          />
        )}
      </View>
      {canBargain ? (
        <Button
          label={t('client.offer.hireListedPrice')}
          variant="outline"
          accentColor={accent}
          loading={submitting}
          disabled={serviceIds.length === 0}
          onPress={onContinue}
        />
      ) : null}
    </ScreenContainer>
  );
}
