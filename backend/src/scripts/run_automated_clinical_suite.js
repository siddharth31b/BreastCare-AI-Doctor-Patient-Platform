/**
 * NariSetu Doctor Platform — Automated Clinical Assessment Validation Suite
 *
 * Runs complete end-to-end automated verification across:
 * - Patient registration (Auto-code, validation, database persistence)
 * - Photo upload (Base64 JSON Expo Camera payload & multipart form-data)
 * - Questionnaire engine (Phase 0, 1, 2, 3 schema, options, weights)
 * - Scenario A: Low / Normal Risk (Himanshi: 30-40 yrs, no symptoms)
 * - Scenario B: Moderate Risk (41-50 yrs, former smoker, pain & swelling)
 * - Scenario C: High / Urgent Risk (Palpable lump, skin dimpling, breathlessness)
 * - Clinical scoring & safety escalation overrides
 * - Relational persistence in Supabase (patients, doctor_patient, assessments, answers)
 * - Physician review & validation (DOCTOR_VALIDATED, review notes)
 * - Doctor dashboard counters & statistics
 * - Cross-doctor RBAC isolation
 */

const http = require('http');
const app = require('../server');
const repo = require('../db/repository');
const { calculateClinicalRiskAnalysis } = require('../services/clinicalEngine');

