import type { QuestionnaireAnswer } from "../../types/questionnaire";
import type { RiskProfileData } from "../../services/symptom.service";
import questionsData from "../../mocks/symptoms_questions.json";

// EXACT BACKEND SYMPTOM MAPPING KEYS (STRICT SCOPE LOCK)
export const SYMPTOM_KEYS = {
  // Left Neck
  NECK_L_LUMP: "sym_neck_l_lump",
  // Right Neck
  NECK_R_LUMP: "sym_neck_r_lump",

  // Left Axilla / Armpit
  ARM_L_LUMP: "sym_arm_l_lump",
  // Right Axilla / Armpit
  ARM_R_LUMP: "sym_arm_r_lump",

  // Left Breast
  BREAST_L_PAIN: "sym_breast_l_pain",
  BREAST_L_PALPABLE: "sym_breast_l_palpable",
  BREAST_L_CHANGES_SHAPE: "sym_breast_l_changes_shape",
  BREAST_L_WOUND: "sym_breast_l_wound",
  BREAST_L_NIPPLE_DISCHARGE: "sym_breast_l_nipple_discharge",

  // Right Breast
  BREAST_R_PAIN: "sym_breast_r_pain",
  BREAST_R_PALPABLE: "sym_breast_r_palpable",
  BREAST_R_CHANGES_SHAPE: "sym_breast_r_changes_shape",
  BREAST_R_WOUND: "sym_breast_r_wound",
  BREAST_R_NIPPLE_DISCHARGE: "sym_breast_r_nipple_discharge",

  // Abdomen
  ABD_PAIN: "sym_abd_pain",
  ABD_BRUISING: "sym_abd_bruising",
  ABD_LUMP: "sym_abd_lump",
  ABD_DISCOLOURATION: "sym_abd_discolouration",

  // Respiratory
  RES_COUGH: "sym_res_cough",
  RES_BREATHLESSNESS: "sym_res_breathlessness",

  // CNS
  CNS_HEADACHE: "sym_cns_headache",
  CNS_GIDDINESS: "sym_cns_giddiness",
  CNS_NAUSEA: "sym_cns_nausea",
  CNS_VOMITING: "sym_cns_vomiting",
  CNS_CONVULSION: "sym_cns_convulsion",

  // Musculoskeletal
  UMS_BACK_PAIN: "sym_ums_back_pain",
  UMS_SHOULDER_PAIN: "sym_ums_shoulder_pain",
  UMS_UNDERARM_PAIN: "sym_ums_underarm_pain",
} as const;

export interface CareGuidanceResult {
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  message: string;
  emergencyAlert?: string;
  disclaimer: string;
  selectedSymptomKeys: string[];
  patientSummaryItems: { label: string; value: string }[];
  doctorSummaryItems: { label: string; value: string; key?: string }[];
}

export type RiskTier = "Low" | "Moderate" | "High" | "Urgent";

export interface BRMResult {
  score: number;
  breakdown: { factor: string; points: number; note: string }[];
}

export interface PhasedScoreBreakdown {
  phase1Score: number;
  phase1Multiplier: number;
  phase1Weighted: number;
  phase2Score: number;
  phase2Multiplier: number;
  phase2Weighted: number;
  phase3Score: number;
  phase3Multiplier: number;
  phase3Weighted: number;
  totalSymptomScore: number;
  positiveCountPhase1: number;
  positiveCountPhase2: number;
  positiveCountPhase3: number;
}

export interface EscalationOverrideResult {
  triggered: boolean;
  reason: string | null;
  ruleName: string | null;
}

export interface ClinicalRiskAnalysisResult {
  brm: BRMResult;
  symptomScoring: PhasedScoreBreakdown;
  totalScore: number;
  tier: RiskTier;
  override: EscalationOverrideResult;
  recommendation: string;
  interpretation: string;
  keyFindings: string[];
}

/**
 * Calculates Baseline Risk Modifier (Phase 0) based on clinical reproductive/lifestyle/family history.
 */
