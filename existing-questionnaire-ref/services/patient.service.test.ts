import { describe, it, expect, beforeEach } from "vitest";
import { PatientService } from "./patient.service";
import type { QuestionnaireAnswer, PatientRecord } from "../types/questionnaire";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock
});

describe("PatientService - Clinical Calculator & Priority Engine", () => {
  beforeEach(async () => {
    localStorage.clear();
    // Reinitialize state in service
    await PatientService.initializeStore();
  });

  describe("BMI Calculation & Categorization", () => {
    it("should calculate correct BMI for a healthy adult", () => {
      // Weight 55kg, Height 160cm => BMI = 55 / 1.6^2 = 21.48 -> rounded to 21.5
      const val = PatientService.calculateBmi(55, 160);
      const res = PatientService.classifyBmi(val, 30);
      expect(val).toBe(21.5);
      expect(res.category).toBe("Healthy range");
      expect(res.description).toContain("healthy range");
    });

    it("should classify underweight adult correctly (< 18.5)", () => {
      const val = PatientService.calculateBmi(45, 160); // BMI = 17.6
      const res = PatientService.classifyBmi(val, 30);
      expect(val).toBe(17.6);
      expect(res.category).toBe("Below healthy range");
    });

    it("should classify overweight adult correctly (25 - 29.9)", () => {
      const val = PatientService.calculateBmi(70, 160); // BMI = 27.3
      const res = PatientService.classifyBmi(val, 35);
      expect(val).toBe(27.3);
      expect(res.category).toBe("Above healthy range");
    });

    it("should classify obese adult correctly (>= 30)", () => {
      const val = PatientService.calculateBmi(85, 160); // BMI = 33.2
      const res = PatientService.classifyBmi(val, 40);
      expect(val).toBe(33.2);
      expect(res.category).toBe("Obesity range");
    });

    it("should bypass WHO classification for adolescents under 20", () => {
      const val = PatientService.calculateBmi(55, 160); // BMI = 21.5
      const res = PatientService.classifyBmi(val, 18);
      expect(val).toBe(21.5);
      expect(res.category).toBe("Pediatric Reference Required");
      expect(res.description).toContain("growth reference");
    });
  });

  describe("Symptom & Safety Priority Flags", () => {
    it("should trigger HIGH priority and critical safety warning when bloody discharge is reported", async () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: "pain_presence", value: "yes", label: "Yes", answeredAt: "" },
        { questionId: "side_selection", value: "left", label: "Left", answeredAt: "" },
        { questionId: "symptom_types", value: ["discharge"], label: "Discharge", answeredAt: "" },
        { questionId: "discharge_type", value: "bloody", label: "Bloody", answeredAt: "" }
      ];

      // Initialize session
      await PatientService.startQuestionnaireSession("demo-patient");
      
      const record = await PatientService.getPatient("demo-patient");
      expect(record).toBeDefined();

      await PatientService.submitQuestionnaire("demo-patient", answers, "Testing bloody discharge alert");
      
      const updated = (await PatientService.getPatient("demo-patient"))!;
      expect(updated.priority).toBe("HIGH");
      expect(updated.assessmentSession?.priorityFlags).toBeDefined();
      expect(updated.assessmentSession?.priorityFlags.length).toBeGreaterThan(0);
      
      const hasBloodyFlag = updated.assessmentSession?.priorityFlags.some(f => 
        f.message.toLowerCase().includes("bloody") || f.message.toLowerCase().includes("discharge")
      );
      expect(hasBloodyFlag).toBe(true);
    });

    it("should trigger HIGH priority when new persistent lump is reported", async () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: "pain_presence", value: "no", label: "No", answeredAt: "" },
        { questionId: "side_selection", value: "right", label: "Right", answeredAt: "" },
        { questionId: "symptom_types", value: ["lump"], label: "Lump", answeredAt: "" },
        { questionId: "lump_persistence", value: "yes", label: "Yes, persistent", answeredAt: "" }
      ];

      // Initialize session
      await PatientService.startQuestionnaireSession("demo-patient");

      await PatientService.submitQuestionnaire("demo-patient", answers, "Persistent lump check");
      
      const updated = (await PatientService.getPatient("demo-patient"))!;
      expect(updated.priority).toBe("HIGH");
      
      const hasLumpFlag = updated.assessmentSession?.priorityFlags.some(f => 
        f.message.toLowerCase().includes("persistent lump")
      );
      expect(hasLumpFlag).toBe(true);
    });

    it("should trigger MEDIUM priority when mild symptoms are present without critical flags", async () => {
      const answers: QuestionnaireAnswer[] = [
        { questionId: "pain_presence", value: "yes", label: "Yes", answeredAt: "" },
        { questionId: "side_selection", value: "both", label: "Both", answeredAt: "" },
        { questionId: "symptom_types", value: ["persistent_pain"], label: "Pain", answeredAt: "" },
        { questionId: "pain_severity", value: "mild_moderate", label: "Mild/Moderate", answeredAt: "" }
      ];

      // Initialize session
      await PatientService.startQuestionnaireSession("demo-patient");

      await PatientService.submitQuestionnaire("demo-patient", answers, "Mild pain review");
      
      const updated = (await PatientService.getPatient("demo-patient"))!;
      expect(updated.priority).toBe("MEDIUM");
    });
  });

  describe("Repository Persistence & Local Storage Integration", () => {
    it("should load preloaded patients by default", async () => {
      const list = await PatientService.getPatients();
      expect(list.length).toBeGreaterThan(0);
      expect(list.some(p => p.id === "demo-patient")).toBe(true);
    });

    it("should save and reload changes to patient records in local storage", async () => {
      const patient = (await PatientService.getPatient("demo-patient"))!;
      patient.name = "Meera S. Sharma";
      await PatientService.updatePatientRecord(patient);

      const reloaded = (await PatientService.getPatient("demo-patient"))!;
      expect(reloaded.name).toBe("Meera S. Sharma");
    });

    it("should store doctor notifications and mark them read", async () => {
      // Add notification
      await PatientService.addNotification({
        patientId: "demo-patient",
        patientName: "Meera Sharma",
        title: "Test Alert",
        description: "Intake completed",
        category: "Clinical Updates"
      });

      const notifs = await PatientService.getNotifications();
      expect(notifs.length).toBeGreaterThan(0);
      
      const active = notifs[0];
      expect(active.isRead).toBe(false);

      await PatientService.markNotificationAsRead(active.id);
      
      const reloadedNotifs = await PatientService.getNotifications();
      expect(reloadedNotifs.find(n => n.id === active.id)?.isRead).toBe(true);
    });
  });

  describe("Clinical Nurse Intake Operations", () => {
    it("should register a new patient with valid ID and default journey status", async () => {
      const reg = await PatientService.registerPatient(
        "Kirti Sen",
        45,
        "1981-05-10",
        "+91 99999-88888",
        "kirti@email.com",
        "Indore, MP",
        "Hindi",
        "SMS",
        "+91 99999-99999",
        "Spouse",
        "IIT Indore Main Campus Hospital"
      );

      expect(reg.id).toBeDefined();
      expect(reg.id.startsWith("BC-")).toBe(true);
      expect(reg.name).toBe("Kirti Sen");
      expect(reg.status).toBe("Awaiting Intake");
      expect(reg.clinicalJourney?.assessmentSubmitted).toBe(false);

      const reloaded = await PatientService.getPatient(reg.id);
      expect(reloaded).not.toBeNull();
      expect(reloaded?.name).toBe("Kirti Sen");
    });

    it("should save and update clinical intake draft records successfully", async () => {
      const p = await PatientService.registerPatient(
        "Kirti Sen", 45, "1981-05-10", "+91 99999-88888", "kirti@email.com", "Indore, MP", "Hindi", "SMS", "+91 99999-99999", "Spouse", "IIT Indore Main Campus Hospital"
      );

      const answers = { heightCm: "165", weightKg: "60", weightNote: "Stable weight" };
      await PatientService.saveIntakeDraft(p.id, answers, undefined, undefined, "demo-nurse", "Sister Lakshmi");

      const updated = (await PatientService.getPatient(p.id))!;
      expect(updated.status).toBe("Draft Intake");
      expect(updated.clinicalIntake?.status).toBe("DRAFT");
      expect(updated.clinicalIntake?.answers?.weightNote).toBe("Stable weight");
    });

    it("should calculate BMI, priority flags, and submit clinical intake to Doctor review", async () => {
      const p = await PatientService.registerPatient(
        "Kirti Sen", 45, "1981-05-10", "+91 99999-88888", "kirti@email.com", "Indore, MP", "Hindi", "SMS", "+91 99999-99999", "Spouse", "IIT Indore Main Campus Hospital"
      );

      const answers = {
        heightCm: "165",
        weightKg: "90", // BMI = 90 / 1.65^2 = 90 / 2.7225 = 33.05 (Obesity)
        age: 45,
        discharge_type: "bloody", // triggers critical priority flag
        main_concern: ["discharge"]
      };

      await PatientService.submitIntake(p.id, answers, undefined, undefined, "demo-nurse", "Sister Lakshmi");

      const updated = (await PatientService.getPatient(p.id))!;
      expect(updated.status).toBe("Awaiting Review");
      expect(updated.priority).toBe("HIGH");
      expect(updated.bmi?.value).toBe(33.1);
      expect(updated.bmi?.category).toBe("Obesity range");

      // Verify Doctor notification was dispatched
      const notifs = await PatientService.getNotifications();
      expect(notifs.some(n => n.patientId === p.id && n.title.includes("Intake Submitted"))).toBe(true);
    });

    it("should record Doctor clarification requests and alert notifications", async () => {
      const p = await PatientService.registerPatient(
        "Kirti Sen", 45, "1981-05-10", "+91 99999-88888", "kirti@email.com", "Indore, MP", "Hindi", "SMS", "+91 99999-99999", "Spouse", "IIT Indore Main Campus Hospital"
      );

      await PatientService.requestClarification(p.id, "Please double-check menstrual cycles data.");

      const updated = (await PatientService.getPatient(p.id))!;
      expect(updated.status).toBe("Needs Clarification");
      expect(updated.clinicalIntake?.status).toBe("NEEDS_CLARIFICATION");
      expect(updated.clinicalIntake?.clarificationNotes).toBe("Please double-check menstrual cycles data.");

      const notifs = await PatientService.getNotifications();
      expect(notifs.some(n => n.patientId === p.id && n.title.includes("Clarification Requested"))).toBe(true);
    });

    it("should append and maintain clinical audit revision logs", async () => {
      const p = await PatientService.registerPatient(
        "Kirti Sen", 45, "1981-05-10", "+91 99999-88888", "kirti@email.com", "Indore, MP", "Hindi", "SMS", "+91 99999-99999", "Spouse", "IIT Indore Main Campus Hospital"
      );

      // Save initial draft
      await PatientService.saveIntakeDraft(p.id, { menstrualStatus: "regular" });

      // Append revision log
      await PatientService.addIntakeRevision(p.id, "menstrualStatus", "regular", "postmenopausal", "Sister Lakshmi");

      const updated = (await PatientService.getPatient(p.id))!;
      expect(updated.clinicalIntake?.revisions?.length).toBe(1);
      expect(updated.clinicalIntake?.revisions?.[0].editedBy).toBe("Sister Lakshmi");
      expect(updated.clinicalIntake?.revisions?.[0].sectionEdited).toBe("menstrualStatus");
      expect(updated.clinicalIntake?.revisions?.[0].newValue).toBe("postmenopausal");
    });

    it("should save doctor reconciliation decisions successfully", async () => {
      const p = await PatientService.registerPatient(
        "Kirti Sen", 45, "1981-05-10", "+91 99999-88888", "kirti@email.com", "Indore, MP", "Hindi", "SMS", "+91 99999-99999", "Spouse", "IIT Indore Main Campus Hospital"
      );

      // Create an intake session with answers
      await PatientService.saveIntakeDraft(p.id, { affectedSide: "LEFT" });

      // Retrieve and mock reconciliation decision
      const record = (await PatientService.getPatient(p.id))!;
      if (record.clinicalIntake) {
        record.clinicalIntake.reconciliationDecisions = {
          affectedSide: "CONFIRMED"
        };
        await PatientService.updatePatientRecord(record);
      }

      const updated = (await PatientService.getPatient(p.id))!;
      expect(updated.clinicalIntake?.reconciliationDecisions?.affectedSide).toBe("CONFIRMED");
    });
  });

  describe("Patient Onboarding, Journey & Daily Wellness Goals", () => {
    it("should derive journey stages correctly for various patient records", async () => {
      const patient: PatientRecord = {
        id: "test-journey-patient",
        name: "Test Patient",
        age: 36,
        dob: "1990-01-01",
        phone: "+91 99999-99999",
        reports: [],
        clinicalJourney: {
          assessmentSubmitted: false,
          reportsUploaded: false,
          aiAnalysisStatus: "PENDING",
          radiologyStatus: "PENDING",
          doctorReviewStatus: "AWAITING_REVIEW",
          appointmentStatus: "NOT_SCHEDULED"
        },
        priority: "LOW",
        status: "Awaiting Onboarding",
        timeInQueue: "0 hours"
      };

      // Case 1: Profile completed
      let derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[0].status).toBe("COMPLETED");
      expect(derived.steps[1].status).toBe("CURRENT");
      expect(derived.headerText).toContain("Step 2 of 7");

      // Case 2: Assessment submitted
      patient.clinicalJourney!.assessmentSubmitted = true;
      derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[1].status).toBe("COMPLETED");
      expect(derived.steps[2].status).toBe("CURRENT");
      expect(derived.headerText).toContain("Step 3 of 7");

      // Case 3: Scan uploaded
      patient.clinicalJourney!.reportsUploaded = true;
      derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[2].status).toBe("COMPLETED");
      expect(derived.steps[3].status).toBe("CURRENT");

      // Case 4: AI Analysis completed
      patient.clinicalJourney!.aiAnalysisStatus = "COMPLETE";
      derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[3].status).toBe("COMPLETED");
      expect(derived.steps[4].status).toBe("CURRENT");

      // Case 5: Doctor Review completed
      patient.clinicalJourney!.doctorReviewStatus = "COMPLETED";
      derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[4].status).toBe("COMPLETED");
      expect(derived.steps[5].status).toBe("CURRENT");

      // Case 6: Appointment scheduled and preceding steps completed (should be CURRENT)
      patient.clinicalJourney!.appointmentStatus = "SCHEDULED";
      derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[5].status).toBe("CURRENT");
      expect(derived.steps[6].status).toBe("NOT_READY");

      // Case 6b: Appointment scheduled but preceding step (Doctor Review) is NOT completed (should be UPCOMING)
      patient.clinicalJourney!.doctorReviewStatus = "AWAITING_REVIEW";
      derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[4].status).toBe("CURRENT"); // Doctor review is current step
      expect(derived.steps[5].status).toBe("UPCOMING"); // Appointment is upcoming since scheduled
      expect(derived.steps[6].status).toBe("NOT_READY");

      // Restore doctor review to completed for final test
      patient.clinicalJourney!.doctorReviewStatus = "COMPLETED";

      // Case 7: Appointment completed
      patient.clinicalJourney!.appointmentStatus = "COMPLETED";
      derived = PatientService.deriveDiagnosticJourney(patient);
      expect(derived.steps[5].status).toBe("COMPLETED");
      expect(derived.steps[6].status).toBe("CURRENT");
    });

    it("should manage daily wellness goals correctly including progress increment, set values and care plan sync", async () => {
      const patientId = "test-goals-patient";
      
      // Fetch daily default seeded goals
      let goals = await PatientService.getWellnessGoals(patientId);
      expect(goals.length).toBeGreaterThan(0);
      
      const hydrationGoal = goals.find(g => g.type === "HYDRATION")!;
      expect(hydrationGoal.currentValue).toBe(0);
      expect(hydrationGoal.targetValue).toBe(6);

      // Increment progress (add glass)
      await PatientService.logGoalProgress(patientId, hydrationGoal.id, 1);
      goals = await PatientService.getWellnessGoals(patientId);
      const updatedHydration = goals.find(g => g.type === "HYDRATION")!;
      expect(updatedHydration.currentValue).toBe(1);

      // Undo progress (remove glass)
      await PatientService.logGoalProgress(patientId, hydrationGoal.id, -1);
      goals = await PatientService.getWellnessGoals(patientId);
      const undoneHydration = goals.find(g => g.type === "HYDRATION")!;
      expect(undoneHydration.currentValue).toBe(0);

      // Set absolute value (e.g. log sleep hours)
      const sleepGoal = goals.find(g => g.type === "SLEEP")!;
      await PatientService.logGoalProgress(patientId, sleepGoal.id, 0, 7.5);
      goals = await PatientService.getWellnessGoals(patientId);
      const updatedSleep = goals.find(g => g.type === "SLEEP")!;
      expect(updatedSleep.currentValue).toBe(7.5);
      expect(updatedSleep.status).toBe("COMPLETED");
      expect(updatedSleep.completedAt).toBeDefined();

      // Verify care plan sync
      const carePlan = await PatientService.getCarePlan(patientId);
      const matchedCp = carePlan.find(cp => cp.type === "SLEEP" || cp.title === sleepGoal.title);
      if (matchedCp) {
        expect(matchedCp.status).toBe("COMPLETED");
      }
    });
  });

  describe("General Wellness Indicators - Blood Pressure & Glucose", () => {
    // ─── BLOOD PRESSURE UNIT TESTS ──────────────────────────────────────────
    it("should classify blood pressure ranges correctly", () => {
      // Normal reference reading
      const normal = PatientService.classifyBloodPressure(118, 78, []);
      expect(normal.status).toBe("EXPECTED");
      expect(normal.label).toBe("Within expected range");

      // High systolic only
      const highSys = PatientService.classifyBloodPressure(142, 80, []);
      expect(highSys.status).toBe("HIGH_READING");
      expect(highSys.label).toBe("High reading");
      expect(highSys.description).toContain("clinical review recommended");

      // High diastolic only
      const highDia = PatientService.classifyBloodPressure(120, 92, []);
      expect(highDia.status).toBe("HIGH_READING");
      expect(highDia.label).toBe("High reading");

      // Repeated high readings on separate dates
      const mockHistory = [
        {
          id: "bp-1",
          patientId: "test-patient",
          systolic: 145,
          diastolic: 85,
          measuredAt: "2026-07-10T10:00:00.000Z",
          measuredBy: "Patient",
          source: "HOME" as const,
          status: "HIGH_READING" as const
        }
      ];
      const repeatedHigh = PatientService.classifyBloodPressure(142, 88, mockHistory);
      expect(repeatedHigh.status).toBe("HIGH_READING");
      expect(repeatedHigh.label).toBe("Repeated high readings");
      expect(repeatedHigh.description).toContain("Repeated high readings recorded");

      // Below usual range
      const low = PatientService.classifyBloodPressure(88, 55, []);
      expect(low.status).toBe("BELOW_USUAL");
      expect(low.label).toBe("Below usual range");
      expect(low.description).toContain("Low readings may be normal for some people");

      // Hypertensive Crisis Alert (extreme high)
      const crisis = PatientService.classifyBloodPressure(182, 122, []);
      expect(crisis.status).toBe("HIGH_READING");
      expect(crisis.label).toBe("Hypertensive Crisis Alert");
      expect(crisis.showCrisisAlert).toBe(true);
    });

    // ─── BLOOD GLUCOSE UNIT TESTS ───────────────────────────────────────────
    it("should classify glucose ranges and test types correctly", () => {
      // Fasting plasma glucose expected range (< 110 mg/dL)
      const fastExpected = PatientService.classifyBloodGlucose("FASTING", 95, "MG_DL");
      expect(fastExpected.interpretation).toBe("Within expected fasting range");
      expect(fastExpected.alertLevel).toBe("NORMAL");

      // Fasting above expected (110 - 125 mg/dL)
      const fastAbove = PatientService.classifyBloodGlucose("FASTING", 115, "MG_DL");
      expect(fastAbove.interpretation).toContain("Above expected fasting range");
      expect(fastAbove.alertLevel).toBe("WARNING");

      // Fasting diabetes-range (>= 126 mg/dL)
      const fastDiabetes = PatientService.classifyBloodGlucose("FASTING", 130, "MG_DL");
      expect(fastDiabetes.interpretation).toContain("Diabetes-range fasting result");
      expect(fastDiabetes.alertLevel).toBe("WARNING");

      // mmol/L conversion check
      // 5.0 mmol/L fasting (90 mg/dL) -> expected
      const fastMMol = PatientService.classifyBloodGlucose("FASTING", 5.0, "MMOL_L");
      expect(fastMMol.interpretation).toBe("Within expected fasting range");

      // 7.2 mmol/L fasting (129.6 mg/dL) -> diabetes range
      const fastMMolDiabetes = PatientService.classifyBloodGlucose("FASTING", 7.2, "MMOL_L");
      expect(fastMMolDiabetes.interpretation).toContain("Diabetes-range fasting result");

      // Two-hour glucose expected range (< 140 mg/dL)
      const ogttExpected = PatientService.classifyBloodGlucose("TWO_HOUR_OGTT", 130, "MG_DL");
      expect(ogttExpected.interpretation).toBe("Within expected two-hour range");

      // Two-hour diabetes-range (>= 200 mg/dL)
      const ogttDiabetes = PatientService.classifyBloodGlucose("TWO_HOUR_OGTT", 210, "MG_DL");
      expect(ogttDiabetes.interpretation).toContain("Diabetes-range result");

      // Random glucose warning (>= 200 mg/dL)
      const randomHigh = PatientService.classifyBloodGlucose("RANDOM", 220, "MG_DL");
      expect(randomHigh.interpretation).toContain("High random glucose reading");
      expect(randomHigh.alertLevel).toBe("WARNING");

      // HbA1c expected/normal (< 6.5)
      const hba1cNormal = PatientService.classifyBloodGlucose("HBA1C", 5.8, "PERCENT");
      expect(hba1cNormal.interpretation).toContain("HbA1c reading recorded");
      expect(hba1cNormal.interpretation).toContain("red blood cells");

      // HbA1c diabetes range (>= 6.5)
      const hba1cHigh = PatientService.classifyBloodGlucose("HBA1C", 6.8, "PERCENT");
      expect(hba1cHigh.interpretation).toContain("Diabetes-range HbA1c result");

      // Home Glucometer Reading
      const homeMeter = PatientService.classifyBloodGlucose("HOME_METER", 100, "MG_DL");
      expect(homeMeter.interpretation).toContain("Home reading recorded");

      // Pregnancy Context override
      const pregnantReading = PatientService.classifyBloodGlucose("FASTING", 150, "MG_DL", true);
      expect(pregnantReading.interpretation).toContain("Pregnancy uses specific glucose-testing criteria");
      expect(pregnantReading.alertLevel).toBe("WARNING");
    });

    it("should save and track GeneralWellnessStatus records in history", async () => {
      const p = await PatientService.registerPatient(
        "Kirti Sen", 45, "1981-05-10", "+91 99999-88888", "kirti@email.com", "Indore, MP", "Hindi", "SMS", "+91 99999-99999", "Spouse", "IIT Indore Main Campus Hospital"
      );

      // BMI Measured
      let updated = await PatientService.savePatientBmi(p.id, 160, 72, 45);
      expect(updated?.wellnessHistory?.length).toBe(1);
      const bmiRec = updated?.wellnessHistory?.[0];
      expect(bmiRec?.type).toBe("BMI");
      expect(bmiRec?.entryMode).toBe("MEASURED");
      expect(bmiRec?.value).toBeCloseTo(28.1, 1);
      expect(bmiRec?.status).toBe("HIGH"); // Above healthy range

      // BMI Pediatric Under 20
      const child = await PatientService.registerPatient(
        "Aditi Sen", 16, "2010-05-10", "+91 99999-88888", "aditi@email.com", "Indore, MP", "Hindi", "SMS", "+91 99999-99999", "Spouse", "IIT Indore Main Campus Hospital"
      );
      const childUpdated = await PatientService.savePatientBmi(child.id, 150, 45, 16);
      const childBmiRec = childUpdated?.wellnessHistory?.[0];
      expect(childBmiRec?.status).toBe("UNKNOWN"); // Pediatric

      // Blood Pressure Measured High
      updated = await PatientService.savePatientBloodPressure(p.id, 145, 95, 72, "SITTING", "Initial visit", "CLINIC");
      expect(updated?.wellnessHistory?.length).toBe(2);
      const bpRec = updated?.wellnessHistory?.[1];
      expect(bpRec?.type).toBe("BLOOD_PRESSURE");
      expect(bpRec?.entryMode).toBe("MEASURED");
      expect(bpRec?.value).toBe(145);
      expect(bpRec?.secondaryValue).toBe(95);
      expect(bpRec?.status).toBe("HIGH");
      expect(bpRec?.verified).toBe(true);

      // Blood Pressure Self Reported Medication
      updated = await PatientService.saveWellnessStatus(p.id, {
        type: "BLOOD_PRESSURE",
        entryMode: "SELF_REPORTED",
        status: "MEDICATION_REPORTED",
        source: "PATIENT",
        verified: false,
        note: "Takes daily pill"
      });
      expect(updated?.wellnessHistory?.length).toBe(3);
      const bpSelf = updated?.wellnessHistory?.[2];
      expect(bpSelf?.entryMode).toBe("SELF_REPORTED");
      expect(bpSelf?.status).toBe("MEDICATION_REPORTED");

      // Blood Glucose Measured Fasting Normal
      updated = await PatientService.savePatientBloodGlucose(p.id, "FASTING", 90, "MG_DL", 12, false, [], "Fasting normal", "LAB");
      expect(updated?.wellnessHistory?.length).toBe(4);
      const bgRec = updated?.wellnessHistory?.[3];
      expect(bgRec?.type).toBe("BLOOD_GLUCOSE");
      expect(bgRec?.entryMode).toBe("MEASURED");
      expect(bgRec?.value).toBe(90);
      expect(bgRec?.status).toBe("NORMAL");

      // Blood Glucose Self Reported Diagnosed
      updated = await PatientService.saveWellnessStatus(p.id, {
        type: "BLOOD_GLUCOSE",
        entryMode: "SELF_REPORTED",
        status: "DIAGNOSED",
        source: "PATIENT",
        verified: false,
        note: "Diagnosed 2023"
      });
      expect(updated?.wellnessHistory?.length).toBe(5);
      const bgSelf = updated?.wellnessHistory?.[4];
      expect(bgSelf?.entryMode).toBe("SELF_REPORTED");
      expect(bgSelf?.status).toBe("DIAGNOSED");
    });
  });
});

