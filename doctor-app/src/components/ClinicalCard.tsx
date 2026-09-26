import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';

interface ClinicalCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'elevated' | 'muted' | 'accentBorder';
  borderColor?: string;
  padding?: number;
}

export const ClinicalCard: React.FC<ClinicalCardProps> = ({
  children,
  style,
  variant = 'default',
  borderColor,
  padding = ClinicalTheme.spacing.lg,
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'muted' && styles.muted,
        variant === 'accentBorder' && styles.accentBorder,
        { padding },
        borderColor ? { borderColor } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: ClinicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.card,
  },
  elevated: {
    ...ClinicalTheme.shadows.elevated,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  muted: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderColor: ClinicalTheme.colors.border,
  },
  accentBorder: {
    borderLeftWidth: 4,
    borderLeftColor: ClinicalTheme.colors.primaryAccent,
  },
});
