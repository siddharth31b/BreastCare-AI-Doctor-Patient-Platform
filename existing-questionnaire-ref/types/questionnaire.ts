export type QuestionnaireStatus = "IN_PROGRESS" | "COMPLETED" | "SUBMITTED";

export interface QuestionnaireAnswer {
  questionId: string;
  value: string | string[] | boolean | number;
  label: string;
  answeredAt: string;
}

export interface QuestionnaireSummary {
  affectedSide?: "LEFT" | "RIGHT" | "BOTH" | "NONE";
  symptoms: string[];
  duration?: string;
  progression?: string;
  familyHistory?: boolean;
  previousBreastProcedure?: boolean;
  priorImaging?: boolean;
  patientNote?: string;
  careGuidanceLevel?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  guidanceReasons?: string[];
  selectedSymptomKeys?: string[];
  version?: string;
  assessmentMode?: "CHATBOT" | "MANUAL";
  riskProfile?: {
    age?: string;
    ageAtMarriage?: string;
    ageAtFirstChild?: string;
    numberOfChildren?: string;
    breastfeeding?: string;
    contraceptives?: string;
    familyHistory?: string;
    smoking?: string;
    diet?: string;
  };
  riskAnalysis?: {
    totalScore?: number;
    tier?: "Low" | "Moderate" | "High" | "Urgent";
    brmScore?: number;
    symptomScore?: number;
    overrideTriggered?: string | null;
    overrideReason?: string | null;
    interpretation?: string;
    recommendation?: string;
    phase1Weighted?: number;
    phase2Weighted?: number;
    phase3Weighted?: number;
    phase2Multiplier?: number;
    phase3Multiplier?: number;
  };
  phasedAnswers?: {
    phase0?: { label: string; value: string }[];
    phase1?: { symptom: string; response: string; relevance?: string; weight?: number }[];
    phase2?: { symptom: string; response: string; relevance?: string; weight?: number }[];
    phase3?: { symptom: string; response: string; relevance?: string; weight?: number }[];
  };
}

export interface ClinicalPriorityFlag {
  type: string; // e.g., "BLOODY_DISCHARGE", "RAPID_SWELLING", "FEVER_REDNESS", "NEW_PERSISTENT_LUMP", "SEVERE_PAIN", "ACUTELY_UNWELL", "CONVULSION", "SEVERE_BREATHLESSNESS"
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  message: string;
}

export interface QuestionnaireSession {
  id: string;
  patientId: string;
  status: QuestionnaireStatus;
  startedAt: string;
  completedAt?: string;
  answers: QuestionnaireAnswer[];
  summary?: QuestionnaireSummary;
  priorityFlags: ClinicalPriorityFlag[];
  careGuidanceLevel?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  guidanceReasons?: string[];
  selectedSymptomKeys?: string[];
}

export interface BmiRecord {
  heightCm: number;
  weightKg: number;
  age: number;
  value: number;
  category: string; // WHO category or Pediatric Warning
  description: string;
  lastCalculatedAt: string;
}

export type BloodPressureStatus = "BELOW_USUAL" | "EXPECTED" | "ABOVE_USUAL" | "HIGH_READING";

export interface BloodPressureRecord {
  id: string;
  patientId: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  measuredAt: string;
  measuredBy: string;
  source: "HOME" | "CLINIC" | "NURSE" | "DOCTOR";
  position?: "SITTING" | "STANDING" | "LYING";
  status: BloodPressureStatus;
  note?: string;
  isReviewed?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type GlucoseTestType = "FASTING" | "TWO_HOUR_OGTT" | "RANDOM" | "HBA1C" | "HOME_METER";
export type GlucoseUnit = "MG_DL" | "MMOL_L" | "PERCENT";

export interface BloodGlucoseRecord {
  id: string;
  patientId: string;
  testType: GlucoseTestType;
  value: number;
  unit: GlucoseUnit;
  measuredAt: string;
  measuredBy: string;
  source: "LAB" | "CLINIC" | "HOME" | "NURSE" | "DOCTOR";
  hoursFasted?: number;
  pregnancyContext?: boolean;
  interpretation: string;
  symptoms?: string[];
  note?: string;
  isReviewed?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
}


export interface MedicalHistory {
  familyHistory?: boolean;
  previousBreastProcedure?: boolean;
  previousConditions?: string[];
  medications?: string[];
  reproductiveHistory?: string;
  priorImaging?: boolean;
  recentInjury?: boolean;
}

export interface PatientReport {
  id: string;
  patientId: string;
  title: string;
  category: "Mammogram" | "Ultrasound" | "MRI" | "Pathology" | "Laboratory" | "Clinical Assessment" | "General Physical" | "Prescription" | "Other";
  uploadedAt: string;
  validationStatus: "Validated" | "Awaiting Review" | "Uploaded" | "Needs Update";
  source: string;
  documentUrl?: string;
  downloadable: boolean;
  shareable: boolean;
  
