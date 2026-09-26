import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { PrimaryButton } from './ClinicalButtons';
import { useLanguage } from '../i18n/LanguageContext';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  const { t } = useLanguage();
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={ClinicalTheme.colors.primaryAccent} />
      <Text style={styles.loadingText}>{message || t('loadingRecords')}</Text>
    </View>
  );
};

interface EmptyStateProps {
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
  return (
    <View style={styles.centerContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIconText}>📋</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {actionTitle && onAction ? (
        <View style={styles.actionWrap}>
          <PrimaryButton title={actionTitle} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
}) => {
  const { t } = useLanguage();
  return (
    <View style={styles.centerContainer}>
      <View style={styles.errorIconCircle}>
        <Text style={styles.errorIconText}>⚠️</Text>
      </View>
      <Text style={styles.errorTitle}>{title || t('networkErrorTitle')}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
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
    paddingVertical: ClinicalTheme.spacing.xxl,
    paddingHorizontal: ClinicalTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: ClinicalTheme.spacing.md,
    fontSize: 14,
    color: ClinicalTheme.colors.textMuted,
    fontWeight: '500',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ClinicalTheme.spacing.md,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: ClinicalTheme.colors.textMuted,
    marginTop: ClinicalTheme.spacing.xs,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ClinicalTheme.spacing.md,
  },
  errorIconText: {
    fontSize: 28,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.riskUrgent,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: ClinicalTheme.colors.textMuted,
    marginTop: ClinicalTheme.spacing.xs,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
  },
  actionWrap: {
    marginTop: ClinicalTheme.spacing.lg,
  },
});
