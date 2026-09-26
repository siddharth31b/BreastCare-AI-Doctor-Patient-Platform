import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  rightElement,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    marginBottom: ClinicalTheme.spacing.md,
    paddingBottom: ClinicalTheme.spacing.xs,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 2,
  },
});
