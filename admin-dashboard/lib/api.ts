export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tablet_id?: string;
  status: string;
  created_at: string;
}

export interface Patient {
  id: string;
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  face_photo_url?: string | null;
  created_at: string;
}

export interface AssessmentAnswer {
  id: string;
  assessment_id: string;
  question_id?: string | null;
  question: string;
  answer: string;
  answer_type?: string;
  answered_at?: string;
  created_at?: string;
}

export interface BrmBreakdownItem {
  factor: string;
  points: number;
  note?: string;
}

export interface SymptomScoring {
  phase1Score: number;
  phase1Multiplier: number;
  phase1Weighted: number;
  phase2Score: number;
  phase2Multiplier: number;
  phase2Weighted: number;
  phase3Score: number;
  phase3Multiplier: number;
  phase3Weighted: number;
  totalSymptomScore: number;
  positiveCountPhase1: number;
  positiveCountPhase2: number;
  positiveCountPhase3: number;
}

export interface ClinicalOverride {
  triggered: boolean;
  ruleName?: string | null;
  reason?: string | null;
}

export interface RiskAnalysis {
  tier?: string;
  totalScore?: number;
  recommendation?: string;
  interpretation?: string;
  keyFindings?: string[];
  override?: ClinicalOverride;
  brm?: {
    score: number;
    breakdown: BrmBreakdownItem[];
  };
  symptomScoring?: SymptomScoring;
}

export interface Assessment {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: string;
  risk_profile?: Record<string, any>;
  risk_analysis?: RiskAnalysis;
  started_at: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  doctor_note?: string | null;
  reassessment_reason?: string | null;
  doctors?: { name: string; email: string; tablet_id?: string };
  patients?: { name: string; patient_code: string; age: number; gender: string; face_photo_url?: string | null };
  doctor?: Doctor;
  patient?: Patient;
  answers?: AssessmentAnswer[];
}

export interface Analytics {
  totalDoctors: number;
  totalPatients: number;
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  tierBreakdown: {
    Low: number;
    Moderate: number;
    High: number;
    Urgent: number;
  };
}

export const adminApi = {
  getAuthToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('breastcare_admin_token') || '';
    }
    return '';
  },

  setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('breastcare_admin_token', token);
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    const res = await fetch(`${getApiUrl()}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  },

  async getAnalytics(): Promise<Analytics> {
    const data = await this.request<{ success: boolean; analytics: Analytics }>('/admin/analytics');
    return data.analytics;
  },

  async getDoctors(): Promise<Doctor[]> {
    const data = await this.request<{ success: boolean; doctors: Doctor[] }>('/admin/doctors');
    return data.doctors;
  },

  async getPatients(): Promise<Patient[]> {
    const data = await this.request<{ success: boolean; patients: Patient[] }>('/admin/patients');
    return data.patients;
  },

  async getPatientById(id: string): Promise<Patient> {
    const data = await this.request<{ success: boolean; patient: Patient }>(`/patients/${id}`);
    return data.patient;
  },

  async getAssessments(filters?: { doctor_id?: string; status?: string; tier?: string }): Promise<Assessment[]> {
    const query = new URLSearchParams();
    if (filters?.doctor_id) query.set('doctor_id', filters.doctor_id);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.tier) query.set('tier', filters.tier);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await this.request<{ success: boolean; assessments: Assessment[] }>(`/admin/assessments${qs}`);
    return data.assessments;
  },

  async getAssessmentById(id: string): Promise<Assessment> {
    const data = await this.request<{ success: boolean; assessment: Assessment }>(`/assessments/${id}`);
    return data.assessment;
  },
};
