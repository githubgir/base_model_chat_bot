/**
 * Global Styles for Chat Bot App
 * 
 * Common reusable styles that can be used across all components
 * for consistency and maintainability.
 */

import { StyleSheet } from 'react-native';
import theme from './theme';

const { colors, typography, spacing, borderRadius, shadows, layout } = theme;

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  containerPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.responsive.md,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: layout.safeArea.top,
    paddingBottom: layout.safeArea.bottom,
  },
  
  // Layout styles
  row: {
    flexDirection: 'row',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  spaceAround: {
    justifyContent: 'space-around',
  },
  
  alignCenter: {
    alignItems: 'center',
  },
  
  alignStart: {
    alignItems: 'flex-start',
  },
  
  alignEnd: {
    alignItems: 'flex-end',
  },
  
  flex1: {
    flex: 1,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    ...shadows.md,
    padding: spacing.responsive.md,
    marginBottom: spacing.responsive.md,
  },
  
  cardFlat: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.responsive.md,
    marginBottom: spacing.responsive.md,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.responsive.sm,
  },
  
  // Button styles
  button: {
    height: theme.dimensions.buttonHeight.md,
    borderRadius: borderRadius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.responsive.lg,
    ...shadows.sm,
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  
  buttonWarning: {
    backgroundColor: colors.warning,
  },
  
  buttonError: {
    backgroundColor: colors.error,
  },
  
  buttonDisabled: {
    backgroundColor: colors.gray[300],
    opacity: 0.6,
  },
  
  buttonSmall: {
    height: theme.dimensions.buttonHeight.sm,
    paddingHorizontal: spacing.responsive.md,
  },
  
  buttonLarge: {
    height: theme.dimensions.buttonHeight.lg,
    paddingHorizontal: spacing.responsive.xl,
  },
  
  // Button text styles
  buttonText: {
    ...typography.styles.button,
    color: colors.white,
  },
  
  buttonTextSecondary: {
    ...typography.styles.button,
    color: colors.primary,
  },
  
  buttonTextDisabled: {
    ...typography.styles.button,
    color: colors.gray[500],
  },
  
  // Input styles
  input: {
    height: theme.dimensions.inputHeight.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.responsive.md,
    backgroundColor: colors.white,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: colors.error,
  },
  
  inputMultiline: {
    minHeight: theme.dimensions.inputHeight.lg,
    paddingVertical: spacing.responsive.sm,
    textAlignVertical: 'top',
  },
  
  // Text styles
  textHeading1: typography.styles.h1,
  textHeading2: typography.styles.h2,
  textHeading3: typography.styles.h3,
  textHeading4: typography.styles.h4,
  textBody: typography.styles.body,
  textBodySmall: typography.styles.bodySmall,
  textCaption: typography.styles.caption,
  textCode: typography.styles.code,
  
  textPrimary: {
    color: colors.text,
  },
  
  textSecondary: {
    color: colors.textSecondary,
  },
  
  textTertiary: {
    color: colors.textTertiary,
  },
  
  textWhite: {
    color: colors.white,
  },
  
  textSuccess: {
    color: colors.success,
  },
  
  textWarning: {
    color: colors.warning,
  },
  
  textError: {
    color: colors.error,
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  textLeft: {
    textAlign: 'left',
  },
  
  textRight: {
    textAlign: 'right',
  },
  
  // Spacing utilities
  marginXs: { margin: spacing.responsive.xs },
  marginSm: { margin: spacing.responsive.sm },
  marginMd: { margin: spacing.responsive.md },
  marginLg: { margin: spacing.responsive.lg },
  marginXl: { margin: spacing.responsive.xl },
  
  paddingXs: { padding: spacing.responsive.xs },
  paddingSm: { padding: spacing.responsive.sm },
  paddingMd: { padding: spacing.responsive.md },
  paddingLg: { padding: spacing.responsive.lg },
  paddingXl: { padding: spacing.responsive.xl },
  
  marginTopXs: { marginTop: spacing.responsive.xs },
  marginTopSm: { marginTop: spacing.responsive.sm },
  marginTopMd: { marginTop: spacing.responsive.md },
  marginTopLg: { marginTop: spacing.responsive.lg },
  marginTopXl: { marginTop: spacing.responsive.xl },
  
  marginBottomXs: { marginBottom: spacing.responsive.xs },
  marginBottomSm: { marginBottom: spacing.responsive.sm },
  marginBottomMd: { marginBottom: spacing.responsive.md },
  marginBottomLg: { marginBottom: spacing.responsive.lg },
  marginBottomXl: { marginBottom: spacing.responsive.xl },
  
  marginHorizontalXs: { marginHorizontal: spacing.responsive.xs },
  marginHorizontalSm: { marginHorizontal: spacing.responsive.sm },
  marginHorizontalMd: { marginHorizontal: spacing.responsive.md },
  marginHorizontalLg: { marginHorizontal: spacing.responsive.lg },
  marginHorizontalXl: { marginHorizontal: spacing.responsive.xl },
  
  marginVerticalXs: { marginVertical: spacing.responsive.xs },
  marginVerticalSm: { marginVertical: spacing.responsive.sm },
  marginVerticalMd: { marginVertical: spacing.responsive.md },
  marginVerticalLg: { marginVertical: spacing.responsive.lg },
  marginVerticalXl: { marginVertical: spacing.responsive.xl },
  
  paddingHorizontalXs: { paddingHorizontal: spacing.responsive.xs },
  paddingHorizontalSm: { paddingHorizontal: spacing.responsive.sm },
  paddingHorizontalMd: { paddingHorizontal: spacing.responsive.md },
  paddingHorizontalLg: { paddingHorizontal: spacing.responsive.lg },
  paddingHorizontalXl: { paddingHorizontal: spacing.responsive.xl },
  
  paddingVerticalXs: { paddingVertical: spacing.responsive.xs },
  paddingVerticalSm: { paddingVertical: spacing.responsive.sm },
  paddingVerticalMd: { paddingVertical: spacing.responsive.md },
  paddingVerticalLg: { paddingVertical: spacing.responsive.lg },
  paddingVerticalXl: { paddingVertical: spacing.responsive.xl },
  
  // Shadow utilities
  shadowNone: shadows.none,
  shadowSm: shadows.sm,
  shadowMd: shadows.md,
  shadowLg: shadows.lg,
  shadowXl: shadows.xl,
  
  // Border utilities
  borderNone: { borderWidth: 0 },
  border: { borderWidth: 1, borderColor: colors.border },
  borderLight: { borderWidth: 1, borderColor: colors.borderLight },
  borderDark: { borderWidth: 1, borderColor: colors.borderDark },
  
  borderTop: { borderTopWidth: 1, borderTopColor: colors.border },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  borderLeft: { borderLeftWidth: 1, borderLeftColor: colors.border },
  borderRight: { borderRightWidth: 1, borderRightColor: colors.border },
  
  // Border radius utilities
  roundedNone: { borderRadius: borderRadius.none },
  roundedSm: { borderRadius: borderRadius.sm },
  roundedMd: { borderRadius: borderRadius.md },
  roundedLg: { borderRadius: borderRadius.lg },
  roundedXl: { borderRadius: borderRadius.xl },
  rounded2xl: { borderRadius: borderRadius['2xl'] },
  roundedFull: { borderRadius: borderRadius.full },
  
  // Background utilities
  bgWhite: { backgroundColor: colors.white },
  bgPrimary: { backgroundColor: colors.primary },
  bgSecondary: { backgroundColor: colors.secondary },
  bgSuccess: { backgroundColor: colors.success },
  bgWarning: { backgroundColor: colors.warning },
  bgError: { backgroundColor: colors.error },
  bgGray50: { backgroundColor: colors.gray[50] },
  bgGray100: { backgroundColor: colors.gray[100] },
  bgGray200: { backgroundColor: colors.gray[200] },
  bgTransparent: { backgroundColor: 'transparent' },
  
  // Opacity utilities
  opacity0: { opacity: 0 },
  opacity25: { opacity: 0.25 },
  opacity50: { opacity: 0.5 },
  opacity75: { opacity: 0.75 },
  opacity100: { opacity: 1 },
  
  // Position utilities
  absolute: { position: 'absolute' },
  relative: { position: 'relative' },
  
  // Loading and state styles
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.responsive.lg,
  },
  
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.responsive.md,
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.responsive.lg,
  },
  
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.modal,
    width: theme.dimensions.modalWidth,
    maxWidth: theme.dimensions.modalMaxWidth,
    maxHeight: '80%',
    ...shadows.xl,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.responsive.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  modalTitle: {
    ...typography.styles.h3,
    color: colors.text,
  },
  
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalBody: {
    padding: spacing.responsive.lg,
  },
  
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.responsive.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  
  // List styles
  listItem: {
    paddingVertical: spacing.responsive.md,
    paddingHorizontal: spacing.responsive.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  
  listItemLast: {
    borderBottomWidth: 0,
  },
  
  // Divider styles
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.responsive.md,
  },
  
  dividerThick: {
    height: 2,
    backgroundColor: colors.borderDark,
    marginVertical: spacing.responsive.lg,
  },
  
  // Badge styles
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.responsive.sm,
    paddingVertical: spacing.responsive.xs,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  badgeText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  
  // Accessibility utilities
  accessibilityFocus: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  
  // Chat-specific styles
  chatMessage: {
    maxWidth: '80%',
    padding: spacing.responsive.md,
    marginVertical: spacing.responsive.sm,
    borderRadius: borderRadius.lg,
  },
  
  chatMessageUser: {
    backgroundColor: colors.userMessage,
    alignSelf: 'flex-end',
  },
  
  chatMessageAI: {
    backgroundColor: colors.aiMessage,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  chatMessageText: {
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.normal,
  },
  
  chatMessageTextUser: {
    color: colors.white,
  },
  
  chatMessageTextAI: {
    color: colors.text,
  },
  
  // Form styles
  formField: {
    marginBottom: spacing.responsive.lg,
  },
  
  formLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.responsive.xs,
  },
  
  formFieldError: {
    borderColor: colors.error,
  },
  
  formErrorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.responsive.xs,
  },
  
  formHelperText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.responsive.xs,
  },
});

export default globalStyles;