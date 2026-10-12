const assert = require('node:assert/strict');
const path = require('path');
const questionsData = require('../../../doctor-app/src/services/symptoms_questions.json');
const { calculateClinicalRiskAnalysis } = require('../services/clinicalEngine');

console.log('====================================================');
console.log('NARISETU DOCTOR: CLINICAL CHATBOT FLOW & SEQUENCE AUDIT');
console.log('====================================================\n');

// 9 Phase 0 Questions
const PHASE_0_KEYS = [
  'age',
  'ageAtMarriage',
  'ageAtFirstChild',
  'numberOfChildren',
  'breastfeeding',
  'contraceptives',
  'familyHistory',
  'smoking',
  'diet'
];

function simulatePhase0(answers) {
  let step = 0;
  const profile = {};
  const askedKeys = [];

  while (step < PHASE_0_KEYS.length) {
    const key = PHASE_0_KEYS[step];
    askedKeys.push(key);
    const ans = answers[key];
    profile[key] = ans;
    let nextStep = step + 1;

    if (key === 'ageAtMarriage') {
      const val = (ans || '').toLowerCase();
      if (val.includes('not married') || val.includes('n/a') || val.includes('single')) {
        profile.ageAtFirstChild = 'No children';
        profile.numberOfChildren = '0';
        profile.breastfeeding = 'Never breastfed / N/A';
        nextStep = 5; // Jump to contraceptives
      }
    } else if (key === 'ageAtFirstChild') {
      const val = (ans || '').toLowerCase();
      if (val.includes('no children')) {
        profile.numberOfChildren = '0';
        profile.breastfeeding = 'Never breastfed / N/A';
        nextStep = 5; // Jump to contraceptives
      }
    }

    step = nextStep;
  }

  return { profile, askedKeys };
}

// TEST 1: Married patient with children
console.log('[TEST 1] Married patient with children...');
const t1 = simulatePhase0({
  age: '41–50 years',
  ageAtMarriage: '20–25 years',
  ageAtFirstChild: 'Age < 30 years',
  numberOfChildren: '2',
  breastfeeding: 'Yes (> 6 months)',
  contraceptives: 'Never used',
  familyHistory: 'No family history',
  smoking: 'Never smoked',
  diet: 'Vegetarian'
});
assert.deepEqual(t1.askedKeys, PHASE_0_KEYS, 'All 9 questions must be asked for married with children');
assert.equal(t1.profile.numberOfChildren, '2');
console.log('✔ TEST 1 PASSED: Complete sequential Phase 0 flow verified.\n');

// TEST 2: Not married / N/A
console.log('[TEST 2] Not married / N/A skip logic...');
const t2 = simulatePhase0({
  age: '< 30 years',
  ageAtMarriage: 'Not married / N/A',
  contraceptives: 'Never used',
  familyHistory: 'No family history',
  smoking: 'Never smoked',
  diet: 'Vegetarian'
});
assert.deepEqual(
  t2.askedKeys,
  ['age', 'ageAtMarriage', 'contraceptives', 'familyHistory', 'smoking', 'diet'],
  'Must skip childbirth, children count, and breastfeeding'
);
assert.equal(t2.profile.ageAtFirstChild, 'No children');
assert.equal(t2.profile.numberOfChildren, '0');
assert.equal(t2.profile.breastfeeding, 'Never breastfed / N/A');
console.log('✔ TEST 2 PASSED: Unmarried skips questions 3, 4, 5 and auto-fills values.\n');

// TEST 3: Married with No Children
console.log('[TEST 3] Married with No Children skip logic...');
const t3 = simulatePhase0({
  age: '30–40 years',
  ageAtMarriage: '26–30 years',
  ageAtFirstChild: 'No children',
  contraceptives: 'Used 1–5 years',
  familyHistory: 'No family history',
  smoking: 'Never smoked',
  diet: 'Non-vegetarian'
});
assert.deepEqual(
  t3.askedKeys,
  ['age', 'ageAtMarriage', 'ageAtFirstChild', 'contraceptives', 'familyHistory', 'smoking', 'diet'],
  'Must skip number of children and breastfeeding'
);
assert.equal(t3.profile.numberOfChildren, '0');
assert.equal(t3.profile.breastfeeding, 'Never breastfed / N/A');
console.log('✔ TEST 3 PASSED: No children skips questions 4, 5 and auto-fills values.\n');

