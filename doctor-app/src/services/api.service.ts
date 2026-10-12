import * as Api from '../api';
import { Patient, Assessment, DoctorUser } from '../types';

/**
 * Backward compatibility wrapper delegating to the centralized API architecture in src/api
 */
export const ApiService = {
  getBaseUrl: Api.getBaseUrl,
  setBaseUrl: Api.setBaseUrl,
  checkHealth: Api.checkHealth,

  async setToken(token: string | null) {
    if (token) {
      await Api.setSessionToken(token);
    } else {
      await Api.setSessionToken(null);
    }
  },

  async getToken(): Promise<string | null> {
    return await Api.getFreshIdToken();
  },

  async getHeaders(): Promise<HeadersInit> {
    const token = await Api.getFreshIdToken();
    return {
      'Content-Type': 'application/json',
      'x-tablet-id': 'TABLET-CLINIC-01',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return await Api.apiClient<T>(endpoint, options);
  },

  // Auth & Session
  async establishSession(token: string): Promise<{ user: DoctorUser; role: string }> {
    return await Api.establishSession(token);
  },

  async getDoctorProfile(): Promise<DoctorUser> {
    return await Api.getDoctorProfile();
  },

  // Patients
  async getDoctorPatients(): Promise<Patient[]> {
    return await Api.getDoctorPatients();
  },

  async getPatientById(id: string): Promise<Patient> {
    return await Api.getPatientById(id);
  },

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    return await Api.createPatient(patientData as any);
  },

  async uploadPatientPhoto(patientId: string, base64Image: string): Promise<{ face_photo_url: string; patient: Patient }> {
    return await Api.uploadPatientPhoto(patientId, base64Image);
  },

  // Assessments
  async getDoctorAssessments(): Promise<Assessment[]> {
    return await Api.getDoctorAssessments();
  },

  async getAssessmentById(id: string): Promise<Assessment> {
    return await Api.getAssessmentById(id);
  },

  async startAssessment(patientId: string, riskProfile: any = {}): Promise<Assessment> {
    return await Api.startAssessment(patientId, riskProfile);
  },

  async submitAssessment(
    assessmentId: string,
    riskProfile: any,
    answersMap: Record<string, 'Yes' | 'No'>,
    answersList: any[] = []
  ): Promise<{ assessment: Assessment; clinical_result: any }> {
    return await Api.submitAssessment(assessmentId, riskProfile, answersMap, answersList);
  },

  async validateAssessment(id: string, doctorNote?: string): Promise<{ success: boolean; assessment: Assessment }> {
    return await Api.validateAssessment(id, doctorNote);
  },

  async requestReassessment(id: string, reason: string, doctorNote?: string): Promise<{ success: boolean; assessment: Assessment }> {
    return await Api.requestReassessment(id, reason, doctorNote);
  },

  async saveReviewNote(id: string, note: string): Promise<{ success: boolean; assessment: Assessment }> {
    return await Api.saveReviewNote(id, note);
  },

  // Language
  async getSupportedLanguages() {
    return await Api.getSupportedLanguages();
  },

  async translateText(text: string, targetLang: string) {
    return await Api.translateText(text, targetLang);
  },

  async requestSTT(audioBase64: string, language: string = 'hi', promptHint: string = '') {
    return await Api.requestSTT(audioBase64, language, promptHint);
  },

  async requestTTS(text: string, language: string = 'hi') {
    return await Api.requestTTS(text, language);
  },

  async synthesizeTTS(text: string, language: string = 'en') {
    return await Api.synthesizeTTS(text, language);
  },
};
