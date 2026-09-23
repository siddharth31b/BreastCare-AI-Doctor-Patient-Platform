export interface NurseTask {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  category: "Complete Intake" | "Request Report" | "Confirm Appointment" | "Record Measurements" | "Contact Patient" | "Doctor Handoff" | "Follow-up Call";
  dueDate: string;
  assignedBy: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "Pending" | "In Progress" | "Completed";
  notes?: string;
}

export interface NurseAlert {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  type: "Urgent Symptom" | "Missing Information" | "Document Readability" | "Appointment Incomplete" | "Follow-up Overdue" | "Doctor Clarification";
  severity: "URGENT" | "WARNING" | "INFO";
  date: string;
  acknowledged: boolean;
  notes?: string;
}

export interface NurseAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  time: string;
  date: string;
  doctorName: string;
  appointmentType: "Initial Consult" | "Follow-up Intake" | "Report Review" | "Care Planning" | "Screening Prep";
  mode: "In-Person" | "Teleconsult (Video)" | "Teleconsult (Phone)";
  intakeStatus: "Not Started" | "In Progress" | "Complete";
  prepStatus: "Ready" | "Missing Reports" | "Missing Questionnaire" | "Needs Vitals";
  arrivalStatus: "Scheduled" | "Arrived" | "Checked In" | "Completed" | "Cancelled";
  prepChecklist: {
    identityConfirmed: boolean;
    consentConfirmed: boolean;
    basicDetailsComplete: boolean;
    questionnaireComplete: boolean;
    measurementsRecorded: boolean;
    reportsUploaded: boolean;
    doctorHandoffPrepared: boolean;
  };
}

export interface NurseFollowUp {
  id: string;
  patientId: string;
  patientName: string;
  reason: string;
  dueDate: string;
  assignedDoctor: string;
  contactMethod: "Phone Call" | "SMS" | "WhatsApp" | "In-Person";
  contactStatus: "Due Today" | "Upcoming" | "Overdue" | "Completed";
  reached: boolean | null;
  patientUpdate?: string;
  nextAction?: string;
  escalateRequired: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
  completedAt?: string;
  notes?: string;
}

export interface DoctorHandoffRecord {
  id: string;
  patientId: string;
  patientName: string;
  presentingConcern: string;
  symptomDuration: string;
  affectedSide: string;
  relevantHistory: string;
  measurementsSummary: string;
  reportsAvailable: string;
  missingInformation: string;
  nurseFactualNote: string;
  completionTime: string;
  sentToDoctor: boolean;
  doctorName: string;
}

export interface NurseMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "Nurse" | "Doctor" | "Patient" | "Care Team";
  recipientId: string;
  recipientName: string;
  category: "Doctors" | "Patients" | "Care Team";
  content: string;
  timestamp: string;
  patientId?: string;
  patientName?: string;
  attachedReport?: string;
  isUrgent?: boolean;
  isArchived?: boolean;
}

// Initial Mock Seed Data
const initialTasks: NurseTask[] = [
  { id: "nt-1", patientId: "BC-9041", patientName: "Suman Deshmukh", title: "Complete missing reproductive history in intake form", category: "Complete Intake", dueDate: "Today 2:00 PM", assignedBy: "Dr. Sarah Iyer", priority: "HIGH", status: "Pending" },
  { id: "nt-2", patientId: "BC-7812", patientName: "Kiran Rao", title: "Upload previous mammogram report from 2024", category: "Request Report", dueDate: "Today 4:00 PM", assignedBy: "Sister Lakshmi", priority: "MEDIUM", status: "In Progress" },
  { id: "nt-3", patientId: "demo-patient", patientName: "Meera Sharma", title: "Confirm teleconsult appointment readiness for 2:15 PM", category: "Confirm Appointment", dueDate: "Today 1:30 PM", assignedBy: "Dr. Sarah Iyer", priority: "HIGH", status: "Pending" },
  { id: "nt-4", patientId: "BC-6520", patientName: "Ananya Patel", title: "Record baseline height, weight and BP measurements", category: "Record Measurements", dueDate: "Tomorrow 10:00 AM", assignedBy: "Sister Lakshmi", priority: "LOW", status: "Pending" },
  { id: "nt-5", patientId: "BC-5411", patientName: "Pooja Verma", title: "Call patient for 7-day post-screening follow-up check", category: "Follow-up Call", dueDate: "Today 5:00 PM", assignedBy: "Dr. Alok Mehta", priority: "MEDIUM", status: "Pending" },
];

