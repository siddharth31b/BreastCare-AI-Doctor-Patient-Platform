import type { PatientDashboardData } from "../types";

export const MOCK_PATIENT_DASHBOARD: PatientDashboardData = {
  patientName: "Meera Sharma",
  nextRecommendedAction: "Diagnostic Ultrasound Referral",
  journeyProgress: 65,
  bmi: {
    heightCm: 160,
    weightKg: 72,
    age: 46,
    value: 28.1,
    category: "Above healthy range",
    description: "Your BMI is part of general health and lifestyle context. It does not diagnose or predict cancer, but helps guide overall wellness recommendations."
  },
  assessmentStatus: "Clinical Review Recommended",
  doctorReviewStatus: "In Queue (Position #2)",
  upcomingAppointment: {
    doctorName: "Dr. Meera Iyer",
    specialty: "Lead Oncologist",
    date: "18 July 2026",
    time: "11:30 AM",
    isTelehealth: true
  },
  recentReports: [
    { title: "AI Diagnostic Mammography Screening", date: "15 July 2026", status: "Analysis Complete" },
    { title: "Clinical Baseline Assessment", date: "14 July 2026", status: "Validated" },
    { title: "General Physical Report", date: "10 June 2026", status: "Archived" }
  ],
  carePlanTasks: [
    { id: "task-1", task: "Morning Supplements", time: "08:30 AM", completed: true },
    { id: "task-2", task: "15 Min Light Yoga Exercise", time: "06:00 PM", completed: false },
    { id: "task-3", task: "2L Hydration Goal (1.2L Consumed)", time: "All Day", completed: false }
  ],
  reminders: [
    "Upload original ultrasound reports if available.",
    "Complete reproductive history section in your onboarding profile."
  ]
};

export const MOCK_DOCTOR_DASHBOARD = {
  pendingReviews: 12,
  priorityCases: 3,
  todayAppointments: 6,
  followUpsDue: 8,
  averageTurnaroundHours: 2.1,
  recentActivity: [
    { description: "Validated screening for Patient BC-9024", time: "10 mins ago" },
    { description: "Referred Meera Sharma for diagnostic ultrasound", time: "1 hour ago" },
    { description: "Signed clinical diagnostic report for Anita Devi", time: "2 hours ago" }
  ],
  queue: [
    { patientId: "BC-9827", name: "Meera Sharma", age: 46, priority: "HIGH", status: "Awaiting Review", timeInQueue: "2 hours" },
    { patientId: "BC-9041", name: "Sunita Patel", age: 52, priority: "MEDIUM", status: "Awaiting Review", timeInQueue: "4 hours" },
    { patientId: "BC-7812", name: "Anita Gupta", age: 39, priority: "LOW", status: "Awaiting Review", timeInQueue: "1 day" }
  ]
};

export const MOCK_RADIOLOGIST_DASHBOARD = {
  pendingStudies: 8,
  urgentStudies: 2,
  qualityAlerts: 1,
  aiOverlayAvailable: 7,
  reportingStatus: "4 Drafts, 3 Ready for Signature",
  averageReportingMinutes: 18,
  recentCompleted: [
    { studyId: "ST-8812", patientName: "Rita Sen", biRads: 2, date: "Today, 10:15 AM" },
    { studyId: "ST-8809", patientName: "Kamla Devi", biRads: 4, date: "Yesterday, 4:30 PM" }
  ],
  assignedStudies: [
    { studyId: "ST-9921", patientName: "Meera Sharma", age: 46, priority: "URGENT", quality: "EXCELLENT", aiStatus: "Complete" },
    { studyId: "ST-9912", patientName: "Rekha Rao", age: 50, priority: "NORMAL", quality: "POOR (Needs Retake)", aiStatus: "Failed" }
  ]
};

export const MOCK_HOSPITAL_ADMIN_DASHBOARD = {
  patientVolume: 1280,
  screeningVolume: 342,
  pendingClinicalReviews: 14,
  appointmentLoadPercent: 88,
  staffWorkload: "4 Oncologists, 2 Radiologists On Duty",
  averageTurnaroundHours: 3.4,
  escalationsCount: 2,
  followUpCompletionRate: 92,
  departmentMetrics: [
    { name: "Oncology Clinic", volume: 450, load: "90%" },
    { name: "Mammography Suite", volume: 320, load: "85%" },
    { name: "Outreach Screening Camps", volume: 510, load: "70%" }
  ]
};

export const MOCK_RESEARCHER_DASHBOARD = {
  deIdentifiedRecords: 12450,
  activeCohorts: 6,
  sensitivityPercent: 98.4,
  specificityPercent: 95.1,
  falsePositiveTrend: "-1.2% this quarter",
  falseNegativeTrend: "-0.4% this quarter",
  demographics: {
    ageGroups: [
      { group: "30-39", count: 2100 },
      { group: "40-49", count: 4800 },
      { group: "50-59", count: 3900 },
      { group: "60+", count: 1650 }
    ],
    breastDensityDistribution: [
      { category: "Type A (Fatty)", percentage: 12 },
      { category: "Type B (Scattered)", percentage: 43 },
      { category: "Type C (Heterogeneous)", percentage: 35 },
      { category: "Type D (Extremely Dense)", percentage: 10 }
    ]
  },
  modelSummary: {
    version: "BC-AI Core v2.4.1",
    fairnessRatio: "0.98 (Balanced)",
    trainingEpochs: 150
  }
};

export const MOCK_CHW_DASHBOARD = {
  visitsToday: 6,
  registrationsPending: 3,
  screeningsPending: 8,
  referralsPending: 5,
  offlineRecordCount: 4,
  syncStatus: "Connected - Synced",
  campSchedule: "Salamatpur Primary Health Center",
  connectivityStatus: "Weak Signal (Edge Network)",
  visitsList: [
    { id: "v-1", name: "Radha Bai", village: "Salamatpur", purpose: "Register Patient", time: "10:00 AM", done: true },
    { id: "v-2", name: "Meera Sharma", village: "Indore Campus Outreach", purpose: "Follow-up", time: "11:30 AM", done: false },
    { id: "v-3", name: "Suman Devi", village: "Salamatpur", purpose: "Symptom Assessment", time: "01:00 PM", done: false }
  ]
};

export const MOCK_SUPER_ADMIN_DASHBOARD = {
  hospitalsOnboarded: 14,
  totalUsersByRole: {
    PATIENT: 840,
    DOCTOR: 32,
    RADIOLOGIST: 18,
    HOSPITAL_ADMIN: 12,
    RESEARCHER: 8,
    COMMUNITY_HEALTH_WORKER: 24,
    SUPER_ADMIN: 3
  },
  activeSessionsCount: 28,
  aiModelVersionProd: "v2.4.1-release",
  complianceAlertsCount: 0,
  auditActivityCount: 214,
  systemUptimePercent: 99.98,
  openIncidentsCount: 0,
  hospitalsList: [
    { id: "h-1", name: "IIT Indore Main Campus Hospital", status: "ONLINE", users: 120 },
    { id: "h-2", name: "Indore Civil Research Center", status: "ONLINE", users: 84 },
    { id: "h-3", name: "Dhar Community Health Clinic", status: "DEGRADED", users: 45 }
  ]
};
