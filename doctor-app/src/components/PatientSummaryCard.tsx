import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { Patient, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface PatientSummaryCardProps {
  patient: Partial<Patient>;
  extraBadge?: React.ReactNode;
}

export const PatientSummaryCard: React.FC<PatientSummaryCardProps> = ({
  patient,
  extraBadge,
}) => {
  const { t } = useLanguage();
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
    <View style={styles.card}>
      <View style={styles.avatarBox}>
        {patient.face_photo_url ? (
          <Image source={{ uri: patient.face_photo_url }} style={styles.photo} />
        ) : (
          <View style={styles.initialsBox}>
            <Text style={styles.initialsText}>{initial}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {extraBadge}
        </View>

        <Text style={styles.code}>{patientCode}</Text>

        <View style={styles.demographicsRow}>
          {patient.age !== undefined && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{patient.age} {t('years')}</Text>
            </View>
          )}
          <View style={styles.pill}>
            <Text style={styles.pillText}>{formatGender(patient.gender)}</Text>
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
    borderRadius: ClinicalTheme.radius.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    padding: ClinicalTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ClinicalTheme.spacing.lg,
    ...ClinicalTheme.shadows.card,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
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
    borderRadius: 32,
  },
  initialsText: {
    fontSize: 24,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ClinicalTheme.spacing.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  code: {
    fontSize: 13,
    fontWeight: '600',
    color: ClinicalTheme.colors.primaryAccent,
    marginTop: 2,
  },
  demographicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ClinicalTheme.spacing.xs,
    marginTop: ClinicalTheme.spacing.sm,
  },
  pill: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ClinicalTheme.radius.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: ClinicalTheme.colors.textSecondary,
  },
});
