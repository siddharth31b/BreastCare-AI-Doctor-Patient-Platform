const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const realtimeBridge = require('../services/realtimeBridge');

/**
 * GET /api/realtime/stream
 * Server-Sent Events (SSE) stream for authentic cross-device clinical updates.
 * Authenticated via Firebase ID token (via Authorization Bearer or ?token=).
 * Enforces role isolation: DOCTOR clients only receive events for their patients/assessments.
 */
router.get('/stream', authenticate, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  // Flush headers immediately
  if (res.flushHeaders) {
    res.flushHeaders();
  }

  const clientId = crypto.randomUUID();
  const clientInfo = {
    id: clientId,
    userId: req.user.id,
    role: req.role,
    res,
    req,
  };

  realtimeBridge.addClient(clientInfo);

  // Send initial handshake event
  res.write(`data: ${JSON.stringify({
    type: 'CONNECTED',
    role: req.role,
    userId: req.user.id,
    timestamp: new Date().toISOString(),
  })}\n\n`);
});

/**
 * GET /api/realtime/status
 * Health status of the cross-device realtime bridge
 */
router.get('/status', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    activeConnections: realtimeBridge.clients.size,
    hasSupabaseChannel: !!realtimeBridge.channel,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
