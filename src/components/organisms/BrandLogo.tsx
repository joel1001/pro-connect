import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { APP_NAME } from '@/constants/config';
import { brandColor } from '@/config/roles';
import { spacing } from '@/theme';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  color?: string;
}

export function BrandLogo({ size = 'md', showTagline, color = brandColor }: BrandLogoProps) {
  const { t } = useTranslation();
  const iconSize = size === 'lg' ? 40 : size === 'md' ? 30 : 24;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: iconSize + 10,
          height: iconSize + 10,
          borderRadius: (iconSize + 10) / 3,
          backgroundColor: `${color}1A`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="leaf" size={iconSize} color={color} />
      </View>
      <View>
        <Text variant={size === 'lg' ? 'h2' : 'h3'} style={{ color }}>
          {APP_NAME}
        </Text>
        {showTagline && (
          <Text variant="caption" color="textSecondary">
            {t('brand.tagline')}
          </Text>
        )}
      </View>
    </View>
  );
}
