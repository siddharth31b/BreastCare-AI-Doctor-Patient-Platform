import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';

interface ClinicalOptionProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'urgent';
  indexBadge?: string | number;
}

export const ClinicalOption: React.FC<ClinicalOptionProps> = ({
  label,
  selected = false,
  onPress,
  disabled = false,
  variant = 'default',
  indexBadge,
}) => {
  const formattedIndex =
    typeof indexBadge === 'number'
      ? indexBadge < 10
        ? `0${indexBadge}`
        : `${indexBadge}`
      : indexBadge;

  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        selected && styles.optionSelected,
        variant === 'success' && styles.optionSuccess,
        disabled && styles.optionDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.contentRow}>
        {formattedIndex !== undefined && (
          <View style={[styles.indexBadge, selected && styles.indexBadgeSelected]}>
            <Text style={[styles.indexBadgeText, selected && styles.indexBadgeTextSelected]}>
              {formattedIndex}
            </Text>
          </View>
        )}
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
          {label}
        </Text>
      </View>
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
};

interface ClinicalCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ClinicalCheckbox: React.FC<ClinicalCheckboxProps> = ({
  label,
  checked,
  onToggle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.checkboxContainer, checked && styles.checkboxActive, disabled && styles.optionDisabled]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface ProgressIndicatorProps {
  phaseTitle: string;
  stepText?: string;
  progressPercent: number; // 0 to 100
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  phaseTitle,
  stepText,
  progressPercent,
}) => {
  const clamped = Math.max(0, Math.min(100, progressPercent));

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressRow}>
        <Text style={styles.phaseTitle}>{phaseTitle}</Text>
        {stepText ? <Text style={styles.stepText}>{stepText}</Text> : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  optionButton: {
    minHeight: ClinicalTheme.dimensions.optionRowHeight,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.border,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: ClinicalTheme.spacing.md + 2,
    paddingVertical: ClinicalTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ClinicalTheme.spacing.sm,
    ...ClinicalTheme.shadows.card,
  },
  optionSelected: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  optionSuccess: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderColor: ClinicalTheme.colors.riskLow,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: ClinicalTheme.spacing.md,
    gap: ClinicalTheme.spacing.md,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexBadgeSelected: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  indexBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.2,
  },
  indexBadgeTextSelected: {
    color: ClinicalTheme.colors.textWhite,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: ClinicalTheme.colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: ClinicalTheme.colors.primaryLight,
    fontWeight: '700',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ClinicalTheme.colors.primaryAccent,
  },
  checkboxContainer: {
    minHeight: ClinicalTheme.dimensions.checkboxRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ClinicalTheme.spacing.md,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.border,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: ClinicalTheme.spacing.md + 2,
    paddingVertical: ClinicalTheme.spacing.md,
    marginBottom: ClinicalTheme.spacing.sm,
    ...ClinicalTheme.shadows.card,
  },
  checkboxActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surface,
  },
  boxChecked: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  checkmark: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 15,
    fontWeight: '900',
  },
  checkboxLabel: {
    fontSize: 16,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  checkboxLabelActive: {
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: ClinicalTheme.radius.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    paddingHorizontal: ClinicalTheme.spacing.lg,
    paddingVertical: ClinicalTheme.spacing.md,
    marginBottom: ClinicalTheme.spacing.lg,
    ...ClinicalTheme.shadows.card,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ClinicalTheme.spacing.sm,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.primary,
    letterSpacing: 0.3,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: 3,
  },
});
