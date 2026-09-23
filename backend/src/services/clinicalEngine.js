/**
 * Clinical Risk Analysis Engine
 * Ported directly from verified BreastCare clinical assessment algorithm.
 * Implements: Phase 0 (Baseline Risk Modifier) -> Phase 1 (Primary) -> Phase 2 (Regional) -> Phase 3 (Systemic) -> Phase 4 (Scoring, Overrides, Recommendations).
 */

const questionsData = require('../db/symptoms_questions.json');

/**
 * Calculates Baseline Risk Modifier (Phase 0) based on clinical reproductive/lifestyle/family history.
 */
function calculateBaselineRiskModifier(profile = {}) {
  const breakdown = [];
  let score = 0;

  // 1. Family History (+3)
  const fam = (profile.familyHistory || '').toLowerCase();
  if (fam.includes('mother') || fam.includes('sister') || fam.includes('daughter') || fam.includes('yes')) {
    score += 3;
    breakdown.push({
      factor: 'Family History of Breast/Ovarian Cancer',
      points: 3,
      note: profile.familyHistory || 'Family history reported'
    });
  }

  // 2. Age > 40 (+2)
  const ageStr = String(profile.age || '');
  const parsedAge = parseInt(ageStr, 10);
  const isOver40 = parsedAge > 40 || ageStr.includes('41') || ageStr.includes('50') || ageStr.includes('> 40') || ageStr.includes('> 50') || ageStr.includes('40-');
  if (isOver40) {
    score += 2;
    breakdown.push({
      factor: 'Age > 40 years',
      points: 2,
      note: `Age: ${profile.age}`
    });
  }

  // 3. Breastfeeding history: None (+1)
  const bf = (profile.breastfeeding || '').toLowerCase();
  if (bf.includes('never') || bf.includes('no') || bf.includes('none')) {
    score += 1;
    breakdown.push({
      factor: 'No Breastfeeding History',
      points: 1,
      note: profile.breastfeeding || 'Never breastfed'
    });
  }

  // 4. Hormonal contraceptives: Long-term / >5 years (+1)
  const hc = (profile.contraceptives || '').toLowerCase();
  if (hc.includes('long') || hc.includes('> 5') || hc.includes('5 years') || hc.includes('5+')) {
    score += 1;
    breakdown.push({
      factor: 'Long-term Hormonal Contraceptive Use',
      points: 1,
      note: profile.contraceptives || 'Long-term use'
    });
  }

  // 5. No children / late first childbirth (>30) (+1)
  const numKids = (profile.numberOfChildren || '').toLowerCase();
  const firstChild = (profile.ageAtFirstChild || '').toLowerCase();
  if (numKids === '0' || numKids.includes('no children') || firstChild.includes('>30') || firstChild.includes('≥30') || firstChild.includes('30+') || firstChild.includes('no children')) {
    score += 1;
    breakdown.push({
      factor: 'Nulliparity or First Childbirth > 30 Years',
      points: 1,
      note: profile.ageAtFirstChild || profile.numberOfChildren || 'Late / no childbirth'
    });
  }

  // 6. Smoking (+1)
  const sm = (profile.smoking || '').toLowerCase();
  if (sm.includes('current') || sm.includes('former') || sm.includes('yes')) {
    score += 1;
    breakdown.push({
      factor: 'Smoking History',
      points: 1,
      note: profile.smoking || 'Smoker'
    });
  }

  return { score, breakdown };
}

/**
 * Checks for clinical escalation safety net overrides.
 */
