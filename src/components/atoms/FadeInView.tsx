import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export interface FadeInViewProps {
  children: ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  direction?: 'up' | 'down';
  style?: ViewStyle;
}

/** Staggered entrance animation for mobile screens. */
export function FadeInView({ children, delay = 0, direction = 'up', style }: FadeInViewProps) {
  const entering =
    direction === 'down'
      ? FadeInDown.delay(delay).duration(420).springify().damping(18)
      : FadeInUp.delay(delay).duration(420).springify().damping(18);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
