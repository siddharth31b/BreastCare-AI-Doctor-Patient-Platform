/**
 * Cross-Device Realtime & Role Isolation Verification Suite
 * 
 * Verifies:
 * 1. SSE stream connection with Firebase authentication tokens.
 * 2. Cross-device event broadcasting on patient registration, assessment submission, and doctor validation.
 * 3. Role-based event and data isolation: Doctor B cannot see Doctor A's patient records or assessment alerts.
 * 4. Automatic teardown leaving Supabase in 0 patients / 0 assessments clean state.
 */

const http = require('http');
const app = require('../server');
const repo = require('../db/repository');
const realtimeBridge = require('../services/realtimeBridge');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSseEvents(buffer) {
  const events = [];
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr) {
        try {
          events.push(JSON.parse(dataStr));
        } catch (_) {}
      }
    }
  }
  return events;
}

function makeRequest(port, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function connectSse(port, token) {
  const client = {
    events: [],
    closed: false,
    req: null,
  };

  client.promise = new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path: `/api/realtime/stream?token=${encodeURIComponent(token)}`,
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
    };

    let buffer = '';
    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`SSE connection failed with status ${res.statusCode}`));
      }

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const parsed = parseSseEvents(buffer);
        client.events = parsed;
      });

      resolve(client);
    });

    req.on('error', (err) => {
      if (!client.closed) {
        console.warn('SSE client error:', err.message);
      }
    });

    client.req = req;
    req.end();
  });

  client.close = () => {
    client.closed = true;
    if (client.req) {
      client.req.destroy();
    }
  };

  return client;
}