const initialAlerts: NurseAlert[] = [
  { id: "na-1", patientId: "BC-9041", patientName: "Suman Deshmukh", title: "Requires clinician attention: Rapid onset swelling reported", type: "Urgent Symptom", severity: "URGENT", date: "Today 10:15 AM", acknowledged: false, notes: "Patient reported new firm lump present for 2 weeks with localized tenderness." },
  { id: "na-2", patientId: "BC-7812", patientName: "Kiran Rao", title: "Uploaded ultrasound scan image is blurry / low resolution", type: "Document Readability", severity: "WARNING", date: "Today 09:30 AM", acknowledged: false, notes: "Page 2 of ultrasound PDF is unreadable. Re-upload requested." },
  { id: "na-3", patientId: "demo-patient", patientName: "Meera Sharma", title: "Doctor clarification requested: Verify menarche age", type: "Doctor Clarification", severity: "WARNING", date: "Yesterday 4:20 PM", acknowledged: true, notes: "Dr. Sarah Iyer requested re-confirmation of reproductive history." },
  { id: "na-4", patientId: "BC-4109", patientName: "Sunita Reddy", title: "Follow-up phone check-in overdue by 2 days", type: "Follow-up Overdue", severity: "WARNING", date: "Jul 21, 2026", acknowledged: false, notes: "Scheduled 14-day post-intake call pending." },
];

const initialAppointments: NurseAppointment[] = [
  {
    id: "app-1",
    patientId: "BC-9041",
    patientName: "Suman Deshmukh",
    patientAge: 42,
    time: "10:30 AM",
    date: "2026-07-23",
    doctorName: "Dr. Sarah Iyer",
    appointmentType: "Initial Consult",
    mode: "In-Person",
    intakeStatus: "In Progress",
    prepStatus: "Missing Reports",
    arrivalStatus: "Arrived",
    prepChecklist: { identityConfirmed: true, consentConfirmed: true, basicDetailsComplete: true, questionnaireComplete: false, measurementsRecorded: true, reportsUploaded: false, doctorHandoffPrepared: false }
  },
  {
    id: "app-2",
    patientId: "BC-7812",
    patientName: "Kiran Rao",
    patientAge: 51,
    time: "11:45 AM",
    date: "2026-07-23",
    doctorName: "Dr. Alok Mehta",
    appointmentType: "Follow-up Intake",
    mode: "In-Person",
    intakeStatus: "Not Started",
    prepStatus: "Needs Vitals",
    arrivalStatus: "Scheduled",
    prepChecklist: { identityConfirmed: true, consentConfirmed: true, basicDetailsComplete: true, questionnaireComplete: false, measurementsRecorded: false, reportsUploaded: true, doctorHandoffPrepared: false }
  },
  {
    id: "app-3",
    patientId: "demo-patient",
    patientName: "Meera Sharma",
    patientAge: 34,
    time: "02:15 PM",
    date: "2026-07-23",
    doctorName: "Dr. Sarah Iyer",
    appointmentType: "Screening Prep",
    mode: "Teleconsult (Video)",
    intakeStatus: "Complete",
    prepStatus: "Ready",
    arrivalStatus: "Checked In",
    prepChecklist: { identityConfirmed: true, consentConfirmed: true, basicDetailsComplete: true, questionnaireComplete: true, measurementsRecorded: true, reportsUploaded: true, doctorHandoffPrepared: true }
  },
  {
    id: "app-4",
    patientId: "BC-6520",
    patientName: "Ananya Patel",
    patientAge: 38,
    time: "04:00 PM",
    date: "2026-07-23",
    doctorName: "Dr. Sarah Iyer",
    appointmentType: "Report Review",
    mode: "In-Person",
    intakeStatus: "Not Started",
    prepStatus: "Missing Questionnaire",
    arrivalStatus: "Scheduled",
    prepChecklist: { identityConfirmed: true, consentConfirmed: false, basicDetailsComplete: true, questionnaireComplete: false, measurementsRecorded: false, reportsUploaded: false, doctorHandoffPrepared: false }
  }
];

