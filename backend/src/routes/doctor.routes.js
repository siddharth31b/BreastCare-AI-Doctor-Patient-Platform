const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const repo = require('../db/repository');

// Protect all doctor routes
router.use(authenticate);
router.use(requireRole('DOCTOR'));

/**
 * GET /api/doctors/me
 * Get current doctor profile
 */
router.get('/me', async (req, res, next) => {
  try {
    const doctor = await repo.findDoctorById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ error: { message: 'Doctor record not found', status: 404 } });
    }
    res.status(200).json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/doctors/me/patients
 * Strictly isolated: Get only patients registered under this doctor
 */
router.get('/me/patients', async (req, res, next) => {
  try {
    const patients = await repo.getPatientsForDoctor(req.user.id);
    res.status(200).json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/doctors/me/assessments
 * Strictly isolated: Get only assessments initiated by this doctor
 */
router.get('/me/assessments', async (req, res, next) => {
  try {
    const assessments = await repo.getAssessmentsForDoctor(req.user.id);
    res.status(200).json({
      success: true,
      count: assessments.length,
      assessments
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