export function calculateBaselineRiskModifier(profile?: RiskProfileData): BRMResult {
  if (!profile) return { score: 0, breakdown: [] };

  const breakdown: { factor: string; points: number; note: string }[] = [];
  let score = 0;

  // 1. Family History (+3)
  const fam = (profile.familyHistory || "").toLowerCase();
  if (fam.includes("mother") || fam.includes("sister") || fam.includes("daughter") || fam.includes("yes")) {
    score += 3;
    breakdown.push({
      factor: "Family History of Breast/Ovarian Cancer",
      points: 3,
      note: profile.familyHistory || "Family history reported"
    });
  }

  // 2. Age > 40 (+2)
  const ageStr = profile.age || "";
  const parsedAge = parseInt(ageStr, 10);
  const isOver40 = parsedAge > 40 || ageStr.includes("41") || ageStr.includes("50") || ageStr.includes("> 40") || ageStr.includes("> 50") || ageStr.includes("40-");
  if (isOver40) {
    score += 2;
    breakdown.push({
      factor: "Age > 40 years",
      points: 2,
      note: `Age: ${profile.age}`
    });
  }

  // 3. Breastfeeding history: None (+1)
  const bf = (profile.breastfeeding || "").toLowerCase();
  if (bf.includes("never") || bf.includes("no") || bf.includes("none")) {
    score += 1;
    breakdown.push({
      factor: "No Breastfeeding History",
      points: 1,
      note: profile.breastfeeding || "Never breastfed"
    });
  }

  // 4. Hormonal contraceptives: Long-term / >5 years (+1)
  const hc = (profile.contraceptives || "").toLowerCase();
  if (hc.includes("long") || hc.includes("> 5") || hc.includes("5 years") || hc.includes("5+")) {
    score += 1;
    breakdown.push({
      factor: "Long-term Hormonal Contraceptive Use",
      points: 1,
      note: profile.contraceptives || "Long-term use"
    });
  }

  // 5. No children / late first childbirth (>30) (+1)
  const numKids = (profile.numberOfChildren || "").toLowerCase();
  const firstChild = (profile.ageAtFirstChild || "").toLowerCase();
  if (numKids === "0" || numKids.includes("no children") || firstChild.includes(">30") || firstChild.includes("≥30") || firstChild.includes("30+") || firstChild.includes("no children")) {
    score += 1;
    breakdown.push({
      factor: "Nulliparity or First Childbirth > 30 Years",
      points: 1,
      note: profile.ageAtFirstChild || profile.numberOfChildren || "Late / no childbirth"
    });
  }

  // 6. Smoking (+1)
  const sm = (profile.smoking || "").toLowerCase();
  if (sm.includes("current") || sm.includes("former") || sm.includes("yes")) {
    score += 1;
    breakdown.push({
      factor: "Smoking History",
      points: 1,
      note: profile.smoking || "Smoker"
    });
  }

  return { score, breakdown };
}

/**
 * Checks for clinical escalation safety net overrides.
 */
export function checkEscalationOverrides(answers: Record<string, "Yes" | "No">): EscalationOverrideResult {
  const isYes = (name: string) => {
    const key = Object.keys(answers).find(k => k.toLowerCase().includes(name.toLowerCase()));
    return key ? answers[key] === "Yes" : false;
  };

  const hasPositivePhase1 = Object.entries(answers).some(([k, v]) => {
    return v === "Yes" && (k.includes("Left Breast") || k.includes("Right Breast"));
  });

  const hasPositivePhase3 = Object.entries(answers).some(([k, v]) => {
    return v === "Yes" && (k.includes("Respiratory") || k.includes("CNS") || k.includes("Muscular"));
  });

  // Override 1: Any Phase 1 (Breast) AND Any Phase 3 (Systemic) -> Potential metastatic pattern
  if (hasPositivePhase1 && hasPositivePhase3) {
    return {
      triggered: true,
      ruleName: "Metastatic Pattern Alert",
      reason: "Concomitant primary breast findings and systemic symptoms detected (requires prompt systemic staging)."
    };
  }

  // Override 2: Classic Malignancy Triad (Nipple Retraction + Discharge + Skin Dimpling)
  const leftTriad = isYes("Left Breast – Nipple Retraction") && isYes("Left Breast – Nipple Discharge") && isYes("Left Breast – Skin Dimpling");
  const rightTriad = isYes("Right Breast – Nipple Retraction") && isYes("Right Breast – Nipple Discharge") && isYes("Right Breast – Skin Dimpling");
  if (leftTriad || rightTriad) {
    return {
      triggered: true,
      ruleName: "Classic Malignancy Triad",
      reason: "Co-occurrence of nipple retraction, nipple discharge, and skin dimpling represents a classic clinical cluster requiring immediate evaluation."
    };
  }

  // Override 3: Ulcer or non-healing wound on breast or neck
  const hasUlcerOrWound = isYes("Breast – Ulcer") || isYes("Breast – Wound") || isYes("Neck – Bleeding") || isYes("Neck – Ulcer") || isYes("Neck – Wound");
  if (hasUlcerOrWound) {
    return {
      triggered: true,
      ruleName: "Ulcerative / Open Skin Lesion Alert",
      reason: "Ulcer, wound, or active bleeding on breast or neck tissue requires prompt clinical evaluation."
    };
  }

  return { triggered: false, reason: null, ruleName: null };
}

