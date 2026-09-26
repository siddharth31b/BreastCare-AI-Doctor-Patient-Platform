import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { LanguageSwitcher, useLanguage } from '../i18n/LanguageContext';

interface ClinicalHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  showMonogram?: boolean;
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
  rightAction,
  hideLanguageSwitcher = false,
  stationId,
}) => {
  const { t } = useLanguage();

  return (
    <View style={styles.header}>
      <View style={styles.leftCol}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backButtonText}>← {backLabel || t('goBack')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleRow}>
          {showMonogram && (
            <View style={styles.monogramBox}>
              <Text style={styles.monogramText}>NS</Text>
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
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
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
    paddingHorizontal: ClinicalTheme.spacing.xl,
    paddingTop: 48,
    paddingBottom: ClinicalTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ClinicalTheme.colors.border,
    ...ClinicalTheme.shadows.card,
  },
  leftCol: {
    flex: 1,
    paddingRight: ClinicalTheme.spacing.md,
  },
  backButton: {
    marginBottom: ClinicalTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: ClinicalTheme.colors.primaryAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ClinicalTheme.spacing.md,
  },
  monogramBox: {
    width: 44,
    height: 44,
    borderRadius: ClinicalTheme.radius.md,
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
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.border,
    marginLeft: 4,
  },
  stationText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClinicalTheme.colors.textMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ClinicalTheme.spacing.md,
  },
});
