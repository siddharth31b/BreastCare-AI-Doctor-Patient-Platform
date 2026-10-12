import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { Translations } from '../i18n/translations';
import {
  ClinicalTheme,
  SPACING,
  RADIUS,
  TOUCH_TARGETS,
  TABLET_LAYOUT,
  ACCESSIBILITY,
  INTERACTION,
  useResponsiveLayout,
} from '../theme';
import { ClinicalHeader } from '../components/ClinicalHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentStart'>;

interface PhaseProtocolItem {
  id: string;
  num: string;
  titleKey: keyof Translations;
  descKey: keyof Translations;
  titleFallback: string;
  descFallback: string;
  titleHi: string;
  descHi: string;
  status: 'ACTIVE' | 'QUEUED' | 'COMPLETED';
}

export const AssessmentStartScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient } = route.params;
  const { t, language } = useLanguage();
  const { isLandscape } = useResponsiveLayout();
  const isHindi = language === 'hi';

  const [starting, setStarting] = useState(false);

  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);
  const initial = displayName.charAt(0).toUpperCase();

  const handleStartChatbot = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const assessment = await ApiService.startAssessment(patient.id, {
        age: patient.age,
        gender: patient.gender,
      });

      navigation.navigate('Chatbot', {
        patient,
        assessmentId: assessment.id,
      });
    } catch (err: any) {
      Alert.alert(
        t('initFailed'),
        err.message || t('couldNotStartSession')
      );
    } finally {
      setStarting(false);
    }
  };

  const phases: PhaseProtocolItem[] = [
    {
      id: 'p0',
      num: '01',
      titleKey: 'phase01BaselineTitle',
      descKey: 'phase01BaselineDesc',
      titleFallback: 'Baseline Risk Profile',
      descFallback: '9 core epidemiological questions assessing age, parity, reproductive & family history.',
      titleHi: 'बेसलाइन जोखिम प्रोफाइल',
      descHi: 'आयु, मातृत्व, स्तनपान एवं पारिवारिक इतिहास का 9-चरणीय मानकीकृत परीक्षण।',
      status: 'ACTIVE',
    },
    {
      id: 'p1',
      num: '02',
      titleKey: 'phase02PrimaryTitle',
      descKey: 'phase02PrimaryDesc',
      titleFallback: 'Primary Breast Screening',
      descFallback: 'Localized symptom evaluation across left, right, or bilateral breast tissue.',
      titleHi: 'प्राथमिक स्तन परीक्षण',
      descHi: 'बाएं, दाएं अथवा दोनों स्तनों में गांठ, दर्द व त्वचा परिवर्तन का परीक्षण।',
      status: 'QUEUED',
    },
    {
      id: 'p2',
      num: '03',
      titleKey: 'phase03RegionalTitle',
      descKey: 'phase03RegionalDesc',
      titleFallback: 'Regional Spread Screening',
      descFallback: 'Axillary and cervical lymphadenopathy inspection for regional spread.',
      titleHi: 'क्षेत्रीय प्रसार परीक्षण',
      descHi: 'कांख एवं गर्दन के लिम्फ नोड्स में सूजन व गांठ की क्लिनिकल जांच।',
      status: 'QUEUED',
    },
    {
      id: 'p3',
      num: '04',
      titleKey: 'phase04SystemicTitle',
      descKey: 'phase04SystemicDesc',
      titleFallback: 'Systemic & Distant Screening',
      descFallback: 'Fast-track or comprehensive systemic triage evaluating metastatic indicators.',
      titleHi: 'प्रणालीगत एवं दूरस्थ परीक्षण',
      descHi: 'श्वसन, केंद्रीय तंत्रिका तंत्र एवं अस्थि संबंधी प्रणालीगत परीक्षण।',
      status: 'QUEUED',
    },
    {
      id: 'p4',
      num: '05',
      titleKey: 'phase05AnalysisTitle',
      descKey: 'phase05AnalysisDesc',
      titleFallback: 'Clinical Risk Analysis & Review',
      descFallback: 'Multi-factorial Bayesian scoring, BRM calculation, and risk tier stratification.',
      titleHi: 'समग्र नैदानिक जोखिम विश्लेषण',
      descHi: 'बहु-कारकीय स्कोरिंग, बीआरएम गणना एवं ऑन्कोलॉजी जोखिम स्तरीकरण।',
      status: 'QUEUED',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Clinical Header */}
      <ClinicalHeader
        title={t('startAssessment')}
        subtitle={
          isHindi
            ? 'चरण 3 / 3 • नैदानिक मूल्यांकन वर्कस्टेशन'
            : 'Step 3 of 3 • Clinical Assessment Workstation'
        }
        onBack={() => navigation.navigate('Dashboard')}
        backLabel={t('backToDashboard')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* ============================================================ */}
          {/* LANDSCAPE 2-COLUMN WORKSTATION (42% / 58%)                    */}
          {/* ============================================================ */}
          <View style={isLandscape ? styles.twoColumnRow : styles.singleColumn}>
            {/* ------------------------------------------------------------ */}
            {/* LEFT: PATIENT DOSSIER (~42%)                                 */}
            {/* ------------------------------------------------------------ */}
            <View
              style={[
                styles.dossierContainer,
                isLandscape ? styles.dossierColLandscape : styles.fullWidth,
              ]}
            >
              <View style={styles.dossierCard}>
                <View style={styles.dossierHead}>
                  <Text style={[styles.dossierSectionTitle, isHindi && styles.hindiText]}>
                    {isHindi ? 'रोगी पहचान विवरण' : 'PATIENT DOSSIER'}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>
                      ✓ {isHindi ? 'सत्यापित' : 'VERIFIED'}
                    </Text>
                  </View>
                </View>

                {/* Patient Photo & Primary Identity */}
                <View style={styles.identityRow}>
                  <View style={styles.photoWrapper}>
                    {patient.face_photo_url ? (
                      <Image
                        source={{ uri: patient.face_photo_url }}
                        style={styles.patientPhoto}
                        resizeMode="cover"
                        accessibilityLabel={`Photo of ${displayName}`}
                      />
                    ) : (
                      <View style={styles.initialsBox}>
                        <Text style={styles.initialsText}>{initial}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.identityMeta}>
                    <Text
                      style={[styles.patientName, isHindi && styles.hindiText]}
                      numberOfLines={2}
                    >
                      {displayName}
                    </Text>
                    <View style={styles.codeRow}>
                      <Text style={styles.codeBadge}>{patientCode}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dossierDivider} />

                {/* Patient Demographic Details */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('age')}:</Text>
                    <Text style={styles.detailValue}>
                      {patient.age} {t('years')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('gender')}:</Text>
                    <Text style={styles.detailValue}>
                      {patient.gender === 'Female'
                        ? t('genderFemale')
                        : patient.gender === 'Male'
                        ? t('genderMale')
                        : t('genderOther')}
                    </Text>
                  </View>

                  {patient.phone ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('phone')}:</Text>
                      <Text style={styles.detailValue}>{patient.phone}</Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {isHindi ? 'पंजीकरण स्थिति:' : 'Registration Status:'}
                    </Text>
                    <Text style={styles.statusLiveValue}>
                      ● {isHindi ? 'सक्रिय एवं तैयार' : 'Active & Ready'}
                    </Text>
                  </View>
                </View>

                {/* Clinical Notice Box */}
                <View style={styles.noticeBox}>
                  <Text style={[styles.noticeTitle, isHindi && styles.hindiText]}>
                    🛡️ {isHindi ? 'क्लिनिकल डेटा सुरक्षा' : 'Clinical Station Protocol'}
                  </Text>
                  <Text style={[styles.noticeText, isHindi && styles.hindiText]}>
                    {isHindi
                      ? 'इस मूल्यांकन के सभी नैदानिक उत्तर स्थानीय डिवाइस पर सुरक्षित रूप से एन्क्रिप्ट किए जाते हैं।'
                      : 'All assessment responses are encrypted under institutional clinical security standards.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT: SCREENING PROTOCOL (5-PHASE TIMELINE ~58%)            */}
            {/* ------------------------------------------------------------ */}
            <View
              style={[
                styles.protocolContainer,
                isLandscape ? styles.protocolColLandscape : styles.fullWidth,
              ]}
            >
              <View style={styles.protocolCard}>
                <View style={styles.protocolCardHead}>
                  <View>
                    <Text style={[styles.protocolCardTitle, isHindi && styles.hindiText]}>
                      {isHindi ? 'स्क्रीनिंग प्रोटोकॉल अनुक्रम' : 'SCREENING PROTOCOL'}
                    </Text>
                    <Text style={[styles.protocolCardSub, isHindi && styles.hindiText]}>
                      {isHindi
                        ? 'मानकीकृत 5-चरणीय ऑन्कोलॉजी स्क्रीनिंग क्रम'
                        : 'Standardized 5-Phase Clinical Triage Sequence'}
                    </Text>
                  </View>
                  <View style={styles.livePhaseBadge}>
                    <Text style={styles.livePhaseBadgeText}>
                      {isHindi ? 'चरण 01 सक्रिय' : 'PHASE 01 ACTIVE'}
                    </Text>
                  </View>
                </View>

                {/* 5-Phase List */}
                <View style={styles.phaseList}>
                  {phases.map(item => {
                    const isActive = item.status === 'ACTIVE';
                    const isQueued = item.status === 'QUEUED';
                    const isCompleted = item.status === 'COMPLETED';

                    const title = isHindi ? item.titleHi : t(item.titleKey) || item.titleFallback;
                    const desc = isHindi ? item.descHi : t(item.descKey) || item.descFallback;

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.phaseCard,
                          isActive && styles.phaseCardActive,
                          isQueued && styles.phaseCardQueued,
                          isCompleted && styles.phaseCardCompleted,
                        ]}
                      >
                        {/* Left Indicator Column */}
                        <View style={styles.indicatorCol}>
                          <Text
                            style={[
                              styles.phaseNumText,
                              isActive && styles.phaseNumTextActive,
                            ]}
                          >
                            {item.num}
                          </Text>
                          <View
                            style={[
                              styles.phaseDot,
                              isActive && styles.phaseDotActive,
                              isQueued && styles.phaseDotQueued,
                              isCompleted && styles.phaseDotCompleted,
                            ]}
                          >
                            {isCompleted ? (
                              <Text style={styles.completedCheck}>✓</Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Content Column */}
                        <View style={styles.phaseContentCol}>
                          <View style={styles.phaseHeadRow}>
                            <Text
                              style={[
                                styles.phaseTitle,
                                isActive && styles.phaseTitleActive,
                                isHindi && styles.hindiText,
                              ]}
                              numberOfLines={1}
                            >
                              {title}
                            </Text>

                            {/* Explicit Non-Color-Exclusive Status Label */}
                            <View
                              style={[
                                styles.statusBadge,
                                isActive && styles.statusBadgeActive,
                                isQueued && styles.statusBadgeQueued,
                                isCompleted && styles.statusBadgeCompleted,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  isActive && styles.statusBadgeTextActive,
                                  isQueued && styles.statusBadgeTextQueued,
                                  isCompleted && styles.statusBadgeTextCompleted,
                                ]}
                              >
                                {isActive
                                  ? isHindi ? '● सक्रिय' : '● ACTIVE'
                                  : isCompleted
                                  ? isHindi ? '✓ पूर्ण' : '✓ COMPLETED'
                                  : isHindi ? '○ प्रतीक्षित' : '○ QUEUED'}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={[
                              styles.phaseDescription,
                              isActive && styles.phaseDescActive,
                              isHindi && styles.hindiText,
                            ]}
                          >
                            {desc}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Primary CTA (60-64dp height, dominant) */}
                <View style={styles.ctaRow}>
                  <TouchableOpacity
                    style={[styles.beginBtn, starting && styles.beginBtnDisabled]}
                    onPress={handleStartChatbot}
                    disabled={starting}
                    activeOpacity={INTERACTION.pressOpacity}
                    accessibilityRole="button"
                    accessibilityLabel={
                      starting
                        ? t('initializingSession')
                        : isHindi
                        ? 'मूल्यांकन प्रारंभ करें'
                        : 'BEGIN ASSESSMENT'
                    }
                    accessibilityState={{ disabled: starting, busy: starting }}
                  >
                    {starting ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator
                          color={ClinicalTheme.colors.textWhite}
                          size="small"
                        />
                        <Text style={[styles.beginBtnText, isHindi && styles.hindiText]}>
                          {t('initializingSession')}...
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.beginBtnText, isHindi && styles.hindiText]}>
                        {isHindi ? 'मूल्यांकन प्रारंभ करें →' : 'BEGIN ASSESSMENT →'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
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
  scrollContent: {
    padding: SPACING.lg,
    alignItems: 'center',
    paddingBottom: 80,
  },
  scrollContentLandscape: {
    paddingHorizontal: TABLET_LAYOUT.screenHorizontalPaddingLandscape, // 40dp
    paddingVertical: SPACING.xl,
    paddingBottom: 100,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: TABLET_LAYOUT.contentMaxWidth, // 1080dp
  },

  // Layout Grid
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xl,
  },
  singleColumn: {
    flexDirection: 'column',
    gap: SPACING.xl,
  },
  dossierColLandscape: {
    flex: 0.42,
  },
  protocolColLandscape: {
    flex: 0.58,
  },
  fullWidth: {
    width: '100%',
  },

  // -------------------------------------------------------------
  // PATIENT DOSSIER CARD (LEFT)
  // -------------------------------------------------------------
  dossierContainer: {},
  dossierCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    gap: SPACING.md,
    ...ClinicalTheme.shadows.card,
  },
  dossierHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderSubtle,
  },
  dossierSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.riskLowBorder,
  },
  verifiedBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.riskLow,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  photoWrapper: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    backgroundColor: ClinicalTheme.colors.bgMuted,
  },
  patientPhoto: {
    width: '100%',
    height: '100%',
  },
  initialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: ClinicalTheme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 26,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  identityMeta: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    lineHeight: 24,
  },
  codeRow: {
    flexDirection: 'row',
  },
  codeBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  dossierDivider: {
    height: 1,
    backgroundColor: ClinicalTheme.colors.borderSubtle,
    marginVertical: SPACING.xs,
  },
  detailsList: {
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  statusLiveValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.statusLive,
  },
  noticeBox: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    marginTop: SPACING.sm,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: 0.2,
  },
  noticeText: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    lineHeight: 16,
  },

  // -------------------------------------------------------------
  // SCREENING PROTOCOL CARD (RIGHT)
  // -------------------------------------------------------------
  protocolContainer: {},
  protocolCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    gap: SPACING.md,
    ...ClinicalTheme.shadows.card,
  },
  protocolCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderSubtle,
    marginBottom: SPACING.xs,
  },
  protocolCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: 0.3,
  },
  protocolCardSub: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
  },
  livePhaseBadge: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  livePhaseBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  phaseList: {
    gap: SPACING.sm,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  phaseCardActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
    ...ClinicalTheme.shadows.card,
  },
  phaseCardQueued: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderColor: ClinicalTheme.colors.borderDefault,
    opacity: 0.85,
  },
  phaseCardCompleted: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderColor: ClinicalTheme.colors.riskLowBorder,
  },
  indicatorCol: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
    width: 24,
  },
  phaseNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textMuted,
  },
  phaseNumTextActive: {
    color: ClinicalTheme.colors.primaryAccent,
  },
  phaseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseDotActive: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  phaseDotQueued: {
    backgroundColor: 'transparent',
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  phaseDotCompleted: {
    backgroundColor: ClinicalTheme.colors.riskLow,
    borderColor: ClinicalTheme.colors.riskLow,
  },
  completedCheck: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  phaseContentCol: {
    flex: 1,
    gap: 3,
  },
  phaseHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    flex: 1,
  },
  phaseTitleActive: {
    color: ClinicalTheme.colors.primaryLight,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  statusBadgeQueued: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  statusBadgeCompleted: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderColor: ClinicalTheme.colors.riskLow,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextActive: {
    color: ClinicalTheme.colors.primaryAccent,
  },
  statusBadgeTextQueued: {
    color: ClinicalTheme.colors.textMuted,
  },
  statusBadgeTextCompleted: {
    color: ClinicalTheme.colors.riskLow,
  },
  phaseDescription: {
    fontSize: 11.5,
    color: ClinicalTheme.colors.textMuted,
    lineHeight: 16,
  },
  phaseDescActive: {
    color: ClinicalTheme.colors.textSecondary,
  },

  // -------------------------------------------------------------
  // PRIMARY CTA BUTTON (62dp height, dominant)
  // -------------------------------------------------------------
  ctaRow: {
    marginTop: SPACING.xs,
  },
  beginBtn: {
    backgroundColor: ClinicalTheme.colors.primary,
    minHeight: 62,
    height: 62,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryLight,
    ...ClinicalTheme.shadows.elevated,
  },
  beginBtnDisabled: {
    opacity: 0.6,
  },
  beginBtnText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  // Hindi text line-height safety
  hindiText: {
    lineHeight: 22,
  },
});
