-- ====================================================================
-- BreastCare AI Healthcare Platform - Controlled Demo Data Cleanup
-- Target: Safely purge prototype/test patient records and associated data
-- Preserves: doctors, admins, questions, schemas, indexes, and storage configs
-- ====================================================================

BEGIN;

-- 1. Identify and delete demo/test patients by known test names and codes
-- Cascading foreign keys automatically delete matching rows in:
-- - assessments
-- - answers
-- - doctor_patient
DELETE FROM patients
WHERE name IN (
    'Ananya Sharma',
    'Meena Kumari',
    'Patient of Doctor A',
    'Patient of Doctor B',
    'Lakshmi Bai',
    'Kavita Roy',
    'Prachi Manikpuri',
    'sss',
    'riya',
    'aaaaaaaaaaaaaaaa',
    'Shivani',
    'Ansuli',
    'Tanu',
    'Ranu',
    'Suchi',
    'Crfc'
)
OR patient_code LIKE 'PT-TRIAGE-%'
OR patient_code LIKE 'PT-VAL-%'
OR patient_code LIKE 'PT-DEMO-%'
OR name ILIKE '%demo%'
OR name ILIKE '%test%';

-- 2. Safely remove any orphaned assessments not linked to existing patients
DELETE FROM assessments
WHERE patient_id NOT IN (SELECT id FROM patients);

-- 3. Safely remove any orphaned answers not linked to existing assessments
DELETE FROM answers
WHERE assessment_id NOT IN (SELECT id FROM assessments);

-- 4. Safely remove any orphaned doctor_patient links
DELETE FROM doctor_patient
WHERE patient_id NOT IN (SELECT id FROM patients);

COMMIT;