async function runRealtimeAudit() {
  console.log('================================================================');
  console.log('CROSS-DEVICE REALTIME & RBAC ISOLATION AUDIT');
  console.log('================================================================\n');

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`[Test Server] Running on http://127.0.0.1:${port}`);

  const tokenAdmin = 'mock:ADMIN:uid_admin_test_rt:admin_rt@hospital.com:Admin Audit';
  const tokenDocA = 'mock:DOCTOR:uid_doctor_a_rt:dr_a_rt@hospital.com:Dr. Alice';
  const tokenDocB = 'mock:DOCTOR:uid_doctor_b_rt:dr_b_rt@hospital.com:Dr. Bob';

  let clientAdmin = null;
  let clientDocA = null;
  let clientDocB = null;
  let createdPatientId = null;
  let createdAssessmentId = null;

  const initialPatients = await repo.getAllPatients();
  const initialAssessments = await repo.getAllAssessments();

  try {
    // 1. Establish SSE Streams for Admin, Doctor A, and Doctor B
    console.log('[Step 1] Connecting SSE Streams (Admin, Doctor A, Doctor B)...');
    clientAdmin = connectSse(port, tokenAdmin);
    clientDocA = connectSse(port, tokenDocA);
    clientDocB = connectSse(port, tokenDocB);

    await Promise.all([clientAdmin.promise, clientDocA.promise, clientDocB.promise]);
    await sleep(200);

    console.log('   Admin received connected event:', clientAdmin.events.some((e) => e.type === 'CONNECTED'));
    console.log('   Doctor A received connected event:', clientDocA.events.some((e) => e.type === 'CONNECTED'));
    console.log('   Doctor B received connected event:', clientDocB.events.some((e) => e.type === 'CONNECTED'));

    if (
      !clientAdmin.events.some((e) => e.type === 'CONNECTED') ||
      !clientDocA.events.some((e) => e.type === 'CONNECTED') ||
      !clientDocB.events.some((e) => e.type === 'CONNECTED')
    ) {
      throw new Error('Initial SSE CONNECTED handshake failed on one or more devices.');
    }
    console.log('   PASS: All three device streams connected.\n');

    // 2. Doctor A registers Patient A
    console.log('[Step 2] Device Doctor A: Registering Patient A...');
    const patientRes = await makeRequest(
      port,
      'POST',
      '/api/patients',
      { Authorization: `Bearer ${tokenDocA}` },
      {
        name: 'Realtime Verification Patient',
        age: 48,
        gender: 'Female',
        phone: '9876543210',
      }
    );

    if (patientRes.status !== 201 || !patientRes.data.patient?.id) {
      throw new Error(`Patient registration failed: ${JSON.stringify(patientRes.data)}`);
    }

    createdPatientId = patientRes.data.patient.id;
    console.log(`   Patient created in database (ID: ${createdPatientId})`);

    await sleep(300);

    // Verify Admin received PATIENT_REGISTERED
    const adminGotReg = clientAdmin.events.some(
      (e) => e.type === 'PATIENT_REGISTERED' && e.patientId === createdPatientId
    );
    console.log(`   Admin device received PATIENT_REGISTERED realtime event: ${adminGotReg}`);
    if (!adminGotReg) {
      throw new Error('Admin device failed to receive PATIENT_REGISTERED event.');
    }

    // Verify Doctor B patient isolation (Doctor B query must NOT see Patient A)
    const docBPatients = await makeRequest(port, 'GET', '/api/doctors/me/patients', {
      Authorization: `Bearer ${tokenDocB}`,
    });
    const docBHasPatient = (docBPatients.data.patients || []).some((p) => p.id === createdPatientId);
    console.log(`   Doctor B patient isolation verified (sees Patient A: ${docBHasPatient}): ${!docBHasPatient}`);
    if (docBHasPatient) {
      throw new Error('CRITICAL RBAC VIOLATION: Doctor B can see Doctor A\'s newly registered patient!');
    }
    console.log('   PASS: Patient registered & RBAC isolation verified.\n');

    // 3. Doctor A creates and submits Assessment for Patient A
    console.log('[Step 3] Device Doctor A: Creating and Submitting Assessment...');
    const createAssessRes = await makeRequest(
      port,
      'POST',
      '/api/assessments',
      { Authorization: `Bearer ${tokenDocA}` },
      { patient_id: createdPatientId }
    );

    if (createAssessRes.status !== 201 || !createAssessRes.data.assessment?.id) {
      throw new Error(`Assessment creation failed: ${JSON.stringify(createAssessRes.data)}`);
    }

    createdAssessmentId = createAssessRes.data.assessment.id;

    // Submit assessment
    const submitRes = await makeRequest(
      port,
      'POST',
      `/api/assessments/${createdAssessmentId}/submit`,
      { Authorization: `Bearer ${tokenDocA}` },
      {
        risk_profile: { age: 48, menarche_age: 13 },
        answers_map: {
          palpable_lump: 'Yes',
          nipple_discharge: 'No',
        },
      }
    );

    if (submitRes.status !== 200 || submitRes.data.assessment?.status !== 'PENDING_DOCTOR_REVIEW') {
      throw new Error(`Assessment submission failed: ${JSON.stringify(submitRes.data)}`);
    }

    await sleep(300);

    // Verify Doctor A received ASSESSMENT_SUBMITTED
    const docAGotSubmit = clientDocA.events.some(
      (e) => e.type === 'ASSESSMENT_SUBMITTED' && e.assessmentId === createdAssessmentId
    );
    // Verify Admin received ASSESSMENT_SUBMITTED
    const adminGotSubmit = clientAdmin.events.some(
      (e) => e.type === 'ASSESSMENT_SUBMITTED' && e.assessmentId === createdAssessmentId
    );
    // Verify Doctor B DID NOT receive Doctor A's assessment submission event
    const docBGotSubmit = clientDocB.events.some(
      (e) => e.type === 'ASSESSMENT_SUBMITTED' && e.assessmentId === createdAssessmentId
    );

    console.log(`   Doctor A received ASSESSMENT_SUBMITTED: ${docAGotSubmit}`);
    console.log(`   Admin received ASSESSMENT_SUBMITTED: ${adminGotSubmit}`);
    console.log(`   Doctor B stream blocked from Doctor A event: ${!docBGotSubmit}`);

    if (!docAGotSubmit || !adminGotSubmit || docBGotSubmit) {
      throw new Error('Assessment realtime dispatch or isolation failed.');
    }
    console.log('   PASS: Assessment submitted & cross-device event verified.\n');

    // 4. Doctor A validates the Assessment
    console.log('[Step 4] Device Doctor A: Validating Assessment...');
    const validateRes = await makeRequest(
      port,
      'POST',
      `/api/assessments/${createdAssessmentId}/validate`,
      { Authorization: `Bearer ${tokenDocA}` },
      { doctor_note: 'Clinical validation test note' }
    );

    if (validateRes.status !== 200 || validateRes.data.assessment?.status !== 'DOCTOR_VALIDATED') {
      throw new Error(`Assessment validation failed: ${JSON.stringify(validateRes.data)}`);
    }

    await sleep(300);

    const docAGotValid = clientDocA.events.some(
      (e) => e.type === 'ASSESSMENT_VALIDATED' && e.assessmentId === createdAssessmentId
    );
    const adminGotValid = clientAdmin.events.some(
      (e) => e.type === 'ASSESSMENT_VALIDATED' && e.assessmentId === createdAssessmentId
    );
    const docBGotValid = clientDocB.events.some(
      (e) => e.type === 'ASSESSMENT_VALIDATED' && e.assessmentId === createdAssessmentId
    );

    console.log(`   Doctor A received ASSESSMENT_VALIDATED: ${docAGotValid}`);
    console.log(`   Admin received ASSESSMENT_VALIDATED: ${adminGotValid}`);
    console.log(`   Doctor B stream blocked from Doctor A validation: ${!docBGotValid}`);

    if (!docAGotValid || !adminGotValid || docBGotValid) {
      throw new Error('Assessment validation realtime dispatch or isolation failed.');
    }

    // Verify Doctor B cannot validate Doctor A's assessment
    const docBTamper = await makeRequest(
      port,
      'POST',
      `/api/assessments/${createdAssessmentId}/validate`,
      { Authorization: `Bearer ${tokenDocB}` }
    );
    console.log(`   Doctor B tamper attempt rejected with 403: ${docBTamper.status === 403}`);
    if (docBTamper.status !== 403) {
      throw new Error('Doctor B should have been forbidden (403) from tampering with Doctor A\'s assessment.');
    }
    console.log('   PASS: Doctor validation & cross-device realtime verified.\n');

  } finally {
    // Clean up SSE connections
    if (clientAdmin) clientAdmin.close();
    if (clientDocA) clientDocA.close();
    if (clientDocB) clientDocB.close();

    // Clean up test data
    console.log('[Teardown] Cleaning up test records from database...');
    if (createdPatientId) {
      try {
        await repo.deletePatient(createdPatientId);
        console.log(`   Deleted test patient ${createdPatientId}`);
      } catch (err) {
        console.warn(`   Note during patient cleanup: ${err.message}`);
      }
    }

    // Close server
    await new Promise((resolve) => server.close(resolve));
    console.log('[Test Server] Closed.');

    // Final clean state verification
    const remainingPatients = await repo.getAllPatients();
    const remainingAssessments = await repo.getAllAssessments();
    console.log(`\nFinal Database State: Patients=${remainingPatients.length} (Baseline: ${initialPatients.length}), Assessments=${remainingAssessments.length} (Baseline: ${initialAssessments.length})`);
    if (remainingPatients.length === initialPatients.length && remainingAssessments.length === initialAssessments.length) {
      console.log(`AUDIT RESULT: ALL REALTIME & RBAC CHECKS PASSED (BASELINE DATABASE STATE PRESERVED: ${remainingPatients.length} / ${remainingAssessments.length})`);
    } else {
      console.error(`DATABASE NOT CLEAN AFTER TEST! Expected: ${initialPatients.length}/${initialAssessments.length}, Found: ${remainingPatients.length}/${remainingAssessments.length}`);
      process.exitCode = 1;
    }
  }
}

if (require.main === module) {
  runRealtimeAudit()
    .then(() => {
      process.exit(process.exitCode || 0);
    })
    .catch((err) => {
      console.error('REALTIME AUDIT FAILED:', err);
      process.exit(1);
    });
}

module.exports = runRealtimeAudit;
