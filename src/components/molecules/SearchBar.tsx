import { TextInput, View } from 'react-native';

import { Icon } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

export interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, defaultValue, onChangeText, placeholder = 'Buscar...' }: SearchBarProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 46,
      }}
    >
      <Icon name="search-outline" size={18} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        defaultValue={defaultValue}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          { flex: 1, color: theme.colors.text, fontSize: 15, height: '100%' },
          typeof document !== 'undefined' ? ({ outlineStyle: 'none' } as never) : {},
        ]}
      />
    </View>
  );
}
