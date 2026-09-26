import { apiClient } from './client';
import { Patient } from '../types';

export async function getDoctorPatients(): Promise<Patient[]> {
  const res = await apiClient<{ success: boolean; patients: Patient[] }>('/doctors/me/patients');
  return (res.patients || []).map(p => ({
    ...p,
    full_name: p.full_name || p.name,
    name: p.name || p.full_name || '',
  }));
}

export async function getPatientById(id: string): Promise<Patient> {
  const res = await apiClient<{ success: boolean; patient: Patient }>(`/patients/${id}`);
  const p = res.patient;
  return {
    ...p,
    full_name: p.full_name || p.name,
    name: p.name || p.full_name || '',
  };
}

export async function createPatient(patientData: {
  patient_code?: string;
  name?: string;
  full_name?: string;
  age: number;
  gender: string;
  phone?: string;
}): Promise<Patient> {
  // Ensure both full_name and name are provided for backward and forward compatibility
  const canonicalName = (patientData.full_name || patientData.name || '').trim();
  const payload = {
    ...patientData,
    name: canonicalName,
    full_name: canonicalName,
  };

  const res = await apiClient<{ success: boolean; patient: Patient }>('/patients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const p = res.patient;
  return {
    ...p,
    full_name: p.full_name || p.name,
    name: p.name || p.full_name || '',
  };
}

export async function uploadPatientPhoto(
  patientId: string,
  base64Image: string
): Promise<{ face_photo_url: string; patient: Patient }> {
  const res = await apiClient<{ success: boolean; face_photo_url: string; patient: Patient }>(
    `/patients/${patientId}/photo`,
    {
      method: 'POST',
      body: JSON.stringify({ photo_base64: base64Image }),
    }
  );
  if (res.patient) {
    res.patient = {
      ...res.patient,
      full_name: res.patient.full_name || res.patient.name,
      name: res.patient.name || res.patient.full_name || '',
    };
  }
  return res;
}
