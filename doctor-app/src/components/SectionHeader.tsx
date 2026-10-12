import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClinicalTheme, SPACING } from '../theme/clinicalTheme';
import { useLanguage } from '../i18n/LanguageContext';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  rightElement,
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <View style={styles.container}>
      <View style={styles.textCol}>
        <Text style={[styles.title, isHindi && styles.titleHindi]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isHindi && styles.subtitleHindi]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  titleHindi: {
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
  },
  subtitleHindi: {
    lineHeight: 20,
  },
});
