import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { Patient, Assessment } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetail'>;

export const PatientDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
      try {
        const p = await ApiService.getPatientById(patientId);
        setPatient(p);
        const allAssessments = await ApiService.getDoctorAssessments();
        setAssessments(allAssessments.filter(a => a.patient_id === patientId));
      } catch (err) {
        console.warn('Patient detail error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [patientId]);

  if (loading || !patient) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading patient medical record...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Patient Medical Record</Text>
        <Text style={styles.subtitle}>ID: {patient.patient_code}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card with Photo */}
        <View style={styles.card}>
          <View style={styles.photoContainer}>
            {patient.face_photo_url ? (
              <Image source={{ uri: patient.face_photo_url }} style={styles.photo} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Text style={styles.placeholderText}>{patient.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>Age: {patient.age} years • {patient.gender}</Text>
            {patient.phone ? <Text style={styles.patientPhone}>📞 {patient.phone}</Text> : null}
            <TouchableOpacity
              style={styles.newAssessBtn}
              onPress={() => navigation.navigate('AssessmentStart', { patient })}
            >
              <Text style={styles.newAssessBtnText}>+ New Assessment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assessment History for this Patient */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Clinical Assessments ({assessments.length})</Text>

          {assessments.length === 0 ? (
            <Text style={styles.emptyNote}>No assessments completed for this patient yet.</Text>
          ) : (
            assessments.map(item => (
              <View key={item.id} style={styles.assessmentItem}>
                <View style={styles.assessHeader}>
                  <Text style={styles.assessDate}>
                    {new Date(item.started_at).toLocaleDateString()}
                  </Text>
                  <View style={styles.tierTag}>
                    <Text style={styles.tierTagText}>
                      {item.risk_analysis?.tier || 'In Progress'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.assessScore}>
                  Score: {item.risk_analysis?.totalScore || 0} pts
                </Text>
                {item.risk_analysis?.recommendation ? (
                  <Text style={styles.assessRec}>{item.risk_analysis.recommendation}</Text>
                ) : null}
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
  center: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 3,
    borderColor: '#38bdf8',
    marginRight: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0284c7',
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  patientMeta: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  patientPhone: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 4,
  },
  newAssessBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  newAssessBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  emptyNote: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  assessmentItem: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  assessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  assessDate: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
  },
  tierTag: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  tierTagText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  assessScore: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
  },
  assessRec: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
});