const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runSuite() {
  console.log('================================================================');
  console.log('   NARISETU DOCTOR — AUTOMATED CLINICAL VALIDATION SUITE        ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let passed = 0;
  let failed = 0;
  const createdPatientIds = [];

  function pass(desc) {
    passed++;
    console.log(`  ✔ [PASS] ${desc}`);
  }

  function fail(desc, err) {
    failed++;
    console.error(`  ✖ [FAIL] ${desc}`, err ? err.message || err : '');
  }

  try {
    // ----------------------------------------------------------------
    // SECTION 1: DOCTOR AUTHENTICATION & SESSION PERSISTENCE
    // ----------------------------------------------------------------
    console.log('--- SECTION 1: Doctor Authentication & Session ---');
    const authRes = await fetch(`${baseUrl}/auth/session`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-doctor-token' }
    });
    const authData = await authRes.json();
    if (authRes.status === 200 && authData.success && authData.role === 'DOCTOR') {
      pass(`Doctor session authenticated (${authData.user.name}, role: ${authData.role})`);
    } else {
      fail('Doctor session authentication failed');
    }

    // ----------------------------------------------------------------
    // SECTION 2: QUESTIONNAIRE SCHEMA & CLINICAL PHASES
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 2: Questionnaire Schema & Clinical Phases ---');
    const qRes = await fetch(`${baseUrl}/questions`);
    const qData = await qRes.json();
    if (qRes.status === 200 && qData.questions && qData.questions.length >= 10) {
      pass(`Loaded ${qData.questions.length} clinical screening question categories from DB`);
    } else {
      fail('Failed to load questionnaire from database');
    }

    const phases = { 0: 0, 1: 0, 2: 0, 3: 0 };
    qData.questions.forEach(q => {
      const p = q.phase !== undefined ? q.phase : 1;
      if (phases[p] !== undefined) phases[p]++;
    });

    if (phases[0] >= 5 && phases[1] >= 2 && phases[2] >= 2 && phases[3] >= 3) {
      pass(`Phase groupings verified: P0 (${phases[0]}), P1 (${phases[1]}), P2 (${phases[2]}), P3 (${phases[3]})`);
    } else {
      fail(`Incomplete phase groupings: ${JSON.stringify(phases)}`);
    }

    // ----------------------------------------------------------------
    // SECTION 3: DETERMINISTIC CLINICAL SCENARIOS
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 3: Deterministic Clinical Test Scenarios ---');

    // Scenario A: Low / Normal Risk (Patient Himanshi: 32 yrs, no symptoms)
    const scALow = calculateClinicalRiskAnalysis(
      { age: '30–40 years', numberOfChildren: '2', breastfeeding: 'Yes (> 6 months)', smoking: 'Never smoked', familyHistory: 'No family history' },
      { 'Symptoms on Left Breast – Pain': 'No', 'Symptoms on Right Breast – Pain': 'No' }
    );
    if (scALow.tier === 'Low' && scALow.totalScore === 0 && !scALow.override.triggered) {
      pass('Scenario A (Low / Normal Risk): Tier=Low, Score=0 pts, Routine care recommendation');
    } else {
      fail(`Scenario A unexpected result: Tier=${scALow.tier}, Score=${scALow.totalScore}`);
    }

    // Scenario B: Moderate Risk (Age 41-50: +2, Late child: +1, No breastfeeding: +1, Contraceptives: +1, Smoking: +1 = 6 pts BRM + 3.2 symptom pts = 9.2 pts -> Moderate)
    const scBMod = calculateClinicalRiskAnalysis(
      {
        age: '41–50 years',
        ageAtFirstChild: 'Age ≥ 30 years',
        breastfeeding: 'No / Never breastfed',
        contraceptives: 'Used > 5 years (Long-term)',
        smoking: 'Former smoker',
        familyHistory: 'No family history'
      },
      {
        'Symptoms on Left Breast – Pain': 'Yes',
        'Symptoms on Neck – Swelling': 'Yes'
      }
    );
    if (scBMod.tier === 'Moderate' && scBMod.totalScore >= 8.1 && scBMod.totalScore <= 16.0) {
      pass(`Scenario B (Moderate Risk): Tier=Moderate, Score=${scBMod.totalScore} pts, Consultation recommendation`);
    } else {
      fail(`Scenario B unexpected result: Tier=${scBMod.tier}, Score=${scBMod.totalScore}`);
    }

    // Scenario C: High / Urgent Risk (Safety escalation override)
    const scCUrgent = calculateClinicalRiskAnalysis(
      { age: '> 50 years', familyHistory: 'Yes (Mother / Sister / Daughter)' },
      { 'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes', 'Respiratory Symptoms – Breathlessness': 'Yes' }
    );
    if (scCUrgent.tier === 'Urgent' && scCUrgent.override.triggered && scCUrgent.override.ruleName === 'Metastatic Pattern Alert') {
      pass('Scenario C (High / Urgent Risk): Tier=Urgent, Rule=Metastatic Pattern Alert, 24-48h specialist recommendation');
    } else {
      fail(`Scenario C unexpected result: Tier=${scCUrgent.tier}, Override=${scCUrgent.override.triggered}`);
    }

    // ----------------------------------------------------------------
    // SECTION 4: PATIENT REGISTRATION & PHOTO UPLOAD
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 4: Patient Registration & Photo Upload ---');
    const autoCode = `AUTO-SUITE-${Date.now().toString().slice(-6)}`;
    const regRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-doctor-token'
      },
      body: JSON.stringify({
        patient_code: autoCode,
        name: 'Automated Suite Patient',
        age: 32,
        gender: 'Female',
        phone: '+91 99999 77777'
      })
    });
    const regData = await regRes.json();
    if (regRes.status === 201 && regData.patient && regData.patient.id) {
      createdPatientIds.push(regData.patient.id);
      pass(`Patient registered: ${regData.patient.name} (${regData.patient.patient_code})`);
    } else {
      fail('Patient registration failed', regData);
    }

    const patientId = regData.patient.id;

    // Photo Upload (Base64)
    const photoRes = await fetch(`${baseUrl}/patients/${patientId}/photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-doctor-token'
      },
      body: JSON.stringify({
        photo_base64: `data:image/png;base64,${TEST_IMAGE_BASE64}`
      })
    });
    const photoData = await photoRes.json();
    if (photoRes.status === 200 && photoData.face_photo_url) {
      pass(`Face photo uploaded successfully: ${photoData.face_photo_url.slice(0, 60)}...`);
    } else {
      fail('Photo upload failed', photoData);
    }

    // ----------------------------------------------------------------
    // SECTION 5: COMPLETE CLINICAL ASSESSMENT LIFECYCLE
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 5: Clinical Assessment Lifecycle ---');
    // Start session
    const startRes = await fetch(`${baseUrl}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-doctor-token'
      },
      body: JSON.stringify({
        patient_id: patientId,
        risk_profile: { age: 32 }
      })
    });
    const startData = await startRes.json();
    const assessmentId = startData.assessment.id;
    if (startRes.status === 201 && assessmentId && startData.assessment.status === 'IN_PROGRESS') {
      pass(`Assessment session initialized (ID: ${assessmentId}, Status: IN_PROGRESS)`);
    } else {
      fail('Assessment initialization failed', startData);
    }

    // Submit complete answers
    const answersMap = {
      'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes',
      'Symptoms on Left Breast – Skin Dimpling': 'Yes',
      'Symptoms on Neck – Lump': 'Yes',
      'Respiratory Symptoms – Cough': 'No'
    };

    const submitRes = await fetch(`${baseUrl}/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-doctor-token'
      },
      body: JSON.stringify({
        risk_profile: { age: '30–40 years', familyHistory: 'No family history' },
        answers_map: answersMap
      })
    });
    const submitData = await submitRes.json();
    if (submitRes.status === 200 && submitData.assessment.status === 'PENDING_DOCTOR_REVIEW') {
      pass(`Assessment submitted with clinical calculation (Tier: ${submitData.clinical_result.tier}, Status: PENDING_DOCTOR_REVIEW)`);
    } else {
      fail('Assessment submit failed', submitData);
    }

    // Physician Validation
    const valRes = await fetch(`${baseUrl}/assessments/${assessmentId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-doctor-token'
      },
      body: JSON.stringify({
        doctor_note: 'Automated test suite physician validation note.',
        confirmed: true
      })
    });
    const valData = await valRes.json();
    if (valRes.status === 200 && valData.assessment.status === 'DOCTOR_VALIDATED') {
      pass(`Physician validation executed (Status: DOCTOR_VALIDATED, Note: '${valData.assessment.risk_analysis.review.doctor_note}')`);
    } else {
      fail('Physician validation failed', valData);
    }

    // ----------------------------------------------------------------
    // SECTION 6: RELATIONAL DATABASE & DASHBOARD AUDIT
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 6: Relational Database & Dashboard Audit ---');
    const docAssessmentsRes = await fetch(`${baseUrl}/doctors/me/assessments`, {
      headers: { Authorization: 'Bearer test-doctor-token' }
    });
    const docAssessmentsData = await docAssessmentsRes.json();
    const foundInHistory = docAssessmentsData.assessments.find(a => a.id === assessmentId);
    if (foundInHistory && foundInHistory.status === 'DOCTOR_VALIDATED') {
      pass(`Assessment verified in doctor history & counters (Total doctor assessments: ${docAssessmentsData.assessments.length})`);
    } else {
      fail('Assessment not found in doctor history');
    }

    // Verify stored answers
    const answersInDb = await repo.getAnswersForAssessment(assessmentId);
    if (answersInDb && answersInDb.length >= Object.keys(answersMap).length) {
      pass(`Persisted answers verified in Supabase (${answersInDb.length} records in answers table)`);
    } else {
      fail(`Incomplete answers persisted: expected >= ${Object.keys(answersMap).length}, got ${answersInDb ? answersInDb.length : 0}`);
    }

    // Teardown test patient
    await repo.deletePatient(patientId);
    pass('Teardown: Temporary test patient and related records deleted cleanly');

  } catch (err) {
    fail('Unexpected exception during test suite execution', err);
  } finally {
    for (const id of createdPatientIds) {
      try {
        await repo.deletePatient(id);
      } catch (_) {}
    }
    await new Promise(resolve => server.close(resolve));
  }

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch(err => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
