import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ClinicalTheme, SPACING, RADIUS, ELEVATION } from '../theme/clinicalTheme';
import { Patient, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export interface PatientSummaryCardProps {
  patient: Partial<Patient>;
  extraBadge?: React.ReactNode;
  compact?: boolean;
}

export const PatientSummaryCard: React.FC<PatientSummaryCardProps> = ({
  patient,
  extraBadge,
  compact = false,
}) => {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);
  const initial = displayName.charAt(0).toUpperCase();

  const formatGender = (gender?: string) => {
    if (!gender) return t('genderFemale');
    const g = gender.toLowerCase();
    if (g === 'female') return t('genderFemale');
    if (g === 'male') return t('genderMale');
    if (g === 'other') return t('genderOther');
    return gender;
  };

  return (
    <View
      style={[styles.card, compact && styles.cardCompact]}
      accessibilityRole="summary"
      accessibilityLabel={`Patient: ${displayName}, ${patientCode}`}
    >
      <View style={[styles.avatarBox, compact && styles.avatarBoxCompact]}>
        {patient.face_photo_url ? (
          <Image
            source={{ uri: patient.face_photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.initialsBox}>
            <Text style={[styles.initialsText, compact && styles.initialsTextCompact]}>
              {initial}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, isHindi && styles.nameHindi]} numberOfLines={1}>
            {displayName}
          </Text>
          {extraBadge}
        </View>

        <Text style={styles.code}>{patientCode}</Text>

        <View style={styles.demographicsRow}>
          {patient.age !== undefined && (
            <View style={styles.pill}>
              <Text style={[styles.pillText, isHindi && styles.pillTextHindi]}>
                {patient.age} {t('years')}
              </Text>
            </View>
          )}
          <View style={styles.pill}>
            <Text style={[styles.pillText, isHindi && styles.pillTextHindi]}>
              {formatGender(patient.gender)}
            </Text>
          </View>
          {patient.phone ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{patient.phone}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    ...ClinicalTheme.shadows.card,
  },
  cardCompact: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatarBoxCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 24,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  initialsTextCompact: {
    fontSize: 18,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  name: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
  },
  nameHindi: {
    lineHeight: 26,
  },
  code: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: ClinicalTheme.colors.primaryAccent,
    marginTop: 2,
  },
  demographicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  pill: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: ClinicalTheme.colors.textSecondary,
  },
  pillTextHindi: {
    lineHeight: 18,
  },
});
