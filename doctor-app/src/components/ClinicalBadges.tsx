import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { useLanguage } from '../i18n/LanguageContext';

interface RiskBadgeProps {
  tier?: 'Low' | 'Moderate' | 'High' | 'Urgent' | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ tier, label, size = 'md' }) => {
  const { t, language } = useLanguage();

  const getColors = () => {
    switch (tier) {
      case 'Urgent':
        return {
          bg: ClinicalTheme.colors.riskUrgentBg,
          text: ClinicalTheme.colors.riskUrgent,
          border: ClinicalTheme.colors.riskUrgentBorder,
          defaultLabel: t('riskTierUrgent'),
        };
      case 'High':
        return {
          bg: ClinicalTheme.colors.riskHighBg,
          text: ClinicalTheme.colors.riskHigh,
          border: ClinicalTheme.colors.riskHighBorder,
          defaultLabel: t('riskTierHigh'),
        };
      case 'Moderate':
        return {
          bg: ClinicalTheme.colors.riskModerateBg,
          text: ClinicalTheme.colors.riskModerate,
          border: ClinicalTheme.colors.riskModerateBorder,
          defaultLabel: t('riskTierModerate'),
        };
      default:
        return {
          bg: ClinicalTheme.colors.riskLowBg,
          text: ClinicalTheme.colors.riskLow,
          border: ClinicalTheme.colors.riskLowBorder,
          defaultLabel: t('riskTierLow'),
        };
    }
  };

  const c = getColors();

  // If label is passed, translate if it matches standard tier names
  let displayLabel = label || c.defaultLabel;
  if (label && language === 'hi') {
    const l = label.toLowerCase();
    if (l === 'low' || l === 'low risk') displayLabel = t('riskTierLow');
    else if (l === 'moderate' || l === 'moderate risk') displayLabel = t('riskTierModerate');
    else if (l === 'high' || l === 'high risk') displayLabel = t('riskTierHigh');
    else if (l === 'urgent' || l === 'urgent risk') displayLabel = t('riskTierUrgent');
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        size === 'sm' && styles.badgeSm,
        size === 'lg' && styles.badgeLg,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: c.text }]} />
      <Text
        style={[
          styles.text,
          { color: c.text },
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_DOCTOR_REVIEW' | 'DOCTOR_VALIDATED' | 'REASSESSMENT_REQUESTED' | string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel }) => {
  const { t, language } = useLanguage();

  const getProps = () => {
    switch (status) {
      case 'DOCTOR_VALIDATED':
        return {
          bg: ClinicalTheme.colors.riskLowBg,
          border: ClinicalTheme.colors.riskLowBorder,
          text: ClinicalTheme.colors.riskLow,
          label: t('statusDoctorValidated'),
        };
      case 'PENDING_DOCTOR_REVIEW':
      case 'COMPLETED':
        return {
          bg: ClinicalTheme.colors.statusPendingBg,
          border: ClinicalTheme.colors.statusPendingBorder,
          text: ClinicalTheme.colors.statusPending,
          label: t('statusPendingReview'),
        };
      case 'REASSESSMENT_REQUESTED':
        return {
          bg: ClinicalTheme.colors.riskUrgentBg,
          border: ClinicalTheme.colors.riskUrgentBorder,
          text: ClinicalTheme.colors.riskUrgent,
          label: t('statusReassessmentRequested'),
        };
      default:
        return {
          bg: ClinicalTheme.colors.surfaceMuted,
          border: ClinicalTheme.colors.borderMedium,
          text: ClinicalTheme.colors.textMuted,
          label: t('statusInProgress'),
        };
    }
  };

  const p = getProps();

  let finalLabel = customLabel || p.label;
  if (customLabel && language === 'hi') {
    const cl = customLabel.toLowerCase();
    if (cl.includes('validated')) finalLabel = t('statusDoctorValidated');
    else if (cl.includes('pending')) finalLabel = t('statusPendingReview');
    else if (cl.includes('reassessment')) finalLabel = t('statusReassessmentRequested');
    else if (cl.includes('progress')) finalLabel = t('statusInProgress');
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: p.bg, borderColor: p.border }]}>
      <Text style={[styles.statusText, { color: p.text }]}>{finalLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ClinicalTheme.radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: ClinicalTheme.radius.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 11,
  },
  textLg: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ClinicalTheme.radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
