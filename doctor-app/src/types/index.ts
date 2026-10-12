import { ClinicalRiskAnalysisResult, RiskProfileData, MobileQuestionnaireAnswer } from '../services/assessmentEngine';

export interface DoctorUser {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  phone?: string;
  tablet_id?: string;
  role: 'DOCTOR' | 'ADMIN';
}

export interface Patient {
  id: string;
  patient_code: string;
  name: string;
  full_name?: string;
  age: number;
  gender: string;
  phone?: string;
  face_photo_url?: string | null;
  created_at?: string;
}

export function getPatientDisplayName(patient?: Partial<Patient> | null): string {
  if (!patient) return 'Patient information unavailable';
  const name = (patient.full_name || patient.name || '').trim();
  return name.length > 0 ? name : 'Patient information unavailable';
}

export function getPatientCodeDisplay(patient?: Partial<Patient> | null): string {
  if (!patient || !patient.patient_code) return 'ID Pending';
  return patient.patient_code;
}

export interface Assessment {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_DOCTOR_REVIEW' | 'DOCTOR_VALIDATED' | 'REASSESSMENT_REQUESTED';
  risk_profile?: RiskProfileData;
  risk_analysis?: ClinicalRiskAnalysisResult;
  started_at: string;
  completed_at?: string;
  patient?: Patient;
  patients?: Patient;
  answers?: MobileQuestionnaireAnswer[];
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  doctor_note?: string | null;
  reassessment_reason?: string | null;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  NewPatient: undefined;
  FacePhotoCapture: { patient: Patient };
  PhotoPreview: { patient: Patient; photoUri: string; base64?: string };
  AssessmentStart: { patient: Patient };
  Chatbot: { patient: Patient; assessmentId: string };
  AssessmentReview: {
    patient: Patient;
    assessmentId: string;
    clinicalResult: ClinicalRiskAnalysisResult;
    answersMap: Record<string, 'Yes' | 'No'>;
    riskProfile: RiskProfileData;
  };
  SubmissionSuccess: {
    patient: Patient;
    assessmentId: string;
    clinicalResult: ClinicalRiskAnalysisResult;
  };
  AssessmentHistory: { initialFilter?: 'ALL' | 'PENDING' | 'VALIDATED' | 'REASSESSMENT' | 'URGENT' } | undefined;
  PatientDetail: { patientId: string };
  PhysicianReview: { assessmentId: string; patient?: Patient };
};
