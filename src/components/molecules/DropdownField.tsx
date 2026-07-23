import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

export type DropdownOption = { label: string; value: string };

type Props = {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledHint?: string;
};

export function DropdownField({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  disabledHint,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const openPicker = () => {
    if (disabled || options.length === 0) return;
    setOpen(true);
  };

  const displayText = selected?.label ?? (disabled ? disabledHint : placeholder);

  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <Text variant="caption" color="textSecondary" weight="600">
          {label}
        </Text>
        <Pressable
          onPress={openPicker}
          disabled={disabled || options.length === 0}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1.5,
            borderColor: disabled ? theme.colors.border : selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: disabled ? '#F8FAFC' : theme.colors.surface,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            opacity: disabled ? 0.65 : 1,
          }}
        >
          <Text variant="body" color={selected && !disabled ? 'text' : 'textMuted'} style={{ flex: 1 }}>
            {displayText ?? placeholder ?? '—'}
          </Text>
          <Icon name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              maxHeight: '65%',
              ...(Platform.OS === 'web' ? { maxWidth: 440, alignSelf: 'center', width: '100%' } : {}),
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border }} />
            </View>
            <Text variant="bodyStrong" style={{ marginBottom: spacing.md }}>
              {label}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <Text variant="body" weight={active ? '700' : '400'} color={active ? 'primary' : 'text'}>
                      {opt.label}
                    </Text>
                    {active && <Icon name="checkmark" size={18} color={theme.colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
