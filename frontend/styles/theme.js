/**
 * Comprehensive Theme System for Chat Bot App
 * 
 * This file defines the complete design system including colors, typography,
 * spacing, breakpoints, and responsive utilities for consistent UI across
 * all components and screen sizes.
 */

import { Dimensions, Platform } from 'react-native';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints for responsive design
export const breakpoints = {
  small: 360,    // Small phones
  medium: 768,   // Tablets
  large: 1024,   // Desktop/large tablets
  xlarge: 1440,  // Large desktop
};

// Device type detection
export const deviceType = {
  isSmall: screenWidth < breakpoints.small,
  isMedium: screenWidth >= breakpoints.small && screenWidth < breakpoints.medium,
  isLarge: screenWidth >= breakpoints.medium && screenWidth < breakpoints.large,
  isXLarge: screenWidth >= breakpoints.large,
  isTablet: screenWidth >= breakpoints.medium,
  isDesktop: screenWidth >= breakpoints.large,
};

// Platform-specific utilities
export const platform = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
  select: Platform.select,
};

// Color palette
export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#4DA6FF',
  primaryDark: '#0056CC',
  primaryBackground: '#F0F8FF',
  
  // Secondary colors
  secondary: '#5AC8FA',
  secondaryLight: '#8ED7FB',
  secondaryDark: '#2E9BF5',
  
  // Accent colors
  accent: '#FF9500',
  accentLight: '#FFB84D',
  accentDark: '#CC7700',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9F9F9',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Semantic colors
  success: '#28A745',
  successLight: '#4CBB69',
  successDark: '#1E7E34',
  successBackground: '#D4F6DD',
  
  warning: '#FFC107',
  warningLight: '#FFCD38',
  warningDark: '#E6AC00',
  warningBackground: '#FFF3CD',
  
  error: '#DC3545',
  errorLight: '#E45A6A',
  errorDark: '#B52D3A',
  errorBackground: '#F8D7DA',
  
  info: '#17A2B8',
  infoLight: '#45B7CC',
  infoDark: '#138496',
  infoBackground: '#D1F2F8',
  
  // Chat-specific colors
  userMessage: '#007AFF',
  aiMessage: '#FFFFFF',
  chatBackground: '#F5F5F5',
  
  // Voice-specific colors
  voiceActive: '#FF4444',
  voiceInactive: '#007AFF',
  voiceTranscribing: '#FF9500',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F5F5F5',
  
  // Border colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#BDBDBD',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textLight: '#CCCCCC',
  textInverted: '#FFFFFF',
  
  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
  },
};

// Typography system
export const typography = {
  // Font families
  fonts: {
    regular: platform.select({
      ios: 'System',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }),
    medium: platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }),
    bold: platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }),
    monospace: platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    }),
  },
  
  // Font sizes (responsive)
  sizes: {
    xs: deviceType.isSmall ? 10 : 12,
    sm: deviceType.isSmall ? 12 : 14,
    md: deviceType.isSmall ? 14 : 16,
    lg: deviceType.isSmall ? 16 : 18,
    xl: deviceType.isSmall ? 18 : 20,
    '2xl': deviceType.isSmall ? 20 : 24,
    '3xl': deviceType.isSmall ? 24 : 30,
    '4xl': deviceType.isSmall ? 30 : 36,
    '5xl': deviceType.isSmall ? 36 : 48,
    '6xl': deviceType.isSmall ? 48 : 60,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  weights: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  
  // Text styles
  styles: {
    h1: {
      fontSize: deviceType.isSmall ? 24 : 32,
      fontWeight: '700',
      lineHeight: 1.2,
      color: colors.text,
    },
    h2: {
      fontSize: deviceType.isSmall ? 20 : 24,
      fontWeight: '600',
      lineHeight: 1.3,
      color: colors.text,
    },
    h3: {
      fontSize: deviceType.isSmall ? 18 : 20,
      fontWeight: '600',
      lineHeight: 1.4,
      color: colors.text,
    },
    h4: {
      fontSize: deviceType.isSmall ? 16 : 18,
      fontWeight: '600',
      lineHeight: 1.4,
      color: colors.text,
    },
    body: {
      fontSize: deviceType.isSmall ? 14 : 16,
      fontWeight: '400',
      lineHeight: 1.5,
      color: colors.text,
    },
    bodySmall: {
      fontSize: deviceType.isSmall ? 12 : 14,
      fontWeight: '400',
      lineHeight: 1.5,
      color: colors.textSecondary,
    },
    caption: {
      fontSize: deviceType.isSmall ? 10 : 12,
      fontWeight: '400',
      lineHeight: 1.4,
      color: colors.textTertiary,
    },
    button: {
      fontSize: deviceType.isSmall ? 14 : 16,
      fontWeight: '600',
      lineHeight: 1.2,
    },
    code: {
      fontSize: deviceType.isSmall ? 12 : 14,
      fontFamily: typography.fonts.monospace,
      lineHeight: 1.4,
      color: colors.text,
    },
  },
};

