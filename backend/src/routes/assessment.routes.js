const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const repo = require('../db/repository');
const realtimeBridge = require('../services/realtimeBridge');
const { calculateClinicalRiskAnalysis } = require('../services/clinicalEngine');

router.use(authenticate);

/**
 * POST /api/assessments
 * Start a new assessment session
 */
router.post('/', async (req, res, next) => {
  try {
    const { patient_id, risk_profile } = req.body;
    if (!patient_id) {
      return res.status(400).json({ error: { message: 'patient_id is required', status: 400 } });
    }

    // Verify patient exists
    const patient = await repo.getPatientById(patient_id);
    if (!patient) {
      return res.status(404).json({ error: { message: 'Patient not found', status: 404 } });
    }

    // Doctor isolation check
    if (req.role === 'DOCTOR') {
      const doctorPatients = await repo.getPatientsForDoctor(req.user.id);
      if (!doctorPatients.some(p => p.id === patient_id)) {
        return res.status(403).json({
          error: { message: 'Forbidden: You cannot start an assessment for this patient.', status: 403 }
        });
      }
    }

    const doctorId = req.role === 'DOCTOR' ? req.user.id : (req.body.doctor_id || req.user.id);

    const assessment = await repo.createAssessment({
      doctor_id: doctorId,
      patient_id,
      risk_profile: risk_profile || {},
      status: 'IN_PROGRESS'
    });

    realtimeBridge.notifyClinicalEvent('ASSESSMENT_CREATED', {
      assessmentId: assessment.id,
      doctorId,
      patientId: patient_id
    });

    res.status(201).json({
      success: true,
      assessment
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/assessments/:id
 * Get assessment details along with answers and clinical risk result
 */
router.get('/:id', async (req, res, next) => {
  try {
    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    // Doctor isolation check
    if (req.role === 'DOCTOR' && assessment.doctor_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'Forbidden: You are not authorized to view this assessment.', status: 403 }
      });
    }

    const answers = await repo.getAnswersForAssessment(assessment.id);

    res.status(200).json({
      success: true,
      assessment: {
        ...assessment,
        answers
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/assessments/:id
 * Update assessment details (e.g. status or intermediate profile)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await repo.getAssessmentById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    if (req.role === 'DOCTOR' && existing.doctor_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    const updated = await repo.updateAssessment(req.params.id, req.body);
    res.status(200).json({ success: true, assessment: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assessments/:id/answers
 * Save an array of answers for an assessment
 */
router.post('/:id/answers', async (req, res, next) => {
  try {
    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    if (req.role === 'DOCTOR' && assessment.doctor_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: { message: 'answers must be a non-empty array', status: 400 } });
    }

    const formattedAnswers = answers.map(a => ({
      ...a,
      assessment_id: req.params.id
    }));

    const saved = await repo.saveAnswers(formattedAnswers);
    res.status(201).json({ success: true, count: saved.length, answers: saved });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/assessments/:id/answers
 * Retrieve answers for an assessment
 */
router.get('/:id/answers', async (req, res, next) => {
  try {
    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    if (req.role === 'DOCTOR' && assessment.doctor_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    const answers = await repo.getAnswersForAssessment(req.params.id);
    res.status(200).json({ success: true, answers });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assessments/:id/submit
 * Final clinical submission:
 * - Computes authoritative clinical risk analysis using the medical engine
 * - Saves all answers to normalized answers table
 * - Updates assessment status to 'COMPLETED' with risk analysis and recommendations
 */
router.post('/:id/submit', async (req, res, next) => {
  try {
    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    if (req.role === 'DOCTOR' && assessment.doctor_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    const { risk_profile = {}, answers_map = {}, answers_list = [] } = req.body;

    // 1. Authoritative Clinical Calculation
    const clinicalResult = calculateClinicalRiskAnalysis(risk_profile, answers_map);

    // 2. Persist answers if provided as list
    if (Array.isArray(answers_list) && answers_list.length > 0) {
      const recordsToSave = answers_list.map(ans => ({
        assessment_id: req.params.id,
        question_id: ans.question_id || null,
        question: ans.question || 'Clinical symptom question',
        answer: ans.answer,
        answer_type: ans.answer_type || 'BOOLEAN',
        answered_at: ans.answered_at || new Date().toISOString()
      }));
      await repo.saveAnswers(recordsToSave);
    } else if (Object.keys(answers_map).length > 0) {
      // Map dictionary to records
      const recordsToSave = Object.entries(answers_map).map(([qName, qVal]) => ({
        assessment_id: req.params.id,
        question: qName,
        answer: qVal,
        answer_type: 'BOOLEAN',
        answered_at: new Date().toISOString()
      }));
      await repo.saveAnswers(recordsToSave);
    }

    // 3. Mark assessment as PENDING_DOCTOR_REVIEW with results
    const updatedAssessment = await repo.updateAssessment(req.params.id, {
      status: 'PENDING_DOCTOR_REVIEW',
      risk_profile,
      risk_analysis: clinicalResult,
      completed_at: new Date().toISOString()
    });

    realtimeBridge.notifyClinicalEvent('ASSESSMENT_SUBMITTED', {
      assessmentId: updatedAssessment.id,
      doctorId: assessment.doctor_id,
      status: 'PENDING_DOCTOR_REVIEW'
    });

    res.status(200).json({
      success: true,
      message: 'Assessment completed and submitted for doctor review.',
      assessment: updatedAssessment,
      clinical_result: clinicalResult
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assessments/:id/validate
 * Doctor formal clinical validation:
 * - Requires DOCTOR role (Admin cannot validate)
 * - Requires assessment ownership (Doctor A cannot validate Doctor B's assessment)
 * - Enforces valid state transitions (cannot validate IN_PROGRESS or already DOCTOR_VALIDATED)
 * - Sets status to DOCTOR_VALIDATED, reviewed_by, reviewed_at, and optional doctor_note
 */
router.post('/:id/validate', async (req, res, next) => {
  try {
    if (req.role !== 'DOCTOR') {
      return res.status(403).json({
        error: { message: 'Forbidden: Only doctors can validate clinical assessments. Admin cannot validate.', status: 403 }
      });
    }

    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    if (assessment.doctor_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'Forbidden: You are not authorized to validate this assessment.', status: 403 }
      });
    }

    if (assessment.status === 'IN_PROGRESS') {
      return res.status(400).json({
        error: { message: 'Invalid state transition: Cannot validate an assessment in IN_PROGRESS state.', status: 400 }
      });
    }

    if (assessment.status === 'DOCTOR_VALIDATED') {
      return res.status(400).json({
        error: { message: 'Invalid state transition: Assessment has already been validated.', status: 400 }
      });
    }

    const doctorName = req.user.name || req.user.email || 'Assigned Physician';
    const doctorNote = req.body.doctor_note !== undefined
      ? (req.body.doctor_note ? String(req.body.doctor_note).trim() : null)
      : (assessment.doctor_note || null);

    const updated = await repo.updateAssessment(req.params.id, {
      status: 'DOCTOR_VALIDATED',
      reviewed_by: doctorName,
      reviewed_at: new Date().toISOString(),
      doctor_note: doctorNote
    });

    realtimeBridge.notifyClinicalEvent('ASSESSMENT_VALIDATED', {
      assessmentId: updated.id,
      doctorId: assessment.doctor_id,
      status: 'DOCTOR_VALIDATED'
    });

    res.status(200).json({
      success: true,
      message: 'Assessment validated successfully.',
      assessment: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assessments/:id/reassessment
 * Doctor requests re-assessment:
 * - Requires DOCTOR role
 * - Requires ownership
 * - Requires non-empty reassessment reason
 * - Enforces valid state transitions (cannot request reassessment if IN_PROGRESS)
 * - Sets status to REASSESSMENT_REQUESTED, reviewed_by, reviewed_at, and reassessment_reason
 */
router.post('/:id/reassessment', async (req, res, next) => {
  try {
    if (req.role !== 'DOCTOR') {
      return res.status(403).json({
        error: { message: 'Forbidden: Only doctors can request reassessment.', status: 403 }
      });
    }

    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    if (assessment.doctor_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'Forbidden: You are not authorized to request reassessment for this patient.', status: 403 }
      });
    }

    if (assessment.status === 'IN_PROGRESS') {
      return res.status(400).json({
        error: { message: 'Invalid state transition: Cannot request reassessment for an assessment in IN_PROGRESS state.', status: 400 }
      });
    }

    const { reason, doctor_note } = req.body;
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        error: { message: 'Reassessment reason is required.', status: 400 }
      });
    }

    const doctorName = req.user.name || req.user.email || 'Assigned Physician';
    const doctorNote = doctor_note !== undefined
      ? (doctor_note ? String(doctor_note).trim() : null)
      : (assessment.doctor_note || null);

    const updated = await repo.updateAssessment(req.params.id, {
      status: 'REASSESSMENT_REQUESTED',
      reviewed_by: doctorName,
      reviewed_at: new Date().toISOString(),
      reassessment_reason: reason.trim(),
      doctor_note: doctorNote
    });

    realtimeBridge.notifyClinicalEvent('ASSESSMENT_REASSESSMENT', {
      assessmentId: updated.id,
      doctorId: assessment.doctor_id,
      status: 'REASSESSMENT_REQUESTED'
    });

    res.status(200).json({
      success: true,
      message: 'Reassessment requested successfully.',
      assessment: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assessments/:id/review-note
 * Save or update intermediate physician review note
 */
router.post('/:id/review-note', async (req, res, next) => {
  try {
    if (req.role !== 'DOCTOR') {
      return res.status(403).json({
        error: { message: 'Forbidden: Only doctors can save clinical review notes.', status: 403 }
      });
    }

    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found', status: 404 } });
    }

    if (assessment.doctor_id !== req.user.id) {
      return res.status(403).json({
        error: { message: 'Forbidden: You are not authorized to update notes on this assessment.', status: 403 }
      });
    }

    const { note } = req.body;
    if (note === undefined || typeof note !== 'string') {
      return res.status(400).json({
        error: { message: 'note string is required.', status: 400 }
      });
    }

    const updated = await repo.updateAssessment(req.params.id, {
      doctor_note: note.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Doctor note updated successfully.',
      assessment: updated
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