function checkEscalationOverrides(answers = {}) {
  const isYes = (name) => {
    const key = Object.keys(answers).find(k => k.toLowerCase().includes(name.toLowerCase()));
    return key ? answers[key] === 'Yes' : false;
  };

  const hasPositivePhase1 = Object.entries(answers).some(([k, v]) => {
    return v === 'Yes' && (k.includes('Left Breast') || k.includes('Right Breast'));
  });

  const hasPositivePhase3 = Object.entries(answers).some(([k, v]) => {
    return v === 'Yes' && (k.includes('Respiratory') || k.includes('CNS') || k.includes('Muscular'));
  });

  // Override 1: Any Phase 1 (Breast) AND Any Phase 3 (Systemic) -> Potential metastatic pattern
  if (hasPositivePhase1 && hasPositivePhase3) {
    return {
      triggered: true,
      ruleName: 'Metastatic Pattern Alert',
      reason: 'Concomitant primary breast findings and systemic symptoms detected (requires prompt systemic staging).'
    };
  }

  // Override 2: Classic Malignancy Triad (Nipple Retraction + Discharge + Skin Dimpling)
  const leftTriad = isYes('Left Breast – Nipple Retraction') && isYes('Left Breast – Nipple Discharge') && isYes('Left Breast – Skin Dimpling');
  const rightTriad = isYes('Right Breast – Nipple Retraction') && isYes('Right Breast – Nipple Discharge') && isYes('Right Breast – Skin Dimpling');
  if (leftTriad || rightTriad) {
    return {
      triggered: true,
      ruleName: 'Classic Malignancy Triad',
      reason: 'Co-occurrence of nipple retraction, nipple discharge, and skin dimpling represents a classic clinical cluster requiring immediate evaluation.'
    };
  }

  // Override 3: Ulcer or non-healing wound on breast or neck
  const hasUlcerOrWound = isYes('Breast – Ulcer') || isYes('Breast – Wound') || isYes('Neck – Bleeding') || isYes('Neck – Ulcer') || isYes('Neck – Wound');
  if (hasUlcerOrWound) {
    return {
      triggered: true,
      ruleName: 'Ulcerative / Open Skin Lesion Alert',
      reason: 'Ulcer, wound, or active bleeding on breast or neck tissue requires prompt clinical evaluation.'
    };
  }

  return { triggered: false, reason: null, ruleName: null };
}

/**
 * Computes phased symptom score with clinical relevance weights and dynamic multipliers.
 */
function calculatePhasedSymptomScore(answers = {}) {
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
    (cat.options || []).forEach(opt => {
      if (answers[opt.converted_name] === 'Yes') {
        const weight = opt.weight || 2;
        if (phase === 1) {
          p1Raw += weight;
          p1Count++;
          if (weight >= 3 || opt.relevance === 'H') p1HasHighRisk = true;
        } else if (phase === 2) {
          p2Raw += weight;
          p2Count++;
          if (weight >= 3 || opt.relevance === 'H') p2HasHighRisk = true;
        } else {
          p3Raw += weight;
          p3Count++;
        }
      }
    });
  });

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
 * Full Phased Clinical Risk Analysis Engine
 */
function calculateClinicalRiskAnalysis(profile = {}, answers = {}) {
  const brm = calculateBaselineRiskModifier(profile);
  const symptomScoring = calculatePhasedSymptomScore(answers);
  const override = checkEscalationOverrides(answers);

  const rawTotal = Math.round((symptomScoring.totalSymptomScore + brm.score) * 10) / 10;

  let tier = 'Low';
  if (override.triggered || rawTotal >= 24.1) {
    tier = 'Urgent';
  } else if (rawTotal >= 16.1) {
    tier = 'High';
  } else if (rawTotal >= 8.1) {
    tier = 'Moderate';
  } else {
    tier = 'Low';
  }

  const keyFindings = [];
  Object.entries(answers).forEach(([symptom, val]) => {
    if (val === 'Yes') {
      keyFindings.push(symptom);
    }
  });

  let recommendation = '';
  let interpretation = '';

  if (tier === 'Urgent') {
    recommendation = 'Prompt in-person clinical evaluation is strongly recommended. Please consult a breast oncologist or breast surgeon within 24–48 hours for diagnostic evaluation (clinical exam, bilateral mammography, ultrasound, and/or biopsy).';
    interpretation = override.triggered
      ? `Safety Escalation: ${override.reason} Total weighted score: ${rawTotal} points.`
      : `High-acuity symptom cluster detected across multiple screening domains (Total score: ${rawTotal} pts). Immediate specialist review advised.`;
  } else if (tier === 'High') {
    recommendation = 'Clinical evaluation within a few days is recommended. Schedule an appointment with a breast health clinician for focused examination and diagnostic breast imaging.';
    interpretation = `Significant clinical symptoms reported with elevated risk weighting (Total score: ${rawTotal} pts, including Baseline Risk Modifier: +${brm.score}).`;
  } else if (tier === 'Moderate') {
    recommendation = 'Schedule a clinical breast consultation within 2–4 weeks. A healthcare provider will perform a physical examination and determine if imaging or observation is appropriate.';
    interpretation = `Moderate symptom indicators noted (Total score: ${rawTotal} pts). Many findings in this range are benign, but timely clinical evaluation ensures complete safety.`;
  } else {
    recommendation = 'Continue routine breast self-awareness, periodic clinical screening, and age-appropriate mammography as recommended by your physician.';
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

module.exports = {
  calculateBaselineRiskModifier,
  checkEscalationOverrides,
  calculatePhasedSymptomScore,
  calculateClinicalRiskAnalysis
};