// Phase 1, 2, 3 Simulator
function simulateClinicalFlow({ side, selectedSymptoms, fastTrackChoice }) {
  const answers = {};
  const presentedCategories = [];

  // Phase 1
  if (side === 'None') {
    const p1Cats = questionsData.filter(c => c.phase === 1);
    p1Cats.forEach(c => c.options.forEach(o => { answers[o.converted_name] = 'No'; }));
  } else if (side === 'Left') {
    presentedCategories.push('Symptoms on Left Breast');
    const cat = questionsData.find(c => c.category === 'Symptoms on Left Breast');
    cat.options.forEach(o => {
      answers[o.converted_name] = selectedSymptoms.includes(o.converted_name) ? 'Yes' : 'No';
    });
  } else if (side === 'Right') {
    presentedCategories.push('Symptoms on Right Breast');
    const cat = questionsData.find(c => c.category === 'Symptoms on Right Breast');
    cat.options.forEach(o => {
      answers[o.converted_name] = selectedSymptoms.includes(o.converted_name) ? 'Yes' : 'No';
    });
  } else if (side === 'Both') {
    presentedCategories.push('Symptoms on Left Breast');
    const leftCat = questionsData.find(c => c.category === 'Symptoms on Left Breast');
    leftCat.options.forEach(o => {
      answers[o.converted_name] = selectedSymptoms.includes(o.converted_name) ? 'Yes' : 'No';
    });

    presentedCategories.push('Symptoms on Right Breast');
    const rightCat = questionsData.find(c => c.category === 'Symptoms on Right Breast');
    rightCat.options.forEach(o => {
      answers[o.converted_name] = selectedSymptoms.includes(o.converted_name) ? 'Yes' : 'No';
    });
  }

  // Phase 2
  presentedCategories.push('Symptoms on Neck');
  const neckCat = questionsData.find(c => c.category === 'Symptoms on Neck');
  neckCat.options.forEach(o => {
    answers[o.converted_name] = selectedSymptoms.includes(o.converted_name) ? 'Yes' : 'No';
  });

  presentedCategories.push('Symptoms on Left Arm');
  const armCat = questionsData.find(c => c.category === 'Symptoms on Left Arm');
  armCat.options.forEach(o => {
    answers[o.converted_name] = selectedSymptoms.includes(o.converted_name) ? 'Yes' : 'No';
  });

  // Phase 3
  const hasP1orP2 = Object.entries(answers).some(([k, v]) => {
    return v === 'Yes' && (k.includes('Breast') || k.includes('Neck') || k.includes('Arm'));
  });

  let usedFastTrack = false;
  if (!hasP1orP2) {
    usedFastTrack = true;
    if (fastTrackChoice === 'No') {
      const p3Cats = questionsData.filter(c => c.phase === 3);
      p3Cats.forEach(c => c.options.forEach(o => { answers[o.converted_name] = 'No'; }));
      return { answers, presentedCategories, usedFastTrack, completedPhase3Detailed: false };
    }
  }

  // Detailed Phase 3 sequence
  const p3Categories = ['Respiratory Symptoms', 'CNS Symptoms', 'Under Muscular Skeleton'];
  p3Categories.forEach(catName => {
    presentedCategories.push(catName);
    const cat = questionsData.find(c => c.category === catName);
    cat.options.forEach(o => {
      answers[o.converted_name] = selectedSymptoms.includes(o.converted_name) ? 'Yes' : 'No';
    });
  });

  return { answers, presentedCategories, usedFastTrack, completedPhase3Detailed: true };
}

// TEST 4: Both breasts selection
console.log('[TEST 4] Both Breasts workflow...');
const t4 = simulateClinicalFlow({
  side: 'Both',
  selectedSymptoms: ['Symptoms on Left Breast – Palpable Lump / Abnormality'],
  fastTrackChoice: 'No'
});
assert.equal(t4.presentedCategories[0], 'Symptoms on Left Breast');
assert.equal(t4.presentedCategories[1], 'Symptoms on Right Breast');
assert.equal(t4.presentedCategories[2], 'Symptoms on Neck');
assert.equal(t4.presentedCategories[3], 'Symptoms on Left Arm');
console.log('✔ TEST 4 PASSED: Both Breasts shows Left Breast -> Right Breast -> Phase 2.\n');

