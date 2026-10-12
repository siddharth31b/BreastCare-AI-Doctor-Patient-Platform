import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Patient, Assessment, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { TABLET_ID } from '../config/constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useLanguage, LanguageSwitcher } from '../i18n/LanguageContext';
import { useRealtimeDashboard } from '../realtime';
import {
  ClinicalTheme,
  SPACING,
  RADIUS,
  TOUCH_TARGETS,
  TABLET_LAYOUT,
  ACCESSIBILITY,
  useResponsiveLayout,
} from '../theme';
import { RiskBadge, StatusBadge } from '../components/ClinicalBadges';
import { EmptyState, ErrorState, LoadingState } from '../components/ClinicalStates';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function getGreeting(language: string): string {
  const hour = new Date().getHours();
  if (language === 'hi') {
    if (hour < 12) return 'शुभ प्रभात';
    if (hour < 17) return 'शुभ दोपहर';
    return 'शुभ संध्या';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeTime(dateStr?: string, language?: string): string {
  if (!dateStr) return language === 'hi' ? 'हाल ही में' : 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diffMs) || diffMs < 0) return language === 'hi' ? 'अभी' : 'Just now';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return language === 'hi' ? 'अभी' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return language === 'hi' ? `${diffMin} मि. पहले` : `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return language === 'hi' ? `${diffHour} घंटे पहले` : `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return language === 'hi' ? `${diffDay} दिन पहले` : `${diffDay}d ago`;
}

function formatClinicalDateTime(dateStr?: string, language?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const isHi = language === 'hi';
  const day = d.getDate();
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsHi = ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सितं', 'अक्तू', 'नवं', 'दिसं'];
  const month = isHi ? monthsHi[d.getMonth()] : monthsEn[d.getMonth()];
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = isHi ? (hours >= 12 ? 'अपराह्न' : 'पूर्वाह्न') : (hours >= 12 ? 'PM' : 'AM');
  hours = hours % 12 || 12;
  return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
}

interface KpiConfig {
  id: string;
  categoryTagEn: string;
  categoryTagHi: string;
  actionLabelEn: string;
  actionLabelHi: string;
  labelKey: 'activePatients' | 'pendingReviews' | 'validatedAssessments' | 'priorityClinicalTriage';
  subKey: 'activeRegisteredPatients' | 'pendingDoctorReviewSub' | 'validatedRecords' | 'urgentHighRisk';
  accentColor: string;
  bgColor: string;
  borderColor: string;
  filter: 'ALL' | 'PENDING' | 'VALIDATED' | 'URGENT';
  getCount: (stats: { totalPatients: number; pendingReviews: number; validatedAssessments: number; urgentOrHighRisk: number }) => number;
}

