import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { RiskBadge } from '../components/ClinicalBadges';
import { PrimaryButton, SecondaryButton } from '../components/ClinicalButtons';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmissionSuccess'>;

export const SubmissionSuccessScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, assessmentId, clinicalResult } = route.params;
  const { t, language } = useLanguage();

  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>
          {t('assessmentSubmitted')}
        </Text>
        <Text style={styles.subtitle}>
          {t('assessmentAddedSuccess')}
        </Text>

        <View style={styles.dossierBox}>
          <View style={styles.dossierRow}>
            <Text style={styles.dossierLabel}>{t('patientLabel')}</Text>
            <Text style={styles.dossierVal}>{displayName} ({patientCode})</Text>
          </View>
          <View style={styles.dossierRow}>
            <Text style={styles.dossierLabel}>{t('assessmentLabel')}</Text>
            <Text style={styles.dossierVal}>#{assessmentId}</Text>
          </View>
          <View style={styles.dossierRow}>
            <Text style={styles.dossierLabel}>{t('statusLabel')}</Text>
            <Text style={[styles.dossierVal, styles.dossierStatus]}>{t('pendingPhysicianReview')}</Text>
          </View>
          <View style={[styles.dossierRow, styles.dossierBorderTop]}>
            <Text style={styles.dossierLabel}>{t('stratificationLabel')}</Text>
            <View style={styles.stratRow}>
              <RiskBadge tier={clinicalResult.tier} size="sm" />
              <Text style={styles.scoreText}>{clinicalResult.totalScore} {t('points')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={t('returnToDashboard')}
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.actionBtn}
          />

          <SecondaryButton
            title={t('viewAssessment')}
            onPress={() =>
              navigation.replace('PhysicianReview', {
                assessmentId,
                patient,
              })
            }
            style={styles.actionBtn}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ClinicalTheme.spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: ClinicalTheme.radius.xl,
    padding: ClinicalTheme.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.elevated,
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.riskLowBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ClinicalTheme.spacing.lg,
  },
  checkIcon: {
    color: ClinicalTheme.colors.riskLow,
    fontSize: 38,
    fontWeight: '900',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 440,
  },
  dossierBox: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: ClinicalTheme.radius.md,
    padding: ClinicalTheme.spacing.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    marginTop: ClinicalTheme.spacing.xl,
    width: '100%',
    gap: 10,
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dossierBorderTop: {
    borderTopWidth: 1,
    borderTopColor: ClinicalTheme.colors.border,
    paddingTop: 10,
    marginTop: 2,
  },
  dossierLabel: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '700',
  },
  dossierVal: {
    fontSize: 14,
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '700',
  },
  dossierStatus: {
    color: ClinicalTheme.colors.riskModerate,
  },
  stratRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  actions: {
    width: '100%',
    marginTop: ClinicalTheme.spacing.xl,
    gap: ClinicalTheme.spacing.md,
  },
  actionBtn: {
    minHeight: 52,
  },
});
