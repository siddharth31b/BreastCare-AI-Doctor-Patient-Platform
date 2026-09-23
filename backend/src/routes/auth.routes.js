const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/session
 * Establish session from Firebase ID token and return resolved user & role
 */
router.post('/session', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
    role: req.role,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
    role: req.role
  });
});

module.exports = router;