// Spacing system (8px base grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  
  // Responsive spacing
  responsive: {
    xs: deviceType.isSmall ? 2 : 4,
    sm: deviceType.isSmall ? 4 : 8,
    md: deviceType.isSmall ? 8 : 16,
    lg: deviceType.isSmall ? 16 : 24,
    xl: deviceType.isSmall ? 24 : 32,
    '2xl': deviceType.isSmall ? 32 : 48,
  },
};

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
  
  // Component-specific radius
  button: 8,
  card: 12,
  modal: 16,
  input: 8,
  pill: 9999,
};

// Shadow system
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
};

// Component dimensions
export const dimensions = {
  // Button heights
  buttonHeight: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  },
  
  // Input heights
  inputHeight: {
    sm: 32,
    md: 40,
    lg: 48,
  },
  
  // Icon sizes
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  
  // Voice button sizes
  voiceButton: {
    sm: 50,
    md: 65,
    lg: 80,
  },
  
  // Header heights
  headerHeight: deviceType.isSmall ? 56 : 64,
  
  // Tab bar height
  tabBarHeight: deviceType.isSmall ? 60 : 70,
  
  // Modal dimensions
  modalWidth: deviceType.isTablet ? '70%' : '90%',
  modalMaxWidth: 500,
};

// Animation timing
export const animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Responsive utilities
export const responsive = {
  // Get responsive value based on screen size
  getValue: (values) => {
    if (typeof values === 'object' && values !== null) {
      if (deviceType.isXLarge && values.xlarge !== undefined) return values.xlarge;
      if (deviceType.isLarge && values.large !== undefined) return values.large;
      if (deviceType.isMedium && values.medium !== undefined) return values.medium;
      if (deviceType.isSmall && values.small !== undefined) return values.small;
      return values.default || values;
    }
    return values;
  },
  
  // Media query-like conditions
  when: {
    small: (styles) => deviceType.isSmall ? styles : {},
    medium: (styles) => deviceType.isMedium ? styles : {},
    large: (styles) => deviceType.isLarge ? styles : {},
    xlarge: (styles) => deviceType.isXLarge ? styles : {},
    tablet: (styles) => deviceType.isTablet ? styles : {},
    desktop: (styles) => deviceType.isDesktop ? styles : {},
  },
  
  // Responsive dimensions
  dimensions: {
    width: screenWidth,
    height: screenHeight,
    isLandscape: screenWidth > screenHeight,
    isPortrait: screenHeight > screenWidth,
  },
};

// Layout utilities
export const layout = {
  // Safe area insets (approximate)
  safeArea: {
    top: platform.isIOS ? 44 : 0,
    bottom: platform.isIOS ? 34 : 0,
    left: 0,
    right: 0,
  },
  
  // Common flex styles
  flex: {
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
    },
    column: {
      flexDirection: 'column',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },
    spaceAround: {
      justifyContent: 'space-around',
    },
    spaceEvenly: {
      justifyContent: 'space-evenly',
    },
  },
  
  // Container styles
  container: {
    flex: 1,
    padding: spacing.responsive.md,
    backgroundColor: colors.background,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    ...shadows.md,
    padding: spacing.responsive.md,
    marginBottom: spacing.responsive.md,
  },
};

// Component-specific theme presets
export const components = {
  // Button themes
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color: colors.white,
    },
    secondary: {
      backgroundColor: colors.white,
      borderColor: colors.primary,
      color: colors.primary,
    },
    success: {
      backgroundColor: colors.success,
      borderColor: colors.success,
      color: colors.white,
    },
    warning: {
      backgroundColor: colors.warning,
      borderColor: colors.warning,
      color: colors.white,
    },
    error: {
      backgroundColor: colors.error,
      borderColor: colors.error,
      color: colors.white,
    },
  },
  
  // Input themes
  input: {
    default: {
      backgroundColor: colors.white,
      borderColor: colors.border,
      color: colors.text,
    },
    focused: {
      borderColor: colors.primary,
    },
    error: {
      borderColor: colors.error,
    },
  },
  
  // Modal themes
  modal: {
    default: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.modal,
      ...shadows.xl,
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
  },
};

// Export complete theme object
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  dimensions,
  animations,
  responsive,
  layout,
  components,
  breakpoints,
  deviceType,
  platform,
};