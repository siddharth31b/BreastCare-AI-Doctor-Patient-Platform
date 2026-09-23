// ─── Patient Portal Mock Data ─────────────────────────────────────────────────
// Replace these with real API calls when the backend is ready.
// All data is typed against src/types/patient-portal.ts

import type {
  PatientReport,
  AIAssessment,
  DoctorReview,
  DiagnosticJourney,
  CarePlan,
  Goal,
  EducationArticle,
  Appointment,
  Conversation,
  ChatMessage,
  PortalNotification,
  CareTeamMember,
  HealthReading,
  MedicalProfile,
  PersonalProfile,
  PatientPreferences,
  ActiveSession,
  LoginEvent,
} from "../types/patient-portal";

const PATIENT_ID = "patient-001";

// ─── Reports ─────────────────────────────────────────────────────────────────

export const mockReports: PatientReport[] = [
  {
    id: "rep-001",
    patientId: PATIENT_ID,
    title: "Bilateral Mammography Report",
    category: "Breast Imaging",
    reportType: "Mammography",
    fileName: "mammography_nov2025.pdf",
    fileType: "PDF",
    fileSizeMb: 2.4,
    uploadedAt: "2025-11-10T09:30:00Z",
    status: "Doctor Reviewed",
    source: "Patient Uploaded",
    reviewedBy: "Dr. Sarah Iyer",
    reviewedAt: "2025-11-13T14:00:00Z",
    notes: "Reviewed and findings documented.",
  },
  {
    id: "rep-002",
    patientId: PATIENT_ID,
    title: "Breast Ultrasound Scan",
    category: "Breast Imaging",
    reportType: "Breast Ultrasound",
    fileName: "ultrasound_oct2025.jpg",
    fileType: "JPG",
    fileSizeMb: 1.1,
    uploadedAt: "2025-10-22T11:00:00Z",
    status: "AI Reviewed",
    source: "Patient Uploaded",
  },
  {
    id: "rep-003",
    patientId: PATIENT_ID,
    title: "Blood Test Report",
    category: "Pathology & Laboratory",
    reportType: "Blood Test Report",
    fileName: "bloodwork_oct2025.pdf",
    fileType: "PDF",
    fileSizeMb: 0.8,
    uploadedAt: "2025-10-15T08:45:00Z",
    status: "Uploaded",
    source: "Patient Uploaded",
  },
  {
    id: "rep-004",
    patientId: PATIENT_ID,
    title: "AI Clinical Intelligence Overview",
    category: "Clinical Documents",
    reportType: "AI Generated Summary",
    fileName: "ai_summary_nov2025.pdf",
    fileType: "PDF",
    fileSizeMb: 0.5,
    uploadedAt: "2025-11-13T12:00:00Z",
    status: "Doctor Reviewed",
    source: "AI Generated",
  },
  {
    id: "rep-005",
    patientId: PATIENT_ID,
    title: "Referral Letter",
    category: "Clinical Documents",
    reportType: "Referral Letter",
    fileName: "referral_nov2025.pdf",
    fileType: "PDF",
    fileSizeMb: 0.3,
    uploadedAt: "2025-11-01T10:00:00Z",
    status: "Awaiting Doctor Review",
    source: "Hospital Record",
  },
];

// ─── AI Assessment ────────────────────────────────────────────────────────────

export const mockAIAssessment: AIAssessment = {
  id: "ai-001",
  reportId: "rep-001",
  patientId: PATIENT_ID,
  performedAt: "2025-11-11T10:00:00Z",
  modelVersion: "NariSetu-AI v2.3.1",
  riskLevel: "Moderate",
  overallConfidence: 78,
  findings: [
    { region: "Left breast, upper outer quadrant", observation: "Subtle asymmetric density noted. Requires clinical correlation.", confidence: 74 },
    { region: "Right breast", observation: "No significant abnormality detected in this region.", confidence: 91 },
  ],
  keyObservations: [
    "Asymmetric tissue density observed in left upper outer quadrant.",
    "No calcifications identified in the AI-processed image.",
    "Image quality adequate for preliminary assessment.",
  ],
  limitations: [
    "AI screening is a preliminary tool and not a substitute for radiologist evaluation.",
    "Dense breast tissue may limit detection sensitivity.",
    "This assessment is based solely on the submitted image and does not account for clinical history.",
  ],
  dataQualityWarnings: [
    "Image resolution is within acceptable range but not optimal.",
  ],
  recommendedNextStep: "Await specialist clinical review. Dr. Sarah Iyer has been assigned to review this assessment.",
  clinicalReviewStatus: "Completed",
  clinicalReviewedAt: "2025-11-13T14:00:00Z",
};

