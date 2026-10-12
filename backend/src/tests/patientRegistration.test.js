const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const repo = require('../db/repository');

let server;
let baseUrl;
const createdPatientIds = [];

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  // Cleanup test patients
  for (const id of createdPatientIds) {
    try {
      await repo.deletePatient(id);
    } catch (_) {}
  }
  await new Promise(resolve => server.close(resolve));
});

test('Patient Registration: Register new automated patient via POST /api/patients', async () => {
  const uniqueCode = `AUTO-TEST-${Date.now().toString().slice(-6)}`;
  const payload = {
    patient_code: uniqueCode,
    name: 'Automated Test Patient',
    age: 32,
    gender: 'Female',
    phone: '+91 99999 88888'
  };

  const res = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.patient.id);
  assert.equal(data.patient.name, 'Automated Test Patient');
  assert.equal(data.patient.age, 32);
  assert.equal(data.patient.gender, 'Female');

  createdPatientIds.push(data.patient.id);

  // Verify patient exists in repository
  const fetched = await repo.getPatientById(data.patient.id);
  assert.ok(fetched, 'Patient must exist in database');
  assert.equal(fetched.id, data.patient.id);
  assert.equal(fetched.patient_code, uniqueCode);
});

test('Patient Registration: Enforce validation rules (missing name / invalid age)', async () => {
  // Missing name
  const resMissingName = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({ age: 30, gender: 'Female' })
  });
  assert.equal(resMissingName.status, 400);

  // Invalid age (e.g. 0 or negative)
  const resInvalidAge = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({ name: 'Invalid Age Patient', age: -5, gender: 'Female' })
  });
  assert.equal(resInvalidAge.status, 400);
});

test('Patient Registration: Auto-generate unique patient_code if omitted', async () => {
  const payload = {
    name: 'Auto-Code Patient',
    age: 28,
    gender: 'Female'
  };

  const res = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.patient.patient_code, 'patient_code must be automatically generated');
  assert.ok(data.patient.patient_code.startsWith('PT-'), 'patient_code must match format PT-XXXXXX');

  createdPatientIds.push(data.patient.id);
});

test('Patient Registration: Return 409 Conflict when duplicate patient_code is registered', async () => {
  const duplicateCode = `DUPL-${Date.now()}`;
  const payload1 = {
    patient_code: duplicateCode,
    name: 'First Registration Patient',
    age: 35,
    gender: 'Female'
  };

  const res1 = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify(payload1)
  });
  assert.equal(res1.status, 201);
  const data1 = await res1.json();
  createdPatientIds.push(data1.patient.id);

  // Attempt second registration with exact same patient_code
  const payload2 = {
    patient_code: duplicateCode,
    name: 'Duplicate Code Patient',
    age: 40,
    gender: 'Female'
  };

  const res2 = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify(payload2)
  });

  assert.equal(res2.status, 409, 'Duplicate patient_code must return HTTP 409 Conflict');
  const data2 = await res2.json();
  assert.equal(data2.error.code, 'DUPLICATE_RESOURCE');
});
