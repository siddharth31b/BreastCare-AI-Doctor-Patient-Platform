import { apiClient } from './client';
import { setSessionToken } from '../services/firebaseAuth';
import { DoctorUser, Patient, Assessment } from '../types';
import { getDoctorPatients } from './patients';
import { getDoctorAssessments } from './assessments';

export interface DashboardData {
  doctor: DoctorUser | null;
  patients: Patient[];
  assessments: Assessment[];
  stats: {
    totalPatients: number;
    pendingReviews: number;
    validatedAssessments: number;
    urgentOrHighRisk: number;
  };
}

export async function establishSession(token: string): Promise<{ user: DoctorUser; role: string }> {
  await setSessionToken(token);
  const res = await apiClient<{ success: boolean; user: DoctorUser; role: string }>('/auth/session', {
    method: 'POST',
  });
  return res;
}

export async function getDoctorProfile(): Promise<DoctorUser> {
  const res = await apiClient<{ success: boolean; doctor: DoctorUser }>('/doctors/me');
  return res.doctor;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [patients, assessments] = await Promise.all([
    getDoctorPatients().catch(err => {
      console.warn('[DashboardApi] Failed to load patients:', err);
      return [] as Patient[];
    }),
    getDoctorAssessments().catch(err => {
      console.warn('[DashboardApi] Failed to load assessments:', err);
      return [] as Assessment[];
    }),
  ]);

  const pendingReviews = assessments.filter(
    a => a.status === 'PENDING_DOCTOR_REVIEW' || a.status === 'COMPLETED'
  ).length;

  const validatedAssessments = assessments.filter(
    a => a.status === 'DOCTOR_VALIDATED'
  ).length;

  const urgentOrHighRisk = assessments.filter(
    a => a.risk_analysis?.tier === 'Urgent' || a.risk_analysis?.tier === 'High'
  ).length;

  return {
    doctor: null,
    patients,
    assessments,
    stats: {
      totalPatients: patients.length,
      pendingReviews,
      validatedAssessments,
      urgentOrHighRisk,
    },
  };
}
