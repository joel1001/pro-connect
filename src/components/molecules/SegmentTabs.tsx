import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

export interface SegmentTabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  accent?: string;
}

export function SegmentTabs({ tabs, active, onChange, accent }: SegmentTabsProps) {
  const theme = useTheme();
  const color = theme.colors.primary;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.md,
        padding: 4,
        gap: 4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radius.sm,
              backgroundColor: isActive ? theme.colors.surface : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text variant="caption" weight={isActive ? '700' : '500'} style={{ color: isActive ? color : theme.colors.textSecondary }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface FilterChipsProps {
  items: string[];
  selected?: string;
  onSelect: (item: string) => void;
  accent?: string;
}

export function FilterChips({ items, selected, onSelect, accent }: FilterChipsProps) {
  const theme = useTheme();
  const color = theme.colors.primary;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
      {items.map((item) => {
        const isActive = item === selected;
        return (
          <Pressable
            key={item}
            onPress={() => onSelect(item)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: isActive ? `${color}18` : theme.colors.surfaceSunken,
              borderWidth: isActive ? 1 : 0,
              borderColor: color,
            }}
          >
            <Text variant="caption" weight="600" style={{ color: isActive ? color : theme.colors.textSecondary }}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
