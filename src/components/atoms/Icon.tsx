import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';

import { useTheme } from '@/hooks/useTheme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color }: IconProps) {
  const theme = useTheme();
  return <Ionicons name={name} size={size} color={color ?? theme.colors.text} />;
}
