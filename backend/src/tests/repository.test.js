const test = require('node:test');
const assert = require('node:assert/strict');
const repo = require('../db/repository');

test('Repository - Doctors retrieval and creation', async () => {
  const doctors = await repo.getAllDoctors();
  assert.ok(Array.isArray(doctors));
  assert.ok(doctors.length >= 1);

  const doc = await repo.findDoctorByFirebaseUid('doc_demo_firebase_uid_1');
  assert.ok(doc);
  assert.equal(doc.email, 'doctor@breastcare.ai');
});

test('Repository - Questions retrieval from seed', async () => {
  const allQuestions = await repo.getAllQuestions();
  assert.ok(allQuestions.length > 0);

  const phase1 = await repo.getQuestionsByPhase(1);
  assert.ok(phase1.length > 0);
  assert.equal(phase1[0].phase, 1);
});

test('Repository - Patient creation, relationship, and assessment flow', async () => {
  const doctor = (await repo.getAllDoctors())[0];
  const newPatient = await repo.createPatient({
    name: 'Test Patient Gamma',
    age: 42,
    gender: 'Female',
    phone: '+91 99887 76655'
  }, doctor.id);

  assert.ok(newPatient.id);
  assert.equal(newPatient.name, 'Test Patient Gamma');

  // Verify doctor-patient isolation
  const doctorPatients = await repo.getPatientsForDoctor(doctor.id);
  assert.ok(doctorPatients.some(p => p.id === newPatient.id));

  // Create Assessment
  const assessment = await repo.createAssessment({
    doctor_id: doctor.id,
    patient_id: newPatient.id,
    status: 'IN_PROGRESS'
  });
  assert.ok(assessment.id);
  assert.equal(assessment.status, 'IN_PROGRESS');

  // Save Answers
  await repo.saveAnswers([
    {
      assessment_id: assessment.id,
      question_id: 'brm_age',
      question: 'What is the patient\'s age?',
      answer: '40-49',
      answer_type: 'SINGLE_CHOICE'
    }
  ]);

  const answers = await repo.getAnswersForAssessment(assessment.id);
  assert.equal(answers.length, 1);
  assert.equal(answers[0].answer, '40-49');

  // Complete Assessment
  const updated = await repo.updateAssessment(assessment.id, {
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
    risk_analysis: { tier: 'Low', totalScore: 2 }
  });
  assert.equal(updated.status, 'COMPLETED');

  // Teardown test patient and cascaded data
  await repo.deletePatient(newPatient.id);
});
