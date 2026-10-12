const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const repo = require('../db/repository');

let server;
let baseUrl;
let patientAId = null;
let patientBId = null;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  if (patientAId) {
    try { await repo.deletePatient(patientAId); } catch (_) {}
  }
  if (patientBId) {
    try { await repo.deletePatient(patientBId); } catch (_) {}
  }
  await new Promise((resolve) => server.close(resolve));
});

test('Role Isolation: Doctor A cannot access Doctor B patients or assessments, Admin can access all', async () => {
  // 1. Setup Doctor A and Doctor B tokens
  const tokenDocA = 'mock:DOCTOR:uid_doctor_a:dr_a@hospital.com:Dr. A';
  const tokenDocB = 'mock:DOCTOR:uid_doctor_b:dr_b@hospital.com:Dr. B';
  const tokenAdmin = 'mock:ADMIN:uid_admin_x:admin@hospital.com:Super Admin';

  const authDocA = { Authorization: `Bearer ${tokenDocA}`, 'Content-Type': 'application/json' };
  const authDocB = { Authorization: `Bearer ${tokenDocB}`, 'Content-Type': 'application/json' };
  const authAdmin = { Authorization: `Bearer ${tokenAdmin}`, 'Content-Type': 'application/json' };

  // 2. Doctor A creates Patient A
  const pResA = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: authDocA,
    body: JSON.stringify({ name: 'Patient of Doctor A', age: 39, gender: 'Female' })
  });
  assert.equal(pResA.status, 201);
  const patientA = (await pResA.json()).patient;
  patientAId = patientA.id;

  // 3. Doctor B creates Patient B
  const pResB = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: authDocB,
    body: JSON.stringify({ name: 'Patient of Doctor B', age: 44, gender: 'Female' })
  });
  assert.equal(pResB.status, 201);
  const patientB = (await pResB.json()).patient;
  patientBId = patientB.id;

  // 4. Doctor A tries to access Patient B -> MUST BE 403 Forbidden
  const leakRes = await fetch(`${baseUrl}/patients/${patientB.id}`, {
    headers: authDocA
  });
  assert.equal(leakRes.status, 403, 'Doctor A must not access Doctor B patient');

  // 5. Doctor B tries to start assessment for Patient A -> MUST BE 403 Forbidden
  const crossAssessRes = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers: authDocB,
    body: JSON.stringify({ patient_id: patientA.id })
  });
  assert.equal(crossAssessRes.status, 403, 'Doctor B must not start assessment for Doctor A patient');

  // 6. Doctor A creates Assessment for Patient A
  const assessResA = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers: authDocA,
    body: JSON.stringify({ patient_id: patientA.id })
  });
  assert.equal(assessResA.status, 201);
  const assessmentA = (await assessResA.json()).assessment;

  // 7. Doctor B tries to view or submit Doctor A assessment -> MUST BE 403 Forbidden
  const crossViewAssess = await fetch(`${baseUrl}/assessments/${assessmentA.id}`, {
    headers: authDocB
  });
  assert.equal(crossViewAssess.status, 403, 'Doctor B must not view Doctor A assessment');

  // 8. Doctor A tries to access Admin route -> MUST BE 403 Forbidden
  const adminBlock = await fetch(`${baseUrl}/admin/analytics`, {
    headers: authDocA
  });
  assert.equal(adminBlock.status, 403, 'Doctor A must not access admin analytics');

  // 9. Admin accesses Patient A, Patient B, and Assessment A -> MUST BE 200 OK
  const adminPatientA = await fetch(`${baseUrl}/patients/${patientA.id}`, { headers: authAdmin });
  assert.equal(adminPatientA.status, 200);

  const adminPatientB = await fetch(`${baseUrl}/patients/${patientB.id}`, { headers: authAdmin });
  assert.equal(adminPatientB.status, 200);

  const adminAssessA = await fetch(`${baseUrl}/assessments/${assessmentA.id}`, { headers: authAdmin });
  assert.equal(adminAssessA.status, 200);

  // 10. Verify backend NEVER trusts doctor_id in request body
  // Doctor A tries to pass doctor_id of Doctor B in POST /api/assessments
  // The backend must force req.user.id (Doctor A), ignoring the spoofed body param
  const spoofRes = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers: authDocA,
    body: JSON.stringify({
      patient_id: patientA.id,
      doctor_id: 'spoofed_doctor_b_id'
    })
  });
  assert.equal(spoofRes.status, 201);
  const spoofData = (await spoofRes.json()).assessment;
  const docAUser = await repo.findDoctorByFirebaseUid('uid_doctor_a');
  assert.equal(spoofData.doctor_id, docAUser.id, 'Backend must use authenticated doctor id, never client-spoofed doctor_id');
});