// ─── Doctor Review ────────────────────────────────────────────────────────────

export const mockDoctorReview: DoctorReview = {
  id: "dr-001",
  assessmentId: "ai-001",
  patientId: PATIENT_ID,
  assignedDoctor: {
    id: "doc-001",
    name: "Dr. Sarah Iyer",
    specialty: "Lead Oncologist",
    initials: "SI",
  },
  reviewStatus: "Completed",
  reviewedAt: "2025-11-13T14:00:00Z",
  clinicalInterpretation:
    "The left upper outer quadrant finding noted by AI is consistent with focal asymmetric density. Based on clinical history and imaging, this pattern warrants a short-interval follow-up mammogram rather than immediate intervention.",
  differenceFromAI:
    "AI flagged moderate risk based on density asymmetry. Clinical assessment indicates this is likely a benign finding with low malignant probability. Risk reclassified to Low-Moderate pending follow-up.",
  recommendedTests: [
    "Short-interval follow-up mammogram in 6 months",
    "Breast ultrasound correlation",
  ],
  recommendedAppointmentType: "Video Consultation",
  doctorNotes:
    "Patient is advised to continue monthly breast self-examination and report any new palpable changes immediately.",
  followUpInstructions:
    "Book follow-up appointment within 2 weeks to discuss findings in detail. Bring all current imaging reports.",
};

// ─── Diagnostic Journey ───────────────────────────────────────────────────────

export const mockJourney: DiagnosticJourney = {
  patientId: PATIENT_ID,
  overallProgress: 71,
  currentStageId: "stage-05",
  lastUpdated: "2025-11-13T14:00:00Z",
  stages: [
    { id: "stage-01", label: "Profile Setup", description: "Patient profile and medical history completed.", status: "completed", completedAt: "2025-09-01T09:00:00Z" },
    { id: "stage-02", label: "Risk Assessment", description: "Initial breast cancer risk questionnaire completed.", status: "completed", completedAt: "2025-09-05T10:00:00Z", responsibleRole: "Patient" },
    { id: "stage-03", label: "Scan Upload", description: "Mammography and ultrasound reports uploaded.", status: "completed", completedAt: "2025-11-10T09:30:00Z", responsibleRole: "Patient" },
    { id: "stage-04", label: "AI Screening", description: "AI model has analysed the uploaded scan.", status: "completed", completedAt: "2025-11-11T10:00:00Z", responsibleRole: "NariSetu AI" },
    { id: "stage-05", label: "Clinical Review", description: "Assigned oncologist is reviewing AI assessment and scan.", status: "active", expectedAt: "2025-11-18T17:00:00Z", responsibleRole: "Doctor", responsibleName: "Dr. Sarah Iyer", patientAction: "No action required. Your doctor will contact you." },
    { id: "stage-06", label: "Consultation", description: "Video or in-person consultation with your assigned specialist.", status: "upcoming", expectedAt: "2025-11-18T15:00:00Z", responsibleRole: "Doctor", responsibleName: "Dr. Sarah Iyer" },
    { id: "stage-07", label: "Care Plan", description: "Personalised care and follow-up plan will be issued after consultation.", status: "upcoming" },
  ],
};

// ─── Care Plan ────────────────────────────────────────────────────────────────

