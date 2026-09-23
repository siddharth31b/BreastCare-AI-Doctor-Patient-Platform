const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('Complete Data Flow: Doctor triage -> Photo -> Questionnaire -> Submit -> Admin visibility', async () => {
  // 1. Doctor Login
  const docToken = 'mock:DOCTOR:uid_clinical_doc_1:dr_mehta@hospital.com:Dr. Mehta';
  const docHeaders = { Authorization: `Bearer ${docToken}`, 'Content-Type': 'application/json' };

  const sessionRes = await fetch(`${baseUrl}/auth/session`, { method: 'POST', headers: docHeaders });
  assert.equal(sessionRes.status, 200);
  const session = await sessionRes.json();
  assert.equal(session.role, 'DOCTOR');
  assert.equal(session.user.name, 'Dr. Mehta');

  // 2. Create Patient with unique code for persistence idempotency
  const testPatientCode = `PT-TRIAGE-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const patientPayload = {
    patient_code: testPatientCode,
    name: 'Lakshmi Bai',
    age: 51,
    gender: 'Female',
    phone: '+91 94000 11223'
  };
  const pRes = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: docHeaders,
    body: JSON.stringify(patientPayload)
  });
  assert.equal(pRes.status, 201);
  const patient = (await pRes.json()).patient;
  assert.equal(patient.name, 'Lakshmi Bai');
  assert.equal(patient.patient_code, testPatientCode);

  // 3. Capture & Upload Face Photo (base64 image from camera)
  const photoPayload = {
    photo_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'
  };
  const photoRes = await fetch(`${baseUrl}/patients/${patient.id}/photo`, {
    method: 'POST',
    headers: docHeaders,
    body: JSON.stringify(photoPayload)
  });
  assert.equal(photoRes.status, 200);
  const photoData = await photoRes.json();
  assert.ok(photoData.face_photo_url, 'Must return stored photo reference URL');
  assert.ok(photoData.patient.face_photo_url, 'Patient record must reflect updated face_photo_url');

  // 4. Create Assessment Session
  const assessInitRes = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers: docHeaders,
    body: JSON.stringify({
      patient_id: patient.id,
      risk_profile: {
        age: 51,
        familyHistory: 'Yes (Mother diagnosed at age 45)',
        breastfeeding: 'Never',
        contraceptives: 'Long-term 7 years',
        numberOfChildren: '0'
      }
    })
  });
  assert.equal(assessInitRes.status, 201);
  const assessment = (await assessInitRes.json()).assessment;
  assert.equal(assessment.status, 'IN_PROGRESS');

  // 5. Load Screening Questions (Phase 1, 2, 3)
  const qRes = await fetch(`${baseUrl}/questions`);
  assert.equal(qRes.status, 200);
  const qData = await qRes.json();
  assert.ok(qData.questions.length >= 8);

  // 6. Patient answers questions (simulating clinical chatbot intake)
  const answersMap = {
    'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes',
    'Symptoms on Left Breast – Nipple Retraction / Inversion': 'Yes',
    'Symptoms on Left Breast – Nipple Discharge': 'Yes',
    'Symptoms on Left Breast – Skin Dimpling': 'Yes',
    'Symptoms on Left Arm – Axillary (Armpit) Lump': 'Yes',
    'Respiratory Symptoms – Breathlessness': 'Yes'
  };

  // 7. Calculate Risk & Submit Assessment
  const submitRes = await fetch(`${baseUrl}/assessments/${assessment.id}/submit`, {
    method: 'POST',
    headers: docHeaders,
    body: JSON.stringify({
      risk_profile: {
        age: 51,
        familyHistory: 'Yes (Mother diagnosed at age 45)',
        breastfeeding: 'Never',
        contraceptives: 'Long-term 7 years',
        numberOfChildren: '0'
      },
      answers_map: answersMap
    })
  });
  assert.equal(submitRes.status, 200);
  const submitData = await submitRes.json();
  assert.ok(['COMPLETED', 'PENDING_DOCTOR_REVIEW'].includes(submitData.assessment.status));
  assert.ok(submitData.assessment.completed_at);

  // Verification of clinical calculation:
  // Age 51 (+2), Mother (+3), Never BF (+1), Contraceptives (+1), 0 kids (+1) = 8 BRM points
  // Metastatic Pattern Alert or Malignancy Triad triggers Urgent Risk
  assert.equal(submitData.clinical_result.tier, 'Urgent');
  assert.ok(submitData.clinical_result.totalScore >= 20);
  assert.ok(submitData.clinical_result.recommendation.includes('24–48 hours'));

  // 8. Admin Dashboard Inspection
  const adminToken = 'mock:ADMIN:uid_admin_auditor:auditor@hospital.com:Chief Admin';
  const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  // Admin sees all patients, including Lakshmi Bai with her photo
  const adminPatientsRes = await fetch(`${baseUrl}/admin/patients`, { headers: adminHeaders });
  assert.equal(adminPatientsRes.status, 200);
  const adminPatients = (await adminPatientsRes.json()).patients;
  const foundPatient = adminPatients.find(p => p.id === patient.id);
  assert.ok(foundPatient);
  assert.ok(foundPatient.face_photo_url, 'Admin must see patient face photo');

  // Admin sees the completed assessment
  const adminAssessRes = await fetch(`${baseUrl}/admin/assessments`, { headers: adminHeaders });
  assert.equal(adminAssessRes.status, 200);
  const adminAssessments = (await adminAssessRes.json()).assessments;
  const foundAssessment = adminAssessments.find(a => a.id === assessment.id);
  assert.ok(foundAssessment);
  assert.ok(['COMPLETED', 'PENDING_DOCTOR_REVIEW'].includes(foundAssessment.status));

  // Admin opens detailed assessment report -> inspects answers and risk analysis
  const detailRes = await fetch(`${baseUrl}/assessments/${assessment.id}`, { headers: adminHeaders });
  assert.equal(detailRes.status, 200);
  const detailData = await detailRes.json();
  assert.ok(detailData.assessment.answers.length >= 6, 'Must contain all saved answers in answers table');
  assert.equal(detailData.assessment.risk_analysis.tier, 'Urgent');
  assert.ok(detailData.assessment.risk_analysis.recommendation);
});
