import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type Props = {
  label: string;
  hint?: string;
  /** Lighting / quality advice shown under the upload area. */
  qualityTip?: string;
  imageUri?: string | null;
  onPick: (uri: string, fileName: string, mimeType: string) => void;
  loading?: boolean;
  disabled?: boolean;
  /** Front camera for selfies; back camera for ID documents. */
  cameraType?: ImagePicker.CameraType;
};

export async function pickImage(
  cameraType: ImagePicker.CameraType = ImagePicker.CameraType.front,
): Promise<{ uri: string; fileName: string; mimeType: string } | null> {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  if (cameraPermission.granted) {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      cameraType,
    });
    if (result.canceled) return null;
    if (result.assets[0]) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      };
    }
  }

  const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!library.granted) return null;

  const fromLibrary = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  if (fromLibrary.canceled || !fromLibrary.assets[0]) return null;
  const asset = fromLibrary.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

export function ImageUploadField({
  label,
  hint,
  qualityTip,
  imageUri,
  onPick,
  loading,
  disabled,
  cameraType,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const tip = qualityTip ?? t('registerFlow.photoQualityTip');

  const handlePress = async () => {
    if (disabled) return;
    const picked = await pickImage(cameraType ?? ImagePicker.CameraType.front);
    if (picked) {
      onPick(picked.uri, picked.fileName, picked.mimeType);
      return;
    }
    Alert.alert(t('registerFlow.cameraDeniedTitle'), t('registerFlow.cameraDeniedBody'));
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="caption" color="textSecondary" weight="600">
        {label}
      </Text>
      <Pressable
        onPress={handlePress}
        disabled={loading || disabled}
        style={{
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: theme.colors.border,
          borderRadius: radius.lg,
          padding: spacing.xl,
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: theme.colors.surface,
          opacity: loading || disabled ? 0.5 : 1,
        }}
      >
        <Icon name={imageUri ? 'checkmark-circle' : 'camera-outline'} size={32} color={theme.colors.primary} />
        <Text variant="body" center color="textSecondary">
          {imageUri ? label : hint ?? label}
        </Text>
      </Pressable>
      {!disabled && (
        <Text variant="caption" color="textMuted" center style={{ lineHeight: 18 }}>
          {tip}
        </Text>
      )}
    </View>
  );
}
