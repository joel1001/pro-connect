import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';
import { MarketplaceLocationNode } from '@/lib/marketplaceLocationTree';

type Props = {
  label: string;
  valuePath: string[];
  options: MarketplaceLocationNode[];
  onChangePath: (path: string[]) => void;
  placeholder?: string;
};

function resolveLevel(options: MarketplaceLocationNode[], path: string[]) {
  let currentOptions = options;
  let trail: string[] = [];

  for (const value of path) {
    const match = currentOptions.find((option) => option.value === value);
    if (!match) break;
    trail = [...trail, match.value];
    currentOptions = match.children ?? [];
    if (currentOptions.length === 0) break;
  }

  return { trail, currentOptions };
}

function resolveLabel(options: MarketplaceLocationNode[], path: string[]): string {
  const labels: string[] = [];
  let currentOptions = options;

  for (const value of path) {
    const match = currentOptions.find((option) => option.value === value);
    if (!match) break;
    labels.push(match.label);
    currentOptions = match.children ?? [];
    if (currentOptions.length === 0) break;
  }

  return labels.join(' / ');
}

export function HierarchicalLocationField({
  label,
  valuePath,
  options,
  onChangePath,
  placeholder = 'Selecciona una ubicación',
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [trail, setTrail] = useState<string[]>([]);

  const displayText = useMemo(() => {
    const labelText = resolveLabel(options, valuePath);
    return labelText || placeholder;
  }, [options, placeholder, valuePath]);

  const resolvedValue = useMemo(() => resolveLevel(options, valuePath), [options, valuePath]);
  const currentLevel = useMemo(() => resolveLevel(options, trail), [options, trail]);
  const trailLabel = useMemo(() => resolveLabel(options, trail), [options, trail]);

  const openPicker = () => {
    setTrail(resolvedValue.trail);
    setOpen((value) => !value);
  };

  const goBackOneLevel = () => {
    const nextTrail = trail.slice(0, -1);
    onChangePath(nextTrail);
    setTrail(nextTrail);
  };

  const selectOption = (path: string[], node: MarketplaceLocationNode) => {
    onChangePath(path);
    setTrail(path);

    if (node.children && node.children.length > 0) {
      return;
    }

    setOpen(false);
  };

  const visibleOptions = currentLevel.currentOptions.map((node) => ({
    path: [...trail, node.value],
    node,
  }));

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="caption" color="textSecondary" weight="600">
        {label}
      </Text>

      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          ...theme.shadow.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md }}>
          {trail.length > 0 || resolvedValue.trail.length > 0 ? (
            <Pressable
              onPress={goBackOneLevel}
              hitSlop={8}
              style={{
                width: 34,
                height: 34,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Icon name="arrow-back" size={16} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}

          <Pressable
            onPress={openPicker}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 54,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
            }}
          >
            <Text variant="bodyStrong" color="text" style={{ flex: 1 }}>
              {displayText}
            </Text>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={19} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        {open ? (
          <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 280 }}>
              {visibleOptions.map((match) => {
                const hasChildren = (match.node.children?.length ?? 0) > 0;
                const active = valuePath.join(' / ') === match.path.join(' / ');

                return (
                  <Pressable
                    key={match.path.join('>')}
                    onPress={() => selectOption(match.path, match.node)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: spacing.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      borderTopWidth: 1,
                      borderTopColor: theme.colors.border,
                      backgroundColor: active ? theme.colors.surfaceSunken : theme.colors.surface,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="body" weight={active ? '700' : '400'} color={active ? 'primary' : 'text'}>
                        {match.node.label}
                      </Text>
                    </View>
                    <Icon
                      name={hasChildren ? 'chevron-forward' : active ? 'checkmark' : 'ellipse-outline'}
                      size={20}
                      color={active ? theme.colors.primary : theme.colors.textMuted}
                    />
                  </Pressable>
                );
              })}

              {visibleOptions.length === 0 ? (
                <View style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
                  <Text variant="body" color="textMuted">
                    No hay ubicaciones que coincidan.
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}
