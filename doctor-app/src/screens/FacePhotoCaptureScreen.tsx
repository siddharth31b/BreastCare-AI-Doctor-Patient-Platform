import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, getPatientDisplayName, getPatientCodeDisplay } from '../types';
import {
  ClinicalTheme,
  SPACING,
  RADIUS,
  TOUCH_TARGETS,
  TABLET_LAYOUT,
  ACCESSIBILITY,
  useResponsiveLayout,
} from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'FacePhotoCapture'>;

export const FacePhotoCaptureScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient } = route.params;
  const { t, language } = useLanguage();
  const { isLandscape } = useResponsiveLayout();
  const isHindi = language === 'hi';

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        setCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });

        if (photo && photo.uri) {
          navigation.navigate('PhotoPreview', {
            patient,
            photoUri: photo.uri,
            base64: photo.base64,
          });
        }
      } catch (err: any) {
        Alert.alert(t('captureError'), err.message || t('captureFailed'));
      } finally {
        setCapturing(false);
      }
    } else {
      Alert.alert(t('cameraUnavailable'), t('cameraNotAccessible'));
    }
  };

  const handleSkipPhoto = () => {
    navigation.replace('AssessmentStart', { patient });
  };

  if (!permission) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color={ClinicalTheme.colors.primaryAccent} />
        <Text style={styles.textWait}>{t('cameraInit')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.containerCenter}>
        <View style={styles.permissionCard}>
          <Text style={[styles.permissionTitle, isHindi && styles.hindiText]}>
            {t('cameraPermissionTitle')}
          </Text>
          <Text style={[styles.permissionSub, isHindi && styles.hindiText]}>
            {t('cameraPermissionSub')}
          </Text>
          <TouchableOpacity
            style={styles.grantBtn}
            onPress={requestPermission}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('cameraGrantPermission')}
          >
            <Text style={[styles.grantBtnText, isHindi && styles.hindiText]}>
              {t('cameraGrantPermission')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipPermissionBtn}
            onPress={handleSkipPhoto}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('skipPhotoAndProceed')}
          >
            <Text style={[styles.skipPermissionBtnText, isHindi && styles.hindiText]}>
              {t('skipPhotoAndProceed')} →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ============================================================ */}
      {/* 1. TOP CLINICAL CAMERA HEADER BAR                            */}
      {/* ============================================================ */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          hitSlop={ACCESSIBILITY.hitSlop}
        >
          <Text style={styles.headerBackText}>← {t('cancel')}</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isHindi && styles.hindiText]}>
            {t('captureFacePhoto')}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {displayName} • {patientCode}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerToolBtn, flash === 'on' && styles.headerToolBtnActive]}
            onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${t('flash')}: ${flash === 'on' ? t('flashOn') : t('flashOff')}`}
            hitSlop={ACCESSIBILITY.hitSlop}
          >
            <Text style={styles.headerToolBtnText}>
              ⚡ {flash === 'on' ? t('flashOn') : t('flashOff')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerToolBtn}
            onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('switchCamera')}
            hitSlop={ACCESSIBILITY.hitSlop}
          >
            <Text style={styles.headerToolBtnText}>
              ⇄ {t('switchCamera')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 2. MAIN CAMERA WORKSPACE (LANDSCAPE 60/40 SPLIT)             */}
      {/* ============================================================ */}
      <View style={isLandscape ? styles.bodyLandscape : styles.bodyPortrait}>
        {/* ------------------------------------------------------------ */}
        {/* LEFT 60%: CAMERA VIEWFINDER & SHUTTER                        */}
        {/* ------------------------------------------------------------ */}
        <View style={isLandscape ? styles.viewfinderColLandscape : styles.viewfinderColPortrait}>
          <View style={styles.cameraBox}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              enableTorch={flash === 'on'}
            >
              {/* Camera Status Indicator */}
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>
                  {isHindi ? 'कैमरा तैयार' : 'Camera Ready'}
                </Text>
              </View>

              {/* Clinical Face Oval Framing Guide */}
              <View style={styles.overlay}>
                <View style={styles.faceOval}>
                  <View style={styles.ovalHintBox}>
                    <Text style={styles.ovalHintTitle}>
                      {isHindi ? 'सीधे देखें' : 'LOOK STRAIGHT'}
                    </Text>
                    <Text style={[styles.ovalHintSub, isHindi && styles.hindiText]}>
                      {isHindi ? 'चेहरा फ्रेम के अंदर रखें' : 'POSITION FACE INSIDE FRAME'}
                    </Text>
                  </View>
                </View>
              </View>
            </CameraView>

            {/* Shutter Bar (Centered Shutter Button ~80dp) */}
            <View style={styles.shutterBar}>
              <TouchableOpacity
                style={[styles.shutterBtn, capturing && styles.shutterBtnDisabled]}
                onPress={handleCapture}
                disabled={capturing}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Capture patient photo"
                accessibilityState={{ disabled: capturing, busy: capturing }}
              >
                {capturing ? (
                  <ActivityIndicator size="small" color={ClinicalTheme.colors.primary} />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT 40%: CLINICAL GUIDANCE PANEL                           */}
        {/* ------------------------------------------------------------ */}
        <View style={isLandscape ? styles.protocolColLandscape : styles.protocolColPortrait}>
          {/* Patient Demographic Card */}
          <View style={styles.protocolCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.patientAvatarBox}>
                <Text style={styles.patientAvatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.patientMeta}>
                <Text style={styles.patientName} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.patientBadgeRow}>
                  <View style={styles.codeTag}>
                    <Text style={styles.codeTagText}>{patientCode}</Text>
                  </View>
                  <Text style={styles.patientDemo}>
                    {patient.age} {t('years')} • {patient.gender}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Clinical Positioning Checklist Card */}
          <View style={styles.protocolCard}>
            <Text style={[styles.protocolTitle, isHindi && styles.hindiText]}>
              {isHindi ? 'रोगी फोटो' : 'PATIENT PHOTO'}
            </Text>
            <Text style={[styles.protocolSubtitle, isHindi && styles.hindiText]}>
              {isHindi ? 'क्लिनिकल पोजिशनिंग चेकलिस्ट:' : 'Clinical positioning checklist:'}
            </Text>

            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <View style={styles.checkCircleCompleted}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
                <Text style={[styles.checkText, isHindi && styles.hindiText]}>
                  {isHindi ? 'पर्याप्त प्रकाश' : 'Adequate lighting'}
                </Text>
              </View>

              <View style={styles.checkItem}>
                <View style={styles.checkCircleCompleted}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
                <Text style={[styles.checkText, isHindi && styles.hindiText]}>
                  {isHindi ? 'चेहरा केंद्र में' : 'Face centered'}
                </Text>
              </View>

              <View style={styles.checkItem}>
                <View style={styles.checkCircleCompleted}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
                <Text style={[styles.checkText, isHindi && styles.hindiText]}>
                  {isHindi ? 'रोगी सीधे देख रहे हैं' : 'Patient looking straight'}
                </Text>
              </View>

              <View style={styles.checkItem}>
                <View style={styles.checkCircleCompleted}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
                <Text style={[styles.checkText, isHindi && styles.hindiText]}>
                  {isHindi ? 'सामान्य भाव' : 'Neutral expression'}
                </Text>
              </View>

              <View style={styles.checkItem}>
                <View style={styles.checkCircleCompleted}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
                <Text style={[styles.checkText, isHindi && styles.hindiText]}>
                  {isHindi ? 'चमक होने पर चश्मा हटाएं' : 'Remove glasses if glare is present'}
                </Text>
              </View>
            </View>
          </View>

          {/* Secondary Action: Skip Photo (Subordinate, minHeight: 56dp) */}
          <View style={styles.skipActionCard}>
            <TouchableOpacity
              style={styles.skipSecondaryBtn}
              onPress={handleSkipPhoto}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isHindi ? 'फोटो छोड़ें' : 'Skip Photo'}
            >
              <Text style={[styles.skipSecondaryBtnText, isHindi && styles.hindiText]}>
                {isHindi ? 'फोटो छोड़ें →' : 'Skip Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  containerCenter: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ClinicalTheme.spacing.xl,
  },
  permissionCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    padding: ClinicalTheme.spacing.xxl,
    borderRadius: RADIUS.xl,
    maxWidth: 520,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.elevated,
  },
  textWait: {
    color: ClinicalTheme.colors.textMuted,
    marginTop: ClinicalTheme.spacing.md,
    fontSize: 15,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  grantBtn: {
    backgroundColor: ClinicalTheme.colors.primary,
    paddingHorizontal: 28,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    marginTop: ClinicalTheme.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  grantBtnText: {
    color: ClinicalTheme.colors.textWhite,
    fontWeight: '700',
    fontSize: 15,
  },
  skipPermissionBtn: {
    marginTop: ClinicalTheme.spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  skipPermissionBtnText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontWeight: '700',
    fontSize: 14,
  },

  // -------------------------------------------------------------
  // HEADER BAR
  // -------------------------------------------------------------
  header: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerBack: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
  },
  headerBackText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerToolBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerToolBtnActive: {
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderColor: ClinicalTheme.colors.primaryAccent,
  },
  headerToolBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // -------------------------------------------------------------
  // BODY: 60/40 SPLIT
  // -------------------------------------------------------------
  bodyLandscape: {
    flex: 1,
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  bodyPortrait: {
    flex: 1,
    flexDirection: 'column',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  viewfinderColLandscape: {
    flex: 0.60,
  },
  viewfinderColPortrait: {
    flex: 1,
    minHeight: 420,
  },
  protocolColLandscape: {
    flex: 0.40,
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  protocolColPortrait: {
    gap: SPACING.md,
  },

  // -------------------------------------------------------------
  // CAMERA VIEWFINDER BOX
  // -------------------------------------------------------------
  cameraBox: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    ...ClinicalTheme.shadows.elevated,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 280,
    height: 360,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
  },
  statusPill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 8,
    zIndex: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ovalHintBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
  },
  ovalHintTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ovalHintSub: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Shutter Bar
  shutterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...ClinicalTheme.shadows.elevated,
  },
  shutterBtnDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
  },

  // -------------------------------------------------------------
  // CLINICAL PROTOCOL SIDE PANEL (RIGHT 40%)
  // -------------------------------------------------------------
  protocolCard: {
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...ClinicalTheme.shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  patientAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  patientBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  codeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  codeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  patientDemo: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Protocol Checklist
  protocolTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  protocolSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: SPACING.md,
    lineHeight: 17,
  },
  checklist: {
    gap: SPACING.sm + 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  checkCircleCompleted: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
  },
  checkCirclePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  checkText: {
    fontSize: 12.5,
    color: '#F1F5F9',
    fontWeight: '500',
    flex: 1,
  },

  // Skip Photo Action Card
  skipActionCard: {
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  skipSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  skipSecondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Hindi text safeguards
  hindiText: {
    lineHeight: 22,
  },
});