/**
 * Computes phased symptom score with clinical relevance weights and dynamic multipliers.
 */
export function calculatePhasedSymptomScore(answers: Record<string, "Yes" | "No">): PhasedScoreBreakdown {
  let p1Raw = 0;
  let p2Raw = 0;
  let p3Raw = 0;
  let p1Count = 0;
  let p2Count = 0;
  let p3Count = 0;
  let p1HasHighRisk = false;
  let p2HasHighRisk = false;

  questionsData.forEach(cat => {
    const phase = cat.phase || 1;
    cat.options.forEach(opt => {
      if (answers[opt.converted_name] === "Yes") {
        const weight = opt.weight || 2;
        if (phase === 1) {
          p1Raw += weight;
          p1Count++;
          if (weight >= 3 || opt.relevance === "H") p1HasHighRisk = true;
        } else if (phase === 2) {
          p2Raw += weight;
          p2Count++;
          if (weight >= 3 || opt.relevance === "H") p2HasHighRisk = true;
        } else {
          p3Raw += weight;
          p3Count++;
        }
      }
    });
  });

  // Dynamic multipliers: diagnostic weighting applies when primary red-flag symptoms are present.
  // Isolated low-risk symptoms (e.g. mild pain) do not receive artificial multiplier inflation.
  const p1Multiplier = p1HasHighRisk ? 1.5 : (p1Raw > 0 ? 1.0 : 1.0);
  const p2Multiplier = p1HasHighRisk ? 1.5 : (p2Raw > 0 ? 1.1 : 1.0);
  const p3Multiplier = (p1HasHighRisk || p2HasHighRisk) ? 1.5 : (p3Raw > 0 ? 1.1 : 1.0);

  const p1Weighted = Math.round(p1Raw * p1Multiplier * 10) / 10;
  const p2Weighted = Math.round(p2Raw * p2Multiplier * 10) / 10;
  const p3Weighted = Math.round(p3Raw * p3Multiplier * 10) / 10;

  const totalSymptomScore = Math.round((p1Weighted + p2Weighted + p3Weighted) * 10) / 10;

  return {
    phase1Score: p1Raw,
    phase1Multiplier: p1Multiplier,
    phase1Weighted: p1Weighted,
    phase2Score: p2Raw,
    phase2Multiplier: p2Multiplier,
    phase2Weighted: p2Weighted,
    phase3Score: p3Raw,
    phase3Multiplier: p3Multiplier,
    phase3Weighted: p3Weighted,
    totalSymptomScore,
    positiveCountPhase1: p1Count,
    positiveCountPhase2: p2Count,
    positiveCountPhase3: p3Count
  };
}

/**
 * Full Phased Clinical Risk Analysis Engine (Phase 0 through Phase 4)
 */
export function calculateClinicalRiskAnalysis(
  profile: RiskProfileData | undefined,
  answers: Record<string, "Yes" | "No">
): ClinicalRiskAnalysisResult {
  const brm = calculateBaselineRiskModifier(profile);
  const symptomScoring = calculatePhasedSymptomScore(answers);
  const override = checkEscalationOverrides(answers);

  const rawTotal = Math.round((symptomScoring.totalSymptomScore + brm.score) * 10) / 10;

  let tier: RiskTier = "Low";
  if (override.triggered || rawTotal >= 24.1) {
    tier = "Urgent";
  } else if (rawTotal >= 16.1) {
    tier = "High";
  } else if (rawTotal >= 8.1) {
    tier = "Moderate";
  } else {
    tier = "Low";
  }

  // Key findings list
  const keyFindings: string[] = [];
  Object.entries(answers).forEach(([symptom, val]) => {
    if (val === "Yes") {
      keyFindings.push(symptom);
    }
  });

  // Recommendations and clinical interpretations
  let recommendation = "";
  let interpretation = "";

  if (tier === "Urgent") {
    recommendation = "Prompt in-person clinical evaluation is strongly recommended. Please consult a breast oncologist or breast surgeon within 24–48 hours for diagnostic evaluation (clinical exam, bilateral mammography, ultrasound, and/or biopsy).";
    interpretation = override.triggered
      ? `Safety Escalation: ${override.reason} Total weighted score: ${rawTotal} points.`
      : `High-acuity symptom cluster detected across multiple screening domains (Total score: ${rawTotal} pts). Immediate specialist review advised.`;
  } else if (tier === "High") {
    recommendation = "Clinical evaluation within a few days is recommended. Schedule an appointment with a breast health clinician for focused examination and diagnostic breast imaging.";
    interpretation = `Significant clinical symptoms reported with elevated risk weighting (Total score: ${rawTotal} pts, including Baseline Risk Modifier: +${brm.score}).`;
  } else if (tier === "Moderate") {
    recommendation = "Schedule a clinical breast consultation within 2–4 weeks. A healthcare provider will perform a physical examination and determine if imaging or observation is appropriate.";
    interpretation = `Moderate symptom indicators noted (Total score: ${rawTotal} pts). Many findings in this range are benign, but timely clinical evaluation ensures complete safety.`;
  } else {
    recommendation = "Continue routine breast self-awareness, periodic clinical screening, and age-appropriate mammography as recommended by your physician.";
    interpretation = `No high-risk breast symptom clusters identified (Total score: ${rawTotal} pts). Maintain routine preventive monitoring.`;
  }

  return {
    brm,
    symptomScoring,
    totalScore: rawTotal,
    tier,
    override,
    recommendation,
    interpretation,
    keyFindings
  };
}

