import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TABLET_ID } from '../config/constants';
import { Patient, Assessment, DoctorUser } from '../types';

let inMemoryToken: string | null = null;
let customBaseUrl: string | null = null;

export const ApiService = {
  async getBaseUrl(): Promise<string> {
    if (customBaseUrl) return customBaseUrl;
    const stored = await AsyncStorage.getItem('breastcare_custom_api_url');
    if (stored) {
      customBaseUrl = stored;
      return stored;
    }
    return API_URL;
  },

  async setBaseUrl(url: string | null): Promise<void> {
    customBaseUrl = url && url.trim() ? url.trim() : null;
    if (customBaseUrl) {
      await AsyncStorage.setItem('breastcare_custom_api_url', customBaseUrl);
    } else {
      await AsyncStorage.removeItem('breastcare_custom_api_url');
    }
  },

  async checkHealth(targetUrl?: string): Promise<{ success: boolean; version?: string; status?: string }> {
    try {
      const base = targetUrl ? targetUrl.trim() : await this.getBaseUrl();
      const res = await fetch(`${base}/health`, { method: 'GET' });
      const data = await res.json();
      return { success: res.ok, version: data.version, status: data.status };
    } catch (err: any) {
      return { success: false, status: err.message };
    }
  },

  async setToken(token: string | null) {
    inMemoryToken = token;
    if (token) {
      await AsyncStorage.setItem('breastcare_doctor_token', token);
    } else {
      await AsyncStorage.removeItem('breastcare_doctor_token');
    }
  },

  async getToken(): Promise<string | null> {
    if (inMemoryToken) return inMemoryToken;
    const stored = await AsyncStorage.getItem('breastcare_doctor_token');
    inMemoryToken = stored;
    return stored;
  },

  async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      'Content-Type': 'application/json',
      'x-tablet-id': TABLET_ID,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Request failed with status ${res.status}`);
    }
    return data;
  },

  // Auth & Session
  async establishSession(token: string): Promise<{ user: DoctorUser; role: string }> {
    await this.setToken(token);
    const res = await this.request<{ success: boolean; user: DoctorUser; role: string }>('/auth/session', {
      method: 'POST'
    });
    return res;
  },

  async getDoctorProfile(): Promise<DoctorUser> {
    const res = await this.request<{ success: boolean; doctor: DoctorUser }>('/doctors/me');
    return res.doctor;
  },

  // Patients
  async getDoctorPatients(): Promise<Patient[]> {
    const res = await this.request<{ success: boolean; patients: Patient[] }>('/doctors/me/patients');
    return res.patients;
  },

  async getPatientById(id: string): Promise<Patient> {
    const res = await this.request<{ success: boolean; patient: Patient }>(`/patients/${id}`);
    return res.patient;
  },

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    const res = await this.request<{ success: boolean; patient: Patient }>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
    return res.patient;
  },

  async uploadPatientPhoto(patientId: string, base64Image: string): Promise<{ face_photo_url: string; patient: Patient }> {
    const res = await this.request<{ success: boolean; face_photo_url: string; patient: Patient }>(`/patients/${patientId}/photo`, {
      method: 'POST',
      body: JSON.stringify({ photo_base64: base64Image })
    });
    return res;
  },

  // Assessments
  async getDoctorAssessments(): Promise<Assessment[]> {
    const res = await this.request<{ success: boolean; assessments: Assessment[] }>('/doctors/me/assessments');
    return res.assessments;
  },

  async getAssessmentById(id: string): Promise<Assessment> {
    const res = await this.request<{ success: boolean; assessment: Assessment }>(`/assessments/${id}`);
    return res.assessment;
  },

  async startAssessment(patientId: string, riskProfile: any = {}): Promise<Assessment> {
    const res = await this.request<{ success: boolean; assessment: Assessment }>('/assessments', {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, risk_profile: riskProfile })
    });
    return res.assessment;
  },

  async submitAssessment(
    assessmentId: string,
    riskProfile: any,
    answersMap: Record<string, 'Yes' | 'No'>,
    answersList: any[] = []
  ): Promise<{ assessment: Assessment; clinical_result: any }> {
    const res = await this.request<{ success: boolean; assessment: Assessment; clinical_result: any }>(
      `/assessments/${assessmentId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          risk_profile: riskProfile,
          answers_map: answersMap,
          answers_list: answersList
        })
      }
    );
    return res;
  },

  async validateAssessment(id: string, doctorNote?: string): Promise<{ success: boolean; assessment: Assessment }> {
    return await this.request<{ success: boolean; assessment: Assessment }>(`/assessments/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ doctor_note: doctorNote, confirmed: true })
    });
  },

  async requestReassessment(id: string, reason: string, doctorNote?: string): Promise<{ success: boolean; assessment: Assessment }> {
    return await this.request<{ success: boolean; assessment: Assessment }>(`/assessments/${id}/reassessment`, {
      method: 'POST',
      body: JSON.stringify({ reason, doctor_note: doctorNote })
    });
  },

  async saveReviewNote(id: string, note: string): Promise<{ success: boolean; assessment: Assessment }> {
    return await this.request<{ success: boolean; assessment: Assessment }>(`/assessments/${id}/review-note`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  },

  // BHASHINI / Language
  async getSupportedLanguages() {
    return await this.request<{ success: boolean; provider: string; languages: any[] }>('/language/languages');
  },

  async translateText(text: string, targetLang: string) {
    return await this.request<{ success: boolean; translatedText: string }>('/language/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLang })
    });
  },

  async requestSTT(audioBase64: string, language: string = 'hi', promptHint: string = '') {
    return await this.request<{ success: boolean; transcript: string; isDemo: boolean }>('/language/stt', {
      method: 'POST',
      body: JSON.stringify({ audioBase64, language, promptHint })
    });
  },

  async requestTTS(text: string, language: string = 'hi') {
    return await this.request<{ success: boolean; audioBase64: string; isDemo: boolean }>('/language/tts', {
      method: 'POST',
      body: JSON.stringify({ text, language })
    });
  }
};
