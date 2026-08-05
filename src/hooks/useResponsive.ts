/**
 * Responsive layout hook — adapts UI between mobile and web/desktop
 */

import { useWindowDimensions, Platform } from 'react-native';

export const SIDEBAR_WIDTH = 260;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  /** Number of columns for listing grids */
  gridColumns: number;
  /** Content max-width for centering on large screens */
  contentMaxWidth: number;
  /** Whether to show sidebar nav instead of bottom tabs */
  useSidebarNav: boolean;
  /** Left margin to offset for the fixed sidebar (0 on mobile) */
  sidebarOffset: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  let breakpoint: Breakpoint = 'mobile';
  if (width >= 1024) breakpoint = 'desktop';
  else if (width >= 768) breakpoint = 'tablet';

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';

  // Grid columns: 2 on mobile, 3 on tablet, 4 on desktop
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;

  // Sidebar nav on tablet+ web
  const useSidebarNav = isWeb && (isTablet || isDesktop);

  // Available content width after sidebar
  const availableWidth = useSidebarNav ? width - SIDEBAR_WIDTH : width;

  // Max content width for centering
  const contentMaxWidth = isDesktop ? 1100 : isTablet ? 700 : availableWidth;

  // Sidebar offset for content
  const sidebarOffset = useSidebarNav ? SIDEBAR_WIDTH : 0;

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    gridColumns,
    contentMaxWidth,
    useSidebarNav,
    sidebarOffset,
  };
}
