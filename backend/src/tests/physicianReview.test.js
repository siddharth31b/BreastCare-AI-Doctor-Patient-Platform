const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');

const repo = require('../db/repository');

let server;
let baseUrl;
let createdPatientId = null;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  if (createdPatientId) {
    try {
      await repo.deletePatient(createdPatientId);
    } catch (_) {}
  }
  await new Promise((resolve) => server.close(resolve));
});

test('Physician Validation Workflow: Full Clinical Review Lifecycle', async (t) => {
  const doctorAToken = `mock:DOCTOR:uid_doc_val_a_${Date.now()}:doc_a@hospital.org:Dr. Anita Desai`;
  const doctorBToken = `mock:DOCTOR:uid_doc_val_b_${Date.now()}:doc_b@hospital.org:Dr. Suresh Patel`;
  const adminToken = `mock:ADMIN:uid_admin_val_${Date.now()}:admin_val@hospital.org:Admin Auditor`;

  const headersDocA = { Authorization: `Bearer ${doctorAToken}`, 'Content-Type': 'application/json' };
  const headersDocB = { Authorization: `Bearer ${doctorBToken}`, 'Content-Type': 'application/json' };
  const headersAdmin = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  // Setup sessions
  await fetch(`${baseUrl}/auth/session`, { method: 'POST', headers: headersDocA });
  await fetch(`${baseUrl}/auth/session`, { method: 'POST', headers: headersDocB });
  await fetch(`${baseUrl}/auth/session`, { method: 'POST', headers: headersAdmin });

  // 1. Doctor A creates patient and assessment
  const pCode = `PT-VAL-${Date.now().toString().slice(-6)}`;
  const pRes = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: headersDocA,
    body: JSON.stringify({
      patient_code: pCode,
      name: 'Test Patient Delta',
      age: 44,
      gender: 'Female',
      phone: '+91 99887 76655'
    })
  });
  assert.equal(pRes.status, 201);
  const patient = (await pRes.json()).patient;
  createdPatientId = patient.id;

  const aRes = await fetch(`${baseUrl}/assessments`, {
    method: 'POST',
    headers: headersDocA,
    body: JSON.stringify({
      patient_id: patient.id,
      risk_profile: { age: 44, familyHistory: 'No' }
    })
  });
  assert.equal(aRes.status, 201);
  const assessment = (await aRes.json()).assessment;
  assert.equal(assessment.status, 'IN_PROGRESS');

  // 2. Reject validation while in IN_PROGRESS state (Invalid state transition)
  await t.test('Cannot validate assessment in IN_PROGRESS state', async () => {
    const valRes = await fetch(`${baseUrl}/assessments/${assessment.id}/validate`, {
      method: 'POST',
      headers: headersDocA,
      body: JSON.stringify({ doctor_note: 'Premature validation' })
    });
    assert.equal(valRes.status, 400);
    const err = await valRes.json();
    assert.ok(err.error.message.includes('IN_PROGRESS'));
  });

  // 3. Submit assessment -> status must become PENDING_DOCTOR_REVIEW
  await t.test('Assessment submission creates PENDING_DOCTOR_REVIEW', async () => {
    const submitRes = await fetch(`${baseUrl}/assessments/${assessment.id}/submit`, {
      method: 'POST',
      headers: headersDocA,
      body: JSON.stringify({
        risk_profile: { age: 44, familyHistory: 'No' },
        answers_map: {
          'Palpable Breast Lump': 'Yes',
          'Nipple Retraction': 'No'
        }
      })
    });
    assert.equal(submitRes.status, 200);
    const data = await submitRes.json();
    assert.equal(data.assessment.status, 'PENDING_DOCTOR_REVIEW');
  });

  // 4. Admin cannot validate assessment (Doctor only)
  await t.test('Admin cannot perform doctor validation', async () => {
    const adminValRes = await fetch(`${baseUrl}/assessments/${assessment.id}/validate`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ doctor_note: 'Admin trying to validate' })
    });
    assert.equal(adminValRes.status, 403);
    const err = await adminValRes.json();
    assert.ok(err.error.message.includes('Only doctors can validate'));
  });

  // 5. Doctor B cannot validate Doctor A's assessment (Isolation)
  await t.test('Doctor cannot validate another doctor assessment', async () => {
    const docBValRes = await fetch(`${baseUrl}/assessments/${assessment.id}/validate`, {
      method: 'POST',
      headers: headersDocB,
      body: JSON.stringify({ doctor_note: 'Doctor B unauthorized validation' })
    });
    assert.equal(docBValRes.status, 403);
  });

  // 6. Doctor A can save an intermediate review note
  await t.test('Doctor can save clinical review note', async () => {
    const noteRes = await fetch(`${baseUrl}/assessments/${assessment.id}/review-note`, {
      method: 'POST',
      headers: headersDocA,
      body: JSON.stringify({ note: 'Reviewed findings. Mammogram advised.' })
    });
    assert.equal(noteRes.status, 200);
    const noteData = await noteRes.json();
    assert.equal(noteData.assessment.doctor_note, 'Reviewed findings. Mammogram advised.');
  });

  // 7. Doctor A validates assessment
  await t.test('Assigned doctor validates assessment and sets DOCTOR_VALIDATED', async () => {
    const valRes = await fetch(`${baseUrl}/assessments/${assessment.id}/validate`, {
      method: 'POST',
      headers: headersDocA,
      body: JSON.stringify({
        doctor_note: 'Confirmed bilateral screening findings. Triage validated for ultrasound staging.'
      })
    });
    assert.equal(valRes.status, 200);
    const valData = await valRes.json();
    assert.equal(valData.assessment.status, 'DOCTOR_VALIDATED');
    // reviewed_by comes from authenticated Firebase doctor token
    assert.equal(valData.assessment.reviewed_by, 'Dr. Anita Desai');
    // reviewed_at is generated by backend
    assert.ok(valData.assessment.reviewed_at);
    assert.equal(valData.assessment.doctor_note, 'Confirmed bilateral screening findings. Triage validated for ultrasound staging.');
  });

  // 8. Cannot re-validate an already validated assessment without transition
  await t.test('Reject duplicate validation of DOCTOR_VALIDATED assessment', async () => {
    const dupRes = await fetch(`${baseUrl}/assessments/${assessment.id}/validate`, {
      method: 'POST',
      headers: headersDocA,
      body: JSON.stringify({ doctor_note: 'Duplicate attempt' })
    });
    assert.equal(dupRes.status, 400);
  });

  // 9. Doctor requests reassessment (Reassessment requires reason)
  await t.test('Reassessment requires a reason and updates status to REASSESSMENT_REQUESTED', async () => {
    // Empty reason should fail
    const emptyReasonRes = await fetch(`${baseUrl}/assessments/${assessment.id}/reassessment`, {
      method: 'POST',
      headers: headersDocA,
      body: JSON.stringify({ reason: '   ' })
    });
    assert.equal(emptyReasonRes.status, 400);
    const err = await emptyReasonRes.json();
    assert.ok(err.error.message.includes('reason is required'));

    // Valid reassessment request
    const reassessRes = await fetch(`${baseUrl}/assessments/${assessment.id}/reassessment`, {
      method: 'POST',
      headers: headersDocA,
      body: JSON.stringify({
        reason: 'Patient reported secondary skin dimpling not recorded during initial tablet triage.'
      })
    });
    assert.equal(reassessRes.status, 200);
    const reassessData = await reassessRes.json();
    assert.equal(reassessData.assessment.status, 'REASSESSMENT_REQUESTED');
    assert.equal(reassessData.assessment.reviewed_by, 'Dr. Anita Desai');
    assert.ok(reassessData.assessment.reviewed_at);
    assert.equal(reassessData.assessment.reassessment_reason, 'Patient reported secondary skin dimpling not recorded during initial tablet triage.');
  });
});
