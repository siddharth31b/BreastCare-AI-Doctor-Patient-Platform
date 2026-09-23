// ─── Patient Portal Type Models ──────────────────────────────────────────────
// These types power the 4 new patient portal modules.
// Mock data (patient-portal.mock.ts) implements these shapes.
// Replace mock data with real API calls when backend is ready.

// ─── Reports & Screening ─────────────────────────────────────────────────────

export type ReportCategory =
  | "Breast Imaging"
  | "General Imaging"
  | "Pathology & Laboratory"
  | "Clinical Documents"
  | "Other";

export type ReportStatus =
  | "Uploaded"
  | "Processing"
  | "AI Reviewed"
  | "Awaiting Doctor Review"
  | "Doctor Reviewed"
  | "Additional Information Required";

export type ReportSource = "Patient Uploaded" | "Hospital Record" | "AI Generated" | "Doctor Authored";

export interface PatientReport {
  id: string;
  patientId: string;
  title: string;
  category: ReportCategory;
  reportType: string;
  fileName: string;
  fileType: string;
  fileSizeMb: number;
  uploadedAt: string; // ISO string
  status: ReportStatus;
  source: ReportSource;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  thumbnailUrl?: string;
}

export type RiskLevel = "Low" | "Moderate" | "High" | "Inconclusive";

export interface AIAssessmentFinding {
  region: string;
  observation: string;
  confidence: number; // 0-100
}

export interface AIAssessment {
  id: string;
  reportId: string;
  patientId: string;
  performedAt: string;
  modelVersion: string;
  riskLevel: RiskLevel;
  overallConfidence: number; // 0-100
  findings: AIAssessmentFinding[];
  keyObservations: string[];
  limitations: string[];
  dataQualityWarnings: string[];
  recommendedNextStep: string;
  clinicalReviewStatus: "Pending" | "In Progress" | "Completed";
  clinicalReviewedAt?: string;
  reportPreviewUrl?: string;
  heatmapUrl?: string;
}

export interface DoctorReview {
  id: string;
  assessmentId: string;
  patientId: string;
  assignedDoctor: {
    id: string;
    name: string;
    specialty: string;
    initials: string;
  };
  reviewStatus: "Pending" | "In Progress" | "Completed";
  reviewedAt?: string;
  clinicalInterpretation?: string;
  differenceFromAI?: string;
  recommendedTests?: string[];
  recommendedAppointmentType?: string;
  doctorNotes?: string;
  followUpInstructions?: string;
}

// ─── Diagnostic Journey ───────────────────────────────────────────────────────

export type StageStatus = "completed" | "active" | "upcoming" | "blocked";

export interface JourneyStage {
  id: string;
  label: string;
  description: string;
  status: StageStatus;
  completedAt?: string;
  expectedAt?: string;
  responsibleRole?: string;
  responsibleName?: string;
  patientAction?: string;
  notes?: string;
}

export interface DiagnosticJourney {
  patientId: string;
  overallProgress: number; // 0-100
  currentStageId: string;
  stages: JourneyStage[];
  lastUpdated: string;
}

// ─── Care Plan ────────────────────────────────────────────────────────────────

export type CarePlanTaskSource = "Doctor" | "System" | "Patient";
export type CarePlanTaskStatus = "Pending" | "Completed" | "Missed" | "Skipped";

export interface CarePlanTask {
  id: string;
  title: string;
  description?: string;
  category: "Medication" | "Exercise" | "Nutrition" | "Hydration" | "Sleep" | "Follow-up" | "Upload" | "Other";
  source: CarePlanTaskSource;
  dueDate?: string;
  recurring?: boolean;
  status: CarePlanTaskStatus;
  completedAt?: string;
  patientNote?: string;
}

