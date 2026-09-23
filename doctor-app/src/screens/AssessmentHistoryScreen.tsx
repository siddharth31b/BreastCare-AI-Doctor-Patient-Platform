import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { Assessment } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentHistory'>;

export const AssessmentHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssessments = async () => {
    try {
      const data = await ApiService.getDoctorAssessments();
      setAssessments(data || []);
    } catch (err) {
      console.warn('Load assessments error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssessments();
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Urgent':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      case 'High':
        return { bg: 'rgba(249, 115, 22, 0.2)', text: '#f97316' };
      case 'Moderate':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Assessment History</Text>
        <Text style={styles.subtitle}>All patient triage screenings recorded on this doctor account.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#38bdf8" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
        ) : assessments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No assessments recorded yet.</Text>
          </View>
        ) : (
          assessments.map(item => {
            const tier = item.risk_analysis?.tier || 'Low';
            const tierStyle = getTierColor(tier);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate('PhysicianReview', { assessmentId: item.id, patient: item.patient })}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.patientName}>{item.patient?.name || 'Patient'}</Text>
                    <Text style={styles.patientMeta}>
                      Code: {item.patient?.patient_code} • {new Date(item.started_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: tierStyle.bg }]}>
                    <Text style={[styles.tierBadgeText, { color: tierStyle.text }]}>
                      {tier.toUpperCase()} RISK
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.scoreText}>
                    Clinical Score: <Text style={{ fontWeight: '800', color: '#f8fafc' }}>{item.risk_analysis?.totalScore || 0} pts</Text>
                  </Text>
                  <Text style={styles.statusText}>
                    Review: <Text style={{
                      color: item.status === 'DOCTOR_VALIDATED' ? '#34d399' : item.status === 'REASSESSMENT_REQUESTED' ? '#fbbf24' : '#38bdf8',
                      fontWeight: '700'
                    }}>
                      {item.status === 'DOCTOR_VALIDATED'
                        ? `✓ VALIDATED (${item.reviewed_by || 'Dr.'})`
                        : item.status === 'REASSESSMENT_REQUESTED'
                        ? '⚠️ REASSESSMENT REQ'
                        : '⏳ PENDING REVIEW'}
                    </Text>
                  </Text>
                </View>

                {item.risk_analysis?.recommendation && (
                  <Text style={styles.recommendationSnippet} numberOfLines={2}>
                    {item.risk_analysis.recommendation}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  patientMeta: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  scoreText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  recommendationSnippet: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
  },
});
