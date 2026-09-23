import { 
  PatientRepositoryImpl,
  NotificationRepositoryImpl,
  AuditRepositoryImpl,
  documentRepo,
  wellnessGoalRepo,
  carePlanRepo
} from "./repositories";
import { calculateCareGuidance, calculateClinicalRiskAnalysis } from "../features/questionnaire/assessmentEngine";
import { getQuestions, type RiskProfileData } from "./symptom.service";
import type { 
  PatientRecord, 
  QuestionnaireSession, 
  QuestionnaireAnswer, 
  ClinicalPriorityFlag, 
  QuestionnaireSummary,
  DoctorNotification,
  ConsentRecord,
  UploadedClinicalDocument,
  BmiRecord,
  WellnessGoal,
  PatientReport,
  BloodPressureRecord,
  BloodGlucoseRecord,
  BloodPressureStatus,
  GlucoseTestType,
  GlucoseUnit,
  CarePlanItem,
  GeneralWellnessStatus,
  SelfReportedWellnessStatus
} from "../types/questionnaire";
import { CLINICAL_RULES } from "../config/clinicalRules";

const patientRepo = new PatientRepositoryImpl();
const notificationRepo = new NotificationRepositoryImpl();
const auditRepo = new AuditRepositoryImpl();

export function isAssessmentComplete(patientRecord: PatientRecord | null): boolean {
  if (!patientRecord) return false;
  
  const sessStatus = patientRecord.assessmentSession?.status;
  if (sessStatus === "SUBMITTED" || sessStatus === "COMPLETED") {
    return true;
  }
  
  if (patientRecord.clinicalJourney?.assessmentSubmitted) {
    return true;
  }
  
  return false;
}

export interface AIAnalysisStageInfo {
  status: "NOT_READY" | "IN_PROGRESS" | "COMPLETED";
  label: string;
  description: string;
  canOpen: boolean;
  completionDate?: string;
  modalAction?: string;
  href?: string;
}

export function getAIAnalysisStage(patientRecord: PatientRecord | null): AIAnalysisStageInfo {
  if (!patientRecord) {
    return {
      status: "NOT_READY",
      label: "AI Analysis",
      description: "Upload breast imaging before AI analysis can begin.",
      canOpen: false
    };
  }

  const reports = patientRecord.reports || [];
  const hasScan = reports.some(r => 
    r.category === "Mammogram" || 
    r.category === "Ultrasound" || 
    r.category === "MRI" || 
    r.type === "mammogram" || 
    r.type === "ultrasound"
  ) || !!patientRecord.clinicalJourney?.reportsUploaded;
  
  const aiStatus = (patientRecord.clinicalJourney?.aiAnalysisStatus || "PENDING") as string;
  
  if (!hasScan) {
    return {
      status: "NOT_READY",
      label: "AI Analysis",
      description: "Upload breast imaging before AI analysis can begin.",
      canOpen: true,
      modalAction: "AI_NOT_READY_EXPLANATION"
    };
  }
  
  if (aiStatus === "COMPLETE" || aiStatus === "COMPLETED") {
    const report = reports.find(r => r.category === "Mammogram" || r.type === "mammogram");
    const completionDate = report?.uploadedAt || report?.date || "";
    return {
      status: "COMPLETED",
      label: "AI Analysis",
      description: "AI result exists.",
      href: "/patient/dashboard?panel=reportViewer",
      completionDate,
      canOpen: true
    };
  }
  
  return {
    status: "IN_PROGRESS",
    label: "AI Analysis",
    description: "AI-assisted analysis is in progress.",
    modalAction: "AI_IN_PROGRESS_STATUS",
    canOpen: true
  };
}

export class PatientService {
  static async initializeStore(): Promise<void> {
    await patientRepo.clearAndSeed();
  }

  static async getPatients(): Promise<PatientRecord[]> {
    const list = await patientRepo.list();
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/mobile/assessments");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.assessments)) {
            for (const mobilePat of data.assessments) {
              const existingIdx = list.findIndex((p) => p.id === mobilePat.id || (mobilePat.email && p.email === mobilePat.email));
              if (existingIdx >= 0) {
                list[existingIdx] = { ...list[existingIdx], ...mobilePat };
              } else {
                list.unshift(mobilePat);
                patientRepo.save(mobilePat).catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not sync remote mobile assessments:", err);
      }
    }
    return list;
  }

  static async getPatient(id: string): Promise<PatientRecord | null> {
    let patient = await patientRepo.get(id);
    if (!patient && typeof window !== "undefined") {
      try {
        const mobileRes = await fetch("/api/mobile/assessments");
        if (mobileRes.ok) {
          const mobileData = await mobileRes.json();
          if (mobileData && Array.isArray(mobileData.assessments)) {
            const found = mobileData.assessments.find((p: any) => p.id === id || p.email === id);
            if (found) {
              patient = found;
              await patientRepo.save(found).catch(() => {});
              return patient;
            }
          }
        }

        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (session && session.user && session.user.id === id && session.user.role === "PATIENT") {
          const user = session.user;
          patient = {
            id: user.id,
            name: user.name || "Jimmy",
            age: 34,
            gender: "Female",
            contactPreference: `Email (${user.email})`,
            dob: "1992-01-01",
            phone: "",
            email: user.email || "",
            address: "",
            preferredLanguage: "English",
            emergencyContact: "",
            emergencyRelationship: "",
            medicalHistory: {
              familyHistory: false,
              previousBreastProcedure: false,
              priorImaging: false,
              recentInjury: false
            },
            reports: [],
            clinicalJourney: {
              assessmentSubmitted: false,
              reportsUploaded: false,
              aiAnalysisStatus: "PENDING",
              radiologyStatus: "PENDING",
              doctorReviewStatus: "AWAITING_REVIEW",
              appointmentStatus: "NOT_SCHEDULED",
              waitingTime: "0 hrs"
            },
            priority: "LOW",
            status: "New Case",
            timeInQueue: "0 hrs"
          };
          await this.updatePatientRecord(patient);
        }
      } catch (e) {
        console.error("Failed to auto-create patient record during getPatient", e);
      }
    }
    return patient;
  }

