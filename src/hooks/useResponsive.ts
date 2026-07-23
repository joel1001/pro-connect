import { useWindowDimensions } from 'react-native';

import { breakpoints } from '@/theme';

export interface Responsive {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** True when we should render the web "desktop" shell (sidebar nav). */
  useDesktopLayout: boolean;
}

/**
 * Breakpoint helper. Mobile-first: anything below `tablet` is treated as a
 * phone. From `desktop` up we switch to the web layout (sidebar + wide content).
 */
export function useResponsive(): Responsive {
  const { width } = useWindowDimensions();
  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;
  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    useDesktopLayout: isDesktop,
  };
}
