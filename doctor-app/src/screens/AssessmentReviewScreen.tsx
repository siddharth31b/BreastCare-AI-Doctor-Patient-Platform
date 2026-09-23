import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentReview'>;

export const AssessmentReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, assessmentId, clinicalResult, answersMap, riskProfile } = route.params;
  const [submitting, setSubmitting] = useState<boolean>(false);

  const tierColors: Record<string, { bg: string; border: string; text: string }> = {
    Low: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399' },
    Moderate: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24' },
    High: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#fb923c' },
    Urgent: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171' },
  };

  const currentTheme = tierColors[clinicalResult.tier] || tierColors.Low;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ApiService.submitAssessment(assessmentId, riskProfile, answersMap);
      navigation.replace('SubmissionSuccess', {
        patient,
        assessmentId,
        clinicalResult,
      });
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Unable to persist assessment to medical database.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Modify Answers</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinical Risk Triage Review</Text>
        <Text style={styles.headerSub}>
          Patient: {patient.name} ({patient.patient_code})
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Risk Tier Hero Badge */}
        <View
          style={[
            styles.tierCard,
            { backgroundColor: currentTheme.bg, borderColor: currentTheme.border },
          ]}
        >
          <Text style={styles.tierSubText}>ASSESSED CLINICAL RISK TIER</Text>
          <Text style={[styles.tierTitle, { color: currentTheme.text }]}>
            {clinicalResult.tier.toUpperCase()} RISK
          </Text>
          <Text style={styles.totalScore}>
            Total Weighted Clinical Score: {clinicalResult.totalScore} pts
          </Text>
          {clinicalResult.override.triggered && (
            <View style={styles.overrideAlert}>
              <Text style={styles.overrideAlertTitle}>
                ⚠️ Safety Escalation Override: {clinicalResult.override.ruleName}
              </Text>
              <Text style={styles.overrideAlertDesc}>{clinicalResult.override.reason}</Text>
            </View>
          )}
        </View>

        {/* Clinical Recommendation */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Physician Action Recommendation</Text>
          <Text style={styles.recommendationText}>{clinicalResult.recommendation}</Text>
          <Text style={styles.interpretationText}>{clinicalResult.interpretation}</Text>
        </View>

        {/* Score Breakdown Grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Protocol Phase Breakdown</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCol}>
              <Text style={styles.colLabel}>Phase 0 (BRM)</Text>
              <Text style={styles.colValue}>+{clinicalResult.brm.score} pts</Text>
              <Text style={styles.colHint}>Baseline Risk</Text>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={styles.colLabel}>Phase 1 (Primary)</Text>
              <Text style={styles.colValue}>
                {clinicalResult.symptomScoring.phase1Weighted} pts
              </Text>
              <Text style={styles.colHint}>
                {clinicalResult.symptomScoring.positiveCountPhase1} findings
              </Text>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={styles.colLabel}>Phase 2 (Regional)</Text>
              <Text style={styles.colValue}>
                {clinicalResult.symptomScoring.phase2Weighted} pts
              </Text>
              <Text style={styles.colHint}>
                {clinicalResult.symptomScoring.positiveCountPhase2} findings
              </Text>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={styles.colLabel}>Phase 3 (Systemic)</Text>
              <Text style={styles.colValue}>
                {clinicalResult.symptomScoring.phase3Weighted} pts
              </Text>
              <Text style={styles.colHint}>
                {clinicalResult.symptomScoring.positiveCountPhase3} findings
              </Text>
            </View>
          </View>
        </View>

        {/* Key Positive Findings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Positive Clinical Findings ({clinicalResult.keyFindings.length})
          </Text>
          {clinicalResult.keyFindings.length === 0 ? (
            <Text style={styles.emptyFindings}>No positive symptom indicators reported.</Text>
          ) : (
            clinicalResult.keyFindings.map((finding, idx) => (
              <View key={idx} style={styles.findingItem}>
                <Text style={styles.findingBullet}>•</Text>
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))
          )}
        </View>

        {/* Submit to Supabase / Backend Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>💾 Save Assessment & Submit Report →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    marginBottom: 6,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  tierCard: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  tierSubText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94a3b8',
  },
  tierTitle: {
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 4,
  },
  totalScore: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
  },
  overrideAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    width: '100%',
  },
  overrideAlertTitle: {
    color: '#f87171',
    fontWeight: '800',
    fontSize: 14,
  },
  overrideAlertDesc: {
    color: '#fecaca',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
    fontWeight: '600',
  },
  interpretationText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCol: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  colLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  colValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginVertical: 4,
  },
  colHint: {
    fontSize: 10,
    color: '#64748b',
  },
  emptyFindings: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  findingBullet: {
    color: '#38bdf8',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
  },
  findingText: {
    color: '#cbd5e1',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#0284c7',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