export const mockCarePlan: CarePlan = {
  id: "cp-001",
  patientId: PATIENT_ID,
  startDate: "2025-11-01",
  reviewDate: "2026-02-01",
  issuedBy: "Dr. Sarah Iyer",
  careTeam: ["Dr. Sarah Iyer", "Ms. Rekha Sharma (Care Coordinator)"],
  tasks: [
    { id: "t-01", title: "Daily breast self-examination", description: "Perform a systematic self-check each morning.", category: "Other", source: "Doctor", recurring: true, status: "Pending", dueDate: "2025-11-22" },
    { id: "t-02", title: "Drink 2.5 L of water daily", category: "Hydration", source: "Doctor", recurring: true, status: "Completed", dueDate: "2025-11-22", completedAt: "2025-11-22T08:00:00Z" },
    { id: "t-03", title: "Upload follow-up scan when available", category: "Upload", source: "Doctor", status: "Pending", dueDate: "2025-12-15" },
    { id: "t-04", title: "30-minute walk daily", category: "Exercise", source: "System", recurring: true, status: "Pending", dueDate: "2025-11-22" },
    { id: "t-05", title: "Book follow-up appointment", category: "Follow-up", source: "Doctor", status: "Pending", dueDate: "2025-11-30" },
    { id: "t-06", title: "Complete nutrition journal", description: "Log meals for the next 7 days using the health tracker.", category: "Nutrition", source: "Patient", isPersonal: true, status: "Pending", dueDate: "2025-11-28" } as any,
  ],
  wellnessNotes: "Maintain a balanced diet rich in antioxidants. Prioritise 7–8 hours of sleep nightly.",
};

// ─── Goals ────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);

export const mockGoals: Goal[] = [
  { id: "g-01", patientId: PATIENT_ID, title: "Morning breast self-check", frequency: "Daily", source: "Doctor", status: "Pending", date: today, isPersonal: false, icon: "🩺", reminderTime: "08:00" },
  { id: "g-02", patientId: PATIENT_ID, title: "Drink 2.5 L water", frequency: "Daily", source: "System", status: "Completed", date: today, isPersonal: false, icon: "💧", completedAt: new Date().toISOString() },
  { id: "g-03", patientId: PATIENT_ID, title: "30-minute walk", frequency: "Daily", source: "System", status: "Pending", date: today, isPersonal: false, icon: "🚶‍♀️", reminderTime: "17:00" },
  { id: "g-04", patientId: PATIENT_ID, title: "Log today's meals", frequency: "Daily", source: "Patient", status: "Pending", date: today, isPersonal: true, icon: "🥗" },
  { id: "g-05", patientId: PATIENT_ID, title: "Read breast health article", frequency: "Weekly", source: "Doctor", status: "Completed", date: today, isPersonal: false, icon: "📖", completedAt: new Date().toISOString() },
  { id: "g-06", patientId: PATIENT_ID, title: "8 hours of sleep", frequency: "Daily", source: "System", status: "Missed", date: today, isPersonal: false, icon: "😴" },
];

// ─── Education Articles ───────────────────────────────────────────────────────

export const mockArticles: EducationArticle[] = [
  { id: "art-01", title: "How to Perform a Breast Self-Examination", summary: "A step-by-step guide to monthly self-checks.", category: "Breast Self-Awareness", readingTimeMin: 5, publishedAt: "2025-10-01", isSaved: true, isRecommendedByDoctor: true, readProgress: 100 },
  { id: "art-02", title: "Understanding Your Mammography Report", summary: "What the terms in your mammography result mean.", category: "Mammography", readingTimeMin: 8, publishedAt: "2025-10-10", isSaved: false, readProgress: 40 },
  { id: "art-03", title: "How AI Assists in Breast Cancer Screening", summary: "An explainer on AI-assisted screening and its limitations.", category: "Understanding AI Screening", readingTimeMin: 6, publishedAt: "2025-11-01", isRecommendedByDoctor: true, readProgress: 0 },
  { id: "art-04", title: "Preparing for Your First Breast Ultrasound", summary: "What to expect and how to prepare.", category: "Ultrasound", readingTimeMin: 4, publishedAt: "2025-09-15", readProgress: 100 },
  { id: "art-05", title: "Managing Anxiety Around Screening Results", summary: "Practical strategies for emotional well-being during diagnosis.", category: "Emotional Well-being", readingTimeMin: 7, publishedAt: "2025-10-20", isSaved: true, readProgress: 60 },
  { id: "art-06", title: "What is a Biopsy and When is it Needed?", summary: "Types of biopsies and what the process involves.", category: "Biopsy", readingTimeMin: 9, publishedAt: "2025-09-01", readProgress: 0 },
  { id: "art-07", title: "FAQs: NariSetu AI Platform", summary: "Common questions about our platform and your privacy.", category: "FAQs", readingTimeMin: 3, publishedAt: "2025-11-05", readProgress: 100 },
  { id: "art-08", title: "Understanding Treatment Pathways", summary: "An overview of possible treatment options after diagnosis.", category: "Treatment Pathways", readingTimeMin: 12, publishedAt: "2025-08-15", readProgress: 0 },
];

