-- ====================================================================
-- BreastCare AI Healthcare Assessment Platform - Supabase PostgreSQL Schema
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    tablet_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(50) NOT NULL DEFAULT 'Female',
    phone VARCHAR(50),
    face_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(100) PRIMARY KEY,
    phase INTEGER NOT NULL,
    category VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    sequence INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    risk_profile JSONB DEFAULT '{}'::jsonb,
    risk_analysis JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    doctor_note TEXT,
    reassessment_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent schema migration for review workflow
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS doctor_note TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS reassessment_reason TEXT;

-- 6. ANSWERS TABLE
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id VARCHAR(100),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    answer_type VARCHAR(50) NOT NULL DEFAULT 'BOOLEAN',
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DOCTOR_PATIENT RELATIONSHIP TABLE
CREATE TABLE IF NOT EXISTS doctor_patient (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(doctor_id, patient_id)
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE AND ISOLATION
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_doctors_firebase_uid ON doctors(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_admins_firebase_uid ON admins(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_questions_phase ON questions(phase, sequence);
CREATE INDEX IF NOT EXISTS idx_assessments_doctor ON assessments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_assessments_patient ON assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_answers_assessment ON answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_pair ON doctor_patient(doctor_id, patient_id);

-- ====================================================================
-- SUPABASE STORAGE CONFIGURATION
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-photos', 'patient-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies on Storage
CREATE POLICY "Authenticated backend access to patient photos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'patient-photos');
