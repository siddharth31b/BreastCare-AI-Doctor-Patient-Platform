import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClinicalTheme, ACCESSIBILITY, SPACING, RADIUS, ELEVATION } from '../theme/clinicalTheme';
import { LanguageSwitcher, useLanguage } from '../i18n/LanguageContext';

interface ClinicalHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  showMonogram?: boolean;
  monogramText?: string;
  rightAction?: React.ReactNode;
  hideLanguageSwitcher?: boolean;
  stationId?: string;
}

export const ClinicalHeader: React.FC<ClinicalHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel,
  showMonogram = true,
  monogramText = 'BC',
  rightAction,
  hideLanguageSwitcher = false,
  stationId,
}) => {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <View style={styles.header}>
      <View style={styles.leftCol}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={backLabel || t('goBack')}
            hitSlop={ACCESSIBILITY.hitSlopLarge}
          >
            <Text style={styles.backButtonText}>← {backLabel || t('goBack')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleRow}>
          {showMonogram && (
            <View style={styles.monogramBox}>
              <Text style={styles.monogramText}>{monogramText}</Text>
            </View>
          )}
          <View style={styles.titleTextCol}>
            <View style={styles.brandRow}>
              <Text style={styles.brandTag}>{t('appTitle')}</Text>
              <Text style={styles.brandDot}>•</Text>
              <Text style={styles.brandSub}>{t('brandSubtitle')}</Text>
              {stationId ? (
                <View style={styles.stationPill}>
                  <Text style={styles.stationText}>{t('station')} {stationId}</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[styles.title, isHindi && styles.titleHindi]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, isHindi && styles.subtitleHindi]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.rightCol}>
        {rightAction}
        {!hideLanguageSwitcher && <LanguageSwitcher />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: ClinicalTheme.colors.surface,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: 48,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.borderDefault,
    ...ClinicalTheme.shadows.card,
  },
  leftCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  backButton: {
    minHeight: ACCESSIBILITY.minTouchTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backButtonText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  monogramBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: ClinicalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    color: ClinicalTheme.colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleTextCol: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  brandTag: {
    fontSize: 12,
    fontWeight: '800',
    color: ClinicalTheme.colors.primary,
    letterSpacing: -0.2,
  },
  brandDot: {
    fontSize: 10,
    color: ClinicalTheme.colors.textMuted,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  stationPill: {
    backgroundColor: ClinicalTheme.colors.bgMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    marginLeft: 4,
  },
  stationText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClinicalTheme.colors.textMuted,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  titleHindi: {
    fontSize: 22,
    lineHeight: 33,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  subtitleHindi: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
});
