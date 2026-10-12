import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  ClinicalTheme,
  TOUCH_TARGETS,
  SPACING,
  RADIUS,
  INTERACTION,
  ELEVATION,
  getButtonVariant,
} from '../theme/clinicalTheme';
import { useLanguage } from '../i18n/LanguageContext';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  variant?: 'primary' | 'cobalt' | 'teal' | 'danger';
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  variant = 'primary',
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const isInactive = disabled || loading;
  const variantColors = getButtonVariant(variant);

  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        { backgroundColor: variantColors.backgroundColor },
        isInactive && styles.disabledPrimaryButton,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={INTERACTION.pressOpacity}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={ClinicalTheme.colors.textWhite} size="small" />
      ) : (
        <Text
          style={[
            styles.primaryButtonText,
            isHindi && styles.buttonTextHindi,
            textStyle,
          ]}
        >
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const isInactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.secondaryButton,
        isInactive && styles.disabledSecondaryButton,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={INTERACTION.pressOpacity}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={ClinicalTheme.colors.textSecondary} size="small" />
      ) : (
        <Text
          style={[
            styles.secondaryButtonText,
            isHindi && styles.buttonTextHindi,
            textStyle,
          ]}
        >
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    minHeight: TOUCH_TARGETS.primaryActionHeight,
    borderRadius: RADIUS.md + 2, // 10dp
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClinicalTheme.shadows.card,
  },
  primaryButtonText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: ClinicalTheme.typography.button.fontSize,
    lineHeight: ClinicalTheme.typography.button.lineHeight,
    fontWeight: ClinicalTheme.typography.button.fontWeight,
    letterSpacing: ClinicalTheme.typography.button.letterSpacing,
  },
  secondaryButton: {
    minHeight: TOUCH_TARGETS.secondaryButtonHeight,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md + 2,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: ClinicalTheme.colors.textPrimary,
    fontSize: ClinicalTheme.typography.button.fontSize,
    lineHeight: ClinicalTheme.typography.button.lineHeight,
    fontWeight: ClinicalTheme.typography.button.fontWeight,
    letterSpacing: ClinicalTheme.typography.button.letterSpacing,
  },
  buttonTextHindi: {
    lineHeight: ClinicalTheme.typographyHindi.button.lineHeight, // 25px
  },
  disabledPrimaryButton: {
    backgroundColor: ClinicalTheme.colors.disabledBg,
    borderColor: ClinicalTheme.colors.disabledBorder,
    opacity: 0.65,
    elevation: ELEVATION.none,
  },
  disabledSecondaryButton: {
    backgroundColor: ClinicalTheme.colors.disabledBg,
    borderColor: ClinicalTheme.colors.disabledBorder,
    opacity: 0.65,
  },
});