// ─── Appointments ─────────────────────────────────────────────────────────────

export const mockAppointments: Appointment[] = [
  {
    id: "apt-001",
    patientId: PATIENT_ID,
    doctorName: "Dr. Sarah Iyer",
    doctorSpecialty: "Lead Oncologist",
    doctorInitials: "SI",
    date: "2025-11-18",
    time: "15:00",
    durationMin: 30,
    consultationType: "Video",
    videoLink: "https://meet.breastcareai.in/session/apt-001",
    status: "Confirmed",
    preparationNotes: "Please have your mammography report and ultrasound scan ready to share during the consultation.",
    documentsRequired: ["Mammography Report", "Breast Ultrasound Report"],
    canJoinAt: "2025-11-18T14:45:00Z",
  },
  {
    id: "apt-002",
    patientId: PATIENT_ID,
    doctorName: "Dr. Sarah Iyer",
    doctorSpecialty: "Lead Oncologist",
    doctorInitials: "SI",
    date: "2025-10-05",
    time: "11:00",
    durationMin: 30,
    consultationType: "Video",
    status: "Completed",
    notes: "Initial consultation completed. Follow-up imaging recommended.",
  },
  {
    id: "apt-003",
    patientId: PATIENT_ID,
    doctorName: "Dr. Arun Mehta",
    doctorSpecialty: "Radiologist",
    doctorInitials: "AM",
    date: "2025-12-10",
    time: "10:00",
    durationMin: 45,
    consultationType: "In-Person",
    location: "IIT Indore Drishti Clinic, Room 204",
    status: "Requested",
  },
];

// ─── Messages ─────────────────────────────────────────────────────────────────