// ─── Self-Reported Wellness Indicators (Hypertension & Diabetes) ─────────────

describe("Self-Reported Wellness Indicators", () => {
  const PATIENT_A = "patient-a-test";
  const PATIENT_B = "patient-b-test";

  beforeEach(async () => {
    localStorage.clear();
    await PatientService.initializeStore();
    // Seed patient A using the correct method name
    await PatientService.updatePatientRecord({
      id: PATIENT_A,
      name: "Alice Test",
      age: 42,
      priority: "LOW",
      status: "Active",
      timeInQueue: "0m",
    });
    // Seed patient B
    await PatientService.updatePatientRecord({
      id: PATIENT_B,
      name: "Bob Test",
      age: 35,
      priority: "LOW",
      status: "Active",
      timeInQueue: "0m",
    });
  });

  // Test 1 — Hypertension card service availability (verifies BMI is unaffected)
  it("1. getLatestSelfReportedStatus returns null when no hypertension record exists (BMI still intact)", async () => {
    const hp = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "HYPERTENSION");
    expect(hp).toBeNull();
    // BMI path is unaffected
    const patient = await PatientService.getPatient(PATIENT_A);
    expect(patient).not.toBeNull();
    expect(patient?.hypertensionHistory).toBeUndefined();
  });

  // Test 2 — Diabetes card service availability
  it("2. getLatestSelfReportedStatus returns null when no diabetes record exists", async () => {
    const db = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "DIABETES");
    expect(db).toBeNull();
  });

  // Test 3 — Low can be selected and saved
  it("3. LOW reportedStatus is saved and retrieved correctly", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "LOW",
      previousDiagnosis: "NO",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "HYPERTENSION");
    expect(result?.reportedStatus).toBe("LOW");
  });

  // Test 4 — Normal can be selected and saved
  it("4. NORMAL reportedStatus is saved and retrieved correctly", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "DIABETES",
      patientId: PATIENT_A,
      reportedStatus: "NORMAL",
      previousDiagnosis: "NO",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "DIABETES");
    expect(result?.reportedStatus).toBe("NORMAL");
  });

  // Test 5 — High can be selected and saved
  it("5. HIGH reportedStatus is saved and retrieved correctly", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "HIGH",
      previousDiagnosis: "YES",
      medicationReported: "YES",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "HYPERTENSION");
    expect(result?.reportedStatus).toBe("HIGH");
  });

  // Test 6 — I Don't Know (UNKNOWN) can be selected and saved
  it("6. UNKNOWN reportedStatus is saved and retrieved correctly", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "DIABETES",
      patientId: PATIENT_A,
      reportedStatus: "UNKNOWN",
      previousDiagnosis: "UNSURE",
      medicationReported: "UNSURE",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "DIABETES");
    expect(result?.reportedStatus).toBe("UNKNOWN");
  });

  // Test 7 — Diagnosis question saves correctly
  it("7. previousDiagnosis value is persisted accurately", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "HIGH",
      previousDiagnosis: "YES",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "HYPERTENSION");
    expect(result?.previousDiagnosis).toBe("YES");
  });

  // Test 8 — Medicine question saves correctly
  it("8. medicationReported value is persisted accurately", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "DIABETES",
      patientId: PATIENT_A,
      reportedStatus: "HIGH",
      previousDiagnosis: "YES",
      medicationReported: "YES",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "DIABETES");
    expect(result?.medicationReported).toBe("YES");
  });

  // Test 9 — Source is always PATIENT_SELF_REPORTED
  it("9. source is always PATIENT_SELF_REPORTED — never clinically verified", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "NORMAL",
      previousDiagnosis: "NO",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "HYPERTENSION");
    expect(result?.source).toBe("PATIENT_SELF_REPORTED");
    // The type should NOT have a 'verified' field — it uses 'source' for provenance
    expect((result as any)?.verified).toBeUndefined();
  });

  // Test 10 — Status persists after fetching patient again (simulates page refresh)
  it("10. self-reported status persists after re-fetching the patient record", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "DIABETES",
      patientId: PATIENT_A,
      reportedStatus: "HIGH",
      previousDiagnosis: "YES",
      medicationReported: "YES",
      source: "PATIENT_SELF_REPORTED",
    });
    // Simulate page refresh by fetching fresh
    const fresh = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "DIABETES");
    expect(fresh).not.toBeNull();
    expect(fresh?.reportedStatus).toBe("HIGH");
    expect(fresh?.recordedAt).toBeTruthy();
  });

  // Test 11 — Authenticated patient ID is used (not a static ID)
  it("11. record is stored under the correct authenticated patient ID", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "NORMAL",
      previousDiagnosis: "NO",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "HYPERTENSION");
    expect(result?.patientId).toBe(PATIENT_A);
  });

  // Test 12 — Another patient does not inherit the record
  it("12. patient B does not inherit patient A's hypertension record", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "HIGH",
      previousDiagnosis: "YES",
      medicationReported: "YES",
      source: "PATIENT_SELF_REPORTED",
    });
    const bResult = await PatientService.getLatestSelfReportedStatus(PATIENT_B, "HYPERTENSION");
    expect(bResult).toBeNull();
  });

  // Test 13 — History records are retained (not overwritten)
  it("13. multiple saves create history — records are never overwritten", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "DIABETES",
      patientId: PATIENT_A,
      reportedStatus: "NORMAL",
      previousDiagnosis: "NO",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "DIABETES",
      patientId: PATIENT_A,
      reportedStatus: "HIGH",
      previousDiagnosis: "YES",
      medicationReported: "YES",
      source: "PATIENT_SELF_REPORTED",
    });
    const history = await PatientService.getSelfReportedHistory(PATIENT_A, "DIABETES");
    expect(history.length).toBe(2);
    expect(history[0].reportedStatus).toBe("NORMAL");
    expect(history[1].reportedStatus).toBe("HIGH");
  });

  // Test 14 — Cards update immediately after saving (latest record is returned)
  it("14. getLatestSelfReportedStatus returns the most recently saved record", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "LOW",
      previousDiagnosis: "NO",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "HYPERTENSION",
      patientId: PATIENT_A,
      reportedStatus: "HIGH",
      previousDiagnosis: "YES",
      medicationReported: "NO",
      source: "PATIENT_SELF_REPORTED",
    });
    const latest = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "HYPERTENSION");
    // Should return the LAST saved record (HIGH), not the first (LOW)
    expect(latest?.reportedStatus).toBe("HIGH");
  });

  // Test 15 — Mobile interaction: record has no special fields that would cause overflow
  it("15. self-reported record contains only safe, mobile-renderable string values", async () => {
    await PatientService.saveSelfReportedStatus(PATIENT_A, {
      type: "DIABETES",
      patientId: PATIENT_A,
      reportedStatus: "NORMAL",
      previousDiagnosis: "UNSURE",
      medicationReported: "UNSURE",
      source: "PATIENT_SELF_REPORTED",
    });
    const result = await PatientService.getLatestSelfReportedStatus(PATIENT_A, "DIABETES");
    expect(typeof result?.id).toBe("string");
    expect(typeof result?.reportedStatus).toBe("string");
    expect(typeof result?.recordedAt).toBe("string");
    expect(typeof result?.updatedAt).toBe("string");
    expect(typeof result?.source).toBe("string");
    // No arrays or nested objects that would break mobile rendering
    expect(Array.isArray(result)).toBe(false);
  });
});
