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
    product: 'NariSetu Backend',
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
app.use('/api/tts', require('./routes/tts.routes'));
try {
  app.use('/api/realtime', require('./routes/realtime.routes'));
} catch (e) {
  // Realtime module not mounted in standalone deployment
}

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);

  // Handle PostgreSQL unique constraint violations (code 23505) gracefully as 409 Conflict
  if (err.code === '23505' || err.message?.includes('duplicate key value violates unique constraint')) {
    return res.status(409).json({
      error: {
        message: 'A clinical record with this code already exists. Please use a unique identifier.',
        code: 'DUPLICATE_RESOURCE',
        status: 409,
      },
    });
  }

  // Handle PostgreSQL foreign key violations (code 23503)
  if (err.code === '23503') {
    return res.status(400).json({
      error: {
        message: 'Referenced clinical record (doctor or patient) does not exist.',
        code: 'FOREIGN_KEY_VIOLATION',
        status: 400,
      },
    });
  }

  // Handle PostgreSQL not null violations (code 23502)
  if (err.code === '23502') {
    return res.status(400).json({
      error: {
        message: 'A required clinical database field is missing.',
        code: 'NOT_NULL_VIOLATION',
        status: 400,
      },
    });
  }

  // Handle PostgreSQL invalid input syntax/UUID (code 22P02)
  if (err.code === '22P02') {
    return res.status(400).json({
      error: {
        message: 'Invalid identifier format (expected standard UUID).',
        code: 'INVALID_SYNTAX',
        status: 400,
      },
    });
  }

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
    console.log(`[NariSetu Backend] Server listening on http://localhost:${PORT}`);
    console.log(`[NariSetu Backend] Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
