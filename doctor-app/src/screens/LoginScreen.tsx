import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { TABLET_ID } from '../config/constants';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useLanguage, LanguageSwitcher } from '../i18n/LanguageContext';
import {
  ClinicalTheme,
  SPACING,
  RADIUS,
  ELEVATION,
  TOUCH_TARGETS,
  ACCESSIBILITY,
  useResponsiveLayout,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { loginWithCredentials } = useAuth();
  const { t, language } = useLanguage();
  const { isLandscape } = useResponsiveLayout();
  const isHindi = language === 'hi';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  // Dynamic Server URL configuration for physical tablet testing
  const [serverUrl, setServerUrl] = useState('');
  const [activeServerUrl, setActiveServerUrl] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentServer() {
      const current = await ApiService.getBaseUrl();
      setActiveServerUrl(current);
      setServerUrl(current);
    }
    loadCurrentServer();
  }, []);

  const handleTestConnection = async () => {
    setTestingHealth(true);
    setHealthStatus(null);
    try {
      const result = await ApiService.checkHealth(serverUrl);
      if (result.success) {
        setHealthStatus(`Connected: ${result.status} (v${result.version || '1.0'})`);
      } else {
        setHealthStatus(`Connection failed: ${result.status}`);
      }
    } catch (err: any) {
      setHealthStatus(`Error: ${err.message}`);
    } finally {
      setTestingHealth(false);
    }
  };

  const handleSaveServer = async () => {
    try {
      await ApiService.setBaseUrl(serverUrl);
      const updated = await ApiService.getBaseUrl();
      setActiveServerUrl(updated);
      setShowConfigModal(false);
      Alert.alert(t('serverConfiguredTitle'), `${t('serverConfiguredMsg')}${updated}`);
    } catch (err: any) {
      Alert.alert(t('saveError'), err.message);
    }
  };

  const getTranslatedAuthError = (err: any): string => {
    const code = err?.code || '';
    const msg = (err?.message || '').toLowerCase();
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      msg.includes('invalid-credential') ||
      msg.includes('wrong-password')
    ) {
      return t('authInvalidCredentials');
    }
    if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
      return t('authTooManyRequests');
    }
    if (code === 'auth/network-request-failed' || msg.includes('network')) {
      return t('authNetworkFailed');
    }
    if (code === 'auth/user-disabled') {
      return t('authUserDisabled');
    }
    return t('authFailed');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg(t('validationEmailPasswordRequired'));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithCredentials(email.trim(), password);
      navigation.replace('Dashboard');
    } catch (err: any) {
      setErrorMsg(getTranslatedAuthError(err));
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.mainWrapper,
            isLandscape ? styles.mainWrapperLandscape : styles.mainWrapperPortrait,
          ]}
        >
          {/* ========================================================== */}
          {/* LEFT ZONE — Clinical Branding & System Identity (~42%)    */}
          {/* ========================================================== */}
          <View
            style={[
              styles.leftZone,
              isLandscape ? styles.leftZoneLandscape : styles.leftZonePortrait,
            ]}
          >
            {/* Terminal hardware chip */}
            <View style={styles.stationBadge}>
              <View style={styles.stationDot} />
              <Text style={styles.stationBadgeText}>
                {t('station')} {TABLET_ID}
              </Text>
            </View>

            {/* Clinical Brand Monogram */}
            <View style={styles.brandHeaderRow}>
              <View style={styles.monogramBox}>
                <Text style={styles.monogramText}>BC</Text>
              </View>
              <View style={styles.brandTitleCol}>
                <Text style={styles.brandSuperTitle}>{t('brandTitle')}</Text>
                <Text style={styles.brandMainTitle}>{t('appTitle')}</Text>
              </View>
            </View>

            <Text
              style={[
                styles.brandSubtitle,
                isHindi && styles.brandSubtitleHindi,
              ]}
            >
              {t('brandSubtitle')}
            </Text>

            {/* Clinical Station Trust Pillars (Landscape only) */}
            {isLandscape ? (
              <View style={styles.trustPillars}>
                <View style={styles.pillarRow}>
                  <View style={styles.pillarIconBox}>
                    <Text style={styles.pillarIcon}>✓</Text>
                  </View>
                  <View style={styles.pillarTextCol}>
                    <Text style={styles.pillarTitle}>Phased Risk Stratification</Text>
                    <Text style={styles.pillarDesc}>
                      Standardized multi-tier clinical screening protocol
                    </Text>
                  </View>
                </View>

                <View style={styles.pillarRow}>
                  <View style={styles.pillarIconBox}>
                    <Text style={styles.pillarIcon}>✓</Text>
                  </View>
                  <View style={styles.pillarTextCol}>
                    <Text style={styles.pillarTitle}>Bilingual Clinical Voice</Text>
                    <Text style={styles.pillarDesc}>
                      Natural speech synthesis in English and Hindi
                    </Text>
                  </View>
                </View>

                <View style={styles.pillarRow}>
                  <View style={styles.pillarIconBox}>
                    <Text style={styles.pillarIcon}>✓</Text>
                  </View>
                  <View style={styles.pillarTextCol}>
                    <Text style={styles.pillarTitle}>Physician Validation Gate</Text>
                    <Text style={styles.pillarDesc}>
                      Mandatory medical review before report finalization
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Hardware Terminal Footer Note */}
            <View style={styles.terminalFooter}>
              <Text style={styles.terminalFooterText}>
                Terminal TB-J616X • Android 11 • Encrypted Channel
              </Text>
            </View>
          </View>

          {/* ========================================================== */}
          {/* RIGHT ZONE — Doctor Login Card (~58%, max 500dp)         */}
          {/* ========================================================== */}
          <View
            style={[
              styles.rightZone,
              isLandscape ? styles.rightZoneLandscape : styles.rightZonePortrait,
            ]}
          >
            <View style={styles.loginCard}>
              {/* Card Top: Language Switcher */}
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.cardHeaderTitle}>{t('signIn')}</Text>
                  <Text
                    style={[
                      styles.cardHeaderSubtitle,
                      isHindi && styles.cardHeaderSubtitleHindi,
                    ]}
                  >
                    Clinical Station Authentication
                  </Text>
                </View>
                <LanguageSwitcher />
              </View>

              {/* Error Banner */}
              {errorMsg ? (
                <View style={styles.errorBox} accessibilityRole="alert">
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Form Area */}
              <View style={styles.formArea}>
                <Text style={styles.inputLabel}>{t('doctorEmailLabel')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                  placeholder={t('doctorEmailPlaceholder')}
                  placeholderTextColor={ClinicalTheme.colors.textLight}
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  accessibilityLabel={t('doctorEmailLabel')}
                />

                <Text style={styles.inputLabel}>{t('passwordLabel')}</Text>
                <View
                  style={[
                    styles.passwordContainer,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder={t('passwordPlaceholder')}
                    placeholderTextColor={ClinicalTheme.colors.textLight}
                    value={password}
                    onChangeText={text => {
                      setPassword(text);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    accessibilityLabel={t('passwordLabel')}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={ACCESSIBILITY.hitSlop}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Login Button (60dp Standard Clinical CTA) */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('signIn')}
                  accessibilityState={{ disabled: loading, busy: loading }}
                >
                  {loading ? (
                    <ActivityIndicator
                      color={ClinicalTheme.colors.textWhite}
                      size="small"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.primaryButtonText,
                        isHindi && styles.primaryButtonTextHindi,
                      ]}
                    >
                      {t('signIn')}
                    </Text>
                  )}
                </TouchableOpacity>


                <View style={styles.loginFooter}>
                  <Text style={styles.loginFooterText}>{t('secureAccess')}</Text>
                </View>

                {/* Secondary Server Config Link */}
                <TouchableOpacity
                  style={styles.serverConfigBadge}
                  onPress={() => setShowConfigModal(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('serverLabel')} ${activeServerUrl}`}
                >
                  <Text style={styles.serverConfigText} numberOfLines={1}>
                    {t('serverLabel')} {activeServerUrl || '...'}
                  </Text>
                  <Text style={styles.serverConfigAction}>{t('configure')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Server URL Configuration Modal */}
      <Modal
        visible={showConfigModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('configServerTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('configServerSub')}</Text>

            <Text style={styles.modalInputLabel}>{t('apiBaseUrl')}</Text>
            <TextInput
              style={styles.modalInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="https://breastcare-backend-atyz.onrender.com/api"
              placeholderTextColor={ClinicalTheme.colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {healthStatus ? (
              <View
                style={[
                  styles.statusBox,
                  healthStatus.includes('Connected')
                    ? styles.statusSuccess
                    : styles.statusError,
                ]}
              >
                <Text style={styles.statusBoxText}>{healthStatus}</Text>
              </View>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestConnection}
                disabled={testingHealth}
                accessibilityRole="button"
              >
                {testingHealth ? (
                  <ActivityIndicator
                    color={ClinicalTheme.colors.primaryAccent}
                    size="small"
                  />
                ) : (
                  <Text style={styles.testButtonText}>{t('testConnection')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveServer}
                accessibilityRole="button"
              >
                <Text style={styles.saveButtonText}>{t('saveAndApply')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowConfigModal(false)}
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  scrollContentLandscape: {
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xl,
  },
  mainWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  mainWrapperLandscape: {
    flexDirection: 'row',
    maxWidth: 1120,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainWrapperPortrait: {
    flexDirection: 'column',
    maxWidth: 520,
  },

  // -------------------------------------------------------------
  // LEFT ZONE STYLES
  // -------------------------------------------------------------
  leftZone: {
    justifyContent: 'center',
  },
  leftZoneLandscape: {
    width: '42%',
    paddingRight: SPACING.xxxl,
  },
  leftZonePortrait: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  stationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    marginBottom: SPACING.lg,
  },
  stationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ClinicalTheme.colors.statusLive,
  },
  stationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  brandHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  monogramBox: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md + 2,
    backgroundColor: ClinicalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...ClinicalTheme.shadows.card,
  },
  monogramText: {
    fontSize: 24,
    fontWeight: '800',
    color: ClinicalTheme.colors.textWhite,
    letterSpacing: 0.8,
  },
  brandTitleCol: {
    flex: 1,
  },
  brandSuperTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ClinicalTheme.colors.secondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  brandMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.xl,
  },
  brandSubtitleHindi: {
    lineHeight: 25,
  },

  trustPillars: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    ...ClinicalTheme.shadows.card,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  pillarIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  pillarIcon: {
    fontSize: 13,
    fontWeight: '900',
    color: ClinicalTheme.colors.primaryAccent,
  },
  pillarTextCol: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: 0.1,
  },
  pillarDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
  },
  terminalFooter: {
    marginTop: SPACING.xs,
  },
  terminalFooterText: {
    fontSize: 11,
    color: ClinicalTheme.colors.textLight,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // -------------------------------------------------------------
  // RIGHT ZONE — LOGIN CARD STYLES
  // -------------------------------------------------------------
  rightZone: {
    width: '100%',
  },
  rightZoneLandscape: {
    width: '56%',
    maxWidth: 500,
  },
  rightZonePortrait: {
    maxWidth: 500,
  },
  loginCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.elevated,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  cardHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  cardHeaderSubtitleHindi: {
    lineHeight: 22,
  },

  errorBox: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    color: ClinicalTheme.colors.riskUrgent,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },

  formArea: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
    marginBottom: 6,
    marginTop: SPACING.sm,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    minHeight: TOUCH_TARGETS.inputHeight, // 54dp
    fontSize: 16,
    color: ClinicalTheme.colors.textPrimary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    minHeight: TOUCH_TARGETS.inputHeight, // 54dp
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    fontSize: 16,
    color: ClinicalTheme.colors.textPrimary,
    minHeight: TOUCH_TARGETS.inputHeight,
  },
  passwordToggle: {
    minWidth: TOUCH_TARGETS.min, // 48dp minimum touch target
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  passwordToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryAccent,
  },
  inputFocused: {
    borderColor: ClinicalTheme.colors.borderFocus,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },

  primaryButton: {
    backgroundColor: ClinicalTheme.colors.primary,
    minHeight: TOUCH_TARGETS.primaryAction, // 60dp standard clinical CTA
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    ...ClinicalTheme.shadows.card,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryButtonTextHindi: {
    lineHeight: 24,
  },


  loginFooter: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  loginFooterText: {
    fontSize: 12,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  serverConfigBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.md,
    minHeight: 44,
  },
  serverConfigText: {
    color: ClinicalTheme.colors.textMuted,
    fontSize: 12,
    flex: 1,
    marginRight: SPACING.sm,
  },
  serverConfigAction: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
  },

  // -------------------------------------------------------------
  // MODAL STYLES
  // -------------------------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.elevated,
  },
  modalTitle: {
    fontSize: 20,
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
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: ClinicalTheme.colors.textPrimary,
    marginBottom: SPACING.md,
  },
  statusBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderColor: ClinicalTheme.colors.riskLowBorder,
  },
  statusError: {
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
  },
  statusBoxText: {
    fontSize: 12,
    color: ClinicalTheme.colors.textPrimary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  testButton: {
    flex: 1,
    minHeight: TOUCH_TARGETS.secondaryAction,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  testButtonText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    minHeight: TOUCH_TARGETS.secondaryAction,
    backgroundColor: ClinicalTheme.colors.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  saveButtonText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    minHeight: TOUCH_TARGETS.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  closeButtonText: {
    color: ClinicalTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
