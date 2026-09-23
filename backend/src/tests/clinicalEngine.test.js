const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateBaselineRiskModifier,
  checkEscalationOverrides,
  calculatePhasedSymptomScore,
  calculateClinicalRiskAnalysis
} = require('../services/clinicalEngine');

test('Clinical Engine: Baseline Risk Modifier (Phase 0) calculation', () => {
  // Case 1: Minimal risk profile
  const brmLow = calculateBaselineRiskModifier({
    age: 32,
    familyHistory: 'No',
    breastfeeding: 'Yes (> 1 year)',
    contraceptives: 'Never used',
    numberOfChildren: '2',
    smoking: 'No'
  });
  assert.equal(brmLow.score, 0);

  // Case 2: Maximum risk profile
  const brmHigh = calculateBaselineRiskModifier({
    age: 52, // +2
    familyHistory: 'Mother had breast cancer', // +3
    breastfeeding: 'Never', // +1
    contraceptives: 'Long-term 6 years', // +1
    numberOfChildren: '0', // +1
    smoking: 'Current smoker' // +1
  });
  assert.equal(brmHigh.score, 9);
  assert.equal(brmHigh.breakdown.length, 6);
});

test('Clinical Engine: Safety Escalation Overrides', () => {
  // Override 1: Metastatic Pattern (Phase 1 + Phase 3)
  const metaOverride = checkEscalationOverrides({
    'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes',
    'Respiratory Symptoms – Breathlessness': 'Yes'
  });
  assert.equal(metaOverride.triggered, true);
  assert.equal(metaOverride.ruleName, 'Metastatic Pattern Alert');

  // Override 2: Classic Malignancy Triad
  const triadOverride = checkEscalationOverrides({
    'Symptoms on Right Breast – Nipple Retraction / Inversion': 'Yes',
    'Symptoms on Right Breast – Nipple Discharge': 'Yes',
    'Symptoms on Right Breast – Skin Dimpling': 'Yes'
  });
  assert.equal(triadOverride.triggered, true);
  assert.equal(triadOverride.ruleName, 'Classic Malignancy Triad');

  // Override 3: Ulcer or non-healing wound
  const ulcerOverride = checkEscalationOverrides({
    'Symptoms on Left Breast – Ulcer / Open Sore': 'Yes'
  });
  assert.equal(ulcerOverride.triggered, true);
  assert.equal(ulcerOverride.ruleName, 'Ulcerative / Open Skin Lesion Alert');

  // Negative case
  const noOverride = checkEscalationOverrides({
    'Symptoms on Left Breast – Pain': 'Yes'
  });
  assert.equal(noOverride.triggered, false);
});

test('Clinical Engine: Phased Scoring and Multipliers', () => {
  // Low-risk symptom: isolated pain (weight 1, multiplier 1.0)
  const scoreLow = calculatePhasedSymptomScore({
    'Symptoms on Left Breast – Pain': 'Yes'
  });
  assert.equal(scoreLow.phase1Score, 1);
  assert.equal(scoreLow.phase1Multiplier, 1.0);
  assert.equal(scoreLow.totalSymptomScore, 1.0);

  // High-risk symptom: Palpable lump (weight 3, multiplier 1.5)
  const scoreHigh = calculatePhasedSymptomScore({
    'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes'
  });
  assert.equal(scoreHigh.phase1Score, 3);
  assert.equal(scoreHigh.phase1Multiplier, 1.5);
  assert.equal(scoreHigh.phase1Weighted, 4.5);
  assert.equal(scoreHigh.totalSymptomScore, 4.5);
});

test('Clinical Engine: End-to-end Risk Tier Stratification and Recommendations', () => {
  // 1. Low Tier (< 8.1 pts)
  const lowResult = calculateClinicalRiskAnalysis(
    { age: 30 },
    { 'Symptoms on Left Breast – Pain': 'Yes' }
  );
  assert.equal(lowResult.tier, 'Low');
  assert.ok(lowResult.recommendation.includes('routine'));

  // 2. Urgent Tier via Safety Escalation Override
  const urgentResult = calculateClinicalRiskAnalysis(
    { age: 48, familyHistory: 'Mother' },
    {
      'Symptoms on Left Breast – Nipple Retraction / Inversion': 'Yes',
      'Symptoms on Left Breast – Nipple Discharge': 'Yes',
      'Symptoms on Left Breast – Skin Dimpling': 'Yes'
    }
  );
  assert.equal(urgentResult.tier, 'Urgent');
  assert.equal(urgentResult.override.triggered, true);
  assert.ok(urgentResult.recommendation.includes('within 24–48 hours'));
  assert.ok(urgentResult.keyFindings.length >= 3);
});
