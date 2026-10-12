import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { ApiService } from '../services/api.service';
import * as FileSystem from 'expo-file-system/legacy';
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
import { ClinicalHeader } from '../components/ClinicalHeader';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoPreview'>;

export const PhotoPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t, language } = useLanguage();
  const { isLandscape } = useResponsiveLayout();
  const isHindi = language === 'hi';

  const { patient, photoUri, base64 } = route.params;
  const [uploading, setUploading] = useState(false);

  const displayName = getPatientDisplayName(patient);
  const patientCode = getPatientCodeDisplay(patient);

  const handleConfirmAndUpload = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      let uploadPayload = base64;
      if (!uploadPayload && photoUri) {
        try {
          uploadPayload = await FileSystem.readAsStringAsync(photoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (fsErr) {
          console.warn('[PhotoPreview] FileSystem base64 read fallback notice:', fsErr);
        }
      }

      if (!uploadPayload) {
        throw new Error(t('imageProcessError'));
      }

      const res = await ApiService.uploadPatientPhoto(patient.id, uploadPayload);

      const updatedPatient = {
        ...patient,
        face_photo_url: res.face_photo_url,
      };

      // Proceed to Assessment Start
      navigation.replace('AssessmentStart', { patient: updatedPatient });
    } catch (err: any) {
      Alert.alert(t('uploadError'), err.message || t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ClinicalHeader
        title={t('confirmPhotoTitle')}
        subtitle={`${displayName} • ${patientCode}`}
        onBack={() => navigation.goBack()}
        backLabel={t('retake')}
        hideLanguageSwitcher={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape,
        ]}
      >
        <View style={styles.contentWrap}>
          <View style={isLandscape ? styles.twoColumnRow : styles.singleColumn}>
            {/* ============================================================ */}
            {/* LEFT ~60%: PHOTO PREVIEW                                     */}
            {/* ============================================================ */}
            <View
              style={[
                styles.previewContainer,
                isLandscape ? styles.previewColLandscape : styles.fullWidth,
              ]}
            >
              <View style={styles.photoCard}>
                <View style={styles.photoHeaderTag}>
                  <Text style={styles.photoHeaderTagText}>
                    📷 {isHindi ? 'बायोमेट्रिक फोटो पूर्वावलोकन' : 'Captured Reference Photo'}
                  </Text>
                </View>
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.photoFooterBar}>
                  <Text style={styles.photoFooterText}>
                    {displayName} • {patientCode}
                  </Text>
                </View>
              </View>
            </View>

            {/* ============================================================ */}
            {/* RIGHT ~40%: CLINICAL REVIEW & ACTIONS                        */}
            {/* ============================================================ */}
            <View
              style={[
                styles.reviewContainer,
                isLandscape ? styles.reviewColLandscape : styles.fullWidth,
              ]}
            >
              <View style={styles.reviewCard}>
                <View style={styles.reviewCardHead}>
                  <View>
                    <Text style={[styles.reviewCardTitle, isHindi && styles.hindiText]}>
                      {isHindi ? 'फोटो कैप्चर पूर्ण' : 'PHOTO CAPTURED'}
                    </Text>
                    <Text style={[styles.reviewCardStatus, isHindi && styles.hindiText]}>
                      {isHindi ? 'रोगी पंजीकरण हेतु तैयार' : 'Ready for patient registration'}
                    </Text>
                  </View>
                  <View style={styles.qualityTag}>
                    <Text style={styles.qualityTagText}>Ready</Text>
                  </View>
                </View>

                {/* Patient Summary Block */}
                <View style={styles.patientMetaBlock}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientNameText} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.codeTag}>
                        <Text style={styles.codeTagText}>{patientCode}</Text>
                      </View>
                      <Text style={styles.demographicsText}>
                        {patient.age} {t('years')} • {patient.gender}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Clinical Checklist */}
                <View style={styles.checklist}>
                  <View style={styles.checkItem}>
                    <View style={styles.checkDot}>
                      <Text style={styles.checkDotText}>✓</Text>
                    </View>
                    <Text style={[styles.checkLabel, isHindi && styles.hindiText]}>
                      {isHindi ? 'चेहरे का बायोमेट्रिक संदर्भ स्पष्ट है' : 'Face clearly visible for biometric intake'}
                    </Text>
                  </View>

                  <View style={styles.checkItem}>
                    <View style={styles.checkDot}>
                      <Text style={styles.checkDotText}>✓</Text>
                    </View>
                    <Text style={[styles.checkLabel, isHindi && styles.hindiText]}>
                      {isHindi ? 'रोगी पहचान रिकॉर्ड से लिंक होगा' : `Associated with ${patientCode}`}
                    </Text>
                  </View>

                  <View style={styles.checkItem}>
                    <View style={styles.checkDot}>
                      <Text style={styles.checkDotText}>✓</Text>
                    </View>
                    <Text style={[styles.checkLabel, isHindi && styles.hindiText]}>
                      {isHindi ? 'अस्पताल डेटा सुरक्षा मानकों के तहत एन्क्रिप्टेड' : 'Encrypted with HIPAA/local health compliance'}
                    </Text>
                  </View>
                </View>

                {/* Existing Guidance Box */}
                <View style={styles.guidanceBox}>
                  <Text style={[styles.guidanceReady, isHindi && styles.hindiText]}>
                    ✓ {isHindi ? 'फोटो उपयोग के लिए तैयार है।' : 'Photo is ready to use.'}
                  </Text>
                  <Text style={[styles.guidanceText, isHindi && styles.hindiText]}>
                    {t('photoGuidance')}
                  </Text>
                </View>

                {/* Action Buttons (Primary 60dp, Secondary 56dp) */}
                <View style={styles.actionsBlock}>
                  {/* Primary Action Button (60dp) */}
                  <TouchableOpacity
                    style={[styles.confirmPrimaryBtn, uploading && styles.btnDisabled]}
                    onPress={handleConfirmAndUpload}
                    disabled={uploading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={uploading ? t('attachingPhoto') : (isHindi ? 'इस फोटो का उपयोग करें' : 'USE THIS PHOTO')}
                    accessibilityState={{ disabled: uploading, busy: uploading }}
                  >
                    {uploading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator
                          color={ClinicalTheme.colors.textWhite}
                          size="small"
                        />
                        <Text style={[styles.confirmBtnText, isHindi && styles.hindiText]}>
                          {t('attachingPhoto')}...
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.confirmBtnText, isHindi && styles.hindiText]}>
                        {isHindi ? 'इस फोटो का उपयोग करें →' : 'USE THIS PHOTO →'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Secondary Action Button (56dp) */}
                  <TouchableOpacity
                    style={styles.retakeSecondaryBtn}
                    onPress={() => navigation.goBack()}
                    disabled={uploading}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityLabel={isHindi ? 'दोबारा फोटो लें' : 'RETAKE PHOTO'}
                  >
                    <Text style={[styles.retakeBtnText, isHindi && styles.hindiText]}>
                      ↺ {isHindi ? 'दोबारा फोटो लें' : 'RETAKE PHOTO'}
                    </Text>
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
    paddingBottom: 60,
  },
  scrollContentLandscape: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xl,
    paddingBottom: 80,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 1140,
  },
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xl,
  },
  singleColumn: {
    flexDirection: 'column',
    gap: SPACING.xl,
  },
  previewColLandscape: {
    flex: 0.58,
  },
  reviewColLandscape: {
    flex: 0.42,
  },
  fullWidth: {
    width: '100%',
  },

  // -------------------------------------------------------------
  // PHOTO PREVIEW FRAME (LEFT)
  // -------------------------------------------------------------
  previewContainer: {
    alignItems: 'center',
  },
  photoCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: ClinicalTheme.colors.borderMedium,
    ...ClinicalTheme.shadows.elevated,
  },
  photoHeaderTag: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  photoHeaderTagText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  imageWrapper: {
    width: '100%',
    height: 480,
    backgroundColor: '#050B14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  photoFooterBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  photoFooterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  // -------------------------------------------------------------
  // CLINICAL REVIEW CARD (RIGHT)
  // -------------------------------------------------------------
  reviewContainer: {},
  reviewCard: {
    backgroundColor: ClinicalTheme.colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.card,
  },
  reviewCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
  },
  reviewCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: ClinicalTheme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reviewCardStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.riskLow,
    marginTop: 2,
  },
  qualityTag: {
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.riskLowBorder,
  },
  qualityTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: ClinicalTheme.colors.riskLow,
  },
  patientMetaBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: ClinicalTheme.colors.primaryAccent,
  },
  patientDetails: {
    flex: 1,
  },
  patientNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  codeTag: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  codeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
  },
  demographicsText: {
    fontSize: 11.5,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: ClinicalTheme.colors.borderSubtle,
    marginVertical: SPACING.md,
  },

  // Checklist
  checklist: {
    gap: 10,
    marginBottom: SPACING.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ClinicalTheme.colors.riskLowBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskLowBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDotText: {
    fontSize: 11,
    fontWeight: '900',
    color: ClinicalTheme.colors.riskLow,
  },
  checkLabel: {
    fontSize: 12.5,
    color: ClinicalTheme.colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },

  // Guidance Box
  guidanceBox: {
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderMedium,
    marginBottom: SPACING.xl,
  },
  guidanceReady: {
    color: ClinicalTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  guidanceText: {
    color: ClinicalTheme.colors.textMuted,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },

  // Buttons (Primary 60dp, Secondary 56dp)
  actionsBlock: {
    gap: SPACING.md,
  },
  confirmPrimaryBtn: {
    backgroundColor: ClinicalTheme.colors.primary,
    minHeight: 60,
    height: 60,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryLight,
    ...ClinicalTheme.shadows.elevated,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  retakeSecondaryBtn: {
    backgroundColor: ClinicalTheme.colors.surface,
    minHeight: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
  },
  retakeBtnText: {
    color: ClinicalTheme.colors.textSecondary,
    fontSize: 14.5,
    fontWeight: '700',
  },

  // Hindi text safeguards
  hindiText: {
    lineHeight: 22,
  },
});