export interface CarePlan {
  id: string;
  patientId: string;
  startDate: string;
  reviewDate: string;
  issuedBy: string;
  careTeam: string[];
  tasks: CarePlanTask[];
  wellnessNotes?: string;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export type GoalFrequency = "Daily" | "Weekly" | "One-time";
export type GoalSource = "Doctor" | "System" | "Patient";
export type GoalStatus = "Pending" | "Completed" | "Missed";

export interface Goal {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  icon?: string;
  frequency: GoalFrequency;
  source: GoalSource;
  reminderTime?: string; // HH:mm
  status: GoalStatus;
  completedAt?: string;
  date: string; // ISO date yyyy-mm-dd
  isPersonal: boolean;
}

// ─── Health Education ─────────────────────────────────────────────────────────

export type EducationCategory =
  | "Breast Self-Awareness"
  | "Screening Methods"
  | "Mammography"
  | "Ultrasound"
  | "Biopsy"
  | "Understanding AI Screening"
  | "Preparing for Appointments"
  | "Understanding Reports"
  | "Treatment Pathways"
  | "Emotional Well-being"
  | "FAQs";

export interface EducationArticle {
  id: string;
  title: string;
  summary: string;
  category: EducationCategory;
  readingTimeMin: number;
  publishedAt: string;
  isSaved?: boolean;
  isRecommendedByDoctor?: boolean;
  readProgress?: number; // 0-100
  contentUrl?: string;
  tags?: string[];
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "Requested"
  | "Confirmed"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "Rescheduled"
  | "Delayed";

export type ConsultationType = "Video" | "In-Person" | "Phone";

export interface Appointment {
  id: string;
  patientId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorInitials: string;
  date: string; // ISO date
  time: string; // HH:mm
  durationMin: number;
  consultationType: ConsultationType;
  location?: string;
  videoLink?: string;
  status: AppointmentStatus;
  preparationNotes?: string;
  documentsRequired?: string[];
  notes?: string;
  canJoinAt?: string; // ISO datetime - enable Join button from this time
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "Patient" | "Doctor" | "Coordinator" | "System";
  content: string;
  sentAt: string;
  readAt?: string;
  attachments?: { name: string; url: string; type: string }[];
}

export interface Conversation {
  id: string;
  patientId: string;
  participantName: string;
  participantRole: "Doctor" | "Coordinator" | "Radiology";
  participantInitials: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isPinned: boolean;
  messages: ChatMessage[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationCategory =
  | "Appointment"
  | "Report"
  | "AI Assessment"
  | "Doctor Review"
  | "Care Plan"
  | "Goal Reminder"
  | "Message"
  | "Account & Security";

export interface PortalNotification {
  id: string;
  patientId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

// ─── Care Team ────────────────────────────────────────────────────────────────

export type CareTeamRole = "Lead Oncologist" | "Radiologist" | "Care Coordinator" | "Breast Care Nurse" | "Pathologist";

export interface CareTeamMember {
  id: string;
  name: string;
  role: CareTeamRole;
  initials: string;
  department?: string;
  hospital?: string;
  availability?: string;
  nextAvailableSlot?: string;
  contactChannel: "Message" | "Appointment" | "Both";
}

// ─── Health Tracker ───────────────────────────────────────────────────────────

export type HealthMetric =
  | "BMI"
  | "Weight"
  | "Blood Pressure"
  | "Blood Glucose"
  | "Hydration"
  | "Exercise"
  | "Sleep"
  | "Mood"
  | "Symptom"
  | "Medication";

export type ReadingSource = "Self-reported" | "Clinician-entered" | "Device-imported";

export interface HealthReading {
  id: string;
  patientId: string;
  metric: HealthMetric;
  value: number | string;
  unit: string;
  recordedAt: string;
  source: ReadingSource;
  notes?: string;
  isAbnormal?: boolean;
}

// ─── Medical Profile ──────────────────────────────────────────────────────────

export interface MedicalProfile {
  patientId: string;
  medicalHistory: string[];
  previousDiagnoses: string[];
  surgicalHistory: string[];
  familyHistory: string[];
  reproductiveHistory: {
    menarcheAge?: number;
    menopauseAge?: number;
    pregnancies?: number;
    breastfeedingMonths?: number;
    hormoneTherapy?: boolean;
  };
  medications: { name: string; dose: string; frequency: string }[];
  allergies: string[];
  previousBreastScreening: {
    year: string;
    type: string;
    result: string;
  }[];
  existingConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  completionPercent: number;
}

// ─── Personal Profile ─────────────────────────────────────────────────────────

export interface PersonalProfile {
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  preferredLanguage: string;
  profilePhotoUrl?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export interface PatientPreferences {
  patientId: string;
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    appointmentReminders: boolean;
    goalReminders: boolean;
    reportUpdates: boolean;
    doctorMessages: boolean;
  };
  language: string;
  reducedMotion: boolean;
  highContrast: boolean;
  textSize: "small" | "medium" | "large";
}

// ─── Security ─────────────────────────────────────────────────────────────────

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface LoginEvent {
  id: string;
  timestamp: string;
  device: string;
  location: string;
  success: boolean;
}
