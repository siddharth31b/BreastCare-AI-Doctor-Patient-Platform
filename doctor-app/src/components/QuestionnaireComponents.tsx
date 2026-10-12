import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import {
  ClinicalTheme,
  TOUCH_TARGETS,
  SPACING,
  RADIUS,
  ELEVATION,
  INTERACTION,
} from '../theme/clinicalTheme';
import { useLanguage } from '../i18n/LanguageContext';

export interface ClinicalOptionProps {
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
  const { language } = useLanguage();
  const isHindi = language === 'hi';

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
        variant === 'urgent' && styles.optionUrgent,
        disabled && styles.optionDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={INTERACTION.pressOpacity}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${formattedIndex ? `${formattedIndex}. ` : ''}${label}`}
    >
      <View style={styles.contentRow}>
        {formattedIndex !== undefined && (
          <View style={[styles.indexBadge, selected && styles.indexBadgeSelected]}>
            <Text style={[styles.indexBadgeText, selected && styles.indexBadgeTextSelected]}>
              {formattedIndex}
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.optionText,
            selected && styles.optionTextSelected,
            isHindi && styles.optionTextHindi,
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
};

export interface ClinicalCheckboxProps {
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
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <TouchableOpacity
      style={[
        styles.checkboxContainer,
        checked && styles.checkboxActive,
        disabled && styles.optionDisabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={INTERACTION.pressOpacity}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text
        style={[
          styles.checkboxLabel,
          checked && styles.checkboxLabelActive,
          isHindi && styles.checkboxLabelHindi,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export interface ProgressIndicatorProps {
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
    <View
      style={styles.progressCard}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      accessibilityLabel={`${phaseTitle}. ${stepText || ''}`}
    >
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
    minHeight: TOUCH_TARGETS.optionRow, // 58dp
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderDefault,
    borderRadius: RADIUS.md + 2, // 10dp
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    ...ClinicalTheme.shadows.card,
  },
  optionSelected: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.borderFocus,
    borderWidth: 2,
  },
  optionSuccess: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderColor: ClinicalTheme.colors.riskLow,
  },
  optionUrgent: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderColor: ClinicalTheme.colors.riskUrgent,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: SPACING.md,
    gap: SPACING.md,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: ClinicalTheme.colors.bgMuted,
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
    lineHeight: 23,
    fontWeight: '600',
    color: ClinicalTheme.colors.textPrimary,
    flex: 1,
  },
  optionTextHindi: {
    lineHeight: ClinicalTheme.typographyHindi.body.lineHeight, // 25px
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
    minHeight: TOUCH_TARGETS.checkboxRow, // 58dp
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderDefault,
    borderRadius: RADIUS.md + 2,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...ClinicalTheme.shadows.card,
  },
  checkboxActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.borderFocus,
    borderWidth: 2,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.xs + 2,
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
    lineHeight: 23,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  checkboxLabelHindi: {
    lineHeight: ClinicalTheme.typographyHindi.body.lineHeight, // 25px
  },
  checkboxLabelActive: {
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.md + 2,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    ...ClinicalTheme.shadows.card,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  phaseTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: ClinicalTheme.colors.primary,
    letterSpacing: 0.3,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: 3,
  },
});
