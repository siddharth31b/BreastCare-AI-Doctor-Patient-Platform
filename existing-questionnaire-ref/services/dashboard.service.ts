import type { PatientDashboardData } from "../types";
import { 
  MOCK_PATIENT_DASHBOARD,
  MOCK_DOCTOR_DASHBOARD,
  MOCK_RADIOLOGIST_DASHBOARD,
  MOCK_HOSPITAL_ADMIN_DASHBOARD,
  MOCK_RESEARCHER_DASHBOARD,
  MOCK_CHW_DASHBOARD,
  MOCK_SUPER_ADMIN_DASHBOARD
} from "../mocks/dashboards";

export class DashboardService {
  static getPatientData(): PatientDashboardData {
    return MOCK_PATIENT_DASHBOARD;
  }

  static getDoctorData() {
    return MOCK_DOCTOR_DASHBOARD;
  }

  static getRadiologistData() {
    return MOCK_RADIOLOGIST_DASHBOARD;
  }

  static getHospitalAdminData() {
    return MOCK_HOSPITAL_ADMIN_DASHBOARD;
  }

  static getResearcherData() {
    return MOCK_RESEARCHER_DASHBOARD;
  }

  static getCHWData() {
    return MOCK_CHW_DASHBOARD;
  }

  static getSuperAdminData() {
    return MOCK_SUPER_ADMIN_DASHBOARD;
  }
}
