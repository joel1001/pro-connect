import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type Props = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

export function SelectField({ label, value, options, onChange }: Props) {
  const theme = useTheme();
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="caption" color="textSecondary" weight="600">
        {label}
      </Text>
      <View style={{ gap: spacing.xs }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1.5,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? '#16A34A12' : theme.colors.surface,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
              }}
            >
              <Text variant="body">{opt.label}</Text>
              {active && <Icon name="checkmark-circle" size={18} color={theme.colors.primary} />}
            </Pressable>
          );
        })}
        {!selected && value ? (
          <Text variant="caption" color="textMuted">
            {value}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
