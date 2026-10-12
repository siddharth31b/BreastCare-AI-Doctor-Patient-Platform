import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ClinicalTheme, RADIUS, SPACING, getRiskColors, getStatusColors } from '../theme/clinicalTheme';
import { useLanguage } from '../i18n/LanguageContext';

export interface RiskBadgeProps {
  tier?: 'Low' | 'Moderate' | 'High' | 'Urgent' | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const RiskBadge: React.FC<RiskBadgeProps> = React.memo(({ tier, label, size = 'md', style }) => {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  const c = getRiskColors(tier);

  // Default labels if not provided
  let defaultLabel = t('riskTierLow');
  const normalizedTier = tier?.toLowerCase() || 'low';
  if (normalizedTier === 'urgent') defaultLabel = t('riskTierUrgent');
  else if (normalizedTier === 'high') defaultLabel = t('riskTierHigh');
  else if (normalizedTier === 'moderate') defaultLabel = t('riskTierModerate');

  let displayLabel = label || defaultLabel;
  if (label && isHindi) {
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
        size === 'md' && styles.badgeMd,
        size === 'lg' && styles.badgeLg,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Risk tier: ${displayLabel}`}
    >
      <View style={[styles.dot, { backgroundColor: c.text }]} />
      <Text
        style={[
          styles.text,
          { color: c.text },
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
          isHindi && styles.textHindi,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayLabel}
      </Text>
    </View>
  );
});

export interface StatusBadgeProps {
  status:
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'PENDING_DOCTOR_REVIEW'
    | 'DOCTOR_VALIDATED'
    | 'REASSESSMENT_REQUESTED'
    | string;
  customLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, customLabel, size = 'md', style }) => {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  const p = getStatusColors(status);

  let defaultLabel = t('statusInProgress');
  if (status === 'DOCTOR_VALIDATED') defaultLabel = t('statusDoctorValidated');
  else if (status === 'PENDING_DOCTOR_REVIEW' || status === 'COMPLETED') defaultLabel = t('statusPendingReview');
  else if (status === 'REASSESSMENT_REQUESTED') defaultLabel = t('statusReassessmentRequested');

  let finalLabel = customLabel || defaultLabel;
  if (customLabel && isHindi) {
    const cl = customLabel.toLowerCase();
    if (cl.includes('validated')) finalLabel = t('statusDoctorValidated');
    else if (cl.includes('pending')) finalLabel = t('statusPendingReview');
    else if (cl.includes('reassessment')) finalLabel = t('statusReassessmentRequested');
    else if (cl.includes('progress')) finalLabel = t('statusInProgress');
  }

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: p.bg, borderColor: p.border },
        size === 'sm' && styles.statusBadgeSm,
        size === 'md' && styles.statusBadgeMd,
        size === 'lg' && styles.statusBadgeLg,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${finalLabel}`}
    >
      <Text
        style={[
          styles.statusText,
          { color: p.text },
          size === 'sm' && styles.statusTextSm,
          size === 'lg' && styles.statusTextLg,
          isHindi && styles.statusTextHindi,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {finalLabel}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    width: 124,
    height: 26,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: RADIUS.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeMd: {
    width: 150,
    height: 30,
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  textLg: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  textHindi: {
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeSm: {
    width: 124,
    height: 26,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: RADIUS.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeMd: {
    width: 150,
    height: 30,
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  statusTextSm: {
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  statusTextLg: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  statusTextHindi: {
    lineHeight: 18,
  },
});
