const supabase = require('../config/supabase');

async function analyzeAssessments() {
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, doctor_id, patient_id, status, started_at, completed_at, risk_analysis');

  console.log('Total assessments:', assessments.length);
  const byDoctor = {};
  assessments.forEach(a => {
    byDoctor[a.doctor_id] = (byDoctor[a.doctor_id] || 0) + 1;
  });
  console.log('Assessments by doctor:', byDoctor);

  // Check how many have valid patients in patients table
  const { data: patients } = await supabase.from('patients').select('id, name');
  const patientIds = new Set((patients || []).map(p => p.id));
  console.log('Real patient count:', patientIds.size);

  const orphaned = assessments.filter(a => !patientIds.has(a.patient_id));
  console.log('Orphaned assessments (referencing non-existent patients):', orphaned.length);
}

analyzeAssessments().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