  static async updatePatientRecord(patient: PatientRecord): Promise<void> {
    await patientRepo.save(patient);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("patient-updated"));
      try {
        const channel = new BroadcastChannel("breastcare-sync");
        channel.postMessage({ type: "patient-updated" });
        channel.close();
      } catch (e) {
        console.error("BroadcastChannel postMessage failed", e);
      }
    }
  }

  static async getReports(patientId: string): Promise<PatientReport[]> {
    return await documentRepo.getReports(patientId);
  }

  static async addReport(patientId: string, report: PatientReport): Promise<void> {
    await documentRepo.addReport(patientId, report);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("reports-updated"));
    }
  }

  static async deleteReport(patientId: string, reportId: string): Promise<void> {
    await documentRepo.deleteReport(patientId, reportId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("reports-updated"));
    }
  }

  static async getNotifications(userId?: string): Promise<DoctorNotification[]> {
    return await notificationRepo.list(userId);
  }

  static async addNotification(notif: Omit<DoctorNotification, "id" | "isRead" | "time">): Promise<void> {
    const newNotif: DoctorNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isRead: false,
      time: "Just now"
    };
    await notificationRepo.add(newNotif);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
  }

  static async markNotificationAsRead(id: string): Promise<void> {
    await notificationRepo.markAsRead(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
  }

  static async markAllNotificationsAsRead(): Promise<void> {
    await notificationRepo.markAllAsRead();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
  }

  static async clearReadNotifications(): Promise<void> {
    await notificationRepo.clearRead();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
  }

  static calculateBmi(weightKg: number, heightCm: number): number {
    if (weightKg <= 0 || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  }

  static classifyBmi(bmiValue: number, age: number): { category: string; description: string } {
    if (age < 20) {
      return {
        category: "Pediatric Reference Required",
        description: "BMI for people under 20 requires an age- and sex-specific growth reference. Please review this with a healthcare professional."
      };
    }

    if (bmiValue < 18.5) {
      return {
        category: "Below healthy range",
        description: "Your BMI is below the healthy range. Consider consulting your doctor regarding nutritional balance."
      };
    } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
      return {
        category: "Healthy range",
        description: "Your BMI is within the healthy range. Keep up the balanced diet and regular physical activity."
      };
    } else if (bmiValue >= 25.0 && bmiValue <= 29.9) {
      return {
        category: "Above healthy range",
        description: "Your BMI is part of general health and lifestyle context. It does not diagnose or predict cancer, but helps guide overall wellness recommendations."
      };
    } else {
      return {
        category: "Obesity range",
        description: "Your BMI is in the obesity range. A healthy lifestyle plan developed with your care team can assist in long-term wellness."
      };
    }
  }

  static async saveWellnessStatus(
    patientId: string,
    entry: Omit<GeneralWellnessStatus, "id" | "patientId" | "recordedAt">
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    const statusRecord: GeneralWellnessStatus = {
      ...entry,
      id: `ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId,
      recordedAt: new Date().toISOString()
    };

    patient.wellnessHistory = patient.wellnessHistory || [];
    patient.wellnessHistory.push(statusRecord);

    // Populate legacy fields for backward compatibility
    if (entry.type === "BMI" && entry.entryMode === "MEASURED" && entry.value !== undefined) {
      let heightCm = 160;
      let weightKg = 72;
      if (entry.note) {
        const hMatch = entry.note.match(/Height:\s*([\d.]+)/i);
        const wMatch = entry.note.match(/Weight:\s*([\d.]+)/i);
        if (hMatch) heightCm = parseFloat(hMatch[1]);
        if (wMatch) weightKg = parseFloat(wMatch[1]);
      }
      const bmiRecord: BmiRecord = {
        heightCm,
        weightKg,
        age: patient.age,
        value: entry.value,
        category: entry.status === "NORMAL" ? "Healthy range" : entry.status === "LOW" ? "Below healthy range" : entry.value >= 30 ? "Obesity range" : "Above healthy range",
        description: entry.note || "",
        lastCalculatedAt: new Date().toLocaleString("en-GB", {
          day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true
        })
      };
      patient.bmi = bmiRecord;
      patient.bmiHistory = patient.bmiHistory || [];
      patient.bmiHistory.push(bmiRecord);
    } else if (entry.type === "BLOOD_PRESSURE" && entry.entryMode === "MEASURED" && entry.value !== undefined && entry.secondaryValue !== undefined) {
      const bpRecord: BloodPressureRecord = {
        id: statusRecord.id,
        patientId,
        systolic: entry.value,
        diastolic: entry.secondaryValue,
        measuredAt: statusRecord.recordedAt,
        measuredBy: entry.source === "PATIENT" || entry.source === "HOME_DEVICE" ? "Patient" : "Clinician",
        source: entry.source === "HOME_DEVICE" ? "HOME" : "CLINIC" as any,
        status: entry.status === "HIGH" ? "HIGH_READING" : entry.status === "LOW" ? "BELOW_USUAL" : "EXPECTED" as any,
        note: entry.note
      };
      patient.bloodPressure = bpRecord;
      patient.bloodPressureHistory = patient.bloodPressureHistory || [];
      patient.bloodPressureHistory.push(bpRecord);
    } else if (entry.type === "BLOOD_GLUCOSE" && entry.entryMode === "MEASURED" && entry.value !== undefined) {
      const bgRecord: BloodGlucoseRecord = {
        id: statusRecord.id,
        patientId,
        testType: (entry.testType as any) || "FASTING",
        value: entry.value,
        unit: (entry.unit as any) || "MG_DL",
        measuredAt: statusRecord.recordedAt,
        measuredBy: entry.source === "PATIENT" || entry.source === "HOME_DEVICE" ? "Patient" : "Clinician",
        source: entry.source === "HOME_DEVICE" ? "HOME" : "CLINIC" as any,
        interpretation: entry.note || "",
        note: entry.note
      };
      patient.bloodGlucose = bgRecord;
      patient.bloodGlucoseHistory = patient.bloodGlucoseHistory || [];
      patient.bloodGlucoseHistory.push(bgRecord);
    }

    await this.updatePatientRecord(patient);

    let displayVal = "";
    if (entry.entryMode === "MEASURED") {
      if (entry.type === "BMI") {
        displayVal = `${entry.value?.toFixed(1)} kg/m²`;
      } else if (entry.type === "BLOOD_PRESSURE") {
        displayVal = `${entry.value}/${entry.secondaryValue} mmHg`;
      } else if (entry.type === "BLOOD_GLUCOSE") {
        displayVal = `${entry.value} ${entry.unit} (${entry.testType})`;
      }
    } else {
      displayVal = `${entry.status} (Self-reported)`;
    }

    await auditRepo.log(
      patientId,
      patient.name,
      entry.source === "PATIENT" ? "PATIENT" : entry.source,
      "WELLNESS_STATUS_RECORD",
      `Wellness status logged: ${entry.type} - ${displayVal}`
    );

    // Notifications
    const isAbnormal = entry.status === "HIGH" || entry.status === "LOW";
    if (isAbnormal) {
      await this.addNotification({
        patientId: patient.id,
        patientName: patient.name,
        title: `Abnormal Wellness Parameter: ${entry.type}`,
        description: `Your ${entry.type.replace("_", " ")} was recorded as ${displayVal}.`,
        category: "Wellness"
      });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("patient-updated"));
      window.dispatchEvent(new CustomEvent("reports-updated"));
    }

    return patient;
  }

  static async savePatientBmi(patientId: string, heightCm: number, weightKg: number, age: number): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    const value = this.calculateBmi(weightKg, heightCm);
    const { category } = this.classifyBmi(value, age);
    
    let status: "LOW" | "NORMAL" | "HIGH" | "UNKNOWN" = "NORMAL";
    if (age < 20) {
      status = "UNKNOWN";
    } else if (category === "Below healthy range") {
      status = "LOW";
    } else if (category === "Above healthy range" || category === "Obesity range") {
      status = "HIGH";
    }

    return this.saveWellnessStatus(patientId, {
      type: "BMI",
      entryMode: "MEASURED",
      status,
      value,
      unit: "kg/m²",
      source: "PATIENT",
      verified: true,
      note: `Height: ${heightCm} cm, Weight: ${weightKg} kg`
    });
  }

  static classifyBloodPressure(
    systolic: number,
    diastolic: number,
    history: BloodPressureRecord[] = []
  ): { status: BloodPressureStatus; label: string; description: string; showCrisisAlert: boolean } {
    const rules = CLINICAL_RULES.bloodPressure;

    if (systolic >= rules.thresholds.emergency.systolic || diastolic >= rules.thresholds.emergency.diastolic) {
      return {
        status: "HIGH_READING",
        label: "Hypertensive Crisis Alert",
        description: rules.copy.crisis,
        showCrisisAlert: true
      };
    }

    if (systolic < rules.thresholds.low.systolic || diastolic < rules.thresholds.low.diastolic) {
      return {
        status: "BELOW_USUAL",
        label: "Below usual range",
        description: rules.copy.lowWarning,
        showCrisisAlert: false
      };
    }

    if (systolic >= rules.thresholds.high.systolic || diastolic >= rules.thresholds.high.diastolic) {
      // Check history for high readings on different dates
      const currentDayStr = new Date().toDateString();
      const otherHighDates = new Set<string>();

      history.forEach(r => {
        const isHigh = r.systolic >= rules.thresholds.high.systolic || r.diastolic >= rules.thresholds.high.diastolic;
        if (isHigh) {
          const recordDayStr = new Date(r.measuredAt).toDateString();
          if (recordDayStr !== currentDayStr) {
            otherHighDates.add(recordDayStr);
          }
        }
      });

      if (otherHighDates.size >= 1) {
        return {
          status: "HIGH_READING",
          label: "Repeated high readings",
          description: "Repeated high readings recorded — please discuss with your care team. A single reading does not establish a diagnosis.",
          showCrisisAlert: false
        };
      } else {
        return {
          status: "HIGH_READING",
          label: "High reading",
          description: "High reading — repeat measurement and clinical review recommended. A single reading does not establish a diagnosis.",
          showCrisisAlert: false
        };
      }
    }

    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 85 && diastolic <= 89)) {
      return {
        status: "ABOVE_USUAL",
        label: "Above usual range",
        description: "This reading is above the usual range. Consider repeat checks at rest.",
        showCrisisAlert: false
      };
    }

    return {
      status: "EXPECTED",
      label: "Within expected range",
      description: "This reading is within the expected range.",
      showCrisisAlert: false
    };
  }

  static classifyBloodGlucose(
    testType: GlucoseTestType,
    value: number,
    unit: GlucoseUnit,
    pregnancyContext = false
  ): { interpretation: string; alertLevel: "NORMAL" | "WARNING" | "CRITICAL"; showHypoAlert: boolean; showHyperAlert: boolean } {
    const rules = CLINICAL_RULES.bloodGlucose;
    
    if (pregnancyContext) {
      return {
        interpretation: rules.copy.pregnancyContext,
        alertLevel: "WARNING",
        showHypoAlert: false,
        showHyperAlert: false
      };
    }

    // Convert to mg/dL for standardized threshold checks
    let valueMGDL = value;
    if (unit === "MMOL_L") {
      valueMGDL = value * 18;
    }

    // Check low glucose safety states (hypoglycemia)
    if (unit !== "PERCENT" && valueMGDL < 55) {
      return {
        interpretation: rules.copy.hypoAlert,
        alertLevel: "CRITICAL",
        showHypoAlert: true,
        showHyperAlert: false
      };
    }

    // Check high glucose safety states (hyperglycemia)
    if (unit !== "PERCENT" && valueMGDL > 300) {
      return {
        interpretation: rules.copy.hyperAlert,
        alertLevel: "CRITICAL",
        showHypoAlert: false,
        showHyperAlert: true
      };
    }

    switch (testType) {
      case "FASTING": {
        if (valueMGDL < rules.thresholds.fasting.expectedMax) {
          return { interpretation: "Within expected fasting range", alertLevel: "NORMAL", showHypoAlert: false, showHyperAlert: false };
        } else if (valueMGDL >= rules.thresholds.fasting.expectedMax && valueMGDL < rules.thresholds.fasting.diabetesMin) {
          return { interpretation: "Above expected fasting range — follow-up testing may be appropriate", alertLevel: "WARNING", showHypoAlert: false, showHyperAlert: false };
        } else {
          return { interpretation: "Diabetes-range fasting result — clinical confirmation required", alertLevel: "WARNING", showHypoAlert: false, showHyperAlert: false };
        }
      }
      case "TWO_HOUR_OGTT": {
        if (valueMGDL < rules.thresholds.twoHourOGTT.expectedMax) {
          return { interpretation: "Within expected two-hour range", alertLevel: "NORMAL", showHypoAlert: false, showHyperAlert: false };
        } else if (valueMGDL >= rules.thresholds.twoHourOGTT.expectedMax && valueMGDL < rules.thresholds.twoHourOGTT.diabetesMin) {
          return { interpretation: "Above expected two-hour range", alertLevel: "WARNING", showHypoAlert: false, showHyperAlert: false };
        } else {
          return { interpretation: "Diabetes-range result — clinical confirmation required", alertLevel: "WARNING", showHypoAlert: false, showHyperAlert: false };
        }
      }
      case "RANDOM": {
        if (valueMGDL >= rules.thresholds.random.diabetesMin) {
          return { interpretation: "High random glucose reading — clinical assessment is recommended.", alertLevel: "WARNING", showHypoAlert: false, showHyperAlert: false };
        } else {
          return { interpretation: "Random reading recorded", alertLevel: "NORMAL", showHypoAlert: false, showHyperAlert: false };
        }
      }
      case "HBA1C": {
        if (value >= rules.thresholds.hba1c.diabetesMin) {
          return { interpretation: "Diabetes-range HbA1c result — clinical confirmation and interpretation required. " + rules.copy.hba1cDisclaimer, alertLevel: "WARNING", showHypoAlert: false, showHyperAlert: false };
        } else {
          return { interpretation: "HbA1c reading recorded. " + rules.copy.hba1cDisclaimer, alertLevel: "NORMAL", showHypoAlert: false, showHyperAlert: false };
        }
      }
      case "HOME_METER": {
        const disclaimer = rules.copy.homeMeterDisclaimer;
        return { interpretation: `Home reading recorded. ${disclaimer}`, alertLevel: "NORMAL", showHypoAlert: false, showHyperAlert: false };
      }
      default:
        return { interpretation: "Reading recorded", alertLevel: "NORMAL", showHypoAlert: false, showHyperAlert: false };
    }
  }

  static async savePatientBloodPressure(
    patientId: string,
    systolic: number,
    diastolic: number,
    pulse?: number,
    position?: "SITTING" | "STANDING" | "LYING",
    note?: string,
    source: "HOME" | "CLINIC" | "NURSE" | "DOCTOR" = "HOME",
    measuredBy: string = "Patient"
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    const history = patient.bloodPressureHistory || [];
    const classification = this.classifyBloodPressure(systolic, diastolic, history);

    let status: "LOW" | "NORMAL" | "HIGH" = "NORMAL";
    if (classification.status === "HIGH_READING") {
      status = "HIGH";
    } else if (classification.status === "BELOW_USUAL") {
      status = "LOW";
    }

    const sourceMap: Record<string, any> = {
      HOME: "HOME_DEVICE",
      CLINIC: "CLINIC",
      NURSE: "NURSE",
      DOCTOR: "DOCTOR"
    };

    return this.saveWellnessStatus(patientId, {
      type: "BLOOD_PRESSURE",
      entryMode: "MEASURED",
      status,
      value: systolic,
      secondaryValue: diastolic,
      unit: "mmHg",
      source: sourceMap[source] || "PATIENT",
      verified: source !== "HOME",
      note: [note, position ? `Position: ${position}` : "", pulse ? `Pulse: ${pulse}` : "", measuredBy ? `Measured by: ${measuredBy}` : ""].filter(Boolean).join(" · ")
    });
  }

  static async savePatientBloodGlucose(
    patientId: string,
    testType: GlucoseTestType,
    value: number,
    unit: GlucoseUnit,
    hoursFasted?: number,
    pregnancyContext?: boolean,
    symptoms?: string[],
    note?: string,
    source: "LAB" | "CLINIC" | "HOME" | "NURSE" | "DOCTOR" = "HOME",
    measuredBy: string = "Patient"
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    const classification = this.classifyBloodGlucose(testType, value, unit, pregnancyContext);

    let status: "LOW" | "NORMAL" | "HIGH" = "NORMAL";
    if (classification.alertLevel === "WARNING" || classification.alertLevel === "CRITICAL") {
      if (classification.interpretation.toLowerCase().includes("high") || classification.interpretation.toLowerCase().includes("diabetes") || classification.showHyperAlert) {
        status = "HIGH";
      } else if (classification.interpretation.toLowerCase().includes("low") || classification.showHypoAlert) {
        status = "LOW";
      }
    }

    const sourceMap: Record<string, any> = {
      HOME: "HOME_DEVICE",
      CLINIC: "CLINIC",
      NURSE: "NURSE",
      DOCTOR: "DOCTOR",
      LAB: "LAB"
    };

    return this.saveWellnessStatus(patientId, {
      type: "BLOOD_GLUCOSE",
      entryMode: "MEASURED",
      status,
      value,
      unit,
      testType,
      source: sourceMap[source] || "PATIENT",
      verified: source !== "HOME",
      note: [note, hoursFasted ? `Fasted: ${hoursFasted}h` : "", pregnancyContext ? "Pregnancy Context" : "", symptoms?.length ? `Symptoms: ${symptoms.join(",")}` : "", measuredBy ? `Measured by: ${measuredBy}` : ""].filter(Boolean).join(" · ")
    });
  }

  static async startQuestionnaireSession(patientId: string): Promise<QuestionnaireSession> {
    const patient = await this.getPatient(patientId);
    if (patient && patient.assessmentSession && patient.assessmentSession.status === "IN_PROGRESS") {
      return patient.assessmentSession;
    }

    const session: QuestionnaireSession = {
      id: `session-${Date.now()}`,
      patientId,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      answers: [],
      priorityFlags: []
    };

    if (patient) {
      patient.assessmentSession = session;
      await this.updatePatientRecord(patient);
      await auditRepo.log(patientId, patient.name, "PATIENT", "ASSESSMENT_STARTED", "Guided assessment questionnaire started");
    }

    return session;
  }

  static async saveQuestionnaireProgress(patientId: string, answers: QuestionnaireAnswer[], priorityFlags: ClinicalPriorityFlag[]): Promise<void> {
    const patient = await this.getPatient(patientId);
    if (patient && patient.assessmentSession) {
      patient.assessmentSession.answers = answers;
      patient.assessmentSession.priorityFlags = priorityFlags;
      await this.updatePatientRecord(patient);
    }
  }

  static generatePriorityFlags(answers: QuestionnaireAnswer[]): ClinicalPriorityFlag[] {
    const flags: ClinicalPriorityFlag[] = [];

    const hasAnswer = (id: string, searchVal: string | boolean) => {
      const ans = answers.find(a => a.questionId === id);
      if (!ans) return false;
      if (Array.isArray(ans.value)) {
        return ans.value.some(v => String(v).toLowerCase().includes(String(searchVal).toLowerCase()));
      }
      return String(ans.value).toLowerCase() === String(searchVal).toLowerCase();
    };

    if (hasAnswer("discharge_type", "bloody") || hasAnswer("bloody_discharge", "bloody")) {
      flags.push({
        type: "BLOODY_DISCHARGE",
        severity: "CRITICAL",
        message: "Bloody nipple discharge reported (needs prompt evaluation)."
      });
    }

    if (hasAnswer("swelling_progression", "yes") || hasAnswer("rapid_swelling", "yes")) {
      flags.push({
        type: "RAPID_SWELLING",
        severity: "CRITICAL",
        message: "Rapidly increasing swelling reported."
      });
    }

    if (hasAnswer("redness_fever", "yes") || hasAnswer("fever_redness", "yes")) {
      flags.push({
        type: "FEVER_REDNESS",
        severity: "CRITICAL",
        message: "Severe redness with fever reported (possible acute inflammation/infection)."
      });
    }

    if (hasAnswer("lump_persistence", "yes") || hasAnswer("persistent_lump", "yes")) {
      flags.push({
        type: "NEW_PERSISTENT_LUMP",
        severity: "HIGH",
        message: "Newly noticed persistent lump reported."
      });
    }

    if (hasAnswer("pain_severity", "severe") || hasAnswer("severity", "severe")) {
      flags.push({
        type: "SEVERE_PAIN",
        severity: "HIGH",
        message: "Severe or worsening pain reported."
      });
    }

    if (hasAnswer("acutely_unwell", "yes") || hasAnswer("feel_unwell", "yes")) {
      flags.push({
        type: "ACUTELY_UNWELL",
        severity: "HIGH",
        message: "Patient reports feeling acutely unwell."
      });
    }

    return flags;
  }

  static async submitQuestionnaire(
    patientId: string,
    answers: QuestionnaireAnswer[],
    note?: string,
    assessmentMode?: "CHATBOT" | "MANUAL"
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    if (!patient.assessmentSession) {
      patient.assessmentSession = {
        id: `sess-${Date.now()}`,
        patientId,
        status: "IN_PROGRESS",
        startedAt: new Date().toISOString(),
        answers: [],
        priorityFlags: []
      };
    }

    const getVal = (id: string): any => answers.find(a => a.questionId === id)?.value;
    
    // Convert answers to a clean Yes/No dictionary for clinical risk analysis
    const answersDict: Record<string, "Yes" | "No"> = {};
    answers.forEach(a => {
      if (a.value === "Yes" || a.value === "yes" || a.value === true) {
        answersDict[a.questionId] = "Yes";
      } else if (a.value === "No" || a.value === "no" || a.value === false) {
        answersDict[a.questionId] = "No";
      }
    });

    // Extract Risk Profile from answers
    const riskProfile: RiskProfileData = {
      age: String(getVal("risk_profile_age") || patient.age || ""),
      ageAtMarriage: String(getVal("risk_profile_marriage") || ""),
      ageAtFirstChild: String(getVal("risk_profile_first_child") || ""),
      numberOfChildren: String(getVal("risk_profile_children") || ""),
      breastfeeding: String(getVal("risk_profile_breastfeeding") || ""),
      contraceptives: String(getVal("risk_profile_contraceptives") || ""),
      familyHistory: String(getVal("risk_profile_family_history") || ""),
      smoking: String(getVal("risk_profile_smoking") || ""),
      diet: String(getVal("risk_profile_diet") || "")
    };

    // Calculate phased clinical risk analysis
    const riskAnalysis = calculateClinicalRiskAnalysis(riskProfile, answersDict);

    // Build structured phased questions & responses for clinical documentation
    const allCategories = getQuestions();
    const phase0Items: { label: string; value: string }[] = [
      { label: "Patient Age / Group", value: riskProfile.age || "Not specified" },
      { label: "Age at Marriage", value: riskProfile.ageAtMarriage || "Not specified / NA" },
      { label: "Age at First Childbirth", value: riskProfile.ageAtFirstChild || "Not specified" },
      { label: "Number of Children", value: riskProfile.numberOfChildren || "0" },
      { label: "Breastfeeding History", value: riskProfile.breastfeeding || "Not specified" },
      { label: "Hormonal Contraceptive Use", value: riskProfile.contraceptives || "None reported" },
      { label: "Family History of Breast/Ovarian Cancer", value: riskProfile.familyHistory || "No family history reported" },
      { label: "Smoking Status", value: riskProfile.smoking || "Never smoked" },
      { label: "General Diet & Nutrition", value: riskProfile.diet || "Standard diet" }
    ];

    const phase1Items: { symptom: string; response: string; relevance?: string; weight?: number }[] = [];
    const phase2Items: { symptom: string; response: string; relevance?: string; weight?: number }[] = [];
    const phase3Items: { symptom: string; response: string; relevance?: string; weight?: number }[] = [];

    allCategories.forEach(cat => {
      const phase = cat.phase || (cat.category.includes("Breast") ? 1 : cat.category.includes("Neck") || cat.category.includes("Arm") ? 2 : 3);
      cat.options.forEach(opt => {
        const isYes = answersDict[opt.converted_name] === "Yes" || answers.some(a => a.questionId.toLowerCase() === opt.converted_name.toLowerCase() && (a.value === "Yes" || a.value === "yes" || a.value === true));
        const item = {
          symptom: opt.label,
          response: isYes ? "Yes" : "No",
          relevance: opt.relevance || "M",
          weight: opt.weight || 2
        };
        if (phase === 1) phase1Items.push(item);
        else if (phase === 2) phase2Items.push(item);
        else phase3Items.push(item);
      });
    });

    // Check affected side
    const hasLeftBreast = phase1Items.some(i => i.symptom.includes("Left") && i.response === "Yes");
    const hasRightBreast = phase1Items.some(i => i.symptom.includes("Right") && i.response === "Yes");
    let affectedSide: "LEFT" | "RIGHT" | "BOTH" | "NONE" = "NONE";
    if (hasLeftBreast && hasRightBreast) affectedSide = "BOTH";
    else if (hasLeftBreast) affectedSide = "LEFT";
    else if (hasRightBreast) affectedSide = "RIGHT";
    else {
      const explicitSide = getVal("breast_side") || getVal("side_selection");
      if (explicitSide === "left") affectedSide = "LEFT";
      else if (explicitSide === "right") affectedSide = "RIGHT";
      else if (explicitSide === "both") affectedSide = "BOTH";
    }

    // Collect all positive symptoms
    const positiveSymptoms: string[] = [];
    [...phase1Items, ...phase2Items, ...phase3Items].forEach(item => {
      if (item.response === "Yes") {
        positiveSymptoms.push(item.symptom);
      }
    });

    const priorityFlags = this.generatePriorityFlags(answers);
    const careGuidance = calculateCareGuidance(answers);

    let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (
      riskAnalysis.tier === "Urgent" || 
      riskAnalysis.tier === "High" || 
      priorityFlags.some(f => f.severity === "CRITICAL" || f.severity === "HIGH") || 
      careGuidance.level === "HIGH"
    ) {
      priority = "HIGH";
    } else if (
      riskAnalysis.tier === "Moderate" || 
      priorityFlags.some(f => f.severity === "MEDIUM") || 
      careGuidance.level === "MEDIUM" || 
      positiveSymptoms.length > 0 ||
      answers.some(a => (a.questionId === "symptom_presence" || a.questionId === "pain_presence" || a.questionId === "symptom_types") && (a.value === "yes" || (Array.isArray(a.value) && a.value.length > 0)))
    ) {
      priority = "MEDIUM";
    }

    const historyVal = getVal("history_summary") || getVal("history_check") || [];

    const summary: QuestionnaireSummary = {
      affectedSide,
      symptoms: positiveSymptoms.length > 0 ? positiveSymptoms : Array.isArray(getVal("current_concern")) ? getVal("current_concern") : [],
      duration: getVal("duration") || getVal("pain_duration") || getVal("lump_duration"),
      progression: getVal("progression") || getVal("lump_progression"),
      familyHistory: (riskProfile.familyHistory && !riskProfile.familyHistory.toLowerCase().includes("no")) || (Array.isArray(historyVal) ? historyVal.some((v: string) => v.includes("family")) : false),
      previousBreastProcedure: Array.isArray(historyVal) ? historyVal.some((v: string) => v.includes("procedure") || v.includes("surgery")) : false,
      priorImaging: Array.isArray(historyVal) ? historyVal.some((v: string) => v.includes("imaging") || v.includes("mammogram")) : false,
      patientNote: note || getVal("patient_note") || "",
      careGuidanceLevel: riskAnalysis.tier === "Urgent" ? "URGENT" : (careGuidance.level || (riskAnalysis.tier === "High" ? "HIGH" : riskAnalysis.tier === "Moderate" ? "MEDIUM" : "LOW")),
      guidanceReasons: riskAnalysis.override.triggered 
        ? [riskAnalysis.override.reason || "Safety escalation triggered"] 
        : careGuidance.reasons,
      selectedSymptomKeys: careGuidance.selectedSymptomKeys,
      version: "3.0-phased-oncology-triage",
      assessmentMode: assessmentMode || "CHATBOT",
      riskProfile,
      riskAnalysis: {
        totalScore: riskAnalysis.totalScore,
        tier: riskAnalysis.tier,
        brmScore: riskAnalysis.brm.score,
        symptomScore: riskAnalysis.symptomScoring.totalSymptomScore,
        overrideTriggered: riskAnalysis.override.ruleName,
        overrideReason: riskAnalysis.override.reason,
        interpretation: riskAnalysis.interpretation,
        recommendation: riskAnalysis.recommendation,
        phase1Weighted: riskAnalysis.symptomScoring.phase1Weighted,
        phase2Weighted: riskAnalysis.symptomScoring.phase2Weighted,
        phase3Weighted: riskAnalysis.symptomScoring.phase3Weighted,
        phase2Multiplier: riskAnalysis.symptomScoring.phase2Multiplier,
        phase3Multiplier: riskAnalysis.symptomScoring.phase3Multiplier
      },
      phasedAnswers: {
        phase0: phase0Items,
        phase1: phase1Items,
        phase2: phase2Items,
        phase3: phase3Items
      }
    };

    const session = patient.assessmentSession!;
    session.status = "SUBMITTED";
    session.completedAt = new Date().toISOString();
    session.answers = answers;
    session.summary = summary;
    session.priorityFlags = priorityFlags;
    session.careGuidanceLevel = summary.careGuidanceLevel;
    session.guidanceReasons = summary.guidanceReasons;
    session.selectedSymptomKeys = careGuidance.selectedSymptomKeys;

    patient.priority = priority;
    patient.status = "Awaiting Review";
    patient.clinicalJourney = {
      assessmentSubmitted: true,
      reportsUploaded: patient.clinicalJourney?.reportsUploaded ?? false,
      aiAnalysisStatus: patient.clinicalJourney?.aiAnalysisStatus ?? "PENDING",
      radiologyStatus: patient.clinicalJourney?.radiologyStatus ?? "PENDING",
      doctorReviewStatus: "AWAITING_REVIEW",
      appointmentStatus: patient.clinicalJourney?.appointmentStatus ?? "NOT_SCHEDULED",
      waitingTime: patient.clinicalJourney?.waitingTime ?? "0 hrs"
    };

    patient.medicalHistory = {
      ...patient.medicalHistory,
      familyHistory: summary.familyHistory || patient.medicalHistory?.familyHistory,
      previousBreastProcedure: summary.previousBreastProcedure || patient.medicalHistory?.previousBreastProcedure,
      priorImaging: summary.priorImaging || patient.medicalHistory?.priorImaging,
      recentInjury: Array.isArray(historyVal) ? historyVal.some((v: string) => v.includes("injury")) : false
    };

    await this.updatePatientRecord(patient);
    await auditRepo.log(patientId, patient.name, "PATIENT", "ASSESSMENT_SUBMITTED", "Guided assessment questionnaire submitted");

    const priorityText = priority === "HIGH" ? "🚨 HIGH PRIORITY" : "New";
    await this.addNotification({
      patientId: patient.id,
      patientName: patient.name,
      title: `${priorityText} Assessment Submitted`,
      description: `${patient.name} submitted a guided assessment. Symptoms: ${summary.symptoms.join(", ") || "None reported"}.`,
      category: "Clinical Updates"
    });

    return patient;
  }

  static async registerPatient(
    name: string,
    age: number,
    dob: string,
    phone: string,
    email: string,
    address: string,
    preferredLanguage: string,
    preferredContactMethod: string,
    emergencyContact: string,
    emergencyRelationship: string,
    hospitalName: string
  ): Promise<PatientRecord> {
    const list = await this.getPatients();
    
    let newId = "";
    do {
      newId = `BC-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (list.some(p => p.id === newId));

    const patient: PatientRecord = {
      id: newId,
      name,
      age,
      gender: "Female",
      dob,
      phone,
      email,
      address,
      preferredLanguage,
      contactPreference: `${preferredContactMethod} (${phone || email})`,
      emergencyContact,
      emergencyRelationship,
      hospitalName,
      status: "Awaiting Intake",
      priority: "LOW",
      timeInQueue: "0 hours",
      bmiHistory: [],
      clinicalJourney: {
        assessmentSubmitted: false,
        reportsUploaded: false,
        aiAnalysisStatus: "PENDING",
        radiologyStatus: "PENDING",
        doctorReviewStatus: "AWAITING_REVIEW",
        appointmentStatus: "NOT_SCHEDULED",
        waitingTime: "0 hours"
      },
      reports: []
    };

    await this.updatePatientRecord(patient);
    await auditRepo.log(newId, name, "NURSE", "PATIENT_REGISTERED", `Patient ${name} registered in hospital ${hospitalName}`);
    return patient;
  }

  static async saveIntakeDraft(
    patientId: string,
    answers: Record<string, any>,
    consent?: ConsentRecord,
    uploadedDocuments?: UploadedClinicalDocument[],
    nurseId?: string,
    nurseName?: string
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    patient.clinicalIntake = {
      patientId,
      nurseId,
      nurseName,
      status: "DRAFT",
      source: "NURSE",
      answers: { ...patient.clinicalIntake?.answers, ...answers },
      consent: consent || patient.clinicalIntake?.consent,
      uploadedDocuments: uploadedDocuments || patient.clinicalIntake?.uploadedDocuments || [],
      revisions: patient.clinicalIntake?.revisions || []
    };

    patient.status = "Draft Intake";
    
    await this.updatePatientRecord(patient);
    return patient;
  }

  static async submitIntake(
    patientId: string,
    answers: Record<string, any>,
    consent?: ConsentRecord,
    uploadedDocuments?: UploadedClinicalDocument[],
    nurseId?: string,
    nurseName?: string
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    patient.clinicalIntake = {
      patientId,
      nurseId,
      nurseName,
      status: "SUBMITTED",
      source: "NURSE",
      submittedAt: new Date().toISOString(),
      answers: { ...patient.clinicalIntake?.answers, ...answers },
      consent: consent || patient.clinicalIntake?.consent,
      uploadedDocuments: uploadedDocuments || patient.clinicalIntake?.uploadedDocuments || [],
      revisions: patient.clinicalIntake?.revisions || []
    };

    const height = parseFloat(answers.heightCm);
    const weight = parseFloat(answers.weightKg);
    const age = parseInt(answers.age || patient.age);
    if (height > 0 && weight > 0) {
      const bmiVal = this.calculateBmi(weight, height);
      const bmiClass = this.classifyBmi(bmiVal, age);
      const bmiRecord = {
        heightCm: height,
        weightKg: weight,
        age,
        value: bmiVal,
        category: bmiClass.category,
        description: bmiClass.description,
        lastCalculatedAt: new Date().toLocaleString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
      };
      patient.bmi = bmiRecord;
      patient.bmiHistory = patient.bmiHistory || [];
      patient.bmiHistory.push(bmiRecord);
    }

    const qAnswers: QuestionnaireAnswer[] = Object.entries(answers).map(([key, val]) => ({
      questionId: key,
      value: val,
      label: String(val),
      answeredAt: new Date().toISOString()
    }));

    const chatAnswers = patient.assessmentSession?.answers || [];
    const combinedAnswers = [...chatAnswers, ...qAnswers];
    const priorityFlags = this.generatePriorityFlags(combinedAnswers);

    let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    if (priorityFlags.some(f => f.severity === "CRITICAL" || f.severity === "HIGH")) {
      priority = "HIGH";
    } else if (priorityFlags.some(f => f.severity === "MEDIUM") || answers.symptom_experience === "yes" || answers.concern_presence === "yes") {
      priority = "MEDIUM";
    }

    patient.medicalHistory = {
      ...patient.medicalHistory,
      familyHistory: answers.family_history_present === "yes" || answers.breast_cancer_family === "yes",
      previousBreastProcedure: answers.previous_breast_surgery === "yes" || answers.previous_biopsy === "yes",
      recentInjury: answers.recent_injury === "yes"
    };

    if (uploadedDocuments) {
      uploadedDocuments.forEach(doc => {
        const typeMapping: Record<string, "mammogram" | "ultrasound" | "lab" | "clinical_note"> = {
          mammogram: "mammogram",
          ultrasound: "ultrasound",
          mri: "mammogram",
          pathology: "lab",
          consultation: "clinical_note"
        };
        const exists = patient.reports?.some(r => r.title === doc.name);
        if (!exists) {
          patient.reports = patient.reports || [];
          const catMapping: Record<string, any> = {
            mammogram: "Mammogram",
            ultrasound: "Ultrasound",
            mri: "MRI",
            pathology: "Pathology",
            consultation: "Clinical Assessment"
          };
          patient.reports.push({
            id: `rep-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            patientId: patient.id,
            title: doc.name,
            category: catMapping[doc.type] || "Other",
            uploadedAt: doc.date,
            validationStatus: "Uploaded",
            source: "Nurse Portal",
            downloadable: true,
            shareable: true,
            date: doc.date,
            status: "Uploaded",
            type: typeMapping[doc.type] || "clinical_note"
          });
        }
      });
    }

    patient.priority = priority;
    patient.status = "Awaiting Review";
    patient.clinicalJourney = {
      assessmentSubmitted: true,
      reportsUploaded: (uploadedDocuments && uploadedDocuments.length > 0) || (patient.reports && patient.reports.length > 0) ? true : false,
      aiAnalysisStatus: patient.clinicalJourney?.aiAnalysisStatus ?? "PENDING",
      radiologyStatus: patient.clinicalJourney?.radiologyStatus ?? "PENDING",
      doctorReviewStatus: "AWAITING_REVIEW",
      appointmentStatus: patient.clinicalJourney?.appointmentStatus ?? "NOT_SCHEDULED",
      waitingTime: patient.clinicalJourney?.waitingTime ?? "0 hours"
    };

    await this.updatePatientRecord(patient);
    await auditRepo.log(nurseId || "nurse", nurseName || "Nurse", "BREAST_CARE_NURSE", "INTAKE_SUBMITTED", `Intake submitted for patient ${patient.name}`);

    const priorityText = priority === "HIGH" ? "🚨 HIGH PRIORITY" : "New";
    await this.addNotification({
      patientId: patient.id,
      patientName: patient.name,
      title: `${priorityText} Nurse Intake Submitted`,
      description: `Nurse ${nurseName || "staff"} submitted intake for ${patient.name}. Symptoms: ${answers.main_concern || "None"}.`,
      category: "Clinical Updates"
    });

    return patient;
  }

  static async requestClarification(patientId: string, notes: string): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    if (patient.clinicalIntake) {
      patient.clinicalIntake.status = "NEEDS_CLARIFICATION";
      patient.clinicalIntake.clarificationNotes = notes;
    } else {
      patient.clinicalIntake = {
        patientId,
        status: "NEEDS_CLARIFICATION",
        source: "NURSE",
        clarificationNotes: notes,
        answers: {}
      };
    }

    patient.status = "Needs Clarification";
    await this.updatePatientRecord(patient);
    await auditRepo.log(patientId, patient.name, "DOCTOR", "CLARIFICATION_REQUESTED", `Clarification requested with notes: "${notes}"`);

    await this.addNotification({
      patientId: patient.id,
      patientName: patient.name,
      title: `Clarification Requested: ${patient.name}`,
      description: `Doctor requested updates: "${notes}"`,
      category: "Doctor Review"
    });

    return patient;
  }

  static async addIntakeRevision(
    patientId: string,
    section: string,
    previousValue: string,
    newValue: string,
    editedBy: string
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient || !patient.clinicalIntake) return null;

    patient.clinicalIntake.revisions = patient.clinicalIntake.revisions || [];
    patient.clinicalIntake.revisions.push({
      revisionId: `rev-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      editedBy,
      timestamp: new Date().toISOString(),
      sectionEdited: section,
      previousValue,
      newValue
    });

    await this.updatePatientRecord(patient);
    return patient;
  }

  static deriveDiagnosticJourney(patientRecord: PatientRecord | null) {
    const defaultJourney = {
      steps: [
        { id: "profile", label: "Profile", status: "NOT_READY" as const, subtitle: "Register Profile", completed: false, date: "", description: "Register Profile" },
        { id: "assessment", label: "Assessment", status: "NOT_READY" as const, subtitle: "Risk screening", completed: false, date: "", description: "Risk screening" },
        { id: "scan_upload", label: "Scan Upload", status: "NOT_READY" as const, subtitle: "Breast imaging upload", completed: false, date: "", description: "Breast imaging upload" },
        { id: "ai_analysis", label: "AI Analysis", status: "NOT_READY" as const, subtitle: "DeepLearning CAD", completed: false, date: "", description: "DeepLearning CAD" },
        { id: "doctor_review", label: "Doctor Review", status: "NOT_READY" as const, subtitle: "Specialist sign-off", completed: false, date: "", description: "Specialist sign-off" },
        { id: "appointment", label: "Appointment", status: "NOT_READY" as const, subtitle: "Oncology consult", completed: false, date: "", description: "Oncology consult" },
        { id: "care_plan", label: "Care Plan", status: "NOT_READY" as const, subtitle: "Recovery plan active", completed: false, date: "", description: "Recovery plan active" }
      ],
      currentStepIndex: 0,
      journeyProgress: 0,
      headerText: "Step 1 of 7 · Complete Registration"
    };

    if (!patientRecord) return defaultJourney;

    const journey = patientRecord.clinicalJourney || {
      assessmentSubmitted: false,
      reportsUploaded: false,
      aiAnalysisStatus: "PENDING",
      radiologyStatus: "PENDING",
      doctorReviewStatus: "AWAITING_REVIEW",
      appointmentStatus: "NOT_SCHEDULED"
    };

    const isProfileCompleted = !!(patientRecord.name && patientRecord.dob && patientRecord.phone);
    const isAssessmentCompleted = isAssessmentComplete(patientRecord);
    
    const reports = patientRecord.reports || [];
    const isScanUploadCompleted = !!(journey.reportsUploaded || reports.some(r => 
      r.category === "Mammogram" || 
      r.category === "Ultrasound" || 
      r.category === "MRI" || 
      r.type === "mammogram" || 
      r.type === "ultrasound"
    ));
    
    const aiInfo = getAIAnalysisStage(patientRecord);
    const isAiCompleted = aiInfo.status === "COMPLETED";
    
    const drStatus = journey.doctorReviewStatus as string;
    const isDocReviewCompleted = !!(
      drStatus === "REVIEWED" || 
      drStatus === "VALIDATED" || 
      drStatus === "COMPLETED"
    );
    
    const isAppointmentCompleted = !!(journey.appointmentStatus === "COMPLETED");
    const isCarePlanCompleted = !!(journey.carePlanStatus === "COMPLETED");

    const completedMap: Record<string, boolean> = {
      "Profile": isProfileCompleted,
      "Assessment": isAssessmentCompleted,
      "Scan Upload": isScanUploadCompleted,
      "AI Analysis": isAiCompleted,
      "Doctor Review": isDocReviewCompleted,
      "Appointment": isAppointmentCompleted,
      "Care Plan": isCarePlanCompleted
    };

    const order = ["Profile", "Assessment", "Scan Upload", "AI Analysis", "Doctor Review", "Appointment", "Care Plan"];
    const firstIncompleteIdx = order.findIndex(label => !completedMap[label]);

    const dateMap: Record<string, string> = {
      "Profile": patientRecord.dob ? "Verified" : "",
      "Assessment": patientRecord.assessmentSession?.completedAt 
        ? new Date(patientRecord.assessmentSession.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) 
        : "",
      "Scan Upload": reports.length > 0 
        ? reports[0].uploadedAt || reports[0].date || "" 
        : "",
      "AI Analysis": aiInfo.completionDate || "",
      "Doctor Review": isDocReviewCompleted ? "Signed Off" : "",
      "Appointment": isAppointmentCompleted ? "Completed" : "",
      "Care Plan": ""
    };

    const steps = order.map((label, idx) => {
      let status: "COMPLETED" | "CURRENT" | "UPCOMING" | "NOT_READY" = "NOT_READY";
      if (completedMap[label]) {
        status = "COMPLETED";
      } else if (idx === firstIncompleteIdx) {
        status = "CURRENT";
      } else {
        // Special upcoming case for Appointment
        if (label === "Appointment" && (journey.appointmentStatus === "SCHEDULED" || journey.appointmentStatus === "REQUESTED" || journey.appointmentStatus === "CONFIRMED" || journey.appointmentStatus === "RESCHEDULED")) {
          status = "UPCOMING";
        } else {
          const precedingComplete = order.slice(0, idx).every(l => completedMap[l]);
          status = precedingComplete ? "UPCOMING" : "NOT_READY";
        }
      }

      const subtitles: Record<string, string> = {
        "Profile": "Register Profile",
        "Assessment": "Risk screening",
        "Scan Upload": "Breast imaging upload",
        "AI Analysis": "DeepLearning CAD",
        "Doctor Review": "Specialist sign-off",
        "Appointment": "Oncology consult",
        "Care Plan": "Recovery plan active"
      };

      const ids: Record<string, string> = {
        "Profile": "profile",
        "Assessment": "assessment",
        "Scan Upload": "scan_upload",
        "AI Analysis": "ai_analysis",
        "Doctor Review": "doctor_review",
        "Appointment": "appointment",
        "Care Plan": "care_plan"
      };

      const actions: Record<string, any> = {
        "Profile": { type: "MODAL", target: "profileDetails" },
        "Assessment": { type: "MODAL", target: "newAssessment" },
        "Scan Upload": { type: "MODAL", target: "uploadReport" },
        "AI Analysis": aiInfo.status === "COMPLETED" 
          ? { type: "ROUTE", target: "/patient/dashboard?panel=reportViewer" } 
          : { type: "MODAL", target: "aiAnalysis" },
        "Doctor Review": { type: "MODAL", target: "trackReview" },
        "Appointment": { type: "MODAL", target: "bookAppointment" },
        "Care Plan": { type: "ROUTE", target: "/patient/dashboard?panel=exercisePlan" }
      };

      return {
        id: ids[label],
        label,
        status,
        subtitle: subtitles[label],
        completed: completedMap[label],
        date: dateMap[label] || "",
        description: subtitles[label],
        action: actions[label]
      };
    });

    const currentStepIndex = firstIncompleteIdx === -1 ? 6 : firstIncompleteIdx;
    const completedCount = steps.filter(s => s.completed).length;
    const journeyProgress = Math.round((completedCount / steps.length) * 100);

    const headerTexts: Record<string, string> = {
      "Profile": "Step 1 of 7 · Complete Registration",
      "Assessment": "Step 2 of 7 · Risk Assessment Needed",
      "Scan Upload": "Step 3 of 7 · Upload Breast Imaging",
      "AI Analysis": aiInfo.status === "IN_PROGRESS" ? "Step 4 of 7 · AI Analysis In Progress" : "Step 4 of 7 · AI Analysis Processing",
      "Doctor Review": "Step 5 of 7 · Specialist Review Pending",
      "Appointment": "Step 6 of 7 · Consultation Booking",
      "Care Plan": "Journey Complete · Care Plan Active"
    };

    const activeStepLabel = order[currentStepIndex] || "Profile";
    const headerText = headerTexts[activeStepLabel] || "Journey Complete · Care Plan Active";

    return {
      steps,
      currentStepIndex,
      journeyProgress,
      headerText
    };
  }

  // Care Plan Actions
  static async getCarePlan(patientId: string): Promise<CarePlanItem[]> {
    let list = await carePlanRepo.list(patientId);
    if (list.length === 0) {
      const defaults: CarePlanItem[] = [
        {
          id: `cp-${patientId}-hydration`,
          patientId,
          title: "2L Hydration Goal (1.2L Consumed)",
          timeOfDay: "All Day",
          frequency: "DAILY",
          type: "HYDRATION",
          targetValue: 6,
          unit: "glasses",
          source: "NURSE",
          assignedClinician: "Breast Care Nurse",
          status: "ACTIVE"
        },
        {
          id: `cp-${patientId}-yoga`,
          patientId,
          title: "15 Min Light Yoga Exercise",
          timeOfDay: "06:00 PM",
          frequency: "DAILY",
          type: "ACTIVITY",
          targetValue: 15,
          unit: "minutes",
          source: "CARE_TEAM",
          assignedClinician: "Dr. Sarah Iyer",
          status: "ACTIVE"
        },
        {
          id: `cp-${patientId}-meds`,
          patientId,
          title: "Morning Supplements",
          timeOfDay: "08:30 AM",
          frequency: "DAILY",
          type: "MEDICATION",
          targetValue: 1,
          unit: "dose",
          source: "CARE_TEAM",
          assignedClinician: "Dr. Sarah Iyer",
          status: "ACTIVE"
        }
      ];
      await carePlanRepo.saveAll(defaults);
      list = defaults;
    }
    return list;
  }

  static async saveCarePlanItem(item: CarePlanItem): Promise<void> {
    await carePlanRepo.save(item);
  }

  // Wellness Goals
  static async getWellnessGoals(patientId: string): Promise<WellnessGoal[]> {
    const list = await wellnessGoalRepo.list(patientId);
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    const todayGoals = list.filter(g => g.date === todayStr);
    if (todayGoals.length > 0) {
      return todayGoals;
    }

    // Seed new daily entries for today
    const seededGoals = await this.generateDefaultWellnessGoals(patientId, todayStr);
    await wellnessGoalRepo.saveAll(seededGoals);
    return seededGoals;
  }

  static async generateDefaultWellnessGoals(patientId: string, date: string): Promise<WellnessGoal[]> {
    const nowIso = new Date().toISOString();
    
    // Fetch active Care Plan items to derive matching goals
    const carePlan = await this.getCarePlan(patientId);
    
    const derivedGoals: WellnessGoal[] = carePlan.map((cp) => {
      let trackingMethod: "COUNTER" | "DURATION" | "CHECKLIST" | "BOOLEAN" | "MANUAL_ENTRY" = "COUNTER";
      if (cp.type === "ACTIVITY" || cp.type === "SLEEP") {
        trackingMethod = "DURATION";
      } else if (cp.type === "MEDICATION") {
        trackingMethod = "BOOLEAN";
      }
      return {
        id: `goal-${patientId}-${date}-${cp.type.toLowerCase()}`,
        patientId,
        type: cp.type,
        title: cp.title,
        targetValue: cp.targetValue || 1,
        currentValue: 0,
        unit: cp.unit || "",
        source: cp.source === "CARE_TEAM" ? "CARE_TEAM" : cp.source === "NURSE" ? "NURSE" : "SYSTEM_SUGGESTED",
        createdBy: cp.assignedClinician || "Care Team",
        createdAt: nowIso,
        date,
        status: "ACTIVE",
        trackingMethod,
        editableByPatient: true,
        note: cp.notes || ""
      };
    });

    // Also append any core personal or system suggested goals if not already derived
    const hasHydration = derivedGoals.some(g => g.type === "HYDRATION");
    if (!hasHydration) {
      derivedGoals.push({
        id: `goal-${patientId}-${date}-hydration`,
        patientId,
        type: "HYDRATION",
        title: "Daily Hydration Goal",
        targetValue: 6,
        currentValue: 0,
        unit: "glasses",
        source: "SYSTEM_SUGGESTED",
        createdBy: "System Recommendation",
        createdAt: nowIso,
        date,
        status: "ACTIVE",
        trackingMethod: "COUNTER",
        editableByPatient: true,
        note: "Hydration helps support cell recovery and clear system toxins."
      });
    }

    const hasSleep = derivedGoals.some(g => g.type === "SLEEP");
    if (!hasSleep) {
      derivedGoals.push({
        id: `goal-${patientId}-${date}-sleep`,
        patientId,
        type: "SLEEP",
        title: "Adequate Rest",
        targetValue: 7.5,
        currentValue: 0,
        unit: "hours",
        source: "SYSTEM_SUGGESTED",
        createdBy: "System Recommendation",
        createdAt: nowIso,
        date,
        status: "ACTIVE",
        trackingMethod: "DURATION",
        editableByPatient: true,
        note: "Aim for 7-8 hours of sound sleep to promote immune balance."
      });
    }

    const hasNutrition = derivedGoals.some(g => g.type === "NUTRITION");
    if (!hasNutrition) {
      derivedGoals.push({
        id: `goal-${patientId}-${date}-nutrition`,
        patientId,
        type: "NUTRITION",
        title: "Balanced Nutritional Meals",
        targetValue: 3,
        currentValue: 0,
        unit: "meals",
        source: "PATIENT",
        createdBy: "Self",
        createdAt: nowIso,
        date,
        status: "ACTIVE",
        trackingMethod: "COUNTER",
        editableByPatient: true,
        note: "Logged protein and organic greens inclusion."
      });
    }

    return derivedGoals;
  }

  static async saveWellnessGoal(goal: WellnessGoal): Promise<void> {
    await wellnessGoalRepo.save(goal);
    // Sync back to Care Plan if this goal is associated with a Care Plan item
    await this.syncGoalToCarePlan(goal);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("wellness-goals-updated"));
    }
  }

  static async logGoalProgress(patientId: string, goalId: string, increment: number, valueOverride?: number): Promise<void> {
    const list = await wellnessGoalRepo.list(patientId);
    const goal = list.find(g => g.id === goalId);
    if (goal) {
      if (valueOverride !== undefined) {
        goal.currentValue = valueOverride;
      } else {
        goal.currentValue = Math.max(0, (goal.currentValue || 0) + increment);
      }
      const target = goal.targetValue || 1;
      goal.status = goal.currentValue >= target ? "COMPLETED" : "ACTIVE";
      goal.completedAt = goal.status === "COMPLETED" ? new Date().toISOString() : undefined;
      await wellnessGoalRepo.save(goal);
      
      // Sync back to Care Plan
      await this.syncGoalToCarePlan(goal);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wellness-goals-updated"));
      }
    }
  }

  static async syncGoalToCarePlan(goal: WellnessGoal): Promise<void> {
    const carePlan = await this.getCarePlan(goal.patientId);
    // Find Care Plan item by matching type or matching title
    const cpItem = carePlan.find(cp => cp.type === goal.type || cp.title === goal.title);
    if (cpItem) {
      const isCompleted = goal.status === "COMPLETED";
      cpItem.status = isCompleted ? "COMPLETED" : "ACTIVE";
      cpItem.completedAt = goal.completedAt;
      await carePlanRepo.save(cpItem);

      // Audit log on completion
      if (isCompleted) {
        const patient = await this.getPatient(goal.patientId);
        await auditRepo.log(
          goal.patientId,
          patient?.name || "Patient",
          "PATIENT",
          "CARE_PLAN_TASK_COMPLETED",
          `Completed daily Care Plan action: "${cpItem.title}"`
        );
      }
    }
  }

  // ─── Self-Reported Wellness Status (Hypertension / Diabetes) ──────────────
  // Records are appended to history — never overwritten.
  // source is always "PATIENT_SELF_REPORTED" and verified is never set true.

  static async saveSelfReportedStatus(
    patientId: string,
    entry: Omit<SelfReportedWellnessStatus, "id" | "recordedAt" | "updatedAt">
  ): Promise<PatientRecord | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    const now = new Date().toISOString();
    const record: SelfReportedWellnessStatus = {
      ...entry,
      id: `sr-${entry.type.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId,
      recordedAt: now,
      updatedAt: now
    };

    if (entry.type === "HYPERTENSION") {
      patient.hypertensionHistory = patient.hypertensionHistory || [];
      patient.hypertensionHistory.push(record);
    } else if (entry.type === "DIABETES") {
      patient.diabetesHistory = patient.diabetesHistory || [];
      patient.diabetesHistory.push(record);
    }

    await patientRepo.save(patient);
    return patient;
  }

  static async getLatestSelfReportedStatus(
    patientId: string,
    type: "HYPERTENSION" | "DIABETES"
  ): Promise<SelfReportedWellnessStatus | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) return null;

    const history = type === "HYPERTENSION"
      ? patient.hypertensionHistory
      : patient.diabetesHistory;

    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  }

  static async getSelfReportedHistory(
    patientId: string,
    type: "HYPERTENSION" | "DIABETES"
  ): Promise<SelfReportedWellnessStatus[]> {
    const patient = await this.getPatient(patientId);
    if (!patient) return [];

    const history = type === "HYPERTENSION"
      ? patient.hypertensionHistory
      : patient.diabetesHistory;

    return history || [];
  }
}