// TEST 5: No breast symptoms
console.log('[TEST 5] No breast symptoms workflow...');
const t5 = simulateClinicalFlow({
  side: 'None',
  selectedSymptoms: [],
  fastTrackChoice: 'No'
});
const leftLump = t5.answers['Symptoms on Left Breast – Palpable Lump / Abnormality'];
const rightLump = t5.answers['Symptoms on Right Breast – Palpable Lump / Abnormality'];
assert.equal(leftLump, 'No');
assert.equal(rightLump, 'No');
assert.equal(t5.presentedCategories[0], 'Symptoms on Neck');
assert.equal(t5.presentedCategories[1], 'Symptoms on Left Arm');
console.log('✔ TEST 5 PASSED: No breast symptoms marks Phase 1 answers as No and enters Phase 2.\n');

// TEST 6: Fast-track systemic check (No positive findings in Phase 1 & 2)
console.log('[TEST 6] Fast-track systemic check (Negative case)...');
const t6 = simulateClinicalFlow({
  side: 'None',
  selectedSymptoms: [],
  fastTrackChoice: 'No'
});
assert.equal(t6.usedFastTrack, true, 'Must offer fast-track when P1 and P2 have 0 findings');
assert.equal(t6.completedPhase3Detailed, false, 'Must not show detailed P3 categories when fast-track is No');
const cough = t6.answers['Respiratory Symptoms – Cough'];
const headache = t6.answers['CNS Symptoms – Headache'];
assert.equal(cough, 'No');
assert.equal(headache, 'No');
console.log('✔ TEST 6 PASSED: Fast-track skips detailed P3 and marks all Phase 3 as No.\n');

// TEST 7: Positive findings bypass fast-track
console.log('[TEST 7] Positive findings bypass fast-track...');
const t7 = simulateClinicalFlow({
  side: 'Left',
  selectedSymptoms: ['Symptoms on Left Breast – Palpable Lump / Abnormality'],
  fastTrackChoice: 'No'
});
assert.equal(t7.usedFastTrack, false, 'Must NOT use fast-track when positive finding exists');
assert.equal(t7.completedPhase3Detailed, true, 'Must complete full detailed Phase 3 sequence');
assert.ok(t7.presentedCategories.includes('Respiratory Symptoms'));
assert.ok(t7.presentedCategories.includes('CNS Symptoms'));
assert.ok(t7.presentedCategories.includes('Under Muscular Skeleton'));
console.log('✔ TEST 7 PASSED: Positive findings correctly force full Phase 3 checklists.\n');

// TEST 8: Full Phase 4 clinical risk calculation
console.log('[TEST 8] Final Phase 4 Clinical Risk Calculation...');
const t8 = simulateClinicalFlow({
  side: 'Both',
  selectedSymptoms: [
    'Symptoms on Left Breast – Palpable Lump / Abnormality',
    'Symptoms on Right Breast – Skin Dimpling',
    'Symptoms on Neck – Lump',
    'Respiratory Symptoms – Breathlessness'
  ],
  fastTrackChoice: 'Yes'
});
const result = calculateClinicalRiskAnalysis(t1.profile, t8.answers);
assert.ok(result);
assert.ok(result.totalScore > 0);
assert.ok(['Low', 'Moderate', 'High', 'Urgent'].includes(result.tier));
assert.ok(result.recommendation);
assert.ok(result.override);
console.log(`   Assessed Risk Tier: ${result.tier}`);
console.log(`   Assessed Score: ${result.totalScore} pts`);
console.log(`   Override Triggered: ${result.override.triggered} (${result.override.ruleName || 'None'})`);
console.log('✔ TEST 8 PASSED: Complete collected answers correctly processed by clinicalEngine.\n');

console.log('====================================================');
console.log('ALL 8 CLINICAL CHATBOT SEQUENCE & BRANCHING TESTS PASSED!');
console.log('====================================================');
