import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { adminApi } from '@/api/admin.api';
import { availabilityApi } from '@/api/availability.api';
import { Badge, Button, Card, Icon, Input, ScreenContainer, Text } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { useAuthStore } from '@/store/authStore';
import { AppSettings, WeeklyAvailabilitySlot } from '@/types';
import { roleAccent, spacing } from '@/theme';

const TOTAL_STEPS = 16;
const PROFESSIONS = ['Electricista', 'Plomero', 'Carpintero', 'Pintor', 'Ingeniero', 'Arquitecto', 'Otro'];
const EXPERIENCE = ['0-1', '1-3', '3-5', '5-10', '10+'];
const WEEK_DAYS = [
  { dayOfWeek: 1, key: 'mon' },
  { dayOfWeek: 2, key: 'tue' },
  { dayOfWeek: 3, key: 'wed' },
  { dayOfWeek: 4, key: 'thu' },
  { dayOfWeek: 5, key: 'fri' },
  { dayOfWeek: 6, key: 'sat' },
  { dayOfWeek: 7, key: 'sun' },
] as const;

const DEFAULT_WORKING_HOURS = WEEK_DAYS.map((day) => ({
  dayOfWeek: day.dayOfWeek,
  enabled: day.dayOfWeek <= 6,
  startTime: '08:00',
  endTime: '17:00',
}));

function isValidTimeWindow(startTime: string, endTime: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) && /^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) && startTime < endTime;
}

