/**
 * Responsive Hooks for React Native
 * 
 * Custom hooks for handling responsive design, screen dimensions,
 * and device-specific styling in React Native applications.
 */

import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import theme from '../styles/theme';

const { breakpoints } = theme;

/**
 * Hook for screen dimensions and responsive breakpoints
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  const deviceType = {
    isSmall: width < breakpoints.small,
    isMedium: width >= breakpoints.small && width < breakpoints.medium,
    isLarge: width >= breakpoints.medium && width < breakpoints.large,
    isXLarge: width >= breakpoints.large,
    isTablet: width >= breakpoints.medium,
    isDesktop: width >= breakpoints.large,
  };

  const orientation = {
    isLandscape: width > height,
    isPortrait: height > width,
  };

  return {
    width,
    height,
    ...deviceType,
    ...orientation,
    breakpoints,
  };
};

/**
 * Hook for responsive values based on screen size
 */
export const useResponsiveValue = (values) => {
  const { isSmall, isMedium, isLarge, isXLarge } = useResponsive();

  if (typeof values === 'object' && values !== null) {
    if (isXLarge && values.xlarge !== undefined) return values.xlarge;
    if (isLarge && values.large !== undefined) return values.large;
    if (isMedium && values.medium !== undefined) return values.medium;
    if (isSmall && values.small !== undefined) return values.small;
    return values.default || values;
  }

  return values;
};

/**
 * Hook for responsive spacing
 */
export const useResponsiveSpacing = () => {
  const { isSmall } = useResponsive();

  return {
    xs: isSmall ? 2 : 4,
    sm: isSmall ? 4 : 8,
    md: isSmall ? 8 : 16,
    lg: isSmall ? 16 : 24,
    xl: isSmall ? 24 : 32,
    '2xl': isSmall ? 32 : 48,
  };
};

/**
 * Hook for responsive typography
 */
export const useResponsiveTypography = () => {
  const { isSmall } = useResponsive();

  return {
    sizes: {
      xs: isSmall ? 10 : 12,
      sm: isSmall ? 12 : 14,
      md: isSmall ? 14 : 16,
      lg: isSmall ? 16 : 18,
      xl: isSmall ? 18 : 20,
      '2xl': isSmall ? 20 : 24,
      '3xl': isSmall ? 24 : 30,
      '4xl': isSmall ? 30 : 36,
    },
    styles: {
      h1: {
        fontSize: isSmall ? 24 : 32,
        fontWeight: '700',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: isSmall ? 20 : 24,
        fontWeight: '600',
        lineHeight: 1.3,
      },
      h3: {
        fontSize: isSmall ? 18 : 20,
        fontWeight: '600',
        lineHeight: 1.4,
      },
      body: {
        fontSize: isSmall ? 14 : 16,
        fontWeight: '400',
        lineHeight: 1.5,
      },
      caption: {
        fontSize: isSmall ? 10 : 12,
        fontWeight: '400',
        lineHeight: 1.4,
      },
    },
  };
};

/**
 * Hook for responsive component dimensions
 */
export const useResponsiveDimensions = () => {
  const { isSmall, isTablet } = useResponsive();

  return {
    buttonHeight: {
      sm: isSmall ? 28 : 32,
      md: isSmall ? 36 : 40,
      lg: isSmall ? 44 : 48,
      xl: isSmall ? 52 : 56,
    },
    inputHeight: {
      sm: isSmall ? 28 : 32,
      md: isSmall ? 36 : 40,
      lg: isSmall ? 44 : 48,
    },
    iconSize: {
      xs: isSmall ? 10 : 12,
      sm: isSmall ? 14 : 16,
      md: isSmall ? 18 : 20,
      lg: isSmall ? 22 : 24,
      xl: isSmall ? 28 : 32,
    },
    headerHeight: isSmall ? 56 : 64,
    tabBarHeight: isSmall ? 60 : 70,
    modalWidth: isTablet ? '70%' : '90%',
    modalMaxWidth: 500,
  };
};

/**
 * Hook for responsive style utilities
 */
