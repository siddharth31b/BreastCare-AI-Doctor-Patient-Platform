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
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api.service';
import { Patient, Assessment } from '../types';
import { TABLET_ID } from '../config/constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [fetchedPatients, fetchedAssessments] = await Promise.all([
        ApiService.getDoctorPatients(),
        ApiService.getDoctorAssessments(),
      ]);
      setPatients(fetchedPatients || []);
      setAssessments(fetchedAssessments || []);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const pendingReviewCount = assessments.filter(a => a.status === 'PENDING_DOCTOR_REVIEW' || a.status === 'COMPLETED').length;
  const validatedCount = assessments.filter(a => a.status === 'DOCTOR_VALIDATED').length;
  const urgentCount = assessments.filter(a => a.risk_analysis?.tier === 'Urgent' || a.risk_analysis?.tier === 'High').length;

  return (
    <View style={styles.container}>
      {/* Top Tablet Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user?.name || 'Doctor'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Station: {TABLET_ID}</Text>
            </View>
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.statusBadgeText}>● Online Clinical</Text>
            </View>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={[styles.historyButton, pendingReviewCount > 0 && { borderColor: '#f59e0b' }]}
            onPress={() => navigation.navigate('AssessmentHistory')}
          >
            <Text style={[styles.historyButtonText, pendingReviewCount > 0 && { color: '#fbbf24' }]}>
              📋 Reviews & History {pendingReviewCount > 0 ? `(${pendingReviewCount} Pending)` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#38bdf8" />}
      >
        {/* Primary Call to Action */}
        <TouchableOpacity
          style={styles.newPatientHeroCard}
          onPress={() => navigation.navigate('NewPatient')}
          activeOpacity={0.9}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroIcon}>➕</Text>
            <View>
              <Text style={styles.heroTitle}>New Patient Assessment</Text>
              <Text style={styles.heroSubtitle}>
                Register patient, capture face photo, and start the BreastCare clinical questionnaire
              </Text>
            </View>
          </View>
          <View style={styles.heroActionArrow}>
            <Text style={styles.heroArrowText}>START →</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#0284c7' }]}>
            <Text style={styles.statLabel}>My Patients</Text>
            <Text style={styles.statValue}>{patients.length}</Text>
            <Text style={styles.statHint}>Registered on station</Text>
          </View>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}
            onPress={() => navigation.navigate('AssessmentHistory')}
          >
            <Text style={[styles.statLabel, { color: '#fbbf24' }]}>Pending Doctor Review</Text>
            <Text style={[styles.statValue, { color: '#fbbf24' }]}>{pendingReviewCount}</Text>
            <Text style={styles.statHint}>Require clinical sign-off</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.statLabel}>Validated</Text>
            <Text style={styles.statValue}>{validatedCount}</Text>
            <Text style={styles.statHint}>Signed by physician</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
            <Text style={styles.statLabel}>Urgent / High</Text>
            <Text style={styles.statValue}>{urgentCount}</Text>
            <Text style={styles.statHint}>Priority triage flags</Text>
          </View>
        </View>

        {/* Recent Patients Table / List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Patients on This Tablet</Text>
            <Text style={styles.sectionSub}>Showing latest active records</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#0284c7" style={{ padding: 20 }} />
          ) : patients.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No patients registered on this station yet.</Text>
              <Text style={styles.emptySub}>Tap "New Patient Assessment" above to register your first patient.</Text>
            </View>
          ) : (
            patients.map(p => (
              <View key={p.id} style={styles.patientRow}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientMeta}>
                    Code: {p.patient_code} • Age: {p.age} • Gender: {p.gender}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.assessButton}
                  onPress={() => navigation.navigate('AssessmentStart', { patient: p })}
                >
                  <Text style={styles.assessButtonText}>Start Assessment</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topBar: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  badge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  badgeText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },
  statusBadge: {
    borderColor: '#10b981',
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  historyButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
  },
  newPatientHeroCard: {
    backgroundColor: '#0284c7',
    borderRadius: 18,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flex: 1,
  },
  heroIcon: {
    fontSize: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 4,
    maxWidth: 480,
  },
  heroActionArrow: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroArrowText: {
    color: '#0284c7',
    fontWeight: '800',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    marginVertical: 4,
  },
  statHint: {
    fontSize: 12,
    color: '#64748b',
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sectionSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  patientAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  patientMeta: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  assessButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  assessButtonText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 13,
  },
});
