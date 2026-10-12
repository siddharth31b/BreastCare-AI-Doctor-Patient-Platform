import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigation.replace('Dashboard');
      } else {
        navigation.replace('Login');
      }
    }
  }, [isLoading, user, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.monogramBox}>
        <Text style={styles.monogramText}>BC</Text>
      </View>
      <Text style={styles.brandTitle}>{t('brandTitle')}</Text>
      <Text style={styles.appTitle}>{t('appTitle')}</Text>
      <Text style={styles.subtitle}>{t('brandSubtitle')}</Text>
      <ActivityIndicator
        size="large"
        color={ClinicalTheme.colors.primaryAccent}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ClinicalTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ClinicalTheme.spacing.xl,
  },
  monogramBox: {
    width: 84,
    height: 84,
    borderRadius: ClinicalTheme.radius.xl,
    backgroundColor: ClinicalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ClinicalTheme.spacing.lg,
    ...ClinicalTheme.shadows.elevated,
  },
  monogramText: {
    fontSize: 32,
    fontWeight: '800',
    color: ClinicalTheme.colors.textWhite,
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ClinicalTheme.colors.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: ClinicalTheme.colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: ClinicalTheme.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  loader: {
    marginTop: ClinicalTheme.spacing.xxl,
  },
});
