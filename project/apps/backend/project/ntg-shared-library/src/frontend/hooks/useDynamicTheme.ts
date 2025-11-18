import { useMemo } from 'react';
import { useTheme } from './useTheme';
import { generateThemeColors, PRIMARY_COLOR, setPrimaryColor } from '../lib/colorConfig';

/**
 * Configuration for dynamic theme
 */
export interface DynamicThemeConfig {
  /** Custom primary color (optional) */
  primaryColor?: string;
  /** Function to get admin theme settings (optional) */
  getAdminThemeSettings?: () => { primaryColor?: string } | null | undefined;
  /** Function to get public theme settings (optional) */
  getPublicThemeSettings?: () => { primaryColor?: string } | null | undefined;
}

/**
 * Hook that provides dynamic theme colors based on the current theme mode
 * Supports admin-customizable primary colors
 */
export function useDynamicTheme(config?: DynamicThemeConfig) {
  const { isDark, resolvedTheme } = useTheme();
  
  // Use public theme settings first (works for all users), then admin settings, then fall back to config
  const primaryColor = useMemo(() => {
    const publicSettings = config?.getPublicThemeSettings?.();
    const adminSettings = config?.getAdminThemeSettings?.();
    const customColor = publicSettings?.primaryColor || adminSettings?.primaryColor || config?.primaryColor;
    
    if (customColor) {
      // Use the custom color directly, with validation
      const adjustedColor = setPrimaryColor(customColor);
      return adjustedColor;
    }
    return PRIMARY_COLOR;
  }, [config?.primaryColor, config?.getAdminThemeSettings, config?.getPublicThemeSettings]);
  
  // Generate theme colors based on current mode and primary color
  const themeColors = useMemo(() => {
    return generateThemeColors(primaryColor, isDark);
  }, [primaryColor, isDark]);
  
  // Get primary tones for icons and progress bars based on current theme
  const primaryTones = useMemo(() => {
    return [
      themeColors.primaryLight,
      themeColors.primaryDark,
      themeColors.primaryLighter,
      themeColors.primaryDarker,
      themeColors.primaryLightest,
      themeColors.primaryDarkest,
      themeColors.primary,
      themeColors.primaryLight,
    ];
  }, [themeColors]);
  
  // Get a specific primary tone by index (for consistent icon coloring)
  const getPrimaryToneByIndex = (index: number): string => {
    return primaryTones[index % primaryTones.length];
  };
  
  // Get a random primary tone
  const getRandomPrimaryTone = (): string => {
    return primaryTones[Math.floor(Math.random() * primaryTones.length)];
  };
  
  return {
    // Theme colors
    primary: themeColors.primary,
    primaryLight: themeColors.primaryLight,
    primaryLighter: themeColors.primaryLighter,
    primaryLightest: themeColors.primaryLightest,
    primaryDark: themeColors.primaryDark,
    primaryDarker: themeColors.primaryDarker,
    primaryDarkest: themeColors.primaryDarkest,
    
    // Background colors
    background: themeColors.background,
    surface: themeColors.surface,
    surfaceVariant: themeColors.surfaceVariant,
    
    // Text colors
    text: themeColors.text,
    textSecondary: themeColors.textSecondary,
    textMuted: themeColors.textMuted,
    
    // Border colors
    border: themeColors.border,
    borderLight: themeColors.borderLight,
    
    // Primary tones
    primaryTones,
    getPrimaryToneByIndex,
    getRandomPrimaryTone,
    
    // Legacy aliases for backward compatibility
    earthyColors: primaryTones,
    getEarthyColorByIndex: getPrimaryToneByIndex,
    getRandomEarthyColor: getRandomPrimaryTone,
    
    // Theme state
    isDark,
    resolvedTheme,
  };
}

