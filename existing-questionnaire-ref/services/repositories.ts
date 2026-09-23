import type { 
  PatientRecord, 
  DoctorNotification, 
  BmiRecord, 
  ClinicalIntake, 
  QuestionnaireSession, 
  UploadedClinicalDocument,
  WellnessGoal,
  PatientReport,
  BloodPressureRecord,
  BloodGlucoseRecord,
  CarePlanItem
} from "../types/questionnaire";
import type { User } from "../types";

// ─── REPOSITORY INTERFACE CONTRACTS ─────────────────────────────────────────

export interface AuthRepository {
  getCurrentUser(): Promise<User | null>;
  setCurrentUser(user: User | null): Promise<void>;
}

export interface PatientRepository {
  get(id: string): Promise<PatientRecord | null>;
  list(): Promise<PatientRecord[]>;
  save(record: PatientRecord): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface QuestionnaireRepository {
  saveSession(patientId: string, session: QuestionnaireSession): Promise<void>;
  getSession(patientId: string): Promise<QuestionnaireSession | null>;
}

export interface ClinicalIntakeRepository {
  saveIntake(patientId: string, intake: ClinicalIntake): Promise<void>;
  getIntake(patientId: string): Promise<ClinicalIntake | null>;
}

export interface MeasurementRepository {
  addMeasurement(patientId: string, record: BmiRecord): Promise<void>;
  getHistory(patientId: string): Promise<BmiRecord[]>;
  addBloodPressure(patientId: string, record: BloodPressureRecord): Promise<void>;
  getBloodPressureHistory(patientId: string): Promise<BloodPressureRecord[]>;
  addBloodGlucose(patientId: string, record: BloodGlucoseRecord): Promise<void>;
  getBloodGlucoseHistory(patientId: string): Promise<BloodGlucoseRecord[]>;
}

export interface DocumentRepository {
  addDocument(patientId: string, doc: UploadedClinicalDocument): Promise<void>;
  getDocuments(patientId: string): Promise<UploadedClinicalDocument[]>;
  deleteDocument(patientId: string, docId: string): Promise<void>;
  addReport(patientId: string, report: PatientReport): Promise<void>;
  getReports(patientId: string): Promise<PatientReport[]>;
  deleteReport(patientId: string, reportId: string): Promise<void>;
}

export interface WellnessGoalRepository {
  list(patientId: string): Promise<WellnessGoal[]>;
  save(goal: WellnessGoal): Promise<void>;
  saveAll(goals: WellnessGoal[]): Promise<void>;
  delete(goalId: string): Promise<void>;
}

export interface CarePlanRepository {
  list(patientId: string): Promise<CarePlanItem[]>;
  save(item: CarePlanItem): Promise<void>;
  saveAll(items: CarePlanItem[]): Promise<void>;
  delete(itemId: string): Promise<void>;
}

export interface NotificationRepository {
  list(userId?: string): Promise<DoctorNotification[]>;
  add(notification: DoctorNotification): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  clearRead(): Promise<void>;
}

export interface AuditRepository {
  log(userId: string, userName: string, role: string, action: string, detail: string): Promise<void>;
  list(): Promise<any[]>;
}

// ─── INDEXEDDB STORAGE ENGINE ADAPTER ────────────────────────────────────────

class IndexedDBHelper {
  private db: IDBDatabase | null = null;
  private isFallback = typeof globalThis.indexedDB === "undefined";
  private fallbackStore: Record<string, Record<string, any>> = {
    patients: {},
    notifications: {},
    audit_logs: {},
    session: {},
    wellness_goals: {},
    care_plans: {}
  };

