import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export interface ResponsiveLayoutInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isTablet: boolean;
  isWorkstation: boolean;
  columnLayout: 'two-column' | 'single-column';
  contentPadding: number;
}

/**
 * Centralized responsive layout hook for clinical workstation & portrait reflow.
 * Accurately detects physical rotation on tablet devices (e.g. Lenovo Tab M10 TB-J616X).
 * Memoized to prevent unnecessary re-render churn during orientation changes.
 */
export function useResponsiveLayout(): ResponsiveLayoutInfo {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    // True physical orientation based on current window dimensions
    const isLandscape = width > height;
    const isPortrait = !isLandscape;

    // Tablet breakpoint: smallest dimension is at least 600dp (standard Android sw600dp)
    const isTablet = Math.min(width, height) >= 600;

    // Workstation mode: active when device is in landscape mode on tablet (or wide display)
    const isWorkstation = isLandscape && (isTablet || width >= 900);

    return {
      width,
      height,
      isLandscape,
      isPortrait,
      isTablet,
      isWorkstation,
      columnLayout: isWorkstation ? 'two-column' : 'single-column',
      contentPadding: isLandscape ? 24 : 16,
    };
  }, [width, height]);
}