  // Backward compatibility fields
  date?: string;
  status?: string;
  type?: "mammogram" | "ultrasound" | "lab" | "clinical_note" | "nurse_intake";
  summary?: string;
  notes?: string;
}

export interface ClinicalJourney {
  assessmentSubmitted: boolean;
  reportsUploaded: boolean;
  aiAnalysisStatus: "PENDING" | "COMPLETE" | "FAILED";
  radiologyStatus: "PENDING" | "COMPLETE";
  doctorReviewStatus: "AWAITING_REVIEW" | "IN_QUEUE" | "COMPLETED";
  appointmentStatus: "SCHEDULED" | "NOT_SCHEDULED" | "COMPLETED" | "CONFIRMED" | "REQUESTED" | "RESCHEDULED";
  waitingTime?: string;
  carePlanStatus?: "PENDING" | "COMPLETED";
  appointmentDate?: string;
}

// ─── NEW NURSE INTAKE MODELS ───────────────────────────────────────────

export type IntakeSource = "PATIENT" | "NURSE" | "DOCTOR" | "IMPORTED_REPORT";
export type IntakeStatus = "DRAFT" | "IN_PROGRESS" | "SUBMITTED" | "NEEDS_CLARIFICATION" | "REVIEWED" | "LOCKED";

export interface NurseProfile {
  id: string;
  name: string;
  hospitalName: string;
}

export interface ConsentRecord {
  careTeamAccess: boolean;
  reportStorage: boolean;
  researchUse: boolean; // separate and optional
  answersAccurate: boolean;
  nurseVerified: boolean;
  nurseName: string;
  timestamp: string;
}

export interface UploadedClinicalDocument {
  id: string;
  name: string;
  type: string; // "mammogram" | "ultrasound" | "mri" | "pathology" | "consultation" | "other"
  date: string;
  progress: number; // 100 for finished
  previewUrl?: string;
}

export interface IntakeRevision {
  revisionId: string;
  editedBy: string; // "NURSE" | "DOCTOR" or name
  timestamp: string;
  sectionEdited: string;
  previousValue: string;
  newValue: string;
}

export interface ClinicalIntake {
  patientId: string;
  nurseId?: string;
  nurseName?: string;
  status: IntakeStatus;
  source: IntakeSource;
  submittedAt?: string;
  clarificationNotes?: string; // Comments from Doctor
  answers: Record<string, any>; // key-value mapping of form field inputs
  consent?: ConsentRecord;
  uploadedDocuments?: UploadedClinicalDocument[];
  revisions?: IntakeRevision[];
  reconciliationDecisions?: Record<string, string>;
}

// ─── EXTENDED PATIENT RECORD ───────────────────────────────────────────

export interface PatientRecord {
  id: string; // patientId (e.g. "BC-9827" or "demo-patient")
  name: string;
  age: number;
  gender?: string;
  contactPreference?: string;
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  preferredLanguage?: string;
  emergencyContact?: string;
  emergencyRelationship?: string;
  bmi?: BmiRecord;
  bmiHistory?: BmiRecord[];
  bloodPressure?: BloodPressureRecord;
  bloodPressureHistory?: BloodPressureRecord[];
  bloodGlucose?: BloodGlucoseRecord;
  bloodGlucoseHistory?: BloodGlucoseRecord[];
  carePlan?: CarePlanItem[];
  carePlanIssued?: boolean;
  carePlanNotes?: string;
  carePlanTasks?: any[];
  medicalHistory?: MedicalHistory;
  assessmentSession?: QuestionnaireSession;
  reports?: PatientReport[];
  clinicalJourney?: ClinicalJourney;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: string; // e.g. "Awaiting Review", "Review Completed", "Needs Clarification"
  timeInQueue: string;
  hospitalName?: string; // To support hospital filter (OWN_HOSPITAL_ASSIGNED_OR_INTAKE)
  clinicalIntake?: ClinicalIntake; // Nurse clinical intake record
  uploadedDocuments?: UploadedClinicalDocument[];
  wellnessHistory?: GeneralWellnessStatus[];
  hypertensionHistory?: SelfReportedWellnessStatus[];
  diabetesHistory?: SelfReportedWellnessStatus[];
}

export interface DoctorNotification {
  id: string;
  patientId?: string;
  patientName?: string;
  title: string;
  description: string;
  category: "Clinical Updates" | "Doctor Review" | "Reports" | "Appointments" | "Wellness" | "General";
  time: string;
  isRead: boolean;
  actionRoute?: string;
}

export interface GoalChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface WellnessGoal {
  id: string;
  patientId: string;
  type: "HYDRATION" | "SLEEP" | "ACTIVITY" | "NUTRITION" | "MEDICATION" | "MINDFULNESS" | "CUSTOM";
  title: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  checklistItems?: GoalChecklistItem[];
  source: "CARE_TEAM" | "NURSE" | "PATIENT" | "SYSTEM_SUGGESTED";
  createdBy?: string;
  createdAt: string;
  date: string;
  status: "ACTIVE" | "COMPLETED" | "SKIPPED" | "DISMISSED";
  trackingMethod: "COUNTER" | "DURATION" | "CHECKLIST" | "BOOLEAN" | "MANUAL_ENTRY";
  editableByPatient: boolean;
  note?: string;
  completedAt?: string;
}

export interface CarePlanItem {
  id: string;
  patientId: string;
  title: string;
  timeOfDay: string; // e.g. "08:30 AM"
  frequency: "DAILY" | "WEEKLY" | "ONCE";
  type: "HYDRATION" | "SLEEP" | "ACTIVITY" | "NUTRITION" | "MEDICATION" | "MINDFULNESS" | "CUSTOM";
  targetValue?: number;
  unit?: string;
  source: "CARE_TEAM" | "NURSE" | "PATIENT";
  assignedClinician?: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  completedAt?: string;
  notes?: string;
}

export interface GeneralWellnessStatus {
  id: string;
  patientId: string;
  type: "BMI" | "BLOOD_PRESSURE" | "BLOOD_GLUCOSE";
  entryMode: "MEASURED" | "SELF_REPORTED";
  status:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "UNKNOWN"
    | "DIAGNOSED"
    | "MEDICATION_REPORTED";
  value?: number;
  secondaryValue?: number;
  unit?: string;
  testType?: string;
  source:
    | "PATIENT"
    | "HOME_DEVICE"
    | "NURSE"
    | "DOCTOR"
    | "CLINIC"
    | "LAB";
  verified: boolean;
  recordedAt: string;
  note?: string;
}

// ─── SELF-REPORTED WELLNESS STATUS (Hypertension / Diabetes) ──────────────
// These are patient-entered qualitative statuses, not clinical measurements.
// source is always "PATIENT_SELF_REPORTED" and verified is never set to true
// for patient-entered data. History is maintained — records are never overwritten.

export interface SelfReportedWellnessStatus {
  id: string;
  patientId: string;
  type: "HYPERTENSION" | "DIABETES";
  reportedStatus: "LOW" | "NORMAL" | "HIGH" | "UNKNOWN";
  previousDiagnosis: "YES" | "NO" | "UNSURE";
  medicationReported: "YES" | "NO" | "UNSURE";
  source: "PATIENT_SELF_REPORTED";
  recordedAt: string;
  updatedAt: string;
}
