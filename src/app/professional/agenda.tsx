import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { availabilityApi } from '@/api/availability.api';
import { Button, Card, Icon, Input, ScreenContainer, Text } from '@/components/atoms';
import { DatePickerField, formatLocalDate, ListRow, SectionHeader, TimePickerField } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { ProfessionalAvailability } from '@/types';
import { radius, roleAccent, spacing } from '@/theme';

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type BlockedInterval = NonNullable<ProfessionalAvailability['blockedIntervals']>[number];
type BlockKind = 'LUNCH' | 'TIME_OFF' | 'DAY_OFF' | 'VACATION';

const BLOCK_KINDS: { kind: BlockKind; icon: 'restaurant-outline' | 'time-outline' | 'calendar-clear-outline' | 'airplane-outline' }[] = [
  { kind: 'LUNCH', icon: 'restaurant-outline' },
  { kind: 'TIME_OFF', icon: 'time-outline' },
  { kind: 'DAY_OFF', icon: 'calendar-clear-outline' },
  { kind: 'VACATION', icon: 'airplane-outline' },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromIso(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

function plusDaysIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextAgendaDates(days: number) {
  return Array.from({ length: days }, (_, index) => plusDaysIsoDate(index));
}

function blockKey(block: BlockedInterval, index: number) {
  return `${block.type ?? 'block'}-${block.date ?? block.startDate ?? block.dayOfWeek ?? 'none'}-${block.startTime ?? 'all'}-${block.endTime ?? 'day'}-${index}`;
}

function blockIdentity(block: BlockedInterval) {
  return [
    block.type ?? 'block',
    block.date ?? '',
    block.startDate ?? '',
    block.endDate ?? '',
    block.dayOfWeek ?? '',
    block.startTime ?? '',
    block.endTime ?? '',
    block.effectiveFrom ?? '',
  ].join('|');
}

export default function ProfessionalAgenda() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const accent = roleAccent.professional;
  const user = useAuthStore((state) => state.user);
  const [availability, setAvailability] = useState<ProfessionalAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [blockKind, setBlockKind] = useState<BlockKind>('LUNCH');
  const [blockDate, setBlockDate] = useState(todayIsoDate());
  const [blockEndDate, setBlockEndDate] = useState(todayIsoDate());
  const [blockStartTime, setBlockStartTime] = useState('12:00');
  const [blockEndTime, setBlockEndTime] = useState('13:00');
  const [blockLabel, setBlockLabel] = useState('');

  const agendaDates = useMemo(() => nextAgendaDates(7), []);

  const lunchBlock = useMemo(
    () => availability?.blockedIntervals?.find((block) => block.type === 'LUNCH') ?? null,
    [availability?.blockedIntervals],
  );

  const visibleBlockedIntervals = useMemo(
    () => (availability?.blockedIntervals ?? []).filter((block) => block.type !== 'LUNCH'),
    [availability?.blockedIntervals],
  );

  useEffect(() => {
    if (!user?.userId) return;
    let mounted = true;
    setAvailabilityLoading(true);
    availabilityApi
      .get(user.userId)
      .then((data) => {
        if (mounted) setAvailability(data);
      })
      .catch(() => {
        Alert.alert(t('agenda.availabilityErrorTitle'), t('agenda.availabilityLoadError'));
      })
      .finally(() => {
        if (mounted) setAvailabilityLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [t, user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    let mounted = true;
    setSlotsLoading(true);
    availabilityApi
      .slots(user.userId, selectedDate)
      .then((data) => {
        if (mounted) setSlots(data);
      })
      .catch(() => {
        if (mounted) setSlots([]);
      })
      .finally(() => {
        if (mounted) setSlotsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedDate, user?.userId]);

  const saveAvailability = async (blockedIntervals: BlockedInterval[]) => {
    if (!user?.userId || !availability) return;
    const previousAvailability = availability;
    setAvailability({
      ...availability,
      professionalId: user.userId,
      blockedIntervals,
    });
    setSavingBlock(true);
    try {
      const saved = await availabilityApi.saveMine({
        ...availability,
        professionalId: user.userId,
        blockedIntervals,
      });
      setAvailability(saved);
    } catch {
      setAvailability(previousAvailability);
      Alert.alert(t('agenda.availabilityErrorTitle'), t('agenda.availabilitySaveError'));
    } finally {
      setSavingBlock(false);
    }
  };

  const validateTimedBlock = () => {
    if (blockKind === 'DAY_OFF' || blockKind === 'VACATION') return true;
    return TIME_PATTERN.test(blockStartTime) && TIME_PATTERN.test(blockEndTime) && blockStartTime < blockEndTime;
  };

  const addBlock = () => {
    if (!availability) return;
    if ((blockKind === 'TIME_OFF' || blockKind === 'DAY_OFF') && !/^\d{4}-\d{2}-\d{2}$/.test(blockDate)) {
      Alert.alert(t('agenda.validationTitle'), t('agenda.invalidDate'));
      return;
    }
    if (blockKind === 'VACATION' && (!/^\d{4}-\d{2}-\d{2}$/.test(blockDate) || !/^\d{4}-\d{2}-\d{2}$/.test(blockEndDate) || blockDate > blockEndDate)) {
      Alert.alert(t('agenda.validationTitle'), t('agenda.invalidDateRange'));
      return;
    }
    if (!validateTimedBlock()) {
      Alert.alert(t('agenda.validationTitle'), t('agenda.invalidTimeRange'));
      return;
    }
    if (blockKind === 'LUNCH') {
      const lunchBlock: BlockedInterval = {
        type: 'LUNCH',
        allDay: false,
        startTime: blockStartTime,
        endTime: blockEndTime,
        label: t('agenda.lunch'),
        effectiveFrom: plusDaysIsoDate(2),
      };
      const blocksWithoutPreviousLunch = (availability.blockedIntervals ?? []).filter((block) => block.type !== 'LUNCH');
      void saveAvailability([...blocksWithoutPreviousLunch, lunchBlock]);
      return;
    }
    const nextBlock: BlockedInterval = {
      type: blockKind,
      date: blockKind === 'TIME_OFF' || blockKind === 'DAY_OFF' ? blockDate : undefined,
      startDate: blockKind === 'VACATION' ? blockDate : undefined,
      endDate: blockKind === 'VACATION' ? blockEndDate : undefined,
      allDay: blockKind === 'DAY_OFF' || blockKind === 'VACATION',
      startTime: blockKind === 'TIME_OFF' ? blockStartTime : undefined,
      endTime: blockKind === 'TIME_OFF' ? blockEndTime : undefined,
      label: blockLabel.trim() || undefined,
    };
    void saveAvailability([...(availability.blockedIntervals ?? []), nextBlock]);
  };

  const removeBlock = (blockToRemove: BlockedInterval) => {
    if (!availability) return;
    const targetIdentity = blockIdentity(blockToRemove);
    void saveAvailability((availability.blockedIntervals ?? []).filter((block) => blockIdentity(block) !== targetIdentity));
  };

  const describeBlock = (block: BlockedInterval) => {
    const scope = block.startDate || block.endDate
      ? `${block.startDate ?? block.endDate} → ${block.endDate ?? block.startDate}`
      : block.date
      ? block.date
      : block.dayOfWeek
        ? t(`screens.weekDays.${WEEK_DAY_KEYS[block.dayOfWeek - 1]}`)
        : t('agenda.recurring');
    if (block.type === 'VACATION') return scope;
    const time = block.allDay ? t('agenda.allDay') : `${block.startTime ?? '--:--'} - ${block.endTime ?? '--:--'}`;
    const effective = block.effectiveFrom ? ` · ${t('agenda.fromDate', { date: block.effectiveFrom })}` : '';
    return `${scope} · ${time}${effective}`;
  };

  const selectedBlockRequiresTime = blockKind === 'LUNCH' || blockKind === 'TIME_OFF';
  const selectedBlockRequiresDate = blockKind === 'TIME_OFF' || blockKind === 'DAY_OFF' || blockKind === 'VACATION';
  const blockPrimaryLabel = blockKind === 'LUNCH' ? t('agenda.saveLunch') : t('agenda.addBlock');
  const todayDate = dateFromIso(todayIsoDate());

  return (
    <ScreenContainer>
      <SectionHeader title={t('nav.agenda')} subtitle={new Date().toLocaleString(i18n.language, { month: 'long', year: 'numeric' })} actionLabel={t('screens.blockTime')} />

      <SectionHeader title={t('agenda.availableDates')} subtitle={t('agenda.availableDatesSubtitle')} />
      <Card style={{ gap: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateGrid}>
          {agendaDates.map((date) => {
            const selected = selectedDate === date;
            const parsed = dateFromIso(date);
            return (
              <Pressable
                key={date}
                onPress={() => setSelectedDate(date)}
                style={({ pressed }) => [
                  styles.dateButton,
                  {
                    opacity: pressed ? 0.82 : 1,
                    backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceAlt,
                    borderColor: selected ? accent : theme.colors.border,
                  },
                ]}
              >
                <Text variant="label" center style={{ color: selected ? accent : theme.colors.textMuted }}>
                  {parsed.toLocaleDateString(i18n.language, { weekday: 'short' })}
                </Text>
                <Text variant="h3" center style={{ color: selected ? accent : theme.colors.text }}>
                  {parsed.getDate()}
                </Text>
                <Text variant="label" center style={{ color: selected ? accent : theme.colors.textMuted }}>
                  {parsed.toLocaleDateString(i18n.language, { month: 'short' })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Card>

      <SectionHeader title={t('agenda.availableSlots')} subtitle={dateFromIso(selectedDate).toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })} />
      <Card style={{ gap: spacing.md }}>
        {slotsLoading ? (
          <Text variant="body" color="textSecondary">{t('agenda.loadingSlots')}</Text>
        ) : slots.length ? (
          <View style={styles.slotGrid}>
            {slots.map((slot) => (
              <View
                key={slot}
                style={[
                  styles.slotPill,
                  {
                    backgroundColor: `${accent}10`,
                    borderColor: `${accent}24`,
                  },
                ]}
              >
                <Icon name="time-outline" size={16} color={accent} />
                <Text variant="bodyStrong" style={{ color: accent }}>
                  {slot.slice(0, 5)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: spacing.xs }}>
            <Text variant="bodyStrong">{t('agenda.noSlotsTitle')}</Text>
            <Text variant="body" color="textSecondary">{t('agenda.noSlotsDescription')}</Text>
          </View>
        )}
      </Card>

      <SectionHeader title={t('screens.blockTime')} subtitle={t('agenda.blockTimeSubtitle')} />
      <Card style={{ gap: spacing.md }}>
        <View style={styles.kindGrid}>
          {BLOCK_KINDS.map(({ kind, icon }) => {
            const selected = blockKind === kind;
            return (
              <Pressable
                key={kind}
                onPress={() => setBlockKind(kind)}
                style={[
                  styles.kindButton,
                  {
                    backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceAlt,
                    borderColor: selected ? accent : theme.colors.border,
                  },
                ]}
              >
                <Icon name={icon} size={18} color={selected ? accent : theme.colors.textMuted} />
                <Text
                  variant="caption"
                  weight="600"
                  center
                  numberOfLines={2}
                  style={{ color: selected ? accent : theme.colors.textSecondary }}
                >
                  {t(`agenda.blockKinds.${kind}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {blockKind !== 'LUNCH' ? (
          <Text variant="caption" color="textSecondary">
            {t(`agenda.blockKindHints.${blockKind}`)}
          </Text>
        ) : null}

        {selectedBlockRequiresDate && (
          <DatePickerField
            label={blockKind === 'VACATION' ? t('agenda.startDate') : t('agenda.blockDate')}
            value={dateFromIso(blockDate)}
            onChange={(selectedDate) => setBlockDate(formatLocalDate(selectedDate))}
            minimumDate={todayDate}
          />
        )}

        {blockKind === 'VACATION' && (
          <DatePickerField
            label={t('agenda.endDate')}
            value={dateFromIso(blockEndDate)}
            onChange={(selectedDate) => setBlockEndDate(formatLocalDate(selectedDate))}
            minimumDate={dateFromIso(blockDate)}
          />
        )}

        {selectedBlockRequiresTime && (
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <TimePickerField label={t('screens.startTime')} value={blockStartTime} onChange={setBlockStartTime} />
            </View>
            <View style={{ flex: 1 }}>
              <TimePickerField label={t('screens.endTime')} value={blockEndTime} onChange={setBlockEndTime} />
            </View>
          </View>
        )}

        {blockKind !== 'LUNCH' ? (
          <Input
            label={t('agenda.blockLabelOptional')}
            value={blockLabel}
            onChangeText={setBlockLabel}
            placeholder={t('agenda.blockLabelPlaceholder')}
          />
        ) : null}

        <View style={styles.actionRow}>
          <Button label={blockPrimaryLabel} onPress={addBlock} loading={savingBlock} disabled={availabilityLoading || !availability} fullWidth={false} iconLeft="add-outline" />
        </View>
      </Card>

      {lunchBlock ? (
        <Card
          style={{
            gap: spacing.xs,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.primarySurface,
              }}
            >
              <Icon name="restaurant-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text variant="bodyStrong">{t('agenda.lunchTimeSummary')}</Text>
          </View>
          <Text variant="caption" color="textSecondary">
            {t('agenda.lunchTimeFromTo', {
              start: lunchBlock.startTime?.slice(0, 5) ?? '--:--',
              end: lunchBlock.endTime?.slice(0, 5) ?? '--:--',
            })}
          </Text>
        </Card>
      ) : null}

      <SectionHeader title={t('agenda.blockedTimes')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {availabilityLoading ? (
          <Text variant="body" color="textSecondary">{t('agenda.loadingAvailability')}</Text>
        ) : visibleBlockedIntervals.length ? (
          visibleBlockedIntervals.map((block, index) => (
            <ListRow
              key={blockKey(block, index)}
              title={block.label || t(`agenda.blockKinds.${block.type ?? 'TIME_OFF'}`)}
              subtitle={describeBlock(block)}
              icon={block.date ? 'calendar-clear-outline' : 'repeat-outline'}
              accent={accent}
              right={
                <Pressable onPress={() => removeBlock(block)} hitSlop={8} disabled={savingBlock}>
                  <Icon name="trash-outline" size={18} color={theme.colors.danger} />
                </Pressable>
              }
            />
          ))
        ) : (
          <View style={{ paddingVertical: spacing.lg }}>
            <Text variant="body" color="textSecondary">{t('agenda.noBlockedTimes')}</Text>
          </View>
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kindButton: {
    width: '48%',
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateButton: {
    width: 74,
    minHeight: 82,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotPill: {
    minWidth: 94,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