export const useResponsiveStyles = () => {
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const dimensions = useResponsiveDimensions();
  const { isSmall, isTablet, isDesktop } = useResponsive();

  const getStyle = (styleMap) => {
    if (isDesktop && styleMap.desktop) return styleMap.desktop;
    if (isTablet && styleMap.tablet) return styleMap.tablet;
    if (isSmall && styleMap.mobile) return styleMap.mobile;
    return styleMap.default || {};
  };

  return {
    spacing,
    typography,
    dimensions,
    getStyle,
    isSmall,
    isTablet,
    isDesktop,
  };
};

/**
 * Hook for device-specific platform utilities
 */
export const usePlatform = () => {
  const { Platform } = require('react-native');
  
  return {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isWeb: Platform.OS === 'web',
    select: Platform.select,
    version: Platform.Version,
  };
};

/**
 * Hook for safe area dimensions
 */
export const useSafeArea = () => {
  const { isIOS } = usePlatform();
  const { height, isLandscape } = useResponsive();

  // Approximate safe area insets
  const safeAreaInsets = {
    top: isIOS ? (height >= 812 ? 44 : 20) : 0,
    bottom: isIOS ? (height >= 812 ? (isLandscape ? 21 : 34) : 0) : 0,
    left: isIOS && isLandscape && height >= 812 ? 44 : 0,
    right: isIOS && isLandscape && height >= 812 ? 44 : 0,
  };

  return safeAreaInsets;
};

/**
 * Hook for responsive grid layouts
 */
export const useResponsiveGrid = (itemWidth, spacing = 16) => {
  const { width } = useResponsive();
  
  const columns = Math.floor((width - spacing) / (itemWidth + spacing));
  const actualItemWidth = (width - spacing * (columns + 1)) / columns;
  
  return {
    columns,
    itemWidth: actualItemWidth,
    spacing,
  };
};

/**
 * Hook for responsive font scaling
 */
export const useResponsiveFontScale = () => {
  const { isSmall, isTablet } = useResponsive();
  
  let scale = 1;
  if (isSmall) scale = 0.9;
  if (isTablet) scale = 1.1;
  
  return {
    scale,
    scaleSize: (size) => size * scale,
  };
};

/**
 * Hook for responsive media queries
 */
export const useMediaQuery = () => {
  const responsive = useResponsive();
  
  return {
    ...responsive,
    matchesQuery: (query) => {
      switch (query) {
        case 'small':
          return responsive.isSmall;
        case 'medium':
          return responsive.isMedium;
        case 'large':
          return responsive.isLarge;
        case 'xlarge':
          return responsive.isXLarge;
        case 'tablet':
          return responsive.isTablet;
        case 'desktop':
          return responsive.isDesktop;
        case 'landscape':
          return responsive.isLandscape;
        case 'portrait':
          return responsive.isPortrait;
        default:
          return false;
      }
    },
  };
};

/**
 * Hook for responsive container dimensions
 */
export const useResponsiveContainer = (maxWidth = null) => {
  const { width, isTablet, isDesktop } = useResponsive();
  
  let containerWidth = width;
  
  if (maxWidth) {
    containerWidth = Math.min(width, maxWidth);
  } else if (isDesktop) {
    containerWidth = Math.min(width, 1200);
  } else if (isTablet) {
    containerWidth = Math.min(width, 800);
  }
  
  const paddingHorizontal = isDesktop ? 32 : isTablet ? 24 : 16;
  
  return {
    width: containerWidth,
    maxWidth: maxWidth,
    paddingHorizontal,
    marginHorizontal: (width - containerWidth) / 2,
  };
};

/**
 * Hook for responsive component variants
 */
export const useResponsiveVariant = (variants) => {
  const { isSmall, isTablet, isDesktop } = useResponsive();
  
  if (isDesktop && variants.desktop) return variants.desktop;
  if (isTablet && variants.tablet) return variants.tablet;
  if (isSmall && variants.mobile) return variants.mobile;
  return variants.default || variants;
};

export default {
  useResponsive,
  useResponsiveValue,
  useResponsiveSpacing,
  useResponsiveTypography,
  useResponsiveDimensions,
  useResponsiveStyles,
  usePlatform,
  useSafeArea,
  useResponsiveGrid,
  useResponsiveFontScale,
  useMediaQuery,
  useResponsiveContainer,
  useResponsiveVariant,
};