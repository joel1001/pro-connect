import { Image } from 'expo-image';
import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from './Text';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  accentColor?: string;
}

export function Avatar({ uri, name, size = 44, accentColor }: AvatarProps) {
  const theme = useTheme();
  const initials = (name ?? '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="bodyStrong" style={{ color: theme.colors.primary, fontSize: size * 0.36 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}
