import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ClinicalTheme, SPACING, RADIUS, TOUCH_TARGETS } from '../theme/clinicalTheme';
import { PrimaryButton } from './ClinicalButtons';
import { useLanguage } from '../i18n/LanguageContext';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <View style={styles.centerContainer} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={ClinicalTheme.colors.primaryAccent} />
      <Text style={[styles.loadingText, isHindi && styles.textHindi]}>
        {message || t('loadingRecords')}
      </Text>
    </View>
  );
};

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  actionTitle,
  onAction,
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <View style={styles.centerContainer} accessibilityRole="summary">
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIconText}>📋</Text>
      </View>
      <Text style={[styles.emptyTitle, isHindi && styles.titleHindi]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, isHindi && styles.subtitleHindi]}>
          {subtitle}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <View style={styles.actionWrap}>
          <PrimaryButton title={actionTitle} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
}) => {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <View style={styles.centerContainer} accessibilityRole="alert">
      <View style={styles.errorIconCircle}>
        <Text style={styles.errorIconText}>⚠️</Text>
      </View>
      <Text style={[styles.errorTitle, isHindi && styles.titleHindi]}>
        {title || t('networkErrorTitle')}
      </Text>
      <Text style={[styles.errorMessage, isHindi && styles.subtitleHindi]}>
        {message}
      </Text>
      {onRetry ? (
        <View style={styles.actionWrap}>
          <PrimaryButton title={t('retry')} onPress={onRetry} variant="teal" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: SPACING['4xl'],
    paddingHorizontal: SPACING['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: 15,
    lineHeight: 22,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyIconText: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: ClinicalTheme.colors.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    maxWidth: 420,
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: ClinicalTheme.colors.errorBg,
    borderWidth: 1,
    borderColor: ClinicalTheme.colors.errorBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorIconText: {
    fontSize: 30,
  },
  errorTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: ClinicalTheme.colors.riskUrgent,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: ClinicalTheme.colors.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    maxWidth: 420,
  },
  titleHindi: {
    lineHeight: 27,
  },
  subtitleHindi: {
    lineHeight: 22,
  },
  textHindi: {
    lineHeight: 24,
  },
  actionWrap: {
    marginTop: SPACING['2xl'],
    minWidth: 200,
  },
});