const initialFollowUps: NurseFollowUp[] = [
  { id: "fu-1", patientId: "BC-9041", patientName: "Suman Deshmukh", reason: "Confirm arrival of previous mammogram disk from external clinic", dueDate: "2026-07-23", assignedDoctor: "Dr. Sarah Iyer", contactMethod: "Phone Call", contactStatus: "Due Today", reached: null, escalateRequired: false, priority: "HIGH" },
  { id: "fu-2", patientId: "BC-5411", patientName: "Pooja Verma", reason: "Post-intake 7-day symptom check call", dueDate: "2026-07-23", assignedDoctor: "Dr. Alok Mehta", contactMethod: "Phone Call", contactStatus: "Due Today", reached: null, escalateRequired: false, priority: "MEDIUM" },
  { id: "fu-3", patientId: "BC-4109", patientName: "Sunita Reddy", reason: "Check if patient completed requested ultrasound at diagnostic lab", dueDate: "2026-07-21", assignedDoctor: "Dr. Sarah Iyer", contactMethod: "SMS", contactStatus: "Overdue", reached: false, escalateRequired: false, priority: "HIGH" },
  { id: "fu-4", patientId: "BC-3320", patientName: "Lakshmi Narayanan", reason: "Confirm appointment time for upcoming consultation", dueDate: "2026-07-25", assignedDoctor: "Dr. Sarah Iyer", contactMethod: "WhatsApp", contactStatus: "Upcoming", reached: null, escalateRequired: false, priority: "LOW" },
];

const initialMessages: NurseMessage[] = [
  { id: "msg-1", senderId: "doc-1", senderName: "Dr. Sarah Iyer", senderRole: "Doctor", recipientId: "nurse-1", recipientName: "Sister Lakshmi", category: "Doctors", content: "Hi Sister Lakshmi, please verify if Suman Deshmukh (BC-9041) brought her 2024 ultrasound report.", timestamp: "10:14 AM", patientId: "BC-9041", patientName: "Suman Deshmukh", isUrgent: true },
  { id: "msg-2", senderId: "demo-patient", senderName: "Meera Sharma", senderRole: "Patient", recipientId: "nurse-1", recipientName: "Sister Lakshmi", category: "Patients", content: "Hello nurse, I uploaded my blood report PDF. Could you check if it is clear?", timestamp: "09:45 AM", patientId: "demo-patient", patientName: "Meera Sharma" },
  { id: "msg-3", senderId: "rad-1", senderName: "Dr. Alok Mehta", senderRole: "Care Team", recipientId: "nurse-1", recipientName: "Sister Lakshmi", category: "Care Team", content: "Ultrasound scan for Kiran Rao (BC-7812) uploaded today needs a clearer page 2.", timestamp: "Yesterday 4:30 PM", patientId: "BC-7812", patientName: "Kiran Rao" },
];

export class NurseService {
  private static tasks: NurseTask[] = initialTasks;
  private static alerts: NurseAlert[] = initialAlerts;
  private static appointments: NurseAppointment[] = initialAppointments;
  private static followUps: NurseFollowUp[] = initialFollowUps;
  private static messages: NurseMessage[] = initialMessages;
  private static handoffs: Record<string, DoctorHandoffRecord> = {};