const KPI_CARDS: KpiConfig[] = [
  {
    id: 'active',
    categoryTagEn: 'TOTAL PATIENTS',
    categoryTagHi: 'कुल मरीज़',
    actionLabelEn: 'View All →',
    actionLabelHi: 'सभी देखें →',
    labelKey: 'activePatients',
    subKey: 'activeRegisteredPatients',
    accentColor: ClinicalTheme.colors.primaryLight,
    bgColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    filter: 'ALL',
    getCount: s => s.totalPatients,
  },
  {
    id: 'pending',
    categoryTagEn: 'ACTION REQUIRED',
    categoryTagHi: 'समीक्षा आवश्यक',
    actionLabelEn: 'Review →',
    actionLabelHi: 'समीक्षा करें →',
    labelKey: 'pendingReviews',
    subKey: 'pendingDoctorReviewSub',
    accentColor: ClinicalTheme.colors.riskModerate,
    bgColor: ClinicalTheme.colors.riskModerateBg,
    borderColor: ClinicalTheme.colors.riskModerateBorder,
    filter: 'PENDING',
    getCount: s => s.pendingReviews,
  },
  {
    id: 'validated',
    categoryTagEn: 'VERIFIED',
    categoryTagHi: 'सत्यापित',
    actionLabelEn: 'Records →',
    actionLabelHi: 'रिकॉर्ड्स →',
    labelKey: 'validatedAssessments',
    subKey: 'validatedRecords',
    accentColor: ClinicalTheme.colors.riskLow,
    bgColor: ClinicalTheme.colors.riskLowBg,
    borderColor: ClinicalTheme.colors.riskLowBorder,
    filter: 'VALIDATED',
    getCount: s => s.validatedAssessments,
  },
  {
    id: 'urgent',
    categoryTagEn: 'HIGH RISK / URGENT',
    categoryTagHi: 'उच्च जोखिम / तत्काल',
    actionLabelEn: 'Triage Now →',
    actionLabelHi: 'त्रिएज करें →',
    labelKey: 'priorityClinicalTriage',
    subKey: 'urgentHighRisk',
    accentColor: ClinicalTheme.colors.riskUrgent,
    bgColor: ClinicalTheme.colors.riskUrgentBg,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    filter: 'URGENT',
    getCount: s => s.urgentOrHighRisk,
  },
];

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { isLandscape } = useResponsiveLayout();
  const isHindi = language === 'hi';

  const {
    patients,
    assessments,
    stats,
    loading,
    refreshing,
    syncStatusText,
    isLive,
    error,
    refresh,
  } = useRealtimeDashboard(true);

  const latestAssessmentByPatient = useMemo(() => {
    const map = new Map<string, Assessment>();
    for (const a of assessments) {
      const existing = map.get(a.patient_id);
      if (!existing || new Date(a.started_at) > new Date(existing.started_at)) {
        map.set(a.patient_id, a);
      }
    }
    return map;
  }, [assessments]);

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle'),
      t('logoutConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const doctorName = user?.name
    ? user.name.startsWith('Dr.')
      ? user.name
      : `${t('drPrefix')} ${user.name}`
    : t('doctor');

  const doctorGreeting = `${getGreeting(language)}, ${doctorName}`;

  const formatGender = (g?: string) => {
    if (!g) return t('genderFemale');
    const gl = g.toLowerCase();
    if (gl === 'female') return t('genderFemale');
    if (gl === 'male') return t('genderMale');
    return t('genderOther');
  };

  const localizedSyncStatus = isLive
    ? syncStatusText.includes('just now')
      ? t('syncedJustNow')
      : t('statusLive')
    : syncStatusText === 'Offline'
    ? t('offline')
    : t('connecting');

  const pendingLabel = stats.pendingReviews > 0
    ? `${t('assessmentHistory')} (${stats.pendingReviews})`
    : t('assessmentHistory');

  return (
    <View style={styles.container}>
      {/* ============================================================ */}
      {/* 1. CLINICAL COMMAND HEADER                                   */}
      {/* ============================================================ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>BC</Text>
          </View>
          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>{t('appTitle')}</Text>
              <View style={styles.wsBadge}>
                <Text style={styles.wsBadgeText}>Workstation</Text>
              </View>
            </View>
            <Text
              style={[styles.greetingText, isHindi && styles.greetingTextHindi]}
              numberOfLines={1}
            >
              {doctorGreeting}
            </Text>
            <View style={styles.headerMetaRow}>
              <View
                style={[
                  styles.syncPill,
                  {
                    backgroundColor: isLive
                      ? ClinicalTheme.colors.riskLowBg
                      : ClinicalTheme.colors.statusPendingBg,
                    borderColor: isLive
                      ? ClinicalTheme.colors.riskLowBorder
                      : ClinicalTheme.colors.statusPendingBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.syncDot,
                    {
                      backgroundColor: isLive
                        ? ClinicalTheme.colors.statusLive
                        : ClinicalTheme.colors.statusPending,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.syncPillText,
                    {
                      color: isLive
                        ? ClinicalTheme.colors.riskLow
                        : ClinicalTheme.colors.statusPending,
                    },
                  ]}
                >
                  {isLive ? t('liveSyncActive') : t('connecting')}
                </Text>
              </View>
              <View style={styles.terminalPill}>
                <Text style={styles.terminalPillText}>
                  {t('station')} {TABLET_ID}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <LanguageSwitcher />
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerBtn,
                stats.pendingReviews > 0 && styles.headerBtnAlert,
              ]}
              onPress={() => navigation.navigate('AssessmentHistory')}
              activeOpacity={0.8}
              hitSlop={ACCESSIBILITY.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={pendingLabel}
            >
              <Text
                style={[
                  styles.headerBtnText,
                  stats.pendingReviews > 0 && styles.headerBtnTextAlert,
                ]}
              >
                {pendingLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
              hitSlop={ACCESSIBILITY.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={t('signOut')}
            >
              <Text style={styles.signOutBtnText}>{t('signOut')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 2. MAIN SCROLL CANVAS                                        */}
      {/* ============================================================ */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={ClinicalTheme.colors.primaryAccent}
          />
        }
      >
        <View style={styles.contentContainer}>
          {/* ============================================================ */}
          {/* 3. FOUR INTERACTIVE MEDICAL KPI CARDS                        */}
          {/* ============================================================ */}
          <View
            style={[
              styles.kpiContainer,
              isLandscape ? styles.kpiContainerLandscape : styles.kpiContainerPortrait,
            ]}
          >
            {KPI_CARDS.map(card => {
              const count = loading ? null : card.getCount(stats);
              const categoryTag = isHindi ? card.categoryTagHi : card.categoryTagEn;
              const actionLabel = isHindi ? card.actionLabelHi : card.actionLabelEn;
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.kpiCard,
                    isLandscape ? styles.kpiCardLandscape : styles.kpiCardPortrait,
                    {
                      backgroundColor: card.bgColor,
                      borderColor: card.borderColor,
                      borderLeftColor: card.accentColor,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('AssessmentHistory', {
                      initialFilter: card.filter,
                    })
                  }
                  activeOpacity={0.76}
                  accessibilityRole="button"
                  accessibilityLabel={`${t(card.labelKey)}: ${count !== null ? count : 0}. ${actionLabel}`}
                >
                  <View style={styles.kpiTopRow}>
                    <View style={[styles.kpiCategoryBadge, { borderColor: card.borderColor }]}>
                      <View style={[styles.kpiCategoryDot, { backgroundColor: card.accentColor }]} />
                      <Text style={[styles.kpiCategoryText, { color: card.accentColor }]}>
                        {categoryTag}
                      </Text>
                    </View>
                    <View style={[styles.kpiActionPill, { borderColor: card.borderColor }]}>
                      <Text style={[styles.kpiActionText, { color: card.accentColor }]}>
                        {actionLabel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.kpiMiddleRow}>
                    <Text style={[styles.kpiCount, { color: card.accentColor }]}>
                      {count !== null ? count : '—'}
                    </Text>
                    <Text
                      style={[
                        styles.kpiLabel,
                        { color: card.accentColor },
                        isHindi && styles.kpiLabelHindi,
                      ]}
                      numberOfLines={2}
                    >
                      {t(card.labelKey)}
                    </Text>
                  </View>

                  <Text style={styles.kpiSub} numberOfLines={1}>
                    {t(card.subKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ============================================================ */}
          {/* 4. RESPONSIVE TWO-COLUMN WORKSTATION LAYOUT                  */}
          {/* ============================================================ */}
          <View style={isLandscape ? styles.twoColumnRow : styles.singleColumn}>
            {/* ------------------------------------------------------------ */}
            {/* LEFT / PRIMARY AREA (~65%)                                   */}
            {/* ------------------------------------------------------------ */}
            <View
              style={[
                styles.leftColumn,
                isLandscape ? styles.leftColumnLandscape : styles.fullWidth,
              ]}
            >
              {/* Context Banner */}
              <View style={styles.contextBanner}>
                <View style={styles.contextDot} />
                <Text style={styles.contextText}>
                  {isHindi
                    ? 'क्लिनिकल स्टेशन सक्रिय • नया रोगी सेवन एवं त्रिएज हेतु तैयार'
                    : 'Clinical Workstation Online • Station Ready for Patient Intake & Triage'}
                </Text>
              </View>

              {/* Dominant Primary Hero CTA: START NEW PATIENT (64dp height) */}
              <TouchableOpacity
                style={styles.heroCta}
                onPress={() => navigation.navigate('NewPatient')}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={t('startNewPatient')}
              >
                <View style={styles.heroLeft}>
                  <View style={styles.heroIconCircle}>
                    <Text style={styles.heroPlus}>+</Text>
                  </View>
                  <View style={styles.heroText}>
                    <Text style={[styles.heroTitle, isHindi && styles.heroTitleHindi]}>
                      {t('startNewPatient')}
                    </Text>
                    <Text style={[styles.heroSub, isHindi && styles.heroSubHindi]}>
                      {t('startNewPatientSub')}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroAction}>
                  <Text style={styles.heroActionText}>+ {t('startNewPatientBtn')}</Text>
                </View>
              </TouchableOpacity>

              {/* Recent Patients Table / List */}
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <View>
                    <Text style={styles.sectionTitle}>{t('recentPatients')}</Text>
                    <Text style={[styles.sectionSub, isHindi && styles.sectionSubHindi]}>
                      {t('recentPatientsSubtitle')}
                    </Text>
                  </View>
                  <View style={styles.syncChip}>
                    <View
                      style={[
                        styles.syncChipDot,
                        {
                          backgroundColor: isLive
                            ? ClinicalTheme.colors.statusLive
                            : ClinicalTheme.colors.textMuted,
                        },
                      ]}
                    />
                    <Text style={styles.syncChipText}>{localizedSyncStatus}</Text>
                  </View>
                </View>

                {loading ? (
                  <LoadingState message={t('loadingRecords')} />
                ) : error ? (
                  <ErrorState title={t('networkError')} message={error} onRetry={refresh} />
                ) : patients.length === 0 ? (
                  <EmptyState
                    title={t('noPatients')}
                    subtitle={t('emptyDashboardPatients')}
                    actionTitle={`+ ${t('newPatientAssessment')}`}
                    onAction={() => navigation.navigate('NewPatient')}
                  />
                ) : isLandscape ? (
                  /* Tablet Landscape Clinical Table (7 Columns) */
                  <View style={styles.table}>
                    <View style={styles.tableHead}>
                      <Text style={[styles.th, { flex: 2.1 }]}>
                        {isHindi ? 'मरीज़' : 'PATIENT'}
                      </Text>
                      <Text style={[styles.th, { flex: 1.1 }]}>
                        {isHindi ? 'आईडी / कोड' : 'ID / CODE'}
                      </Text>
                      <Text style={[styles.th, { flex: 1.0 }]}>
                        {isHindi ? 'आयु / लिंग' : 'AGE / GENDER'}
                      </Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>
                        {isHindi ? 'त्रिएज जोखिम' : 'TRIAGE RISK'}
                      </Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>
                        {isHindi ? 'स्थिति' : 'STATUS'}
                      </Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>
                        {isHindi ? 'दिनांक / समय' : 'DATE / TIME'}
                      </Text>
                      <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>
                        {isHindi ? 'कार्रवाई' : 'ACTION'}
                      </Text>
                    </View>

                    {patients.map((p, idx) => {
                      const latestAssessment = latestAssessmentByPatient.get(p.id);
                      const displayName = getPatientDisplayName(p);
                      const patientCode = getPatientCodeDisplay(p);
                      const initial = displayName.charAt(0).toUpperCase();
                      const lastTime = formatRelativeTime(
                        latestAssessment?.completed_at || latestAssessment?.started_at || p.created_at,
                        language
                      );
                      const formattedDate = formatClinicalDateTime(
                        latestAssessment?.completed_at || latestAssessment?.started_at || p.created_at,
                        language
                      );
                      const isLast = idx === patients.length - 1;

                      return (
                        <View
                          key={p.id}
                          style={[styles.tableRow, isLast && styles.tableRowLast]}
                        >
                          {/* 1. Patient Name & Avatar */}
                          <TouchableOpacity
                            style={[styles.td, styles.tdPatient, { flex: 2.1 }]}
                            onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`${displayName}, ${t('patientMedicalRecord')}`}
                          >
                            <View style={styles.rowAvatar}>
                              <Text style={styles.rowAvatarText}>{initial}</Text>
                            </View>
                            <View style={styles.rowNameCol}>
                              <Text style={styles.rowName} numberOfLines={1}>
                                {displayName}
                              </Text>
                              <Text style={styles.rowTime}>{lastTime}</Text>
                            </View>
                          </TouchableOpacity>

                          {/* 2. Patient Code */}
                          <View style={[styles.td, { flex: 1.1 }]}>
                            <View style={styles.codeTag}>
                              <Text style={styles.codeTagText}>{patientCode}</Text>
                            </View>
                          </View>

                          {/* 3. Age & Gender */}
                          <View style={[styles.td, { flex: 1.0 }]}>
                            <Text style={styles.demoText}>
                              {p.age} {t('years')}
                            </Text>
                            <Text style={styles.demoSubText}>{formatGender(p.gender)}</Text>
                          </View>

                          {/* 4. Risk Tier */}
                          <View style={[styles.td, { flex: 1.2 }]}>
                            {latestAssessment?.risk_analysis?.tier ? (
                              <RiskBadge tier={latestAssessment.risk_analysis.tier} size="sm" />
                            ) : (
                              <View style={styles.noBadge}>
                                <Text style={styles.noBadgeText}>{t('pendingIntake')}</Text>
                              </View>
                            )}
                          </View>

                          {/* 5. Status */}
                          <View style={[styles.td, { flex: 1.2 }]}>
                            {latestAssessment?.status ? (
                              <StatusBadge status={latestAssessment.status} />
                            ) : (
                              <Text style={styles.noDataText}>—</Text>
                            )}
                          </View>

                          {/* 6. Date / Time */}
                          <View style={[styles.td, { flex: 1.2 }]}>
                            <Text style={styles.dateTimeText}>{formattedDate}</Text>
                          </View>

                          {/* 7. Action Button */}
                          <View style={[styles.td, { flex: 1.2, alignItems: 'flex-end' }]}>
                            {latestAssessment ? (
                              <TouchableOpacity
                                style={styles.rowActionBtn}
                                onPress={() =>
                                  navigation.navigate('PhysicianReview', {
                                    assessmentId: latestAssessment.id,
                                    patient: p,
                                  })
                                }
                                activeOpacity={0.8}
                                hitSlop={ACCESSIBILITY.hitSlop}
                                accessibilityRole="button"
                                accessibilityLabel={`${t('review')}: ${displayName} (${patientCode})`}
                              >
                                <Text style={styles.rowActionBtnText}>{t('review')}</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.rowStartBtn}
                                onPress={() =>
                                  navigation.navigate('AssessmentStart', { patient: p })
                                }
                                activeOpacity={0.8}
                                hitSlop={ACCESSIBILITY.hitSlop}
                                accessibilityRole="button"
                                accessibilityLabel={`${t('startAssessment')}: ${displayName} (${patientCode})`}
                              >
                                <Text style={styles.rowStartBtnText}>{t('startAssessment')}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  /* Portrait / Narrow View Patient Cards */
                  <View style={styles.cardGrid}>
                    {patients.map(p => {
                      const latestAssessment = latestAssessmentByPatient.get(p.id);
                      const displayName = getPatientDisplayName(p);
                      const patientCode = getPatientCodeDisplay(p);
                      const initial = displayName.charAt(0).toUpperCase();
                      const lastTime = formatRelativeTime(
                        latestAssessment?.completed_at || latestAssessment?.started_at || p.created_at,
                        language
                      );
                      const formattedDate = formatClinicalDateTime(
                        latestAssessment?.completed_at || latestAssessment?.started_at || p.created_at,
                        language
                      );

                      return (
                        <View key={p.id} style={styles.patientCard}>
                          <TouchableOpacity
                            style={styles.patientCardTop}
                            onPress={() => navigation.navigate('PatientDetail', { patientId: p.id })}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`${displayName}, ${t('patientMedicalRecord')}`}
                          >
                            <View style={styles.cardAvatar}>
                              <Text style={styles.cardAvatarText}>{initial}</Text>
                            </View>
                            <View style={styles.cardMeta}>
                              <Text style={styles.cardName} numberOfLines={1}>
                                {displayName}
                              </Text>
                              <Text style={styles.cardCode}>{patientCode}</Text>
                              <Text style={styles.cardDemo}>
                                {p.age} {t('years')} • {formatGender(p.gender)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          <View style={styles.cardBadges}>
                            {latestAssessment?.risk_analysis?.tier ? (
                              <RiskBadge tier={latestAssessment.risk_analysis.tier} size="sm" />
                            ) : (
                              <View style={styles.noBadge}>
                                <Text style={styles.noBadgeText}>{t('pendingIntake')}</Text>
                              </View>
                            )}
                            {latestAssessment?.status ? (
                              <StatusBadge status={latestAssessment.status} />
                            ) : null}
                            <Text style={styles.cardTime}>{formattedDate} ({lastTime})</Text>
                          </View>
                          <View style={styles.cardFooter}>
                            {latestAssessment ? (
                              <TouchableOpacity
                                style={styles.cardActionBtn}
                                onPress={() =>
                                  navigation.navigate('PhysicianReview', {
                                    assessmentId: latestAssessment.id,
                                    patient: p,
                                  })
                                }
                                activeOpacity={0.8}
                                accessibilityRole="button"
                                accessibilityLabel={`${t('review')}: ${displayName} (${patientCode})`}
                              >
                                <Text style={styles.cardActionBtnText}>{t('review')}</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.cardStartBtn}
                                onPress={() =>
                                  navigation.navigate('AssessmentStart', { patient: p })
                                }
                                activeOpacity={0.8}
                                accessibilityRole="button"
                                accessibilityLabel={`${t('startAssessment')}: ${displayName} (${patientCode})`}
                              >
                                <Text style={styles.cardStartBtnText}>{t('startAssessment')}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT / SECONDARY AREA (~35%)                                */}
            {/* ------------------------------------------------------------ */}
            <View
              style={[
                styles.rightColumn,
                isLandscape ? styles.rightColumnLandscape : styles.fullWidth,
              ]}
            >
              {/* Card 1: Doctor Station Profile */}
              <View style={styles.sideCard}>
                <View style={styles.sideCardHeadRow}>
                  <Text style={styles.sideCardTitle}>
                    {isHindi ? 'चिकित्सक एवं स्टेशन' : 'CLINICIAN & WORKSTATION'}
                  </Text>
                  <View style={styles.stationBadge}>
                    <Text style={styles.stationBadgeText}>{TABLET_ID}</Text>
                  </View>
                </View>
                <View style={styles.docProfile}>
                  <View style={styles.docAvatar}>
                    <Text style={styles.docAvatarText}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
                    </Text>
                  </View>
                  <View style={styles.docMeta}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {doctorName}
                    </Text>
                    <Text style={styles.docEmail} numberOfLines={1}>
                      {user?.email || 'Authenticated Clinician'}
                    </Text>
                    <View style={styles.roleChip}>
                      <Text style={styles.roleChipText}>
                        {isHindi ? 'स्क्रीनिंग चिकित्सक' : 'Screening Physician'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{isHindi ? 'स्टेशन आईडी:' : 'Terminal ID:'}</Text>
                  <Text style={styles.metaVal}>{TABLET_ID}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{isHindi ? 'प्रोटोकॉल:' : 'Protocol:'}</Text>
                  <Text style={styles.metaVal}>Multi-Phase BRM v1.0</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{isHindi ? 'प्रणाली मोड:' : 'Workstation Mode:'}</Text>
                  <Text style={styles.metaVal}>Tablet Landscape Triage</Text>
                </View>
              </View>

              {/* Card 2: Terminal Connectivity */}
              <View style={styles.sideCard}>
                <View style={styles.sideCardHeadRow}>
                  <Text style={styles.sideCardTitle}>
                    {isHindi ? 'स्टेशन कनेक्टिविटी' : 'TERMINAL CONNECTIVITY'}
                  </Text>
                  <View
                    style={[
                      styles.connDot,
                      {
                        backgroundColor: isLive
                          ? ClinicalTheme.colors.statusLive
                          : ClinicalTheme.colors.statusPending,
                      },
                    ]}
                  />
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{isHindi ? 'रीयल-टाइम ब्रिज:' : 'Realtime Bridge:'}</Text>
                  <Text
                    style={[
                      styles.metaVal,
                      {
                        color: isLive
                          ? ClinicalTheme.colors.riskLow
                          : ClinicalTheme.colors.statusPending,
                      },
                    ]}
                  >
                    {isLive
                      ? isHindi ? 'सक्रिय (लाइव)' : 'Active (Live)'
                      : isHindi ? 'कनेक्ट हो रहा है...' : 'Connecting...'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{isHindi ? 'अंतिम सिंक:' : 'Sync Status:'}</Text>
                  <Text style={styles.metaVal} numberOfLines={1}>
                    {localizedSyncStatus}
                  </Text>
                </View>
                <View style={styles.secureNote}>
                  <Text style={styles.secureNoteText}>
                    🔒 {isHindi ? 'एन्क्रिप्टेड स्टेशन टनल • स्थानीय डेटा सुरक्षित' : 'Encrypted Station Tunnel • Local Cache Protected'}
                  </Text>
                </View>
              </View>

              {/* Card 3: Clinical Actions & Priority Queue */}
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>
                  {isHindi ? 'त्वरित नैदानिक कार्रवाइयां' : 'CLINICAL ACTIONS & QUEUE'}
                </Text>

                {stats.pendingReviews > 0 ? (
                  <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() =>
                      navigation.navigate('AssessmentHistory', { initialFilter: 'PENDING' })
                    }
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Review ${stats.pendingReviews} pending assessments`}
                  >
                    <Text style={styles.alertBtnText}>
                      ⚠️ {isHindi ? `समीक्षा करें (${stats.pendingReviews} लंबित)` : `Review ${stats.pendingReviews} Pending Assessments`} →
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {stats.urgentOrHighRisk > 0 ? (
                  <TouchableOpacity
                    style={styles.urgentAlertBtn}
                    onPress={() =>
                      navigation.navigate('AssessmentHistory', { initialFilter: 'URGENT' })
                    }
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Triage ${stats.urgentOrHighRisk} urgent or high risk cases`}
                  >
                    <Text style={styles.urgentAlertBtnText}>
                      🚨 {isHindi ? `प्राथमिकता त्रिएज (${stats.urgentOrHighRisk} मामले)` : `Priority Triage (${stats.urgentOrHighRisk} High-Risk)`} →
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => navigation.navigate('NewPatient')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('startNewPatient')}
                >
                  <Text style={styles.primaryBtnText}>+ {t('startNewPatient')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => navigation.navigate('AssessmentHistory')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('assessmentHistory')}
                >
                  <Text style={styles.secondaryBtnText}>📋 {t('assessmentHistory')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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

  // -------------------------------------------------------------
  // HEADER
  // -------------------------------------------------------------
  header: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: SPACING.xxl,
    paddingTop: Platform.OS === 'android' ? 20 : 16,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.card,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: ClinicalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClinicalTheme.shadows.card,
  },
  logoText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandBlock: { flex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: ClinicalTheme.colors.primary,
    letterSpacing: -0.2,
  },
  wsBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: ClinicalTheme.colors.primarySoft,
  },
  wsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  greetingTextHindi: { lineHeight: 24 },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: SPACING.sm,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  syncDot: { width: 7, height: 7, borderRadius: 3.5 },
  syncPillText: { fontSize: 10, fontWeight: '700' },
  terminalPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  terminalPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  headerRight: { alignItems: 'flex-end', gap: SPACING.sm },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerBtn: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: SPACING.lg,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  headerBtnAlert: {
    borderColor: ClinicalTheme.colors.riskModerate,
    backgroundColor: ClinicalTheme.colors.riskModerateBg,
  },
  headerBtnText: {
    color: ClinicalTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  headerBtnTextAlert: { color: ClinicalTheme.colors.riskModerate },
  signOutBtn: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: SPACING.lg,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  signOutBtnText: {
    color: ClinicalTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  // -------------------------------------------------------------
  // MAIN SCROLL & CONTAINERS
  // -------------------------------------------------------------
  scrollContent: { padding: SPACING.xl },
  scrollContentLandscape: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xl,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },

  // -------------------------------------------------------------
  // KPI METRICS SECTION
  // -------------------------------------------------------------
  kpiContainer: {
    marginBottom: SPACING.xl,
  },
  kpiContainerLandscape: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  kpiContainerPortrait: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  kpiCard: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    minHeight: 114,
    justifyContent: 'space-between',
    ...ClinicalTheme.shadows.card,
  },
  kpiCardLandscape: {
    flex: 1,
  },
  kpiCardPortrait: {
    width: '48%',
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
  },
  kpiCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kpiCategoryText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  kpiActionPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
  },
  kpiActionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  kpiMiddleRow: {
    marginVertical: 2,
  },
  kpiCount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 15,
    marginTop: 2,
  },
  kpiLabelHindi: { lineHeight: 18, textTransform: 'none' },
  kpiSub: {
    fontSize: 10.5,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },

  // -------------------------------------------------------------
  // TWO-COLUMN RESPONSIVE LAYOUT
  // -------------------------------------------------------------
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xl,
  },
  singleColumn: { flexDirection: 'column', gap: SPACING.xl },
  leftColumn: { flex: 1, gap: SPACING.xl },
  leftColumnLandscape: { flex: 0.65 },
  rightColumn: { flex: 1 },
  rightColumnLandscape: { flex: 0.35 },
  fullWidth: { width: '100%' },

  // -------------------------------------------------------------
  // CONTEXT BANNER
  // -------------------------------------------------------------
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  contextDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ClinicalTheme.colors.primaryAccent,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
  },

  // -------------------------------------------------------------
  // HERO CTA: START NEW PATIENT (64dp height)
  // -------------------------------------------------------------
  heroCta: {
    backgroundColor: ClinicalTheme.colors.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryLight,
    ...ClinicalTheme.shadows.elevated,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    flex: 1,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlus: {
    fontSize: 28,
    color: ClinicalTheme.colors.textWhite,
    fontWeight: '300',
    lineHeight: 32,
  },
  heroText: { flex: 1 },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.textWhite,
    letterSpacing: -0.2,
  },
  heroTitleHindi: { lineHeight: 26 },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: 17,
  },
  heroSubHindi: { lineHeight: 20 },
  heroAction: {
    backgroundColor: ClinicalTheme.colors.secondary,
    paddingHorizontal: SPACING.xl,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    marginLeft: SPACING.md,
  },
  heroActionText: {
    color: ClinicalTheme.colors.textWhite,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // -------------------------------------------------------------
  // RECENT PATIENTS SECTION
  // -------------------------------------------------------------
  section: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.card,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
  },
  sectionSubHindi: { lineHeight: 19 },
  syncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
  },
  syncChipDot: { width: 7, height: 7, borderRadius: 3.5 },
  syncChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: ClinicalTheme.colors.textSecondary,
  },

  // -------------------------------------------------------------
  // CLINICAL TABLE (7 COLUMNS)
  // -------------------------------------------------------------
  table: { width: '100%' },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: 4,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderSubtle,
    minHeight: 64,
  },
  tableRowLast: { borderBottomWidth: 0 },
  td: { justifyContent: 'center' },
  tdPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  rowNameCol: { flex: 1 },
  rowName: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  rowTime: {
    fontSize: 10,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 1,
  },
  codeTag: {
    alignSelf: 'flex-start',
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  codeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '600',
    color: ClinicalTheme.colors.textPrimary,
  },
  demoSubText: {
    fontSize: 10.5,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 1,
  },
  noBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  noBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  noDataText: { fontSize: 12, color: ClinicalTheme.colors.textMuted },
  dateTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: ClinicalTheme.colors.textSecondary,
  },
  rowActionBtn: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    paddingHorizontal: SPACING.md,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  rowActionBtnText: {
    color: ClinicalTheme.colors.primaryLight,
    fontWeight: '700',
    fontSize: 12,
  },
  rowStartBtn: {
    backgroundColor: ClinicalTheme.colors.primary,
    paddingHorizontal: SPACING.md,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  rowStartBtnText: {
    color: ClinicalTheme.colors.textWhite,
    fontWeight: '700',
    fontSize: 12,
  },

  // -------------------------------------------------------------
  // PORTRAIT CARDS
  // -------------------------------------------------------------
  cardGrid: { gap: SPACING.md },
  patientCard: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
  },
  patientCardTop: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  cardMeta: { flex: 1 },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  cardCode: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
    marginTop: 1,
  },
  cardDemo: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  cardTime: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: ClinicalTheme.colors.border,
  },
  cardActionBtn: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  cardActionBtnText: {
    color: ClinicalTheme.colors.primaryLight,
    fontWeight: '700',
    fontSize: 14,
  },
  cardStartBtn: {
    backgroundColor: ClinicalTheme.colors.primary,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  cardStartBtnText: {
    color: ClinicalTheme.colors.textWhite,
    fontWeight: '700',
    fontSize: 14,
  },

  // -------------------------------------------------------------
  // SIDEBAR (RIGHT COLUMN)
  // -------------------------------------------------------------
  sideCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    marginBottom: SPACING.lg,
    ...ClinicalTheme.shadows.card,
  },
  sideCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sideCardHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stationBadge: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  stationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  docProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  docAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  docMeta: { flex: 1 },
  docName: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  docEmail: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 1,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 4,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  roleChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: ClinicalTheme.colors.borderSubtle,
    marginVertical: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaLabel: { fontSize: 11, color: ClinicalTheme.colors.textMuted },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  secureNote: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.xs,
    marginTop: SPACING.md,
  },
  secureNoteText: {
    fontSize: 10.5,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '600',
  },
  alertBtn: {
    backgroundColor: ClinicalTheme.colors.riskModerateBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskModerateBorder,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
  },
  alertBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.riskModerate,
  },
  urgentAlertBtn: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
  },
  urgentAlertBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.riskUrgent,
  },
  primaryBtn: {
    backgroundColor: ClinicalTheme.colors.primary,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textWhite,
  },
  secondaryBtn: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
});
