import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
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
import { RiskBadge, StatusBadge } from '../components/ClinicalBadges';
import { EmptyState, LoadingState } from '../components/ClinicalStates';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentHistory'>;

type FilterKey = 'ALL' | 'PENDING' | 'VALIDATED' | 'REASSESSMENT' | 'URGENT';

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

export const AssessmentHistoryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';
  const { isLandscape } = useResponsiveLayout();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle KPI deep-links and initialization
  const initialFilter = (route.params as any)?.initialFilter as FilterKey | undefined;
  const [activeFilter, setActiveFilter] = useState<FilterKey>(initialFilter || 'ALL');

  useEffect(() => {
    const f = (route.params as any)?.initialFilter as FilterKey | undefined;
    if (f) {
      setActiveFilter(f);
    }
  }, [(route.params as any)?.initialFilter]);

  const loadAssessments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await ApiService.getDoctorAssessments();
      setAssessments(data || []);
    } catch (err) {
      console.warn('[AssessmentHistory] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments(false);

    // Subscribe to realtime clinical assessment changes
    const unsubscribe = realtimeManager.subscribe(event => {
      if (
        event.type === 'ASSESSMENT_SUBMITTED' ||
        event.type === 'ASSESSMENT_VALIDATED' ||
        event.type === 'ASSESSMENT_REASSESSMENT'
      ) {
        loadAssessments(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadAssessments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssessments(true);
  };

  // Filter logic maintaining exact clinical status requirements
  const filteredAssessments = useMemo(() => {
    if (activeFilter === 'PENDING') {
      return assessments.filter(
        a => a.status === 'PENDING_DOCTOR_REVIEW' || a.status === 'COMPLETED'
      );
    }
    if (activeFilter === 'VALIDATED') {
      return assessments.filter(a => a.status === 'DOCTOR_VALIDATED');
    }
    if (activeFilter === 'REASSESSMENT') {
      return assessments.filter(a => a.status === 'REASSESSMENT_REQUESTED');
    }
    if (activeFilter === 'URGENT') {
      return assessments.filter(
        a => a.risk_analysis?.tier === 'Urgent' || a.risk_analysis?.tier === 'High'
      );
    }
    return assessments;
  }, [assessments, activeFilter]);

  // Search filter across patient name, code, or assessment ID
  const displayedAssessments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return filteredAssessments;
    return filteredAssessments.filter(item => {
      const p = item.patient || item.patients;
      const name = (p?.full_name || p?.name || '').toLowerCase();
      const code = (p?.patient_code || '').toLowerCase();
      const id = item.id.toLowerCase();
      return name.includes(q) || code.includes(q) || id.includes(q);
    });
  }, [filteredAssessments, searchQuery]);

  // Counts for quick queue statistics
  const pendingCount = useMemo(
    () => assessments.filter(a => a.status === 'PENDING_DOCTOR_REVIEW' || a.status === 'COMPLETED').length,
    [assessments]
  );
  const validatedCount = useMemo(
    () => assessments.filter(a => a.status === 'DOCTOR_VALIDATED').length,
    [assessments]
  );
  const reassessmentCount = useMemo(
    () => assessments.filter(a => a.status === 'REASSESSMENT_REQUESTED').length,
    [assessments]
  );
  const urgentCount = useMemo(
    () => assessments.filter(a => a.risk_analysis?.tier === 'Urgent' || a.risk_analysis?.tier === 'High').length,
    [assessments]
  );

  const filterTabs = [
    { key: 'ALL', label: t('allRecords'), count: assessments.length },
    { key: 'PENDING', label: t('pendingReview'), count: pendingCount },
    { key: 'VALIDATED', label: t('validated'), count: validatedCount },
    { key: 'REASSESSMENT', label: t('statusReassessmentRequested'), count: reassessmentCount },
    { key: 'URGENT', label: t('priorityClinicalTriage'), count: urgentCount },
  ];

  const renderQueueSummary = (isPortraitMode = false) => (
    <View style={[styles.queueStatsCard, isPortraitMode && styles.queueStatsCardPortrait]}>
      <View style={styles.queueStatsHeader}>
        <Text style={[styles.queueStatsTitle, isHindi && styles.headingHindi]}>
          {t('reviewStatus')}
        </Text>
        <View style={styles.liveIndicatorPill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('statusLive')}</Text>
        </View>
      </View>

      <View style={[styles.queueCardsList, isPortraitMode && styles.queueCardsListPortrait]}>
        {filterTabs.map(tab => {
          const isTabActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.queueMetricCard,
                isPortraitMode && styles.queueMetricCardPortraitItem,
                isTabActive && styles.queueMetricCardActive,
              ]}
              onPress={() => setActiveFilter(tab.key as any)}
              activeOpacity={INTERACTION.pressOpacity}
              accessibilityRole="button"
              accessibilityState={{ selected: isTabActive }}
              accessibilityLabel={`${tab.label}: ${tab.count}`}
            >
              <View style={styles.queueMetricRow}>
                <Text
                  style={[
                    styles.queueMetricLabel,
                    isTabActive && styles.queueMetricLabelActive,
                    isHindi && styles.labelHindi,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.queueMetricCountPill,
                    isTabActive && styles.queueMetricCountPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.queueMetricCountText,
                      isTabActive && styles.queueMetricCountTextActive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ClinicalHeader
        title={t('assessmentHistoryTitle')}
        subtitle={t('assessmentHistorySub')}
        onBack={() => navigation.goBack()}
        backLabel={t('backToDashboard')}
      />

      {/* Control Bar: Search and Filter Tabs */}
      <View style={styles.controlBar}>
        <View style={styles.controlBarInner}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, isHindi && styles.inputHindi]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`${t('search')}...`}
              placeholderTextColor={ClinicalTheme.colors.textLight}
              accessibilityLabel={t('search')}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.searchClearBtn}
                accessibilityRole="button"
                accessibilityLabel={t('cancel')}
              >
                <Text style={styles.searchClearText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterWrap}
          >
            {filterTabs.map(tab => {
              const isActive = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setActiveFilter(tab.key as any)}
                  activeOpacity={INTERACTION.pressOpacity}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${tab.label} (${tab.count})`}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isActive && styles.filterTabTextActive,
                      isHindi && styles.tabTextHindi,
                    ]}
                  >
                    {tab.label} ({tab.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ClinicalTheme.colors.primaryAccent}
          />
        }
      >
        <View style={[styles.contentWrap, isLandscape && styles.contentWrapLandscape]}>
          {/* Main Records Area (Left ~75% in landscape) */}
          <View style={isLandscape ? styles.mainColumn : styles.fullWidthColumn}>
            {!isLandscape && renderQueueSummary(true)}
            {loading ? (
              <LoadingState message={t('loadingRecords')} />
            ) : displayedAssessments.length === 0 ? (
              <EmptyState
                title={t('noAssessmentRecords')}
                subtitle={
                  activeFilter === 'ALL'
                    ? t('noAssessmentsOnAccount')
                    : t('noRecordsMatchingFilter', {
                        filter:
                          activeFilter === 'PENDING'
                            ? t('pendingReview')
                            : activeFilter === 'VALIDATED'
                            ? t('validated')
                            : activeFilter === 'URGENT'
                            ? t('priorityClinicalTriage')
                            : t('statusReassessmentRequested'),
                      })
                }
              />
            ) : isLandscape ? (
              /* High-Density Landscape Clinical Table */
              <View style={styles.tableCard}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, styles.thPatient]}>{t('patientLabel')}</Text>
                  <Text style={[styles.thCell, styles.thCode]}>{t('patientCodeHeading')}</Text>
                  <Text style={[styles.thCell, styles.thDemographics]}>{t('profile')}</Text>
                  <Text style={[styles.thCell, styles.thRisk]}>{t('riskLevel')}</Text>
                  <Text style={[styles.thCell, styles.thStatus]}>{t('status')}</Text>
                  <Text style={[styles.thCell, styles.thDate]}>{t('date')}</Text>
                  <Text style={[styles.thCell, styles.thAction]}>{t('filter')}</Text>
                </View>

                {displayedAssessments.map((item, index) => {
                  const p = item.patient || item.patients;
                  const displayName = getPatientDisplayName(p);
                  const patientCode = getPatientCodeDisplay(p);
                  const initial = displayName.charAt(0).toUpperCase();
                  const tier = item.risk_analysis?.tier || 'Low';

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        index % 2 === 1 && styles.tableRowAlt,
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.tdCell, styles.thPatient, styles.patientTdCol]}
                        onPress={() => {
                          const pid = p?.id || (item as any).patient_id;
                          if (pid) {
                            navigation.navigate('PatientDetail', { patientId: pid });
                          }
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${displayName}, ${t('patientMedicalRecord')}`}
                      >
                        <View style={styles.avatarMini}>
                          <Text style={styles.avatarMiniText}>{initial}</Text>
                        </View>
                        <View style={styles.patientNameBlock}>
                          <Text style={[styles.tableNameText, isHindi && styles.nameHindi]} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={styles.tableIdText}>#{item.id.slice(0, 8)}</Text>
                        </View>
                      </TouchableOpacity>

                      <View style={[styles.tdCell, styles.thCode]}>
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>{patientCode}</Text>
                        </View>
                      </View>

                      <View style={[styles.tdCell, styles.thDemographics]}>
                        <Text style={[styles.tableSubText, isHindi && styles.captionHindi]}>
                          {p?.age ? `${p.age}y` : '—'} • {p?.gender === 'Female' ? t('genderFemale') : p?.gender === 'Male' ? t('genderMale') : t('genderOther')}
                        </Text>
                      </View>

                      <View style={[styles.tdCell, styles.thRisk]}>
                        <RiskBadge tier={tier} size="sm" />
                      </View>

                      <View style={[styles.tdCell, styles.thStatus]}>
                        <StatusBadge status={item.status} />
                      </View>

                      <View style={[styles.tdCell, styles.thDate]}>
                        <Text style={styles.tableDateText}>
                          {formatClinicalDateTime(item.completed_at || item.started_at, language)}
                        </Text>
                      </View>

                      <View style={[styles.tdCell, styles.thAction]}>
                        <TouchableOpacity
                          style={styles.reviewBtnPill}
                          onPress={() =>
                            navigation.navigate('PhysicianReview', {
                              assessmentId: item.id,
                              patient: p,
                            })
                          }
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`${t('reviewFile')}: ${displayName}`}
                        >
                          <Text style={[styles.reviewBtnText, isHindi && styles.labelHindi]}>
                            {t('reviewFile')} →
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              /* Compact / Portrait Card List */
              <View style={styles.recordsList}>
                {displayedAssessments.map(item => {
                  const p = item.patient || item.patients;
                  const displayName = getPatientDisplayName(p);
                  const patientCode = getPatientCodeDisplay(p);
                  const initial = displayName.charAt(0).toUpperCase();
                  const tier = item.risk_analysis?.tier || 'Low';

                  return (
                    <View
                      key={item.id}
                      style={styles.recordCard}
                    >
                      <TouchableOpacity
                        style={styles.recordLeftCol}
                        onPress={() => {
                          const pid = p?.id || (item as any).patient_id;
                          if (pid) {
                            navigation.navigate('PatientDetail', { patientId: pid });
                          }
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${displayName}, ${t('patientMedicalRecord')}`}
                      >
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <View style={styles.recordDetails}>
                          <View style={styles.titleLine}>
                            <Text style={[styles.patientName, isHindi && styles.nameHindi]}>
                              {displayName}
                            </Text>
                            <Text style={styles.patientCode}>{patientCode}</Text>
                            <View style={styles.idBadge}>
                              <Text style={styles.idBadgeText}>#{item.id.slice(0, 8)}</Text>
                            </View>
                          </View>
                          <Text style={[styles.demographicsText, isHindi && styles.captionHindi]}>
                            {p?.age ? `${p.age} ${t('years')} • ` : ''}
                            {p?.gender === 'Female' ? t('genderFemale') : p?.gender === 'Male' ? t('genderMale') : t('genderOther')} • {formatClinicalDateTime(item.completed_at || item.started_at, language)}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.recordRightCol}
                        onPress={() =>
                          navigation.navigate('PhysicianReview', {
                            assessmentId: item.id,
                            patient: p,
                          })
                        }
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('reviewFile')}: ${displayName}`}
                      >
                        <RiskBadge tier={tier} size="md" />
                        <StatusBadge status={item.status} />
                        <Text style={[styles.viewLinkText, isHindi && styles.labelHindi]}>
                          {t('reviewFile')} →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Quick Filter Queue Stats (Right ~25% in landscape) */}
          {isLandscape && (
            <View style={styles.sideColumn}>
              {renderQueueSummary(false)}
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
  controlBar: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderDefault,
  },
  controlBarInner: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    paddingHorizontal: SPACING.md,
    minHeight: TOUCH_TARGETS.minTouchTarget,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: ClinicalTheme.colors.textPrimary,
    minHeight: 44,
  },
  searchClearBtn: {
    padding: 6,
  },
  searchClearText: {
    fontSize: 14,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '700',
  },
  filterWrap: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterTab: {
    minHeight: TOUCH_TARGETS.minTouchTarget,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: ClinicalTheme.colors.primary,
    borderColor: ClinicalTheme.colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: ClinicalTheme.colors.textWhite,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 64,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  contentWrapLandscape: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xl,
  },
  mainColumn: {
    flex: 0.68,
    minWidth: 0,
  },
  sideColumn: {
    flex: 0.32,
    gap: SPACING.lg,
  },
  fullWidthColumn: {
    width: '100%',
  },
  tableCard: {
    width: '100%',
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    overflow: 'hidden',
    ...ClinicalTheme.shadows.card,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderBottomWidth: 1.5,
    borderBottomColor: ClinicalTheme.colors.borderMedium,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  thCell: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  thPatient: {
    flex: 1.8,
  },
  thCode: {
    flex: 1.1,
  },
  thDemographics: {
    flex: 0.9,
  },
  thRisk: {
    flex: 1.1,
  },
  thStatus: {
    flex: 1.1,
  },
  thDate: {
    flex: 1.25,
  },
  thAction: {
    flex: 1.25,
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderDefault,
    minHeight: 58,
  },
  tableRowAlt: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
  },
  tdCell: {
    justifyContent: 'center',
  },
  patientTdCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  patientNameBlock: {
    flex: 1,
  },
  tableNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  tableIdText: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '600',
  },
  codePill: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    alignSelf: 'flex-start',
  },
  codePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  tableSubText: {
    fontSize: 12,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '500',
  },
  tableDateText: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  reviewBtnPill: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
  },
  recordsList: {
    gap: SPACING.md,
  },
  recordCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...ClinicalTheme.shadows.card,
  },
  recordLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  recordDetails: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  patientCode: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  idBadge: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ClinicalTheme.colors.textMuted,
  },
  demographicsText: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  recordRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  viewLinkText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  queueStatsCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  queueStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderDefault,
  },
  queueStatsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: 0.3,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.riskLowBorder,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ClinicalTheme.colors.riskLow,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: ClinicalTheme.colors.riskLow,
  },
  queueCardsList: {
    gap: SPACING.sm,
  },
  queueStatsCardPortrait: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  queueCardsListPortrait: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  queueMetricCardPortraitItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  queueMetricCard: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderDefault,
    minHeight: TOUCH_TARGETS.minTouchTarget,
    justifyContent: 'center',
  },
  queueMetricCardActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  queueMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueMetricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  queueMetricLabelActive: {
    color: ClinicalTheme.colors.primaryLight,
  },
  queueMetricCountPill: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    minWidth: 28,
    alignItems: 'center',
  },
  queueMetricCountPillActive: {
    backgroundColor: ClinicalTheme.colors.primary,
    borderColor: ClinicalTheme.colors.primary,
  },
  queueMetricCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  queueMetricCountTextActive: {
    color: ClinicalTheme.colors.textWhite,
  },
  tabTextHindi: {
    lineHeight: 18,
  },
  nameHindi: {
    lineHeight: 20,
  },
  captionHindi: {
    lineHeight: 16,
  },
  labelHindi: {
    lineHeight: 16,
  },
  headingHindi: {
    lineHeight: 20,
  },
  inputHindi: {
    lineHeight: 20,
  },
});
