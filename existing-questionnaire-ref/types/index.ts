export type UserRole =
  | "PATIENT"
  | "DOCTOR"
  | "BREAST_CARE_NURSE"
  | "RADIOLOGIST"
  | "HOSPITAL_ADMIN"
  | "RESEARCHER"
  | "COMMUNITY_HEALTH_WORKER"
  | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  hospitalName?: string;
  institution?: string;
}

export type Permission =
  | "profile:read-own"
  | "profile:update-own"
  | "assessment:create-own"
  | "assessment:read-own"
  | "report:upload-own"
  | "report:read-own"
  | "appointment:manage-own"
  | "consent:manage-own"
  | "patient:read-assigned"
  | "assessment:review-assigned"
  | "ai-result:read-assigned"
  | "clinical-review:create"
  | "care-plan:create"
  | "referral:create"
  | "follow-up:create"
  | "study:read-assigned"
  | "study:annotate-assigned"
  | "ai-overlay:review"
  | "radiology-report:create"
  | "hospital:read-own"
  | "staff:manage-own-hospital"
  | "appointment:manage-own-hospital"
  | "analytics:read-own-hospital"
  | "dataset:read-anonymized"
  | "cohort:create"
  | "model-metrics:read"
  | "export:create-approved"
  | "patient:register-assisted"
  | "assessment:create-assisted"
  | "offline-record:sync"
  | "hospital:manage-all"
  | "user:manage-all"
  | "role:manage-all"
  | "model:govern"
  | "audit:read-all"
  | "system:manage"
  | "patient:register-own-hospital"
  | "patient:read-assigned-or-intake"
  | "intake:create"
  | "intake:update-draft"
  | "intake:submit"
  | "vitals:create"
  | "bmi:record"
  | "report:upload-assisted"
  | "consent:record"
  | "doctor-request:respond";

export interface PatientDashboardData {
  patientName: string;
  nextRecommendedAction: string;
  journeyProgress: number;
  bmi: {
    heightCm: number;
    weightKg: number;
    age: number;
    value: number;
    category: string;
    description: string;
  };
  assessmentStatus: string;
  doctorReviewStatus: string;
  upcomingAppointment: {
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    isTelehealth: boolean;
  };
  recentReports: {
    title: string;
    date: string;
    status: string;
  }[];
  carePlanTasks: {
    id: string;
    task: string;
    time: string;
    completed: boolean;
  }[];
  reminders: string[];
}
