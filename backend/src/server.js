require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'BreastCare AI Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    languageProvider: process.env.LANGUAGE_PROVIDER || 'demo',
  });
});

// Mount API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/language', require('./routes/language.routes'));

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
    },
  });
});

// Start server only when executed directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BreastCare Backend] Server listening on http://localhost:${PORT}`);
    console.log(`[BreastCare Backend] Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
