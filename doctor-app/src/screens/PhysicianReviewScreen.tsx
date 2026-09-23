import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { Assessment, Patient } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PhysicianReview'>;

export const PhysicianReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { assessmentId } = route.params;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Review Form state
  const [doctorNote, setDoctorNote] = useState<string>('');
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);

  // Reassessment Modal state
  const [reassessModalVisible, setReassessModalVisible] = useState<boolean>(false);
  const [reassessReason, setReassessReason] = useState<string>('');

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAssessmentById(assessmentId);
      setAssessment(data);
      if (data?.doctor_note) {
        setDoctorNote(data.doctor_note);
      }
    } catch (err: any) {
      Alert.alert('Load Failed', err.message || 'Unable to load assessment record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const handleValidate = async () => {
    if (!hasConfirmed) {
      Alert.alert('Review Required', 'Please check the box confirming you have reviewed the patient findings.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await ApiService.validateAssessment(assessmentId, doctorNote);
      setAssessment(res.assessment);
      Alert.alert('Assessment Validated', 'The assessment has been successfully marked as DOCTOR_VALIDATED.');
    } catch (err: any) {
      Alert.alert('Validation Error', err.message || 'Failed to validate assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestReassessment = async () => {
    if (!reassessReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a clinical reason for requesting reassessment.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await ApiService.requestReassessment(assessmentId, reassessReason.trim(), doctorNote);
      setAssessment(res.assessment);
      setReassessModalVisible(false);
      setReassessReason('');
      Alert.alert('Reassessment Requested', 'Assessment status updated to REASSESSMENT_REQUESTED.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to request reassessment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading clinical dossier for physician review...</Text>
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#f87171', fontSize: 16 }}>Clinical assessment #{assessmentId} not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const patient = assessment.patient;
  const risk = assessment.risk_analysis;
  const status = assessment.status;
  const isPending = status === 'PENDING_DOCTOR_REVIEW' || status === 'COMPLETED';
  const isValidated = status === 'DOCTOR_VALIDATED';
  const isReassessment = status === 'REASSESSMENT_REQUESTED';

  const tierColors: Record<string, { bg: string; border: string; text: string }> = {
    Low: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399' },
    Moderate: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24' },
    High: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#fb923c' },
    Urgent: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171' },
  };
  const currentTier = risk?.tier || 'Low';
  const theme = tierColors[currentTier] || tierColors.Low;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Physician Clinical Validation</Text>
          <Text style={styles.headerSub}>
            Patient: {patient?.name || 'Patient'} ({patient?.patient_code || 'ID'}) • Session #{assessment.id.slice(0, 8)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Notification Banner */}
        {isValidated && (
          <View style={styles.validatedBanner}>
            <Text style={styles.bannerTitle}>✓ Assessment Validated</Text>
            <Text style={styles.bannerMeta}>Reviewing Physician: {assessment.reviewed_by || 'Assigned Physician'}</Text>
            {assessment.reviewed_at && (
              <Text style={styles.bannerTime}>Timestamp: {new Date(assessment.reviewed_at).toLocaleString()}</Text>
            )}
            {assessment.doctor_note && (
              <Text style={styles.bannerNote}>Doctor Note: {assessment.doctor_note}</Text>
            )}
          </View>
        )}

        {isReassessment && (
          <View style={styles.reassessmentBanner}>
            <Text style={styles.bannerTitleAlert}>⚠️ Reassessment Requested</Text>
            <Text style={styles.bannerReason}>Reason: {assessment.reassessment_reason}</Text>
            <Text style={styles.bannerMeta}>Requested By: {assessment.reviewed_by || 'Assigned Physician'}</Text>
            {assessment.reviewed_at && (
              <Text style={styles.bannerTime}>Timestamp: {new Date(assessment.reviewed_at).toLocaleString()}</Text>
            )}
          </View>
        )}

        {isPending && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingTitle}>⏳ Pending Doctor Review</Text>
            <Text style={styles.pendingSub}>This assessment requires clinical review and sign-off by the attending physician.</Text>
          </View>
        )}

        {/* Patient Demographics Card with Photo */}
        <View style={styles.card}>
          <View style={styles.patientRow}>
            <View style={styles.photoContainer}>
              {patient?.face_photo_url ? (
                <Image source={{ uri: patient.face_photo_url }} style={styles.photo} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Text style={styles.placeholderText}>{patient?.name?.charAt(0) || 'P'}</Text>
                </View>
              )}
            </View>
            <View style={styles.patientInfoCol}>
              <Text style={styles.patientName}>{patient?.name || 'Patient Name'}</Text>
              <Text style={styles.patientMetaText}>
                Code: <Text style={styles.highlight}>{patient?.patient_code || '—'}</Text> • Age: {patient?.age || '—'} yrs • {patient?.gender || 'Female'}
              </Text>
              {patient?.phone ? (
                <Text style={styles.patientPhone}>Phone: {patient.phone}</Text>
              ) : null}
              <Text style={styles.sessionDate}>
                Screening Date: {new Date(assessment.started_at).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Clinical Risk Summary Card */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <View style={[styles.tierHeader, { backgroundColor: theme.bg }]}>
            <Text style={styles.tierSub}>ASSESSED CLINICAL RISK TIER</Text>
            <Text style={[styles.tierTitle, { color: theme.text }]}>
              {currentTier.toUpperCase()} RISK ({risk?.totalScore ?? 0} pts)
            </Text>
          </View>

          {risk?.override?.triggered && (
            <View style={styles.overrideBox}>
              <Text style={styles.overrideTitle}>🚨 Clinical Safety Override: {risk.override.ruleName}</Text>
              <Text style={styles.overrideReason}>{risk.override.reason}</Text>
            </View>
          )}

          <View style={styles.recommendationBox}>
            <Text style={styles.boxTitle}>Physician Action Recommendation</Text>
            <Text style={styles.recommendationText}>{risk?.recommendation || 'Evaluation complete.'}</Text>
            {risk?.interpretation ? (
              <Text style={styles.interpretationText}>{risk.interpretation}</Text>
            ) : null}
          </View>

          {/* Phase 0-3 Grid */}
          <Text style={[styles.boxTitle, { marginTop: 12 }]}>Multi-Phase Scoring Breakdown</Text>
          <View style={styles.phaseGrid}>
            <View style={styles.phaseCol}>
              <Text style={styles.phaseLabel}>Phase 0 (BRM)</Text>
              <Text style={styles.phaseScore}>+{risk?.brm?.score ?? 0} pts</Text>
              <Text style={styles.phaseHint}>Baseline Risk</Text>
            </View>
            <View style={styles.phaseCol}>
              <Text style={styles.phaseLabel}>Phase 1 (Primary)</Text>
              <Text style={styles.phaseScore}>{risk?.symptomScoring?.phase1Weighted ?? 0} pts</Text>
              <Text style={styles.phaseHint}>{risk?.symptomScoring?.positiveCountPhase1 ?? 0} pos findings</Text>
            </View>
            <View style={styles.phaseCol}>
              <Text style={styles.phaseLabel}>Phase 2 (Regional)</Text>
              <Text style={styles.phaseScore}>{risk?.symptomScoring?.phase2Weighted ?? 0} pts</Text>
              <Text style={styles.phaseHint}>{risk?.symptomScoring?.positiveCountPhase2 ?? 0} pos findings</Text>
            </View>
            <View style={styles.phaseCol}>
              <Text style={styles.phaseLabel}>Phase 3 (Systemic)</Text>
              <Text style={styles.phaseScore}>{risk?.symptomScoring?.phase3Weighted ?? 0} pts</Text>
              <Text style={styles.phaseHint}>{risk?.symptomScoring?.positiveCountPhase3 ?? 0} pos findings</Text>
            </View>
          </View>
        </View>

        {/* Complete Questionnaire Responses */}
        <View style={styles.card}>
          <Text style={styles.boxTitle}>
            Questionnaire Responses Transcript ({assessment.answers?.length || 0})
          </Text>
          {(!assessment.answers || assessment.answers.length === 0) ? (
            <Text style={styles.emptyAnswersText}>No individual questions recorded for this session.</Text>
          ) : (
            assessment.answers.map((ans, idx) => {
              const isYes = ans.answer?.trim().toLowerCase() === 'yes';
              return (
                <View key={ans.id || idx} style={styles.answerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.questionText}>
                      <Text style={styles.idxText}>#{idx + 1} </Text>
                      {ans.question}
                    </Text>
                  </View>
                  <View style={[styles.answerBadge, isYes ? styles.yesBadge : styles.noBadge]}>
                    <Text style={[styles.answerBadgeText, isYes ? styles.yesBadgeText : styles.noBadgeText]}>
                      {ans.answer}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Physician Review Action Section */}
        <View style={styles.reviewActionCard}>
          <Text style={styles.reviewActionHeader}>Clinical Review & Physician Action</Text>
          <Text style={styles.reviewActionSub}>
            Document clinical observations and formally sign off on or request re-assessment.
          </Text>

          <Text style={styles.inputLabel}>Doctor Clinical Note (Optional):</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Add clinical observations, on-site breast exam notes, or biopsy referral directives..."
            placeholderTextColor="#64748b"
            value={doctorNote}
            onChangeText={setDoctorNote}
            editable={!submitting}
          />

          {/* Checkbox for confirmation */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setHasConfirmed(!hasConfirmed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkboxBox, hasConfirmed && styles.checkboxBoxChecked]}>
              {hasConfirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I have reviewed the patient's assessment and clinical findings.
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.validateBtn, (!hasConfirmed || submitting) && styles.btnDisabled]}
              onPress={handleValidate}
              disabled={!hasConfirmed || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.validateBtnText}>✓ Validate Assessment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reassessBtn, submitting && styles.btnDisabled]}
              onPress={() => setReassessModalVisible(true)}
              disabled={submitting}
            >
              <Text style={styles.reassessBtnText}>Request Reassessment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Reassessment Reason Modal */}
      <Modal
        visible={reassessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReassessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Reassessment</Text>
            <Text style={styles.modalSub}>
              Please specify the clinical reason for requesting a reassessment of this patient.
            </Text>

            <TextInput
              style={styles.modalTextArea}
              multiline
              numberOfLines={3}
              placeholder="E.g., Inconsistent symptom reported during physical exam; requires repeat Phase 1 screening..."
              placeholderTextColor="#64748b"
              value={reassessReason}
              onChangeText={setReassessReason}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReassessModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, !reassessReason.trim() && styles.btnDisabled]}
                onPress={handleRequestReassessment}
                disabled={!reassessReason.trim() || submitting}
              >
                <Text style={styles.modalConfirmText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  header: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  validatedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  reassessmentBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  pendingBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  bannerTitle: {
    color: '#34d399',
    fontSize: 15,
    fontWeight: '700',
  },
  bannerTitleAlert: {
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '700',
  },
  pendingTitle: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '700',
  },
  pendingSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
  },
  bannerMeta: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bannerTime: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  bannerNote: {
    color: '#e2e8f0',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  bannerReason: {
    color: '#fef08a',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientInfoCol: {
    flex: 1,
  },
  patientName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  patientMetaText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  highlight: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  patientPhone: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  sessionDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 3,
  },
  tierHeader: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  tierSub: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  overrideBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  overrideTitle: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },
  overrideReason: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 2,
  },
  recommendationBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  boxTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  recommendationText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  interpretationText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  phaseGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  phaseCol: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  phaseLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  phaseScore: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  phaseHint: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  emptyAnswersText: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 8,
  },
  idxText: {
    color: '#64748b',
    fontSize: 11,
  },
  questionText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  answerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  yesBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  noBadge: {
    backgroundColor: '#334155',
  },
  answerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  yesBadgeText: {
    color: '#f87171',
  },
  noBadgeText: {
    color: '#cbd5e1',
  },
  reviewActionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  reviewActionHeader: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '700',
  },
  reviewActionSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: '#f8fafc',
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  checkboxBoxChecked: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#f8fafc',
    fontSize: 13,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  validateBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  reassessBtn: {
    paddingHorizontal: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassessBtnText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#475569',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  modalTextArea: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: '#f8fafc',
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  modalCancelText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  modalConfirmText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
});
