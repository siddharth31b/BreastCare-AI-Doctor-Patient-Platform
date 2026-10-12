const supabase = require('../config/supabase');

async function inspectPatients() {
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, name, patient_code, created_at');

  if (error) {
    console.error('Error fetching patients:', error);
    return;
  }

  console.log('Total patients in DB:', patients.length);
  const nameCounts = {};
  patients.forEach(p => {
    nameCounts[p.name] = (nameCounts[p.name] || 0) + 1;
  });
  console.log('Patient name distribution:', nameCounts);

  const { data: docPatients } = await supabase
    .from('doctor_patient')
    .select('doctor_id, patient_id');
  console.log('Total doctor_patient links:', docPatients?.length);
  const byDoc = {};
  (docPatients || []).forEach(dp => {
    byDoc[dp.doctor_id] = (byDoc[dp.doctor_id] || 0) + 1;
  });
  console.log('doctor_patient counts by doctor ID:', byDoc);
}

inspectPatients().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
