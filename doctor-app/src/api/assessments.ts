import { apiClient } from './client';
import { Assessment, Patient } from '../types';

function normalizeAssessment(a: Assessment): Assessment {
  const rawPatient: any = a.patient || a.patients;
  let normalizedPatient: Patient | undefined = undefined;

  if (rawPatient && typeof rawPatient === 'object') {
    normalizedPatient = {
      ...rawPatient,
      full_name: rawPatient.full_name || rawPatient.name,
      name: rawPatient.name || rawPatient.full_name || '',
    };
  }

  return {
    ...a,
    patient: normalizedPatient,
    patients: normalizedPatient,
  };
}

export async function getDoctorAssessments(): Promise<Assessment[]> {
  const res = await apiClient<{ success: boolean; assessments: Assessment[] }>('/doctors/me/assessments');
  return (res.assessments || []).map(normalizeAssessment);
}

export async function getAssessmentById(id: string): Promise<Assessment> {
  const res = await apiClient<{ success: boolean; assessment: Assessment }>(`/assessments/${id}`);
  return normalizeAssessment(res.assessment);
}

export async function startAssessment(patientId: string, riskProfile: any = {}): Promise<Assessment> {
  const res = await apiClient<{ success: boolean; assessment: Assessment }>('/assessments', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId, risk_profile: riskProfile }),
  });
  return normalizeAssessment(res.assessment);
}

export async function submitAssessment(
  assessmentId: string,
  riskProfile: any,
  answersMap: Record<string, 'Yes' | 'No'>,
  answersList: any[] = []
): Promise<{ assessment: Assessment; clinical_result: any }> {
  const res = await apiClient<{ success: boolean; assessment: Assessment; clinical_result: any }>(
    `/assessments/${assessmentId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({
        risk_profile: riskProfile,
        answers_map: answersMap,
        answers_list: answersList,
      }),
    }
  );
  return {
    ...res,
    assessment: normalizeAssessment(res.assessment),
  };
}

export async function validateAssessment(
  id: string,
  doctorNote?: string
): Promise<{ success: boolean; assessment: Assessment }> {
  const res = await apiClient<{ success: boolean; assessment: Assessment }>(`/assessments/${id}/validate`, {
    method: 'POST',
    body: JSON.stringify({ doctor_note: doctorNote, confirmed: true }),
  });
  return {
    ...res,
    assessment: normalizeAssessment(res.assessment),
  };
}

export async function requestReassessment(
  id: string,
  reason: string,
  doctorNote?: string
): Promise<{ success: boolean; assessment: Assessment }> {
  const res = await apiClient<{ success: boolean; assessment: Assessment }>(`/assessments/${id}/reassessment`, {
    method: 'POST',
    body: JSON.stringify({ reason, doctor_note: doctorNote }),
  });
  return {
    ...res,
    assessment: normalizeAssessment(res.assessment),
  };
}

export async function saveReviewNote(
  id: string,
  note: string
): Promise<{ success: boolean; assessment: Assessment }> {
  const res = await apiClient<{ success: boolean; assessment: Assessment }>(`/assessments/${id}/review-note`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
  return {
    ...res,
    assessment: normalizeAssessment(res.assessment),
  };
}
