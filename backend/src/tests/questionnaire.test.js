const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const repo = require('../db/repository');
const { calculateClinicalRiskAnalysis } = require('../services/clinicalEngine');

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('Questionnaire: Fetch all questions and validate grouping by clinical phase', async () => {
  const res = await fetch(`${baseUrl}/questions`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.questions));
  assert.ok(data.questions.length >= 10, 'Expected at least 10 question categories');

  // Group by clinical phase
  const phaseMap = { 0: [], 1: [], 2: [], 3: [] };
  data.questions.forEach(q => {
    const p = q.phase !== undefined ? q.phase : 1;
    if (phaseMap[p]) {
      phaseMap[p].push(q);
    }
  });

  // Verify Phase 0 baseline questions exist
  assert.ok(phaseMap[0].length >= 5, 'Phase 0 must have baseline risk questions');

  // Verify Phase 1 primary breast categories exist
  assert.ok(phaseMap[1].length >= 2, 'Phase 1 must have Left and Right breast categories');

  // Verify Phase 2 regional spread categories exist
  assert.ok(phaseMap[2].length >= 2, 'Phase 2 must have Neck and Arm categories');

  // Verify Phase 3 systemic categories exist
  assert.ok(phaseMap[3].length >= 3, 'Phase 3 must have Respiratory, CNS, and Muscular categories');
});

test('Questionnaire: Validate question schema, options, and clinical scoring metadata', async () => {
  const questions = await repo.getAllQuestions();

  questions.forEach(q => {
    // 1. Must have an ID
    assert.ok(q.id, 'Every question category must have an id');
    // 2. Must have text or category name
    assert.ok(q.question || q.category, `Question ${q.id} must have question text or category`);
    // 3. Must have phase
    assert.ok(typeof q.phase === 'number', `Question ${q.id} must have numeric phase`);
    // 4. Must have options/answers array
    assert.ok(Array.isArray(q.options), `Question ${q.id} must have options array`);
    assert.ok(q.options.length > 0, `Question ${q.id} options array must not be empty`);

    // 5. If options are symptom objects, validate weight and clinical relevance
    if (typeof q.options[0] === 'object' && q.options[0] !== null) {
      q.options.forEach(opt => {
        assert.ok(opt.label || opt.converted_name, `Option in ${q.id} must have label or converted_name`);
        if (opt.weight !== undefined) {
          assert.ok(typeof opt.weight === 'number', `Option ${opt.label} weight must be a number`);
          assert.ok(opt.weight >= 1 && opt.weight <= 5, `Option ${opt.label} weight must be between 1 and 5`);
        }
        if (opt.relevance !== undefined) {
          assert.ok(['L', 'M', 'H'].includes(opt.relevance), `Option ${opt.label} relevance must be L, M, or H`);
        }
      });
    }
  });
});

test('Questionnaire Scenario A (Low / Normal Risk): Ordinary screening case calculation', async () => {
  // Scenario A matches patient Himanshi (32 yrs, no family history, normal lifestyle, no breast or systemic symptoms)
  const profile = {
    age: '30–40 years',
    ageAtMarriage: '26–30 years',
    ageAtFirstChild: 'Age < 30 years',
    numberOfChildren: '2',
    breastfeeding: 'Yes (> 6 months)',
    contraceptives: 'Never used',
    familyHistory: 'No family history',
    smoking: 'Never smoked',
    diet: 'Vegetarian'
  };

  const answersMap = {
    'Symptoms on Left Breast – Palpable Lump / Abnormality': 'No',
    'Symptoms on Left Breast – Pain': 'No',
    'Symptoms on Right Breast – Palpable Lump / Abnormality': 'No',
    'Symptoms on Neck – Lump': 'No',
    'Respiratory Symptoms – Cough': 'No'
  };

  const result = calculateClinicalRiskAnalysis(profile, answersMap);

  assert.equal(result.tier, 'Low');
  assert.equal(result.brm.score, 0);
  assert.equal(result.totalScore, 0);
  assert.equal(result.override.triggered, false);
  assert.ok(result.recommendation.toLowerCase().includes('routine'));
  assert.ok(typeof result.interpretation === 'string');
});

test('Questionnaire Scenario B (Moderate Risk): Documented moderate risk scoring rules', async () => {
  // Scenario B: Age > 40 (+2), long-term contraceptives (+1), former smoker (+1), localized breast pain (+1)
  const profile = {
    age: '41–50 years',
    ageAtMarriage: '20–25 years',
    ageAtFirstChild: 'Age ≥ 30 years',
    numberOfChildren: '1',
    breastfeeding: 'No / Never breastfed',
    contraceptives: 'Used > 5 years (Long-term)',
    familyHistory: 'No family history',
    smoking: 'Former smoker',
    diet: 'Non-vegetarian'
  };

  // Symptoms totaling between 8.1 and 16.0 points
  const answersMap = {
    'Symptoms on Left Breast – Pain': 'Yes', // 1 pt
    'Symptoms on Neck – Swelling': 'Yes' // 2 pts * 1.1 multiplier = 2.2
  };

  const result = calculateClinicalRiskAnalysis(profile, answersMap);

  assert.equal(result.tier, 'Moderate');
  assert.ok(result.totalScore >= 8.1 && result.totalScore <= 16.0, `Score ${result.totalScore} must be Moderate tier (8.1 - 16.0)`);
  assert.equal(result.override.triggered, false);
  assert.ok(result.recommendation.toLowerCase().includes('2–4 weeks') || result.recommendation.toLowerCase().includes('consultation'));
});

test('Questionnaire Scenario C (High / Urgent Risk): Safety escalation override execution', async () => {
  // Scenario C: Metastatic pattern alert (Primary breast finding + Systemic respiratory symptom)
  const profile = {
    age: '> 50 years',
    familyHistory: 'Yes (Mother / Sister / Daughter)',
    contraceptives: 'Used > 5 years (Long-term)',
    smoking: 'Current smoker'
  };

  const answersMap = {
    'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes',
    'Symptoms on Left Breast – Skin Dimpling': 'Yes',
    'Respiratory Symptoms – Breathlessness': 'Yes'
  };

  const result = calculateClinicalRiskAnalysis(profile, answersMap);

  assert.equal(result.tier, 'Urgent');
  assert.equal(result.override.triggered, true);
  assert.equal(result.override.ruleName, 'Metastatic Pattern Alert');
  assert.ok(result.recommendation.toLowerCase().includes('24–48 hours') || result.recommendation.toLowerCase().includes('oncologist'));
  assert.ok(result.interpretation.includes('Safety Escalation'));
});
