const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const repo = require('../db/repository');

let server;
let baseUrl;
const createdPatientIds = [];

// Minimal valid 1x1 pixel PNG fixture for controlled automated testing
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  for (const id of createdPatientIds) {
    try {
      await repo.deletePatient(id);
    } catch (_) {}
  }
  await new Promise(resolve => server.close(resolve));
});

test('Photo Upload: Base64 JSON payload from React Native Expo Camera', async () => {
  // 1. Create a test patient via doctor API to establish doctor association
  const createRes = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      name: 'Photo Test Patient Base64',
      age: 35,
      gender: 'Female'
    })
  });
  const createData = await createRes.json();
  const patient = createData.patient;
  createdPatientIds.push(patient.id);

  // 2. Upload base64 face photo
  const res = await fetch(`${baseUrl}/patients/${patient.id}/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      photo_base64: `data:image/png;base64,${TEST_IMAGE_BASE64}`
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.face_photo_url, 'Expected face_photo_url in response');
  assert.ok(data.face_photo_url.includes('patient-photos') || data.face_photo_url.startsWith('http'));

  // 3. Verify patient record in database has face_photo_url populated
  const updated = await repo.getPatientById(patient.id);
  assert.equal(updated.face_photo_url, data.face_photo_url);
});

test('Photo Upload: Multipart form-data file upload', async () => {
  const createRes = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      name: 'Photo Test Patient Multipart',
      age: 42,
      gender: 'Female'
    })
  });
  const createData = await createRes.json();
  const patient = createData.patient;
  createdPatientIds.push(patient.id);

  const imageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="photo"; filename="face_test.png"\r\n`;
  body += `Content-Type: image/png\r\n\r\n`;

  const bodyHead = Buffer.from(body, 'utf8');
  const bodyTail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const multipartBody = Buffer.concat([bodyHead, imageBuffer, bodyTail]);

  const res = await fetch(`${baseUrl}/patients/${patient.id}/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: 'Bearer test-doctor-token'
    },
    body: multipartBody
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.face_photo_url);

  const updated = await repo.getPatientById(patient.id);
  assert.equal(updated.face_photo_url, data.face_photo_url);
});

test('Photo Upload: Rejects empty request without photo', async () => {
  const createRes = await fetch(`${baseUrl}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({
      name: 'Photo Test Patient Empty',
      age: 30,
      gender: 'Female'
    })
  });
  const createData = await createRes.json();
  const patient = createData.patient;
  createdPatientIds.push(patient.id);

  const res = await fetch(`${baseUrl}/patients/${patient.id}/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-doctor-token'
    },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.message.includes('No photo provided'));
});
