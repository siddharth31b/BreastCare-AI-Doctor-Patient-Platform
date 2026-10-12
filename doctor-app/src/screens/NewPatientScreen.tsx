import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { realtimeManager } from '../realtime';
import {
  ClinicalTheme,
  SPACING,
  RADIUS,
  TOUCH_TARGETS,
  TABLET_LAYOUT,
  INPUT_STATES,
  ACCESSIBILITY,
  useResponsiveLayout,
} from '../theme';
import { ClinicalHeader } from '../components/ClinicalHeader';
import { TABLET_ID } from '../config/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'NewPatient'>;

function generateUniquePatientCode(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `PT-${rand}`;
}

export const NewPatientScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language } = useLanguage();
  const { isLandscape } = useResponsiveLayout();
  const isHindi = language === 'hi';

  const [patientCode, setPatientCode] = useState(generateUniquePatientCode());
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'fullName' | 'age' | 'phone' | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ fullName?: string; age?: string; consent?: string; api?: string }>({});

  const parsedAge = parseInt(age, 10);
  const isAgeValid = age.trim().length > 0 && !isNaN(parsedAge) && parsedAge >= 1 && parsedAge <= 125;
  const isNameValid = fullName.trim().length > 0;
  const isFormValid = isNameValid && isAgeValid && consentGiven;

  const validate = (): boolean => {
    const newErrors: { fullName?: string; age?: string; consent?: string } = {};
    if (!isNameValid) {
      newErrors.fullName = t('validationNameRequired');
    }
    if (!isAgeValid) {
      newErrors.age = t('validationAgeRange');
    }
    if (!consentGiven) {
      newErrors.consent = isHindi
        ? 'रोगी की सूचित सहमति आवश्यक है'
        : 'Patient informed consent is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      const patient = await ApiService.createPatient({
        patient_code: patientCode.trim(),
        name: fullName.trim(),
        full_name: fullName.trim(),
        age: parseInt(age, 10),
        gender,
        phone: phone.trim() || undefined,
      });

      // Emit realtime event to immediately sync dashboard and lists
      realtimeManager.emit('PATIENT_REGISTERED', patient);

      // Navigate directly to Face Photo Capture screen
      navigation.navigate('FacePhotoCapture', { patient });
    } catch (err: any) {
      const isDuplicate =
        err?.status === 409 ||
        err?.code === '23505' ||
        err?.message?.toLowerCase().includes('duplicate') ||
        err?.message?.toLowerCase().includes('already registered') ||
        err?.message?.toLowerCase().includes('unique constraint');

      if (isDuplicate) {
        const freshCode = generateUniquePatientCode();
        setPatientCode(freshCode);
        setErrors({
          api: t('patientCodeCollision', { code: freshCode }),
        });
      } else {
        setErrors({
          api: err.message || t('patientRegistrationFailed'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ClinicalHeader
        title={isHindi ? 'नया रोगी पंजीकरण' : 'New Patient Registration'}
        subtitle={isHindi ? 'चरण 1 / 3' : 'Step 1 of 3'}
        onBack={() => navigation.goBack()}
        backLabel={t('backToDashboard')}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && styles.scrollContentLandscape,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.contentWrap}>
            {/* Step Track */}
            <View style={styles.stepTrack}>
              <View style={[styles.stepItem, styles.stepItemActive]}>
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Text style={styles.stepNumActive}>1</Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    styles.stepLabelActive,
                    isHindi && styles.hindiText,
                  ]}
                >
                  {t('patientRegistration')}
                </Text>
              </View>

              <View style={styles.stepLine} />

              <View style={[styles.stepItem, styles.stepItemInactive]}>
                <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                  <Text style={[styles.stepNum, styles.stepNumInactive]}>2</Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isHindi && styles.hindiText,
                  ]}
                >
                  {t('captureFacePhoto')}
                </Text>
              </View>

              <View style={styles.stepLine} />

              <View style={[styles.stepItem, styles.stepItemInactive]}>
                <View style={[styles.stepCircle, styles.stepCircleInactive]}>
                  <Text style={[styles.stepNum, styles.stepNumInactive]}>3</Text>
                </View>
                <Text style={[styles.stepLabel, isHindi && styles.hindiText]}>
                  {t('startAssessment')}
                </Text>
              </View>
            </View>

            {/* ============================================================ */}
            {/* HOSPITAL INTAKE FORM (LANDSCAPE 2-COLUMN)                    */}
            {/* ============================================================ */}
            <View style={isLandscape ? styles.twoColumnRow : styles.singleColumn}>
              {/* ------------------------------------------------------------ */}
              {/* LEFT / MAIN AREA: REGISTRATION FORM (~60%)                   */}
              {/* ------------------------------------------------------------ */}
              <View style={[styles.formCard, isLandscape ? styles.leftColLandscape : styles.fullWidth]}>
                <View style={styles.formSectionHeader}>
                  <Text style={[styles.sectionTitle, isHindi && styles.hindiText]}>
                    {t('patientIdentification')}
                  </Text>
                  <Text style={[styles.sectionSubtitle, isHindi && styles.hindiText]}>
                    {t('verifyHospitalRecord')}
                  </Text>
                </View>

                {errors.api && (
                  <View style={styles.apiErrorBox} accessibilityRole="alert">
                    <Text style={[styles.apiErrorText, isHindi && styles.hindiText]}>{errors.api}</Text>
                  </View>
                )}

                {/* Form Arrangement: Row 1 - Patient Name & Patient Code */}
                <View style={styles.fieldRow}>
                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={[styles.label, isHindi && styles.hindiLabel]}>
                      {t('fullName')} *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'fullName' && styles.inputFocused,
                        errors.fullName && styles.inputError,
                      ]}
                      value={fullName}
                      onChangeText={text => {
                        setFullName(text);
                        if (errors.fullName) {
                          setErrors(prev => ({ ...prev, fullName: undefined }));
                        }
                      }}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder={t('enterFullName')}
                      placeholderTextColor={ClinicalTheme.colors.textLight}
                      autoFocus={true}
                      accessibilityLabel={t('fullName')}
                    />
                    {errors.fullName && (
                      <Text style={[styles.fieldErrorText, isHindi && styles.hindiText]}>{errors.fullName}</Text>
                    )}
                  </View>

                  <View style={[styles.inputGroup, { flex: 1.0 }]}>
                    <Text style={[styles.label, isHindi && styles.hindiLabel]}>
                      {t('patientCode')}
                    </Text>
                    <View style={styles.readonlyContainer}>
                      <TextInput
                        style={[styles.input, styles.inputReadonly]}
                        value={patientCode}
                        editable={false}
                        placeholder="PT-2026-001"
                        placeholderTextColor={ClinicalTheme.colors.textLight}
                        accessibilityLabel={t('patientCode')}
                      />
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockBadgeText}>🔒 Auto</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Form Arrangement: Row 2 - Age & Gender */}
                <View style={styles.fieldRow}>
                  <View style={[styles.inputGroup, { flex: 1.0 }]}>
                    <Text style={[styles.label, isHindi && styles.hindiLabel]}>
                      {t('age')} *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'age' && styles.inputFocused,
                        errors.age && styles.inputError,
                      ]}
                      value={age}
                      onChangeText={text => {
                        setAge(text);
                        if (errors.age) {
                          setErrors(prev => ({ ...prev, age: undefined }));
                        }
                      }}
                      onFocus={() => setFocusedField('age')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="45"
                      placeholderTextColor={ClinicalTheme.colors.textLight}
                      keyboardType="numeric"
                      accessibilityLabel={t('age')}
                    />
                    {errors.age && (
                      <Text style={[styles.fieldErrorText, isHindi && styles.hindiText]}>{errors.age}</Text>
                    )}
                  </View>

                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={[styles.label, isHindi && styles.hindiLabel]}>
                      {t('gender')}
                    </Text>
                    <View style={styles.genderRow}>
                      {['Female', 'Male', 'Other'].map(g => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderBtn,
                            gender === g && styles.genderBtnActive,
                          ]}
                          onPress={() => setGender(g)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityState={{ selected: gender === g }}
                          accessibilityLabel={
                            g === 'Female'
                              ? t('genderFemale')
                              : g === 'Male'
                              ? t('genderMale')
                              : t('genderOther')
                          }
                        >
                          <Text
                            style={[
                              styles.genderBtnText,
                              gender === g && styles.genderBtnTextActive,
                              isHindi && styles.hindiLabel,
                            ]}
                          >
                            {g === 'Female'
                              ? t('genderFemale')
                              : g === 'Male'
                              ? t('genderMale')
                              : t('genderOther')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Form Arrangement: Row 3 - Phone & Consent */}
                <View style={styles.fieldRow}>
                  <View style={[styles.inputGroup, { flex: 1.0 }]}>
                    <Text style={[styles.label, isHindi && styles.hindiLabel]}>
                      {t('phone')}{' '}
                      <Text style={styles.optionalTag}>({t('optional')})</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'phone' && styles.inputFocused,
                      ]}
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+91 98765 43210"
                      placeholderTextColor={ClinicalTheme.colors.textLight}
                      keyboardType="phone-pad"
                      accessibilityLabel={t('phone')}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={[styles.label, isHindi && styles.hindiLabel]}>
                      {isHindi ? 'रोगी सूचित सहमति' : 'Patient Informed Consent'} *
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.consentCheckboxRow,
                        consentGiven && styles.consentCheckboxRowActive,
                        errors.consent && styles.consentCheckboxRowError,
                      ]}
                      onPress={() => {
                        setConsentGiven(!consentGiven);
                        if (errors.consent) {
                          setErrors(prev => ({ ...prev, consent: undefined }));
                        }
                      }}
                      activeOpacity={0.82}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: consentGiven }}
                      accessibilityLabel={
                        isHindi
                          ? 'रोगी सूचित सहमति प्राप्त की गई'
                          : 'Patient informed consent verified'
                      }
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          consentGiven && styles.checkboxBoxActive,
                        ]}
                      >
                        {consentGiven ? (
                          <Text style={styles.checkboxCheck}>✓</Text>
                        ) : null}
                      </View>
                      <View style={styles.consentTextCol}>
                        <Text style={[styles.consentTitle, isHindi && styles.hindiLabel]}>
                          {consentGiven
                            ? isHindi ? 'सहमति सत्यापित (सक्रिय)' : 'Consent Verified (Active)'
                            : isHindi ? 'सहमति आवश्यक' : 'Consent Required'}
                        </Text>
                        <Text style={[styles.consentSubtitle, isHindi && styles.hindiText]} numberOfLines={1}>
                          {isHindi
                            ? 'क्लिनिकल स्क्रीनिंग एवं बायोमेट्रिक फोटो हेतु सहमति'
                            : 'Informed consent for screening & biometric record'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {errors.consent && (
                      <Text style={[styles.fieldErrorText, isHindi && styles.hindiText]}>
                        {errors.consent}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* ------------------------------------------------------------ */}
              {/* RIGHT / SUPPORT AREA: SUMMARY, PROGRESS & CTA (~40%)        */}
              {/* ------------------------------------------------------------ */}
              <View
                style={[
                  styles.summaryCard,
                  isLandscape ? styles.rightColLandscape : styles.fullWidth,
                ]}
              >
                <View style={styles.summaryCardHead}>
                  <Text style={[styles.summaryCardTitle, isHindi && styles.hindiText]}>
                    {isHindi ? 'पंजीकरण सारांश' : 'REGISTRATION SUMMARY'}
                  </Text>
                  <View style={styles.summaryLiveTag}>
                    <Text style={styles.summaryLiveTagText}>Step 1 / 3</Text>
                  </View>
                </View>

                <View style={styles.summaryDetailRows}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('fullName')}:</Text>
                    <Text
                      style={[styles.summaryVal, !fullName && styles.summaryValEmpty]}
                      numberOfLines={1}
                    >
                      {fullName.trim() || (isHindi ? 'प्रतीक्षित' : 'Pending')}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('patientCode')}:</Text>
                    <Text style={styles.summaryValCode}>{patientCode}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {t('age')} / {t('gender')}:
                    </Text>
                    <Text style={styles.summaryVal}>
                      {age ? `${age} ${t('years')}` : '—'} • {gender}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t('phone')}:</Text>
                    <Text style={styles.summaryVal}>
                      {phone.trim() || (isHindi ? 'वैकल्पिक' : 'Optional')}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {isHindi ? 'सहमति स्थिति:' : 'Consent Status:'}
                    </Text>
                    <Text
                      style={[
                        styles.summaryValStatus,
                        consentGiven ? styles.statusSuccess : styles.statusWarning,
                      ]}
                    >
                      {consentGiven
                        ? isHindi ? '✓ सत्यापित' : '✓ Verified'
                        : isHindi ? '○ प्रतीक्षित' : '○ Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                {/* Clinical Guidance Checklist */}
                <View style={styles.clinicalGuidanceBox}>
                  <Text style={[styles.guidanceHeading, isHindi && styles.hindiText]}>
                    {isHindi ? 'क्लिनिकल सेवन दिशानिर्देश:' : 'Clinical Intake Protocol:'}
                  </Text>
                  <Text style={[styles.guidanceText, isHindi && styles.hindiText]}>
                    • {isHindi ? 'पहचान एवं अस्पताल कोड सत्यापन' : 'Verify patient demographic record'}
                  </Text>
                  <Text style={[styles.guidanceText, isHindi && styles.hindiText]}>
                    • {isHindi ? 'सूचित सहमति एवं स्थानीय एन्क्रिप्शन' : 'Informed consent tied to station encryption'}
                  </Text>
                  <Text style={[styles.guidanceText, isHindi && styles.hindiText]}>
                    • {isHindi ? 'अगला चरण: बायोमेट्रिक फेस फोटो' : 'Next step: Face photo biometric reference'}
                  </Text>
                </View>

                {/* Primary CTA (60-64dp height, disabled until valid) */}
                <TouchableOpacity
                  style={[
                    styles.primaryCtaBtn,
                    (!isFormValid || loading) && styles.primaryCtaDisabled,
                  ]}
                  onPress={handleProceed}
                  disabled={!isFormValid || loading}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={
                    loading
                      ? t('savingPatient')
                      : isHindi
                      ? 'फोटो के लिए आगे बढ़ें'
                      : 'Continue to Photo'
                  }
                  accessibilityState={{ disabled: !isFormValid || loading, busy: loading }}
                >
                  {loading ? (
                    <View style={styles.ctaLoadingRow}>
                      <ActivityIndicator
                        color={ClinicalTheme.colors.textWhite}
                        size="small"
                      />
                      <Text style={[styles.primaryCtaText, isHindi && styles.hindiText]}>
                        {t('savingPatient')}...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.primaryCtaText, isHindi && styles.hindiText]}>
                      {isHindi ? 'फोटो के लिए आगे बढ़ें →' : 'CONTINUE TO PHOTO →'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 120,
  },
  scrollContentLandscape: {
    paddingHorizontal: 40,
    paddingVertical: SPACING.xl,
    paddingBottom: 140,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 1080,
  },

  // -------------------------------------------------------------
  // WORKFLOW STEP TRACK
  // -------------------------------------------------------------
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepItemInactive: {
    opacity: 0.5,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: ClinicalTheme.colors.primary,
    borderColor: ClinicalTheme.colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '800',
    color: ClinicalTheme.colors.textMuted,
  },
  stepNumActive: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
  stepNumInactive: {
    color: ClinicalTheme.colors.textMuted,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  stepLabelActive: {
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: ClinicalTheme.colors.borderMedium,
    marginHorizontal: 12,
  },

  // -------------------------------------------------------------
  // TWO-COLUMN TABLET LAYOUT
  // -------------------------------------------------------------
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xl,
  },
  singleColumn: {
    flexDirection: 'column',
    gap: SPACING.xl,
  },
  leftColLandscape: {
    flex: 0.60,
  },
  rightColLandscape: {
    flex: 0.40,
  },
  fullWidth: {
    width: '100%',
  },

  // -------------------------------------------------------------
  // FORM CARD (LEFT / MAIN AREA)
  // -------------------------------------------------------------
  formCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    gap: SPACING.lg,
    ...ClinicalTheme.shadows.card,
  },
  formSectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.1,
  },
  optionalTag: {
    fontWeight: '400',
    color: ClinicalTheme.colors.textMuted,
    fontSize: 12,
  },
  input: {
    backgroundColor: INPUT_STATES.default.backgroundColor,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 54,
    color: INPUT_STATES.default.textColor,
    fontSize: 15,
    borderWidth: INPUT_STATES.default.borderWidth,
    borderColor: INPUT_STATES.default.borderColor,
  },
  inputFocused: {
    borderColor: INPUT_STATES.focused.borderColor,
    borderWidth: INPUT_STATES.focused.borderWidth,
    backgroundColor: INPUT_STATES.focused.backgroundColor,
  },
  inputError: {
    borderColor: INPUT_STATES.error.borderColor,
    backgroundColor: INPUT_STATES.error.backgroundColor,
    borderWidth: INPUT_STATES.error.borderWidth,
  },
  readonlyContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputReadonly: {
    backgroundColor: INPUT_STATES.readonly.backgroundColor,
    borderColor: INPUT_STATES.readonly.borderColor,
    borderWidth: INPUT_STATES.readonly.borderWidth,
    color: INPUT_STATES.readonly.textColor,
    paddingRight: 64,
  },
  lockBadge: {
    position: 'absolute',
    right: 10,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  fieldErrorText: {
    color: ClinicalTheme.colors.riskUrgent,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    minHeight: 54,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  genderBtnActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  genderBtnText: {
    color: ClinicalTheme.colors.textSecondary,
    fontSize: 13.5,
    fontWeight: '600',
  },
  genderBtnTextActive: {
    color: ClinicalTheme.colors.primaryLight,
    fontWeight: '800',
  },
  consentCheckboxRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
  },
  consentCheckboxRowActive: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  consentCheckboxRowError: {
    borderColor: ClinicalTheme.colors.riskUrgent,
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    backgroundColor: ClinicalTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    borderColor: ClinicalTheme.colors.primaryAccent,
    backgroundColor: ClinicalTheme.colors.primaryAccent,
  },
  checkboxCheck: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  consentTextCol: {
    flex: 1,
  },
  consentTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
  },
  consentSubtitle: {
    fontSize: 10.5,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 1,
  },
  apiErrorBox: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  apiErrorText: {
    color: ClinicalTheme.colors.riskUrgent,
    fontSize: 13,
    fontWeight: '600',
  },

  // -------------------------------------------------------------
  // SUMMARY CARD (RIGHT / SUPPORT AREA)
  // -------------------------------------------------------------
  summaryCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.card,
  },
  summaryCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
  },
  summaryCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryLiveTag: {
    backgroundColor: ClinicalTheme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  summaryLiveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  summaryDetailRows: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  summaryValEmpty: {
    color: ClinicalTheme.colors.textLight,
    fontWeight: '500',
  },
  summaryValCode: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  summaryValStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusSuccess: {
    color: ClinicalTheme.colors.riskLow,
  },
  statusWarning: {
    color: ClinicalTheme.colors.riskModerate,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ClinicalTheme.colors.borderSubtle,
    marginVertical: SPACING.sm,
  },
  clinicalGuidanceBox: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    marginBottom: SPACING.lg,
    gap: 4,
  },
  guidanceHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  guidanceText: {
    fontSize: 11,
    color: ClinicalTheme.colors.textMuted,
    lineHeight: 16,
  },

  // -------------------------------------------------------------
  // PRIMARY CTA BUTTON (60-64dp height, disabled when invalid)
  // -------------------------------------------------------------
  primaryCtaBtn: {
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
  primaryCtaDisabled: {
    opacity: 0.55,
  },
  primaryCtaText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ctaLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  // Hindi text safeguards (preventing matra clipping)
  hindiText: {
    lineHeight: 22,
  },
  hindiLabel: {
    lineHeight: 20,
  },
});