/**
 * Legacy Care Guidance compatibility function for existing tests & backend sync.
 */
export function mapAnswersToSymptomKeys(answers: QuestionnaireAnswer[]): string[] {
  const keysSet = new Set<string>();

  const getAnswer = (qId: string) => answers.find((a) => a.questionId.toLowerCase() === qId.toLowerCase());
  const getValues = (qId: string): string[] => {
    const a = getAnswer(qId);
    if (!a) return [];
    if (Array.isArray(a.value)) return a.value.map((v) => String(v));
    return [String(a.value)];
  };

  const primaryConcerns = getValues("current_concern").concat(getValues("symptom_types"));
  const breastSide = (getAnswer("breast_side")?.value || getAnswer("side_selection")?.value || "not_sure") as string;
  const neckSide = (getAnswer("neck_lump_side")?.value || "not_sure") as string;
  const armpitSide = (getAnswer("armpit_lump_side")?.value || "not_sure") as string;

  if (primaryConcerns.includes("breast_pain") || primaryConcerns.includes("persistent_pain")) {
    if (breastSide === "left") keysSet.add(SYMPTOM_KEYS.BREAST_L_PAIN);
    else if (breastSide === "right") keysSet.add(SYMPTOM_KEYS.BREAST_R_PAIN);
    else {
      keysSet.add(SYMPTOM_KEYS.BREAST_L_PAIN);
      keysSet.add(SYMPTOM_KEYS.BREAST_R_PAIN);
    }
  }

  if (primaryConcerns.includes("breast_lump") || primaryConcerns.includes("lump")) {
    if (breastSide === "left") keysSet.add(SYMPTOM_KEYS.BREAST_L_PALPABLE);
    else if (breastSide === "right") keysSet.add(SYMPTOM_KEYS.BREAST_R_PALPABLE);
    else {
      keysSet.add(SYMPTOM_KEYS.BREAST_L_PALPABLE);
      keysSet.add(SYMPTOM_KEYS.BREAST_R_PALPABLE);
    }
  }

  if (primaryConcerns.includes("breast_shape") || primaryConcerns.includes("dimpling")) {
    if (breastSide === "left") keysSet.add(SYMPTOM_KEYS.BREAST_L_CHANGES_SHAPE);
    else if (breastSide === "right") keysSet.add(SYMPTOM_KEYS.BREAST_R_CHANGES_SHAPE);
    else {
      keysSet.add(SYMPTOM_KEYS.BREAST_L_CHANGES_SHAPE);
      keysSet.add(SYMPTOM_KEYS.BREAST_R_CHANGES_SHAPE);
    }
  }

  if (primaryConcerns.includes("nipple_discharge")) {
    if (breastSide === "left") keysSet.add(SYMPTOM_KEYS.BREAST_L_NIPPLE_DISCHARGE);
    else if (breastSide === "right") keysSet.add(SYMPTOM_KEYS.BREAST_R_NIPPLE_DISCHARGE);
    else {
      keysSet.add(SYMPTOM_KEYS.BREAST_L_NIPPLE_DISCHARGE);
      keysSet.add(SYMPTOM_KEYS.BREAST_R_NIPPLE_DISCHARGE);
    }
  }

  if (primaryConcerns.includes("neck_lump")) {
    if (neckSide === "left") keysSet.add(SYMPTOM_KEYS.NECK_L_LUMP);
    else if (neckSide === "right") keysSet.add(SYMPTOM_KEYS.NECK_R_LUMP);
    else {
      keysSet.add(SYMPTOM_KEYS.NECK_L_LUMP);
      keysSet.add(SYMPTOM_KEYS.NECK_R_LUMP);
    }
  }

  if (primaryConcerns.includes("armpit_lump")) {
    if (armpitSide === "left") keysSet.add(SYMPTOM_KEYS.ARM_L_LUMP);
    else if (armpitSide === "right") keysSet.add(SYMPTOM_KEYS.ARM_R_LUMP);
    else {
      keysSet.add(SYMPTOM_KEYS.ARM_L_LUMP);
      keysSet.add(SYMPTOM_KEYS.ARM_R_LUMP);
    }
  }

  if (primaryConcerns.includes("cough")) keysSet.add(SYMPTOM_KEYS.RES_COUGH);
  if (primaryConcerns.includes("breathlessness")) keysSet.add(SYMPTOM_KEYS.RES_BREATHLESSNESS);
  if (primaryConcerns.includes("headache_dizziness") || primaryConcerns.includes("headache")) keysSet.add(SYMPTOM_KEYS.CNS_HEADACHE);
  if (primaryConcerns.includes("nausea_vomiting") || primaryConcerns.includes("nausea")) keysSet.add(SYMPTOM_KEYS.CNS_NAUSEA);
  if (primaryConcerns.includes("convulsion")) keysSet.add(SYMPTOM_KEYS.CNS_CONVULSION);
  if (primaryConcerns.includes("back_pain")) keysSet.add(SYMPTOM_KEYS.UMS_BACK_PAIN);
  if (primaryConcerns.includes("shoulder_pain")) keysSet.add(SYMPTOM_KEYS.UMS_SHOULDER_PAIN);
  if (primaryConcerns.includes("underarm_pain")) keysSet.add(SYMPTOM_KEYS.UMS_UNDERARM_PAIN);

  return Array.from(keysSet);
}

