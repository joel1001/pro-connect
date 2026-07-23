import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import {
  MarketplaceProfessional,
  marketplaceCategoryChips,
  marketplaceSearchSuggestions,
} from '@/lib/marketplace';
import { radius, spacing } from '@/theme';

export type MarketplaceSearchHeaderRef = {
  dismiss: () => void;
};

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  hint: string;
  suggestionsTitle: string;
  resultsCountLabel: string;
  noMatchLabel: string;
  popularLabel: string;
  cancelLabel: string;
  professionals: MarketplaceProfessional[];
  onSelectProfessional: (professional: MarketplaceProfessional) => void;
  onFilterPress?: () => void;
  onFocusChange?: (focused: boolean) => void;
};

export const MarketplaceSearchHeader = forwardRef<MarketplaceSearchHeaderRef, Props>(
  function MarketplaceSearchHeader(
    {
      value,
      onChangeText,
      placeholder,
      hint,
      suggestionsTitle,
      resultsCountLabel,
      noMatchLabel,
      popularLabel,
      cancelLabel,
      professionals,
      onSelectProfessional,
      onFilterPress,
      onFocusChange,
    },
    ref,
  ) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const inputRef = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);
    const dismissingRef = useRef(false);

    const suggestions = useMemo(
      () => marketplaceSearchSuggestions(professionals, value),
      [professionals, value],
    );
    const categories = useMemo(
      () => marketplaceCategoryChips(professionals.slice(0, 24)),
      [professionals],
    );
    const filteredCount = useMemo(() => {
      const q = value.trim().toLowerCase();
      if (!q) return professionals.length;
      return professionals.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.profession.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q),
      ).length;
    }, [professionals, value]);

    const dismiss = useCallback(() => {
      dismissingRef.current = true;
      Keyboard.dismiss();
      inputRef.current?.blur();
      setFocused(false);
      onFocusChange?.(false);
      setTimeout(() => {
        dismissingRef.current = false;
      }, 220);
    }, [onFocusChange]);

    useImperativeHandle(ref, () => ({ dismiss }), [dismiss]);

    const showPanel = focused;
    const trimmed = value.trim();

    const pickCategory = (category: string) => {
      onChangeText(category);
    };

    const pickProfessional = (professional: MarketplaceProfessional) => {
      dismiss();
      onChangeText(professional.name);
      onSelectProfessional(professional);
    };

    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: spacing.md,
          right: spacing.md,
          zIndex: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: theme.colors.surface,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            minHeight: 48,
            borderWidth: focused ? 2 : 0,
            borderColor: focused ? theme.colors.primary : 'transparent',
            ...theme.shadow.sm,
          }}
        >
          <Icon name="search-outline" size={20} color={theme.colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            onFocus={() => {
              setFocused(true);
              onFocusChange?.(true);
            }}
            onBlur={() => {
              if (dismissingRef.current) return;
              setTimeout(() => {
                if (dismissingRef.current) return;
                setFocused(false);
                onFocusChange?.(false);
              }, 120);
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={{ flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: spacing.sm }}
          />
          {trimmed.length > 0 ? (
            <Pressable
              onPress={() => onChangeText('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <Icon name="close-circle" size={20} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
          {focused ? (
            <Pressable onPress={dismiss} hitSlop={8}>
              <Text variant="caption" color="primary" weight="600">
                {cancelLabel}
              </Text>
            </Pressable>
          ) : onFilterPress ? (
            <Pressable onPress={onFilterPress} hitSlop={8}>
              <Icon name="options-outline" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {showPanel ? (
          <View
            style={{
              marginTop: spacing.sm,
              backgroundColor: theme.colors.surface,
              borderRadius: radius.lg,
              padding: spacing.md,
              maxHeight: 420,
              ...theme.shadow.sm,
            }}
          >
            {!trimmed ? (
              <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
                {hint}
              </Text>
            ) : (
              <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
                {filteredCount > 0
                  ? resultsCountLabel.replace('{{count}}', String(filteredCount))
                  : noMatchLabel}
              </Text>
            )}

            <Text variant="label" weight="600" style={{ marginBottom: spacing.xs }}>
              {popularLabel}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.sm }}
              keyboardShouldPersistTaps="handled"
            >
              {categories.map((category) => {
                const active = trimmed.toLowerCase() === category.toLowerCase();
                return (
                  <Pressable
                    key={category}
                    onPress={() => pickCategory(category)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radius.pill,
                      backgroundColor: active ? theme.colors.primary : theme.colors.background,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ color: active ? theme.colors.onPrimary : theme.colors.textSecondary }}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text variant="label" weight="600" style={{ marginBottom: spacing.xs }}>
              {suggestionsTitle}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 260 }}>
              {suggestions.length === 0 ? (
                <Text variant="caption" color="textMuted">
                  {noMatchLabel}
                </Text>
              ) : (
                suggestions.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => pickProfessional(p)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="person-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{p.name}</Text>
                      <Text variant="caption" color="textSecondary">
                        {p.profession} · ${p.priceFrom}/hr · {p.distanceKm.toFixed(1)} km
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  },
);
