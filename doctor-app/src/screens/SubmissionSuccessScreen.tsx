import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SubmissionSuccess'>;

export const SubmissionSuccessScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, clinicalResult } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Assessment Completed</Text>
        <Text style={styles.subtitle}>
          The clinical findings for patient {patient.name} ({patient.patient_code}) have been securely stored in the medical database.
        </Text>

        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeLabel}>Assessed Status</Text>
          <Text style={styles.summaryBadgeVal}>
            {clinicalResult.tier.toUpperCase()} RISK TIER ({clinicalResult.totalScore} pts)
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.primaryBtnText}>Return to Doctor Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('NewPatient')}
          >
            <Text style={styles.secondaryBtnText}>+ Start Another Patient Assessment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  checkCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryBadge: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginTop: 20,
    alignItems: 'center',
  },
  summaryBadgeLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryBadgeVal: {
    fontSize: 16,
    color: '#38bdf8',
    fontWeight: '800',
    marginTop: 2,
  },
  actions: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
});