export function calculateCareGuidance(answers: QuestionnaireAnswer[]): CareGuidanceResult {
  const selectedKeys = mapAnswersToSymptomKeys(answers);
  const reasons: string[] = [];

  const getAnswer = (qId: string) => answers.find((a) => a.questionId.toLowerCase() === qId.toLowerCase());
  const getVal = (qId: string): string => {
    const a = getAnswer(qId);
    if (!a) return "";
    return String(a.value).toLowerCase();
  };

  let isHigh = false;
  let isMedium = false;

  if (selectedKeys.includes(SYMPTOM_KEYS.CNS_CONVULSION)) {
    isHigh = true;
    reasons.push("Convulsion or seizure-like episode reported (Requires urgent medical evaluation)");
  }

  if (selectedKeys.includes(SYMPTOM_KEYS.BREAST_L_PALPABLE) || selectedKeys.includes(SYMPTOM_KEYS.BREAST_R_PALPABLE)) {
    isMedium = true;
    reasons.push("Palpable breast lump or thickening reported");
  }

  if (selectedKeys.includes(SYMPTOM_KEYS.BREAST_L_NIPPLE_DISCHARGE) || selectedKeys.includes(SYMPTOM_KEYS.BREAST_R_NIPPLE_DISCHARGE)) {
    isMedium = true;
    reasons.push("Nipple discharge reported");
  }

  if (selectedKeys.includes(SYMPTOM_KEYS.BREAST_L_CHANGES_SHAPE) || selectedKeys.includes(SYMPTOM_KEYS.BREAST_R_CHANGES_SHAPE)) {
    isMedium = true;
    reasons.push("Changes in breast shape or contour reported");
  }

  const level = isHigh ? "HIGH" : isMedium ? "MEDIUM" : "LOW";

  return {
    level,
    reasons,
    message: level === "HIGH" 
      ? "Prompt clinical evaluation recommended." 
      : level === "MEDIUM" 
      ? "Clinical examination recommended." 
      : "Routine preventive care recommended.",
    emergencyAlert: isHigh ? "Urgent attention indicated." : undefined,
    disclaimer: "This assessment is not a diagnosis.",
    selectedSymptomKeys: selectedKeys,
    patientSummaryItems: [],
    doctorSummaryItems: []
  };
}
