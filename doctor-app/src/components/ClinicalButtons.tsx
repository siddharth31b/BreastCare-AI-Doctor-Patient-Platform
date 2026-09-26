import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';

interface ButtonProps {
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
  const isInactive = disabled || loading;

  const getBgColor = () => {
    if (variant === 'cobalt') return ClinicalTheme.colors.primaryAccent;
    if (variant === 'teal') return ClinicalTheme.colors.secondary;
    if (variant === 'danger') return ClinicalTheme.colors.riskUrgent;
    return ClinicalTheme.colors.primary; // Medical deep navy #0A2540
  };

  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        { backgroundColor: getBgColor() },
        isInactive && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={ClinicalTheme.colors.textWhite} size="small" />
      ) : (
        <Text style={[styles.primaryButtonText, textStyle]}>
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
  const isInactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.secondaryButton, isInactive && styles.disabledButton, style]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={ClinicalTheme.colors.textSecondary} size="small" />
      ) : (
        <Text style={[styles.secondaryButtonText, textStyle]}>
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    minHeight: ClinicalTheme.dimensions.buttonHeight,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: ClinicalTheme.spacing.xl,
    paddingVertical: ClinicalTheme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClinicalTheme.shadows.card,
  },
  primaryButtonText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: ClinicalTheme.typography.button.fontSize,
    fontWeight: ClinicalTheme.typography.button.fontWeight,
    letterSpacing: ClinicalTheme.typography.button.letterSpacing,
  },
  secondaryButton: {
    minHeight: ClinicalTheme.dimensions.buttonHeight,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: ClinicalTheme.spacing.xl,
    paddingVertical: ClinicalTheme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: ClinicalTheme.colors.textPrimary,
    fontSize: ClinicalTheme.typography.button.fontSize,
    fontWeight: ClinicalTheme.typography.button.fontWeight,
    letterSpacing: ClinicalTheme.typography.button.letterSpacing,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