  async init(): Promise<any> {
    if (this.isFallback) {
      this.seedIfNeededFallback();
      return {};
    }

    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("breastcare_ai_db", 3);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("patients")) {
          db.createObjectStore("patients", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("notifications")) {
          db.createObjectStore("notifications", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("audit_logs")) {
          db.createObjectStore("audit_logs", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("session")) {
          db.createObjectStore("session", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("wellness_goals")) {
          db.createObjectStore("wellness_goals", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("care_plans")) {
          db.createObjectStore("care_plans", { keyPath: "id" });
        }
      };

      request.onsuccess = async () => {
        this.db = request.result;
        try {
          await this.seedIfNeededIndexedDB();
          resolve(this.db);
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private getInitialPatients(): PatientRecord[] {
    return [
      {
        id: "demo-patient",
        name: "Meera Sharma",
        age: 46,
        gender: "Female",
        contactPreference: "WhatsApp (+91 98765-43210)",
        hospitalName: "IIT Indore Main Campus Hospital",
        dob: "1980-04-12",
        phone: "+91 98765-43210",
        email: "patient@demo.breastcare.ai",
        address: "12, Clinical Residency Campus, IIT Indore, MP",
        preferredLanguage: "Hindi",
        emergencyContact: "+91 99999-11111",
        emergencyRelationship: "Spouse",
        bmi: {
          heightCm: 160,
          weightKg: 72,
          age: 46,
          value: 28.1,
          category: "Above healthy range",
          description: "Your BMI is part of general health and lifestyle context. It does not diagnose or predict cancer, but helps guide overall wellness recommendations.",
          lastCalculatedAt: "15 July 2026, 10:00 AM"
        },
        bmiHistory: [
          {
            heightCm: 160,
            weightKg: 72,
            age: 46,
            value: 28.1,
            category: "Above healthy range",
            description: "Your BMI is part of general health and lifestyle context.",
            lastCalculatedAt: "15 July 2026, 10:00 AM"
          }
        ],
        medicalHistory: {
          familyHistory: true,
          previousBreastProcedure: true,
          previousConditions: ["Benign Breast Cyst (left side, 2022)"],
          medications: ["Calcium supplements", "Vitamin D3 daily"],
          reproductiveHistory: "2 pregnancies, breastfed both children (total 18 months)",
          priorImaging: true,
          recentInjury: false
        },
        reports: [
          {
            id: "rep-1",
            patientId: "demo-patient",
            title: "AI Diagnostic Mammography Screening",
            category: "Mammogram",
            uploadedAt: "15 July 2026",
            validationStatus: "Validated",
            source: "AI Engine v2.4",
            downloadable: true,
            shareable: true,
            date: "15 July 2026",
            status: "Validated",
            type: "mammogram"
          },
          {
            id: "rep-2",
            patientId: "demo-patient",
            title: "Clinical Baseline Assessment",
            category: "Clinical Assessment",
            uploadedAt: "14 July 2026",
            validationStatus: "Validated",
            source: "Nurse Intake",
            downloadable: true,
            shareable: false,
            date: "14 July 2026",
            status: "Validated",
            type: "clinical_note"
          },
          {
            id: "rep-3",
            patientId: "demo-patient",
            title: "General Physical Report",
            category: "General Physical",
            uploadedAt: "10 June 2026",
            validationStatus: "Validated",
            source: "IIT Indore Clinic",
            downloadable: true,
            shareable: true,
            date: "10 June 2026",
            status: "Validated",
            type: "lab"
          }
        ],
        clinicalJourney: {
          assessmentSubmitted: false,
          reportsUploaded: true,
          aiAnalysisStatus: "COMPLETE",
          radiologyStatus: "COMPLETE",
          doctorReviewStatus: "IN_QUEUE",
          appointmentStatus: "SCHEDULED",
          waitingTime: "2 hours"
        },
        priority: "HIGH",
        status: "Awaiting Review",
        timeInQueue: "2 hours"
      },
      {
        id: "BC-9041",
        name: "Sunita Patel",
        age: 52,
        gender: "Female",
        contactPreference: "SMS (+91 98765-01234)",
        hospitalName: "IIT Indore Main Campus Hospital",
        dob: "1974-11-22",
        phone: "+91 98765-01234",
        email: "sunita@email.com",
        address: "Sector C, Vijay Nagar, Indore",
        preferredLanguage: "Hindi",
        emergencyContact: "+91 98765-55555",
        emergencyRelationship: "Son",
        bmi: {
          heightCm: 155,
          weightKg: 68,
          age: 52,
          value: 28.3,
          category: "Above healthy range",
          description: "Your BMI is one general wellness indicator. It should be considered alongside medical history, lifestyle and clinical evaluation.",
          lastCalculatedAt: "14 July 2026, 11:30 AM"
        },
        bmiHistory: [
          {
            heightCm: 155,
            weightKg: 68,
            age: 52,
            value: 28.3,
            category: "Above healthy range",
            description: "Your BMI is one general wellness indicator.",
            lastCalculatedAt: "14 July 2026, 11:30 AM"
          }
        ],
        medicalHistory: {
          familyHistory: false,
          previousBreastProcedure: true,
          previousConditions: ["Fibroadenoma excision (right side, 2018)"],
          medications: ["Amlodipine 5mg daily"],
          reproductiveHistory: "1 pregnancy, breastfed for 6 months",
          priorImaging: true,
          recentInjury: false
        },
        reports: [
          {
            id: "rep-4",
            patientId: "BC-9041",
            title: "AI screening completed, awaiting validation",
            category: "Mammogram",
            uploadedAt: "14 July 2026",
            validationStatus: "Awaiting Review",
            source: "AI Engine v2.4",
            downloadable: true,
            shareable: true,
            date: "14 July 2026",
            status: "Awaiting Review",
            type: "mammogram"
          }
        ],
        clinicalIntake: {
          patientId: "BC-9041",
          status: "SUBMITTED",
          source: "NURSE",
          submittedAt: "14 July 2026",
          answers: {
            heightCm: 155,
            weightKg: 68,
            affectedSide: "RIGHT",
            main_concern: ["lump"],
            duration: "1_to_4_weeks",
            progression: "unchanged",
            diabetes: "no",
            hypertension: "yes",
            thyroid: "no"
          }
        },
        clinicalJourney: {
          assessmentSubmitted: true,
          reportsUploaded: true,
          aiAnalysisStatus: "COMPLETE",
          radiologyStatus: "PENDING",
          doctorReviewStatus: "AWAITING_REVIEW",
          appointmentStatus: "NOT_SCHEDULED",
          waitingTime: "4 hours"
        },
        priority: "MEDIUM",
        status: "Awaiting Review",
        timeInQueue: "4 hours"
      },
      {
        id: "BC-7812",
        name: "Anita Gupta",
        age: 39,
        gender: "Female",
        contactPreference: "Email (anita.gupta@email.com)",
        hospitalName: "IIT Indore Main Campus Hospital",
        dob: "1987-08-30",
        phone: "+91 99111-22222",
        email: "anita.gupta@email.com",
        address: "Phadnis Colony, Indore",
        preferredLanguage: "English",
        emergencyContact: "+91 99111-33333",
        emergencyRelationship: "Mother",
        bmi: {
          heightCm: 162,
          weightKg: 55,
          age: 39,
          value: 21.0,
          category: "Healthy range",
          description: "Your BMI is within the healthy range. Maintain balanced nutrition and active lifestyle.",
          lastCalculatedAt: "12 July 2026, 09:15 AM"
        },
        bmiHistory: [
          {
            heightCm: 162,
            weightKg: 55,
            age: 39,
            value: 21.0,
            category: "Healthy range",
            description: "Your BMI is within the healthy range.",
            lastCalculatedAt: "12 July 2026, 09:15 AM"
          }
        ],
        medicalHistory: {
          familyHistory: false,
          previousBreastProcedure: false,
          medications: ["Thyroxine 50mcg daily"],
          reproductiveHistory: "Nulliparous (no pregnancies)",
          priorImaging: false,
          recentInjury: true
        },
        reports: [
          {
            id: "rep-5",
            patientId: "BC-7812",
            title: "General Physical Checkup Notes",
            category: "General Physical",
            uploadedAt: "10 July 2026",
            validationStatus: "Validated",
            source: "IIT Indore Clinic",
            downloadable: true,
            shareable: true,
            date: "10 July 2026",
            status: "Validated",
            type: "clinical_note"
          }
        ],
        clinicalJourney: {
          assessmentSubmitted: true,
          reportsUploaded: false,
          aiAnalysisStatus: "PENDING",
          radiologyStatus: "PENDING",
          doctorReviewStatus: "AWAITING_REVIEW",
          appointmentStatus: "NOT_SCHEDULED",
          waitingTime: "1 day"
        },
        priority: "LOW",
        status: "Awaiting Review",
        timeInQueue: "1 day"
      }
    ];
  }

  private getInitialNotifications(): DoctorNotification[] {
    return [
      {
        id: "notif-1",
        patientId: "demo-patient",
        patientName: "Meera Sharma",
        title: "AI Analysis Complete",
        description: "AI Diagnostic Mammography Screening has been compiled with 98.2% confidence.",
        category: "Reports",
        time: "2 hours ago",
        isRead: false
      },
      {
        id: "notif-2",
        patientId: "BC-9041",
        patientName: "Sunita Patel",
        title: "New Questionnaire Submitted",
        description: "Intake assessment submitted. Patient reports moderate right-side pain.",
        category: "Clinical Updates",
        time: "4 hours ago",
        isRead: false
      },
      {
        id: "notif-3",
        patientId: "BC-7812",
        patientName: "Anita Gupta",
        title: "Report Uploaded",
        description: "General Physical Checkup Notes uploaded for review.",
        category: "Reports",
        time: "1 day ago",
        isRead: true
      }
    ];
  }

  private seedIfNeededFallback(): void {
    if (Object.keys(this.fallbackStore.patients).length === 0) {
      const initialPatients = this.getInitialPatients();
      for (const p of initialPatients) {
        this.fallbackStore.patients[p.id] = p;
      }
      const initialNotifs = this.getInitialNotifications();
      for (const n of initialNotifs) {
        this.fallbackStore.notifications[n.id] = n;
      }
    }
  }

  private async seedIfNeededIndexedDB(): Promise<void> {
    const db = this.db!;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("patients", "readonly");
      const store = transaction.objectStore("patients");
      const countReq = store.count();

      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          const writeTx = db.transaction(["patients", "notifications"], "readwrite");
          
          const patientStore = writeTx.objectStore("patients");
          const initialPatients = this.getInitialPatients();
          for (const p of initialPatients) {
            patientStore.put(p);
          }

          const notifStore = writeTx.objectStore("notifications");
          const initialNotifs = this.getInitialNotifications();
          for (const n of initialNotifs) {
            notifStore.put(n);
          }

          writeTx.oncomplete = () => resolve();
          writeTx.onerror = () => reject(writeTx.error);
        } else {
          resolve();
        }
      };

      countReq.onerror = () => {
        reject(countReq.error);
      };
    });
  }

  async get(storeName: string, key: string): Promise<any> {
    if (this.isFallback) {
      this.seedIfNeededFallback();
      return this.fallbackStore[storeName]?.[key] || null;
    }
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName: string, value: any): Promise<void> {
    if (this.isFallback) {
      this.seedIfNeededFallback();
      const key = storeName === "session" ? value.key : value.id;
      if (!this.fallbackStore[storeName]) this.fallbackStore[storeName] = {};
      this.fallbackStore[storeName][key] = value;
      return;
    }
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (this.isFallback) {
      this.seedIfNeededFallback();
      return Object.values(this.fallbackStore[storeName] || {});
    }
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (this.isFallback) {
      this.seedIfNeededFallback();
      if (this.fallbackStore[storeName]) {
        delete this.fallbackStore[storeName][key];
      }
      return;
    }
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearStore(storeName: string): Promise<void> {
    if (this.isFallback) {
      this.fallbackStore[storeName] = {};
      return;
    }
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

const dbHelper = new IndexedDBHelper();

// ─── IMPLEMENTATIONS OF REPOSITORY INTERFACES ────────────────────────────────

export class AuthRepositoryImpl implements AuthRepository {
  async getCurrentUser(): Promise<User | null> {
    const sess = await dbHelper.get("session", "current_user");
    return sess ? sess.user : null;
  }

  async setCurrentUser(user: User | null): Promise<void> {
    if (user) {
      await dbHelper.put("session", { key: "current_user", user });
    } else {
      await dbHelper.delete("session", "current_user");
    }
  }
}

export class PatientRepositoryImpl implements PatientRepository {
  async get(id: string): Promise<PatientRecord | null> {
    return await dbHelper.get("patients", id);
  }

  async list(): Promise<PatientRecord[]> {
    return await dbHelper.getAll("patients");
  }

  async save(record: PatientRecord): Promise<void> {
    await dbHelper.put("patients", record);
  }

  async delete(id: string): Promise<void> {
    await dbHelper.delete("patients", id);
  }

  async clearAndSeed(): Promise<void> {
    await dbHelper.clearStore("patients");
    await dbHelper.clearStore("notifications");
    await dbHelper.clearStore("audit_logs");
    await dbHelper.clearStore("session");
    await dbHelper.init();
  }
}

export class QuestionnaireRepositoryImpl implements QuestionnaireRepository {
  private patientRepo = new PatientRepositoryImpl();

  async saveSession(patientId: string, session: QuestionnaireSession): Promise<void> {
    const record = await this.patientRepo.get(patientId);
    if (record) {
      record.assessmentSession = session;
      await this.patientRepo.save(record);
    }
  }

  async getSession(patientId: string): Promise<QuestionnaireSession | null> {
    const record = await this.patientRepo.get(patientId);
    return record?.assessmentSession || null;
  }
}

export class ClinicalIntakeRepositoryImpl implements ClinicalIntakeRepository {
  private patientRepo = new PatientRepositoryImpl();

  async saveIntake(patientId: string, intake: ClinicalIntake): Promise<void> {
    const record = await this.patientRepo.get(patientId);
    if (record) {
      record.clinicalIntake = intake;
      await this.patientRepo.save(record);
    }
  }

  async getIntake(patientId: string): Promise<ClinicalIntake | null> {
    const record = await this.patientRepo.get(patientId);
    return record?.clinicalIntake || null;
  }
}

export class MeasurementRepositoryImpl implements MeasurementRepository {
  private patientRepo = new PatientRepositoryImpl();

  async addMeasurement(patientId: string, record: BmiRecord): Promise<void> {
    const patient = await this.patientRepo.get(patientId);
    if (patient) {
      patient.bmi = record;
      patient.bmiHistory = patient.bmiHistory || [];
      patient.bmiHistory.push(record);
      await this.patientRepo.save(patient);
    }
  }

  async getHistory(patientId: string): Promise<BmiRecord[]> {
    const patient = await this.patientRepo.get(patientId);
    return patient?.bmiHistory || [];
  }

  async addBloodPressure(patientId: string, record: BloodPressureRecord): Promise<void> {
    const patient = await this.patientRepo.get(patientId);
    if (patient) {
      patient.bloodPressure = record;
      patient.bloodPressureHistory = patient.bloodPressureHistory || [];
      const index = patient.bloodPressureHistory.findIndex(r => r.id === record.id);
      if (index > -1) {
        patient.bloodPressureHistory[index] = record;
      } else {
        patient.bloodPressureHistory.push(record);
      }
      await this.patientRepo.save(patient);
    }
  }

  async getBloodPressureHistory(patientId: string): Promise<BloodPressureRecord[]> {
    const patient = await this.patientRepo.get(patientId);
    return patient?.bloodPressureHistory || [];
  }

  async addBloodGlucose(patientId: string, record: BloodGlucoseRecord): Promise<void> {
    const patient = await this.patientRepo.get(patientId);
    if (patient) {
      patient.bloodGlucose = record;
      patient.bloodGlucoseHistory = patient.bloodGlucoseHistory || [];
      const index = patient.bloodGlucoseHistory.findIndex(r => r.id === record.id);
      if (index > -1) {
        patient.bloodGlucoseHistory[index] = record;
      } else {
        patient.bloodGlucoseHistory.push(record);
      }
      await this.patientRepo.save(patient);
    }
  }

  async getBloodGlucoseHistory(patientId: string): Promise<BloodGlucoseRecord[]> {
    const patient = await this.patientRepo.get(patientId);
    return patient?.bloodGlucoseHistory || [];
  }
}

export class DocumentRepositoryImpl implements DocumentRepository {
  private patientRepo = new PatientRepositoryImpl();

  async addDocument(patientId: string, doc: UploadedClinicalDocument): Promise<void> {
    const patient = await this.patientRepo.get(patientId);
    if (patient) {
      patient.uploadedDocuments = patient.uploadedDocuments || [];
      patient.uploadedDocuments = [
        ...patient.uploadedDocuments.filter(d => d.id !== doc.id),
        doc
      ];
      await this.patientRepo.save(patient);
    }
  }

  async getDocuments(patientId: string): Promise<UploadedClinicalDocument[]> {
    const patient = await this.patientRepo.get(patientId);
    return patient?.uploadedDocuments || [];
  }

  async deleteDocument(patientId: string, docId: string): Promise<void> {
    const patient = await this.patientRepo.get(patientId);
    if (patient && patient.uploadedDocuments) {
      patient.uploadedDocuments = patient.uploadedDocuments.filter(d => d.id !== docId);
      await this.patientRepo.save(patient);
    }
  }

  async addReport(patientId: string, report: PatientReport): Promise<void> {
    const patient = await this.patientRepo.get(patientId);
    if (patient) {
      patient.reports = patient.reports || [];
      patient.reports = [
        ...patient.reports.filter(r => r.id !== report.id),
        report
      ];
      await this.patientRepo.save(patient);
    }
  }

  async getReports(patientId: string): Promise<PatientReport[]> {
    const patient = await this.patientRepo.get(patientId);
    return patient?.reports || [];
  }

  async deleteReport(patientId: string, reportId: string): Promise<void> {
    const patient = await this.patientRepo.get(patientId);
    if (patient && patient.reports) {
      patient.reports = patient.reports.filter(r => r.id !== reportId);
      await this.patientRepo.save(patient);
    }
  }
}

export const documentRepo = new DocumentRepositoryImpl();

export class NotificationRepositoryImpl implements NotificationRepository {
  async list(userId?: string): Promise<DoctorNotification[]> {
    const all = await dbHelper.getAll("notifications");
    if (userId) {
      return all.filter(n => n.patientId === userId || !n.patientId);
    }
    return all;
  }

  async add(notification: DoctorNotification): Promise<void> {
    await dbHelper.put("notifications", notification);
  }

  async markAsRead(id: string): Promise<void> {
    const notif = await dbHelper.get("notifications", id);
    if (notif) {
      notif.isRead = true;
      await dbHelper.put("notifications", notif);
    }
  }

  async markAllAsRead(): Promise<void> {
    const all = await dbHelper.getAll("notifications");
    for (const notif of all) {
      notif.isRead = true;
      await dbHelper.put("notifications", notif);
    }
  }

  async clearRead(): Promise<void> {
    const all = await dbHelper.getAll("notifications");
    for (const notif of all) {
      if (notif.isRead) {
        await dbHelper.delete("notifications", notif.id);
      }
    }
  }
}

export class AuditRepositoryImpl implements AuditRepository {
  async log(userId: string, userName: string, role: string, action: string, detail: string): Promise<void> {
    const event = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      role,
      action,
      detail
    };
    await dbHelper.put("audit_logs", event);
  }

  async list(): Promise<any[]> {
    const all = await dbHelper.getAll("audit_logs");
    return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

export class WellnessGoalRepositoryImpl implements WellnessGoalRepository {
  async list(patientId: string): Promise<WellnessGoal[]> {
    const all = await dbHelper.getAll("wellness_goals");
    return all.filter((g: any) => g.patientId === patientId);
  }

  async save(goal: WellnessGoal): Promise<void> {
    await dbHelper.put("wellness_goals", goal);
  }

  async saveAll(goals: WellnessGoal[]): Promise<void> {
    for (const g of goals) {
      await dbHelper.put("wellness_goals", g);
    }
  }

  async delete(goalId: string): Promise<void> {
    await dbHelper.delete("wellness_goals", goalId);
  }
}

export class CarePlanRepositoryImpl implements CarePlanRepository {
  async list(patientId: string): Promise<CarePlanItem[]> {
    const all = await dbHelper.getAll("care_plans");
    return all.filter((cp: any) => cp.patientId === patientId);
  }

  async save(item: CarePlanItem): Promise<void> {
    await dbHelper.put("care_plans", item);
  }

  async saveAll(items: CarePlanItem[]): Promise<void> {
    for (const item of items) {
      await dbHelper.put("care_plans", item);
    }
  }

  async delete(itemId: string): Promise<void> {
    await dbHelper.delete("care_plans", itemId);
  }
}

export const wellnessGoalRepo = new WellnessGoalRepositoryImpl();
export const carePlanRepo = new CarePlanRepositoryImpl();