export default function ProfessionalOnboarding() {
  const { t } = useTranslation();
  const accent = roleAccent.professional;
  const userId = useAuthStore((s) => s.user?.userId);
  const [step, setStep] = useState(2);
  const [radius, setRadius] = useState(25);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(['Electricista']);
  const [experience, setExperience] = useState('3-5');
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const saveWorkingHours = async () => {
    const activeSlots = workingHours.filter((day) => day.enabled);
    if (!activeSlots.length || activeSlots.some((day) => !isValidTimeWindow(day.startTime, day.endTime))) {
      setAvailabilityError(t('screens.workingHoursInvalid'));
      return false;
    }

    setAvailabilitySaving(true);
    setAvailabilityError(null);
    try {
      const weeklySlots: WeeklyAvailabilitySlot[] = activeSlots.map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));
      await availabilityApi.saveMine({
        professionalId: userId ?? 'me',
        slotDurationMinutes: 60,
        weeklySlots,
      });
      return true;
    } catch {
      setAvailabilityError(t('screens.workingHoursSaveError'));
      return false;
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const next = async () => {
    if (step === 12 && !(await saveWorkingHours())) return;
    if (step >= TOTAL_STEPS) {
      router.replace('/(auth)/pending-review' as never);
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(2, s - 1));

  useEffect(() => {
    let cancelled = false;
    setSettingsLoading(true);

    adminApi
      .getSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const plans = useMemo(() => {
    if (!settings) return [];
    return [
      { id: 'FREE', name: t('screens.freePlan'), price: 0, commission: settings.freeCommission, features: ['Perfil básico', 'Hasta 5 contactos/mes', 'Soporte estándar'] },
      { id: 'PRO', name: t('screens.proPlan'), price: 9.99, commission: settings.proCommission, features: ['Perfil destacado', 'Contactos ilimitados', 'Soporte prioritario', 'Estadísticas avanzadas'] },
      { id: 'PREMIUM', name: t('screens.premiumPlan'), price: 39.99, commission: settings.premiumCommission, features: ['Todo Pro', 'Badge verificado+', 'Promoción en mapa', 'Gerente de cuenta'] },
    ];
  }, [settings, t]);

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('registerPro.verificationTitle')} subtitle={t('screens.stepOf', { current: step, total: TOTAL_STEPS })} />
      <View style={{ height: 4, backgroundColor: '#E2E8E5', borderRadius: 2, marginBottom: spacing.md }}>
        <View style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: 4, backgroundColor: accent, borderRadius: 2 }} />
      </View>

      {step === 2 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('registerPro.step1')}</Text>
          <Input label="País" value="Costa Rica" />
          <Input label="Provincia" placeholder="San José" />
          <Input label="Cantón" placeholder="Central" />
          <Input label="Distrito" placeholder="Carmen" />
          <Input label="Dirección exacta" placeholder="Calle, número, referencias" />
        </Card>
      )}

      {step === 3 && (
        <Card style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl }}>
          <Icon name="scan-outline" size={48} color={accent} />
          <Text variant="title" center>{t('registerPro.step2')}</Text>
          <Text variant="body" color="textSecondary" center>✓ Buena iluminación{'\n'}✓ Sin lentes{'\n'}✓ Mirar a la cámara</Text>
          <Button label={t('screens.startVerification')} accentColor={accent} onPress={next} />
        </Card>
      )}

      {step === 4 && (
        <Card style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl }}>
          <View style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: accent, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera-outline" size={48} color={accent} />
          </View>
          <Text variant="body" center>Centra tu rostro en el círculo</Text>
          <Button label="Capturar selfie" accentColor={accent} iconLeft="camera-outline" onPress={next} />
        </Card>
      )}

      {step === 5 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('registerPro.step3')}</Text>
          <UploadSlot label={t('screens.uploadFront')} />
          <UploadSlot label={t('screens.uploadBack')} />
        </Card>
      )}

      {step === 6 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('screens.selectProfession')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {PROFESSIONS.map((p) => {
              const sel = selectedProfessions.includes(p);
              return (
                <Pressable key={p} onPress={() => setSelectedProfessions((prev) => (sel ? prev.filter((x) => x !== p) : [...prev, p]))} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1.5, borderColor: sel ? accent : '#E2E8E5', backgroundColor: sel ? `${accent}14` : 'transparent' }}>
                  <Text variant="caption" weight="600">{p}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}

      {step === 7 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('screens.uploadTitle')}</Text>
          <UploadSlot label="PDF, JPG o PNG" />
        </Card>
      )}

      {step === 8 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('screens.belongsCollege')}</Text>
          <Input label={t('screens.collegeName')} placeholder="Colegio Federado de Ingenieros" />
          <Input label={t('screens.licenseNumber')} placeholder="12345-CR" />
        </Card>
      )}

      {step === 9 && (
        <Card style={{ gap: spacing.md }}>
          <Input label={t('screens.linkedinUrl')} placeholder="https://linkedin.com/in/tu-perfil" iconLeft="logo-linkedin" autoCapitalize="none" />
        </Card>
      )}

      {step === 10 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('screens.experienceYears')}</Text>
          {EXPERIENCE.map((e) => (
            <Pressable key={e} onPress={() => setExperience(e)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
              <Icon name={experience === e ? 'radio-button-on' : 'radio-button-off'} size={22} color={accent} />
              <Text variant="body">{e} años</Text>
            </Pressable>
          ))}
        </Card>
      )}

      {step === 11 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('screens.uploadPortfolio')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#E2E8E5', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="image-outline" size={24} color="#9AA8A1" />
              </View>
            ))}
            <Pressable style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderColor: accent, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="add-outline" size={24} color={accent} />
            </Pressable>
          </View>
        </Card>
      )}

      {step === 12 && (
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Text variant="bodyStrong">{t('screens.workingHours')}</Text>
            <Text variant="caption" color="textSecondary">
              {t('screens.workingHoursHint')}
            </Text>
          </View>

          {workingHours.map((day) => {
            const dayLabel = t(`screens.weekDays.${WEEK_DAYS.find((item) => item.dayOfWeek === day.dayOfWeek)?.key ?? 'mon'}`);
            return (
              <Card key={day.dayOfWeek} style={{ gap: spacing.sm, backgroundColor: day.enabled ? `${accent}10` : '#F7FAF8' }}>
                <Pressable
                  onPress={() =>
                    setWorkingHours((current) =>
                      current.map((item) => (item.dayOfWeek === day.dayOfWeek ? { ...item, enabled: !item.enabled } : item)),
                    )
                  }
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}
                >
                  <Text variant="bodyStrong">{dayLabel}</Text>
                  <Icon name={day.enabled ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={day.enabled ? accent : '#9AA8A1'} />
                </Pressable>
                {day.enabled ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label={t('screens.startTime')}
                        value={day.startTime}
                        placeholder="08:00"
                        keyboardType="numbers-and-punctuation"
                        onChangeText={(value) =>
                          setWorkingHours((current) =>
                            current.map((item) => (item.dayOfWeek === day.dayOfWeek ? { ...item, startTime: value } : item)),
                          )
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label={t('screens.endTime')}
                        value={day.endTime}
                        placeholder="17:00"
                        keyboardType="numbers-and-punctuation"
                        onChangeText={(value) =>
                          setWorkingHours((current) =>
                            current.map((item) => (item.dayOfWeek === day.dayOfWeek ? { ...item, endTime: value } : item)),
                          )
                        }
                      />
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })}

          {availabilityError ? (
            <Text variant="caption" color="danger">
              {availabilityError}
            </Text>
          ) : null}
        </Card>
      )}

      {step === 13 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('screens.serviceRadius')}: {radius} km</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button label="-" size="sm" fullWidth={false} onPress={() => setRadius((r) => Math.max(5, r - 5))} />
            <View style={{ flex: 1, height: 8, backgroundColor: '#E2E8E5', borderRadius: 4, alignSelf: 'center' }}>
              <View style={{ width: `${(radius / 50) * 100}%`, height: 8, backgroundColor: accent, borderRadius: 4 }} />
            </View>
            <Button label="+" size="sm" fullWidth={false} onPress={() => setRadius((r) => Math.min(50, r + 5))} />
          </View>
        </Card>
      )}

      {step === 14 && (
        <Card style={{ gap: spacing.md }}>
          <Input label={t('screens.bankName')} placeholder="Banco Nacional" />
          <Input label={t('screens.accountType')} placeholder="Cuenta corriente" />
          <Input label={t('screens.accountNumber')} placeholder="CR00 0000 0000 0000 0000" />
          <Input label={t('screens.sinpeMovil')} placeholder="+506 7000 0000" keyboardType="phone-pad" />
        </Card>
      )}

      {step === 15 && (
        <View style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('screens.choosePlan')}</Text>
          {settingsLoading ? (
            <Text variant="body" color="textSecondary">Cargando planes desde el servidor...</Text>
          ) : plans.length ? (
            plans.map((plan) => (
              <Pressable key={plan.id} onPress={() => setSelectedPlan(plan.id)}>
                <Card style={{ borderWidth: selectedPlan === plan.id ? 2 : 0, borderColor: accent, gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodyStrong">{plan.name}</Text>
                    <Text variant="bodyStrong" style={{ color: accent }}>{plan.price === 0 ? 'Gratis' : `$${plan.price}/mes`}</Text>
                  </View>
                  <Badge label={`Comisión ${plan.commission}%`} tone="info" />
                  {plan.features.slice(0, 2).map((f) => <Text key={f} variant="caption" color="textSecondary">✓ {f}</Text>)}
                </Card>
              </Pressable>
            ))
          ) : (
            <Text variant="body" color="textSecondary">No se pudieron cargar los planes.</Text>
          )}
        </View>
      )}

      {step === 16 && (
        <Card style={{ gap: spacing.md }}>
          <Text variant="title">{t('screens.verificationSummary')}</Text>
          {[
            'Ubicación',
            'Biometría',
            'Documento ID',
            'Profesión',
            'Título',
            'Colegio',
            'LinkedIn',
            'Experiencia',
            'Portafolio',
            t('screens.workingHours'),
            'Radio',
            'Banco',
            'Plan',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="checkmark-circle" size={20} color={accent} />
              <Text variant="body">{item}</Text>
            </View>
          ))}
          <Card style={{ backgroundColor: `${accent}14`, alignItems: 'center', gap: spacing.sm }}>
            <Text variant="caption" color="textSecondary">{t('screens.initialTrustScore')}</Text>
            <Text variant="display" style={{ color: accent }}>87/100</Text>
          </Card>
        </Card>
      )}

      {step !== 3 && step !== 4 && (
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          {step > 2 && <Button label={t('common.back')} variant="outline" accentColor={accent} onPress={back} fullWidth style={{ flex: 1 }} />}
          <Button
            label={step === TOTAL_STEPS ? t('screens.submitReview') : t('common.continue')}
            accentColor={accent}
            loading={availabilitySaving}
            onPress={next}
            fullWidth
            style={{ flex: 1 }}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

function UploadSlot({ label }: { label: string }) {
  return (
    <Pressable style={{ height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5D0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
      <Icon name="cloud-upload-outline" size={28} color="#9AA8A1" />
      <Text variant="caption" color="textSecondary">{label}</Text>
    </Pressable>
  );
}
