import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentStart'>;

export const AssessmentStartScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient } = route.params;
  const [starting, setStarting] = useState(false);

  const handleStartChatbot = async () => {
    setStarting(true);
    try {
      const assessment = await ApiService.startAssessment(patient.id, {
        age: patient.age,
        gender: patient.gender,
      });

      navigation.navigate('Chatbot', {
        patient,
        assessmentId: assessment.id,
      });
    } catch (err: any) {
      Alert.alert('Initialization Failed', err.message || 'Could not start clinical assessment session.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Clinical Breast Assessment</Text>
        <Text style={styles.subtitle}>Patient verified and photo recorded. Ready to begin guided triage.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Patient Profile Card */}
        <View style={styles.patientCard}>
          <View style={styles.photoWrapper}>
            {patient.face_photo_url ? (
              <Image source={{ uri: patient.face_photo_url }} style={styles.patientPhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>{patient.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientCode}>ID: {patient.patient_code}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{patient.age} yrs old</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{patient.gender}</Text>
              </View>
              {patient.phone ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{patient.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Clinical Protocol Phases */}
        <View style={styles.phasesCard}>
          <Text style={styles.phasesTitle}>BreastCare Multi-Phase Protocol</Text>

          <View style={styles.phaseItem}>
            <View style={[styles.phaseDot, { backgroundColor: '#38bdf8' }]} />
            <View style={styles.phaseTextCol}>
              <Text style={styles.phaseHeading}>Phase 0 · Baseline Risk Profile</Text>
              <Text style={styles.phaseDesc}>Age, reproductive history, breastfeeding, contraceptives, family cancer history</Text>
            </View>
          </View>

          <View style={styles.phaseItem}>
            <View style={[styles.phaseDot, { backgroundColor: '#0284c7' }]} />
            <View style={styles.phaseTextCol}>
              <Text style={styles.phaseHeading}>Phase 1 · Primary Breast Screening</Text>
              <Text style={styles.phaseDesc}>Bilateral examination: palpable lump, retraction, discharge, dimpling, skin changes</Text>
            </View>
          </View>

          <View style={styles.phaseItem}>
            <View style={[styles.phaseDot, { backgroundColor: '#f59e0b' }]} />
            <View style={styles.phaseTextCol}>
              <Text style={styles.phaseHeading}>Phase 2 · Regional Spread Screening</Text>
              <Text style={styles.phaseDesc}>Axillary (armpit) lymph nodes, neck lumps, swelling, localized weakness</Text>
            </View>
          </View>

          <View style={styles.phaseItem}>
            <View style={[styles.phaseDot, { backgroundColor: '#ef4444' }]} />
            <View style={styles.phaseTextCol}>
              <Text style={styles.phaseHeading}>Phase 3 · Systemic & Distant Screening</Text>
              <Text style={styles.phaseDesc}>Respiratory, central nervous system, musculoskeletal, and abdominal screening</Text>
            </View>
          </View>

          <View style={styles.phaseItem}>
            <View style={[styles.phaseDot, { backgroundColor: '#10b981' }]} />
            <View style={styles.phaseTextCol}>
              <Text style={styles.phaseHeading}>Phase 4 · Clinical Risk Analysis</Text>
              <Text style={styles.phaseDesc}>Weighted mathematical scoring, safety escalation overrides, diagnostic recommendations</Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startBtn, starting && styles.startBtnDisabled]}
          onPress={handleStartChatbot}
          disabled={starting}
        >
          {starting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.startBtnText}>💬 Launch Guided Chatbot Assessment →</Text>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  patientCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  photoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#38bdf8',
    marginRight: 18,
  },
  patientPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0369a1',
  },
  photoPlaceholderText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  patientCode: {
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  phasesCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  phasesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  phaseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    marginRight: 14,
  },
  phaseTextCol: {
    flex: 1,
  },
  phaseHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  phaseDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 18,
  },
  startBtn: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#0284c7',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnDisabled: {
    opacity: 0.6,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
});
