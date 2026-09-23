const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const repo = require('../db/repository');

// Protect all admin routes strictly with ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/doctors
 * List all doctors and their active tablet stations
 */
router.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await repo.getAllDoctors();
    res.status(200).json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/patients
 * List all patients across all doctors
 */
router.get('/patients', async (req, res, next) => {
  try {
    const patients = await repo.getAllPatients();
    res.status(200).json({ success: true, count: patients.length, patients });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/assessments
 * List all assessments with optional filtering by doctor_id, status, or risk tier
 */
router.get('/assessments', async (req, res, next) => {
  try {
    const { doctor_id, status, tier } = req.query;
    let assessments = await repo.getAllAssessments();

    if (doctor_id) {
      assessments = assessments.filter(a => a.doctor_id === doctor_id);
    }
    if (status) {
      assessments = assessments.filter(a => a.status.toLowerCase() === status.toLowerCase());
    }
    if (tier) {
      assessments = assessments.filter(a =>
        a.risk_analysis && a.risk_analysis.tier && a.risk_analysis.tier.toLowerCase() === tier.toLowerCase()
      );
    }

    res.status(200).json({ success: true, count: assessments.length, assessments });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/analytics
 * High-level healthcare analytics summary
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const doctors = await repo.getAllDoctors();
    const patients = await repo.getAllPatients();
    const assessments = await repo.getAllAssessments();

    const completed = assessments.filter(a => ['COMPLETED', 'DOCTOR_VALIDATED', 'PENDING_DOCTOR_REVIEW', 'REASSESSMENT_REQUESTED'].includes(a.status));
    const inProgress = assessments.filter(a => a.status === 'IN_PROGRESS');

    const tierBreakdown = {
      Low: 0,
      Moderate: 0,
      High: 0,
      Urgent: 0
    };

    completed.forEach(a => {
      const tier = a.risk_analysis && a.risk_analysis.tier;
      if (tier && tierBreakdown[tier] !== undefined) {
        tierBreakdown[tier]++;
      }
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalDoctors: doctors.length,
        totalPatients: patients.length,
        totalAssessments: assessments.length,
        completedAssessments: completed.length,
        pendingAssessments: inProgress.length,
        tierBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
