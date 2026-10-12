import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { realtimeManager } from '../realtime';
import {
  ClinicalTheme,
  SPACING,
  RADIUS,
  TOUCH_TARGETS,
  ELEVATION,
  INTERACTION,
  useResponsiveLayout,
} from '../theme';
import { ClinicalHeader } from '../components/ClinicalHeader';
import { PatientSummaryCard } from '../components/PatientSummaryCard';
import { RiskBadge, StatusBadge } from '../components/ClinicalBadges';
import { PrimaryButton, SecondaryButton } from '../components/ClinicalButtons';
import { getSymptomLabel } from '../i18n/symptomTranslations';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentReview'>;

export const AssessmentReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, assessmentId, clinicalResult, answersMap, riskProfile } = route.params;
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  const { isLandscape } = useResponsiveLayout();

  const [submitting, setSubmitting] = useState<boolean>(false);

  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await ApiService.submitAssessment(assessmentId, riskProfile, answersMap);

      // Clean up saved assessment draft from AsyncStorage
      await AsyncStorage.removeItem(`breastcare_draft_assessment_${assessmentId}`).catch(() => {});

      // Emit realtime event to immediately update dashboard counters and history
      realtimeManager.emit('ASSESSMENT_SUBMITTED', res.assessment || { id: assessmentId, patient_id: patient.id });

      navigation.replace('SubmissionSuccess', {
        patient,
        assessmentId,
        clinicalResult,
      });
    } catch (err: any) {
      Alert.alert(
        t('submissionFailed'),
        err.message || t('unableToPersistAssessment')
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Group positive findings
  const positiveFindings = Object.entries(answersMap).filter(([_, val]) => val === 'Yes');

  const getTierDisplay = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'low':
        return t('riskTierLow');
      case 'moderate':
        return t('riskTierModerate');
      case 'high':
        return t('riskTierHigh');
      case 'urgent':
        return t('riskTierUrgent');
      default:
        return tier.toUpperCase();
    }
  };

  const getRiskVisual = (tier?: string) => {
    const tLower = (tier || 'low').toLowerCase();
    switch (tLower) {
      case 'urgent':
        return {
          symbol: '⚠',
          label: t('riskTierUrgent'),
          color: ClinicalTheme.colors.riskUrgent,
          bg: ClinicalTheme.colors.riskUrgentBg,
          border: ClinicalTheme.colors.riskUrgentBorder,
        };
      case 'high':
        return {
          symbol: '!',
          label: t('riskTierHigh'),
          color: ClinicalTheme.colors.riskHigh,
          bg: ClinicalTheme.colors.riskHighBg,
          border: ClinicalTheme.colors.riskHighBorder,
        };
      case 'moderate':
        return {
          symbol: '●',
          label: t('riskTierModerate'),
          color: ClinicalTheme.colors.riskModerate,
          bg: ClinicalTheme.colors.riskModerateBg,
          border: ClinicalTheme.colors.riskModerateBorder,
        };
      case 'low':
      default:
        return {
          symbol: '✓',
          label: t('riskTierLow'),
          color: ClinicalTheme.colors.riskLow,
          bg: ClinicalTheme.colors.riskLowBg,
          border: ClinicalTheme.colors.riskLowBorder,
        };
    }
  };

  const riskVisual = getRiskVisual(clinicalResult.tier);

  const getLocalizedOverrideRule = (ruleName?: string | null) => {
    if (!ruleName) return '';
    if (language === 'hi') {
      if (ruleName.includes('Metastatic')) return t('overrideMetastaticPatternTitle');
      if (ruleName.includes('Triad')) return t('overrideClassicTriadTitle');
      if (ruleName.includes('Ulcerative') || ruleName.includes('Lesion')) return t('overrideUlcerativeLesionTitle');
    }
    return ruleName;
  };

  const getLocalizedOverrideReason = (reason?: string | null) => {
    if (!reason) return '';
    if (language === 'hi') {
      if (reason.includes('Concomitant') || reason.includes('systemic staging')) {
        return t('overrideMetastaticPatternReason');
      }
      if (reason.includes('Co-occurrence') || reason.includes('classic clinical cluster')) {
        return t('overrideClassicTriadReason');
      }
      if (reason.includes('Ulcer') || reason.includes('tissue requires')) {
        return t('overrideUlcerativeLesionReason');
      }
    }
    return reason;
  };

  const getLocalizedRecommendation = (rec?: string, tier?: string) => {
    if (language === 'hi') {
      const tr = tier?.toLowerCase() || clinicalResult.tier?.toLowerCase();
      if (tr === 'urgent') return t('recommendationUrgent');
      if (tr === 'high') return t('recommendationHigh');
      if (tr === 'moderate') return t('recommendationModerate');
      if (tr === 'low') return t('recommendationLow');
    }
    return rec || '';
  };

  const getLocalizedInterpretation = (interp?: string) => {
    if (language === 'hi') {
      const tr = clinicalResult.tier?.toLowerCase();
      if (tr === 'urgent') {
        if (clinicalResult.override.triggered) {
          return t('interpretationUrgentOverride', {
            reason: getLocalizedOverrideReason(clinicalResult.override.reason),
            score: clinicalResult.totalScore,
          });
        }
        return t('interpretationUrgent', { score: clinicalResult.totalScore });
      }
      if (tr === 'high') {
        return t('interpretationHigh', { score: clinicalResult.totalScore, brm: clinicalResult.brm.score });
      }
      if (tr === 'moderate') {
        return t('interpretationModerate', { score: clinicalResult.totalScore });
      }
      return t('interpretationLow', { score: clinicalResult.totalScore });
    }
    return interp || '';
  };

  // Left Column Content: Patient Dossier, Risk Stratification Hero, Breakdown, Findings
  const renderLeftColumn = () => (
    <View style={isLandscape ? styles.leftCol : styles.fullWidthCol}>
      {/* Patient Dossier Card */}
      <PatientSummaryCard
        patient={patient}
        extraBadge={<StatusBadge status="COMPLETED" />}
      />

      {/* Assessed Risk Tier Hero Banner */}
      <View
        style={[
          styles.riskHeroCard,
          { borderColor: riskVisual.border, backgroundColor: riskVisual.bg },
        ]}
      >
        <View style={styles.riskTopRow}>
          <View style={styles.riskHeadingCol}>
            <Text style={[styles.riskHeroCaption, isHindi && styles.captionHindi]}>
              {t('clinicalRiskStratification')}
            </Text>
            <View style={styles.riskBadgeTitleRow}>
              <View
                style={[
                  styles.riskSymbolPill,
                  { backgroundColor: riskVisual.color },
                ]}
              >
                <Text style={styles.riskSymbolText}>{riskVisual.symbol}</Text>
              </View>
              <Text
                style={[
                  styles.riskHeroTitle,
                  { color: riskVisual.color },
                  isHindi && styles.titleHindi,
                ]}
              >
                {t('riskTierPrefix')}{getTierDisplay(clinicalResult.tier)}
              </Text>
            </View>
          </View>
          <RiskBadge tier={clinicalResult.tier} size="lg" />
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{clinicalResult.totalScore}</Text>
            <Text style={[styles.scoreLabel, isHindi && styles.labelHindi]}>
              {t('score')}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{positiveFindings.length}</Text>
            <Text style={[styles.scoreLabel, isHindi && styles.labelHindi]}>
              {t('positiveIndicators')}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>+{clinicalResult.brm.score}</Text>
            <Text style={[styles.scoreLabel, isHindi && styles.labelHindi]}>
              {t('baselineModifiers')}
            </Text>
          </View>
        </View>

        {clinicalResult.override.triggered ? (
          <View style={styles.overrideAlert}>
            <View style={styles.overrideAlertHeader}>
              <Text style={styles.overrideAlertIcon}>⚠</Text>
              <Text style={[styles.overrideAlertTitle, isHindi && styles.boldHindi]}>
                {t('safetyEscalationOverride')} {getLocalizedOverrideRule(clinicalResult.override.ruleName)}
              </Text>
            </View>
            <Text style={[styles.overrideAlertDesc, isHindi && styles.bodyHindi]}>
              {getLocalizedOverrideReason(clinicalResult.override.reason)}
            </Text>
          </View>
        ) : (
          <View style={styles.standardClearanceBox}>
            <Text style={styles.standardClearanceIcon}>✓</Text>
            <Text style={[styles.standardClearanceText, isHindi && styles.labelHindi]}>
              {t('safetyEscalations')}: {t('noOverrideTriggered')}
            </Text>
          </View>
        )}
      </View>

      {/* Risk Factor Breakdown */}
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
          {t('riskFactorBreakdown')}
        </Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, isHindi && styles.labelHindi]}>
              {t('baselineRiskModifiers')}
            </Text>
            <Text style={styles.breakdownScore}>
              +{clinicalResult.brm.score} {t('points')}
            </Text>
            <Text style={[styles.breakdownSub, isHindi && styles.captionHindi]}>
              {t('dietGeneticsSub')}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, isHindi && styles.labelHindi]}>
              {t('clinicalSymptoms')}
            </Text>
            <Text style={styles.breakdownScore}>
              {clinicalResult.symptomScoring.phase1Weighted} {t('points')}
            </Text>
            <Text style={[styles.breakdownSub, isHindi && styles.captionHindi]}>
              {t('positiveFindingsCount', { count: clinicalResult.symptomScoring.positiveCountPhase1 })}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, isHindi && styles.labelHindi]}>
              {t('regionalFindings')}
            </Text>
            <Text style={styles.breakdownScore}>
              {clinicalResult.symptomScoring.phase2Weighted} {t('points')}
            </Text>
            <Text style={[styles.breakdownSub, isHindi && styles.captionHindi]}>
              {t('regionalFindingsCount', { count: clinicalResult.symptomScoring.positiveCountPhase2 })}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, isHindi && styles.labelHindi]}>
              {t('systemicFindings')}
            </Text>
            <Text style={styles.breakdownScore}>
              {clinicalResult.symptomScoring.phase3Weighted} {t('points')}
            </Text>
            <Text style={[styles.breakdownSub, isHindi && styles.captionHindi]}>
              {t('systemicFindingsCount', { count: clinicalResult.symptomScoring.positiveCountPhase3 })}
            </Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownLabel, isHindi && styles.labelHindi]}>
              {t('safetyEscalations')}
            </Text>
            <Text
              style={[
                styles.breakdownScore,
                clinicalResult.override.triggered && { color: ClinicalTheme.colors.riskUrgent },
              ]}
            >
              {clinicalResult.override.triggered ? t('triggered') : t('standard')}
            </Text>
            <Text style={[styles.breakdownSub, isHindi && styles.captionHindi]}>
              {clinicalResult.override.triggered
                ? getLocalizedOverrideRule(clinicalResult.override.ruleName)
                : t('noOverrideTriggered')}
            </Text>
          </View>
        </View>
      </View>

      {/* Clinical Indicators */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
            {t('clinicalIndicators')}
          </Text>
          <View style={styles.findingCountPill}>
            <Text style={styles.findingCountText}>{positiveFindings.length}</Text>
          </View>
        </View>

        {positiveFindings.length === 0 ? (
          <Text style={[styles.noFindingsText, isHindi && styles.bodyHindi]}>
            {t('noPositiveFindingsReported')}
          </Text>
        ) : (
          <View style={styles.findingsPillWrap}>
            {positiveFindings.map(([code]) => (
              <View key={code} style={styles.findingPill}>
                <Text style={styles.findingPillCode}>
                  {getSymptomLabel(code, code, language)}
                </Text>
                <View style={styles.findingPillYesBadge}>
                  <Text style={styles.findingPillYesText}>✓ {t('yes')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // Right Column Content: Protocol Status, Clinical Directives, Action Controls
  const renderRightColumn = () => (
    <View style={isLandscape ? styles.rightCol : styles.fullWidthCol}>
      {/* Session Status & Quick Summary Card */}
      <View style={styles.workstationCard}>
        <View style={styles.workstationHeader}>
          <Text style={[styles.workstationCaption, isHindi && styles.captionHindi]}>
            {t('reviewStatus')}
          </Text>
          <StatusBadge status="COMPLETED" />
        </View>

        <View style={styles.metricsSummaryBox}>
          <View style={styles.metricSummaryRow}>
            <Text style={[styles.metricSummaryLabel, isHindi && styles.labelHindi]}>
              {t('clinicalRiskScore')}
            </Text>
            <Text style={styles.metricSummaryValue}>{clinicalResult.totalScore} {t('points')}</Text>
          </View>
          <View style={styles.metricSummaryRow}>
            <Text style={[styles.metricSummaryLabel, isHindi && styles.labelHindi]}>
              {t('baselineRiskBRM')}
            </Text>
            <Text style={styles.metricSummaryValue}>+{clinicalResult.brm.score} {t('points')}</Text>
          </View>
          <View style={styles.metricSummaryRow}>
            <Text style={[styles.metricSummaryLabel, isHindi && styles.labelHindi]}>
              {t('positiveIndicators')}
            </Text>
            <Text style={styles.metricSummaryValue}>{positiveFindings.length}</Text>
          </View>
          <View style={styles.metricSummaryRow}>
            <Text style={[styles.metricSummaryLabel, isHindi && styles.labelHindi]}>
              {t('safetyEscalations')}
            </Text>
            <Text
              style={[
                styles.metricSummaryValue,
                clinicalResult.override.triggered
                  ? { color: ClinicalTheme.colors.riskUrgent }
                  : { color: ClinicalTheme.colors.riskLow },
              ]}
            >
              {clinicalResult.override.triggered ? t('triggered') : t('standard')}
            </Text>
          </View>
        </View>
      </View>

      {/* Physician Action & Recommendation Card */}
      <View style={styles.workstationCard}>
        <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
          {t('physicianAction')}
        </Text>
        <View style={styles.recBox}>
          <Text style={[styles.recommendationText, isHindi && styles.boldHindi]}>
            {getLocalizedRecommendation(clinicalResult.recommendation, clinicalResult.tier)}
          </Text>
        </View>
        <Text style={[styles.interpretationText, isHindi && styles.bodyHindi]}>
          {getLocalizedInterpretation(clinicalResult.interpretation)}
        </Text>
      </View>

      {/* Submission Action Card */}
      <View style={styles.actionCard}>
        <PrimaryButton
          title={
            submitting
              ? t('submittingToClinicalFile')
              : t('submitAssessmentToFile')
          }
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
        <SecondaryButton
          title={t('modifyAnswers')}
          onPress={() => navigation.goBack()}
          disabled={submitting}
          style={styles.modifyBtn}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ClinicalHeader
        title={t('patientClinicalAssessment')}
        subtitle={`${displayName} • ${patientCode}`}
        onBack={() => navigation.goBack()}
        backLabel={t('modifyAnswers')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.contentWrap, isLandscape && styles.contentWrapLandscape]}>
          {renderLeftColumn()}
          {renderRightColumn()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 64,
    alignItems: 'center',
  },
  contentWrap: {
    width: '100%',
    maxWidth: 1240,
    gap: SPACING.lg,
  },
  contentWrapLandscape: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xl,
  },
  leftCol: {
    flex: 1.65, // ~62-65%
    gap: SPACING.lg,
  },
  rightCol: {
    flex: 1, // ~35-38%
    gap: SPACING.lg,
  },
  fullWidthCol: {
    width: '100%',
    gap: SPACING.lg,
  },
  riskHeroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 2,
    ...ClinicalTheme.shadows.card,
  },
  riskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderDefault,
  },
  riskHeadingCol: {
    flex: 1,
  },
  riskHeroCaption: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  riskBadgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  riskSymbolPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskSymbolText: {
    fontSize: 14,
    fontWeight: '900',
    color: ClinicalTheme.colors.textWhite,
  },
  riskHeroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 26,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  scoreLabel: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  overrideAlert: {
    marginTop: SPACING.lg,
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  overrideAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overrideAlertIcon: {
    fontSize: 16,
    color: ClinicalTheme.colors.riskUrgent,
  },
  overrideAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.riskUrgent,
    flex: 1,
  },
  overrideAlertDesc: {
    fontSize: 13,
    color: ClinicalTheme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  standardClearanceBox: {
    marginTop: SPACING.md,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  standardClearanceIcon: {
    fontSize: 14,
    color: ClinicalTheme.colors.riskLow,
    fontWeight: '800',
  },
  standardClearanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: ClinicalTheme.colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: SPACING.sm,
  },
  findingCountPill: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  findingCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryLight,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  breakdownItem: {
    width: '48%',
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  breakdownScore: {
    fontSize: 20,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
    marginVertical: 4,
  },
  breakdownSub: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
  },
  noFindingsText: {
    fontSize: 14,
    color: ClinicalTheme.colors.textMuted,
    fontStyle: 'italic',
  },
  findingsPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  findingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  findingPillCode: {
    fontSize: 13,
    fontWeight: '600',
    color: ClinicalTheme.colors.textPrimary,
  },
  findingPillYesBadge: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  findingPillYesText: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.riskUrgent,
  },
  workstationCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  workstationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderDefault,
  },
  workstationCaption: {
    fontSize: 13,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  metricsSummaryBox: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 8,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
  },
  metricSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  metricSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  recBox: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderLeftWidth: 4,
    borderLeftColor: ClinicalTheme.colors.primaryAccent,
    padding: SPACING.md,
    borderRadius: RADIUS.xs,
    marginBottom: SPACING.sm,
  },
  recommendationText: {
    fontSize: 15,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
    lineHeight: 22,
  },
  interpretationText: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    lineHeight: 19,
  },
  actionCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    gap: SPACING.md,
    ...ClinicalTheme.shadows.card,
  },
  submitBtn: {
    minHeight: TOUCH_TARGETS.primaryAction, // 60dp
  },
  modifyBtn: {
    minHeight: TOUCH_TARGETS.secondaryAction, // 56dp
  },
  captionHindi: {
    lineHeight: 18,
  },
  titleHindi: {
    lineHeight: 34,
  },
  labelHindi: {
    lineHeight: 18,
  },
  bodyHindi: {
    lineHeight: 20,
  },
  headingHindi: {
    lineHeight: 26,
  },
  boldHindi: {
    lineHeight: 22,
  },
});