  // Tasks
  static getTasks(): NurseTask[] {
    return [...this.tasks];
  }

  static completeTask(taskId: string): void {
    const t = this.tasks.find((x) => x.id === taskId);
    if (t) t.status = "Completed";
  }

  static addTask(task: Omit<NurseTask, "id" | "status">): NurseTask {
    const newTask: NurseTask = {
      ...task,
      id: `nt-${Date.now()}`,
      status: "Pending",
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  // Alerts
  static getAlerts(): NurseAlert[] {
    return [...this.alerts];
  }

  static acknowledgeAlert(alertId: string): void {
    const a = this.alerts.find((x) => x.id === alertId);
    if (a) a.acknowledged = true;
  }

  // Appointments
  static getAppointments(): NurseAppointment[] {
    return [...this.appointments];
  }

  static updateAppointmentArrival(id: string, status: NurseAppointment["arrivalStatus"]): void {
    const app = this.appointments.find((a) => a.id === id);
    if (app) app.arrivalStatus = status;
  }

  static updatePrepChecklist(id: string, checklist: Partial<NurseAppointment["prepChecklist"]>): void {
    const app = this.appointments.find((a) => a.id === id);
    if (app) {
      app.prepChecklist = { ...app.prepChecklist, ...checklist };
      const allDone = Object.values(app.prepChecklist).every(Boolean);
      if (allDone) app.prepStatus = "Ready";
    }
  }

  // Follow-ups
  static getFollowUps(): NurseFollowUp[] {
    return [...this.followUps];
  }

  static recordFollowUpCall(id: string, reached: boolean, notes: string, nextAction?: string): void {
    const fu = this.followUps.find((f) => f.id === id);
    if (fu) {
      fu.reached = reached;
      fu.notes = notes;
      if (nextAction) fu.nextAction = nextAction;
      fu.contactStatus = "Completed";
      fu.completedAt = new Date().toISOString();
    }
  }

  static addFollowUp(fu: Omit<NurseFollowUp, "id" | "completedAt">): NurseFollowUp {
    const newFu: NurseFollowUp = {
      ...fu,
      id: `fu-${Date.now()}`,
    };
    this.followUps.unshift(newFu);
    return newFu;
  }

  // Handoffs
  static getHandoff(patientId: string): DoctorHandoffRecord | null {
    return this.handoffs[patientId] || null;
  }

  static saveHandoff(handoff: DoctorHandoffRecord): void {
    this.handoffs[handoff.patientId] = handoff;
  }

  // Messages
  static getMessages(category?: "Doctors" | "Patients" | "Care Team"): NurseMessage[] {
    if (!category) return [...this.messages];
    return this.messages.filter((m) => m.category === category && !m.isArchived);
  }

  static sendMessage(msg: Omit<NurseMessage, "id" | "timestamp">): NurseMessage {
    const newMsg: NurseMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    this.messages.unshift(newMsg);
    return newMsg;
  }

  // BMI Helper
  static calculateBmi(heightCm: number, weightKg: number): { value: number; category: string; description: string } {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
      return { value: 0, category: "Not Calculated", description: "Enter height and weight to calculate BMI." };
    }
    const heightM = heightCm / 100;
    const value = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
    let category = "";
    let description = "";

    if (value < 18.5) {
      category = "Underweight";
      description = "BMI is below the standard range (<18.5).";
    } else if (value < 25.0) {
      category = "Normal Weight";
      description = "BMI is within the standard healthy range (18.5–24.9).";
    } else if (value < 30.0) {
      category = "Overweight";
      description = "BMI is above the standard range (25.0–29.9).";
    } else {
      category = "Obesity";
      description = "BMI is in the obesity classification (≥30.0).";
    }

    return { value, category, description };
  }
}
