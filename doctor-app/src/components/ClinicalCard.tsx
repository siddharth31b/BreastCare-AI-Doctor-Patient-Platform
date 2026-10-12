import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, AccessibilityRole } from 'react-native';
import { ClinicalTheme, SPACING, RADIUS, ELEVATION, INTERACTION, ACCESSIBILITY } from '../theme/clinicalTheme';

export interface ClinicalCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'elevated' | 'muted' | 'accentBorder' | 'interactive' | 'outlined' | 'selected';
  borderColor?: string;
  padding?: number;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

export const ClinicalCard: React.FC<ClinicalCardProps> = ({
  children,
  style,
  variant = 'default',
  borderColor,
  padding = SPACING.lg,
  onPress,
  selected = false,
  disabled = false,
  accessibilityLabel,
  accessibilityRole,
}) => {
  const isInteractive = Boolean(onPress) || variant === 'interactive';
  const isSelected = selected || variant === 'selected';

  const cardStyle = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'muted' && styles.muted,
    variant === 'accentBorder' && styles.accentBorder,
    variant === 'outlined' && styles.outlined,
    isSelected && styles.selected,
    { padding },
    borderColor ? { borderColor } : null,
    style,
  ];

  if (isInteractive && onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={INTERACTION.pressOpacity}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: isSelected, disabled }}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  elevated: {
    ...ClinicalTheme.shadows.elevated,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  muted: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderColor: ClinicalTheme.colors.borderDefault,
    elevation: ELEVATION.none,
  },
  accentBorder: {
    borderLeftWidth: 4,
    borderLeftColor: ClinicalTheme.colors.primaryAccent,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: ClinicalTheme.colors.borderMedium,
    elevation: ELEVATION.none,
  },
  selected: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.borderFocus,
    borderWidth: 1.5,
  },
});
