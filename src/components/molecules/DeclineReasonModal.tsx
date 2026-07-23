import { Modal, Pressable, TextInput, View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

interface DeclineReasonModalProps {
  visible: boolean;
  title: string;
  description: string;
  reason: string;
  placeholder: string;
  error?: string;
  cancelLabel: string;
  submitLabel: string;
  loading?: boolean;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function DeclineReasonModal({
  visible,
  title,
  description,
  reason,
  placeholder,
  error,
  cancelLabel,
  submitLabel,
  loading,
  onChangeReason,
  onClose,
  onSubmit,
}: DeclineReasonModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.38)',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: radius.xl,
            padding: spacing.lg,
            gap: spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View style={{ gap: spacing.xs }}>
            <Text variant="h3">{title}</Text>
            <Text variant="body" color="textSecondary">
              {description}
            </Text>
          </View>
          <View style={{ gap: spacing.xs }}>
            <TextInput
              value={reason}
              onChangeText={onChangeReason}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 112,
                borderWidth: 1.5,
                borderColor: error ? theme.colors.danger : theme.colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                fontSize: 15,
                ...(typeof document !== 'undefined' ? { outlineStyle: 'none' as never } : {}),
              }}
            />
            {error ? (
              <Text variant="caption" color="danger">
                {error}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label={cancelLabel} variant="outline" fullWidth={false} onPress={onClose} style={{ flex: 1 }} />
            <Button label={submitLabel} loading={loading} fullWidth={false} onPress={onSubmit} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
