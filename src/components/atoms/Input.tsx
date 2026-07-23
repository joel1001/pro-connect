import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

import { Icon, IconName } from './Icon';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  iconLeft?: IconName;
  secure?: boolean;
}

export function Input({ label, error, iconLeft, secure, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      {label && (
        <Text variant="caption" color="textSecondary" weight="600">
          {label}
        </Text>
      )}
      <View
        style={[
          styles.field,
          { borderColor, backgroundColor: theme.colors.surface, borderRadius: radius.md },
        ]}
      >
        {iconLeft && <Icon name={iconLeft} size={18} color={theme.colors.textMuted} />}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: theme.colors.text }]}
          {...rest}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    ...(typeof document !== 'undefined' ? { outlineStyle: 'none' as never } : {}),
  },
});
