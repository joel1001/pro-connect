import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type Props = {
  label?: string;
  value: string;
  onChange: (time: string) => void;
  error?: string;
  readOnly?: boolean;
};

function parseTime(value: string): Date {
  const [hours = '0', minutes = '0'] = value.slice(0, 5).split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function TimePickerField({ label, value, onChange, error, readOnly }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const pickerValue = useMemo(() => parseTime(value), [value]);

  const onPickerChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(formatTime(selected));
  };

  const borderColor = error ? theme.colors.danger : theme.colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text variant="caption" color="textSecondary" weight="600">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={readOnly ? undefined : () => setOpen(true)}
        disabled={readOnly}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor,
          backgroundColor: readOnly ? theme.colors.surfaceAlt : theme.colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          minHeight: 48,
          opacity: readOnly ? 0.85 : 1,
        }}
      >
        <Icon name="time-outline" size={20} color={theme.colors.primary} />
        <Text variant="body" style={{ flex: 1 }}>
          {value.slice(0, 5)}
        </Text>
        {!readOnly ? <Icon name="chevron-down" size={18} color={theme.colors.textMuted} /> : null}
      </Pressable>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
      {open ? (
        Platform.OS === 'ios' ? (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: 'hidden',
            }}
          >
            <DateTimePicker value={pickerValue} mode="time" display="spinner" onChange={onPickerChange} />
            <Pressable
              onPress={() => setOpen(false)}
              style={{
                alignItems: 'center',
                paddingVertical: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <Text variant="bodyStrong" style={{ color: theme.colors.primary }}>
                OK
              </Text>
            </Pressable>
          </View>
        ) : (
          <DateTimePicker value={pickerValue} mode="time" display="default" onChange={onPickerChange} />
        )
      ) : null}
    </View>
  );
}
