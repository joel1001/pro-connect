import { Modal, Pressable, View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { DatePickerField } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  accentColor: string;
  title: string;
  serviceDate: Date;
  serviceTime: string;
  estimatedArrivalTime: string;
  price: string;
  notes: string;
  durationMinutes: string;
  listPriceHint?: string;
  onChangeServiceDate: (d: Date) => void;
  onChangeServiceTime: (v: string) => void;
  onChangeEstimatedArrivalTime: (v: string) => void;
  onChangePrice: (v: string) => void;
  onChangeNotes: (v: string) => void;
  onChangeDurationMinutes: (v: string) => void;
  onPropose: () => void;
  onClose: () => void;
  proposing?: boolean;
  lockSchedule?: boolean;
  maximumScheduleDate?: Date;
  labels: {
    date: string;
    time: string;
    arrival: string;
    price: string;
    notes: string;
    duration: string;
    propose: string;
    cancel: string;
    listPriceHint: string;
  };
};

export function EmergencyHireNegotiationPanel({
  visible,
  accentColor,
  title,
  serviceDate,
  serviceTime,
  estimatedArrivalTime,
  price,
  notes,
  durationMinutes,
  listPriceHint,
  onChangeServiceDate,
  onChangeServiceTime,
  onChangeEstimatedArrivalTime,
  onChangePrice,
  onChangeNotes,
  onChangeDurationMinutes,
  onPropose,
  onClose,
  proposing,
  lockSchedule,
  maximumScheduleDate,
  labels,
}: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.sm,
            maxHeight: '88%',
          }}
        >
          <Text variant="bodyStrong">{title}</Text>
          {listPriceHint ? (
            <Text variant="caption" color="textSecondary">
              {labels.listPriceHint.replace('{{hint}}', listPriceHint)}
            </Text>
          ) : null}
          <DatePickerField
            label={labels.date}
            value={serviceDate}
            onChange={onChangeServiceDate}
            minimumDate={new Date()}
            maximumDate={maximumScheduleDate}
            readOnly={lockSchedule}
          />
          <Input
            label={labels.time}
            value={serviceTime}
            onChangeText={onChangeServiceTime}
            placeholder="HH:MM"
            editable={!lockSchedule}
          />
          <Input label={labels.arrival} value={estimatedArrivalTime} onChangeText={onChangeEstimatedArrivalTime} placeholder="HH:MM" />
          <Input label={labels.price} value={price} onChangeText={onChangePrice} keyboardType="decimal-pad" placeholder="0.00" />
          <Input label={labels.duration} value={durationMinutes} onChangeText={onChangeDurationMinutes} keyboardType="number-pad" />
          <Input label={labels.notes} value={notes} onChangeText={onChangeNotes} multiline />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Button label={labels.cancel} variant="outline" accentColor={accentColor} onPress={onClose} style={{ flex: 1 }} />
            <Button label={labels.propose} accentColor={accentColor} loading={proposing} onPress={onPropose} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
