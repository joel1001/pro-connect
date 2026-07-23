import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type Props = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  readOnly?: boolean;
};

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DatePickerField({ label, value, onChange, minimumDate, maximumDate, error, readOnly }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const onPickerChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(selected);
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
        <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
        <Text variant="body" style={{ flex: 1 }}>
          {formatDisplayDate(value)}
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
            <DateTimePicker
              value={value}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={onPickerChange}
              locale="es-ES"
            />
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
          <DateTimePicker
            value={value}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={onPickerChange}
          />
        )
      ) : null}
    </View>
  );
}
