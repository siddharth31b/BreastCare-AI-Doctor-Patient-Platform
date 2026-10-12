const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const repo = require('../db/repository');
const { calculateClinicalRiskAnalysis } = require('../services/clinicalEngine');

let server;
let baseUrl;
let testPatientId = null;

const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  if (testPatientId) {
    try {
      await repo.deletePatient(testPatientId);
    } catch (_) {}
  }
  await new Promise(resolve => server.close(resolve));
});

test('E2E Clinical Assessment: Complete 10-Stage Automated Doctor Tablet Lifecycle', async () => {
  // ==========================================
  // STAGE 1: DOCTOR AUTHENTICATION / SESSION
  // ==========================================
  const authRes = await fetch(`${baseUrl}/auth/session`, {
    method: 'POST',
    headers: { Authorization: 'Bearer test-doctor-token' }
  });
  assert.equal(authRes.status, 200, 'Stage 1 Failed: Doctor auth must return 200');
  const authData = await authRes.json();
  assert.equal(authData.success, true);
  assert.equal(authData.role, 'DOCTOR');
  const doctor = authData.user;
  assert.ok(doctor.id, 'Doctor ID must be present in session');

  // ==========================================
  // STAGE 2: INITIAL DASHBOARD VERIFICATION
  // ==========================================
  const initialPatientsRes = await fetch(`${baseUrl}/doctors/me/patients`, {
    headers: { Authorization: 'Bearer test-doctor-token' }
  });
  assert.equal(initialPatientsRes.status, 200);
  const initialPatientsData = await initialPatientsRes.json();
  const initialPatientCount = initialPatientsData.patients.length;

  const initialAssessmentsRes = await fetch(`${baseUrl}/doctors/me/assessments`, {
    headers: { Authorization: 'Bearer test-doctor-token' }
  });
  assert.equal(initialAssessmentsRes.status, 200);
  const initialAssessmentsData = await initialAssessmentsRes.json();
  const initialAssessmentCount = initialAssessmentsData.assessments.length;

  // ==========================================
  // STAGE 3: PATIENT REGISTRATION
  // ==========================================
  const patientCode = `AUTO-E2E-${Date.now().toString().slice(-6)}`;
  const regRes = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      patient_code: patientCode,
      name: 'E2E Assessment Patient',
      age: 48,
      gender: 'Female',
      phone: '+91 98765 00000'
    })
  });
  assert.equal(regRes.status, 201, 'Stage 3 Failed: Patient creation must return 201');
  const regData = await regRes.json();
  testPatientId = regData.patient.id;
  assert.ok(testPatientId, 'Registered patient must have valid UUID');
  assert.equal(regData.patient.patient_code, patientCode);

  // ==========================================
  // STAGE 4: PATIENT PHOTO UPLOAD
  // ==========================================
  const photoRes = await fetch(`${baseUrl}/patients/${testPatientId}/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      photo_base64: `data:image/png;base64,${TEST_IMAGE_BASE64}`
    })
  });
  assert.equal(photoRes.status, 200, 'Stage 4 Failed: Photo upload must return 200');
  const photoData = await photoRes.json();
  assert.ok(photoData.face_photo_url, 'Must return signed face_photo_url');

  // Verify patient record updated with face_photo_url
  const patientAfterPhoto = await repo.getPatientById(testPatientId);
  assert.ok(patientAfterPhoto.face_photo_url, 'Patient face_photo_url must be persisted in database');

  // ==========================================
  // STAGE 5: ASSESSMENT INITIALIZATION
  // ==========================================
  const startRes = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      patient_id: testPatientId,
      risk_profile: { age: 48 }
    })
  });
  assert.equal(startRes.status, 201, 'Stage 5 Failed: Assessment start must return 201');
  const startData = await startRes.json();
  const assessmentId = startData.assessment.id;
  assert.ok(assessmentId, 'Assessment session must have valid UUID');
  assert.equal(startData.assessment.status, 'IN_PROGRESS');

  // ==========================================
  // STAGE 6: QUESTION RETRIEVAL & PHASE FLOW
  // ==========================================
  const qRes = await fetch(`${baseUrl}/questions`);
  assert.equal(qRes.status, 200);
  const qData = await qRes.json();
  assert.ok(qData.questions.length >= 10, 'Stage 6 Failed: Incomplete clinical questions loaded');

  // Simulate complete clinical answers through all phases:
  // Phase 0: Baseline Risk Profile (Age 48 -> +2, Mother -> +3, Former smoker -> +1, Long-term HC -> +1 = 7 pts)
  const riskProfile = {
    age: '41–50 years',
    ageAtMarriage: '20–25 years',
    ageAtFirstChild: 'Age ≥ 30 years',
    numberOfChildren: '1',
    breastfeeding: 'No / Never breastfed',
    contraceptives: 'Used > 5 years (Long-term)',
    familyHistory: 'Yes (Mother / Sister / Daughter)',
    smoking: 'Former smoker',
    diet: 'Non-vegetarian'
  };

  // Phase 1 + 2 + 3 Symptoms Map
  const answersMap = {
    'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes',
    'Symptoms on Left Breast – Skin Dimpling': 'Yes',
    'Symptoms on Left Breast – Pain': 'Yes',
    'Symptoms on Neck – Swelling': 'Yes',
    'Respiratory Symptoms – Breathlessness': 'Yes'
  };

  const answersList = Object.entries(answersMap).map(([question, answer]) => ({
    question,
    answer,
    answer_type: 'BOOLEAN',
    answered_at: new Date().toISOString()
  }));

  // ==========================================
  // STAGE 7: CLINICAL ENGINE EXECUTION & SUBMIT
  // ==========================================
  const submitRes = await fetch(`${baseUrl}/assessments/${assessmentId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      risk_profile: riskProfile,
      answers_map: answersMap,
      answers_list: answersList
    })
  });
  assert.equal(submitRes.status, 200, 'Stage 7 Failed: Assessment submission must return 200');
  const submitData = await submitRes.json();
  assert.equal(submitData.success, true);
  assert.equal(submitData.assessment.status, 'PENDING_DOCTOR_REVIEW');

  // Validate Clinical Analysis contract
  const clinicalResult = submitData.clinical_result;
  assert.ok(clinicalResult, 'Clinical risk analysis result must be returned');
  assert.ok(['Low', 'Moderate', 'High', 'Urgent'].includes(clinicalResult.tier), 'Valid risk tier must be assigned');
  assert.ok(clinicalResult.totalScore > 0, 'Total score must be calculated');
  assert.ok(clinicalResult.recommendation, 'Clinical recommendation must be generated');
  assert.ok(clinicalResult.interpretation, 'Clinical interpretation must be generated');
  assert.equal(clinicalResult.override.triggered, true, 'Metastatic pattern override must trigger');
  assert.equal(clinicalResult.tier, 'Urgent');

  // ==========================================
  // STAGE 8: PERSISTENCE & DATABASE VERIFICATION
  // ==========================================
  const persistedAssessment = await repo.getAssessmentById(assessmentId);
  assert.equal(persistedAssessment.id, assessmentId);
  assert.equal(persistedAssessment.status, 'PENDING_DOCTOR_REVIEW');
  assert.equal(persistedAssessment.risk_analysis.tier, 'Urgent');

  const persistedAnswers = await repo.getAnswersForAssessment(assessmentId);
  assert.ok(persistedAnswers.length >= answersList.length, 'All submitted answers must be persisted in answers table');

  // ==========================================
  // STAGE 9: FORMAL PHYSICIAN VALIDATION
  // ==========================================
  const validateRes = await fetch(`${baseUrl}/assessments/${assessmentId}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      doctor_note: 'Verified urgent metastatic presentation. Bilateral diagnostic workup initiated.',
      confirmed: true
    })
  });
  assert.equal(validateRes.status, 200, 'Stage 9 Failed: Validation must return 200');
  const validateData = await validateRes.json();
  assert.equal(validateData.assessment.status, 'DOCTOR_VALIDATED');
  assert.equal(validateData.assessment.risk_analysis.review.reviewed_by, doctor.name || 'Dr. Priya Sharma');

  // ==========================================
  // STAGE 10: DASHBOARD STATISTICS VERIFICATION
  // ==========================================
  const finalPatientsRes = await fetch(`${baseUrl}/doctors/me/patients`, {
    headers: { Authorization: 'Bearer test-doctor-token' }
  });
  const finalPatientsData = await finalPatientsRes.json();
  assert.equal(finalPatientsData.patients.length, initialPatientCount + 1, 'Doctor patient count must increment by 1');

  const finalAssessmentsRes = await fetch(`${baseUrl}/doctors/me/assessments`, {
    headers: { Authorization: 'Bearer test-doctor-token' }
  });
  const finalAssessmentsData = await finalAssessmentsRes.json();
  assert.equal(finalAssessmentsData.assessments.length, initialAssessmentCount + 1, 'Doctor assessment count must increment by 1');

  const createdInHistory = finalAssessmentsData.assessments.find(a => a.id === assessmentId);
  assert.ok(createdInHistory, 'Assessment must appear in doctor history');
  assert.equal(createdInHistory.status, 'DOCTOR_VALIDATED');
});
