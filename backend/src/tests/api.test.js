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

test('API: Unauthorized request returns 401', async () => {
  const res = await fetch(`${baseUrl}/patients`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.ok(data.error.message.includes('Unauthorized'));
});

test('API: Questions endpoint is accessible and returns all phases', async () => {
  const res = await fetch(`${baseUrl}/questions`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.questions.length > 0);
});

test('API: Doctor authentication & session verification', async () => {
  const res = await fetch(`${baseUrl}/auth/session`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-doctor-token'
    }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.role, 'DOCTOR');
  assert.equal(data.user.email, 'doctor@breastcare.ai');
});

test('API: Doctor cannot access admin endpoints (RBAC 403 Forbidden)', async () => {
  const res = await fetch(`${baseUrl}/admin/analytics`, {
    headers: {
      Authorization: 'Bearer test-doctor-token'
    }
  });
  assert.equal(res.status, 403);
});

test('API: End-to-end patient registration, photo upload, assessment and clinical submission', async () => {
  const docAuth = { Authorization: 'Bearer test-doctor-token', 'Content-Type': 'application/json' };

  // 1. Create Patient
  const patientRes = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: docAuth,
    body: JSON.stringify({
      name: 'Ananya Sharma',
      age: 45,
      gender: 'Female',
      phone: '+91 98765 11223'
    })
  });
  assert.equal(patientRes.status, 201);
  const patientData = await patientRes.json();
  const patientId = patientData.patient.id;
  assert.ok(patientId);

  // 2. Upload Face Photo (base64)
  const photoRes = await fetch(`${baseUrl}/patients/${patientId}/photo`, {
    method: 'POST',
    headers: docAuth,
    body: JSON.stringify({
      photo_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'
    })
  });
  assert.equal(photoRes.status, 200);
  const photoData = await photoRes.json();
  assert.equal(photoData.success, true);
  assert.ok(photoData.face_photo_url);

  // 3. Start Assessment
  const assessRes = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers: docAuth,
    body: JSON.stringify({
      patient_id: patientId,
      risk_profile: {
        age: 45,
        familyHistory: 'Mother had breast cancer',
        breastfeeding: 'None'
      }
    })
  });
  assert.equal(assessRes.status, 201);
  const assessData = await assessRes.json();
  const assessmentId = assessData.assessment.id;
  assert.ok(assessmentId);

  // 4. Submit Assessment with symptoms
  const submitRes = await fetch(`${baseUrl}/assessments/${assessmentId}/submit`, {
    method: 'POST',
    headers: docAuth,
    body: JSON.stringify({
      risk_profile: {
        age: 45,
        familyHistory: 'Mother had breast cancer',
        breastfeeding: 'None'
      },
      answers_map: {
        'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes',
        'Symptoms on Left Breast – Nipple Retraction / Inversion': 'Yes',
        'Symptoms on Left Breast – Nipple Discharge': 'Yes',
        'Symptoms on Left Breast – Skin Dimpling': 'Yes'
      }
    })
  });
  assert.equal(submitRes.status, 200);
  const submitData = await submitRes.json();
  assert.equal(submitData.success, true);
  assert.ok(['COMPLETED', 'PENDING_DOCTOR_REVIEW'].includes(submitData.assessment.status));
  // Escalation rule or high score triggered
  assert.ok(['High', 'Urgent'].includes(submitData.clinical_result.tier));
  assert.ok(submitData.clinical_result.recommendation.length > 0);

  // 5. Admin can view the completed assessment
  const adminRes = await fetch(`${baseUrl}/admin/assessments`, {
    headers: {
      Authorization: 'Bearer test-admin-token'
    }
  });
  assert.equal(adminRes.status, 200);
  const adminData = await adminRes.json();
  assert.ok(adminData.assessments.some(a => a.id === assessmentId));
});
