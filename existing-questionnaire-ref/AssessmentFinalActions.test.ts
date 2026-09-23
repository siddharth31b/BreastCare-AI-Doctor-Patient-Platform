import { describe, test, expect } from "vitest";
import { 
  calculateCareGuidance, 
  mapAnswersToSymptomKeys, 
  SYMPTOM_KEYS,
  calculateBaselineRiskModifier,
  calculatePhasedSymptomScore,
  checkEscalationOverrides,
  calculateClinicalRiskAnalysis
} from "./assessmentEngine";
import type { QuestionnaireAnswer } from "../../types/questionnaire";

describe("AssessmentFinalActions & Phased Clinical Risk Analysis Tests", () => {

  test("1. Three action mappings and backend key resolution work correctly", () => {
    const mockAnswers: QuestionnaireAnswer[] = [
      { questionId: "current_concern", value: ["breast_pain", "breast_lump"], label: "Breast pain, Breast lump", answeredAt: "2026-07-24T12:00:00Z" },
      { questionId: "breast_side", value: "right", label: "Right breast", answeredAt: "2026-07-24T12:00:00Z" }
    ];

    const keys = mapAnswersToSymptomKeys(mockAnswers);
    expect(keys).toContain(SYMPTOM_KEYS.BREAST_R_PAIN);
    expect(keys).toContain(SYMPTOM_KEYS.BREAST_R_PALPABLE);
    expect(keys).not.toContain(SYMPTOM_KEYS.BREAST_L_PAIN);
  });

  test("2. Both sides mapping correctly resolves left and right keys", () => {
    const mockAnswers: QuestionnaireAnswer[] = [
      { questionId: "current_concern", value: ["breast_lump"], label: "Breast lump", answeredAt: "2026-07-24T12:00:00Z" },
      { questionId: "breast_side", value: "both", label: "Both breasts", answeredAt: "2026-07-24T12:00:00Z" }
    ];

    const keys = mapAnswersToSymptomKeys(mockAnswers);
    expect(keys).toContain(SYMPTOM_KEYS.BREAST_L_PALPABLE);
    expect(keys).toContain(SYMPTOM_KEYS.BREAST_R_PALPABLE);
  });

  test("3. Convulsion triggers HIGH care guidance immediately", () => {
    const mockAnswers: QuestionnaireAnswer[] = [
      { questionId: "current_concern", value: ["convulsion"], label: "Convulsion or seizure-like episode", answeredAt: "2026-07-24T12:00:00Z" }
    ];

    const guidance = calculateCareGuidance(mockAnswers);
    expect(guidance.level).toBe("HIGH");
    expect(guidance.emergencyAlert).toBeDefined();
    expect(guidance.selectedSymptomKeys).toContain(SYMPTOM_KEYS.CNS_CONVULSION);
  });

  test("4. Persistent lump triggers MEDIUM care guidance", () => {
    const mockAnswers: QuestionnaireAnswer[] = [
      { questionId: "current_concern", value: ["breast_lump"], label: "Breast lump", answeredAt: "2026-07-24T12:00:00Z" },
      { questionId: "breast_side", value: "left", label: "Left breast", answeredAt: "2026-07-24T12:00:00Z" },
      { questionId: "duration", value: "1_to_4_weeks", label: "1-4 weeks", answeredAt: "2026-07-24T12:00:00Z" }
    ];

    const guidance = calculateCareGuidance(mockAnswers);
    expect(guidance.level).toBe("MEDIUM");
    expect(guidance.reasons.length).toBeGreaterThan(0);
  });

  test("5. Mild symptoms without warning signs trigger LOW care guidance", () => {
    const mockAnswers: QuestionnaireAnswer[] = [
      { questionId: "current_concern", value: ["no_symptoms"], label: "No symptoms", answeredAt: "2026-07-24T12:00:00Z" }
    ];

    const guidance = calculateCareGuidance(mockAnswers);
    expect(guidance.level).toBe("LOW");
    expect(guidance.disclaimer).toBe("This assessment is not a diagnosis.");
  });

  test("6. Phase 0: Baseline Risk Modifier correctly computes risk factors", () => {
    const profile = {
      age: "48 years",
      familyHistory: "Yes (Mother / Sister)",
      breastfeeding: "No / Never breastfed",
      contraceptives: "Used > 5 years (Long-term)",
      numberOfChildren: "0",
      smoking: "Current smoker"
    };

    const brm = calculateBaselineRiskModifier(profile);
    // Age > 40 (+2), Family History (+3), No Breastfeeding (+1), Contraceptives >5yr (+1), Nulliparity (+1), Smoking (+1) = 9
    expect(brm.score).toBe(9);
    expect(brm.breakdown.length).toBe(6);
  });

  test("7. Phase 1-3: Multiplier and weighted scoring calculates correctly", () => {
    const answers: Record<string, "Yes" | "No"> = {
      "Symptoms on Left Breast – Palpable Lump / Abnormality": "Yes", // W=3, Phase 1 -> 3 * 1.5 = 4.5
      "Symptoms on Neck – Lump": "Yes", // W=3, Phase 2 (P1 positive -> mult 1.5) -> 3 * 1.5 = 4.5
      "Respiratory Symptoms – Cough": "Yes" // W=2, Phase 3 (P1/P2 positive -> mult 1.5) -> 2 * 1.5 = 3.0
    };

    const scoring = calculatePhasedSymptomScore(answers);
    expect(scoring.phase1Weighted).toBe(4.5);
    expect(scoring.phase2Multiplier).toBe(1.5);
    expect(scoring.phase3Multiplier).toBe(1.5);
  });

  test("8. Escalation Override: Metastatic pattern triggers Urgent tier", () => {
    const answers: Record<string, "Yes" | "No"> = {
      "Symptoms on Left Breast – Pain": "Yes",
      "Respiratory Symptoms – Breathlessness": "Yes"
    };

    const override = checkEscalationOverrides(answers);
    expect(override.triggered).toBe(true);
    expect(override.ruleName).toContain("Metastatic");

    const analysis = calculateClinicalRiskAnalysis(undefined, answers);
    expect(analysis.tier).toBe("Urgent");
  });

  test("9. Escalation Override: Classic Malignancy Triad triggers Urgent tier", () => {
    const answers: Record<string, "Yes" | "No"> = {
      "Symptoms on Left Breast – Nipple Retraction / Inversion": "Yes",
      "Symptoms on Left Breast – Nipple Discharge": "Yes",
      "Symptoms on Left Breast – Skin Dimpling": "Yes"
    };

    const override = checkEscalationOverrides(answers);
    expect(override.triggered).toBe(true);
    expect(override.ruleName).toContain("Triad");
  });

  test("10. Full Clinical Risk Analysis: Low risk profile when clean", () => {
    const cleanAnswers: Record<string, "Yes" | "No"> = {};
    const analysis = calculateClinicalRiskAnalysis({ age: "26" }, cleanAnswers);
    expect(analysis.tier).toBe("Low");
    expect(analysis.totalScore).toBe(0);
  });

});
