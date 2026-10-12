import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { Assessment, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
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
import { LoadingState } from '../components/ClinicalStates';
import { getSymptomLabel } from '../i18n/symptomTranslations';

type Props = NativeStackScreenProps<RootStackParamList, 'PhysicianReview'>;

export const PhysicianReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assessmentId } = route.params;
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  const { isLandscape } = useResponsiveLayout();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Review Form state
  const [doctorNote, setDoctorNote] = useState<string>('');
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);

  // Reassessment Modal state
  const [reassessModalVisible, setReassessModalVisible] = useState<boolean>(false);
  const [reassessReason, setReassessReason] = useState<string>('');

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAssessmentById(assessmentId);
      setAssessment(data);
      if (data?.doctor_note) {
        setDoctorNote(data.doctor_note);
      }
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('assessmentNotFound', { id: assessmentId }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const handleValidate = async () => {
    if (submitting) return;
    if (!hasConfirmed) {
      Alert.alert(t('reviewRequired'), t('reviewRequiredMsg'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await ApiService.validateAssessment(assessmentId, doctorNote);
      setAssessment(res.assessment);

      // Emit realtime event to synchronize dashboard counters and assessment history
      realtimeManager.emit('ASSESSMENT_VALIDATED', res.assessment);

      Alert.alert(
        t('assessmentValidatedSuccess'),
        t('assessmentValidatedSuccessMsg')
      );
    } catch (err: any) {
      Alert.alert(t('validationError'), err.message || t('validationError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestReassessment = async () => {
    if (submitting) return;
    if (!reassessReason.trim()) {
      Alert.alert(t('reasonRequired'), t('reasonRequiredMsg'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await ApiService.requestReassessment(assessmentId, reassessReason.trim(), doctorNote);
      setAssessment(res.assessment);
      setReassessModalVisible(false);
      setReassessReason('');

      // Emit realtime event to synchronize dashboard and history
      realtimeManager.emit('ASSESSMENT_REASSESSMENT', res.assessment);

      Alert.alert(
        t('reassessmentRequestedSuccess'),
        t('reassessmentRequestedSuccessMsg')
      );
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingState message={t('loadingAssessment')} />
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, isHindi && styles.headingHindi]}>
          {t('assessmentNotFound', { id: assessmentId })}
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('goBack')}
        >
          <Text style={[styles.backBtnText, isHindi && styles.labelHindi]}>
            ← {t('goBack')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const patient = assessment.patient || assessment.patients;
  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);
  const risk = assessment.risk_analysis;
  const status = assessment.status;
  const isPending = status === 'PENDING_DOCTOR_REVIEW' || status === 'COMPLETED';
  const isValidated = status === 'DOCTOR_VALIDATED';
  const isReassessment = status === 'REASSESSMENT_REQUESTED';

  const getTierDisplay = (tier?: string) => {
    if (!tier) return t('unknownRiskTier');
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

  const riskVisual = getRiskVisual(risk?.tier);

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
      const tr = tier?.toLowerCase() || risk?.tier?.toLowerCase();
      if (tr === 'urgent') return t('recommendationUrgent');
      if (tr === 'high') return t('recommendationHigh');
      if (tr === 'moderate') return t('recommendationModerate');
      if (tr === 'low') return t('recommendationLow');
    }
    return rec || '';
  };

  // Left Column Content: Patient Dossier, Risk Analysis Hero, Complete Findings List
  const renderLeftColumn = () => (
    <View style={isLandscape ? styles.leftCol : styles.fullWidthCol}>
      {/* Patient Dossier Card */}
      <PatientSummaryCard
        patient={patient || {}}
        extraBadge={<StatusBadge status={status} />}
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
                {t('riskTierHeading', { tier: getTierDisplay(risk?.tier) })}
              </Text>
            </View>
          </View>
          {risk?.tier ? <RiskBadge tier={risk.tier} size="lg" /> : null}
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{risk?.totalScore ?? '—'}</Text>
            <Text style={[styles.scoreLabel, isHindi && styles.labelHindi]}>
              {t('clinicalRiskScore')}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>+{risk?.brm?.score ?? '0'}</Text>
            <Text style={[styles.scoreLabel, isHindi && styles.labelHindi]}>
              {t('baselineRiskBRM')}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{assessment.answers?.length ?? 0}</Text>
            <Text style={[styles.scoreLabel, isHindi && styles.labelHindi]}>
              {t('recordedResponses')}
            </Text>
          </View>
        </View>

        {risk?.override?.triggered ? (
          <View style={styles.overrideAlert}>
            <View style={styles.overrideAlertHeader}>
              <Text style={styles.overrideAlertIcon}>⚠</Text>
              <Text style={[styles.overrideAlertTitle, isHindi && styles.boldHindi]}>
                {t('safetyEscalationOverride')} {getLocalizedOverrideRule(risk.override.ruleName)}
              </Text>
            </View>
            <Text style={[styles.overrideAlertDesc, isHindi && styles.bodyHindi]}>
              {getLocalizedOverrideReason(risk.override.reason)}
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

      {/* Complete Recorded Clinical Findings */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
            {t('completeClinicalFindings')}
          </Text>
          <View style={styles.findingCountPill}>
            <Text style={styles.findingCountText}>
              {assessment.answers?.length ?? 0}
            </Text>
          </View>
        </View>

        {assessment.answers && assessment.answers.length > 0 ? (
          <View style={styles.answersList}>
            {assessment.answers.map((ans, idx) => {
              const isYes = ans.answer === 'Yes';
              const localizedQuestion = getSymptomLabel(
                ans.question_id || ans.question,
                ans.question,
                language
              );
              return (
                <View
                  key={idx}
                  style={[styles.answerRow, isYes && styles.answerRowYes]}
                >
                  <View style={styles.answerTextCol}>
                    <Text style={[styles.answerQuestion, isHindi && styles.bodyHindi]}>
                      {localizedQuestion}
                    </Text>
                    <Text style={styles.answerCode}>
                      {(ans.question_id || 'CLINICAL-Q').toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.answerBadge,
                      isYes ? styles.answerBadgeYes : styles.answerBadgeNo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.answerBadgeText,
                        isYes ? styles.answerBadgeTextYes : styles.answerBadgeTextNo,
                        isHindi && styles.captionHindi,
                      ]}
                    >
                      {isYes ? `✓ ${t('yes')}` : t('no')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.noAnswersText, isHindi && styles.bodyHindi]}>
            {t('noIndividualAnswers')}
          </Text>
        )}
      </View>
    </View>
  );

  // Right Column Content: Status, Recommendations, Notes, Sign-Off Controls
  const renderRightColumn = () => (
    <View style={isLandscape ? styles.rightCol : styles.fullWidthCol}>
      {/* Assessment Review Status Card */}
      <View style={styles.workstationCard}>
        <View style={styles.workstationHeader}>
          <Text style={[styles.workstationCaption, isHindi && styles.captionHindi]}>
            {t('reviewStatus')}
          </Text>
          <StatusBadge status={status} />
        </View>

        <View style={styles.statusMetaBox}>
          <View style={styles.statusMetaRow}>
            <Text style={[styles.statusMetaLabel, isHindi && styles.labelHindi]}>
              {t('date')}
            </Text>
            <Text style={styles.statusMetaValue}>
              {assessment.completed_at
                ? new Date(assessment.completed_at).toLocaleDateString()
                : assessment.started_at
                ? new Date(assessment.started_at).toLocaleDateString()
                : '—'}
            </Text>
          </View>
          <View style={styles.statusMetaRow}>
            <Text style={[styles.statusMetaLabel, isHindi && styles.labelHindi]}>
              {t('physician')}
            </Text>
            <Text style={styles.statusMetaValue}>
              {assessment.reviewed_by || t('physician')}
            </Text>
          </View>
        </View>
      </View>

      {/* Physician Recommendation Card */}
      {risk?.recommendation ? (
        <View style={styles.workstationCard}>
          <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
            {t('physicianRecommendation')}
          </Text>
          <View style={styles.recBox}>
            <Text style={[styles.recommendationText, isHindi && styles.boldHindi]}>
              {getLocalizedRecommendation(risk.recommendation, risk.tier)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Physician Sign-Off & Clinical Notes Card */}
      <View style={styles.workstationCard}>
        <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
          {t('physicianReviewNotes')}
        </Text>
        <Text style={[styles.sectionSub, isHindi && styles.captionHindi]}>
          {t('physicianReviewNotesSub')}
        </Text>

        <TextInput
          style={[styles.noteInput, isValidated && styles.noteInputDisabled]}
          value={doctorNote}
          onChangeText={setDoctorNote}
          placeholder={t('enterPhysicianNotesPlaceholder')}
          placeholderTextColor={ClinicalTheme.colors.textLight}
          multiline
          numberOfLines={4}
          editable={!isValidated && !submitting}
          accessibilityLabel={t('clinicalNotesLabel')}
        />

        {isValidated ? (
          <View style={styles.validatedNotice}>
            <Text style={styles.validatedNoticeIcon}>✓</Text>
            <Text style={[styles.validatedNoticeText, isHindi && styles.boldHindi]}>
              {t('signedAndValidatedBy', {
                doctor: assessment.reviewed_by || t('physician'),
                date: assessment.reviewed_at
                  ? new Date(assessment.reviewed_at).toLocaleDateString()
                  : (language === 'hi' ? 'रिकॉर्ड' : 'Record'),
              })}
            </Text>
          </View>
        ) : isReassessment ? (
          <View style={styles.reassessmentNotice}>
            <Text style={[styles.reassessmentNoticeTitle, isHindi && styles.boldHindi]}>
              ⚠ {t('reassessmentRequestedTitle')}
            </Text>
            <Text style={[styles.reassessmentNoticeReason, isHindi && styles.bodyHindi]}>
              {t('reasonLabel')} {assessment.reassessment_reason || 'Re-evaluation required.'}
            </Text>
          </View>
        ) : (
          <View style={styles.reviewActionArea}>
            <TouchableOpacity
              style={[
                styles.confirmCheckRow,
                hasConfirmed && styles.confirmCheckRowActive,
              ]}
              onPress={() => setHasConfirmed(!hasConfirmed)}
              activeOpacity={INTERACTION.pressOpacity}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasConfirmed }}
              accessibilityLabel={t('confirmReviewCheckbox')}
            >
              <View
                style={[
                  styles.confirmCheckBox,
                  hasConfirmed && styles.confirmCheckBoxActive,
                ]}
              >
                {hasConfirmed && <Text style={styles.confirmCheckmark}>✓</Text>}
              </View>
              <Text style={[styles.confirmCheckLabel, isHindi && styles.labelHindi]}>
                {t('confirmReviewCheckbox')}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButtonsCol}>
              <PrimaryButton
                title={
                  submitting
                    ? t('validating')
                    : t('validateAssessment')
                }
                onPress={handleValidate}
                loading={submitting}
                disabled={!hasConfirmed || submitting}
                style={styles.validateBtn}
              />

              <SecondaryButton
                title={t('requestReassessment')}
                onPress={() => setReassessModalVisible(true)}
                disabled={submitting}
                style={styles.reassessBtn}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ClinicalHeader
        title={t('physicianReviewAndSignoff')}
        subtitle={`${displayName} • ${patientCode}`}
        onBack={() => navigation.goBack()}
        backLabel={t('backToDashboard')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.contentWrap, isLandscape && styles.contentWrapLandscape]}>
          {renderLeftColumn()}
          {renderRightColumn()}
        </View>
      </ScrollView>

      {/* Reassessment Modal */}
      <Modal
        visible={reassessModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReassessModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, isHindi && styles.headingHindi]}>
              {t('requestClinicalReassessmentModalTitle')}
            </Text>
            <Text style={[styles.modalSubtitle, isHindi && styles.bodyHindi]}>
              {t('requestClinicalReassessmentModalSub')}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={reassessReason}
              onChangeText={setReassessReason}
              placeholder={t('enterReassessmentReasonPlaceholder')}
              placeholderTextColor={ClinicalTheme.colors.textLight}
              multiline
              numberOfLines={3}
              editable={!submitting}
              accessibilityLabel={t('reassessmentReasonPlaceholder')}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReassessModalVisible(false)}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={t('cancel')}
              >
                <Text style={[styles.modalCancelBtnText, isHindi && styles.labelHindi]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  submitting && styles.modalConfirmBtnDisabled,
                ]}
                onPress={handleRequestReassessment}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={t('submitRequest')}
              >
                <Text style={[styles.modalConfirmBtnText, isHindi && styles.labelHindi]}>
                  {t('submitRequest')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    color: ClinicalTheme.colors.riskUrgent,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: SPACING.lg,
    minHeight: TOUCH_TARGETS.minTouchTarget,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontWeight: '700',
    fontSize: 14,
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
    fontSize: 22,
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
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: SPACING.xs,
  },
  sectionSub: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    marginBottom: SPACING.md,
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
  answersList: {
    gap: 8,
    marginTop: SPACING.sm,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
  },
  answerRowYes: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
  },
  answerTextCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  answerQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: ClinicalTheme.colors.textPrimary,
    lineHeight: 20,
  },
  answerCode: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
    fontWeight: '700',
  },
  answerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  answerBadgeYes: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderColor: ClinicalTheme.colors.riskUrgent,
  },
  answerBadgeNo: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  answerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  answerBadgeTextYes: {
    color: ClinicalTheme.colors.riskUrgent,
  },
  answerBadgeTextNo: {
    color: ClinicalTheme.colors.textMuted,
  },
  noAnswersText: {
    color: ClinicalTheme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
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
  statusMetaBox: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 8,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
  },
  statusMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  statusMetaValue: {
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
    marginTop: SPACING.xs,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
    lineHeight: 21,
  },
  noteInput: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    padding: SPACING.md,
    fontSize: 14,
    color: ClinicalTheme.colors.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  noteInputDisabled: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderColor: ClinicalTheme.colors.borderDefault,
    color: ClinicalTheme.colors.textSecondary,
  },
  validatedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskLowBorder,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  validatedNoticeIcon: {
    fontSize: 18,
    color: ClinicalTheme.colors.riskLow,
    fontWeight: '900',
  },
  validatedNoticeText: {
    color: ClinicalTheme.colors.riskLow,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  reassessmentNotice: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  reassessmentNoticeTitle: {
    color: ClinicalTheme.colors.riskUrgent,
    fontSize: 13,
    fontWeight: '800',
  },
  reassessmentNoticeReason: {
    color: ClinicalTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  reviewActionArea: {
    gap: SPACING.md,
  },
  confirmCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    minHeight: TOUCH_TARGETS.minTouchTarget,
  },
  confirmCheckRowActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  confirmCheckBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surface,
  },
  confirmCheckBoxActive: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  confirmCheckmark: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 14,
    fontWeight: '900',
  },
  confirmCheckLabel: {
    flex: 1,
    fontSize: 13,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionButtonsCol: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  validateBtn: {
    minHeight: TOUCH_TARGETS.primaryAction, // 60dp
  },
  reassessBtn: {
    minHeight: TOUCH_TARGETS.secondaryAction, // 56dp
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.elevated,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  modalInput: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: ClinicalTheme.colors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: TOUCH_TARGETS.minTouchTarget,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surface,
  },
  modalCancelBtnText: {
    color: ClinicalTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1.3,
    minHeight: TOUCH_TARGETS.minTouchTarget,
    backgroundColor: ClinicalTheme.colors.riskUrgent,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtnDisabled: {
    opacity: 0.6,
  },
  modalConfirmBtnText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  captionHindi: {
    lineHeight: 18,
  },
  titleHindi: {
    lineHeight: 32,
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
