import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { Patient, Assessment, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
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
import { EmptyState, LoadingState } from '../components/ClinicalStates';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetail'>;

interface AuditEvent {
  id: string;
  title: string;
  timestamp: string;
  actor?: string | null;
}

function formatClinicalDateTime(dateStr?: string, language: 'en' | 'hi' = 'en'): string {
  if (!dateStr) return language === 'hi' ? 'तारीख उपलब्ध नहीं' : 'Date unavailable';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  try {
    const day = d.getDate();
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const month = language === 'hi' ? monthsHi[d.getMonth()] : monthsEn[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = language === 'hi' ? (hours >= 12 ? 'अपराह्न' : 'पूर्वाह्न') : (hours >= 12 ? 'PM' : 'AM');
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch (err) {
    return dateStr;
  }
}

export const PatientDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId } = route.params;
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  const { isLandscape } = useResponsiveLayout();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
      try {
        const p = await ApiService.getPatientById(patientId);
        setPatient(p);
        const allAssessments = await ApiService.getDoctorAssessments();
        const patientAssessments = allAssessments.filter(a => a.patient_id === patientId);
        // Sort descending by date
        patientAssessments.sort(
          (a, b) =>
            new Date(b.completed_at || b.started_at).getTime() -
            new Date(a.completed_at || a.started_at).getTime()
        );
        setAssessments(patientAssessments);
      } catch (err) {
        console.warn('Patient detail error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [patientId]);

  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);
  const latestAssessment = assessments[0];

  const getTierDisplay = (tier?: string) => {
    if (!tier) return t('riskTierLow');
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

  const latestRiskVisual = latestAssessment?.risk_analysis?.tier
    ? getRiskVisual(latestAssessment.risk_analysis.tier)
    : null;

  const getLocalizedRecommendation = (rec?: string, tier?: string) => {
    if (language === 'hi') {
      const tr = tier?.toLowerCase() || '';
      if (tr === 'urgent') return t('recommendationUrgent');
      if (tr === 'high') return t('recommendationHigh');
      if (tr === 'moderate') return t('recommendationModerate');
      if (tr === 'low') return t('recommendationLow');
    }
    return rec || '';
  };

  // Derive audit trail from verifiable milestones
  const auditEvents = useMemo(() => {
    const events: AuditEvent[] = [];

    // 1. Patient Registration
    if (patient?.created_at) {
      events.push({
        id: `reg-${patient.id}`,
        title: t('patientRegistration'),
        timestamp: patient.created_at,
      });
    }

    // 2. Photo Upload (if face photo exists)
    if (patient?.face_photo_url && patient?.created_at) {
      events.push({
        id: `photo-${patient.id}`,
        title: t('captureFacePhoto'),
        timestamp: patient.created_at,
      });
    }

    // 3. Assessment Milestones
    assessments.forEach(item => {
      if (item.started_at) {
        events.push({
          id: `start-${item.id}`,
          title: `${t('statusInProgress')} #${item.id.slice(0, 8)}`,
          timestamp: item.started_at,
        });
      }
      if (item.completed_at) {
        events.push({
          id: `comp-${item.id}`,
          title: `${t('assessmentSubmitted')} #${item.id.slice(0, 8)}`,
          timestamp: item.completed_at,
        });
      }
      if (item.reviewed_at) {
        events.push({
          id: `review-${item.id}`,
          title: `${t('statusDoctorValidated')} #${item.id.slice(0, 8)}`,
          timestamp: item.reviewed_at,
          actor: item.reviewed_by,
        });
      }
      if (item.status === 'REASSESSMENT_REQUESTED' && item.reassessment_reason) {
        events.push({
          id: `reassess-${item.id}`,
          title: `${t('statusReassessmentRequested')}: ${item.reassessment_reason}`,
          timestamp: item.completed_at || item.started_at,
        });
      }
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return events;
  }, [patient, assessments, t]);

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingState message={t('loadingRecords')} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.center}>
        <EmptyState
          title={t('patientRecordNotFound')}
          subtitle={t('patientRecordNotFoundSub')}
          actionTitle={`← ${t('backToDashboard')}`}
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Modular Clinical Sections
  // 1. Patient Dossier
  const renderPatientDossier = () => (
    <PatientSummaryCard
      patient={patient}
      extraBadge={
        <PrimaryButton
          title={`+ ${t('newPatientAssessment')}`}
          onPress={() => navigation.navigate('AssessmentStart', { patient })}
          style={styles.newAssessBtn}
        />
      }
    />
  );

  // 4. Longitudinal Assessment Timeline
  const renderAssessmentTimeline = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
          {t('assessmentHistory')}
        </Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{assessments.length}</Text>
        </View>
      </View>

      {assessments.length === 0 ? (
        <Text style={[styles.emptyNote, isHindi && styles.bodyHindi]}>
          {t('noAssessmentsForPatient')}
        </Text>
      ) : (
        <View style={styles.historyList}>
          {assessments.map((item, index) => {
            const tier = item.risk_analysis?.tier || 'Low';
            const isLatest = index === 0;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyItem, isLatest && styles.historyItemLatest]}
                onPress={() =>
                  navigation.navigate('PhysicianReview', {
                    assessmentId: item.id,
                    patient,
                  })
                }
                activeOpacity={INTERACTION.pressOpacity}
                accessibilityRole="button"
                accessibilityLabel={`${t('assessmentLabel')} #${item.id.slice(0, 8)}, ${tier} risk, ${item.status}`}
              >
                <View style={styles.historyItemLeft}>
                  <View style={styles.timelineNode}>
                    <View
                      style={[
                        styles.timelineDot,
                        isLatest && styles.timelineDotActive,
                      ]}
                    />
                  </View>
                  <View style={styles.historyItemDetails}>
                    <View style={styles.historyItemTitleRow}>
                      <Text style={[styles.historyDate, isHindi && styles.labelHindi]}>
                        {formatClinicalDateTime(item.completed_at || item.started_at, language)}
                      </Text>
                      <View style={styles.idBadge}>
                        <Text style={styles.idBadgeText}>#{item.id.slice(0, 8)}</Text>
                      </View>
                    </View>
                    {item.risk_analysis ? (
                      <Text style={[styles.historyScoreText, isHindi && styles.captionHindi]}>
                        {t('totalScore')}: {item.risk_analysis.totalScore} {t('points')} • {t('baselineRisk')}: +{item.risk_analysis.brm.score}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.historyBadges}>
                  <RiskBadge tier={tier} size="sm" />
                  <StatusBadge status={item.status} />
                  <Text style={styles.historyViewText}>→</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  // 5. Clinical Audit Trail
  const renderAuditTrail = () => {
    if (auditEvents.length === 0) return null;
    return (
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, isHindi && styles.headingHindi]}>
          {t('keyFindingsTitle')}
        </Text>
        <View style={styles.auditTimeline}>
          {auditEvents.map((evt, idx) => (
            <View key={evt.id} style={styles.auditRow}>
              <View style={styles.auditNodeCol}>
                <View style={styles.auditNodeDot} />
                {idx < auditEvents.length - 1 && <View style={styles.auditNodeLine} />}
              </View>
              <View style={styles.auditContentCol}>
                <Text style={[styles.auditTitle, isHindi && styles.bodyHindi]}>
                  {evt.title}
                </Text>
                <Text style={styles.auditTimestamp}>
                  {formatClinicalDateTime(evt.timestamp, language)}
                  {evt.actor ? ` • ${t('reviewedByLabel')} ${evt.actor}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 2. Latest Assessment Risk Summary
  const renderLatestRiskSummary = () => {
    if (!latestAssessment || !latestAssessment.risk_analysis || !latestRiskVisual) return null;
    return (
      <View
        style={[
          styles.riskHeroCard,
          { borderColor: latestRiskVisual.border, backgroundColor: latestRiskVisual.bg },
        ]}
      >
        <View style={styles.riskTopRow}>
          <View style={styles.riskHeadingCol}>
            <Text style={[styles.riskHeroCaption, isHindi && styles.captionHindi]}>
              {t('latestClinicalRiskSummary')}
            </Text>
            <View style={styles.riskBadgeTitleRow}>
              <View
                style={[
                  styles.riskSymbolPill,
                  { backgroundColor: latestRiskVisual.color },
                ]}
              >
                <Text style={styles.riskSymbolText}>{latestRiskVisual.symbol}</Text>
              </View>
              <Text
                style={[
                  styles.riskHeroTitle,
                  { color: latestRiskVisual.color },
                  isHindi && styles.titleHindi,
                ]}
              >
                {getTierDisplay(latestAssessment.risk_analysis.tier)}
              </Text>
            </View>
          </View>
          <RiskBadge tier={latestAssessment.risk_analysis.tier} size="lg" />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>
              {latestAssessment.risk_analysis.totalScore}
            </Text>
            <Text style={[styles.metricLabel, isHindi && styles.labelHindi]}>
              {t('totalScore')}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>
              +{latestAssessment.risk_analysis.brm.score}
            </Text>
            <Text style={[styles.metricLabel, isHindi && styles.labelHindi]}>
              {t('baselineRisk')}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <StatusBadge status={latestAssessment.status} />
            <Text style={[styles.metricLabel, isHindi && styles.labelHindi]}>
              {t('workflowStatus')}
            </Text>
          </View>
        </View>

        {latestAssessment.risk_analysis.recommendation ? (
          <View style={styles.recBox}>
            <Text style={[styles.recTitle, isHindi && styles.captionHindi]}>
              {t('recommendationLabel')}
            </Text>
            <Text style={[styles.recText, isHindi && styles.boldHindi]}>
              {getLocalizedRecommendation(
                latestAssessment.risk_analysis.recommendation,
                latestAssessment.risk_analysis.tier
              )}
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          title={t('openCompleteDossier')}
          onPress={() =>
            navigation.navigate('PhysicianReview', {
              assessmentId: latestAssessment.id,
              patient,
            })
          }
          style={styles.openDossierBtn}
        />
      </View>
    );
  };

  // 3. Quick Clinical Actions Card
  const renderQuickActions = () => (
    <View style={styles.actionCard}>
      <Text style={[styles.actionCardTitle, isHindi && styles.headingHindi]}>
        {t('status')}
      </Text>
      <PrimaryButton
        title={`+ ${t('newPatientAssessment')}`}
        onPress={() => navigation.navigate('AssessmentStart', { patient })}
        style={styles.actionBtnPrimary}
      />
      <SecondaryButton
        title={`← ${t('backToDashboard')}`}
        onPress={() => navigation.goBack()}
        style={styles.actionBtnSecondary}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ClinicalHeader
        title={t('patientMedicalRecord')}
        subtitle={`${displayName} • ${patientCode}`}
        onBack={() => navigation.goBack()}
        backLabel={t('backToDashboard')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.contentWrap, isLandscape && styles.contentWrapLandscape]}>
          {isLandscape ? (
            <>
              {/* Landscape Workstation: 2-column split (Left: Dossier + Timeline + Audit, Right: Latest Risk + Quick Actions) */}
              <View style={styles.leftCol}>
                {renderPatientDossier()}
                {renderAssessmentTimeline()}
                {renderAuditTrail()}
              </View>
              <View style={styles.rightCol}>
                {renderLatestRiskSummary()}
                {renderQuickActions()}
              </View>
            </>
          ) : (
            /* Portrait Workstation: Exact Logical Stack Sequence
             * 1. Patient Dossier
             * 2. Latest Risk Summary
             * 3. Quick Actions
             * 4. Assessment Timeline
             * 5. Audit Trail
             */
            <View style={styles.fullWidthCol}>
              {renderPatientDossier()}
              {renderLatestRiskSummary()}
              {renderQuickActions()}
              {renderAssessmentTimeline()}
              {renderAuditTrail()}
            </View>
          )}
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
  center: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
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
  newAssessBtn: {
    minHeight: TOUCH_TARGETS.minTouchTarget,
    paddingHorizontal: SPACING.lg,
  },
  sectionCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  countPill: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryLight,
  },
  emptyNote: {
    color: ClinicalTheme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  historyList: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    minHeight: 64,
  },
  historyItemLatest: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderLeftWidth: 4,
    borderLeftColor: ClinicalTheme.colors.primaryAccent,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  timelineNode: {
    width: 14,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ClinicalTheme.colors.borderMedium,
  },
  timelineDotActive: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyItemDetails: {
    flex: 1,
  },
  historyItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  idBadge: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ClinicalTheme.colors.textMuted,
  },
  historyScoreText: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  historyBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyViewText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 4,
  },
  auditTimeline: {
    marginTop: SPACING.md,
    gap: 0,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  auditNodeCol: {
    width: 20,
    alignItems: 'center',
  },
  auditNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    marginTop: 4,
  },
  auditNodeLine: {
    width: 2,
    flex: 1,
    backgroundColor: ClinicalTheme.colors.borderMedium,
    marginVertical: 4,
    minHeight: 28,
  },
  auditContentCol: {
    flex: 1,
    paddingBottom: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    lineHeight: 18,
  },
  auditTimestamp: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
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
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metricBox: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  recBox: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderLeftWidth: 4,
    borderLeftColor: ClinicalTheme.colors.primaryAccent,
    padding: SPACING.md,
    borderRadius: RADIUS.xs,
    marginBottom: SPACING.lg,
  },
  recTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryLight,
    textTransform: 'uppercase',
  },
  recText: {
    fontSize: 14,
    color: ClinicalTheme.colors.textPrimary,
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 20,
  },
  openDossierBtn: {
    minHeight: TOUCH_TARGETS.primaryAction, // 60dp
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
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    marginBottom: SPACING.xs,
  },
  actionBtnPrimary: {
    minHeight: TOUCH_TARGETS.primaryAction, // 60dp
  },
  actionBtnSecondary: {
    minHeight: TOUCH_TARGETS.secondaryAction, // 56dp
  },
  headingHindi: {
    lineHeight: 24,
  },
  titleHindi: {
    lineHeight: 32,
  },
  labelHindi: {
    lineHeight: 18,
  },
  captionHindi: {
    lineHeight: 16,
  },
  bodyHindi: {
    lineHeight: 20,
  },
  boldHindi: {
    lineHeight: 22,
  },
});
