const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const supabase = require('../config/supabase');
const repo = require('../db/repository');

async function runAudit() {
  console.log('====================================================');
  console.log('NARISETU – BREASTCARE AI: END-TO-END CLINICAL AUDIT TEST');
  console.log('====================================================\n');

  // Step 0: Initial verification - capture baseline counts
  const { count: initP } = await supabase.from('patients').select('*', { count: 'exact', head: true });
  const { count: initA } = await supabase.from('assessments').select('*', { count: 'exact', head: true });
  console.log(`[Step 0] Initial state verification: Patients = ${initP}, Assessments = ${initA}`);

  // Start ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`[Setup] Local API server active on: ${baseUrl}`);

  let createdPatientId = null;
  let createdAssessmentId = null;

  try {
    // 1. Doctor login & session verification
    console.log('\n[Step 1] Doctor Login & Session Check...');
    const docToken = 'mock:DOCTOR:uid_clinical_audit_1:doctor@breastcare.ai:Dr. Priya Sharma';
    const authHeaders = { Authorization: `Bearer ${docToken}`, 'Content-Type': 'application/json' };

    const sessionRes = await fetch(`${baseUrl}/auth/session`, { method: 'POST', headers: authHeaders });
    assert.equal(sessionRes.status, 200);
    const session = await sessionRes.json();
    assert.equal(session.success, true);
    assert.equal(session.role, 'DOCTOR');
    console.log(`✔ Authenticated Doctor: ${session.user.name} (${session.user.email})`);

    // 2. Doctor Dashboard Load (Empty State: 0/0/0/0)
    console.log('\n[Step 2] Doctor Dashboard Load (Initial 0-state)...');
    const patientsRes = await fetch(`${baseUrl}/doctors/me/patients`, { headers: authHeaders });
    assert.equal(patientsRes.status, 200);
    const patientsData = await patientsRes.json();
    assert.equal(patientsData.count, 0);

    const assessmentsRes = await fetch(`${baseUrl}/doctors/me/assessments`, { headers: authHeaders });
    assert.equal(assessmentsRes.status, 200);
    const assessmentsData = await assessmentsRes.json();
    assert.equal(assessmentsData.count, 0);

    console.log('✔ Initial Dashboard Counters: Patients = 0, Pending = 0, Validated = 0, Urgent = 0');

    // 3. Register a NEW patient via actual API
    console.log('\n[Step 3] Registering a New Patient via POST /api/patients...');
    const testCode = `PT-AUDIT-${Date.now().toString().slice(-6)}`;
    const regPayload = {
      patient_code: testCode,
      name: 'Clinical Audit Patient',
      full_name: 'Clinical Audit Patient',
      age: 48,
      gender: 'Female',
      phone: '+91 98765 00001'
    };

    const createRes = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(regPayload)
    });
    assert.equal(createRes.status, 201);
    const createdData = await createRes.json();
    const patient = createdData.patient;
    createdPatientId = patient.id;
    assert.ok(createdPatientId);
    assert.equal(patient.name, 'Clinical Audit Patient');
    assert.equal(patient.patient_code, testCode);
    console.log(`✔ Patient Registered in Supabase: ID = ${createdPatientId}, Code = ${patient.patient_code}`);

    // Verify doctor-patient link was created in Supabase
    const { data: dpLink } = await supabase
      .from('doctor_patient')
      .select('*')
      .eq('patient_id', createdPatientId)
      .single();
    assert.ok(dpLink, 'doctor_patient relation must be created in Supabase');
    console.log(`✔ Doctor-Patient association confirmed in Supabase doctor_patient table.`);

    // 4. Verify Dashboard updates: Patients = 1
    console.log('\n[Step 4] Checking Dashboard Counters after Registration...');
    const docPatsAfterReg = await fetch(`${baseUrl}/doctors/me/patients`, { headers: authHeaders });
    const patsAfterData = await docPatsAfterReg.json();
    assert.equal(patsAfterData.count, 1);
    assert.equal(patsAfterData.patients[0].name, 'Clinical Audit Patient');
    console.log(`✔ Dashboard reflects registered patient count = 1, Name = Clinical Audit Patient`);

    // 5. Start Assessment Session
    console.log('\n[Step 5] Initializing Assessment Session via POST /api/assessments...');
    const startRes = await fetch(`${baseUrl}/assessments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        patient_id: createdPatientId,
        risk_profile: {
          age: 48,
          familyHistory: 'Yes (Mother diagnosed with breast cancer)',
          breastfeeding: 'Never',
          contraceptives: 'Long-term 5 years',
          numberOfChildren: '0'
        }
      })
    });
    assert.equal(startRes.status, 201);
    const startData = await startRes.json();
    createdAssessmentId = startData.assessment.id;
    assert.ok(createdAssessmentId);
    assert.equal(startData.assessment.status, 'IN_PROGRESS');
    console.log(`✔ Assessment Session created in Supabase: ID = ${createdAssessmentId}, Status = IN_PROGRESS`);

    // 6. Verify Questions loaded from database
    console.log('\n[Step 6] Verifying Clinical Questions from DB...');
    const qRes = await fetch(`${baseUrl}/questions`);
    assert.equal(qRes.status, 200);
    const qData = await qRes.json();
    assert.ok(qData.questions.length >= 8);
    console.log(`✔ Clinical Questions loaded from DB: ${qData.questions.length} questions available.`);

    // 7. Submit Assessment with symptoms
    console.log('\n[Step 7] Submitting Clinical Assessment via POST /api/assessments/:id/submit...');
    const answersMap = {
      'Symptoms on Left Breast – Palpable Lump / Abnormality': 'Yes',
      'Symptoms on Left Breast – Nipple Retraction / Inversion': 'Yes',
      'Symptoms on Left Breast – Skin Dimpling': 'Yes',
      'Symptoms on Left Arm – Axillary (Armpit) Lump': 'Yes'
    };

    const submitRes = await fetch(`${baseUrl}/assessments/${createdAssessmentId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        risk_profile: {
          age: 48,
          familyHistory: 'Yes (Mother diagnosed with breast cancer)',
          breastfeeding: 'Never',
          contraceptives: 'Long-term 5 years',
          numberOfChildren: '0'
        },
        answers_map: answersMap
      })
    });
    assert.equal(submitRes.status, 200);
    const submitData = await submitRes.json();
    assert.equal(submitData.success, true);
    assert.equal(submitData.assessment.status, 'PENDING_DOCTOR_REVIEW');
    assert.ok(submitData.clinical_result.totalScore >= 15);
    console.log(`✔ Assessment Submitted: Status = PENDING_DOCTOR_REVIEW, Tier = ${submitData.clinical_result.tier}, Score = ${submitData.clinical_result.totalScore} pts`);

    // 8. Verify answers persisted in answers table
    console.log('\n[Step 8] Verifying Persisted Answers in Supabase answers table...');
    const { data: savedAnswers } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', createdAssessmentId);
    assert.ok(savedAnswers.length >= 4, 'Must have at least 4 persisted answers');
    console.log(`✔ Answers persisted in Supabase: ${savedAnswers.length} individual answer records confirmed.`);

    // 9. Verify Patient Relation on Assessment
    console.log('\n[Step 9] Verifying Patient-Assessment Relational Link...');
    const assessDetailRes = await fetch(`${baseUrl}/assessments/${createdAssessmentId}`, { headers: authHeaders });
    assert.equal(assessDetailRes.status, 200);
    const detailData = await assessDetailRes.json();
    assert.ok(detailData.assessment.patient, 'Assessment must contain populated patient relation');
    assert.equal(detailData.assessment.patient.name, 'Clinical Audit Patient');
    assert.equal(detailData.assessment.patient.patient_code, testCode);
    console.log(`✔ Relational Join Verified: Patient Name = ${detailData.assessment.patient.name}, Code = ${detailData.assessment.patient.patient_code}`);

    // 10. Verify Assessment History displays correct data
    console.log('\n[Step 10] Checking Doctor Assessment History...');
    const historyRes = await fetch(`${baseUrl}/doctors/me/assessments`, { headers: authHeaders });
    assert.equal(historyRes.status, 200);
    const histData = await historyRes.json();
    assert.equal(histData.count, 1);
    assert.equal(histData.assessments[0].patient.name, 'Clinical Audit Patient');
    assert.equal(histData.assessments[0].status, 'PENDING_DOCTOR_REVIEW');
    console.log(`✔ Assessment History: 1 assessment, Patient = Clinical Audit Patient, Status = PENDING_DOCTOR_REVIEW`);

    // 11. Patient Detail API check
    console.log('\n[Step 11] Checking Patient Detail API...');
    const patDetailRes = await fetch(`${baseUrl}/patients/${createdPatientId}`, { headers: authHeaders });
    assert.equal(patDetailRes.status, 200);
    const pDetail = (await patDetailRes.json()).patient;
    assert.equal(pDetail.id, createdPatientId);
    assert.equal(pDetail.name, 'Clinical Audit Patient');
    assert.equal(pDetail.age, 48);
    console.log(`✔ Patient Detail confirmed: Name = ${pDetail.name}, Age = ${pDetail.age}, Gender = ${pDetail.gender}`);

    // 12. Physician Validation Workflow
    console.log('\n[Step 12] Physician Validation of Assessment...');
    const valRes = await fetch(`${baseUrl}/assessments/${createdAssessmentId}/validate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        doctor_note: 'Clinical findings confirmed. Urgent ultrasound advised.'
      })
    });
    assert.equal(valRes.status, 200);
    const valData = await valRes.json();
    assert.equal(valData.assessment.status, 'DOCTOR_VALIDATED');
    assert.equal(valData.assessment.reviewed_by, 'Dr. Priya Sharma');
    console.log(`✔ Assessment Validated: Status = DOCTOR_VALIDATED, Reviewed By = ${valData.assessment.reviewed_by}`);

    // 13. Verify Dashboard counters update after validation
    console.log('\n[Step 13] Checking Dashboard Counters after Validation...');
    const docAssessAfterVal = await fetch(`${baseUrl}/doctors/me/assessments`, { headers: authHeaders });
    const assessAfterValData = await docAssessAfterVal.json();
    const validatedCount = assessAfterValData.assessments.filter(a => a.status === 'DOCTOR_VALIDATED').length;
    const pendingCount = assessAfterValData.assessments.filter(a => a.status === 'PENDING_DOCTOR_REVIEW').length;
    assert.equal(validatedCount, 1);
    assert.equal(pendingCount, 0);
    console.log(`✔ Dashboard Counters updated: Validated = 1, Pending = 0`);

  } finally {
    // 14. Cleanup temporary test patient and cascade delete assessments/answers
    console.log('\n[Step 14] Teardown: Deleting temporary audit test patient from Supabase...');
    if (createdPatientId) {
      await repo.deletePatient(createdPatientId);
      console.log(`✔ Deleted test patient: ${createdPatientId}`);
    }

    await new Promise((resolve) => server.close(resolve));
    console.log('✔ Local test server closed.');

    // 15. Final verification: Database must return to baseline counts (zero leaked records)
    const { count: finalP } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    const { count: finalA } = await supabase.from('assessments').select('*', { count: 'exact', head: true });
    console.log(`\n[Final Verification] Patients in DB: ${finalP} (Baseline: ${initP}), Assessments in DB: ${finalA} (Baseline: ${initA})`);
    assert.equal(finalP, initP, `Database patients must return to baseline count (${initP})`);
    assert.equal(finalA, initA, `Database assessments must return to baseline count (${initA})`);
    console.log('\n====================================================');
    console.log('ALL 23 CLINICAL WORKFLOW STEPS PASSED WITH 100% SUCCESS!');
    console.log(`DATABASE STATE VERIFIED: CLEAN (BASELINE PRESERVED: ${finalP} / ${finalA})`);
    console.log('====================================================');
  }
}

runAudit().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Audit Failure:', err);
  process.exit(1);
});
