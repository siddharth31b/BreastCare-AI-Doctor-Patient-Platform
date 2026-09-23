const express = require('express');
const router = express.Router();
const multer = require('multer');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const repo = require('../db/repository');

// Configure Multer for in-memory handling before uploading to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are permitted for patient face photos.'));
    }
  }
});

// Zod schema for patient validation
const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.coerce.number().int().min(1).max(125, 'Age must be between 1 and 125'),
  gender: z.string().default('Female'),
  phone: z.string().optional().nullable(),
  patient_code: z.string().optional()
});

router.use(authenticate);

/**
 * POST /api/patients
 * Register a new patient
 */
router.post('/', async (req, res, next) => {
  try {
    const parseResult = patientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: parseResult.error.errors,
          status: 400
        }
      });
    }

    const doctorId = req.role === 'DOCTOR' ? req.user.id : null;
    const patient = await repo.createPatient(parseResult.data, doctorId);

    res.status(201).json({
      success: true,
      patient
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/patients/:id
 * Get patient details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await repo.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: { message: 'Patient not found', status: 404 } });
    }

    // Role check: If DOCTOR, verify this doctor is authorized for this patient
    if (req.role === 'DOCTOR') {
      const doctorPatients = await repo.getPatientsForDoctor(req.user.id);
      const isAuthorized = doctorPatients.some(p => p.id === patient.id);
      if (!isAuthorized) {
        return res.status(403).json({
          error: { message: 'Forbidden: You are not authorized to view this patient.', status: 403 }
        });
      }
    }

    res.status(200).json({ success: true, patient });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/patients/:id
 * Update patient record
 */
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await repo.getPatientById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Patient not found', status: 404 } });
    }

    if (req.role === 'DOCTOR') {
      const doctorPatients = await repo.getPatientsForDoctor(req.user.id);
      if (!doctorPatients.some(p => p.id === req.params.id)) {
        return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
      }
    }

    const updated = await repo.updatePatient(req.params.id, req.body);
    res.status(200).json({ success: true, patient: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/patients/:id/photo
 * Upload captured patient face photo to Supabase Storage
 */
router.post('/:id/photo', upload.single('photo'), async (req, res, next) => {
  try {
    const patient = await repo.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: { message: 'Patient not found', status: 404 } });
    }

    if (req.role === 'DOCTOR') {
      const doctorPatients = await repo.getPatientsForDoctor(req.user.id);
      if (!doctorPatients.some(p => p.id === req.params.id)) {
        return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
      }
    }

    let fileBuffer;
    let fileName = `face_${Date.now()}.jpg`;
    let mimeType = 'image/jpeg';

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname || fileName;
      mimeType = req.file.mimetype || mimeType;
    } else if (req.body && req.body.photo_base64) {
      // Support base64 image data payload from React Native Expo Camera
      const base64Clean = req.body.photo_base64.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(base64Clean, 'base64');
    } else {
      return res.status(400).json({
        error: { message: 'No photo provided. Expected multipart file "photo" or "photo_base64" string.', status: 400 }
      });
    }

    // Save to storage
    const photoUrl = await repo.savePatientPhoto(req.params.id, fileBuffer, fileName, mimeType);

    // Update patient record
    const updatedPatient = await repo.updatePatient(req.params.id, {
      face_photo_url: photoUrl
    });

    res.status(200).json({
      success: true,
      message: 'Patient face photo uploaded successfully.',
      face_photo_url: photoUrl,
      patient: updatedPatient
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