const baseMessages: ChatMessage[] = [
  { id: "msg-001", conversationId: "conv-001", senderId: "doc-001", senderName: "Dr. Sarah Iyer", senderRole: "Doctor", content: "Hello Meera, I have reviewed your latest mammography report. I will share my formal findings in the clinical review section. Please book a consultation at your earliest convenience.", sentAt: "2025-11-13T15:00:00Z", readAt: "2025-11-13T16:00:00Z" },
  { id: "msg-002", conversationId: "conv-001", senderId: PATIENT_ID, senderName: "Meera Sharma", senderRole: "Patient", content: "Thank you Dr. Iyer. I have booked a video consultation for 18th November at 3 PM.", sentAt: "2025-11-13T16:30:00Z", readAt: "2025-11-13T17:00:00Z" },
  { id: "msg-003", conversationId: "conv-001", senderId: "doc-001", senderName: "Dr. Sarah Iyer", senderRole: "Doctor", content: "Perfect. Please ensure you have your reports ready to share during the call. See you then.", sentAt: "2025-11-13T17:05:00Z" },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv-001",
    patientId: PATIENT_ID,
    participantName: "Dr. Sarah Iyer",
    participantRole: "Doctor",
    participantInitials: "SI",
    lastMessage: "Perfect. Please ensure you have your reports ready to share during the call.",
    lastMessageAt: "2025-11-13T17:05:00Z",
    unreadCount: 0,
    isPinned: true,
    messages: baseMessages,
  },
  {
    id: "conv-002",
    patientId: PATIENT_ID,
    participantName: "Ms. Rekha Sharma",
    participantRole: "Coordinator",
    participantInitials: "RS",
    lastMessage: "Your appointment for 18th November has been confirmed. You will receive a video link shortly.",
    lastMessageAt: "2025-11-12T11:00:00Z",
    unreadCount: 1,
    isPinned: false,
    messages: [
      { id: "msg-004", conversationId: "conv-002", senderId: "coord-001", senderName: "Ms. Rekha Sharma", senderRole: "Coordinator", content: "Your appointment for 18th November has been confirmed. You will receive a video link shortly.", sentAt: "2025-11-12T11:00:00Z" },
    ],
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export const mockNotifications: PortalNotification[] = [
  { id: "n-01", patientId: PATIENT_ID, category: "Doctor Review", title: "Doctor review completed", body: "Dr. Sarah Iyer has completed the clinical review of your mammography report.", isRead: false, isImportant: true, createdAt: "2025-11-13T14:00:00Z", actionUrl: "/patient/screening/review", actionLabel: "View Review" },
  { id: "n-02", patientId: PATIENT_ID, category: "Appointment", title: "Appointment confirmed", body: "Your video consultation with Dr. Sarah Iyer on 18 Nov 2025 at 3:00 PM is confirmed.", isRead: false, isImportant: true, createdAt: "2025-11-12T10:00:00Z", actionUrl: "/patient/connect", actionLabel: "View Appointment" },
  { id: "n-03", patientId: PATIENT_ID, category: "AI Assessment", title: "AI screening complete", body: "The AI screening pipeline has completed analysis of your mammography report.", isRead: true, isImportant: false, createdAt: "2025-11-11T10:00:00Z", actionUrl: "/patient/screening/ai", actionLabel: "View Assessment" },
  { id: "n-04", patientId: PATIENT_ID, category: "Report", title: "Report uploaded", body: "Your mammography report has been successfully uploaded and queued for review.", isRead: true, isImportant: false, createdAt: "2025-11-10T09:30:00Z" },
  { id: "n-05", patientId: PATIENT_ID, category: "Goal Reminder", title: "Daily goal reminder", body: "Don't forget your daily breast self-check and hydration goals.", isRead: true, isImportant: false, createdAt: "2025-11-10T08:00:00Z" },
  { id: "n-06", patientId: PATIENT_ID, category: "Message", title: "New message from Dr. Sarah Iyer", body: "You have a new message from your assigned specialist.", isRead: false, isImportant: false, createdAt: "2025-11-13T15:00:00Z", actionUrl: "/patient/connect/messages", actionLabel: "Read Message" },
  { id: "n-07", patientId: PATIENT_ID, category: "Care Plan", title: "Care plan updated", body: "Your care plan has been updated by Dr. Sarah Iyer. New tasks have been added.", isRead: true, isImportant: false, createdAt: "2025-11-01T09:00:00Z", actionUrl: "/patient/care/plan", actionLabel: "View Plan" },
];

// ─── Care Team ────────────────────────────────────────────────────────────────

export const mockCareTeam: CareTeamMember[] = [
  { id: "ct-01", name: "Dr. Sarah Iyer", role: "Lead Oncologist", initials: "SI", department: "Oncology", hospital: "IIT Indore Drishti Clinic", availability: "Mon–Fri, 9 AM–5 PM", nextAvailableSlot: "2025-11-18T15:00:00Z", contactChannel: "Both" },
  { id: "ct-02", name: "Dr. Arun Mehta", role: "Radiologist", initials: "AM", department: "Radiology", hospital: "IIT Indore Drishti Clinic", availability: "Mon–Sat, 10 AM–4 PM", contactChannel: "Appointment" },
  { id: "ct-03", name: "Ms. Rekha Sharma", role: "Care Coordinator", initials: "RS", department: "Patient Services", hospital: "IIT Indore Drishti Clinic", availability: "Mon–Fri, 8 AM–6 PM", contactChannel: "Both" },
  { id: "ct-04", name: "Ms. Priya Nair", role: "Breast Care Nurse", initials: "PN", department: "Nursing", hospital: "IIT Indore Drishti Clinic", availability: "Mon–Fri, 9 AM–5 PM", contactChannel: "Message" },
];

// ─── Health Readings ──────────────────────────────────────────────────────────

export const mockHealthReadings: HealthReading[] = [
  { id: "hr-01", patientId: PATIENT_ID, metric: "Weight", value: 62, unit: "kg", recordedAt: "2025-11-22T07:00:00Z", source: "Self-reported" },
  { id: "hr-02", patientId: PATIENT_ID, metric: "Blood Pressure", value: "118/76", unit: "mmHg", recordedAt: "2025-11-22T07:05:00Z", source: "Self-reported" },
  { id: "hr-03", patientId: PATIENT_ID, metric: "Blood Glucose", value: 95, unit: "mg/dL", recordedAt: "2025-11-22T07:10:00Z", source: "Self-reported" },
  { id: "hr-04", patientId: PATIENT_ID, metric: "Hydration", value: 2.1, unit: "L", recordedAt: "2025-11-22T21:00:00Z", source: "Self-reported" },
  { id: "hr-05", patientId: PATIENT_ID, metric: "Exercise", value: 35, unit: "min", recordedAt: "2025-11-22T18:00:00Z", source: "Self-reported" },
  { id: "hr-06", patientId: PATIENT_ID, metric: "Sleep", value: 7.5, unit: "hours", recordedAt: "2025-11-22T06:00:00Z", source: "Self-reported" },
  { id: "hr-07", patientId: PATIENT_ID, metric: "Mood", value: 4, unit: "/5", recordedAt: "2025-11-22T08:00:00Z", source: "Self-reported" },
  { id: "hr-08", patientId: PATIENT_ID, metric: "BMI", value: 25.5, unit: "kg/m²", recordedAt: "2025-11-22T07:00:00Z", source: "Clinician-entered" },
];

// ─── Medical Profile ──────────────────────────────────────────────────────────

export const mockMedicalProfile: MedicalProfile = {
  patientId: PATIENT_ID,
  medicalHistory: ["Hypothyroidism (managed with medication)", "Mild hypertension (diet-controlled)"],
  previousDiagnoses: ["Benign breast cyst (2020, resolved)"],
  surgicalHistory: ["Appendectomy (2015)"],
  familyHistory: ["Maternal aunt: Breast cancer (diagnosed at 58)", "Mother: Type 2 Diabetes"],
  reproductiveHistory: { menarcheAge: 13, pregnancies: 2, breastfeedingMonths: 18, hormoneTherapy: false },
  medications: [
    { name: "Levothyroxine", dose: "50 mcg", frequency: "Once daily (morning)" },
    { name: "Vitamin D3", dose: "1000 IU", frequency: "Once daily" },
  ],
  allergies: ["Penicillin (rash)", "Latex"],
  previousBreastScreening: [
    { year: "2023", type: "Mammography", result: "BI-RADS 2 — Benign" },
    { year: "2021", type: "Breast Ultrasound", result: "Simple cyst, no malignancy" },
  ],
  existingConditions: ["Hypothyroidism", "Mild hypertension"],
  emergencyContact: { name: "Ramesh Sharma", relationship: "Husband", phone: "+91 98765 43210" },
  completionPercent: 82,
};

// ─── Personal Profile ─────────────────────────────────────────────────────────

export const mockPersonalProfile: PersonalProfile = {
  patientId: PATIENT_ID,
  fullName: "Meera Sharma",
  dateOfBirth: "1985-03-14",
  gender: "Female",
  email: "meera.sharma@email.com",
  phone: "+91 98765 12345",
  address: "12, Green Valley Apartments, Indore, Madhya Pradesh 452001",
  preferredLanguage: "English",
  emergencyContact: { name: "Ramesh Sharma", relationship: "Husband", phone: "+91 98765 43210" },
};

// ─── Preferences ─────────────────────────────────────────────────────────────

export const mockPreferences: PatientPreferences = {
  patientId: PATIENT_ID,
  notifications: {
    email: true,
    sms: false,
    inApp: true,
    appointmentReminders: true,
    goalReminders: true,
    reportUpdates: true,
    doctorMessages: true,
  },
  language: "English",
  reducedMotion: false,
  highContrast: false,
  textSize: "medium",
};

// ─── Sessions & Login Events ──────────────────────────────────────────────────

export const mockActiveSessions: ActiveSession[] = [
  { id: "sess-001", device: "Chrome on Windows 11", location: "Indore, Madhya Pradesh", lastActiveAt: new Date().toISOString(), isCurrent: true },
  { id: "sess-002", device: "Safari on iPhone 14", location: "Indore, Madhya Pradesh", lastActiveAt: "2025-11-21T20:00:00Z", isCurrent: false },
];

export const mockLoginHistory: LoginEvent[] = [
  { id: "le-001", timestamp: new Date().toISOString(), device: "Chrome on Windows 11", location: "Indore, MP", success: true },
  { id: "le-002", timestamp: "2025-11-21T20:00:00Z", device: "Safari on iPhone 14", location: "Indore, MP", success: true },
  { id: "le-003", timestamp: "2025-11-20T08:30:00Z", device: "Chrome on Windows 11", location: "Indore, MP", success: false },
];
